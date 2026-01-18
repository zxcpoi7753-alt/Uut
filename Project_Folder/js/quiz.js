// js/quiz.js - نظام الاختبارات (مصحح الفلترة)

let currentQuestion = null;

// خريطة توزيع السور على الأجزاء (ثابتة ودقيقة)
const JUZ_MAPPING = {
    "1": [1, 2], "2": [2, 2], "3": [2, 3], "4": [3, 4], "5": [4, 4],
    "6": [4, 5], "7": [5, 6], "8": [6, 7], "9": [7, 8], "10": [8, 9],
    "11": [9, 11], "12": [11, 12], "13": [12, 14], "14": [15, 16], "15": [17, 18],
    "16": [18, 20], "17": [21, 22], "18": [23, 25], "19": [25, 27], "20": [27, 29],
    "21": [29, 33], "22": [33, 36], "23": [36, 39], "24": [39, 41], "25": [41, 45],
    "26": [46, 51], "27": [51, 57], "28": [58, 66], "29": [67, 77], "30": [78, 114]
};

// 1. تهيئة القوائم
function initQuiz() {
    const juzSelect = document.getElementById('quiz-juz');
    if(juzSelect) {
        // إعادة تعبئة القائمة لضمان القيم الصحيحة
        juzSelect.innerHTML = '<option value="all">كل المصحف (30 جزء)</option>';
        for(let i=1; i<=30; i++) {
            juzSelect.innerHTML += `<option value="${i}">الجزء ${i}</option>`;
        }
    }
    // استدعاء التحديث فوراً
    updateQuizSurahs();
}

// 2. تحديث قائمة السور (الفلترة)
function updateQuizSurahs() {
    const surahSelect = document.getElementById('quiz-surah');
    // نأخذ القيمة كنص لضمان التوافق مع المفاتيح
    const selectedJuz = String(document.getElementById('quiz-juz').value);
    
    if(!surahSelect) return;
    
    // تفريغ القائمة
    surahSelect.innerHTML = '<option value="all">عشوائي (من المحدد)</option>';
    
    if(typeof SURAH_NAMES !== 'undefined') {
        let start = 1; 
        let end = 114;

        // التحقق: هل الاختيار ليس "الكل" وهل هو موجود في الخريطة؟
        if (selectedJuz !== 'all' && JUZ_MAPPING[selectedJuz]) {
            start = JUZ_MAPPING[selectedJuz][0];
            end = JUZ_MAPPING[selectedJuz][1];
        }

        SURAH_NAMES.forEach((name, index) => {
            if(index === 0) return; 
            
            // الشرط الحاسم: إضافة السورة فقط إذا كانت ضمن النطاق
            if (index >= start && index <= end) {
                surahSelect.innerHTML += `<option value="${index}">${index}. ${name}</option>`;
            }
        });
    }
}

// 3. بدء الاختبار
async function startQuiz() {
    const quizArea = document.getElementById('quiz-area');
    quizArea.style.display = 'none';

    if (!fullQuranData) {
        if(window.showToast) window.showToast("جاري تجهيز البيانات...", "info");
        try {
            const response = await fetch('quran.json');
            if(!response.ok) throw new Error("فشل");
            fullQuranData = await response.json();
        } catch (e) {
            alert("فشل تحميل البيانات. تأكد من الإنترنت.");
            return;
        }
    }
    generateQuestion();
}

// 4. توليد السؤال
function generateQuestion() {
    const surahVal = document.getElementById('quiz-surah').value;
    const typeVal = document.getElementById('quiz-type').value;
    const juzVal = String(document.getElementById('quiz-juz').value);

    let availableSurahs = [];
    
    if (surahVal !== 'all') {
        availableSurahs = [parseInt(surahVal)];
    } else if (juzVal !== 'all' && JUZ_MAPPING[juzVal]) {
        // تجميع السور المتاحة في الجزء المختار
        const start = JUZ_MAPPING[juzVal][0];
        const end = JUZ_MAPPING[juzVal][1];
        for(let i=start; i<=end; i++) availableSurahs.push(i);
    } else {
        // كل المصحف
        availableSurahs = Array.from({length: 114}, (_, i) => i + 1);
    }

    const randomSurahIndex = availableSurahs[Math.floor(Math.random() * availableSurahs.length)];
    const surahData = fullQuranData[randomSurahIndex];

    if (!surahData || !surahData.ayahs) {
        alert("حدث خطأ، حاول مجدداً.");
        return;
    }

    const randomAyahIndex = Math.floor(Math.random() * surahData.ayahs.length);
    const ayahObj = surahData.ayahs[randomAyahIndex];

    currentQuestion = {
        surah: surahData.name,
        surahNum: randomSurahIndex,
        ayahText: ayahObj.text,
        ayahNum: ayahObj.num,
        type: typeVal,
        fullSurahData: surahData,
        ayahIndexInArray: randomAyahIndex
    };

    renderQuestionUI();
}

// 5. الواجهة
function renderQuestionUI() {
    const quizArea = document.getElementById('quiz-area');
    const qText = document.getElementById('question-text');
    const ansBox = document.getElementById('answer-box');
    const showAnsBtn = document.getElementById('show-answer-btn');
    
    quizArea.style.display = 'block';
    ansBox.style.display = 'none';
    showAnsBtn.style.display = 'block';
    
    let text = "";
    const verseHtml = `<span class="quran-verse" style="display:block; margin:15px 0; color:var(--primary-color);">"${currentQuestion.ayahText}"</span>`;

    switch(currentQuestion.type) {
        case 'complete':
            let words = currentQuestion.ayahText.split(' ');
            let startText = words.slice(0, Math.min(5, words.length)).join(' ');
            text = `أكمل الآية:<br><span class="quran-verse" style="display:block; margin:15px 0; color:var(--primary-color);">"${startText}..."</span><small>(سورة ${currentQuestion.surah})</small>`;
            break;
        case 'prev_ayah': text = `ما الآية التي **تسبق**: ${verseHtml}`; break;
        case 'next_ayah': text = `ما الآية التي **تلي**: ${verseHtml}`; break;
        case 'ayah_num': text = `ما **رقم** هذه الآية: ${verseHtml}في سورة ${currentQuestion.surah}؟`; break;
        case 'surah_name': text = `في **أي سورة** توجد: ${verseHtml}`; break;
        case 'page_num': text = `في أي **صفحة** تقع: ${verseHtml}`; break;
    }
    
    qText.innerHTML = text;
    quizArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showAnswer() {
    const ansBox = document.getElementById('answer-box');
    const ansText = document.getElementById('answer-text');
    const ansDet = document.getElementById('answer-details');
    const showAnsBtn = document.getElementById('show-answer-btn');
    
    ansBox.style.display = 'block';
    showAnsBtn.style.display = 'none';
    
    let answer = "";
    let details = `سورة ${currentQuestion.surah} - الآية ${currentQuestion.ayahNum}`;

    switch(currentQuestion.type) {
        case 'complete': answer = currentQuestion.ayahText; break;
        case 'prev_ayah':
            answer = (currentQuestion.ayahIndexInArray > 0) ? currentQuestion.fullSurahData.ayahs[currentQuestion.ayahIndexInArray - 1].text : "هذه أول آية.";
            break;
        case 'next_ayah':
             answer = (currentQuestion.ayahIndexInArray < currentQuestion.fullSurahData.ayahs.length - 1) ? currentQuestion.fullSurahData.ayahs[currentQuestion.ayahIndexInArray + 1].text : "هذه آخر آية.";
            break;
        case 'ayah_num': answer = `الرقم: ${currentQuestion.ayahNum}`; break;
        case 'surah_name': answer = `سورة ${currentQuestion.surah}`; break;
        case 'page_num': answer = "راجع المصحف."; break;
    }
    
    ansText.innerHTML = answer;
    ansDet.innerHTML = details;
    ansBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function nextQuestionSameType() { generateQuestion(); }
function resetQuiz() { document.getElementById('quiz-area').style.display = 'none'; }
