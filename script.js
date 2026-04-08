// 🔥 Firebase 설정 (기존과 동일)
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
// 1. 데이터 정의 (상단으로 이동하여 초기화 보장)
const fonts = ["Gaegu", "Nanum Pen Script", "Gowun Dodum", "Arial"];
const colors = ["#000000", "#ff5c5c", "#ffb84d", "#4d94ff", "#66cc99", "#cc66ff", "#ff66a3"];

// 🔥 [중요] 파일명을 수동으로 하나씩 적었습니다. (01, 02... 형식이 맞는지 꼭 확인!)
const stickerImages = [
  "s01.png", 
  "s02.png", 
  "s03.png", 
  "s04.png", 
  "s05.png",
  "s06.png", 
  "s07.png", 
  "s08.png", 
  "s09.png", 
  "s10.png"
];

const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const addStickerBtn = document.getElementById("addStickerBtn");

let currentDate = new Date();
let isRendering = false; 

function formatDate(date) { return date.toISOString().split("T")[0]; }
function updateDate() { dateEl.innerText = formatDate(currentDate); }

// 🔥 데이터 저장 함수 (한글 입력 끊김 방지를 위해 디바운스 적용 가능하나, 일단 로직 최적화)
async function saveData() {
  if (isRendering) return; 
  const key = formatDate(currentDate);
  const allStickers = document.querySelectorAll(".sticker");
  const stickersData = Array.from(allStickers).map(el => {
    const textarea = el.querySelector("textarea");
    return {
      text: textarea.value,
      x: parseInt(el.style.left),
      y: parseInt(el.style.top),
      font: textarea.style.fontFamily,
      color: textarea.style.color,
      locked: textarea.readOnly
    };
  });

  const baseImg = document.querySelector("#baseImage");
  const data = {
    baseImage: baseImg ? baseImg.src : "",
    stickers: stickersData,
    x: baseImg ? parseFloat(baseImg.dataset.x) : 0.5,
    y: baseImg ? parseFloat(baseImg.dataset.y) : 0.5,
    rotation: baseImg ? parseFloat(baseImg.dataset.rotation) : 0.5
  };

  try { await setDoc(doc(db, "diary", key), data); } catch (err) { console.error("저장 실패:", err); }
}

// 🔥 스티커 생성 함수
function addSticker(text = "", x = null, y = null, font = null, color = null, locked = false) {
  const maxX = window.innerWidth - 140;
  const maxY = window.innerHeight - 140;

  if (x === null) x = Math.random() * maxX;
  if (y === null) y = Math.random() * maxY;

  const sticker = document.createElement("div");
  sticker.className = "sticker";

  const img = document.createElement("img");
  // 이미지 경로 오류 방지를 위해 랜덤 인덱스 확인
  const randomIndex = Math.floor(Math.random() * stickerImages.length);
  img.src = stickerImages[randomIndex];
  img.onerror = () => { console.error(`이미지 로드 실패: ${img.src}`); }; // 에러 로그 추가

  const textarea = document.createElement("textarea");
  textarea.className = "sticker-text";
  textarea.value = text;
  textarea.style.fontFamily = font || fonts[Math.floor(Math.random() * fonts.length)];
  textarea.style.color = color || colors[Math.floor(Math.random() * colors.length)];

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

  // 💥 한글 입력 문제 해결: compositionStart/End 사용
  let isComposing = false;
  textarea.addEventListener("compositionstart", () => { isComposing = true; });
  textarea.addEventListener("compositionend", () => { 
    isComposing = false; 
    saveData(); // 한글 입력이 완전히 끝났을 때만 저장
  });

  textarea.addEventListener("input", () => {
    if (!isComposing) saveData(); // 영문이나 숫자는 즉시 저장
  });

  textarea.addEventListener("blur", () => {
    if (textarea.value.trim() !== "") {
      textarea.readOnly = true;
      textarea.style.pointerEvents = "none";
      saveData();
    }
  });
  
  if (!isRendering) saveData();
}

// 🔥 드래그 기능 (기존과 동일)
function makeDraggable(el, textarea) {
  let offsetX, offsetY;
  let isDragging = false;
  el.addEventListener("mousedown", (e) => {
    if (e.target === textarea && !textarea.readOnly) return;
    isDragging = true;
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
  });
  function move(e) {
    if (!isDragging) return;
    el.style.left = (e.clientX - offsetX) + "px";
    el.style.top = (e.clientY - offsetY) + "px";
  }
  function stop() {
    isDragging = false;
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", stop);
    saveData();
  }
}

// 🔥 실시간 반영 (기존과 동일)
let unsubscribe = null;
function listenRealtime() {
  if (unsubscribe) unsubscribe();
  const key = formatDate(currentDate);
  unsubscribe = onSnapshot(doc(db, "diary", key), (docSnap) => {
    isRendering = true;
    canvas.innerHTML = "";
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.baseImage) {
        const img = document.createElement("img");
        img.id = "baseImage";
        img.src = data.baseImage;
        img.style.position = "absolute";
        img.style.width = "300px";
        img.style.left = (data.x * (window.innerWidth - 300)) + "px";
        img.style.top = (data.y * (window.innerHeight - 300)) + "px";
        img.dataset.x = data.x;
        img.dataset.y = data.y;
        img.dataset.rotation = data.rotation;
        canvas.appendChild(img);
      }
      data.stickers?.forEach(s => addSticker(s.text, s.x, s.y, s.font, s.color, s.locked));
    }
    isRendering = false;
  });
}

// 🔥 이벤트 바인딩
prevBtn.addEventListener("click", () => { currentDate.setDate(currentDate.getDate() - 1); updateDate(); listenRealtime(); });
nextBtn.addEventListener("click", () => { currentDate.setDate(currentDate.getDate() + 1); updateDate(); listenRealtime(); });
addStickerBtn.addEventListener("click", () => addSticker());
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const key = formatDate(currentDate);
    await setDoc(doc(db, "diary", key), { baseImage: reader.result, stickers: [], x: Math.random(), y: Math.random(), rotation: Math.random() }, { merge: true });
  };
  reader.readAsDataURL(file);
});

updateDate();
listenRealtime();
