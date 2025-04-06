import express from "express";
import cors from "cors";
import { createClient, toWav } from "@neuphonic/neuphonic-js";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { config as dotenvConfig } from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenvConfig();

// Initialize Express app and HTTP server
const app = express();
app.use(cors());
app.use(express.json());
const server = createServer(app);

// Set up Neuphonic client for TTS
const neuphonicClient = createClient({
  apiKey:
    "66fb2b4604ce4a5e7adca1c0b118b1f113e51ab20c00f3e55634a22ba53219bd.1da647ed-1b69-4f3d-bf05-aa0c02ef0906",
});

// Express TTS endpoint
app.get("/tts", async (req, res) => {
  try {
    const msg = req.query.msg || "Hello World!";
    const sse = await neuphonicClient.tts.sse({
      speed: 1.15,
      lang_code: "en",
      voice_id: "6ffede2d-d96e-4a9b-9d4d-e654b8ef4cf2",
    });
    const result = await sse.send(msg);
    const wav = toWav(result.audio);
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(wav);
  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).send("Error processing TTS request");
  }
});

// Gemini endpoint – generate an empathetic response with a 120-word limit
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyAE167nmjqDeRaAY_6FQeOy3l8d-rY0f2A";
app.post("/gemini", async (req, res) => {
  try {
    const { transcript, dominant_emotion, emotion_over_time } = req.body;
    // Build the prompt with a 120-word limit instruction.
    const system_instruction =
      "You are a compassionate therapist. Read the user's transcript and emotional tone. Understand what they might be going through and respond empathetically. Address the dominant emotion and offer supportive insights. Your response should be within 120 words.";
    const user_prompt = `Transcript: ${transcript}\nDominant Emotion: ${dominant_emotion}\n\nHow would you respond?`;
    const full_prompt = `SYSTEM:\n${system_instruction}\n\nUSER:\n${user_prompt}`;

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: full_prompt,
    });
    res.json({ response: response.text });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).send("Error processing Gemini request");
  }
});

// Start the HTTP server
server.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});

// Create and attach WebSocket server for chat
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
