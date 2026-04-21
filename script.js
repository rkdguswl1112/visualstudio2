// --- 기존 변수들 ---
const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const addStickerBtn = document.getElementById("addStickerBtn");
const archiveListEl = document.getElementById("archiveList");

const STICKER_FONTS = ["'Gaegu'", "'Nanum Pen Script'", "'Gowun Dodum'", "'Gamja Flower'", "'Hi Melody'", "'Single Day'", "'East Sea Dokdo'", "'Poor Story'", "'Black Han Sans'", "'Dokdo'", "'NeoDunggeunmo'"];
const stickerImages = ["s01.png","s02.png","s03.png","s04.png","s05.png","s06.png","s07.png","s08.png","s09.png","s10.png"];
let currentDate = new Date();
let isRendering = false;

// 🔥 탭 전환 함수
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }
    const tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) {
        tabBtns[i].classList.remove("active");
    }
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");

    if(tabName === 'tab3') updateArchive(); // 보관함 탭 클릭 시 목록 갱신
}

// 🔥 보관함 업데이트 함수
function updateArchive() {
    archiveListEl.innerHTML = "";
    // 로컬스토리지의 모든 키(날짜)를 가져와서 정렬
    const keys = Object.keys(localStorage).sort().reverse();
    
    if (keys.length === 0) {
        archiveListEl.innerHTML = "<p>아직 기록된 일기가 없습니다.</p>";
        return;
    }

    keys.forEach(key => {
        const item = document.createElement("div");
        item.className = "archive-item";
        item.innerText = key;
        item.onclick = () => {
            currentDate = new Date(key);
            dateEl.innerText = key;
            loadData();
            document.querySelector('[onclick*="tab1"]').click(); // 다이어리 탭으로 이동
        };
        archiveListEl.appendChild(item);
    });
}

// --- 기존 다이어리 로직 (saveData, loadData, addPhoto, addSticker 등 동일) ---

function formatDate(date) { return date.toISOString().split("T")[0]; }

function saveData() {
    if (isRendering) return;
    const key = formatDate(currentDate);
    const stickersData = Array.from(document.querySelectorAll(".sticker")).map(el => {
        const textarea = el.querySelector("textarea");
        return { text: textarea.value, x: parseInt(el.style.left), y: parseInt(el.style.top), width: parseInt(el.style.width), rotation: el.dataset.rotation, font: textarea.style.fontFamily, color: textarea.style.color, locked: textarea.readOnly, imgSrc: el.querySelector("img").getAttribute("src") };
    });
    const photosData = Array.from(document.querySelectorAll(".user-photo")).map(el => ({ src: el.src, x: parseInt(el.style.left), y: parseInt(el.style.top), rotation: el.dataset.rotation }));
    localStorage.setItem(key, JSON.stringify({ stickers: stickersData, photos: photosData }));
}

function loadData() {
    const key = formatDate(currentDate);
    const savedData = localStorage.getItem(key);
    renderData(savedData ? JSON.parse(savedData) : { stickers: [], photos: [] });
}

function addPhoto(src, x = null, y = null, rotation = null) {
    const img = document.createElement("img");
    img.className = "user-photo";
    img.src = src;
    img.style.left = (x !== null ? x : Math.random() * (window.innerWidth - 250)) + "px";
    img.style.top = (y !== null ? y : Math.random() * (window.innerHeight - 250)) + "px";
    const rot = rotation !== null ? rotation : Math.random() * 30 - 15;
    img.style.transform = `rotate(${rot}deg)`;
    img.dataset.rotation = rot;
    makeDraggable(img);
    canvas.appendChild(img);
}

function addSticker(text="", x=null, y=null, width=null, rotation=null, font=null, color=null, locked=false, savedImg=null) {
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
    sticker.appendChild(img);
    sticker.appendChild(textarea);
    sticker.style.left = (x !== null ? x : Math.random() * (window.innerWidth - 150)) + "px";
    sticker.style.top = (y !== null ? y : Math.random() * (window.innerHeight - 150)) + "px";
    const rot = rotation !== null ? rotation : Math.random() * 40 - 20;
    sticker.style.transform = `rotate(${rot}deg)`;
    sticker.dataset.rotation = rot;
    makeDraggable(sticker, textarea);
    canvas.appendChild(sticker);
    textarea.addEventListener("blur", () => { if (textarea.value.trim() !== "") { textarea.readOnly = true; textarea.style.pointerEvents = "none"; } saveData(); });
}

function makeDraggable(el, textarea = null) {
    let offsetX, offsetY, isDragging = false;
    el.addEventListener("mousedown", (e) => {
        if (textarea && e.target === textarea && !textarea.readOnly) return;
        isDragging = true; el.style.zIndex = 2000;
        const rect = el.getBoundingClientRect();
        offsetX = e.clientX - rect.left; offsetY = e.clientY - rect.top;
        document.onmousemove = (me) => { if (isDragging) { el.style.left = (me.clientX - offsetX) + "px"; el.style.top = (me.clientY - offsetY) + "px"; } };
        document.onmouseup = () => { isDragging = false; el.style.zIndex = ""; document.onmousemove = null; saveData(); };
    });
}

function renderData(data) {
    isRendering = true; canvas.innerHTML = "";
    if (data.photos) data.photos.forEach(p => addPhoto(p.src, p.x, p.y, p.rotation));
    if (data.stickers) data.stickers.forEach(s => addSticker(s.text, s.x, s.y, s.width, s.rotation, s.font, s.color, s.locked, s.imgSrc));
    isRendering = false;
}

prevBtn.onclick = () => { currentDate.setDate(currentDate.getDate() - 1); dateEl.innerText = formatDate(currentDate); loadData(); };
nextBtn.onclick = () => { currentDate.setDate(currentDate.getDate() + 1); dateEl.innerText = formatDate(currentDate); loadData(); };
addStickerBtn.onclick = () => addSticker();
upload.onchange = (e) => {
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => { addPhoto(reader.result); saveData(); };
        reader.readAsDataURL(file);
    });
};

dateEl.innerText = formatDate(currentDate);
loadData();
