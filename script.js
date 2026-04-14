const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const addStickerBtn = document.getElementById("addStickerBtn");

// 🔥 1. 스티커에 적용될 랜덤 폰트 후보들 (픽셀 폰트 포함 여러가지)
const STICKER_FONTS = ["'NeoDunggeunmo'", "Gaegu", "Nanum Pen Script", "Gowun Dodum", "Arial", "cursive"];
const SYSTEM_FONT = "'NeoDunggeunmo', sans-serif";

const colors = ["#ff0000", "#0000ff", "#008000", "#ff00ff", "#000000", "#ff6600"];
const stickerImages = ["s01.png","s02.png","s03.png","s04.png","s05.png","s06.png","s07.png","s08.png","s09.png","s10.png"];

let currentDate = new Date();
let isRendering = false;

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// 데이터 저장 (폰트 정보 포함)
function saveData() {
  if (isRendering) return;
  const key = formatDate(currentDate);
  const stickersData = Array.from(document.querySelectorAll(".sticker")).map(el => {
    const textarea = el.querySelector("textarea");
    return {
      text: textarea.value,
      x: parseInt(el.style.left),
      y: parseInt(el.style.top),
      width: parseInt(el.style.width),
      font: textarea.style.fontFamily, // 🔥 개별 폰트 저장
      color: textarea.style.color,
      locked: textarea.readOnly,
      imgSrc: el.querySelector("img").getAttribute("src")
    };
  });
  const baseImg = document.querySelector("#baseImage");
  const dataToSave = {
    baseImage: baseImg ? baseImg.src : "",
    stickers: stickersData,
    x: baseImg ? parseFloat(baseImg.dataset.x) : 0.5,
    y: baseImg ? parseFloat(baseImg.dataset.y) : 0.5,
    rotation: baseImg ? parseFloat(baseImg.dataset.rotation) : 0
  };
  localStorage.setItem(key, JSON.stringify(dataToSave));
}

function loadData() {
  const key = formatDate(currentDate);
  const savedData = localStorage.getItem(key);
  if (savedData) {
    renderData(JSON.parse(savedData));
  } else {
    renderData({ baseImage: "", stickers: [] });
  }
}

// 🔥 2. 스티커 생성 시 폰트를 랜덤하게 부여
function addSticker(text = "", x = null, y = null, width = null, font = null, color = null, locked = false, savedImg = null) {
  const sticker = document.createElement("div");
  sticker.className = "sticker";
  
  const randomWidth = width || Math.floor(Math.random() * 51) + 100;
  sticker.style.width = randomWidth + "px";

  const img = document.createElement("img");
  img.src = savedImg || stickerImages[Math.floor(Math.random() * stickerImages.length)];
  
  const textarea = document.createElement("textarea");
  textarea.className = "sticker-text";
  textarea.value = text;
  
  // 🔥 저장된 폰트가 있으면 쓰고, 없으면 랜덤 리스트에서 선택
  textarea.style.fontFamily = font || STICKER_FONTS[Math.floor(Math.random() * STICKER_FONTS.length)];
  textarea.style.color = color || colors[Math.floor(Math.random() * colors.length)];
  
  if (locked) {
    textarea.readOnly = true;
    textarea.style.pointerEvents = "none";
  }
  
  sticker.appendChild(img);
  sticker.appendChild(textarea);
  
  sticker.style.left = (x !== null ? x : Math.random() * (window.innerWidth - 200)) + "px";
  sticker.style.top = (y !== null ? y : Math.random() * (window.innerHeight - 200)) + "px";
  
  makeDraggable(sticker, textarea);
  canvas.appendChild(sticker);
  
  textarea.addEventListener("blur", () => {
    if (textarea.value.trim() !== "") {
      textarea.readOnly = true;
      textarea.style.pointerEvents = "none";
    }
    saveData();
  });
}

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
    isDragging = false;
    el.style.zIndex = "";
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", stop);
    saveData();
  }
}

function renderData(data) {
  isRendering = true;
  canvas.innerHTML = "";
  if (data.baseImage) {
    const img = document.createElement("img");
    img.id = "baseImage";
    img.src = data.baseImage;
    img.style.position = "absolute";
    img.style.width = "400px";
    img.style.left = (data.x * (window.innerWidth - 400)) + "px";
    img.style.top = (data.y * (window.innerHeight - 400)) + "px";
    img.dataset.x = data.x;
    img.dataset.y = data.y;
    canvas.appendChild(img);
  }
  if (data.stickers) {
    // 렌더링 시 저장된 font 값을 함께 넘겨줍니다.
    data.stickers.forEach(s => addSticker(s.text, s.x, s.y, s.width, s.font, s.color, s.locked, s.imgSrc));
  }
  isRendering = false;
}

// [이스터에그] 바탕화면 더블클릭 초기화
canvas.addEventListener("dblclick", (e) => {
  if (e.target === canvas || e.target.id === "baseImage") {
    if (confirm("초기화하시겠습니까? (이 날의 모든 기록이 삭제됩니다)")) {
      const key = formatDate(currentDate);
      localStorage.removeItem(key);
      loadData();
    }
  }
});

prevBtn.addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() - 1);
  dateEl.innerText = formatDate(currentDate);
  loadData();
});

nextBtn.addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() + 1);
  dateEl.innerText = formatDate(currentDate);
  loadData();
});

addStickerBtn.addEventListener("click", () => addSticker());

upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const key = formatDate(currentDate);
    const savedData = JSON.parse(localStorage.getItem(key) || '{"stickers":[]}');
    const newData = {
      baseImage: reader.result,
      stickers: savedData.stickers,
      x: 0.5,
      y: 0.5,
      rotation: 0
    };
    localStorage.setItem(key, JSON.stringify(newData));
    loadData();
  };
  reader.readAsDataURL(file);
});

// 초기화: 날짜 UI는 픽셀 폰트로
dateEl.innerText = formatDate(currentDate);
dateEl.style.fontFamily = SYSTEM_FONT;
loadData();
