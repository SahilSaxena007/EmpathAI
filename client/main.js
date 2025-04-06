// Get UI elements
const video = document.getElementById("videoFeed");
const recordBtn = document.getElementById("recordBtn");
const transcriptTextEl = document.getElementById("transcriptText");
const emotionLabelEl = document.getElementById("emotionLabel");
const agentResponseEl = document.getElementById("agentResponse");

let isRecording = false;
let recognition; // SpeechRecognition instance
let socket; // WebSocket connection
let emotionInterval;

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
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    transcriptTextEl.innerText = transcript;
    // Send transcript update via WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "transcript", data: transcript }));
    }
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
    // Send emotion update via WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "emotion", data: emotion }));
    }
  }
}

// Open a WebSocket connection to the backend server
function openWebSocket() {
  // Updated WebSocket URL to call our Node/Express backend with WebSocket endpoint at /ws on port 3001
  socket = new WebSocket("ws://localhost:3001/ws");

  socket.onopen = () => {
    console.log("WebSocket connection opened");
  };

  socket.onmessage = (message) => {
    const msg = JSON.parse(message.data);
    if (msg.type === "response") {
      agentResponseEl.innerText = msg.data;
      // Use browser TTS to speak the response
      const utterance = new SpeechSynthesisUtterance(msg.data);
      speechSynthesis.speak(utterance);
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };
}

// Start the real-time processing pipeline
async function startPipeline() {
  await loadFaceModels();
  openWebSocket();
  initSpeechRecognition();
  recognition.start();
  // Process video frames every 500ms (adjust as needed)
  emotionInterval = setInterval(processVideoFrames, 500);
}

// Stop the pipeline
function stopPipeline() {
  if (recognition) recognition.stop();
  clearInterval(emotionInterval);
  if (socket) socket.close();
}

// Attach event listener to record button
recordBtn.addEventListener("click", () => {
  if (!isRecording) {
    startPipeline();
    recordBtn.innerText = "Stop Conversation";
    isRecording = true;
  } else {
    stopPipeline();
    recordBtn.innerText = "Start Conversation";
    isRecording = false;
  }
});

// Start video immediately
startVideo();
