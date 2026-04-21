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

// 🔥 구글 폰트 및 설정 (HTML에 link 태그 확인 필수)
const fonts = ["Gaegu", "Nanum Pen Script", "Gowun Dodum", "Arial"];
const colors = ["#000000", "#ff5c5c", "#ffb84d", "#4d94ff", "#66cc99", "#cc66ff", "#ff66a3"];
const stickerImages = ["s01.png", "s02.png", "s03.png", "s04.png", "s05.png", "s06.png", "s07.png", "s08.png", "s09.png", "s10.png"];

let currentDate = new Date();
let isRendering = false;
let unsubscribe = null;

function formatDate(date) { return date.toISOString().split("T")[0]; }

// 🔥 데이터 저장
async function saveData() {
  if (isRendering) return;
  const key = formatDate(currentDate);
  const stickersData = Array.from(document.querySelectorAll(".sticker")).map(el => {
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
  try {
    await setDoc(doc(db, "diary", key), {
      baseImage: baseImg ? baseImg.src : "",
      stickers: stickersData,
      x: baseImg ? parseFloat(baseImg.dataset.x) : Math.random(),
      y: baseImg ? parseFloat(baseImg.dataset.y) : Math.random(),
      rotation: baseImg ? parseFloat(baseImg.dataset.rotation) : Math.random()
    }, { merge: true });
  } catch (err) { console.error("저장 실패:", err); }
}

// 🔥 스티커 생성 (랜덤 위치, 색상, 폰트)
function addSticker(text = "", x = null, y = null, font = null, color = null, locked = false, savedImg = null) {
  const sticker = document.createElement("div");
  sticker.className = "sticker";

  const img = document.createElement("img");
  img.src = savedImg || `./${stickerImages[Math.floor(Math.random() * stickerImages.length)]}`;
  
  const textarea = document.createElement("textarea");
  textarea.className = "sticker-text";
  textarea.value = text;
  
  // 🎨 랜덤 폰트/색상 설정
  textarea.style.fontFamily = font || fonts[Math.floor(Math.random() * fonts.length)];
  textarea.style.color = color || colors[Math.floor(Math.random() * colors.length)];
  
  if (locked) {
    textarea.readOnly = true;
    textarea.style.pointerEvents = "none";
  }

  sticker.appendChild(img);
  sticker.appendChild(textarea);
  
  // 📍 위치가 없으면 화면 내 랜덤 배치
  sticker.style.left = (x !== null ? x : Math.random() * (window.innerWidth - 150)) + "px";
  sticker.style.top = (y !== null ? y : Math.random() * (window.innerHeight - 150)) + "px";
  sticker.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;

  makeDraggable(sticker, textarea);
  canvas.appendChild(sticker);

  let isComposing = false;
  textarea.addEventListener("compositionstart", () => { isComposing = true; });
  textarea.addEventListener("compositionend", () => { isComposing = false; });

  textarea.addEventListener("blur", () => {
    if (textarea.value.trim() !== "") {
      textarea.readOnly = true;
      textarea.style.pointerEvents = "none";
    }
    saveData();
  });
}

// 🔥 드래그 기능
function makeDraggable(el, textarea) {
  let offsetX, offsetY;
  let isDragging = false;
  el.addEventListener("mousedown", (e) => {
    if (e.target === textarea && !textarea.readOnly) return;
    isDragging = true;
    el.style.zIndex = 1000;
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
      el.style.zIndex = "";
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
      saveData();
    }
  }
}

// 🔥 실시간 공유 (날짜 기반)
function listenRealtime() {
  if (unsubscribe) unsubscribe();
  const key = formatDate(currentDate);
  dateEl.innerText = key;

  unsubscribe = onSnapshot(doc(db, "diary", key), (docSnap) => {
    // 💥 내가 입력 중일 때는 덮어쓰기 방지 (글자 씹힘 방지 핵심)
    if (document.activeElement.tagName === "TEXTAREA") return;

    isRendering = true;
    canvas.innerHTML = "";
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // 배경 이미지 랜덤 좌표 배치
      if (data.baseImage) {
        const img = document.createElement("img");
        img.id = "baseImage";
        img.src = data.baseImage;
        img.style.position = "absolute";
        img.style.width = "400px";
        img.style.left = (data.x * (window.innerWidth - 400)) + "px";
        img.style.top = (data.y * (window.innerHeight - 400)) + "px";
        img.style.transform = `rotate(${data.rotation * 40 - 20}deg)`;
        img.dataset.x = data.x;
        img.dataset.y = data.y;
        img.dataset.rotation = data.rotation;
        canvas.appendChild(img);
      }
      data.stickers?.forEach(s => addSticker(s.text, s.x, s.y, s.font, s.color, s.locked, s.imgSrc));
    }
    isRendering = false;
  });
}

// 이벤트 핸들러
prevBtn.addEventListener("click", () => { currentDate.setDate(currentDate.getDate() - 1); listenRealtime(); });
nextBtn.addEventListener("click", () => { currentDate.setDate(currentDate.getDate() + 1); listenRealtime(); });
addStickerBtn.addEventListener("click", () => addSticker());

upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const key = formatDate(currentDate);
    // 업로드 시 랜덤 위치/회전값 생성
    await setDoc(doc(db, "diary", key), {
      baseImage: reader.result,
      x: Math.random(),
      y: Math.random(),
      rotation: Math.random()
    }, { merge: true });
  };
  reader.readAsDataURL(file);
});

listenRealtime();
