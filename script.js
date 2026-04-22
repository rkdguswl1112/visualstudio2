const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const addStickerBtn = document.getElementById("addStickerBtn");
const editControls = document.getElementById("editControls");

const STICKER_FONTS = ["'Gaegu'", "'Nanum Pen Script'", "'Gowun Dodum'", "'Gamja Flower'", "'Hi Melody'", "'Single Day'", "'East Sea Dokdo'", "'Poor Story'", "'Black Han Sans'", "'Dokdo'", "'NeoDunggeunmo'"];
const stickerImages = [
    "s01.png","s02.png","s03.png","s04.png","s05.png","s06.png","s07.png","s08.png","s09.png","s10.png",
    "s-11.png","s-12.png","s-13.png","s-14.png","s-15.png","s-16.png","s-17.png","s-18.png","s-19.png","s-20.png",
    "s-21.png","s-22.png","s-23.png","s-24.png","s-25.png","s-26.png","s-27.png","s-28.png","s-29.png","s-30.png"
];

let currentDate = new Date();
let calendarDate = new Date();
let isRendering = false;

function openTab(evt, tabName) {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
    if(tabName === 'tab3') updateArchive();
}

function startTodayTimer() {
    setInterval(() => {
        const now = new Date();
        const mid = new Date(); mid.setHours(24, 0, 0, 0);
        const diff = mid - now;
        const h = String(Math.floor((diff/3600000)%24)).padStart(2,'0');
        const m = String(Math.floor((diff/60000)%60)).padStart(2,'0');
        const s = String(Math.floor((diff/1000)%60)).padStart(2,'0');
        const ms = String(Math.floor((diff%1000)/10)).padStart(2,'0');
        const timer = document.getElementById("todayTimer");
        if(timer) timer.innerText = `${h}:${m}:${s}:${ms}`;
    }, 41);
}

function formatDate(date) { return date.toISOString().split("T")[0]; }

function isNotToday(date) {
    const today = formatDate(new Date());
    const target = formatDate(date);
    return today !== target;
}

function updateUIForDate() {
    if (isNotToday(currentDate)) {
        editControls.classList.add("hidden");
    } else {
        editControls.classList.remove("hidden");
    }
}

function saveData() {
    if (isRendering || isNotToday(currentDate)) return;
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
    dateEl.innerText = key;
    updateUIForDate();
    const data = JSON.parse(localStorage.getItem(key)) || { stickers: [], photos: [] };
    renderData(data);
}

function renderData(data) {
    isRendering = true; canvas.innerHTML = "";
    const ro = isNotToday(currentDate);
    if (data.photos) data.photos.forEach(p => addPhoto(p.src, p.x, p.y, p.rotation, ro));
    if (data.stickers) data.stickers.forEach(s => addSticker(s.text, s.x, s.y, s.width, s.rotation, s.font, s.imgSrc, ro));
    isRendering = false;
}

function addPhoto(src, x=null, y=null, rot=null, ro=false) {
    const img = document.createElement("img"); img.className = "user-photo"; img.src = src;
    img.style.left = (x || Math.random()*(innerWidth-250))+"px"; img.style.top = (y || Math.random()*(innerHeight-250))+"px";
    const r = rot || (Math.random()*30-15); img.style.transform = `rotate(${r}deg)`; img.dataset.rotation = r;
    if(!ro) makeDraggable(img); canvas.appendChild(img);
}

function addSticker(text="", x=null, y=null, w=null, rot=null, font=null, imgS=null, ro=false) {
    const s = document.createElement("div"); s.className = "sticker";
    s.style.width = (w || 120)+"px";
    const img = document.createElement("img"); img.src = imgS || stickerImages[Math.floor(Math.random()*stickerImages.length)];
    const t = document.createElement("textarea"); t.className = "sticker-text"; t.value = text;
    t.style.fontFamily = font || STICKER_FONTS[Math.floor(Math.random()*STICKER_FONTS.length)];
    if(ro || text!=="") { t.readOnly = true; t.style.pointerEvents = "none"; }
    s.append(img, t);
    s.style.left = (x || Math.random()*(innerWidth-150))+"px"; s.style.top = (y || Math.random()*(innerHeight-150))+"px";
    const r = rot || (Math.random()*40-20); s.style.transform = `rotate(${r}deg)`; s.dataset.rotation = r;
    if(!ro) makeDraggable(s, t); canvas.appendChild(s);
    t.onblur = () => { if(t.value!="") { t.readOnly=true; t.style.pointerEvents="none"; } saveData(); };
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

function changeMonth(diff) { calendarDate.setMonth(calendarDate.getMonth() + diff); updateArchive(); }

function updateArchive() {
    const grid = document.getElementById("calendarGrid");
    const title = document.getElementById("calendarTitle");
    grid.innerHTML = "";
    const y = calendarDate.getFullYear(), m = calendarDate.getMonth();
    title.innerText = `${y}년 ${m + 1}월`;
    ["일","월","화","수","목","금","토"].forEach(d => {
        const div = document.createElement("div"); div.className = "calendar-day-label"; div.innerText = d; grid.appendChild(div);
    });
    const first = new Date(y, m, 1).getDay(), last = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < first; i++) grid.appendChild(Object.assign(document.createElement("div"), {className:"calendar-day empty"}));
    for (let d = 1; d <= last; d++) {
        const dayDiv = document.createElement("div"); dayDiv.className = "calendar-day";
        const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        if (dateStr === formatDate(new Date())) dayDiv.classList.add("today");
        if (localStorage.getItem(dateStr)) dayDiv.classList.add("has-record");
        dayDiv.innerHTML = `<span class="day-number">${d}</span>`;
        dayDiv.onclick = () => { currentDate = new Date(dateStr); loadData(); openTab({currentTarget: document.querySelector('.tab-btn')}, 'tab1'); };
        grid.appendChild(dayDiv);
    }
}

prevBtn.onclick = () => { currentDate.setDate(currentDate.getDate()-1); loadData(); };
nextBtn.onclick = () => { currentDate.setDate(currentDate.getDate()+1); loadData(); };
addStickerBtn.onclick = () => { if(!isNotToday(currentDate)) addSticker(); };
upload.onchange = (e) => { if(!isNotToday(currentDate)) Array.from(e.target.files).forEach(f => { const r = new FileReader(); r.onload=()=>{addPhoto(r.result);saveData();}; r.readAsDataURL(f); }); };
canvas.ondblclick = (e) => { if(e.target === canvas && !isNotToday(currentDate) && confirm("초기화할까요?")) { localStorage.removeItem(formatDate(currentDate)); loadData(); } };

startTodayTimer();
loadData();
