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

  let targetLangFull, sourceShort, targetShort;

  if (currentSpeaker === 'A') {
    targetLangFull = langBSelect.value;
    sourceShort = langASelect.options[langASelect.selectedIndex].getAttribute("data-short") || 'th';
    targetShort = langBSelect.options[langBSelect.selectedIndex].getAttribute("data-short") || 'my';

    document.getElementById("originalA").innerText = speechResult;
  } else {
    targetLangFull = langASelect.value;
    sourceShort = langBSelect.options[langBSelect.selectedIndex].getAttribute("data-short") || 'my';
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
  addChatHistory(currentSpeaker, speechResult, translatedText, targetLangFull);
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

// ฟังก์ชันเรียก Google Translate Free Endpoint
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

// ฟังก์ชันแปลภาษาแบบ Pivot (ผ่านภาษาอังกฤษเพื่อความแม่นยำเมื่อแปล ไทย <-> พม่า)
async function translateText(text, fromShort, toShort) {
  if ((fromShort === 'th' && toShort === 'my') || (fromShort === 'my' && toShort === 'th')) {
    const englishText = await fetchTranslation(text, fromShort, 'en');
    if (englishText) {
      const finalText = await fetchTranslation(englishText, 'en', toShort);
      if (finalText) return finalText;
    }
  }

  const directText = await fetchTranslation(text, fromShort, toShort);
  return directText || "เกิดข้อผิดพลาดในการแปลภาษา";
}

// ฟังก์ชันเมื่อกดปุ่มลำโพง 🔊
function playSpeakerSound(speaker) {
  const translatedElement = document.getElementById(`translated${speaker}`);
  if (!translatedElement) return;

  const textToSpeak = translatedElement.innerText.trim();
  if (!textToSpeak || textToSpeak.includes("แสดงที่นี่") || textToSpeak.includes("appear here")) return;

  const langASelect = document.getElementById("langA");
  const langBSelect = document.getElementById("langB");

  const targetLang = (speaker === 'A') ? langBSelect.value : langASelect.value;
  speakText(textToSpeak, targetLang);
}

// ฟังก์ชันอ่านออกเสียง (ปรับความเร็ว และเลือกโทนเสียงชาย/หญิง ได้)
function speakText(text, langCode) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel(); // หยุดเสียงเก่าก่อนเล่นใหม่

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;

  // 1. ดึงค่าความเร็วเสียงจาก Dropdown
  const rateSelect = document.getElementById("speechRate");
  utterance.rate = rateSelect ? parseFloat(rateSelect.value) : 0.8;

  // 2. ดึงค่าโทนเสียง (Pitch) จาก Dropdown
  const pitchSelect = document.getElementById("voicePitch");
  utterance.pitch = pitchSelect ? parseFloat(pitchSelect.value) : 1.0;

  // 3. ค้นหาเสียงผู้พูดที่มีในเครื่อง
  const voices = window.speechSynthesis.getVoices();
  const availableVoices = voices.filter(voice => voice.lang.includes(langCode.split('-')[0]));

  if (availableVoices.length > 0) {
    // เลือกใช้เสียงที่มีในเครื่อง
    utterance.voice = availableVoices[0];
  }

  window.speechSynthesis.speak(utterance);
}

// โหลดระบบเสียงในเบราว์เซอร์เตรียมไว้
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// บันทึกประวัติการสนทนา
function addChatHistory(speaker, original, translated, targetLang) {
  const chatDiv = document.getElementById("chat");
  if (!chatDiv) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${speaker.toLowerCase()}`;
  messageDiv.style.marginBottom = "8px";
  messageDiv.style.padding = "8px 12px";
  messageDiv.style.borderRadius = "8px";
  messageDiv.style.backgroundColor = speaker === 'A' ? "#e3f2fd" : "#f1f8e9";

  const safeTranslated = translated.replace(/'/g, "\\'").replace(/"/g, '&quot;');

  messageDiv.innerHTML = `
    <strong>Speaker ${speaker}:</strong> ${original}<br>
    <span style="color: #333;">➜ ${translated}</span>
    <button onclick="speakText('${safeTranslated}', '${targetLang}')" 
            style="background:none; border:none; cursor:pointer; font-size:14px; margin-left:6px;" 
            title="ฟังเสียงอีกครั้ง">🔊</button>
  `;

  chatDiv.appendChild(messageDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}
