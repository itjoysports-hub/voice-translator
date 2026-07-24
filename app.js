const original =
document.getElementById("original");

const translated =
document.getElementById("translated");

const chat =
document.getElementById("chat");


// =====================
// Speech Recognition
// =====================


function startVoice(){


if(!('webkitSpeechRecognition' in window)){

alert(
"Browser ไม่รองรับ Speech Recognition"
);

return;

}


let recognition =
new webkitSpeechRecognition();


let lang =
document.getElementById(
"fromLang"
).value;


recognition.lang =
lang;


recognition.continuous=false;


recognition.start();



original.innerHTML =
"🎧 กำลังฟัง...";



recognition.onresult=function(event){


let text =
event.results[0][0].transcript;


original.innerHTML=text;


translateText(text);


}



recognition.onerror=function(){

original.innerHTML=
"❌ ไม่ได้ยินเสียง";

}


}



// =====================
// Translate API
// =====================


async function translateText(text){


let source =
document.getElementById(
"fromLang"
).value;


let target =
document.getElementById(
"toLang"
).value;



try{


let response =
await fetch(
"https://libretranslate.com/translate",
{

method:"POST",

headers:{

"Content-Type":
"application/json"

},

body:JSON.stringify({

q:text,

source:source,

target:target,

format:"text"

})


});



let data =
await response.json();



let result =
data.translatedText;


translated.innerHTML=result;



speak(result,target);



addChat(
text,
result
);



}

catch(error){

translated.innerHTML=
"❌ แปลไม่สำเร็จ";

}


}



// =====================
// Text To Speech
// =====================


function speak(text,lang){


let speech =
new SpeechSynthesisUtterance();


speech.text=text;


speech.lang =
lang==="th"
?"th-TH"
:
lang==="en"
?"en-US"
:
lang==="ja"
?"ja-JP"
:
"zh-CN";


speech.rate=1;


speechSynthesis.speak(
speech
);


}



// =====================
// History
// =====================


function addChat(a,b){


let div =
document.createElement(
"div"
);


div.className=
"chat-item";


div.innerHTML=
`
🎤 ${a}
<br>
🔊 ${b}
`;


chat.prepend(div);


}



// =====================
// Swap Language
// =====================


document
.getElementById("swap")
.onclick=function(){


let a =
document.getElementById(
"fromLang"
);


let b =
document.getElementById(
"toLang"
);



let temp=a.value;

a.value=b.value;

b.value=temp;


}