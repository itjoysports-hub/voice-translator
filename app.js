// 🔑 API Key ฟรีจาก Google AI Studio (aistudio.google.com)
const GEMINI_API_KEY = "AQ.Ab8RN6K1HkVeJBVcOV-ywkMW7jqWmSy0q0kC897kCDDeLA_OGA";

async function translateWithGemini(text, sourceLang, targetLang) {
  if (GEMINI_API_KEY === "AQ.Ab8RN6K1HkVeJBVcOV-ywkMW7jqWmSy0q0kC897kCDDeLA_OGA") {
    return "กรุณาใส่ GEMINI_API_KEY ก่อนใช้งาน";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const promptText = `Translate the following text from ${sourceLang} to ${targetLang}. Return ONLY the translated text without quotes or explanation:\n"${text}"`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    return "เกิดข้อผิดพลาดในการแปลภาษา";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "ไม่สามารถเชื่อมต่อระบบแปลภาษาได้";
  }
}
