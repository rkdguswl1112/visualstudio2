const canvas = document.getElementById("canvas");
const upload = document.getElementById("upload");
const dateEl = document.getElementById("date");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const addStickerBtn = document.getElementById("addStickerBtn");
const editControls = document.getElementById("editControls");

const STICKER_FONTS = ["'Gaegu'", "'Nanum Pen Script'", "'Gowun Dodum'", "'Gamja Flower'", "'Hi Melody'", "'Single Day'", "'East Sea Dokdo'", "'Poor Story'", "'Black Han Sans'", "'Dokdo'", "'NeoDunggeunmo'"];
const stickerImages = ["s01.png", "s02.png", "s03.png", "s04.png", "s05.png", "s06.png", "s07.png", "s08.png", "s09.png", "s10.png", "s-11.png",  "s-14.png",  "s-16.png", "s-17.png", "s-18.png", "s-19.png", "s-20.png", "s-24.png", "s-25.png", "s-26.png", "s-27.png", "s-28.png", "s-29.png"];

const REAL_TODAY_STR = '2026-04-29';
const REAL_TODAY = new Date(REAL_TODAY_STR);
REAL_TODAY.setHours(0, 0, 0, 0);

let currentDate = new Date(REAL_TODAY_STR);
let calendarDate = new Date(REAL_TODAY_STR);
let isRendering = false;
let topZIndex = 100;


function updateUIVisibility() {
    const isToday = formatDate(currentDate) === REAL_TODAY_STR;
   
    if (editControls) {
        editControls.style.display = isToday ? "flex" : "none";
    }


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

async function saveData() {
    if (isRendering) return;
    // 오늘이 아닐 때는 절대 저장하지 않음 (이중 방어)
    if (formatDate(currentDate) !== REAL_TODAY_STR) return;

    const key = formatDate(currentDate);
    const stickers = Array.from(document.querySelectorAll(".sticker")).map(el => {
        const t = el.querySelector("textarea");
        return { text: t.value, x: parseInt(el.style.left), y: parseInt(el.style.top), width: parseInt(el.style.width), rotation: el.dataset.rotation, font: t.style.fontFamily, imgSrc: el.querySelector("img").getAttribute("src") };
    });
    const photos = Array.from(document.querySelectorAll(".user-photo")).map(el => ({ src: el.src, x: parseInt(el.style.left), y: parseInt(el.style.top), rotation: el.dataset.rotation }));
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: key, data: { stickers, photos } }) });
}

async function loadData() {
    const key = formatDate(currentDate);
    dateEl.innerText = key;
    updateUIVisibility(); // 날짜 바뀔 때마다 UI 체크
    const response = await fetch(`/api/load/${key}`);
    const data = await response.json();
    renderData(data);
}

function renderData(data) {
    isRendering = true; canvas.innerHTML = "";
    const isToday = formatDate(currentDate) === REAL_TODAY_STR;

    if (data.photos) data.photos.forEach(p => addPhoto(p.src, p.x, p.y, p.rotation, isToday));
    if (data.stickers) data.stickers.forEach(s => addSticker(s.text, s.x, s.y, s.width, s.rotation, s.font, s.imgSrc, isToday));
    isRendering = false;
}

// isEditable 인자 추가 (오늘인지 여부)
function addPhoto(src, x=null, y=null, rot=null, isEditable=true) {
    const img = document.createElement("img"); 
    img.className = "user-photo"; 
    img.src = src;
    img.style.left = (x !== null ? x : Math.max(50, Math.random()*(innerWidth-300)))+"px"; 
    img.style.top = (y !== null ? y : Math.max(150, Math.random()*(innerHeight-300)))+"px";
    const r = rot || (Math.random()*20-10); 
    img.style.transform = `rotate(${r}deg)`; 
    img.dataset.rotation = r;
    
    if (isEditable) {
        makeDraggable(img);
    } else {
        img.style.cursor = "default";
    }
    canvas.appendChild(img);
}

function addSticker(text="", x=null, y=null, w=null, rot=null, font=null, imgS=null, isEditable=true) {
    const s = document.createElement("div"); 
    s.className = "sticker";
    const img = document.createElement("img"); 
    img.src = imgS || stickerImages[Math.floor(Math.random()*stickerImages.length)];
    const t = document.createElement("textarea"); 
    t.className = "sticker-text"; 
    t.value = text;
    t.placeholder = isEditable ? "입력..." : "";
    t.readOnly = !isEditable; 
    t.style.fontFamily = font || STICKER_FONTS[Math.floor(Math.random()*STICKER_FONTS.length)];
    
    s.append(img, t);
    s.style.left = (x !== null ? x : Math.random()*(innerWidth-200))+"px"; 
    s.style.top = (y !== null ? y : Math.random()*(innerHeight-200))+"px";
    const r = rot || (Math.random()*40-20); 
    s.style.transform = `rotate(${r}deg)`; 
    s.dataset.rotation = r;
    
    if (isEditable) {
        makeDraggable(s, t);
        t.onblur = () => { saveData(); };
    } else {
        s.style.cursor = "default";
        t.style.cursor = "default";
    }
    
    canvas.appendChild(s);
}

function makeDraggable(el, txt=null) {
    let isDragging = false;
    let shiftX, shiftY;

    const startMove = (clientX, clientY) => {
        isDragging = true;
        topZIndex += 1;
        el.style.zIndex = topZIndex;

        let rect = el.getBoundingClientRect();
        shiftX = clientX - rect.left;
        shiftY = clientY - rect.top;

        const move = (me) => {
            if (!isDragging) return;
            requestAnimationFrame(() => {
                const cx = me.clientX || (me.touches && me.touches[0].clientX);
                const cy = me.clientY || (me.touches && me.touches[0].clientY);
                el.style.left = (cx - shiftX) + "px"; 
                el.style.top = (cy - shiftY) + "px";
            });
        };

        const stop = () => {
            isDragging = false;
            saveData();
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", stop);
            document.removeEventListener("touchmove", move);
            document.removeEventListener("touchend", stop);
        };

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
        document.addEventListener("touchmove", move, {passive: false});
        document.addEventListener("touchend", stop);
    };

    el.onmousedown = (e) => {
        if(txt && e.target === txt) { el.style.zIndex = ++topZIndex; return; }
        e.preventDefault();
        startMove(e.clientX, e.clientY);
    };
    el.ontouchstart = (e) => {
        if(txt && e.target === txt) { el.style.zIndex = ++topZIndex; return; }
        startMove(e.touches[0].clientX, e.touches[0].clientY);
    };
}

async function updateArchive() {
    const grid = document.getElementById("calendarGrid");
    const title = document.getElementById("calendarTitle");
    if(!grid || !title) return;
    grid.innerHTML = "";
    const y = calendarDate.getFullYear(), m = calendarDate.getMonth();
    title.innerText = `${y}년 ${m + 1}월`;

    const res = await fetch("/api/list");
    const recordedDates = await res.json();

    ["일","월","화","수","목","금","토"].forEach(d => {
        const div = document.createElement("div"); div.innerText = d; grid.appendChild(div);
    });

    const first = new Date(y, m, 1).getDay(), last = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < first; i++) grid.appendChild(Object.assign(document.createElement("div"), {className:"calendar-day empty"}));

    for (let d = 1; d <= last; d++) {
        const dayDiv = document.createElement("div"); 
        dayDiv.className = "calendar-day";
        const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);

        dayDiv.innerHTML = `<span>${d}</span>`;

        
        if (targetDate > REAL_TODAY) {
            dayDiv.style.opacity = "0.2";
            dayDiv.style.cursor = "not-allowed";
        } else {
            if (dateStr === REAL_TODAY_STR) dayDiv.classList.add("today");
            if (recordedDates.includes(dateStr)) dayDiv.classList.add("has-record");
            
            dayDiv.onclick = () => { 
                currentDate = new Date(dateStr); 
                loadData(); 
                const diaryTabBtn = document.querySelector('.tab-btn[onclick*="tab1"]') || document.querySelector('.tab-btn:first-child');
                openTab({currentTarget: diaryTabBtn}, 'tab1'); 
            };
        }
        grid.appendChild(dayDiv);
    }
}

function changeMonth(offset) { calendarDate.setMonth(calendarDate.getMonth() + offset); updateArchive(); }

prevBtn.onclick = () => { 
    currentDate.setDate(currentDate.getDate()-1); 
    loadData(); 
};
nextBtn.onclick = () => { 
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    if (nextDate > REAL_TODAY) return; // 미래 이동 차단
    currentDate = nextDate;
    loadData(); 
};

addStickerBtn.onclick = () => addSticker();
upload.onchange = (e) => { 
    Array.from(e.target.files).forEach(f => { 
        const r = new FileReader(); r.onload=()=>{ addPhoto(r.result); saveData(); }; r.readAsDataURL(f); 
    }); 
};

const socket = io();
socket.on("updateData", (payload) => { if (payload.date === formatDate(currentDate)) renderData(payload.data); });

startTodayTimer();
loadData();
