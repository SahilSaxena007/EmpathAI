document.addEventListener("DOMContentLoaded", () => {
  // Get UI elements
  const video = document.getElementById("videoFeed");
  const recordBtn = document.getElementById("recordBtn");
  const doneBtn = document.getElementById("doneBtn");
  const chatContainer = document.getElementById("chatContainer");

  let isConversationActive = false;
  let recognition; // SpeechRecognition instance
  let chatSocket; // WebSocket connection
  let emotionInterval;
  let transcriptData = "";
  let emotionTimeline = [];
  let lastEmotion = "neutral";

  // ---------- Utility: Append a chat bubble ----------
  function appendBubble(content, isUser = true) {
    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");
    bubble.classList.add(isUser ? "user-bubble" : "ai-bubble");
    bubble.innerText = content;
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // ---------- Utility: Append emotion note ----------
  function appendEmotionNote(emotion) {
    const note = document.createElement("div");
    note.classList.add("emotion-note");
    note.innerText = `Detected Emotion: ${emotion}`;
    chatContainer.appendChild(note);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // ---------- Face-API / Video Setup ----------
  async function loadFaceModels() {
    const modelUrl = "https://justadudewhohacks.github.io/face-api.js/models";
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
    await faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
    console.log("Models loaded from CDN");
  }
  async function startVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      video.srcObject = stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  }
  async function detectEmotion() {
    if (!video || video.paused || video.ended) return;
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();
    if (detection) {
      const expressions = detection.expressions;
      const topEmotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );
      lastEmotion = topEmotion;
    }
  }

  // ---------- Speech Recognition ----------
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

    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        interim += e.results[i][0].transcript;
      }
      transcriptData = interim;
    };
    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
    };
  }

  // ---------- TTS Playback ----------
  async function speakNeuphonic(text) {
    try {
      const resp = await fetch(
        `http://localhost:3001/tts?msg=${encodeURIComponent(text)}`
      );
      if (!resp.ok) throw new Error("TTS request failed");
      const buffer = await resp.arrayBuffer();
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

  // ---------- WebSocket Setup ----------
  function openWebSocket() {
    chatSocket = new WebSocket("ws://localhost:3001/ws");
    chatSocket.onopen = () => console.log("WebSocket open");
    chatSocket.onmessage = (message) => {
      const msg = JSON.parse(message.data);
      if (msg.type === "response") {
        // AI Response bubble
        appendBubble(msg.data, false);
        // TTS speak the AI response
        speakNeuphonic(msg.data).then((audio) => {
          console.log("Playing AI response TTS...");
        });
      }
    };
    chatSocket.onerror = (err) => console.error("WebSocket error:", err);
    chatSocket.onclose = () => console.log("WebSocket closed");
  }

  // ---------- Conversation Pipeline ----------
  async function startPipeline() {
    await loadFaceModels();
    openWebSocket();
    initSpeechRecognition();
    recognition.start();
    emotionInterval = setInterval(detectEmotion, 500);
    doneBtn.style.display = "inline-block";
  }
  function stopPipeline() {
    if (recognition) recognition.stop();
    clearInterval(emotionInterval);
    if (chatSocket) chatSocket.close();
    doneBtn.style.display = "none";
  }

  // ---------- Gemini Request ----------
  async function sendGeminiRequest(data) {
    try {
      const resp = await fetch("http://localhost:3001/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error("Gemini request failed");
      const result = await resp.json();
      return result.response;
    } catch (error) {
      console.error("Error in Gemini request:", error);
      return "Sorry, I couldn't process that.";
    }
  }

  async function finishSpeaking() {
    stopPipeline();
    // Show the user's final transcript as a user bubble
    appendBubble(transcriptData, true);
    // Show the detected emotion as a note (optional)
    appendEmotionNote(lastEmotion);

    // Build data for Gemini
    const finalData = {
      timestamp: new Date().toISOString(),
      transcript: transcriptData,
      dominant_emotion: lastEmotion,
      emotion_over_time: emotionTimeline,
    };
    const geminiResponse = await sendGeminiRequest(finalData);
    // AI response bubble
    appendBubble(geminiResponse, false);
    // TTS speak the Gemini response
    speakNeuphonic(geminiResponse);
  }

  // ---------- Start Greeting ----------
  async function greetUser() {
    const audio = await speakNeuphonic("Hello! How can I help you today?");
    audio.addEventListener("ended", () => {
      console.log("Greeting finished. Now listening...");
      startPipeline();
    });
  }

  // ---------- Button Handlers ----------
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
  doneBtn.addEventListener("click", () => {
    finishSpeaking();
  });

  // ---------- Initialize ----------
  startVideo();
});
