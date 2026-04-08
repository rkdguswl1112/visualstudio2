// 🔥 Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCKHmpKTDy7kRt34fnc6b_78U0t3tFxTUY",
  authDomain: "visualstudio2-61cf6.firebaseapp.com",
  projectId: "visualstudio2-61cf6",
  storageBucket: "visualstudio2-61cf6.firebasestorage.app",
  messagingSenderId: "1020115559770",
  appId: "1:1020115559770:web:4ce54e956e8900a9bcff63"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -------------------------

const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");

// 🔥 폰트
const fonts = [
  "Gaegu",
  "Nanum Pen Script",
  "Gowun Dodum",
  "Arial"
];

// 🔥 색상
const colors = [
  "#000000",
  "#ff5c5c",
  "#ffb84d",
  "#4d94ff",
  "#66cc99",
  "#cc66ff",
  "#ff66a3"
];

// 🔥 스티커 이미지 (쉼표 중요!!)
const stickerImages = [
  "스티커-01.png",
  "스티커-02.png",
  "스티커-03.png",
  "스티커-04.png",
  "스티커-05.png",
  "스티커-06.png",
  "스티커-07.png",
  "스티커-08.png",
  "스티커-09.png",
  "스티커-10.png",
];

let currentDate = new Date();

// 날짜
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function updateDate() {
  dateEl.innerText = formatDate(currentDate);
}

// 🔥 이미지 업로드 (랜덤 위치 저장 포함)
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = async () => {
    const key = formatDate(currentDate);

    await setDoc(doc(db, "diary", key), {
      baseImage: reader.result,
      stickers: [],
      x: Math.random(),
      y: Math.random(),
      rotation: Math.random()
    });
  };

  reader.readAsDataURL(file);
});

// 🔥 스티커 생성
function addSticker(text = "", x = null, y = null, font = null, color = null, locked = false) {
  const maxX = window.innerWidth - 140;
  const maxY = window.innerHeight - 140;

  if (x === null) x = Math.random() * maxX;
  if (y === null) y = Math.random() * maxY;

  const sticker = document.createElement("div");
  sticker.className = "sticker";

  const img = document.createElement("img");
  const randomIndex = Math.floor(Math.random() * stickerImages.length);
  img.src = stickerImages[randomIndex];

  const textarea = document.createElement("textarea");
  textarea.className = "sticker-text";
  textarea.value = text;

  // 폰트
  if (font) {
    textarea.style.fontFamily = font;
  } else {
    const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
    textarea.style.fontFamily = randomFont;
  }

  // 색상
  if (color) {
    textarea.style.color = color;
  } else {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    textarea.style.color = randomColor;
  }

  // 잠금
  if (locked) {
    textarea.readOnly = true;
    textarea.style.pointerEvents = "none";
  }

  sticker.appendChild(img);
  sticker.appendChild(textarea);

  sticker.style.left = x + "px";
  sticker.style.top = y + "px";
  sticker.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;

  makeDraggable(sticker, textarea);

  canvas.appendChild(sticker);

  // 입력 후 잠금
  textarea.addEventListener("blur", () => {
    if (textarea.value.trim() !== "") {
      textarea.readOnly = true;
      textarea.dataset.locked = "true";
      textarea.style.pointerEvents = "none";
      saveData();
    }
  });

  textarea.addEventListener("input", saveData);

  saveData();
}

// 🔥 드래그
function makeDraggable(el, textarea) {
  let offsetX, offsetY;
  let isDragging = false;

  el.addEventListener("mousedown", function(e) {
    if (e.target === textarea) return;

    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
  });

  function move(e) {
    if (!isDragging) return;
    el.style.left = (e.pageX - offsetX) + "px";
    el.style.top = (e.pageY - offsetY) + "px";
  }

  function stop() {
    isDragging = false;
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", stop);
    saveData();
  }
}

// 🔥 저장
async function saveData() {
  const key = formatDate(currentDate);

  const all = document.querySelectorAll(".sticker");
  const stickersData = [];

  all.forEach(el => {
    const textarea = el.querySelector("textarea");

    stickersData.push({
      text: textarea.value,
      x: parseInt(el.style.left),
      y: parseInt(el.style.top),
      font: textarea.style.fontFamily,
      color: textarea.style.color,
      locked: textarea.dataset.locked === "true"
    });
  });

  const baseImage = document.querySelector("#baseImage");

  const data = {
    baseImage: baseImage ? baseImage.src : "",
    stickers: stickersData,
    x: baseImage ? parseFloat(baseImage.dataset.x) : 0.5,
    y: baseImage ? parseFloat(baseImage.dataset.y) : 0.5,
    rotation: baseImage ? parseFloat(baseImage.dataset.rotation) : 0.5
  };

  await setDoc(doc(db, "diary", key), data);
}

// 🔥 실시간 반영
function listenRealtime() {
  const key = formatDate(currentDate);

  onSnapshot(doc(db, "diary", key), (docSnap) => {
    if (docSnap.exists()) {
      renderData(docSnap.data());
    } else {
      canvas.innerHTML = "";
    }
  });
}

// 🔥 렌더
function renderData(data) {
  canvas.innerHTML = "";

  if (data.baseImage) {
    const img = document.createElement("img");
    img.id = "baseImage";
    img.src = data.baseImage;

    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - 300;

    const x = (data.x || Math.random()) * maxX;
    const y = (data.y || Math.random()) * maxY;
    const rotation = (data.rotation || Math.random()) * 20 - 10;

    img.style.left = x + "px";
    img.style.top = y + "px";
    img.style.transform = `rotate(${rotation}deg)`;

    // 🔥 다시 저장할 수 있게 dataset 유지
    img.dataset.x = data.x;
    img.dataset.y = data.y;
    img.dataset.rotation = data.rotation;

    canvas.appendChild(img);
  }

  data.stickers.forEach(s => {
    addSticker(s.text, s.x, s.y, s.font, s.color, s.locked);
  });
}

// 날짜 이동
function prevDay() {
  currentDate.setDate(currentDate.getDate() - 1);
  updateDate();
  listenRealtime();
}

function nextDay() {
  currentDate.setDate(currentDate.getDate() + 1);
  updateDate();
  listenRealtime();
}

// 초기화
canvas.addEventListener("dblclick", () => {
  if (confirm("전체 다이어리를 초기화하시겠습니까?")) {
    location.reload();
  }
});

// 실행
updateDate();
listenRealtime();
