const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const addStickerBtn = document.getElementById("addStickerBtn");

// 스티커 텍스트용 랜덤 폰트 (시스템 UI는 style.css에서 NeoDunggeunmo로 고정)
const STICKER_FONTS = ["'NeoDunggeunmo'", "'Gaegu'", "'Nanum Pen Script'", "'Gowun Dodum'", "Arial", "cursive"];
const colors = ["#ff0000", "#0000ff", "#008000", "#ff00ff", "#000000", "#ff6600"];
const stickerImages = ["s01.png","s02.png","s03.png","s04.png","s05.png","s06.png","s07.png","s08.png","s09.png","s10.png"];

let currentDate = new Date();
let isRendering = false;

function formatDate(date) {
    return date.toISOString().split("T")[0];
}

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
    
    const baseImg = document.querySelector("#baseImage");
    const dataToSave = {
        baseImage: baseImg ? baseImg.src : "",
        stickers: stickersData,
        imgX: baseImg ? parseInt(baseImg.style.left) : 0,
        imgY: baseImg ? parseInt(baseImg.style.top) : 0,
        imgRotation: baseImg ? baseImg.dataset.rotation : 0
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

function addSticker(text = "", x = null, y = null, width = null, rotation = null, font = null, color = null, locked = false, savedImg = null) {
    const sticker = document.createElement("div");
    sticker.className = "sticker";
    
    // 크기 랜덤 제한: 100px ~ 130px
    const randomWidth = width || Math.floor(Math.random() * 31) + 100;
    sticker.style.width = randomWidth + "px";

    const img = document.createElement("img");
    img.src = savedImg || stickerImages[Math.floor(Math.random() * stickerImages.length)];
    
    const textarea = document.createElement("textarea");
    textarea.className = "sticker-text";
    textarea.value = text;
    
    // 🔥 스티커 폰트만 랜덤하게 적용
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
    
    // 각도 제한: -20 ~ 20도
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
        
        const posX = data.imgX !== undefined ? data.imgX : Math.random() * (window.innerWidth - 350);
        const posY = data.imgY !== undefined ? data.imgY : Math.random() * (window.innerHeight - 350);
        const rot = data.imgRotation !== undefined ? data.imgRotation : Math.random() * 30 - 15;
        
        img.style.left = posX + "px";
        img.style.top = posY + "px";
        img.style.transform = `rotate(${rot}deg)`;
        img.dataset.rotation = rot;
        canvas.appendChild(img);
    }
    if (data.stickers) {
        data.stickers.forEach(s => addSticker(s.text, s.x, s.y, s.width, s.rotation, s.font, s.color, s.locked, s.imgSrc));
    }
    isRendering = false;
}

// 바탕화면 더블클릭 초기화 이스터에그
canvas.addEventListener("dblclick", (e) => {
    if (e.target === canvas || e.target.id === "baseImage") {
        if (confirm("초기화하시겠습니까? (이 날의 기록이 모두 삭제됩니다)")) {
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
            imgX: Math.random() * (window.innerWidth - 350),
            imgY: Math.random() * (window.innerHeight - 350),
            imgRotation: Math.random() * 30 - 15
        };
        localStorage.setItem(key, JSON.stringify(newData));
        loadData();
    };
    reader.readAsDataURL(file);
});

dateEl.innerText = formatDate(currentDate);
loadData();
