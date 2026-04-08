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

const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const addStickerBtn = document.getElementById("addStickerBtn");

const fonts = ["Gaegu", "Nanum Pen Script", "Gowun Dodum"];
const colors = ["#000000", "#ff5c5c", "#ffb84d", "#4d94ff"];
// ⚠️ 파일명을 깃허브 상의 영문 이름과 꼭 맞춰주세요 (예: s01.png)
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

let currentDate = new Date();
let isRendering = false;
let unsubscribe = null; // 실시간 감시 해제용

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// 🔥 데이터 저장 (현재 선택된 날짜에 저장)
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
      locked: textarea.readOnly,
      imgSrc: el.querySelector("img").getAttribute("src")
    };
  });

  const baseImg = document.querySelector("#baseImage");
  const data = {
    baseImage: baseImg ? baseImg.src : "",
    stickers: stickersData,
    x: baseImg ? parseFloat(baseImg.dataset.x) : 0.5,
    y: baseImg ? parseFloat(baseImg.dataset.y) : 0.5
  };

  try {
    await setDoc(doc(db, "diary", key), data);
  } catch (err) {
    console.error("저장 실패:", err);
  }
}

// 🔥 스티커 생성 (글자 씹힘 방지 로직 고도화)
function addSticker(text = "", x = null, y = null, font = null, color = null, locked = false, savedImg = null) {
  const sticker = document.createElement("div");
  sticker.className = "sticker";

  const img = document.createElement("img");
  img.src = savedImg || stickerImages[Math.floor(Math.random() * stickerImages.length)];
  
  const textarea = document.createElement("textarea");
  textarea.className = "sticker-text";
  textarea.value = text;
  textarea.style.fontFamily = font || fonts[0];
  textarea.style.color = color || colors[0];
  
  if (locked) {
    textarea.readOnly = true;
    textarea.style.pointerEvents = "none";
  }

  sticker.appendChild(img);
  sticker.appendChild(textarea);
  sticker.style.left = (x || 50) + "px";
  sticker.style.top = (y || 50) + "px";

  makeDraggable(sticker, textarea);
  canvas.appendChild(sticker);

  // 💥 한글 씹힘 방지: 입력 중에는 실시간 저장을 막음
  let isComposing = false;
  textarea.addEventListener("compositionstart", () => { isComposing = true; });
  textarea.addEventListener("compositionend", () => { 
    isComposing = false; 
    // 조합이 끝난 후 바로 저장하지 않고 blur 시점에 저장하도록 유도 (포커스 뺏김 방지)
  });

  textarea.addEventListener("blur", () => {
    if (textarea.value.trim() !== "") {
      textarea.readOnly = true;
      textarea.style.pointerEvents = "none";
    }
    saveData(); // 입력이 완전히 끝나고 창을 나갈 때만 DB에 저장
  });
}

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
    if (isDragging) {
      isDragging = false;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
      saveData();
    }
  }
}

// 🔥 날짜별 실시간 감시 함수
function listenRealtime() {
  if (unsubscribe) unsubscribe(); // 이전 날짜 감시 중단

  const key = formatDate(currentDate);
  dateEl.innerText = key;

  unsubscribe = onSnapshot(doc(db, "diary", key), (docSnap) => {
    if (isRendering) return;
    isRendering = true;
    
    // 💥 중요: 현재 내가 타이핑 중인 스티커가 있다면 화면을 갱신하지 않음 (글자 끊김 방지)
    const activeTextarea = document.activeElement;
    if (activeTextarea && activeTextarea.tagName === "TEXTAREA") {
      isRendering = false;
      return;
    }

    canvas.innerHTML = "";
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.baseImage) {
        const img = document.createElement("img");
        img.id = "baseImage";
        img.src = data.baseImage;
        img.style.position = "absolute";
        img.style.width = "400px";
        img.style.left = (data.x * (window.innerWidth - 400)) + "px";
        img.style.top = (data.y * (window.innerHeight - 400)) + "px";
        canvas.appendChild(img);
      }
      data.stickers?.forEach(s => addSticker(s.text, s.x, s.y, s.font, s.color, s.locked, s.imgSrc));
    }
    isRendering = false;
  });
}

prevBtn.addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() - 1);
  listenRealtime();
});

nextBtn.addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() + 1);
  listenRealtime();
});

addStickerBtn.addEventListener("click", () => addSticker());

upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const key = formatDate(currentDate);
    await setDoc(doc(db, "diary", key), {
      baseImage: reader.result,
      stickers: [],
      x: Math.random(),
      y: Math.random()
    }, { merge: true });
  };
  reader.readAsDataURL(file);
});

// 초기 실행
listenRealtime();
