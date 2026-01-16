// js/quiz.js - نظام الاختبارات الذكي الشامل (تم إصلاح قائمة السور)

let currentQuestion = null;
let quranData = null;
let pagesData = null;

// 1. تهيئة القوائم
function initQuiz() {
    const juzSelect = document.getElementById('quiz-juz');
    if(!juzSelect) return;
    
    juzSelect.innerHTML = '<option value="0">-- اختر الجزء (عشوائي) --</option>';
    for(let i=1; i<=30; i++) {
        let op = document.createElement('option');
        op.value = i;
        op.innerText = `الجزء ${i}`;
        juzSelect.appendChild(op);
    }
}

// 2. تحديث قائمة السور (الآن تعمل فوراً!)
function updateQuizSurahs() {
    const juz = parseInt(document.getElementById('quiz-juz').value);
    const surahSelect = document.getElementById('quiz-surah');
    surahSelect.innerHTML = '<option value="0">-- كل السور --</option>';
    
    if (juz === 0 || typeof JUZ_START === 'undefined' || typeof SURAH_NAMES === 'undefined') return;

    // تحديد بداية ونهاية الجزء من ملف data.js
    let startSurah = JUZ_START[juz][0];
    let endSurah = (juz === 30) ? 114 : JUZ_START[juz+1][0];

    // تعبئة القائمة من مصفوفة الأسماء مباشرة
    for(let i = startSurah; i <= endSurah; i++) {
        let op = document.createElement('option');
        op.value = i;
        op.innerText = `${i}. سورة ${SURAH_NAMES[i]}`;
        surahSelect.appendChild(op);
    }
}

// 3. بدأ الاختبار
async function startQuiz() {
    document.getElementById('quiz-loading').style.display = 'block';
    document.getElementById('quiz-area').style.display = 'none';

    try {
        if (!quranData) {
            const response = await fetch('quran.json');
            if (!response.ok) throw new Error("تأكد من وجود quran.json");
            quranData = await response.json();
        }
        if (!pagesData) {
            const response = await fetch('pagesquran.json');
            if (!response.ok) throw new Error("تأكد من وجود pagesquran.json");
            pagesData = await response.json();
        }

        document.getElementById('quiz-loading').style.display = 'none';
        generateNewQuestion();

    } catch (error) {
        document.getElementById('quiz-loading').style.display = 'none';
        if(window.showToast) window.showToast("خطأ: لم يتم العثور على ملفات البيانات (quran.json)", "error");
        else alert("خطأ في تحميل الملفات");
        console.error(error);
    }
}

// 4. توليد سؤال جديد
function generateNewQuestion() {
    if (!quranData) return;

    const juz = parseInt(document.getElementById('quiz-juz').value);
    const targetSurah = parseInt(document.getElementById('quiz-surah').value);
    const type = document.getElementById('quiz-type').value;

    let candidates = [];
    let startS = 1, startA = 1, endS = 114;
    
    if (juz > 0 && typeof JUZ_START !== 'undefined') {
        startS = JUZ_START[juz][0];
        startA = JUZ_START[juz][1];
        endS = (juz === 30) ? 114 : JUZ_START[juz+1][0];
    }

    if (targetSurah > 0) {
        startS = targetSurah;
        endS = targetSurah;
        startA = 1;
    }

    for (let s = startS; s <= endS; s++) {
        let surahKey = s.toString();
        let surahObj = quranData[surahKey];
        if (!surahObj) continue;

        surahObj.ayahs.forEach(ay => {
            if (juz > 0 && targetSurah === 0) {
                if (s === JUZ_START[juz][0] && ay.num < JUZ_START[juz][1]) return;
                if (juz < 30 && s === JUZ_START[juz+1][0] && ay.num >= JUZ_START[juz+1][1]) return;
            }
            candidates.push({
                surahNum: s, surahName: surahObj.name, ayahNum: ay.num, text: ay.text
            });
        });
    }

    if (candidates.length === 0) {
        if(window.showToast) window.showToast("لم يتم العثور على آيات!", "info");
        return;
    }

    const randomAyah = candidates[Math.floor(Math.random() * candidates.length)];
    prepareQuestionLogic(randomAyah, type);
}

// 5. منطق السؤال
function prepareQuestionLogic(ayah, type) {
    let qText = "", aText = "", details = `سورة ${ayah.surahName} | الآية ${ayah.ayahNum}`;

    switch (type) {
        case 'complete':
            qText = `أكمل الآية التالية:<br><br><span class="quran-verse" style="font-size:1.6rem">"${ayah.text}"</span>`;
            const nextAyahObj = getAyah(ayah.surahNum, ayah.ayahNum + 1);
            aText = nextAyahObj ? `<span class="quran-verse">${nextAyahObj.text}</span>` : "هذه آخر آية في السورة.";
            break;
        case 'prev_ayah':
            qText = `ما هي الآية التي تسبق قوله تعالى:<br><br><span class="quran-verse">"${ayah.text}"</span>`;
            const prevAyahObj = getAyah(ayah.surahNum, ayah.ayahNum - 1);
            aText = prevAyahObj ? `<span class="quran-verse">${prevAyahObj.text}</span>` : "هذه أول آية في السورة.";
            break;
        case 'next_ayah':
            qText = `ما هي الآية التي تلي قوله تعالى:<br><br><span class="quran-verse">"${ayah.text}"</span>`;
            const nextA = getAyah(ayah.surahNum, ayah.ayahNum + 1);
            aText = nextA ? `<span class="quran-verse">${nextA.text}</span>` : "هذه آخر آية في السورة.";
            break;
        case 'ayah_num':
            qText = `ما هو رقم هذه الآية؟<br><br><span class="quran-verse">"${ayah.text}"</span>`;
            aText = `الآية رقم <strong>${ayah.ayahNum}</strong>`;
            break;
        case 'surah_name':
            qText = `في أي سورة وردت هذه الآية؟<br><br><span class="quran-verse">"${ayah.text}"</span>`;
            aText = `سورة <strong>${ayah.surahName}</strong>`;
            break;
        case 'page_num':
            qText = `في أي صفحة تقع هذه الآية؟<br><br><span class="quran-verse">"${ayah.text}"</span>`;
            const pageNum = getPageNumber(ayah.surahNum, ayah.ayahNum);
            aText = pageNum ? `الصفحة <strong>${pageNum}</strong>` : "غير محدد";
            break;
    }

    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('question-text').innerHTML = qText;
    document.getElementById('answer-box').style.display = 'none';
    document.getElementById('show-answer-btn').style.display = 'inline-block';
    currentQuestion = { main: aText, det: details };
    document.getElementById('quiz-area').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function getAyah(surahNum, ayahNum) {
    if (!quranData) return null;
    const surah = quranData[surahNum.toString()];
    return surah ? surah.ayahs.find(a => a.num === ayahNum) : null;
}

function getPageNumber(surahNum, ayahNum) {
    if (!pagesData) return null;
    const page = pagesData.find(p => {
        const afterStart = (surahNum > p.start.surah_number) || (surahNum === p.start.surah_number && ayahNum >= p.start.verse);
        const beforeEnd = (surahNum < p.end.surah_number) || (surahNum === p.end.surah_number && ayahNum <= p.end.verse);
        return afterStart && beforeEnd;
    });
    return page ? page.page : null;
}

function showAnswer() {
    document.getElementById('show-answer-btn').style.display = 'none';
    const box = document.getElementById('answer-box');
    box.style.display = 'block';
    document.getElementById('answer-text').innerHTML = currentQuestion.main;
    document.getElementById('answer-details').innerText = currentQuestion.det;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function nextQuestionSameType() { generateNewQuestion(); }
function resetQuiz() {
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('quiz-controls').scrollIntoView({ behavior: 'smooth' });
}
