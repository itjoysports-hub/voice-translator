// ตรวจสอบการรองรับ Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("เบราว์เซอร์ของคุณไม่รองรับ Speech Recognition แนะนำให้ใช้ Google Chrome ครับ");
}

const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;

let currentSpeaker = null;

// เริ่มจับเสียงพูด
function startListening(speaker) {
  currentSpeaker = speaker;
  
  const langASelect = document.getElementById('langA');
  const langBSelect = document.getElementById('langB');
  
  // ตั้งค่าภาษาในการจับเสียงตาม Speaker
  if (speaker === 'A') {
    recognition.lang = langASelect.value;
    document.getElementById('micA').classList.add('recording');
    document.getElementById('micA').innerText = '🔴 กำลังฟัง...';
  } else {
    recognition.lang = langBSelect.value;
    document.getElementById('micB').classList.add('recording');
    document.getElementById('micB').innerText = '🔴 Listening...';
  }

  recognition.start();
}

// เมื่อได้รับข้อความจากการพูด
recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript;
  
  const langAOption = document.getElementById('langA').selectedOptions[0];
  const langBOption = document.getElementById('langB').selectedOptions[0];
  
  const langAShort = langAOption.getAttribute('data-short');
  const langBShort = langBOption.getAttribute('data-short');

  let sourceLang, targetLang, originalElem, translatedElem;

  if (currentSpeaker === 'A') {
    sourceLang = langAShort;
    targetLang = langBShort;
    originalElem = document.getElementById('originalA');
    translatedElem = document.getElementById('translatedA');
  } else {
    sourceLang = langBShort;
    targetLang = langAShort;
    originalElem = document.getElementById('originalB');
    translatedElem = document.getElementById('translatedB');
  }

  originalElem.innerText = transcript;
  translatedElem.innerText = "กำลังแปลภาษา...";

  // แปลภาษาผ่าน Free API (MyMemory API)
  const translatedText = await translateText(transcript, sourceLang, targetLang);
  translatedElem.innerText = translatedText;

  // อ่านออกเสียงคำแปลตามภาษาปลายทาง
  speakText(translatedText, targetLang === 'th' ? 'th-TH' : document.getElementById('langB').value);

  // บันทึกลงประวัติการสนทนา
  addHistory(currentSpeaker, transcript, translatedText);
};

// เมื่อจับเสียงเสร็จสิ้น
recognition.onend = () => {
  document.getElementById('micA').classList.remove('recording');
  document.getElementById('micA').innerText = '🎤 พูด (A)';
  document.getElementById('micB').classList.remove('recording');
  document.getElementById('micB').innerText = '🎤 พูด (B)';
};

// ฟังก์ชันแปลภาษาโดยใช้ MyMemory API
async function translateText(text, from, to) {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    );
    const data = await response.json();
    return data.responseData.translatedText || "ไม่สามารถแปลภาษาได้";
  } catch (error) {
    console.error("Translation Error:", error);
    return "เกิดข้อผิดพลาดในการแปล";
  }
}

// ฟังก์ชันอ่านออกเสียง (Text-to-Speech)
function speakText(text, langCode) {
  // ยกเลิกเสียงที่กำลังพูดอยู่ก่อนหน้า
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 0.9; // ความเร็วเสียงพูด
  
  window.speechSynthesis.speak(utterance);
}

// สลับภาษา A และ B
function swapLanguages() {
  const langB = document.getElementById('langB');
  alert("ฟังก์ชันนี้ไว้สำหรับสลับภาษาคู่สนทนาตามต้องการ");
}

// เพิ่มข้อความลงในแชตประวัติ
function addHistory(speaker, original, translated) {
  const chatBox = document.getElementById('chat');
  const msgDiv = document.createElement('div');
  
  msgDiv.className = `msg ${speaker === 'A' ? 'msg-a' : 'msg-b'}`;
  msgDiv.innerHTML = `
    <div><strong>Speaker ${speaker}:</strong> ${original}</div>
    <div class="trans">➡️ ${translated}</div>
  `;
  
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}
