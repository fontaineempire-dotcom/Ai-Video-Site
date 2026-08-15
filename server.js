import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { InferenceClient } from "@huggingface/inference";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.static(__dirname));

/* =========================================================
   HUGGING FACE
   ========================================================= */

const HF_TOKEN = process.env.HF_TOKEN || "";

const hf = HF_TOKEN
  ? new InferenceClient(HF_TOKEN)
  : null;


/* =========================================================
   SCENE DETECTION
   Supports:

   Scene 1:
   Scene 1 -
   Scene 1 —
   Scene 1.
   1.
   1:
   ========================================================= */

function hasSceneMarkers(text) {
  return /(?:^|\n)\s*(?:(?:scene|scenes)\s*)?\d+\s*(?::|[.)-]|—|–)\s*/im.test(text);
}


/* =========================================================
   SPLIT SCRIPT INTO SCENES
   ========================================================= */

function splitScript(script) {

  const normalized = script
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  /*
   * This recognizes:

   Scene 1:
   Scene 1 -
   Scene 1 —
   Scene 1.
   1:
   1.
   1 -
   1 —
  */

  const pattern =
    /(?:^|\n)\s*(?:(?:scene|scenes)\s*)?(\d+)\s*(?::|[.)-]|—|–)\s*([^\n]*)/gi;

  const matches = [
    ...normalized.matchAll(pattern)
  ];

  if (!matches.length) {
    return [];
  }

  return matches.map((match, index) => {

    const start =
      match.index + match[0].length;

    const end =
      index + 1 < matches.length
        ? matches[index + 1].index
        : normalized.length;

    const body =
      normalized
        .slice(start, end)
        .trim();

    const heading =
      (match[2] || "").trim();

    return {

      number:
        Number(match[1]),

      heading:
        heading ||
        `Scene ${match[1]}`,

      body:
        body ||
        heading ||
        `Scene ${match[1]}`
    };

  });
}


/* =========================================================
   DURATION
   ========================================================= */

function estimateDuration(
  total,
  length
) {

  if (
    length &&
    length !== "Auto — based on script"
  ) {

    const minutes =
      Number.parseInt(
        length,
        10
      );

    if (
      Number.isFinite(minutes) &&
      minutes > 0
    ) {

      const totalSeconds =
        minutes * 60;

      return `${Math.max(
        3,
        Math.round(
          totalSeconds / total
        )
      )} sec`;

    }
  }

  if (total <= 4) {
    return "12 sec";
  }

  if (total <= 8) {
    return "8 sec";
  }

  return "6 sec";
}


/* =========================================================
   BUILD SCRIPT STORYBOARD
   ========================================================= */

function buildScriptStoryboard(
  data,
  parsedScenes
) {

  const style =
    data.style ||
    "3D Cartoon";

  const audience =
    data.audience ||
    "Kids";

  const length =
    data.length ||
    "Auto — based on script";

  const voice =
    data.voice ||
    "Warm Female";

  const music =
    data.music ||
    "Playful";


  const scenes =
    parsedScenes.map(
      (scene) => {

        const body =
          scene.body
            .replace(/\s+/g, " ")
            .trim();

        const title =
          scene.heading ||
          `Scene ${scene.number}`;

        const duration =
          estimateDuration(
            parsedScenes.length,
            length
          );


        /*
         * This prompt is used for the actual
         * video generator.
         */

        const videoPrompt =

          `${style}; ${audience}; ` +

          `Scene ${scene.number}: ` +

          `${body}; ` +

          `cinematic composition; ` +

          `expressive character acting; ` +

          `smooth animation; ` +

          `consistent character design; ` +

          `consistent clothing and environment; ` +

          `clear subject focus; ` +

          `professional animated video; ` +

          `no random text; ` +

          `no subtitles; ` +

          `no watermark; ` +

          `do not add characters that are not in the script.`;


        return {

          number:
            scene.number,

          title,

          duration,

          visual:

            `Create this scene in a ${style.toLowerCase()} style. ` +

            `Keep the characters, clothing, location and props consistent. ` +

            body,

          dialogue:
            body,

          audio:

            `${voice} narration/dialogue where appropriate. ` +

            `Use ${music.toLowerCase()} music and natural sound effects. ` +

            `Preserve all dialogue and lyrics written in the script.`,

          videoPrompt

        };

      }
    );


  return {

    title:
      parsedScenes[0]?.heading ||
      "Scene-by-Scene Video",

    style,

    audience,

    length,

    scriptMode:
      "script",

    scenes

  };

}


/* =========================================================
   IDEA MODE
   ========================================================= */

function buildDemoStoryboard(data) {

  const idea =
    (
      data.idea ||
      "An exciting adventure"
    ).trim();

  const style =
    data.style ||
    "3D Cartoon";

  const audience =
    data.audience ||
    "Kids";

  const length =
    data.length ||
    "1 minute";


  return {

    title:
      idea.length > 55
        ? idea.slice(0, 55) + "…"
        : idea,

    style,

    audience,

    length,

    scriptMode:
      "idea",

    scenes: [

      {

        number: 1,

        title:
          "The Big Introduction",

        duration:
          "8 sec",

        visual:
          `Introduce the main characters in a colorful ${style.toLowerCase()} world. ` +
          `The story begins with: "${idea}".`,

        dialogue:
          "Welcome, everyone! Our adventure is about to begin!",

        audio:
          "Bright opening music with playful sound effects.",

        videoPrompt:
          `${style}; colorful opening shot; expressive characters; ` +
          `smooth animation; professional animated video.`

      },

      {

        number: 2,

        title:
          "Something Unexpected",

        duration:
          "10 sec",

        visual:
          "A funny surprise appears and gets the characters' attention.",

        dialogue:
          "Whoa! Did you see that?",

        audio:
          "Playful surprise sound followed by upbeat music.",

        videoPrompt:
          `${style}; funny surprise; expressive reactions; ` +
          `energetic animation; professional video.`

      },

      {

        number: 3,

        title:
          "The Learning Moment",

        duration:
          "12 sec",

        visual:
          `Create a simple learning moment for ${audience}.`,

        dialogue:
          "Let's learn together!",

        audio:
          "Cheerful educational music.",

        videoPrompt:
          `${style}; educational children's animation; ` +
          `bright colors; friendly characters; smooth animation.`

      },

      {

        number: 4,

        title:
          "The Fun Challenge",

        duration:
          "12 sec",

        visual:
          "The characters solve a silly challenge together.",

        dialogue:
          "We can do it!",

        audio:
          "Bouncy music and playful sound effects.",

        videoPrompt:
          `${style}; funny challenge; teamwork; colorful props; ` +
          `expressive animated characters.`

      },

      {

        number: 5,

        title:
          "Big Finish",

        duration:
          "10 sec",

        visual:
          "The characters celebrate together.",

        dialogue:
          "You did it! See you next time!",

        audio:
          "Happy ending music.",

        videoPrompt:
          `${style}; joyful finale; characters celebrating; ` +
          `colorful background; polished ending.`

      }

    ]

  };

}


/* =========================================================
   STORYBOARD API
   ========================================================= */

app.post(
  "/api/storyboard",
  (req, res) => {

    try {

      const data =
        req.body || {};

      const idea =
        String(
          data.idea || ""
        ).trim();


      if (
        idea.length < 3
      ) {

        return res
          .status(400)
          .json({

            error:
              "Please paste a scene-by-scene script or enter a video idea."

          });

      }


      /*
       * If scenes are detected,
       * use the user's actual script.
       */

      if (
        hasSceneMarkers(idea)
      ) {

        const scenes =
          splitScript(idea);


        if (
          scenes.length
        ) {

          return res.json(
            buildScriptStoryboard(
              data,
              scenes
            )
          );

        }

      }


      /*
       * Otherwise use idea mode.
       */

      return res.json(
        buildDemoStoryboard(
          data
        )
      );


    } catch (error) {

      console.error(
        "Storyboard error:",
        error
      );

      return res
        .status(500)
        .json({

          error:
            "Could not create the storyboard."

        });

    }

  }
);


/* =========================================================
   GENERATE VIDEO
   ========================================================= */

app.post(
  "/api/generate-video",
  async (req, res) => {

    try {

      /*
       * Check Hugging Face connection.
       */

      if (
        !HF_TOKEN ||
        !hf
      ) {

        return res
          .status(500)
          .json({

            error:
              "Hugging Face is not connected.",

            message:
              "Add HF_TOKEN to Render → Environment Variables."

          });

      }


      const data =
        req.body || {};


      const prompt =
        String(
          data.prompt ||
          data.videoPrompt ||
          ""
        ).trim();


      if (!prompt) {

        return res
          .status(400)
          .json({

            error:
              "No video prompt was supplied."

          });

      }


      /*
       * Production prompt.
       */

      const finalPrompt =

        `${prompt}. ` +

        `High quality animated video. ` +

        `Smooth natural motion. ` +

        `Consistent characters. ` +

        `Consistent environment. ` +

        `Cinematic camera movement. ` +

        `Clear subject focus. ` +

        `Professional animation. ` +

        `No subtitles. ` +

        `No watermark. ` +

        `No random text.`;


      console.log(
        "Starting AI video generation..."
      );

      console.log(
        finalPrompt
      );


      /*
       * Generate the video.
       */

      const video =
        await hf.textToVideo({

          model:
            "Wan-AI/Wan2.2-TI2V-5B",

          inputs:
            finalPrompt,

          provider:
            "auto"

        });


      /*
       * Convert Blob → Buffer.
       */

      const buffer =
        Buffer.from(
          await video.arrayBuffer()
        );


      /*
       * Send MP4 to browser.
       */

      res.setHeader(
        "Content-Type",
        "video/mp4"
      );

      res.setHeader(
        "Content-Length",
        buffer.length
      );

      res.setHeader(
        "Cache-Control",
        "no-store"
      );


      return res.send(
        buffer
      );


    } catch (error) {

      console.error(
        "VIDEO GENERATION ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Video generation failed.",

          message:
            error?.message ||
            "The AI video provider could not generate this scene."

        });

    }

  }
);


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      ok:
        true,

      huggingFace:
        Boolean(HF_TOKEN),

      message:
        HF_TOKEN
          ? "AI Video Creator is connected to Hugging Face."
          : "Server is running, but HF_TOKEN is missing."

    });

  }
);


/* =========================================================
   START SERVER
   ========================================================= */

const PORT =
  process.env.PORT || 3000;


app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `AI Video Creator running on port ${PORT}`
    );

    console.log(
      `Hugging Face connected: ${Boolean(HF_TOKEN)}`
    );

  }
);
