// ตรวจสอบระบบจดจำเสียงพูด
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("เบราว์เซอร์ของคุณไม่รองรับระบบจำเสียง กรุณาใช้ Google Chrome หรือ Microsoft Edge");
}

const recognition = new SpeechRecognition();
recognition.continuous = false;   // ฟังจบประโยคแล้วตัดอัตโนมัติ
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

  // กำหนดภาษาให้ไมค์ฟังตามฝั่งที่กดพูด
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

// เมื่อจับเสียงพูดได้สำเร็จ
recognition.onresult = async (event) => {
  const speechResult = event.results[0][0].transcript;

  const langASelect = document.getElementById("langA");
  const langBSelect = document.getElementById("langB");

  // ดึงรหัสภาษาแบบสั้นจาก option ที่ถูกเลือกอยู่ (เช่น 'th', 'en', 'my')
  const shortA = langASelect.options[langASelect.selectedIndex].getAttribute("data-short") || 'th';
  const shortB = langBSelect.options[langBSelect.selectedIndex].getAttribute("data-short") || 'en';

  const fullA = langASelect.value;
  const fullB = langBSelect.value;

  let sourceText = speechResult;
  let translatedText = "";
  let sourceShort = "";
  let targetShort = "";
  let targetFull = "";

  if (currentSpeaker === 'A') {
    // Speaker A พูด -> แปลจาก A ไป B
    sourceShort = shortA;
    targetShort = shortB;
    targetFull = fullB;

    document.getElementById("originalA").innerText = sourceText;
    document.getElementById("translatedA").innerText = "⏳ กำลังแปล...";
  } else {
    // Speaker B พูด -> แปลจาก B ไป A
    sourceShort = shortB;
    targetShort = shortA;
    targetFull = fullA;

    document.getElementById("originalB").innerText = sourceText;
    document.getElementById("translatedB").innerText = "⏳ กำลังแปล...";
  }

  // แปลภาษา
  translatedText = await translateText(sourceText, sourceShort, targetShort);

  // แสดงผลคำแปล
  if (currentSpeaker === 'A') {
    document.getElementById("translatedA").innerText = translatedText;
  } else {
    document.getElementById("translatedB").innerText = translatedText;
  }

  // อ่านออกเสียงคำแปล
  speakText(translatedText, targetFull);

  // บันทึกประวัติ
  addChatHistory(currentSpeaker, sourceText, translatedText);
};

// คืนค่าปุ่มไมค์เมื่อพูดจบ
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

// ฟังก์ชันแปลภาษาผ่าน Free Google Translate API
async function translateText(text, fromShort, toShort) {
  // ป้องกันการแปลภาษาเดียวกัน
  if (fromShort === toShort) {
    return text;
  }

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromShort}&tl=${toShort}&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
    return "ไม่สามารถแปลข้อความได้";
  } catch (error) {
    console.error("Translation Error:", error);
    return "เกิดข้อผิดพลาดในการแปลภาษา";
  }
}

// ฟังก์ชันอ่านออกเสียง
function speakText(text, langCode) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel(); // หยุดเสียงเก่าก่อน

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 1.0;

  window.speechSynthesis.speak(utterance);
}

// บันทึกประวัติการสนทนา
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
