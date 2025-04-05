const video = document.getElementById("videoFeed");
const recordBtn = document.getElementById("recordBtn");

let mediaRecorderVideo, mediaRecorderAudio;
let recordedChunksVideo = [];
let recordedChunksAudio = [];
let isRecording = false;

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
startVideo();

recordBtn.addEventListener("click", () => {
  if (!isRecording) {
    startRecording();
    recordBtn.innerText = "Stop Recording";
    isRecording = true;
  } else {
    stopRecording();
    recordBtn.innerText = "Start Recording";
    isRecording = false;
  }
});

function startRecording() {
  const stream = video.srcObject;
  // Reset recorded chunks
  recordedChunksVideo = [];
  recordedChunksAudio = [];

  // Create a MediaRecorder for the entire stream (video + audio)
  mediaRecorderVideo = new MediaRecorder(stream);
  mediaRecorderVideo.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunksVideo.push(event.data);
    }
  };
  mediaRecorderVideo.onstop = () => {
    const videoBlob = new Blob(recordedChunksVideo, { type: "video/webm" });
    // Name the file with .mp4 extension if desired (for demo purposes)
    uploadVideo(videoBlob);
  };

  // Create a separate MediaRecorder for audio only.
  const audioStream = new MediaStream(stream.getAudioTracks());
  mediaRecorderAudio = new MediaRecorder(audioStream);
  mediaRecorderAudio.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunksAudio.push(event.data);
    }
  };
  mediaRecorderAudio.onstop = () => {
    const audioBlob = new Blob(recordedChunksAudio, { type: "audio/webm" });
    uploadAudio(audioBlob);
  };

  // Start both recorders
  mediaRecorderVideo.start();
  mediaRecorderAudio.start();
}

function stopRecording() {
  if (mediaRecorderVideo && mediaRecorderVideo.state !== "inactive") {
    mediaRecorderVideo.stop();
  }
  if (mediaRecorderAudio && mediaRecorderAudio.state !== "inactive") {
    mediaRecorderAudio.stop();
  }
}

function uploadVideo(blob) {
  const formData = new FormData();
  const fileName = `recording_${Date.now()}.mp4`;
  formData.append("video", blob, fileName);

  fetch("http://localhost:5000/saveVideo", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Video file saved:", data);
    })
    .catch((error) => console.error("Error uploading video:", error));
}

function uploadAudio(blob) {
  const formData = new FormData();
  const fileName = `recording_audio_${Date.now()}.mp3`;
  formData.append("audio", blob, fileName);

  fetch("http://localhost:5000/saveAudio", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Audio file saved:", data);
    })
    .catch((error) => console.error("Error uploading audio:", error));
}
