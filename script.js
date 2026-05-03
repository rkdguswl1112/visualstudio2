const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const addStickerBtn = document.getElementById("addStickerBtn");
const editControls = document.getElementById("editControls");

const STICKER_FONTS = ["'Gaegu'", "'Nanum Pen Script'", "'Gowun Dodum'", "'Gamja Flower'", "'Hi Melody'", "'Single Day'", "'East Sea Dokdo'", "'Poor Story'", "'Black Han Sans'", "'Dokdo'"];
const stickerImages = ["s01.png", "s02.png", "s03.png", "s04.png", "s05.png", "s06.png", "s07.png", "s08.png", "s09.png", "s10.png", "s-11.png", "s-14.png", "s-16.png", "s-17.png", "s-18.png", "s-19.png", "s-20.png", "s-24.png", "s-25.png", "s-26.png", "s-27.png", "s-28.png", "s-29.png"];

// [수정] 고정된 날짜가 아닌, 실제 오늘 날짜를 가져오도록 변경
function getTodayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const REAL_TODAY_STR = getTodayStr();
let currentDate = new Date(); // 현재 보고 있는 페이지 날짜
let calendarDate = new Date(); // 보관함 기준 날짜
let isRendering = false;
let topZIndex = 100;

function updateUIVisibility() {
    const isToday = formatDate(currentDate) === REAL_TODAY_STR;
    if (editControls) editControls.style.display = isToday ? "flex" : "none";
}

function openTab(evt, tabName) {
    document.querySelectorAll(".tab-content").forEach(c => { c.style.display = "none"; });
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    const targetTab = document.getElementById(tabName);
    if (targetTab) targetTab.style.display = "block";
    evt.currentTarget.classList.add("active");
    if(tabName === 'tab3') updateArchive();
}

function startTodayTimer() {
    function update() {
        const now = new Date();
        const mid = new Date(); mid.setHours(24, 0, 0, 0);
        const diff = mid - now;
        if (diff <= 0) { document.getElementById("todayTimer").innerText = "00:00:00:00"; return; }
        const h = String(Math.floor((diff/3600000)%24)).padStart(2,'0');
        const m = String(Math.floor((diff/60000)%60)).padStart(2,'0');
        const s = String(Math.floor((diff/1000)%60)).padStart(2,'0');
        const ms = String(Math.floor((diff%1000)/10)).padStart(2,'0');
        const timer = document.getElementById("todayTimer");
        if (timer) timer.innerText = `${h}:${m}:${s}:${ms}`;
    }
    setInterval(update, 41);
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function saveData() {
    if (isRendering) return;
    const key = formatDate(currentDate);
    if (key !== REAL_TODAY_STR) return; // 오늘이 아니면 저장 불가

    const stickers = Array.from(document.querySelectorAll(".sticker")).map(el => {
        const t = el.querySelector("textarea");
        return { text: t.value, x: el.style.left, y: el.style.top, rotation: el.dataset.rotation, font: t.style.fontFamily, imgSrc: el.querySelector("img").getAttribute("src") };
    });
    const photos = Array.from(document.querySelectorAll(".user-photo")).map(el => ({ src: el.src, x: el.style.left, y: el.style.top, rotation: el.dataset.rotation }));
    
    localStorage.setItem(`diary_storage_${key}`, JSON.stringify({ stickers, photos }));

    let recorded = JSON.parse(localStorage.getItem("recorded_dates_list") || "[]");
    if (!recorded.includes(key)) {
        recorded.push(key);
        localStorage.setItem("recorded_dates_list", JSON.stringify(recorded));
    }
}

function loadData() {
    const key = formatDate(currentDate);
    dateEl.innerText = key;
    updateUIVisibility();
    const saved = localStorage.getItem(`diary_storage_${key}`);
    const data = saved ? JSON.parse(saved) : { stickers: [], photos: [] };
    renderData(data);
}

function renderData(data) {
    isRendering = true; 
    canvas.innerHTML = "";
    const isToday = formatDate(currentDate) === REAL_TODAY_STR;
    if (data.photos) data.photos.forEach(p => addPhoto(p.src, p.x, p.y, p.rotation, isToday));
    if (data.stickers) data.stickers.forEach(s => addSticker(s.text, s.x, s.y, s.rotation, s.font, s.imgSrc, isToday));
    isRendering = false;
}

function addPhoto(src, x=null, y=null, rot=null, isEditable=true) {
    const img = document.createElement("img"); 
    img.className = "user-photo"; 
    img.src = src;
    img.style.left = x || (Math.max(50, Math.random()*(innerWidth-300)))+"px"; 
    img.style.top = y || (Math.max(150, Math.random()*(innerHeight-300)))+"px";
    const r = rot || (Math.random()*20-10); 
    img.style.transform = `rotate(${r}deg)`; 
    img.dataset.rotation = r;
    if (isEditable) makeDraggable(img);
    canvas.appendChild(img);
}

function addSticker(text="", x=null, y=null, rot=null, font=null, imgS=null, isEditable=true) {
    const s = document.createElement("div"); 
    s.className = "sticker";
    const img = document.createElement("img"); 
    img.src = imgS || stickerImages[Math.floor(Math.random()*stickerImages.length)];
    const t = document.createElement("textarea"); 
    t.className = "sticker-text"; 
    t.value = text;
    t.readOnly = !isEditable; 
    t.style.fontFamily = font || STICKER_FONTS[Math.floor(Math.random()*STICKER_FONTS.length)];
    s.append(img, t);
    s.style.left = x || (Math.random()*(innerWidth-200))+"px"; 
    s.style.top = y || (Math.random()*(innerHeight-200))+"px";
    const r = rot || (Math.random()*40-20); 
    s.style.transform = `rotate(${r}deg)`; 
    s.dataset.rotation = r;
    if (isEditable) { makeDraggable(s, t); t.oninput = saveData; }
    canvas.appendChild(s);
}

function makeDraggable(el, txt=null) {
    let isDragging = false;
    let sx, sy;
    const startMove = (cx, cy) => {
        isDragging = true;
        el.style.zIndex = ++topZIndex;
        let rect = el.getBoundingClientRect();
        sx = cx - rect.left; sy = cy - rect.top;
        const move = (me) => {
            if (!isDragging) return;
            const mx = me.clientX || (me.touches && me.touches[0].clientX);
            const my = me.clientY || (me.touches && me.touches[0].clientY);
            el.style.left = (mx - sx) + "px"; 
            el.style.top = (my - sy) + "px";
        };
        const stop = () => { isDragging = false; saveData(); document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", stop); };
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
    };
    el.onmousedown = (e) => { if(txt && e.target === txt) return; startMove(e.clientX, e.clientY); };
}

function updateArchive() {
    const grid = document.getElementById("calendarGrid");
    const title = document.getElementById("calendarTitle");
    grid.innerHTML = "";
    const y = calendarDate.getFullYear(), m = calendarDate.getMonth();
    title.innerText = `${y}년 ${m + 1}월`;
    const recorded = JSON.parse(localStorage.getItem("recorded_dates_list") || "[]");
    const first = new Date(y, m, 1).getDay(), last = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < first; i++) grid.appendChild(Object.assign(document.createElement("div"), {className:"calendar-day empty"}));
    for (let d = 1; d <= last; d++) {
        const dayDiv = document.createElement("div"); 
        dayDiv.className = "calendar-day";
        const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        dayDiv.innerHTML = `<span>${d}</span>`;
        if (recorded.includes(dateStr)) dayDiv.classList.add("has-record");
        if (dateStr === REAL_TODAY_STR) dayDiv.classList.add("today");
        dayDiv.onclick = () => { currentDate = new Date(dateStr); loadData(); openTab({currentTarget: document.querySelector('.tab-btn')}, 'tab1'); };
        grid.appendChild(dayDiv);
    }
}

function changeMonth(offset) { calendarDate.setMonth(calendarDate.getMonth() + offset); updateArchive(); }
prevBtn.onclick = () => { currentDate.setDate(currentDate.getDate()-1); loadData(); };
nextBtn.onclick = () => { 
    let n = new Date(currentDate); n.setDate(n.getDate()+1); 
    if(n <= new Date()) { currentDate = n; loadData(); }
};
addStickerBtn.onclick = () => { addSticker(); saveData(); };
upload.onchange = (e) => { 
    Array.from(e.target.files).forEach(f => { 
        const r = new FileReader(); r.onload=()=>{ addPhoto(r.result); saveData(); }; r.readAsDataURL(f); 
    }); 
};

startTodayTimer();
loadData();
