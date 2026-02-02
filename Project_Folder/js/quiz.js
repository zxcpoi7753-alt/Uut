/* ============================================================
   ملف: js/quiz.js (الأصلي)
   الوظيفة: اختبارات الحفظ العشوائية
   ============================================================ */

let currentQuestion = null;

// خريطة الأجزاء (للتبسيط)
const JUZ_START_PAGES = {
    1:1, 2:22, 3:42, 4:62, 5:82, 6:102, 7:122, 8:142, 9:162, 10:182,
    11:202, 12:222, 13:242, 14:262, 15:282, 16:302, 17:322, 18:342, 19:362, 20:382,
    21:402, 22:422, 23:442, 24:462, 25:482, 26:502, 27:522, 28:542, 29:562, 30:582
};

// تهيئة القوائم
document.addEventListener('DOMContentLoaded', function() {
    initQuiz();
});

function initQuiz() {
    const juzSelect = document.getElementById('quiz-juz');
    if(juzSelect) {
        juzSelect.innerHTML = '<option value="all">كل المصحف (30 جزء)</option>';
        for(let i=1; i<=30; i++) juzSelect.innerHTML += `<option value="${i}">الجزء ${i}</option>`;
    }
}

function updateQuizSurahs() {
    // في النسخة المبسطة نكتفي باختيار الجزء
    // يمكن تطويرها لاحقاً لجلب السور من quran.json
}

async function startQuiz() {
    if (!fullQuranData) {
        // محاولة تحميل البيانات إذا لم تكن موجودة
        try {
            const response = await fetch('quran.json');
            fullQuranData = await response.json();
        } catch (e) {
            alert("جارِ تحميل البيانات... حاول مرة أخرى بعد ثوانٍ.");
            return;
        }
    }
    
    document.getElementById('quiz-area').style.display = 'block';
    generateQuestion();
}

function generateQuestion() {
    const type = document.getElementById('quiz-type').value;
    
    // سنستخدم الأسئلة الثابتة مؤقتاً لضمان عمل الزر، حتى نربط quran.json بدقة
    const questions = [
        {q:"أكمل الآية: (الله لا إله إلا هو...)", a:"الحي القيوم لا تأخذه سنة ولا نوم..."},
        {q:"ما هي السورة التي تعدل ثلث القرآن؟", a:"سورة الإخلاص"},
        {q:"أين تقع آية الدين؟", a:"سورة البقرة، صفحة 48"},
        {q:"أكمل: (والعصر...)", a:"إن الإنسان لفي خسر..."}
    ];
    
    const rand = Math.floor(Math.random() * questions.length);
    currentQuestion = questions[rand];
    
    document.getElementById('question-text').innerText = currentQuestion.q;
    document.getElementById('answer-box').style.display = 'none';
    document.getElementById('show-answer-btn').style.display = 'block';
    document.getElementById('answer-text').innerText = currentQuestion.a;
}

function showAnswer() {
    document.getElementById('answer-box').style.display = 'block';
    document.getElementById('show-answer-btn').style.display = 'none';
}

function nextQuestionSameType() { generateQuestion(); }
function resetQuiz() { document.getElementById('quiz-area').style.display = 'none'; }
