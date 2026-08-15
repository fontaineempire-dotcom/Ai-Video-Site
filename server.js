import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

function hasSceneMarkers(text) {
  return /(?:^|\n)\s*(?:scene\s*)?\d+\s*[:.)-]/im.test(text);
}

function splitScript(script) {
  const normalized = script.replace(/\r\n/g, "\n").trim();
  const matches = [...normalized.matchAll(/(?:^|\n)\s*(?:scene\s*)?(\d+)\s*[:.)-]\s*([^\n]*)/gi)];

  if (!matches.length) return [];

  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : normalized.length;
    const body = normalized.slice(start, end).trim();
    const heading = match[2].trim();
    return {
      number: Number(match[1]),
      heading,
      body: body || heading
    };
  });
}

function firstSentence(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const match = clean.match(/^(.{1,180}?[.!?])(?:\s|$)/);
  return (match ? match[1] : clean.slice(0, 180)).trim();
}

function estimateDuration(index, total, length) {
  if (length !== "Auto — based on script") {
    const seconds = Number.parseInt(length, 10) * 60;
    return `${Math.max(3, Math.round(seconds / total))} sec`;
  }
  const target = total <= 4 ? 12 : total <= 8 ? 8 : 6;
  return `${target} sec`;
}

function buildScriptStoryboard(data, parsedScenes) {
  const style = data.style || "3D Cartoon";
  const audience = data.audience || "Kids";
  const length = data.length || "Auto — based on script";
  const voice = data.voice || "Warm Female";
  const music = data.music || "Playful";

  const scenes = parsedScenes.map((scene, index) => {
    const body = scene.body.replace(/\s+/g, " ").trim();
    const title = scene.heading || `Scene ${scene.number}`;
    const duration = estimateDuration(index, parsedScenes.length, length);

    return {
      number: scene.number,
      title,
      duration,
      visual: `Use the supplied action for this scene in a ${style.toLowerCase()} style. Keep characters, clothing, locations and props visually consistent from previous scenes. Scene direction: ${body}`,
      dialogue: body,
      audio: `${voice} narration/dialogue where appropriate, with ${music.toLowerCase()} music and natural sound effects that match the action. Preserve any lyrics or dialogue written in the script.`,
      videoPrompt: `${style}; ${audience}; ${body}; cinematic composition; expressive character acting; smooth animation; consistent character design; clear subject focus; no random text or extra characters unless the script requests them.`
    };
  });

  return {
    title: parsedScenes[0]?.heading || "Scene-by-Scene Video",
    style,
    audience,
    length,
    scriptMode: "script",
    scenes
  };
}

function buildDemoStoryboard(data) {
  const idea = (data.idea || "An exciting adventure").trim();
  const style = data.style || "3D Cartoon";
  const audience = data.audience || "Kids";
  const length = data.length || "1 minute";

  return {
    title: idea.length > 55 ? idea.slice(0, 55) + "…" : idea,
    style,
    audience,
    length,
    scriptMode: "idea",
    scenes: [
      {
        number: 1,
        title: "The Big Introduction",
        duration: "8 sec",
        visual: `Introduce the main characters in a colorful ${style.toLowerCase()} world. The story begins with: "${idea}".`,
        dialogue: "Welcome, everyone! Our adventure is about to begin!",
        audio: "Bright opening music with playful sound effects.",
        videoPrompt: `${style}; colorful opening shot; expressive characters; introduce the story clearly; smooth animation.`
      },
      {
        number: 2,
        title: "Something Unexpected",
        duration: "10 sec",
        visual: "A funny surprise appears and gets the characters' attention. Use expressive faces and energetic movement.",
        dialogue: "Whoa! Did you see that? We have to find out what is happening!",
        audio: "A playful surprise sound followed by upbeat music.",
        videoPrompt: `${style}; funny surprise; expressive reactions; energetic camera movement; playful timing.`
      },
      {
        number: 3,
        title: "The Learning Moment",
        duration: "12 sec",
        visual: `Turn the main idea into a simple, age-appropriate learning moment for ${audience.toLowerCase()}. Use large colorful visual cues.`,
        dialogue: "Let's learn together! Can you say it with us?",
        audio: "Cheerful teaching rhythm with space for children to repeat.",
        videoPrompt: `${style}; educational visual; clear actions; bright colors; friendly characters; child-safe presentation.`
      },
      {
        number: 4,
        title: "The Fun Challenge",
        duration: "12 sec",
        visual: "The characters solve a silly challenge together. Add physical comedy, colorful props and a clear beginning, middle and end.",
        dialogue: "We can do it! Let's work together!",
        audio: "Bouncy music that builds toward the solution.",
        videoPrompt: `${style}; comedic challenge; group teamwork; expressive animation; colorful props; satisfying resolution.`
      },
      {
        number: 5,
        title: "Big Finish",
        duration: "10 sec",
        visual: "The characters celebrate. Colorful shapes and friendly animated elements fill the scene.",
        dialogue: "You did it! See you in our next adventure!",
        audio: "Happy ending music and a short celebratory sound.",
        videoPrompt: `${style}; joyful finale; characters celebrating; colorful background; polished ending shot.`
      }
    ]
  };
}

app.post("/api/storyboard", (req, res) => {
  try {
    const data = req.body || {};
    const idea = (data.idea || "").trim();

    if (idea.length < 3) {
      return res.status(400).json({ error: "Please paste a scene-by-scene script or enter a video idea." });
    }

    if (hasSceneMarkers(idea)) {
      const scenes = splitScript(idea);
      if (scenes.length) return res.json(buildScriptStoryboard(data, scenes));
    }

    res.json(buildDemoStoryboard(data));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create the storyboard." });
  }
});

app.post("/api/generate-video", (req, res) => {
  res.status(501).json({
    error: "Video generation is not connected yet.",
    message: "The storyboard is ready. Connect a server-side video-generation API here next."
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Video Creator running on port ${PORT}`);
});
