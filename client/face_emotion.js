async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceapi.nets.faceExpressionNet.loadFromUri("/models");
}

async function detectEmotion() {
  const detections = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();
  if (detections) {
    const expressions = detections.expressions;
    const emotion = Object.keys(expressions).reduce((a, b) =>
      expressions[a] > expressions[b] ? a : b
    );
    document.getElementById("emotionLabel").innerText = emotion;
  }
}

loadModels().then(() => {
  setInterval(detectEmotion, 1000); // Run detection every second
});
