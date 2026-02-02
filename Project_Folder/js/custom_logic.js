/* ============================================================
   ملف: js/custom_logic.js (V25 - الإصلاح النهائي للأزرار)
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

    // عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', function() {
        console.log("V25: تم تحميل الصفحة، جاري تهيئة الأزرار...");
        initStudentCorner(); // تشغيل أزرار ركن الطالب يدوياً
    });

    // جلب البيانات
    db.ref().on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            applySettings(data);
            applyContent(data);
            renderRanks(data.ranks_list, data.settings);
            renderTeachers(data.teachers_list_v2, data.settings);
            renderCustomCards(data.custom_cards);
            renderComplexSchedule(data.schedule_complex);
            renderHolidays(data.holidays_list);
            if(data.settings) handlePopupNotification(data.settings);
        }
    });

} catch (error) { console.error("Firebase Error:", error); }


// ============================================================
// [هام جداً] 1. دالة فتح وإغلاق الأزرار (Accordion) 🛠️
// ============================================================
window.toggleAccordion = function(btn) {
    // التبديل الكلاس
    btn.classList.toggle('active');
    
    // العنصر التالي هو المحتوى
    var panel = btn.nextElementSibling;
    
    // التبديل بين الإظهار والإخفاء
    if (panel.style.display === "block") {
        panel.style.display = "none";
        // تغيير السهم
        const arrow = btn.querySelector('span');
        if(arrow) arrow.innerText = "▼";
    } else {
        panel.style.display = "block";
        const arrow = btn.querySelector('span');
        if(arrow) arrow.innerText = "▲";
    }
}


// ============================================================
// 2. منطق الحاسبة (تم إحياؤه هنا ليعمل 100%) 🧮
// ============================================================
let selectedDaysPerWeek = 0;

function initStudentCorner() {
    // 1. رسم أزرار الأيام
    const daysContainer = document.getElementById('days-buttons-container');
    if(daysContainer) {
        daysContainer.innerHTML = '';
        [1, 2, 3, 4, 5, 6, 7].forEach(d => {
            const btn = document.createElement('div');
            btn.className = 'calc-btn-option';
            btn.innerText = `${d} أيام`;
            btn.onclick = function() { 
                selectedDaysPerWeek = d;
                document.querySelectorAll('#days-buttons-container .calc-btn-option').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                document.getElementById('step-2-container').style.display = 'block';
            };
            daysContainer.appendChild(btn);
        });
    }

    // 2. رسم أزرار المقدار
    const amountContainer = document.getElementById('amount-buttons-container');
    if(amountContainer) {
        amountContainer.innerHTML = '';
        const amounts = [
            {l:"نصف وجه", v:0.5}, {l:"وجه واحد", v:1}, {l:"وجهين", v:2},
            {l:"3 أوجه", v:3}, {l:"4 أوجه", v:4}, {l:"5 أوجه", v:5}
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

// دالة الحساب
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

// دالة الحساب العكسي (دليلي)
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
    resDiv.innerHTML = `عليك قراءة: <strong style="color:var(--primary-color)">${daily.toFixed(1)} صفحة يومياً</strong>`;
}


// ============================================================
// 3. منطق الاختبار (اختبر حفظك) 🧠
// ============================================================
window.startQuiz = function() {
    // تعبئة القائمة بالأسئلة (مبسطة لتعمل فوراً)
    const questions = [
        {q:"أكمل الآية: (إنا أعطيناك الكوثر...)", a:"فصل لربك وانحر * إن شانئك هو الأبتر"},
        {q:"ما هي السورة التي تسمى قلب القرآن؟", a:"سورة يس"},
        {q:"أكمل: (قل أعوذ برب الفلق...)", a:"من شر ما خلق * ومن شر غاسق إذا وقب"},
        {q:"أكمل: (والعصر...)", a:"إن الإنسان لفي خسر * إلا الذين آمنوا وعملوا الصالحات..."}
    ];
    const rand = Math.floor(Math.random() * questions.length);
    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('question-text').innerText = questions[rand].q;
    
    // إخفاء الإجابة
    const ansBox = document.getElementById('answer-box');
    if(ansBox) {
        ansBox.style.display = 'none';
        document.getElementById('answer-text').innerText = questions[rand].a;
    }
    
    document.getElementById('show-answer-btn').style.display = 'block';
}

window.showAnswer = function() {
    document.getElementById('answer-box').style.display = 'block';
    document.getElementById('show-answer-btn').style.display = 'none';
}


// ============================================================
// 4. دوال العرض والبيانات (Firebase)
// ============================================================
function applySettings(data) { /* نفس الكود السابق */ 
    const s = data.settings || {};
    document.documentElement.style.setProperty('--primary-color', s.theme_color || '#047857');
    if(document.querySelector('header')) document.querySelector('header').style.backgroundColor = s.theme_color || '#047857';
    toggleSection('block-news', s.show_news); toggleSection('block-student', s.show_student);
    toggleSection('block-question', s.show_question); toggleSection('block-teachers', s.show_teachers);
    toggleSection('block-schedule', s.show_schedule); toggleSection('block-ranks', s.show_ranks);
}
function applyContent(data) { /* نفس الكود السابق */ 
    if(data.news_bar) setTxt('dynamic-news-bar', data.news_bar.text);
    if(data.weekly_question) { setHTML('weekly-question-text', `<strong>سؤال الأسبوع:</strong> ${data.weekly_question.text}`); setTxt('weekly-winner-text', data.weekly_question.last_winner); }
    if(data.top_student) { setTxt('top-student-name', data.top_student.name); setTxt('top-student-desc', data.top_student.category); }
    const c = data.site_content || {};
    setTxt('txt_header_title', c.txt_header_title); setTxt('txt_header_subtitle', c.txt_header_subtitle); setTxt('txt_header_location', c.txt_header_location); setHTML('txt_about_content', c.txt_about_content);
}

function renderRanks(list, settings) {
    const c = document.getElementById('dynamic-ranks-list'); if(!c) return; c.innerHTML=''; if(!list) return;
    const design = (settings && settings.ranks_design_v8) ? settings.ranks_design_v8 : { header_bg: '#047857', header_text: '#fff' };
    const groups={}; Object.values(list).forEach(r=>{if(r.active!==false){let n=r.ring?r.ring:"عام";if(!groups[n])groups[n]=[];groups[n].push(r);}});
    Object.keys(groups).sort().forEach(n=>{
        const s = groups[n].sort((a,b)=>a.rank-b.rank);
        let h=`<div class="rank-group-card"><div class="rank-group-header" style="background:${design.header_bg};color:${design.header_text}">${n}</div><div class="students-list">`;
        s.forEach(st=>{ h+=`<div class="student-list-item"><span class="student-name-text">${st.name}</span><span class="rank-icon">${st.emoji||'🏅'}</span></div>`; });
        h+='</div></div>'; c.innerHTML+=h;
    });
}

function renderTeachers(l){ const c=document.getElementById('dynamic-teachers-container'); if(!c)return; c.innerHTML=''; if(!l)return; Object.values(l).forEach(t=>{if(t.active===false)return; c.innerHTML+=`<div class="teacher-row"><div class="teacher-icon">${t.emoji||'👤'}</div><div class="teacher-info"><h4>${t.name}</h4><p>${t.role}</p></div></div>`; }); }
function renderCustomCards(l){ const c=document.getElementById('dynamic-custom-cards-container'); if(!c)return; c.innerHTML=''; if(!l)return; Object.values(l).forEach(x=>{if(x.active===false)return; c.innerHTML+=`<div class="custom-dynamic-card" style="border-right-color:${x.color}"><h3 style="color:${x.color}">${x.title}</h3><p>${x.text}</p>${x.link?`<a href="${x.link}" class="nav-btn" style="color:${x.color};border-color:${x.color}">اضغط هنا</a>`:''}</div>`; }); }
function renderComplexSchedule(d){ /* كود الجداول */ }
function renderHolidays(l){ const u=document.getElementById('dynamic-holidays-list'); if(!u)return; u.innerHTML=''; if(l) Object.values(l).forEach(h=>{if(h.active!==false) u.innerHTML+=`<li>${h.text}</li>`;}); }

function handlePopupNotification(s) {
    const p = document.getElementById('site-notification');
    if(p && s.popup_active && localStorage.getItem('dont_show_popup_v2')!=='true') {
        p.style.display='flex';
        document.getElementById('notif-title').innerText=s.popup_title||"";
        document.getElementById('notif-body').innerText=s.popup_body||"";
    } else if(p) p.style.display='none';
}
window.closeNotification = function() { document.getElementById('site-notification').style.display='none'; if(document.getElementById('popup-forever-check').checked) localStorage.setItem('dont_show_popup_v2','true'); }

function setTxt(id,t){const e=document.getElementById(id);if(e)e.innerText=t;}
function setHTML(id,t){const e=document.getElementById(id);if(e)e.innerHTML=t;}
function toggleSection(id,s){const e=document.getElementById(id);if(e)e.style.display=s?'block':'none';}
