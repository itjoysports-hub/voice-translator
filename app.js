// ฟังก์ชันอ่านออกเสียง (สามารถเลือกประเภทเสียงได้)
function speakText(text, langCode) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel(); // หยุดเสียงเก่าก่อนเล่นใหม่

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;

  // 🐌 ดึงค่าความเร็วเสียง
  const rateSelect = document.getElementById("speechRate");
  utterance.rate = rateSelect ? parseFloat(rateSelect.value) : 0.8;

  // ----------------------------------------------------
  // 🔊 การเปลี่ยนเสียงอ่าน (Voice Selection)
  // ----------------------------------------------------
  const voices = window.speechSynthesis.getVoices();
  
  // ค้นหาเสียงที่ตรงกับภาษาปลายทาง (เช่น th-TH, my-MM, en-US)
  const availableVoices = voices.filter(voice => voice.lang.includes(langCode.split('-')[0]));

  if (availableVoices.length > 0) {
    // 💡 ตัวเลือกการเลือกเสียง:
    // availableVoices[0] -> เสียงเริ่มต้น (มักจะเป็นเสียงผู้หญิง)
    // availableVoices[1] -> เสียงตัวเลือกที่ 2 (เช่น เสียงผู้ชาย หรือ เสียงจากค่ายอื่น เช่น Google/Microsoft)
    
    // ลองเปลี่ยนเลข index [0] เป็น [1] หรือ [2] เพื่อเปลี่ยนเสียงครับ
    utterance.voice = availableVoices[0]; 
  }

  // 🎚️ ปรับระดับโทนเสียง (Pitch)
  // 1.0 = โทนเสียงปกติ
  // 0.8 = เสียงโทนต่ำลง/ทุ้มขึ้น (ดูลักษณะเหมือนเสียงผู้ชายมากขึ้น)
  // 1.2 = เสียงโทนสูงขึ้น/สดใสขึ้น (ดูลักษณะเหมือนเสียงผู้หญิง)
  utterance.pitch = 1.0; 

  window.speechSynthesis.speak(utterance);
}

// โหลดรายการเสียงเตรียมไว้ในระบบเบราว์เซอร์
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
