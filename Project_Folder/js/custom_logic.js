/* ============================================================
   ملف: js/custom_logic.js (V22 - استعادة ركن الطالب القديم)
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

    // عند التحميل
    document.addEventListener('DOMContentLoaded', function() {
        initOldStudentCorner(); // تهيئة ركن الطالب القديم
    });

    db.ref().on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            applyAllData(data);
            if(data.settings) handlePopupNotification(data.settings);
        }
    });

} catch (error) { console.error("Firebase Error:", error); }


// ============================================================
// 1. دوال ركن الطالب (الكلاسيكية القديمة) 🏛️
// ============================================================

// دالة فتح/إغلاق القوائم (الأصلية)
window.toggleAccordion = function(btn) {
    btn.classList.toggle('active');
    var panel = btn.nextElementSibling;
    if (panel.style.display === "block") {
        panel.style.display = "none";
        btn.querySelector('span').innerText = "▼";
    } else {
        panel.style.display = "block";
        btn.querySelector('span').innerText = "▲";
    }
}

// تهيئة الأزرار (أيام الأسبوع ومقدار الحفظ)
function initOldStudentCorner() {
    // أزرار الأيام
    const daysContainer = document.getElementById('days-buttons-container');
    if(daysContainer) {
        daysContainer.innerHTML = '';
        [1, 2, 3, 4, 5, 6, 7].forEach(day => {
            const btn = document.createElement('button');
            btn.innerText = day + (day===1?' يوم':' أيام');
            btn.className = 'calc-btn-option';
            btn.onclick = function() {
                document.querySelectorAll('#days-buttons-container .calc-btn-option').forEach(b=>b.classList.remove('selected'));
                this.classList.add('selected');
                document.getElementById('step-2-container').style.display = 'block';
                window.selectedDays = day;
            };
            daysContainer.appendChild(btn);
        });
    }

    // أزرار المقدار
    const amountContainer = document.getElementById('amount-buttons-container');
    if(amountContainer) {
        amountContainer.innerHTML = '';
        const amounts = [
            {l:"نصف وجه", v:0.5}, {l:"وجه واحد", v:1}, 
            {l:"وجهين", v:2}, {l:"3 أوجه", v:3},
            {l:"4 أوجه", v:4}, {l:"5 أوجه", v:5}
        ];
        amounts.forEach(amt => {
            const btn = document.createElement('button');
            btn.innerText = amt.l;
            btn.className = 'calc-btn-option';
            btn.onclick = function() {
                calculatePlan(amt.v);
            };
            amountContainer.appendChild(btn);
        });
    }
}

// دالة الحساب (ختمتي)
window.calculatePlan = function(amount) {
    if(!window.selectedDays) { alert("اختر عدد الأيام أولاً"); return; }
    const pagesPerWeek = amount * window.selectedDays;
    const totalPages = 604;
    const weeksNeeded = totalPages / pagesPerWeek;
    const monthsNeeded = weeksNeeded / 4;
    const yearsNeeded = monthsNeeded / 12;

    let resultHTML = `<strong>النتيجة:</strong><br>بمعدل ${amount} صفحة لـ ${window.selectedDays} أيام في الأسبوع:<br>`;
    resultHTML += `ستختم خلال <strong>${Math.ceil(monthsNeeded)} أشهر</strong> تقريباً.`;
    
    if(yearsNeeded >= 1) {
        resultHTML += `<br>(أي حوالي ${yearsNeeded.toFixed(1)} سنة)`;
    }

    const resDiv = document.getElementById('calc-result');
    resDiv.innerHTML = resultHTML;
    resDiv.style.display = 'block';
    document.getElementById('reset-calc').style.display = 'block';
}

window.resetCalc = function() {
    document.getElementById('step-2-container').style.display = 'none';
    document.getElementById('calc-result').style.display = 'none';
    document.getElementById('reset-calc').style.display = 'none';
    document.querySelectorAll('.calc-btn-option').forEach(b=>b.classList.remove('selected'));
}

// دالة الحساب العكسي (دليل الختم)
window.calculateReversePlan = function() {
    const num = parseFloat(document.getElementById('target-num').value);
    const unit = document.getElementById('target-unit').value;
    if(!num) return;

    let totalDays = num;
    if(unit === 'months') totalDays = num * 30;
    if(unit === 'years') totalDays = num * 365;

    const totalPages = 604;
    const dailyPages = totalPages / totalDays;
    
    const resDiv = document.getElementById('reverse-calc-result');
    resDiv.innerHTML = `لختم القرآن في هذه المدة، تحتاج لقراءة/حفظ:<br><strong>${dailyPages.toFixed(1)} صفحة يومياً</strong>`;
    resDiv.style.display = 'block';
}

// دالة الاختبار (اختبر حفظك) - نسخة مبسطة
window.startQuiz = function() {
    const questions = [
        {q: "أكمل الآية: (إنا أعطيناك الكوثر...)", a: "فصل لربك وانحر * إن شانئك هو الأبتر"},
        {q: "ما هي السورة التي تعدل ثلث القرآن؟", a: "سورة الإخلاص"},
        {q: "أكمل: (قل أعوذ برب الفلق...)", a: "من شر ما خلق * ومن شر غاسق إذا وقب"},
        {q: "أذكر آية الدين؟", a: "يا أيها الذين آمنوا إذا تداينتم بدين..."}
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
// 2. الدوال الأساسية للموقع (الهيدر، الأوائل، الإشعارات)
// ============================================================
function applyAllData(data) {
    data = data || {};
    const s = data.settings || {};
    
    // الهيدر والألوان
    const themeColor = s.theme_color || '#047857';
    document.documentElement.style.setProperty('--primary-color', themeColor);
    const header = document.querySelector('header');
    if(header) header.style.backgroundColor = themeColor;

    const c = data.site_content || {};
    setText('txt_header_title', c.txt_header_title, "حلقات الثريا");
    setText('txt_header_subtitle', c.txt_header_subtitle, "لتعليم القرآن الكريم");
    setText('txt_header_location', c.txt_header_location, "حضرموت - غيل باوزير");

    renderRanks(data.ranks_list, s);
    renderTeachers(data.teachers_list_v2, s);
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
    const checkbox = document.getElementById('popup-forever-check');
    if(checkbox && checkbox.checked) localStorage.setItem('dont_show_popup_v2', 'true');
};

function renderComplexSchedule(d){} function renderHolidays(l){}
