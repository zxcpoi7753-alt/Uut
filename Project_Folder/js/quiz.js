// js/quiz.js - نظام الاختبارات الذكي (المصحح)

let currentQuestion = null;

// 1. تهيئة القوائم عند التحميل
function initQuiz() {
    const juzSelect = document.getElementById('quiz-juz');
    if(juzSelect) {
        juzSelect.innerHTML = '<option value="all">كل المصحف</option>';
        // إضافة الأجزاء (كخيار شكلي حالياً للتبسيط)
        for(let i=1; i<=30; i++) {
            juzSelect.innerHTML += `<option value="${i}">الجزء ${i}</option>`;
        }
    }
    updateQuizSurahs();
}

// 2. تحديث قائمة السور
function updateQuizSurahs() {
    const surahSelect = document.getElementById('quiz-surah');
    if(!surahSelect) return;
    
    surahSelect.innerHTML = '<option value="all">عشوائي (من كل السور)</option>';
    if(typeof SURAH_NAMES !== 'undefined') {
        SURAH_NAMES.forEach((name, index) => {
            if(index === 0) return;
            surahSelect.innerHTML += `<option value="${index}">${index}. ${name}</option>`;
        });
    }
}

// 3. بدء الاختبار (إصلاح مشكلة عدم الظهور)
async function startQuiz() {
    const quizArea = document.getElementById('quiz-area');
    
    // إخفاء النتيجة السابقة
    quizArea.style.display = 'none';

    // 🔴 التحقق الحاسم: هل بيانات المصحف موجودة؟
    // نظرًا لأن المتغير fullQuranData موجود في ملف quran_app.js، فهو متاح هنا (Global)
    if (!fullQuranData) {
        if(window.showToast) window.showToast("جاري تجهيز بيانات الاختبار...", "info");
        try {
            const response = await fetch('quran.json');
            if(!response.ok) throw new Error("فشل التحميل");
            fullQuranData = await response.json();
        } catch (e) {
            alert("عذراً، فشل تحميل بيانات المصحف للاختبار. تأكد من اتصالك بالإنترنت.");
            return;
        }
    }

    // الآن البيانات موجودة، نولد السؤال
    generateQuestion();
}

// 4. توليد سؤال جديد
function generateQuestion() {
    const surahVal = document.getElementById('quiz-surah').value;
    const typeVal = document.getElementById('quiz-type').value;

    // تحديد السور المتاحة للاختيار منها
    let availableSurahs = [];
    
    if (surahVal !== 'all') {
        availableSurahs = [parseInt(surahVal)]; // سورة محددة
    } else {
        // نختار عشوائياً من كل السور (1 إلى 114)
        availableSurahs = Array.from({length: 114}, (_, i) => i + 1);
    }

    // اختيار سورة عشوائية
    const randomSurahIndex = availableSurahs[Math.floor(Math.random() * availableSurahs.length)];
    const surahData = fullQuranData[randomSurahIndex];

    if (!surahData || !surahData.ayahs || surahData.ayahs.length === 0) {
        alert("حدث خطأ غير متوقع في اختيار السورة، حاول مرة أخرى.");
        return;
    }

    // اختيار آية عشوائية
    const randomAyahIndex = Math.floor(Math.random() * surahData.ayahs.length);
    const ayahObj = surahData.ayahs[randomAyahIndex];

    // حفظ السؤال الحالي في الذاكرة
    currentQuestion = {
        surah: surahData.name,
        surahNum: randomSurahIndex,
        ayahText: ayahObj.text,
        ayahNum: ayahObj.num,
        type: typeVal,
        fullSurahData: surahData, // نحتاج البيانات الكاملة للسابق والتالي
        ayahIndexInArray: randomAyahIndex
    };

    renderQuestionUI();
}

// 5. رسم واجهة السؤال
function renderQuestionUI() {
    const quizArea = document.getElementById('quiz-area');
    const qText = document.getElementById('question-text');
    const ansBox = document.getElementById('answer-box');
    const showAnsBtn = document.getElementById('show-answer-btn');
    
    // إظهار المنطقة وإخفاء الإجابة القديمة
    quizArea.style.display = 'block';
    ansBox.style.display = 'none';
    showAnsBtn.style.display = 'block'; // تأكدنا من ظهور الزر
    
    // تجهيز نص السؤال
    let text = "";
    const verseHtml = `<span class="quran-verse" style="display:block; margin:15px 0; color:var(--primary-color);">"${currentQuestion.ayahText}"</span>`;

    switch(currentQuestion.type) {
        case 'complete':
            // نأخذ أول بضع كلمات فقط
            let words = currentQuestion.ayahText.split(' ');
            let startText = words.slice(0, Math.min(5, words.length)).join(' ');
            text = `أكمل الآية التي تبدأ بـ:<br><span class="quran-verse" style="display:block; margin:15px 0; color:var(--primary-color);">"${startText}..."</span><small>(سورة ${currentQuestion.surah})</small>`;
            break;
        case 'prev_ayah':
            text = `ما هي الآية التي **تسبق** قوله تعالى:${verseHtml}`;
            break;
        case 'next_ayah':
            text = `ما هي الآية التي **تلي** قوله تعالى:${verseHtml}`;
            break;
        case 'ayah_num':
            text = `ما هو **رقم** هذه الآية:${verseHtml}في سورة ${currentQuestion.surah}؟`;
            break;
        case 'surah_name':
            text = `في **أي سورة** توجد هذه الآية:${verseHtml}`;
            break;
        case 'page_num':
             text = `في أي **صفحة** (تقريباً) تقع هذه الآية:${verseHtml}`;
             break;
    }
    
    qText.innerHTML = text;
    // التمرير لمنطقة السؤال
    quizArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 6. إظهار الإجابة
function showAnswer() {
    const ansBox = document.getElementById('answer-box');
    const ansText = document.getElementById('answer-text');
    const ansDet = document.getElementById('answer-details');
    const showAnsBtn = document.getElementById('show-answer-btn');
    
    ansBox.style.display = 'block';
    showAnsBtn.style.display = 'none'; // إخفاء زر الإظهار للترتيب
    
    let answer = "";
    let details = `سورة ${currentQuestion.surah} - الآية ${currentQuestion.ayahNum}`;

    switch(currentQuestion.type) {
        case 'complete':
            answer = currentQuestion.ayahText;
            break;
        case 'prev_ayah':
            if (currentQuestion.ayahIndexInArray > 0) {
                answer = currentQuestion.fullSurahData.ayahs[currentQuestion.ayahIndexInArray - 1].text;
                details = `الآية السابقة رقم ${currentQuestion.ayahNum - 1}`;
            } else {
                answer = "هذه الآية هي الأولى في السورة، لا يوجد قبلها شيء (سوى البسملة).";
            }
            break;
        case 'next_ayah':
             if (currentQuestion.ayahIndexInArray < currentQuestion.fullSurahData.ayahs.length - 1) {
                answer = currentQuestion.fullSurahData.ayahs[currentQuestion.ayahIndexInArray + 1].text;
                details = `الآية التالية رقم ${currentQuestion.ayahNum + 1}`;
            } else {
                answer = "هذه آخر آية في السورة.";
            }
            break;
        case 'ayah_num':
            answer = `رقم الآية: ${currentQuestion.ayahNum}`;
            break;
        case 'surah_name':
            answer = `سورة ${currentQuestion.surah}`;
            break;
        case 'page_num':
            answer = "راجع المصحف للتأكد."; // لأننا لا نملك بيانات الصفحات حالياً
            break;
    }
    
    ansText.innerHTML = answer;
    ansDet.innerHTML = details;
    
    // تمرير للإجابة
    ansBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function nextQuestionSameType() {
    generateQuestion();
}

function resetQuiz() {
    document.getElementById('quiz-area').style.display = 'none';
}
