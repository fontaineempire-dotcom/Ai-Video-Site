# AI Video Creator

A single-page AI Video Creator prototype for turning a scene-by-scene script into structured video scenes.

## Features
- Paste a complete Scene 1 / Scene 2 / Scene 3 script.
- Automatically detects scene markers and creates one storyboard card per scene.
- Preserves the supplied script as the dialogue/action source.
- Adds visual, audio and AI video prompt guidance to every scene.
- Supports visual style, audience, length, format, voice and music settings.
- Still supports a simple idea prompt when no scene markers are supplied.

## Run
```bash
npm install
npm start
```

Then open http://localhost:3000

## Render
Build command: `npm install`
Start command: `npm start`

The app listens on `process.env.PORT` and serves the files from the repository root.

## Next step
The `/api/generate-video` endpoint is intentionally a placeholder. Connect a server-side video-generation provider there to turn each scene's `videoPrompt` into actual video clips.
