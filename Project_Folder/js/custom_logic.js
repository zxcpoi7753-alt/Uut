/* ============================================================
   ملف: js/custom_logic.js (V23 - دمج القديم مع الجديد)
   الوظيفة: تشغيل بيانات فايربيس + تشغيل أدوات الطالب القديمة
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBm8ML-1EKvQT76FJlzIQf4sn4M-MHhiRk",
  authDomain: "quran-app-93e24.firebaseapp.com",
  projectId: "quran-app-93e24",
  storageBucket: "quran-app-93e24.firebasestorage.app",
  messagingSenderId: "82150677933",
  appId: "1:82150677933:web:64213e04463c1bb3179524"
};

try {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // 1. عند تحميل الصفحة، نشغل الأدوات القديمة والجديدة
    document.addEventListener('DOMContentLoaded', function() {
        initOldCalculator(); // تشغيل الحاسبة (الكود القديم)
        // الأذكار والمصحف يعتمدان على ملفاتهم الخاصة (azkar.js, quran_app.js)
    });

    // 2. جلب بيانات الموقع من فايربيس
    db.ref().on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            applyAllData(data);
            if(data.settings) handlePopupNotification(data.settings);
        }
    });

} catch (error) { console.error("Firebase Error:", error); }


// ============================================================
// الجزء الأول: أكواد ركن الطالب (من ملفاتك القديمة calculator.js و quiz.js)
// ============================================================

// 1. دالة فتح القوائم (Accordion)
window.toggleAccordion = function(btn) {
    btn.classList.toggle('active');
    var panel = btn.nextElementSibling;
    if (panel.style.display === "block") {
        panel.style.display = "none";
        if(btn.querySelector('span')) btn.querySelector('span').innerText = "▼";
    } else {
        panel.style.display = "block";
        if(btn.querySelector('span')) btn.querySelector('span').innerText = "▲";
    }
}

// 2. منطق الحاسبة (تم جلبه من calculator.js)
let selectedDaysPerWeek = 0;

function initOldCalculator() {
    // تعبئة أزرار الأيام
    const daysContainer = document.getElementById('days-buttons-container');
    if(daysContainer) {
        daysContainer.innerHTML = '';
        [1, 2, 3, 4, 5, 6, 7].forEach(d => {
            const btn = document.createElement('div');
            btn.className = 'calc-btn-option';
            btn.innerText = `${d} أيام`;
            btn.onclick = function() { selectDays(d, this); };
            daysContainer.appendChild(btn);
        });
    }

    // تعبئة أزرار المقدار
    const amountContainer = document.getElementById('amount-buttons-container');
    if(amountContainer) {
        amountContainer.innerHTML = '';
        const amounts = [
            {l:"نصف صفحة", v:0.5}, {l:"صفحة", v:1}, {l:"صفحتان", v:2},
            {l:"3 صفحات", v:3}, {l:"4 صفحات", v:4}, {l:"5 صفحات", v:5}
        ];
        amounts.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'calc-btn-option';
            btn.innerText = opt.l;
            btn.onclick = function() { calculatePlan(opt.v); };
            amountContainer.appendChild(btn);
        });
    }
}

function selectDays(days, btn) {
    selectedDaysPerWeek = days;
    document.querySelectorAll('#days-buttons-container .calc-btn-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('step-2-container').style.display = 'block';
}

window.calculatePlan = function(amount) {
    if(!selectedDaysPerWeek) { alert("اختر عدد الأيام أولاً"); return; }
    
    const totalPages = 604;
    const pagesPerWeek = amount * selectedDaysPerWeek;
    const weeksNeeded = totalPages / pagesPerWeek;
    const monthsNeeded = weeksNeeded / 4.3;
    const yearsNeeded = monthsNeeded / 12;

    let timeText = "";
    if (yearsNeeded >= 1) {
        timeText = `${Math.floor(yearsNeeded)} سنة و ${Math.round((yearsNeeded%1)*12)} شهر`;
    } else {
        timeText = `${Math.round(monthsNeeded)} شهر تقريباً`;
    }

    const resDiv = document.getElementById('calc-result');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `<strong>النتيجة:</strong><br>ستختم خلال <strong>${timeText}</strong> بإذن الله.<br><small>(بمعدل ${amount} صفحة، ${selectedDaysPerWeek} أيام أسبوعياً)</small>`;
    document.getElementById('reset-calc').style.display = 'block';
}

window.resetCalc = function() {
    selectedDaysPerWeek = 0;
    document.getElementById('step-2-container').style.display = 'none';
    document.getElementById('calc-result').style.display = 'none';
    document.getElementById('reset-calc').style.display = 'none';
    document.querySelectorAll('.calc-btn-option').forEach(b => b.classList.remove('selected'));
}

// 3. منطق الحاسبة العكسية (دليلي)
window.calculateReversePlan = function() {
    const d = parseInt(document.getElementById('target-num').value) || 0;
    const unit = document.getElementById('target-unit').value;
    if(!d) return;

    let totalDays = d;
    if(unit === 'months') totalDays = d * 30;
    if(unit === 'years') totalDays = d * 365;

    const totalPages = 604;
    const daily = totalPages / totalDays;
    
    const resDiv = document.getElementById('reverse-calc-result');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `لختم القرآن في هذه المدة، عليك قراءة:<br><strong style="font-size:1.2rem; color:var(--primary-color)">${daily.toFixed(1)} صفحة يومياً</strong>`;
}

// 4. منطق الاختبار (Quiz) - نسخة بسيطة لا تعتمد على ملفات ضخمة لتجنب الخطأ
window.startQuiz = function() {
    const questions = [
        {q:"أكمل الآية: (إنا أعطيناك الكوثر...)", a:"فصل لربك وانحر * إن شانئك هو الأبتر"},
        {q:"ما هي السورة التي تسمى قلب القرآن؟", a:"سورة يس"},
        {q:"أكمل: (قل أعوذ برب الفلق...)", a:"من شر ما خلق * ومن شر غاسق إذا وقب"},
        {q:"في أي سورة تقع آية الكرسي؟", a:"سورة البقرة"},
        {q:"أكمل: (والعصر...)", a:"إن الإنسان لفي خسر * إلا الذين آمنوا وعملوا الصالحات..."}
    ];
    const rand = Math.floor(Math.random() * questions.length);
    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('quiz-question').innerText = questions[rand].q;
    document.getElementById('quiz-answer').innerText = questions[rand].a;
    document.getElementById('quiz-answer').style.display = 'none';
}
window.showAnswer = function() {
    document.getElementById('quiz-answer').style.display = 'block';
}


// ============================================================
// الجزء الثاني: أكواد العرض الجديدة (Firebase Helpers)
// ============================================================

function applyAllData(data) {
    data = data || {};
    const s = data.settings || {};
    
    // الألوان والهيدر
    const themeColor = s.theme_color || '#047857';
    document.documentElement.style.setProperty('--primary-color', themeColor);
    const header = document.querySelector('header');
    if(header) header.style.backgroundColor = themeColor;

    // النصوص
    const c = data.site_content || {};
    setText('txt_header_title', c.txt_header_title, "حلقات الثريا");
    setText('txt_header_subtitle', c.txt_header_subtitle, "لتعليم القرآن الكريم");
    setText('txt_header_location', c.txt_header_location, "حضرموت - غيل باوزير");

    // رسم القوائم
    renderRanks(data.ranks_list, s);
    renderTeachers(data.teachers_list_v2, s);
    renderCustomCards(data.custom_cards);
    renderComplexSchedule(data.schedule_complex);
    renderHolidays(data.holidays_list);
}

function setText(id, text, def) { 
    const el = document.getElementById(id); 
    if(el) { el.innerText = text || def; el.style.color = "#ffffff"; }
}

function renderRanks(list, settings) {
    const container = document.getElementById('dynamic-ranks-list');
    if(!container) return; container.innerHTML = '';
    
    if(!list) { container.innerHTML = '<p style="text-align:center;">لا توجد بيانات</p>'; return; }
    
    const design = (settings && settings.ranks_design_v8) ? settings.ranks_design_v8 : { header_bg: '#047857', header_text: '#ffffff', student_color: '#333' };
    
    const groups = {};
    Object.values(list).forEach(r => { if(r.active!==false) { let n=r.ring?r.ring.trim():"عام"; if(!groups[n])groups[n]=[]; groups[n].push(r); } });
    
    Object.keys(groups).sort().forEach(ringName => {
        const students = groups[ringName].sort((a,b) => a.rank - b.rank);
        const card = document.createElement('div'); card.className = 'rank-group-card';
        let html = `<div class="rank-group-header" style="background:${design.header_bg}; color:${design.header_text};">${ringName}</div><div class="students-list">`;
        students.forEach(s => {
            let badge = s.emoji ? s.emoji : (s.rank==1?'🥇':(s.rank==2?'🥈':(s.rank==3?'🥉':'🎖️')));
            html += `<div class="student-list-item">
                        <span class="student-name-text" style="color:${design.student_color}">${s.name}</span>
                        <span class="rank-icon">${badge}</span>
                     </div>`;
        });
        html += '</div>';
        card.innerHTML = html;
        container.appendChild(card);
    });
}

function renderTeachers(list, settings) {
    const container = document.getElementById('dynamic-teachers-container');
    if(!container) return; container.innerHTML = '';
    if(!list) return;
    Object.values(list).forEach(t => {
        if(t.active===false) return;
        const div = document.createElement('div'); div.className = 'teacher-row';
        div.innerHTML = `<div class="teacher-icon">${t.emoji||'👤'}</div><div class="teacher-info"><h4>${t.name}</h4><p>${t.role||''}</p></div>`;
        container.appendChild(div);
    });
}

function handlePopupNotification(settings) {
    const popup = document.getElementById('site-notification');
    if (!popup) return;
    const dontShow = localStorage.getItem('dont_show_popup_v2'); 
    if (settings.popup_active === true && dontShow !== 'true') {
        popup.style.display = 'flex';
        if(document.getElementById('notif-title')) document.getElementById('notif-title').innerText = settings.popup_title || "تنبيه";
        if(document.getElementById('notif-body')) document.getElementById('notif-body').innerText = settings.popup_body || "";
    } else { popup.style.display = 'none'; }
}
window.closeNotification = function() {
    const popup = document.getElementById('site-notification');
    if(popup) popup.style.display = 'none';
};

function renderCustomCards(l){} function renderComplexSchedule(d){} function renderHolidays(l){}
