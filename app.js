const $ = (id) => document.getElementById(id);

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

        // The entire script the user typed
        idea: script,

        // Settings selected by the user
        style: $("style")?.value || "3D Cartoon",

        audience: $("audience")?.value || "Kids",

        length: $("length")?.value || "Auto — based on script",

        ratio: $("ratio")?.value || "16:9 — YouTube",

        voice: $("voice")?.value || "Warm Female",

        music: $("music")?.value || "Playful"

      })
    });


    const data = await response.json();


    if (!response.ok) {
      throw new Error(
        data.error || "Could not create the storyboard."
      );
    }


    /* =====================================================
       PROJECT INFORMATION
       ===================================================== */

    $("projectTitle").textContent =
      data.title || "Your Video Project";


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
        ${escapeHtml(data.voice || $("voice")?.value || "")}
      </span>

      <span class="meta">
        ${escapeHtml(data.music || $("music")?.value || "")} music
      </span>

      <span class="meta">
        ${data.scriptMode === "script"
          ? `${data.scenes.length} scripted scenes`
          : "Idea storyboard"}
      </span>

    `;


    /* =====================================================
       CREATE THE SCENES
       ===================================================== */

    $("scenes").innerHTML = data.scenes.map((scene) => {

      return `

        <article class="scene">

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


            <!-- DIALOGUE / ACTION -->

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

        </article>

      `;

    }).join("");


    /* =====================================================
       SHOW RESULTS
       ===================================================== */

    $("results").classList.remove("hidden");


    if (data.scriptMode === "script") {

      $("status").textContent =
        `Done! Your ${data.scenes.length} scenes were created directly from your script.`;

    } else {

      $("status").textContent =
        "Storyboard created.";

    }


    /* Scroll to the generated storyboard */

    $("results").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


  } catch (error) {

    console.error(error);

    $("status").textContent =
      error.message ||
      "Something went wrong while creating your scenes.";

  } finally {

    $("createBtn").disabled = false;

  }

});


/* =========================================================
   GENERATE VIDEO BUTTON
   ========================================================= */

$("videoBtn").addEventListener("click", async () => {

  const box = $("videoStatus");

  box.classList.remove("hidden");

  box.textContent =
    "Preparing your scenes for AI video generation…";


  try {

    const response = await fetch("/api/generate-video", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        message: "Generate videos from the storyboard."

      })

    });


    const data = await response.json();


    if (!response.ok) {
      throw new Error(
        data.error || "Video generation is not connected yet."
      );
    }


    box.textContent =
      data.message ||
      "Your video generation request has been submitted.";

  } catch (error) {

    /*
      At this stage your server still returns a message
      saying the real video-generation API needs to be
      connected.
    */

    box.textContent =
      error.message ||
      "The storyboard is ready, but video generation is not connected yet.";

  }

});


/* =========================================================
   SAFE HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,

    (character) => {

      const characters = {

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#039;"

      };

      return characters[character];

    }
  );

}
