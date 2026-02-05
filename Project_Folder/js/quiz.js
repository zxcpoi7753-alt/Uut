/* ============================================================
   ملف: js/quiz.js (V30 - الإصدار المطور)
   الوظيفة: نظام اختبار الحفظ الذكي المرتبط ببيانات المصحف
   ============================================================ */

let currentQuestion = null;
let quranPagesData = null; // لحفظ بيانات أرقام الصفحات

// خريطة دقيقة لتوزيع السور على الأجزاء (تستخدم للفلترة)
const JUZ_MAPPING = {
    "1": [1, 2], "2": [2, 2], "3": [2, 3], "4": [3, 4], "5": [4, 4],
    "6": [4, 5], "7": [5, 6], "8": [6, 7], "9": [7, 8], "10": [8, 9],
    "11": [9, 11], "12": [11, 12], "13": [12, 14], "14": [15, 16], "15": [17, 18],
    "16": [18, 20], "17": [21, 22], "18": [23, 25], "19": [25, 27], "20": [27, 29],
    "21": [29, 33], "22": [33, 36], "23": [36, 39], "24": [39, 41], "25": [41, 45],
    "26": [46, 51], "27": [51, 57], "28": [58, 66], "29": [67, 77], "30": [78, 114]
};

// 1. تحديث قائمة السور بناءً على الجزء المختار
window.updateQuizSurahs = function() {
    const juz = document.getElementById('quiz-juz').value;
    const surahSelect = document.getElementById('quiz-surah');
    if(!surahSelect) return;

    surahSelect.innerHTML = '<option value="all">عشوائي من الجزء المختارة</option>';
    
    let start = 1, end = 114;
    if(juz !== 'all' && JUZ_MAPPING[juz]) {
        start = JUZ_MAPPING[juz][0];
        end = JUZ_MAPPING[juz][1];
    }

    // SURAH_NAMES مستدعى من data.js
    if(typeof SURAH_NAMES !== 'undefined') {
        for(let i = start; i <= end; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = `${i}. ${SURAH_NAMES[i]}`;
            surahSelect.appendChild(opt);
        }
    }
};

// 2. تحميل البيانات والبدء
window.startQuiz = async function() {
    if (!fullQuranData) {
        showToast("جاري تحميل بيانات المصحف... يرجى الانتظار ثواني", "info");
        try {
            const res = await fetch('quran.json');
            fullQuranData = await res.json();
            // تحميل بيانات الصفحات أيضاً للسؤال عن رقم الصفحة
            const resPages = await fetch('pagesquran.json');
            quranPagesData = await resPages.json();
        } catch (e) {
            showToast("فشل تحميل البيانات. تأكد من ملفات JSON", "error");
            return;
        }
    }
    
    document.getElementById('quiz-area').style.display = 'block';
    generateQuestion();
};

// 3. توليد السؤال العشوائي
window.generateQuestion = function() {
    const juzChoice = document.getElementById('quiz-juz').value;
    const surahChoice = document.getElementById('quiz-surah').value;
    const type = document.getElementById('quiz-type').value;

    let possibleSurahs = [];
    if(surahChoice !== 'all') {
        possibleSurahs = [parseInt(surahChoice)];
    } else {
        let start = 1, end = 114;
        if(juzChoice !== 'all' && JUZ_MAPPING[juzChoice]) {
            start = JUZ_MAPPING[juzChoice][0];
            end = JUZ_MAPPING[juzChoice][1];
        }
        for(let i = start; i <= end; i++) possibleSurahs.push(i);
    }

    const randomSurahNum = possibleSurahs[Math.floor(Math.random() * possibleSurahs.length)];
    const surahData = fullQuranData[randomSurahNum];
    
    if(!surahData || !surahData.ayahs) return generateQuestion();

    const randomAyahIdx = Math.floor(Math.random() * surahData.ayahs.length);
    const ayah = surahData.ayahs[randomAyahIdx];

    currentQuestion = {
        surahName: surahData.name,
        surahNum: randomSurahNum,
        ayahText: ayah.text,
        ayahNum: ayah.num,
        ayahIdx: randomAyahIdx,
        surahData: surahData,
        type: type
    };

    renderQuestionUI();
};

// 4. عرض واجهة السؤال
function renderQuestionUI() {
    const qText = document.getElementById('question-text');
    const ansBox = document.getElementById('answer-box');
    const showBtn = document.getElementById('show-answer-btn');

    ansBox.style.display = 'none';
    showBtn.style.display = 'block';

    let html = "";
    const verseHtml = `<div class="quiz-verse-text">"${currentQuestion.ayahText}"</div>`;

    switch(currentQuestion.type) {
        case 'complete':
            const words = currentQuestion.ayahText.split(' ');
            const partial = words.slice(0, 5).join(' ') + " ...";
            html = `أكمل الآية التالية:<br><div class="quiz-verse-text">"${partial}"</div><small>(سورة ${currentQuestion.surahName})</small>`;
            break;
        case 'prev_ayah':
            html = `ما هي الآية التي <strong>تسبق</strong> هذه الآية؟<br>${verseHtml}`;
            break;
        case 'next_ayah':
            html = `ما هي الآية التي <strong>تلي</strong> هذه الآية؟<br>${verseHtml}`;
            break;
        case 'ayah_num':
            html = `ما هو <strong>رقم الآية</strong> التالية في سورة ${currentQuestion.surahName}؟<br>${verseHtml}`;
            break;
        case 'surah_name':
            html = `في أي <strong>سورة</strong> توجد الآية التالية؟<br>${verseHtml}`;
            break;
        case 'page_num':
            html = `في أي <strong>صفحة</strong> تقع الآية التالية؟<br>${verseHtml}`;
            break;
    }

    qText.innerHTML = html;
    document.getElementById('quiz-area').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 5. كشف الإجابة الصحيحة
window.showAnswer = function() {
    const ansBox = document.getElementById('answer-box');
    const ansText = document.getElementById('answer-text');
    const ansDet = document.getElementById('answer-details');
    const showBtn = document.getElementById('show-answer-btn');

    ansBox.style.display = 'block';
    showBtn.style.display = 'none';

    let answer = "";
    let details = `سورة ${currentQuestion.surahName} | الآية رقم ${currentQuestion.ayahNum}`;

    switch(currentQuestion.type) {
        case 'complete':
            answer = currentQuestion.ayahText;
            break;
        case 'prev_ayah':
            answer = (currentQuestion.ayahIdx > 0) ? currentQuestion.surahData.ayahs[currentQuestion.ayahIdx - 1].text : "هذه هي أول آية في السورة.";
            break;
        case 'next_ayah':
            answer = (currentQuestion.ayahIdx < currentQuestion.surahData.ayahs.length - 1) ? currentQuestion.surahData.ayahs[currentQuestion.ayahIdx + 1].text : "هذه هي آخر آية في السورة.";
            break;
        case 'ayah_num':
            answer = `الآية رقم: ${currentQuestion.ayahNum}`;
            break;
        case 'surah_name':
            answer = `سورة ${currentQuestion.surahName}`;
            break;
        case 'page_num':
            answer = findPageNumber(currentQuestion.surahNum, currentQuestion.ayahNum);
            break;
    }

    ansText.innerHTML = `<div class="quiz-verse-text answer">${answer}</div>`;
    ansDet.innerText = details;
};

// دالة البحث عن رقم الصفحة من ملف pagesquran.json
function findPageNumber(sNum, aNum) {
    if(!quranPagesData) return "يرجى مراجعة المصحف.";
    
    // البحث في بيانات الصفحات
    const pageObj = quranPagesData.find(p => {
        // نتحقق إذا كانت السورة تقع ضمن نطاق الصفحة
        // ملاحظة: هذا منطق تقريبي يعتمد على هيكل pagesquran.json المرفوع
        if(p.start.surah_number <= sNum && p.end.surah_number >= sNum) {
            // تحقق أدق من الآيات إذا كانت نفس السورة
            if(p.start.surah_number === sNum && aNum < p.start.verse) return false;
            if(p.end.surah_number === sNum && aNum > p.end.verse) return false;
            return true;
        }
        return false;
    });

    return pageObj ? `تقع في الصفحة رقم: ${pageObj.page}` : "يرجى مراجعة المصحف.";
}

function resetQuiz() {
    document.getElementById('quiz-area').style.display = 'none';
}

