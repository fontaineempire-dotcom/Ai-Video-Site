# AI Video Creator

A GitHub-ready starter website for turning a video idea into an AI-generated storyboard.

## Run locally

1. Install Node.js.
2. Open a terminal in this folder.
3. Run:

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000`.

## What this starter does

- Collects a video idea, style, audience, length, aspect ratio, voice and music preferences.
- Generates a scene-by-scene storyboard using a built-in demo generator.
- Keeps the project structured so a real AI text/video API can be connected later.

## Important

This version does **not** call a paid AI video API yet. It is a safe working prototype. API keys should only be stored server-side in environment variables, never in browser JavaScript.

## Next integration

Connect `/api/storyboard` to your preferred AI text API, then add a server-side video-generation job endpoint. The UI is already prepared for scene-by-scene generation.
