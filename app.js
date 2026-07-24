// ตรวจสอบระบบจดจำเสียงพูดในเบราว์เซอร์
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("เบราว์เซอร์ของคุณไม่รองรับระบบจำเสียง กรุณาใช้ Google Chrome หรือ Microsoft Edge");
}

const recognition = new SpeechRecognition();
recognition.continuous = false;   // ฟังจนจบประโยคแล้วตัดอัตโนมัติ
recognition.interimResults = false; // เอาเฉพาะผลลัพธ์สุดท้าย

let currentSpeaker = 'A';

// สลับภาษาใน Dropdown A และ B
function swapLanguages() {
  const langA = document.getElementById("langA");
  const langB = document.getElementById("langB");
  
  const tempVal = langA.value;
  langA.value = langB.value;
  langB.value = tempVal;
}

// เริ่มฟังเสียงพูด
function startListening(speaker) {
  currentSpeaker = speaker;

  const langASelect = document.getElementById("langA");
  const langBSelect = document.getElementById("langB");

  const selectedLang = (speaker === 'A') ? langASelect.value : langBSelect.value;
  recognition.lang = selectedLang;

  const activeMic = document.getElementById(`mic${speaker}`);
  activeMic.innerText = "🔴 กำลังฟัง...";
  activeMic.disabled = true;

  try {
    recognition.start();
  } catch (error) {
    console.error("Recognition start error:", error);
    activeMic.innerText = `🎤 พูด (${speaker})`;
    activeMic.disabled = false;
  }
}

// เมื่อเบราว์เซอร์จับเสียงพูดได้
recognition.onresult = async (event) => {
  const speechResult = event.results[0][0].transcript;

  const langASelect = document.getElementById("langA");
  const langBSelect = document.getElementById("langB");

  let sourceLangFull, targetLangFull;
  let sourceShort, targetShort;

  if (currentSpeaker === 'A') {
    sourceLangFull = langASelect.value;
    targetLangFull = langBSelect.value;
    sourceShort = langASelect.options[langASelect.selectedIndex].getAttribute("data-short") || 'th';
    targetShort = langBSelect.options[langBSelect.selectedIndex].getAttribute("data-short") || 'en';

    document.getElementById("originalA").innerText = speechResult;
  } else {
    sourceLangFull = langBSelect.value;
    targetLangFull = langASelect.value;
    sourceShort = langBSelect.options[langBSelect.selectedIndex].getAttribute("data-short") || 'en';
    targetShort = langASelect.options[langASelect.selectedIndex].getAttribute("data-short") || 'th';

    document.getElementById("originalB").innerText = speechResult;
  }

  // ส่งคำพูดไปแปลภาษา
  const translatedText = await translateText(speechResult, sourceShort, targetShort);

  if (currentSpeaker === 'A') {
    document.getElementById("translatedA").innerText = translatedText;
  } else {
    document.getElementById("translatedB").innerText = translatedText;
  }

  // อ่านออกเสียงคำแปลด้วยระบบเบราว์เซอร์
  speakText(translatedText, targetLangFull);

  // บันทึกลงประวัติการสนทนา
  addChatHistory(currentSpeaker, speechResult, translatedText);
};

// คืนค่าปุ่มไมค์เมื่อพูดจบหรือหยุดฟัง
recognition.onend = () => {
  const micA = document.getElementById("micA");
  const micB = document.getElementById("micB");

  if (micA) {
    micA.innerText = "🎤 พูด (A)";
    micA.disabled = false;
  }
  if (micB) {
    micB.innerText = "🎤 พูด (B)";
    micB.disabled = false;
  }
};

recognition.onerror = (event) => {
  console.error("Speech recognition error:", event.error);
  recognition.onend();
};

// ฟังก์ชันเรียก Google Translate API ย่อย
async function fetchTranslation(text, from, to) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
    return null;
  } catch (error) {
    console.error("Fetch Translation Error:", error);
    return null;
  }
}

// ฟังก์ชันแปลภาษาแบบชาญฉลาด (Pivot Translation สำหรับพม่า)
async function translateText(text, fromShort, toShort) {
  // กรณีแปล ไทย <-> พม่า ให้ใช้อังกฤษเป็นสะพานเชื่อม (Pivot) เพื่อความแม่นยำสูงสุด
  if ((fromShort === 'th' && toShort === 'my') || (fromShort === 'my' && toShort === 'th')) {
    // ขั้นที่ 1: แปลเป็นภาษาอังกฤษก่อน
    const englishText = await fetchTranslation(text, fromShort, 'en');
    if (englishText) {
      // ขั้นที่ 2: แปลจากภาษาอังกฤษไปภาษาปลายทาง
      const finalText = await fetchTranslation(englishText, 'en', toShort);
      if (finalText) return finalText;
    }
  }

  // การแปลคู่ภาษาอื่นๆ หรือกรณี Pivot ล้มเหลว ให้แปลตรงๆ
  const directText = await fetchTranslation(text, fromShort, toShort);
  return directText || "เกิดข้อผิดพลาดในการแปลภาษา";
}

// ฟังก์ชันอ่านออกเสียง (Text-to-Speech) ของเบราว์เซอร์
function speakText(text, langCode) {
  if (!('speechSynthesis' in window)) {
    console.warn("เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง");
    return;
  }

  window.speechSynthesis.cancel(); // หยุดเสียงเก่าก่อนเล่นเสียงใหม่

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

// บันทึกประวัติการสนทนาในช่อง Chat History
function addChatHistory(speaker, original, translated) {
  const chatDiv = document.getElementById("chat");
  if (!chatDiv) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${speaker.toLowerCase()}`;
  messageDiv.style.marginBottom = "10px";
  messageDiv.style.padding = "8px 12px";
  messageDiv.style.borderRadius = "8px";
  messageDiv.style.backgroundColor = speaker === 'A' ? "#e3f2fd" : "#f1f8e9";

  messageDiv.innerHTML = `
    <strong>Speaker ${speaker}:</strong> ${original}<br>
    <span style="color: #555;">➜ ${translated}</span>
  `;

  chatDiv.appendChild(messageDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}
