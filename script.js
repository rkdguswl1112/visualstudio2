const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const addStickerBtn = document.getElementById("addStickerBtn");

const STICKER_FONTS = ["'NeoDunggeunmo'", "'Gaegu'", "'Nanum Pen Script'", "'Gowun Dodum'", "Arial", "cursive"];
const colors = ["#ff0000", "#0000ff", "#008000", "#ff00ff", "#000000", "#ff6600"];
const stickerImages = ["s01.png","s02.png","s03.png","s04.png","s05.png","s06.png","s07.png","s08.png","s09.png","s10.png"];

let currentDate = new Date();
let isRendering = false;

function formatDate(date) {
    return date.toISOString().split("T")[0];
}

// 데이터 저장 (사진 배열과 스티커 배열을 각각 저장)
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
            rotation: el.dataset.rotation,
            font: textarea.style.fontFamily,
            color: textarea.style.color,
            locked: textarea.readOnly,
            imgSrc: el.querySelector("img").getAttribute("src")
        };
    });
    
    const photosData = Array.from(document.querySelectorAll(".user-photo")).map(el => {
        return {
            src: el.src,
            x: parseInt(el.style.left),
            y: parseInt(el.style.top),
            rotation: el.dataset.rotation
        };
    });

    localStorage.setItem(key, JSON.stringify({ stickers: stickersData, photos: photosData }));
}

function loadData() {
    const key = formatDate(currentDate);
    const savedData = localStorage.getItem(key);
    if (savedData) {
        renderData(JSON.parse(savedData));
    } else {
        renderData({ stickers: [], photos: [] });
    }
}

// 사진 추가 함수
function addPhoto(src, x = null, y = null, rotation = null) {
    const img = document.createElement("img");
    img.className = "user-photo";
    img.src = src;
    
    const posX = x !== null ? x : Math.random() * (window.innerWidth - 300);
    const posY = y !== null ? y : Math.random() * (window.innerHeight - 300);
    const rot = rotation !== null ? rotation : Math.random() * 30 - 15;

    img.style.left = posX + "px";
    img.style.top = posY + "px";
    img.style.transform = `rotate(${rot}deg)`;
    img.dataset.rotation = rot;

    makeDraggable(img);
    canvas.appendChild(img);
}

// 스티커 추가 함수
function addSticker(text = "", x = null, y = null, width = null, rotation = null, font = null, color = null, locked = false, savedImg = null) {
    const sticker = document.createElement("div");
    sticker.className = "sticker";
    
    const randomWidth = width || Math.floor(Math.random() * 31) + 100;
    sticker.style.width = randomWidth + "px";

    const img = document.createElement("img");
    img.src = savedImg || stickerImages[Math.floor(Math.random() * stickerImages.length)];
    
    const textarea = document.createElement("textarea");
    textarea.className = "sticker-text";
    textarea.value = text;
    textarea.style.fontFamily = font || STICKER_FONTS[Math.floor(Math.random() * STICKER_FONTS.length)];
    textarea.style.color = color || colors[Math.floor(Math.random() * colors.length)];
    
    if (locked) {
        textarea.readOnly = true;
        textarea.style.pointerEvents = "none";
    }
    
    sticker.appendChild(img);
    sticker.appendChild(textarea);
    
    sticker.style.left = (x !== null ? x : Math.random() * (window.innerWidth - 150)) + "px";
    sticker.style.top = (y !== null ? y : Math.random() * (window.innerHeight - 150)) + "px";
    
    const finalRotation = rotation !== null ? rotation : Math.random() * 40 - 20;
    sticker.style.transform = `rotate(${finalRotation}deg)`;
    sticker.dataset.rotation = finalRotation;
    
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

function makeDraggable(el, textarea = null) {
    let offsetX, offsetY;
    let isDragging = false;
    el.addEventListener("mousedown", (e) => {
        if (textarea && e.target === textarea && !textarea.readOnly) return;
        isDragging = true;
        el.style.zIndex = 100;
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
    if (data.photos) {
        data.photos.forEach(p => addPhoto(p.src, p.x, p.y, p.rotation));
    }
    if (data.stickers) {
        data.stickers.forEach(s => addSticker(s.text, s.x, s.y, s.width, s.rotation, s.font, s.color, s.locked, s.imgSrc));
    }
    isRendering = false;
}

canvas.addEventListener("dblclick", (e) => {
    if (e.target === canvas) {
        if (confirm("초기화하시겠습니까?")) {
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
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
            addPhoto(reader.result);
            saveData(); // 각 사진 추가 후 바로 저장
        };
        reader.readAsDataURL(file);
    });
});

dateEl.innerText = formatDate(currentDate);
loadData();
