const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const addStickerBtn = document.getElementById("addStickerBtn");

// 🔥 폰트 설정 (시스템 UI 고정 / 스티커 랜덤)
const RANDOM_FONTS = ["Gaegu", "Nanum Pen Script", "Gowun Dodum", "Arial"];
const SYSTEM_FONT = "'Gowun Dodum', sans-serif";

const colors = ["#000000", "#ff5c5c", "#ffb84d", "#4d94ff", "#66cc99", "#cc66ff", "#ff66a3"];
const stickerImages = ["s01.png","s02.png","s03.png","s04.png","s05.png","s06.png","s07.png","s08.png","s09.png","s10.png"];

let currentDate = new Date();
let isRendering = false;

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// 🔥 데이터 저장
function saveData() {
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
  const dataToSave = {
    baseImage: baseImg ? baseImg.src : "",
    stickers: stickersData,
    x: baseImg ? parseFloat(baseImg.dataset.x) : 0.5,
    y: baseImg ? parseFloat(baseImg.dataset.y) : 0.5,
    rotation: baseImg ? parseFloat(baseImg.dataset.rotation) : 0
  };
  localStorage.setItem(key, JSON.stringify(dataToSave));
}

// 🔥 데이터 불러오기
function loadData() {
  const key = formatDate(currentDate);
  const savedData = localStorage.getItem(key);
  if (savedData) {
    renderData(JSON.parse(savedData));
  } else {
    renderData({ baseImage: "", stickers: [] });
  }
}

// 🔥 스티커 생성 (폰트 랜덤)
function addSticker(text = "", x = null, y = null, font = null, color = null, locked = false, savedImg = null) {
  const sticker = document.createElement("div");
  sticker.className = "sticker";
  const img = document.createElement("img");
  img.src = savedImg || stickerImages[Math.floor(Math.random() * stickerImages.length)];
  const textarea = document.createElement("textarea");
  textarea.className = "sticker-text";
  textarea.value = text;
  textarea.style.fontFamily = font || RANDOM_FONTS[Math.floor(Math.random() * RANDOM_FONTS.length)];
  textarea.style.color = color || colors[Math.floor(Math.random() * colors.length)];
  if (locked) {
    textarea.readOnly = true;
    textarea.style.pointerEvents = "none";
  }
  sticker.appendChild(img);
  sticker.appendChild(textarea);
  sticker.style.left = (x !== null ? x : Math.random() * (window.innerWidth - 150)) + "px";
  sticker.style.top = (y !== null ? y : Math.random() * (window.innerHeight - 150)) + "px";
  sticker.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;
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
    img.style.transform = `rotate(${data.rotation * 40 - 20}deg)`;
    img.dataset.x = data.x;
    img.dataset.y = data.y;
    img.dataset.rotation = data.rotation;
    canvas.appendChild(img);
  }
  if (data.stickers) {
    data.stickers.forEach(s => addSticker(s.text, s.x, s.y, s.font, s.color, s.locked, s.imgSrc));
  }
  isRendering = false;
}

// 🔥 [이스터에그] 바탕화면 두 번 클릭 시 초기화
canvas.addEventListener("dblclick", (e) => {
  // 스티커를 클릭한 게 아니라 순수 바탕화면(또는 배경이미지)을 더블클릭했을 때만 작동
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

// 초기 설정
dateEl.innerText = formatDate(currentDate);
dateEl.style.fontFamily = SYSTEM_FONT;
loadData();
