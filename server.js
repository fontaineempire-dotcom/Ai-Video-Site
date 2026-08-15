import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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
    scenes: [
      {
        number: 1,
        title: "The Big Introduction",
        duration: "8 sec",
        visual: `Introduce the main characters in a colorful ${style.toLowerCase()} world. The story begins with: "${idea}".`,
        dialogue: "Welcome, everyone! Our adventure is about to begin!",
        audio: "Bright opening music with playful sound effects."
      },
      {
        number: 2,
        title: "Something Unexpected",
        duration: "10 sec",
        visual: "A funny surprise appears and gets the characters' attention. Use expressive faces and energetic movement.",
        dialogue: "Whoa! Did you see that? We have to find out what is happening!",
        audio: "A playful surprise sound followed by upbeat music."
      },
      {
        number: 3,
        title: "The Learning Moment",
        duration: "12 sec",
        visual: `Turn the main idea into a simple, age-appropriate learning moment for ${audience.toLowerCase()}. Use large colorful visual cues.`,
        dialogue: "Let's learn together! Can you say it with us?",
        audio: "Cheerful teaching rhythm with space for children to repeat."
      },
      {
        number: 4,
        title: "The Fun Challenge",
        duration: "12 sec",
        visual: "The characters solve a silly challenge together. Add physical comedy, colorful props and a clear beginning, middle and end.",
        dialogue: "We can do it! Let's work together!",
        audio: "Bouncy music that builds toward the solution."
      },
      {
        number: 5,
        title: "Big Finish",
        duration: "10 sec",
        visual: "The characters celebrate. Colorful shapes and friendly animated elements fill the scene.",
        dialogue: "You did it! See you in our next adventure!",
        audio: "Happy ending music and a short celebratory sound."
      }
    ]
  };
}

app.post("/api/storyboard", (req, res) => {
  try {
    const data = req.body || {};
    if (!data.idea || data.idea.trim().length < 3) {
      return res.status(400).json({ error: "Please enter a video idea." });
    }
    res.json(buildDemoStoryboard(data));
  } catch {
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
app.listen(PORT, () => {
  console.log(`AI Video Creator running at http://localhost:${PORT}`);
});