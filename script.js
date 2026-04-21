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

// 탭 전환
function openTab(evt, tabName) {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
    if(tabName === 'tab3') updateArchive();
}

// 시한폭탄 타이머
function startBombTimer() {
    setInterval(() => {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;
        const h = String(Math.floor((diff / 3600000) % 24)).padStart(2, '0');
        const m = String(Math.floor((diff / 60000) % 60)).padStart(2, '0');
        const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
        const ms = String(Math.floor((diff % 1000) / 10)).padStart(2, '0');
        const timer = document.getElementById("bombTimer");
        if(timer) timer.innerText = `${h}:${m}:${s}:${ms}`;
    }, 41);
}

// 데이터 저장/로드
function formatDate(date) { return date.toISOString().split("T")[0]; }

function isPastDate(date) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(date);
    target.setHours(0,0,0,0);
    return target < today; // 오늘보다 이전 날짜면 true
}

function saveData() {
    if (isRendering || isPastDate(currentDate)) return; // 과거면 저장 안함
    const key = formatDate(currentDate);
    const stickers = Array.from(document.querySelectorAll(".sticker")).map(el => {
        const t = el.querySelector("textarea");
        return { text: t.value, x: parseInt(el.style.left), y: parseInt(el.style.top), width: parseInt(el.style.width), rotation: el.dataset.rotation, font: t.style.fontFamily, imgSrc: el.querySelector("img").getAttribute("src") };
    });
    const photos = Array.from(document.querySelectorAll(".user-photo")).map(el => ({ src: el.src, x: parseInt(el.style.left), y: parseInt(el.style.top), rotation: el.dataset.rotation }));
    localStorage.setItem(key, JSON.stringify({ stickers, photos }));
}

function loadData() {
    const key = formatDate(currentDate);
    const data = JSON.parse(localStorage.getItem(key)) || { stickers: [], photos: [] };
    renderData(data);
}

function renderData(data) {
    isRendering = true; canvas.innerHTML = "";
    const readOnly = isPastDate(currentDate);
    if (data.photos) data.photos.forEach(p => addPhoto(p.src, p.x, p.y, p.rotation, readOnly));
    if (data.stickers) data.stickers.forEach(s => addSticker(s.text, s.x, s.y, s.width, s.rotation, s.font, s.imgSrc, readOnly));
    isRendering = false;
}

function addPhoto(src, x=null, y=null, rot=null, readOnly=false) {
    const img = document.createElement("img");
    img.className = "user-photo"; img.src = src;
    img.style.left = (x || Math.random() * (innerWidth - 250)) + "px";
    img.style.top = (y || Math.random() * (innerHeight - 250)) + "px";
    const r = rot || (Math.random() * 30 - 15);
    img.style.transform = `rotate(${r}deg)`; img.dataset.rotation = r;
    if(!readOnly) makeDraggable(img);
    canvas.appendChild(img);
}

function addSticker(text="", x=null, y=null, w=null, rot=null, font=null, imgS=null, readOnly=false) {
    const s = document.createElement("div"); s.className = "sticker";
    s.style.width = (w || Math.floor(Math.random() * 31) + 100) + "px";
    const img = document.createElement("img"); img.src = imgS || stickerImages[Math.floor(Math.random()*10)];
    const t = document.createElement("textarea"); t.className = "sticker-text"; t.value = text;
    t.style.fontFamily = font || STICKER_FONTS[Math.floor(Math.random()*11)];
    if(readOnly || text.trim() !== "") { t.readOnly = true; t.style.pointerEvents = "none"; }
    s.append(img, t);
    s.style.left = (x || Math.random() * (innerWidth - 150)) + "px";
    s.style.top = (y || Math.random() * (innerHeight - 150)) + "px";
    const r = rot || (Math.random() * 40 - 20);
    s.style.transform = `rotate(${r}deg)`; s.dataset.rotation = r;
    if(!readOnly) makeDraggable(s, t);
    canvas.appendChild(s);
    t.onblur = () => { if(t.value.trim()!="") { t.readOnly=true; t.style.pointerEvents="none"; } saveData(); };
}

function makeDraggable(el, txt=null) {
    el.onmousedown = (e) => {
        if(txt && e.target === txt && !txt.readOnly) return;
        el.style.zIndex = 2000;
        let ox = e.clientX - el.offsetLeft, oy = e.clientY - el.offsetTop;
        document.onmousemove = (me) => { el.style.left = (me.clientX - ox) + "px"; el.style.top = (me.clientY - oy) + "px"; };
        document.onmouseup = () => { document.onmousemove = null; el.style.zIndex = ""; saveData(); };
    };
}

function updateArchive() {
    archiveListEl.innerHTML = "";
    Object.keys(localStorage).sort().reverse().forEach(key => {
        const div = document.createElement("div"); div.className = "archive-item"; div.innerText = key;
        div.onclick = () => { currentDate = new Date(key); dateEl.innerText = key; loadData(); openTab({currentTarget: document.querySelector('.tab-btn')}, 'tab1'); };
        archiveListEl.appendChild(div);
    });
}

prevBtn.onclick = () => { currentDate.setDate(currentDate.getDate()-1); dateEl.innerText = formatDate(currentDate); loadData(); };
nextBtn.onclick = () => { currentDate.setDate(currentDate.getDate()+1); dateEl.innerText = formatDate(currentDate); loadData(); };
addStickerBtn.onclick = () => { if(!isPastDate(currentDate)) addSticker(); };
upload.onchange = (e) => { if(!isPastDate(currentDate)) Array.from(e.target.files).forEach(f => { const r = new FileReader(); r.onload=()=>{addPhoto(r.result);saveData();}; r.readAsDataURL(f); }); };

startBombTimer();
dateEl.innerText = formatDate(currentDate);
loadData();
