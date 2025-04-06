import express from "express";
import cors from "cors";
import { createClient, toWav } from "@neuphonic/neuphonic-js";
import { createServer } from "http";
import { WebSocketServer } from "ws";

// Initialize Express app and HTTP server
const app = express();
app.use(cors());
const server = createServer(app);

// Set up Neuphonic client
const client = createClient({
  apiKey:
    "413c33be2441d1a48bf849e33b491eee24265321d69d3b0ecd7ae8314b7da017.9e93391c-5918-44a4-863e-b62a9da33750",
});

// Express TTS endpoint
app.get("/tts", async (req, res) => {
  try {
    const msg = req.query.msg || "Hello World!";
    const sse = await client.tts.sse({
      speed: 1.15,
      lang_code: "en",
      voice_id: "6ffede2d-d96e-4a9b-9d4d-e654b8ef4cf2",
    });
    const result = await sse.send(msg);
    const wav = toWav(result.audio);
    res.setHeader("Content-Type", "audio/wav");
    res.send(wav);
  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).send("Error processing TTS request");
  }
});

// Start the HTTP server
server.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});

// Create and attach WebSocket server to the same HTTP server
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received via WebSocket:", data);
      if (data.type === "transcript" || data.type === "emotion") {
        const response = `Therapist: I understand you are feeling ${data.data}. Tell me more about that.`;
        ws.send(JSON.stringify({ type: "response", data: response }));
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});
