// =========================================================================
// 🔑 1. วาง API Key ของคุณที่ได้จาก Google AI Studio (aistudio.google.com) ที่นี่
// =========================================================================
const GEMINI_API_KEY = "AQ.Ab8RN6KBklvNDKk6ulsOEZvMlvLNjUHSf-dCn6kOFFtaa0ksQg";


// ตรวจสอบระบบจดจำเสียงพูดในเบราว์เซอร์
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("เบราว์เซอร์ของคุณไม่รองรับระบบจำเสียง กรุณาใช้ Google Chrome หรือ Microsoft Edge");
}

const recognition = new SpeechRecognition();
recognition.continuous = false;   // ฟังจนจบประโยคแล้วตัดอัตโนมัติ
recognition.interimResults = false; // เอาเฉพาะผลลัพธ์สุดท้าย

let currentSpeaker = 'A';

// 🔄 สลับภาษาใน Dropdown A และ B
function swapLanguages() {
  const langA = document.getElementById("langA");
  const langB = document.getElementById("langB");
  
  const tempVal = langA.value;
  langA.value = langB.value;
  langB.value = tempVal;
}

// 🎤 เริ่มฟังเสียงพูด
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

// 🎧 เมื่อจับเสียงพูดได้
recognition.onresult = async (event) => {
  const speechResult = event.results[0][0].transcript;

  const langASelect = document.getElementById("langA");
  const langBSelect = document.getElementById("langB");

  let targetLangFull, sourceLangName, targetLangName;

  if (currentSpeaker === 'A') {
    targetLangFull = langBSelect.value;
    sourceLangName = langASelect.options[langASelect.selectedIndex].getAttribute("data-langname") || 'Thai';
    targetLangName = langBSelect.options[langBSelect.selectedIndex].getAttribute("data-langname") || 'Burmese';

    document.getElementById("originalA").innerText = speechResult;
  } else {
    targetLangFull = langASelect.value;
    sourceLangName = langBSelect.options[langBSelect.selectedIndex].getAttribute("data-langname") || 'Burmese';
    targetLangName = langASelect.options[langASelect.selectedIndex].getAttribute("data-langname") || 'Thai';

    document.getElementById("originalB").innerText = speechResult;
  }

  // 1. แปลภาษาด้วย Gemini AI
  const translatedText = await translateWithGemini(speechResult, sourceLangName, targetLangName);

  if (currentSpeaker === 'A') {
    document.getElementById("translatedA").innerText = translatedText;
  } else {
    document.getElementById("translatedB").innerText = translatedText;
  }

  // 2. อ่านออกเสียงคำแปล
  speakText(translatedText, targetLangFull);

  // 3. บันทึกลงประวัติการสนทนา
  addChatHistory(currentSpeaker, speechResult, translatedText, targetLangFull);
};

// 🔴 คืนค่าปุ่มไมค์เมื่อพูดจบหรือหยุดฟัง
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

// ==========================================
// 🤖 ฟังก์ชันแปลภาษาผ่าน Gemini API (ฟรี 100%)
// ==========================================
async function translateWithGemini(text, sourceLang, targetLang) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "AQ.Ab8RN6KBklvNDKk6ulsOEZvMlvLNjUHSf-dCn6kOFFtaa0ksQg") {
    alert("กรุณาใส่ GEMINI_API_KEY ในบรรทัดแรกของไฟล์ app.js ก่อนใช้งานครับ");
    return "ยังไม่ได้ใส่ API Key";
  }

  // ใช้ endpoint gemini-1.5-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const promptText = `You are a professional voice translator. Translate the following spoken message from ${sourceLang} to ${targetLang}. Preserve natural everyday conversation context. Return ONLY the translated sentence, without any explanations, quotes, or original text:\n"${text}"`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text.trim();
    } else if (data.error) {
      console.error("Gemini API Error Detail:", data.error);
      return `API Error: ${data.error.message}`;
    }

    return "เกิดข้อผิดพลาดในการแปลภาษา";
  } catch (error) {
    console.error("Gemini Connection Error:", error);
    return "ไม่สามารถเชื่อมต่อ Gemini API ได้";
  }
}

// 🔊 ฟังก์ชันกดปุ่มลำโพงเพื่อฟังเสียงอ่านซ้ำ
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

// 🗣️ ฟังก์ชันอ่านออกเสียง (ปรับช้า-เร็ว และโทนเสียงชาย/หญิง ได้)
function speakText(text, langCode) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel(); // หยุดเสียงเดิมก่อนเล่นใหม่

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;

  // ดึงค่าความเร็วจาก Dropdown หน้าเว็บ
  const rateSelect = document.getElementById("speechRate");
  utterance.rate = rateSelect ? parseFloat(rateSelect.value) : 0.8;

  // ดึงค่าโทนเสียง (Pitch)
  const pitchSelect = document.getElementById("voicePitch");
  utterance.pitch = pitchSelect ? parseFloat(pitchSelect.value) : 1.0;

  // ค้นหาเสียงที่มีอยู่ในเครื่องผู้ใช้
  const voices = window.speechSynthesis.getVoices();
  const availableVoices = voices.filter(voice => voice.lang.includes(langCode.split('-')[0]));

  if (availableVoices.length > 0) {
    utterance.voice = availableVoices[0];
  }

  window.speechSynthesis.speak(utterance);
}

// โหลดรายการเสียงอ่านในเครื่องเตรียมพร้อมไว้
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// 💬 ฟังก์ชันบันทึกประวัติการสนทนาลงกล่องแชทด้านล่าง
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
