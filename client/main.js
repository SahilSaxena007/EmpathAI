document.addEventListener("DOMContentLoaded", () => {
  // UI Elements
  const video = document.getElementById("videoFeed");
  const recordBtn = document.getElementById("recordBtn");
  const doneBtn = document.getElementById("doneBtn");
  const chatContainer = document.getElementById("chatContainer");

  let isConversationActive = false;
  let recognition; // SpeechRecognition instance
  let chatSocket; // WebSocket connection for chat
  let emotionInterval;
  let transcriptData = "";
  let emotionTimeline = [];
  let lastEmotion = "neutral";
  let currentUserBubble = null;

  // ---------- Chat Bubble Functions ----------
  function appendBubble(content, isUser = true) {
    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");
    bubble.classList.add(isUser ? "user-bubble" : "ai-bubble");
    bubble.innerText = content;
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function updateUserBubble(text) {
    if (!currentUserBubble) {
      currentUserBubble = document.createElement("div");
      currentUserBubble.classList.add("message-bubble", "user-bubble");
      chatContainer.appendChild(currentUserBubble);
    }
    currentUserBubble.innerText = text;
    chatContainer.scrollTop = chatContainer.scrollHeight;
    transcriptData = text;
  }

  function finalizeUserBubble() {
    if (currentUserBubble) {
      const note = document.createElement("div");
      note.classList.add("emotion-note");
      note.innerText = `Detected Emotion: ${lastEmotion}`;
      currentUserBubble.appendChild(note);
      currentUserBubble = null;
    }
  }

  // ---------- Face-API Setup ----------
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

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        interimTranscript += event.results[i][0].transcript;
      }
      updateUserBubble(interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
    };
  }

  // ---------- WebSocket Setup ----------
  function openWebSocket() {
    chatSocket = new WebSocket("ws://localhost:3001/ws");
    chatSocket.onopen = () => console.log("Chat WebSocket connection opened");
    chatSocket.onmessage = (message) => {
      const msg = JSON.parse(message.data);
      if (msg.type === "response") {
        appendBubble(msg.data, false);
        // Use TTS to speak the response
        speakNeuphonic(msg.data).then((audio) => {
          console.log("Playing AI response TTS...");
          audio.addEventListener("ended", () => {
            console.log("AI response playback finished. Ready for next turn.");
          });
        });
      }
    };
    chatSocket.onerror = (error) =>
      console.error("Chat WebSocket error:", error);
    chatSocket.onclose = () => console.log("Chat WebSocket connection closed");
  }

  // ---------- Conversation Pipeline ----------
  async function startPipeline() {
    await loadFaceModels();
    openWebSocket();
    initSpeechRecognition();
    recognition.start();
    // Process emotion detection every 500ms
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

  async function finishSpeaking() {
    stopPipeline();
    finalizeUserBubble();
    console.log("Final transcript:", transcriptData);
    console.log("Emotion timeline:", emotionTimeline);
    const finalData = {
      timestamp: new Date().toISOString(),
      transcript: transcriptData,
      dominant_emotion: lastEmotion,
      emotion_over_time: emotionTimeline,
    };
    const geminiResponse = await sendGeminiRequest(finalData);
    appendBubble(geminiResponse, false);
    speakNeuphonic(geminiResponse).then((audio) => {
      console.log("Playing AI response TTS...");
      audio.addEventListener("ended", () => {
        console.log("AI response playback finished. Ready for next turn.");
        // After AI response, clear transcript and emotion data for the next turn
        transcriptData = "";
        emotionTimeline = [];
        // Restart speech recognition for the next turn
        initSpeechRecognition();
        recognition.start();
      });
    });
  }

  // ---------- TTS Functions ----------
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

  // ---------- Greeting ----------
  async function greetUser() {
    appendBubble("Hello! How can I help you today?", false);
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

  // Start video on load
  startVideo();
});
