const $ = (id) => document.getElementById(id);

let currentStoryboard = null;


/* =========================================================
   EXAMPLE SCRIPT BUTTONS
   ========================================================= */

document.querySelectorAll(".chips button").forEach((btn) => {
  btn.addEventListener("click", () => {
    $("idea").value = btn.dataset.example || "";
    $("idea").focus();
  });
});


/* =========================================================
   CREATE STORYBOARD
   ========================================================= */

$("createBtn").addEventListener("click", async () => {

  const script = $("idea").value.trim();

  if (!script) {
    $("status").textContent =
      "Please paste your scene-by-scene script first.";

    $("idea").focus();
    return;
  }

  $("createBtn").disabled = true;

  $("status").textContent =
    "Reading your script and creating your scenes…";

  try {

    const response = await fetch("/api/storyboard", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        idea: script,

        style:
          $("style")?.value ||
          "3D Cartoon",

        audience:
          $("audience")?.value ||
          "Kids",

        length:
          $("length")?.value ||
          "Auto — based on script",

        ratio:
          $("ratio")?.value ||
          "16:9 — YouTube",

        voice:
          $("voice")?.value ||
          "Warm Female",

        music:
          $("music")?.value ||
          "Playful"

      })

    });


    const data = await response.json();


    if (!response.ok) {
      throw new Error(
        data.error ||
        "Could not create storyboard."
      );
    }


    /* Save storyboard for Generate Video */

    currentStoryboard = data;


    /* =====================================================
       PROJECT INFORMATION
       ===================================================== */

    $("projectTitle").textContent =
      data.title ||
      "Your Video Project";


    $("projectMeta").innerHTML = `

      <span class="meta">
        ${escapeHtml(data.style || "")}
      </span>

      <span class="meta">
        ${escapeHtml(data.audience || "")}
      </span>

      <span class="meta">
        ${escapeHtml(data.length || "")}
      </span>

      <span class="meta">
        ${escapeHtml($("ratio")?.value || "")}
      </span>

      <span class="meta">
        ${escapeHtml(
          data.voice ||
          $("voice")?.value ||
          ""
        )}
      </span>

      <span class="meta">
        ${escapeHtml(
          data.music ||
          $("music")?.value ||
          ""
        )} music
      </span>

      <span class="meta">
        ${
          data.scriptMode === "script"
            ? `${data.scenes.length} scripted scenes`
            : "Idea storyboard"
        }
      </span>

    `;


    /* =====================================================
       DISPLAY SCENES
       ===================================================== */

    $("scenes").innerHTML =
      data.scenes.map((scene) => {

        return `

          <article
            class="scene"
            id="scene-${scene.number}"
          >

            <div class="scene-head">

              <div>

                <div class="scene-num">
                  SCENE ${escapeHtml(scene.number)}
                </div>

                <h3>
                  ${escapeHtml(scene.title)}
                </h3>

              </div>

              <div class="duration">
                ${escapeHtml(scene.duration)}
              </div>

            </div>


            <div class="scene-grid">


              <!-- VISUAL -->

              <div class="scene-box">

                <strong>VISUAL</strong>

                <p>
                  ${escapeHtml(scene.visual)}
                </p>

              </div>


              <!-- DIALOGUE -->

              <div class="scene-box">

                <strong>DIALOGUE / ACTION</strong>

                <p>
                  ${escapeHtml(scene.dialogue)}
                </p>

              </div>


              <!-- AUDIO -->

              <div class="scene-box">

                <strong>AUDIO</strong>

                <p>
                  ${escapeHtml(scene.audio)}
                </p>

              </div>


              <!-- VIDEO PROMPT -->

              <div class="scene-box">

                <strong>VIDEO PROMPT</strong>

                <p>
                  ${escapeHtml(scene.videoPrompt)}
                </p>

              </div>


            </div>


            <!-- INDIVIDUAL VIDEO BUTTON -->

            <div class="scene-actions">

              <button
                class="scene-video-btn"
                onclick="generateSingleScene(${scene.number})"
              >
                🎬 Generate Scene ${scene.number}
              </button>

              <div
                id="video-result-${scene.number}"
                class="video-result"
              ></div>

            </div>


          </article>

        `;

      }).join("");


    /* =====================================================
       SHOW RESULTS
       ===================================================== */

    $("results").classList.remove("hidden");


    $("status").textContent =
      data.scriptMode === "script"

        ? `Done! ${data.scenes.length} scenes were created from your script.`

        : "Storyboard created.";


    $("results").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


  } catch (error) {

    console.error(error);

    $("status").textContent =
      error.message ||
      "Something went wrong.";

  } finally {

    $("createBtn").disabled = false;

  }

});


/* =========================================================
   GENERATE ALL VIDEOS
   ========================================================= */

$("videoBtn").addEventListener("click", async () => {

  if (
    !currentStoryboard ||
    !currentStoryboard.scenes ||
    !currentStoryboard.scenes.length
  ) {

    $("videoStatus").classList.remove("hidden");

    $("videoStatus").textContent =
      "Create your storyboard first.";

    return;
  }


  const box =
    $("videoStatus");

  box.classList.remove("hidden");

  box.textContent =
    `Starting video generation for ${currentStoryboard.scenes.length} scenes…`;


  /*
   * Generate scenes one at a time.
   * This prevents multiple large AI requests
   * from being sent at once.
   */

  for (
    let i = 0;
    i < currentStoryboard.scenes.length;
    i++
  ) {

    const scene =
      currentStoryboard.scenes[i];


    box.textContent =
      `Generating Scene ${scene.number} of ${currentStoryboard.scenes.length}…`;


    await generateScene(scene);

  }


  box.textContent =
    "🎉 All available scenes have finished generating.";

});


/* =========================================================
   GENERATE ONE SCENE
   ========================================================= */

async function generateSingleScene(sceneNumber) {

  if (!currentStoryboard) {

    return;

  }


  const scene =
    currentStoryboard.scenes.find(
      (item) =>
        Number(item.number) ===
        Number(sceneNumber)
    );


  if (!scene) {

    return;

  }


  await generateScene(scene);

}


/* =========================================================
   ACTUAL VIDEO REQUEST
   ========================================================= */

async function generateScene(scene) {

  const result =
    $(`video-result-${scene.number}`);


  if (!result) {
    return;
  }


  result.innerHTML = `

    <div class="video-loading">

      🎬 Generating Scene ${scene.number}…

      <br>

      <small>
        AI video generation can take a little while.
      </small>

    </div>

  `;


  try {

    const response =
      await fetch(
        "/api/generate-video",
        {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            sceneNumber:
              scene.number,

            title:
              scene.title,

            prompt:
              scene.videoPrompt,

            visual:
              scene.visual,

            dialogue:
              scene.dialogue,

            audio:
              scene.audio,

            duration:
              scene.duration,

            ratio:
              $("ratio")?.value ||
              "16:9 — YouTube"

          })

        }
      );


    /*
     * The server returns MP4 directly
     * when generation succeeds.
     */

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    if (!response.ok) {

      let errorMessage =
        "Video generation failed.";

      if (
        contentType.includes(
          "application/json"
        )
      ) {

        const errorData =
          await response.json();

        errorMessage =
          errorData.message ||
          errorData.error ||
          errorMessage;

      } else {

        const text =
          await response.text();

        if (text) {
          errorMessage = text;
        }

      }

      throw new Error(
        errorMessage
      );

    }


    /*
     * Make sure we actually received
     * a video.
     */

    if (
      !contentType.includes(
        "video"
      )
    ) {

      throw new Error(
        "The server did not return a video file."
      );

    }


    const blob =
      await response.blob();


    const videoUrl =
      URL.createObjectURL(
        blob
      );


    /*
     * Display video.
     */

    result.innerHTML = `

      <div class="generated-video">

        <video
          controls
          playsinline
          preload="metadata"
        >
          <source
            src="${videoUrl}"
            type="video/mp4"
          >
        </video>


        <div class="video-complete">

          ✅ Scene ${scene.number} generated

        </div>

      </div>

    `;


  } catch (error) {

    console.error(
      `Scene ${scene.number} error:`,
      error
    );


    result.innerHTML = `

      <div class="video-error">

        ❌ Scene ${scene.number} could not be generated.

        <br><br>

        <small>
          ${escapeHtml(
            error.message ||
            "Unknown error"
          )}
        </small>

      </div>

      <button
        class="scene-video-btn"
        onclick="generateSingleScene(${scene.number})"
      >
        🔄 Try Again
      </button>

    `;

  }

}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    (character) => {

      const characters = {

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#039;"

      };

      return characters[
        character
      ];

    }
  );

}
