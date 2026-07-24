// ตรวจสอบ Web Speech API สำหรับการจำเสียงพูด
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("เบราว์เซอร์ของคุณไม่รองรับระบบรับเสียงพูด กรุณาใช้ Google Chrome หรือ Microsoft Edge");
}

const recognition = new SpeechRecognition();
recognition.continuous = false;   // ฟังจบประโยคแล้วหยุด
recognition.interimResults = false; // เอาเฉพาะผลลัพธ์ที่พูดเสร็จแล้ว

let currentSpeaker = 'A';

// ฟังก์ชันสลับภาษาใน Dropdown
function swapLanguages() {
  const langA = document.getElementById("langA");
  const langB = document.getElementById("langB");

  // อ่านค่าภาษาที่เลือกไว้ปัจจุบัน
  const valA = langA.value;
  const valB = langB.value;

  // ตรวจสอบว่าใน Dropdown ทั้งสองฝั่งมี Option ตรงกันไหมก่อนสลับ
  let optionAExist = Array.from(langA.options).some(opt => opt.value === valB);
  let optionBExist = Array.from(langB.options).some(opt => opt.value === valA);

  if (optionAExist && optionBExist) {
    langA.value = valB;
    langB.value = valA;
  } else {
    // กรณีภาษาฝั่งหนึ่งไม่มีในอีกฝั่ง ให้ใช้วิธีสลับ index
    const tempIndex = langA.selectedIndex;
    langA.selectedIndex = langB.selectedIndex < langA.options.length ? langB.selectedIndex : 0;
    langB.selectedIndex = tempIndex < langB.options.length ? tempIndex : 0;
  }
}

// เริ่มการฟังเสียง
function startListening(speaker) {
  currentSpeaker = speaker;
  
  const langA = document.getElementById("langA").value;
  const langB = document.getElementById("langB").value;

  // กำหนดภาษาที่จะจับเสียงพูด
  // Speaker A พูด -> ฟังภาษา A / Speaker B พูด -> ฟังภาษา B
  recognition.lang = (speaker === 'A') ? langA : langB;

  const activeMic = document.getElementById(`mic${speaker}`);
  activeMic.innerText = "🔴 กำลังฟัง...";
  activeMic.disabled = true;
}

// เมื่อเบราว์เซอร์จับเสียงพูดได้สำเร็จ
recognition.onresult = async (event) => {
  const speechResult = event.results[0][0].transcript;
  
  const langAVal = document.getElementById("langA").value;
  const langBVal = document.getElementById("langB").value;

  let sourceLang, targetLang;

  if (currentSpeaker === 'A') {
    sourceLang = langAVal;
    targetLang = langBVal;
    document.getElementById("originalA").innerText = speechResult;
  } else {
    sourceLang = langBVal;
    targetLang = langAVal;
    document.getElementById("originalB").innerText = speechResult;
  }

  // ส่งไปแปลภาษา
  const translatedText = await translateText(speechResult, sourceLang, targetLang);
  
  if (currentSpeaker === 'A') {
    document.getElementById("translatedA").innerText = translatedText;
  } else {
    document.getElementById("translatedB").innerText = translatedText;
  }

  // อ่านออกเสียงคำแปลผ่าน Web Speech API ของเบราว์เซอร์
  speakText(translatedText, targetLang);

  // บันทึกลงประวัติการสนทนา
  addChatHistory(currentSpeaker, speechResult, translatedText);
};

// เมื่อฟังเสียงเสร็จหรือเกิดการหยุดทำงาน คืนค่าปุ่มไมค์เป็นปกติ
recognition.onend = () => {
  const micA = document.getElementById("micA");
  const micB = document.getElementById("micB");

  micA.innerText = "🎤 พูด (A)";
  micA.disabled = false;

  micB.innerText = "🎤 พูด (B)";
  micB.disabled = false;
};

// กรณีเกิดข้อผิดพลาดในการฟังเสียง
recognition.onerror = (event) => {
  console.error("Speech Recognition Error:", event.error);
  recognition.stop();
};

// ฟังก์ชันแปลภาษาผ่าน Google Translate Endpoint สาธารณะ (ฟรี ไม่ต้องใช้ API Key)
async function translateText(text, from, to) {
  // ดึงรหัสภาษาแบบสั้น เช่น 'th-TH' -> 'th', 'my-MM' -> 'my'
  const sourceShort = getShortLangCode(from);
  const targetShort = getShortLangCode(to);

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceShort}&tl=${targetShort}&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    // แปลงผลลัพธ์ Array ซ้อน Array ของ Google ให้กลายเป็นข้อความแปลเต็ม
    return data[0].map(item => item[0]).join('');
  } catch (error) {
    console.error("Translation Error:", error);
    // สำรองไปใช้ MyMemory API หาก Endpoint หลักมีปัญหา
    return translateFallback(text, sourceShort, targetShort);
  }
}

// ฟังก์ชันแปลภาษาสำรอง (MyMemory API)
async function translateFallback(text, fromShort, toShort) {
  const langPair = `${fromShort}|${toShort}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.responseData.translatedText;
  } catch (error) {
    return "เกิดข้อผิดพลาดในการแปลภาษา";
  }
}

// ฟังก์ชันแปลงรหัสภาษาให้อยู่ในรูปแบบย่อ (2 หลัก)
function getShortLangCode(fullLangCode) {
  // หาจาก attribute data-short ใน <select> ก่อน ถ้าไม่มีให้ใช้การ split
  const selectA = document.getElementById("langA");
  const selectB = document.getElementById("langB");
  
  const option = Array.from(selectA.options).concat(Array.from(selectB.options))
                      .find(opt => opt.value === fullLangCode);

  if (option && option.dataset.short) {
    return option.dataset.short;
  }
  return fullLangCode.split('-')[0];
}

// ฟังก์ชันอ่านออกเสียงคำแปล (Text-to-Speech) ฟรีผ่าน Browser Web Speech API
function speakText(text, lang) {
  if (!('speechSynthesis' in window)) return;

  // ยกเลิกเสียงที่กำลังพูดอยู่ก่อนหน้า (ถ้ามี)
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // ปรับความเร็วการพูดให้อ่านฟังง่ายขึ้นเล็กน้อย

  window.speechSynthesis.speak(utterance);
}

// บันทึกประวัติการสนทนาลงในช่อง Conversation History
function addChatHistory(speaker, original, translated) {
  const chatDiv = document.getElementById("chat");
  const messageDiv = document.createElement("div");
  
  messageDiv.className = `chat-message speaker-${speaker.toLowerCase()}`;
  messageDiv.style.marginBottom = "10px";
  messageDiv.style.padding = "8px 12px";
  messageDiv.style.borderRadius = "8px";
  messageDiv.style.backgroundColor = speaker === 'A' ? "#e3f2fd" : "#f3e5f5";

  messageDiv.innerHTML = `
    <strong>Speaker ${speaker}:</strong> ${original}<br>
    <span style="color: #555;">➜ ${translated}</span>
  `;

  chatDiv.appendChild(messageDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight; // เลื่อนหน้าต่างประวัติลงล่างสุดอัตโนมัติ
}
