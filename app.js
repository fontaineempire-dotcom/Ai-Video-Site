const $ = (id) => document.getElementById(id);

// Sample scripts

document.querySelectorAll(".chips button").forEach(btn => {
  btn.addEventListener("click", () => {
    $("idea").value = btn.dataset.example;
    $("idea").focus();
  });
});

$("createBtn").addEventListener("click", async () => {
  const idea = $("idea").value.trim();
  if (!idea) {
    $("status").textContent = "Paste your scene-by-scene script first.";
    $("idea").focus();
    return;
  }

  $("createBtn").disabled = true;
  $("status").textContent = "Turning your script into production-ready scenes…";

  try {
    const response = await fetch("/api/storyboard", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        idea,
        style: $("style").value,
        audience: $("audience").value,
        length: $("length").value,
        ratio: $("ratio").value,
        voice: $("voice").value,
        music: $("music").value
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong.");

    $("projectTitle").textContent = data.title;
    $("projectMeta").innerHTML = `
      <span class="meta">${escapeHtml(data.style)}</span>
      <span class="meta">${escapeHtml(data.audience)}</span>
      <span class="meta">${escapeHtml(data.length)}</span>
      <span class="meta">${escapeHtml($("ratio").value)}</span>
      <span class="meta">${escapeHtml($("voice").value)}</span>
      <span class="meta">${escapeHtml($("music").value)} music</span>
      <span class="meta">${data.scriptMode === "script" ? `${data.scenes.length} scripted scenes` : "Idea storyboard"}</span>
    `;

    $("scenes").innerHTML = data.scenes.map(scene => `
      <article class="scene">
        <div class="scene-head">
          <div>
            <div class="scene-num">SCENE ${scene.number}</div>
            <h3>${escapeHtml(scene.title)}</h3>
          </div>
          <div class="duration">${escapeHtml(scene.duration)}</div>
        </div>
        <div class="scene-grid">
          <div class="scene-box">
            <strong>VISUAL</strong>
            <p>${escapeHtml(scene.visual)}</p>
          </div>
          <div class="scene-box">
            <strong>DIALOGUE / ACTION</strong>
            <p>${escapeHtml(scene.dialogue)}</p>
          </div>
          <div class="scene-box">
            <strong>AUDIO</strong>
            <p>${escapeHtml(scene.audio)}</p>
          </div>
          <div class="scene-box">
            <strong>VIDEO PROMPT</strong>
            <p>${escapeHtml(scene.videoPrompt)}</p>
          </div>
        </div>
      </article>
    `).join("");

    $("results").classList.remove("hidden");
    $("status").textContent = data.scriptMode === "script"
      ? `Done — ${data.scenes.length} scenes created from your script.`
      : "Storyboard created.";
    $("results").scrollIntoView({behavior:"smooth", block:"start"});
  } catch (err) {
    $("status").textContent = err.message;
  } finally {
    $("createBtn").disabled = false;
  }
});

$("videoBtn").addEventListener("click", async () => {
  const box = $("videoStatus");
  box.classList.remove("hidden");
  box.textContent = "Your scenes are ready. The next connection is a real AI video-generation API, which will turn each scene prompt into video clips.";
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[char]));
}
