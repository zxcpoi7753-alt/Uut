// js/quiz.js - نظام الاختبارات
let currentQuizAnswer = {}; 

function initQuiz() {
    const juzSelect = document.getElementById('quiz-juz');
    if(!juzSelect) return; 
    juzSelect.innerHTML = '<option value="0">-- اختر الجزء --</option>';
    for(let i=1; i<=30; i++) {
        let op = document.createElement('option'); op.value = i; op.innerText = `الجزء ${i}`; juzSelect.appendChild(op);
    }
}

function updateQuizSurahs() {
    if (!window.quranData && typeof loadQuranData === 'function') { loadQuranData(); return; }
    const juz = parseInt(document.getElementById('quiz-juz').value);
    const surahSelect = document.getElementById('quiz-surah');
    surahSelect.innerHTML = '<option value="0">كل سور الجزء</option>';
    if (juz === 0) return;

    let startSurah = JUZ_START[juz][0];
    let endSurah = (juz === 30) ? 114 : JUZ_START[juz+1][0];

    for(let i = startSurah; i <= endSurah; i++) {
        let s = window.quranData ? window.quranData[i] : null; // حماية في حال عدم تحميل البيانات
        if(s) {
            let op = document.createElement('option'); op.value = i; op.innerText = `${i}. سورة ${s.name}`; surahSelect.appendChild(op);
        }
    }
}

function generateQuestion() {
    if (!window.quranData) { alert("بيانات المصحف غير محملة (تحتاج ملف json)"); return; }
    const juz = parseInt(document.getElementById('quiz-juz').value);
    const targetSurah = parseInt(document.getElementById('quiz-surah').value);
    const type = document.getElementById('quiz-type').value;

    if (juz === 0) { alert("الرجاء اختيار الجزء أولاً"); return; }
    
    // (يتم اختصار الكود هنا لأنه نفس المنطق السابق، المهم أن يكون في هذا الملف)
    let candidates = [];
    let startS = JUZ_START[juz][0]; let startA = JUZ_START[juz][1];
    let endS = (juz === 30) ? 114 : JUZ_START[juz+1][0];
    if (targetSurah !== 0) { startS = targetSurah; endS = targetSurah; startA = 1; }

    for (let s = startS; s <= endS; s++) {
        let surahObj = window.quranData[s];
        if (!surahObj) continue;
        surahObj.ayahs.forEach(ay => {
            if (s === JUZ_START[juz][0] && ay.num < JUZ_START[juz][1]) return;
            if (juz < 30 && s === JUZ_START[juz+1][0] && ay.num >= JUZ_START[juz+1][1]) return;
            candidates.push({ surahName: surahObj.name, surahNum: s, ayahNum: ay.num, text: ay.text, nextAyah: surahObj.ayahs.find(a => a.num === ay.num + 1)?.text || "نهاية السورة" });
        });
    }
    if (candidates.length === 0) return;
    let randomAyah = candidates[Math.floor(Math.random() * candidates.length)];
    
    let qText = "", aText = "";
    if (type === 'complete') { qText = `أكمل: ${randomAyah.text}`; aText = randomAyah.nextAyah; }
    else { qText = `من أي سورة: ${randomAyah.text}`; aText = randomAyah.surahName; }

    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('question-text').innerHTML = qText;
    document.getElementById('answer-box').style.display = 'none';
    document.getElementById('show-answer-btn').style.display = 'inline-block';
    currentQuizAnswer = { main: aText, det: `سورة ${randomAyah.surahName} - آية ${randomAyah.ayahNum}` };
}

function showAnswer() {
    document.getElementById('show-answer-btn').style.display = 'none';
    document.getElementById('answer-box').style.display = 'block';
    document.getElementById('answer-text').innerHTML = currentQuizAnswer.main;
    document.getElementById('answer-details').innerText = currentQuizAnswer.det;
}
