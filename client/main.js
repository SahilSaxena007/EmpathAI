document.addEventListener("DOMContentLoaded", () => {
  // Get UI elements
  const video = document.getElementById("videoFeed");
  const recordBtn = document.getElementById("recordBtn");
  const doneBtn = document.getElementById("doneBtn");
  const transcriptTextEl = document.getElementById("transcriptText");
  const emotionLabelEl = document.getElementById("emotionLabel");
  const agentResponseEl = document.getElementById("agentResponse");

  let isConversationActive = false;
  let recognition; // SpeechRecognition instance
  let chatSocket; // WebSocket connection for chat
  let emotionInterval;
  let transcriptData = "";
  let emotionTimeline = []; // Array to store { time, emotion }

  // Load face-api.js models from the CDN
  async function loadFaceModels() {
    const modelUrl = "https://justadudewhohacks.github.io/face-api.js/models";
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
    await faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
    console.log("Models loaded from CDN");
  }

  // Start video stream
  async function startVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      video.srcObject = stream;
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
  }

  // Call the TTS API for the initial greeting and play the resulting audio
  async function playInitialGreeting() {
    try {
      const response = await fetch(
        "http://localhost:3001/tts?msg=" +
          encodeURIComponent("Hello! How can I help you today?")
      );
      if (!response.ok) throw new Error("TTS request failed");
      const arrayBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([arrayBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      console.log("Playing greeting TTS...");
      await audio.play();
      return audio;
    } catch (error) {
      console.error("Error playing initial greeting:", error);
    }
  }

  // Initialize speech recognition (Web Speech API)
  function initSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        interimTranscript += event.results[i][0].transcript;
      }
      transcriptTextEl.innerText = interimTranscript;
      transcriptData = interimTranscript; // update global transcript
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
    };
  }

  // Process video frames for emotion detection using face-api.js
  async function processVideoFrames() {
    if (!video || video.paused || video.ended) return;
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();
    if (detections) {
      const expressions = detections.expressions;
      const emotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );
      emotionLabelEl.innerText = emotion;
      // Record emotion with timestamp (milliseconds)
      emotionTimeline.push({ time: Date.now(), emotion });
    }
  }

  // Open a WebSocket connection to the chat backend server
  function openWebSocket() {
    chatSocket = new WebSocket("ws://localhost:3001/ws");
    chatSocket.onopen = () => console.log("Chat WebSocket connection opened");
    chatSocket.onmessage = (message) => {
      const msg = JSON.parse(message.data);
      if (msg.type === "response") {
        agentResponseEl.innerText = msg.data;
        // Use TTS to speak the response
        speakNeuphonic(msg.data).then((audio) => {
          console.log("Playing Gemini response...");
          audio.addEventListener("ended", () => {
            console.log(
              "Gemini response playback finished. Ready for next turn."
            );
          });
        });
      }
    };
    chatSocket.onerror = (error) =>
      console.error("Chat WebSocket error:", error);
    chatSocket.onclose = () => console.log("Chat WebSocket connection closed");
  }

  // Start the conversation pipeline: load models, open chat WebSocket, start recognition, and process emotions
  async function startPipeline() {
    await loadFaceModels();
    openWebSocket();
    initSpeechRecognition();
    recognition.start();
    // Process video frames every 500ms
    emotionInterval = setInterval(processVideoFrames, 500);
    // Show the "Done Speaking" button
    doneBtn.style.display = "inline-block";
  }

  // Stop the conversation pipeline
  function stopPipeline() {
    if (recognition) recognition.stop();
    clearInterval(emotionInterval);
    if (chatSocket) chatSocket.close();
    doneBtn.style.display = "none";
  }

  // Function to send the final transcript and emotion timeline to the Gemini API via our backend
  async function sendGeminiRequest(data) {
    try {
      const response = await fetch("http://localhost:3001/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Gemini API request failed");
      const result = await response.json();
      return result.response;
    } catch (error) {
      console.error("Error in Gemini request:", error);
      return "I'm sorry, I couldn't process that. Could you please repeat?";
    }
  }

  // When the user clicks "Done Speaking", stop the pipeline and send data to Gemini
  async function finishSpeaking() {
    stopPipeline();
    console.log("Final transcript:", transcriptData);
    console.log("Emotion timeline:", emotionTimeline);
    const finalData = {
      timestamp: new Date().toISOString(),
      transcript: transcriptData,
      dominant_emotion: emotionTimeline.length
        ? emotionTimeline[emotionTimeline.length - 1].emotion
        : "neutral",
      emotion_over_time: emotionTimeline,
    };
    const geminiResponse = await sendGeminiRequest(finalData);
    agentResponseEl.innerText = geminiResponse;
    // Use TTS to speak the Gemini response
    speakNeuphonic(geminiResponse).then((audio) => {
      console.log("Playing Gemini response...");
      audio.addEventListener("ended", () => {
        console.log("Gemini response playback finished. Ready for next turn.");
      });
    });
  }

  // Function to call the TTS backend via HTTP and play audio using Neuphonic TTS
  async function speakNeuphonic(text) {
    try {
      const response = await fetch(
        `http://localhost:3001/tts?msg=${encodeURIComponent(text)}`
      );
      if (!response.ok) throw new Error("TTS request failed");
      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      await audio.play();
      return audio;
    } catch (error) {
      console.error("Error in TTS:", error);
      return { addEventListener: () => {} };
    }
  }

  // Greet user with TTS, then start conversation pipeline after greeting finishes
  async function greetUser() {
    const audio = await speakNeuphonic("Hello! How can I help you today?");
    audio.addEventListener("ended", () => {
      console.log("Greeting finished. Now listening...");
      startPipeline();
    });
  }

  // Attach event listener to record button (manual fallback control)
  recordBtn.addEventListener("click", async () => {
    if (!isConversationActive) {
      await greetUser();
      recordBtn.innerText = "Stop Conversation";
      isConversationActive = true;
    } else {
      stopPipeline();
      recordBtn.innerText = "Start Conversation";
      isConversationActive = false;
    }
  });

  // Attach event listener to done button to signal end of user's turn
  doneBtn.addEventListener("click", () => {
    finishSpeaking();
  });

  // Start video immediately so the user sees their feed
  startVideo();
});
