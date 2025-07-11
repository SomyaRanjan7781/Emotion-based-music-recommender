const video = document.getElementById('video');
const captureBtn = document.getElementById('capture');
const musicListDiv = document.getElementById('musicList');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo).catch(err => console.error("Model load error:", err));

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      video.play();
    })
    .catch(err => {
      console.error("Camera error:", err);
      musicListDiv.innerHTML = "<p>Camera access denied or unavailable.</p>";
    });
}

captureBtn.addEventListener('click', async () => {
  const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();

  if (detections && detections.expressions) {
    const expressions = detections.expressions;
    const emotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);

    musicListDiv.innerHTML = `<p>Detected Emotion: <strong>${emotion}</strong></p><p>Fetching songs...</p>`;

    fetch('https://huggingface.co/spaces/somya-27-04-03/Emotion-based-music-recommender', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emotion: emotion })
    })
    .then(res => res.json())
    .then(data => {
      if (data.results) {
        musicListDiv.innerHTML += "<ul>";
        data.results.forEach(song => {
          musicListDiv.innerHTML += `<li><a href="${song.url}" target="_blank">${song.title}</a></li>`;
        });
        musicListDiv.innerHTML += "</ul>";
      } else {
        musicListDiv.innerHTML += "<p>No songs found.</p>";
      }
    })
    .catch(err => {
      console.error("Fetch error:", err);
      musicListDiv.innerHTML = "<p>Failed to get music.</p>";
    });
  } else {
    musicListDiv.innerHTML = "No face detected. Try again.";
  }
});
