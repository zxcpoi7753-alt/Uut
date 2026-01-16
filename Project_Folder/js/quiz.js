// js/quiz.js - نظام الاختبارات الذكي الشامل

let currentQuestion = null; // لتخزين السؤال الحالي
let quranData = null;       // لتخزين بيانات المصحف
let pagesData = null;       // لتخزين بيانات الصفحات

// 1. تهيئة القوائم (يتم استدعاؤها عند فتح الموقع)
function initQuiz() {
    const juzSelect = document.getElementById('quiz-juz');
    if(!juzSelect) return;
    
    // تعبئة الأجزاء
    juzSelect.innerHTML = '<option value="0">-- اختر الجزء (عشوائي) --</option>';
    for(let i=1; i<=30; i++) {
        let op = document.createElement('option');
        op.value = i;
        op.innerText = `الجزء ${i}`;
        juzSelect.appendChild(op);
    }
}

// 2. تحديث قائمة السور عند اختيار جزء (يعتمد على JUZ_START في data.js)
function updateQuizSurahs() {
    const juz = parseInt(document.getElementById('quiz-juz').value);
    const surahSelect = document.getElementById('quiz-surah');
    surahSelect.innerHTML = '<option value="0">-- كل السور --</option>';
    
    if (juz === 0 || typeof JUZ_START === 'undefined') return;

    // تحديد نطاق السور في هذا الجزء
    let startSurah = JUZ_START[juz][0];
    let endSurah = (juz === 30) ? 114 : JUZ_START[juz+1][0];

    // بما أننا لم نحمل المصحف بعد، سنعرض الأرقام فقط أو نعتمد على التحميل لاحقاً
    // لتحسين التجربة، سنترك الخيار عاماً حتى يتم التحميل
    // (يمكن تحسين هذا الجزء إذا أردنا أسماء السور قبل التحميل، لكن ليس ضرورياً)
}

// 3. بدأ الاختبار (تحميل البيانات أولاً)
async function startQuiz() {
    // إظهار مؤشر التحميل
    document.getElementById('quiz-loading').style.display = 'block';
    document.getElementById('quiz-area').style.display = 'none';

    try {
        // تحميل المصحف إذا لم يكن موجوداً
        if (!quranData) {
            const response = await fetch('quran.json');
            if (!response.ok) throw new Error("لم يتم العثور على ملف quran.json");
            quranData = await response.json();
        }

        // تحميل أرقام الصفحات إذا لم تكن موجودة
        if (!pagesData) {
            const response = await fetch('pagesquran.json');
            if (!response.ok) throw new Error("لم يتم العثور على ملف pagesquran.json");
            pagesData = await response.json();
        }

        // إخفاء التحميل وبدء السؤال
        document.getElementById('quiz-loading').style.display = 'none';
        generateNewQuestion();

    } catch (error) {
        document.getElementById('quiz-loading').style.display = 'none';
        if(window.showToast) window.showToast("خطأ: تأكد من وجود ملفات quran.json و pagesquran.json بجانب index.html", "error");
        else alert("خطأ في تحميل الملفات");
        console.error(error);
    }
}

// 4. توليد سؤال جديد
function generateNewQuestion() {
    if (!quranData) return;

    const juz = parseInt(document.getElementById('quiz-juz').value);
    const targetSurah = parseInt(document.getElementById('quiz-surah').value); // 0 = الكل
    const type = document.getElementById('quiz-type').value;

    // تجميع الآيات المرشحة (Candidates)
    let candidates = [];
    
    // تحديد حدود البحث (الجزء)
    let startS = 1, startA = 1, endS = 114;
    
    if (juz > 0 && typeof JUZ_START !== 'undefined') {
        startS = JUZ_START[juz][0];
        startA = JUZ_START[juz][1]; // بداية الجزء بدقة
        endS = (juz === 30) ? 114 : JUZ_START[juz+1][0];
    }

    // إذا حدد سورة معينة، نتجاوز حدود الجزء
    if (targetSurah > 0) {
        startS = targetSurah;
        endS = targetSurah;
        startA = 1;
    }

    // البحث في البيانات
    for (let s = startS; s <= endS; s++) {
        // مفاتيح quran.json عادة تكون سلاسل نصية ("1", "114")
        let surahKey = s.toString();
        let surahObj = quranData[surahKey];
        
        if (!surahObj) continue;

        surahObj.ayahs.forEach(ay => {
            // فلترة دقيقة لحدود الجزء
            if (juz > 0 && targetSurah === 0) {
                // إذا كنا في أول سورة بالجزء، نتجاوز الآيات التي قبل بداية الجزء
                if (s === JUZ_START[juz][0] && ay.num < JUZ_START[juz][1]) return;
                // إذا كنا في بداية الجزء التالي (تجاوزنا الحد)، نتوقف
                if (juz < 30 && s === JUZ_START[juz+1][0] && ay.num >= JUZ_START[juz+1][1]) return;
            }

            candidates.push({
                surahNum: s,
                surahName: surahObj.name,
                ayahNum: ay.num,
                text: ay.text,
                totalAyahs: surahObj.ayahs.length
            });
        });
    }

    if (candidates.length === 0) {
        window.showToast("لم يتم العثور على آيات في هذا النطاق!", "info");
        return;
    }

    // اختيار آية عشوائية
    const randomAyah = candidates[Math.floor(Math.random() * candidates.length)];
    prepareQuestionLogic(randomAyah, type);
}

// 5. تجهيز منطق السؤال والإجابة
function prepareQuestionLogic(ayah, type) {
    let qText = "";
    let aText = "";
    let details = `سورة ${ayah.surahName} | الآية ${ayah.ayahNum}`;

    switch (type) {
        case 'complete': // أكمل الآية
            qText = `أكمل الآية التالية:<br><br><span class="quran-verse" style="font-size:1.6rem">"${ayah.text}"</span>`;
            // البحث عن الآية التالية
            const nextAyahObj = getAyah(ayah.surahNum, ayah.ayahNum + 1);
            aText = nextAyahObj ? 
                `<span class="quran-verse">${nextAyahObj.text}</span>` : 
                "هذه آخر آية في السورة.";
            break;

        case 'prev_ayah': // ما الآية السابقة
            qText = `ما هي الآية التي تسبق قوله تعالى:<br><br><span class="quran-verse">"${ayah.text}"</span>`;
            const prevAyahObj = getAyah(ayah.surahNum, ayah.ayahNum - 1);
            aText = prevAyahObj ? 
                `<span class="quran-verse">${prevAyahObj.text}</span>` : 
                "هذه أول آية في السورة.";
            break;

        case 'next_ayah': // ما الآية التالية
            qText = `ما هي الآية التي تلي قوله تعالى:<br><br><span class="quran-verse">"${ayah.text}"</span>`;
            const nextA = getAyah(ayah.surahNum, ayah.ayahNum + 1);
            aText = nextA ? 
                `<span class="quran-verse">${nextA.text}</span>` : 
                "هذه آخر آية في السورة.";
            break;

        case 'ayah_num': // رقم الآية
            qText = `ما هو رقم هذه الآية؟<br><br><span class="quran-verse">"${ayah.text}"</span>`;
            aText = `الآية رقم <strong>${ayah.ayahNum}</strong>`;
            break;

        case 'surah_name': // اسم السورة
            qText = `في أي سورة وردت هذه الآية؟<br><br><span class="quran-verse">"${ayah.text}"</span>`;
            aText = `سورة <strong>${ayah.surahName}</strong>`;
            break;

        case 'page_num': // رقم الصفحة (يحتاج pagesquran.json)
            qText = `في أي صفحة تقع هذه الآية؟<br><br><span class="quran-verse">"${ayah.text}"</span>`;
            const pageNum = getPageNumber(ayah.surahNum, ayah.ayahNum);
            aText = pageNum ? `الصفحة <strong>${pageNum}</strong>` : "غير محدد";
            break;
    }

    // عرض السؤال
    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('question-text').innerHTML = qText;
    
    // إخفاء الإجابة
    document.getElementById('answer-box').style.display = 'none';
    document.getElementById('show-answer-btn').style.display = 'inline-block';

    // تخزين البيانات الحالية
    currentQuestion = { main: aText, det: details };
    
    // تمرير الشاشة للسؤال
    document.getElementById('quiz-area').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 6. دوال مساعدة للبحث في البيانات
function getAyah(surahNum, ayahNum) {
    if (!quranData) return null;
    const surahKey = surahNum.toString();
    const surah = quranData[surahKey];
    if (!surah) return null;
    return surah.ayahs.find(a => a.num === ayahNum);
}

function getPageNumber(surahNum, ayahNum) {
    if (!pagesData) return null;
    // ملف pagesquran.json عبارة عن مصفوفة صفحات
    // كل عنصر يحتوي: { page: 1, start: {surah_number:1, verse:1}, end: {...} }
    
    const page = pagesData.find(p => {
        // التحقق مما إذا كانت الآية تقع بين البداية والنهاية للصفحة
        
        // هل السورة أكبر من بداية الصفحة وأصغر من نهايتها؟
        const afterStart = (surahNum > p.start.surah_number) || 
                           (surahNum === p.start.surah_number && ayahNum >= p.start.verse);
                           
        const beforeEnd = (surahNum < p.end.surah_number) || 
                          (surahNum === p.end.surah_number && ayahNum <= p.end.verse);
                          
        return afterStart && beforeEnd;
    });

    return page ? page.page : null;
}

// 7. التحكم في الواجهة
function showAnswer() {
    document.getElementById('show-answer-btn').style.display = 'none';
    const box = document.getElementById('answer-box');
    box.style.display = 'block';
    
    document.getElementById('answer-text').innerHTML = currentQuestion.main;
    document.getElementById('answer-details').innerText = currentQuestion.det;
    
    // تحريك للإجابة
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function nextQuestionSameType() {
    generateNewQuestion();
}

function resetQuiz() {
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('quiz-controls').scrollIntoView({ behavior: 'smooth' });
}
