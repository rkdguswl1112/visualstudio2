// ... 상단 생략 ...

// 🔥 스티커 생성 함수 (크기 범위를 100~130px로 더 작게 제한)
function addSticker(text = "", x = null, y = null, width = null, rotation = null, font = null, color = null, locked = false, savedImg = null) {
  const sticker = document.createElement("div");
  sticker.className = "sticker";
  
  // 🔥 크기 랜덤: 너무 커지지 않게 100px ~ 130px 사이로 조정
  const randomWidth = width || Math.floor(Math.random() * 31) + 100;
  sticker.style.width = randomWidth + "px";

  const img = document.createElement("img");
  img.src = savedImg || stickerImages[Math.floor(Math.random() * stickerImages.length)];
  
  const textarea = document.createElement("textarea");
  textarea.className = "sticker-text";
  textarea.value = text;
  
  // 스티커 폰트 랜덤 적용 (시스템 UI는 픽셀 고정)
  textarea.style.fontFamily = font || STICKER_FONTS[Math.floor(Math.random() * STICKER_FONTS.length)];
  textarea.style.color = color || colors[Math.floor(Math.random() * colors.length)];
  
  if (locked) {
    textarea.readOnly = true;
    textarea.style.pointerEvents = "none";
  }
  
  sticker.appendChild(img);
  sticker.appendChild(textarea);
  
  // 위치 랜덤 (화면 밖으로 너무 나가지 않게 여백 계산)
  sticker.style.left = (x !== null ? x : Math.random() * (window.innerWidth - 150)) + "px";
  sticker.style.top = (y !== null ? y : Math.random() * (window.innerHeight - 150)) + "px";
  
  // 각도 제한 (-20도 ~ 20도)
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

// ... 나머지 함수들 동일 ...
