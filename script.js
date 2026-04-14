const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const addStickerBtn = document.getElementById("addStickerBtn");

// 🔥 설정값: 폰트를 'Gowun Dodum'으로 고정
const FIXED_FONT = "'Gowun Dodum', sans-serif";
const colors = ["#000000", "#ff5c5c", "#ffb84d", "#4d94ff", "#66cc99", "#cc66ff", "#ff66a3"];
const stickerImages = ["s01.png","s02.png","s03.png","s04.png","s05.png","s06.png","s07.png","s08.png","s09.png","s10.png"];

let currentDate = new Date();
let isRendering = false;

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// 🔥 로컬 저장소에 데이터 저장 (서버 POST 대체)
function saveData() {
  if (isRendering) return;

  const key = formatDate(currentDate);
  const stickersData = Array.from(document.querySelectorAll(".sticker")).map(el => {
    const textarea = el.querySelector("textarea");
    return {
      text: textarea.value,
      x: parseInt(el.style.left),
      y: parseInt(el.style.top),
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

// 🔥 데이터 불러오기 (서버 GET 대체)
function loadData() {
  const key = formatDate(currentDate);
  const savedData = localStorage.getItem(key);
  
  if (savedData) {
    renderData(JSON.parse(savedData));
  } else {
    renderData({ baseImage: "", stickers: [] });
  }
}

// 🔥 스티커 생성 (폰트 고정 적용)
function addSticker(text = "", x = null, y = null, color = null, locked = false, savedImg = null) {
  const sticker = document.createElement("div");
  sticker.className = "sticker";

  const img = document.createElement("img");
  img.src = savedImg || stickerImages[Math.floor(Math.random() * stickerImages.length)];

  const textarea = document.createElement("textarea");
  textarea.className = "sticker-text";
  textarea.value = text;
  
  // 폰트 및 스타일 설정
  textarea.style.fontFamily = FIXED_FONT;
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

// 드래그 기능
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

// 화면 렌더링
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
    data.stickers.forEach(s => addSticker(s.text, s.x, s.y, s.color, s.locked, s.imgSrc));
  }
  isRendering = false;
}

// 날짜 이동 이벤트
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

// 🔥 배경 업로드 실행 로직 (정상 작동 수정)
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const key = formatDate(currentDate);
    // 현재 날짜의 기존 데이터(스티커 등) 유지하며 이미지만 업데이트
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

// 초기 실행
dateEl.innerText = formatDate(currentDate);
loadData();
