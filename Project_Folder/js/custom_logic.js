/* ============================================================
   ملف: js/custom_logic.js (V11 - تطبيق الثيم القسري)
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

    // 🚀 1. التحميل من الكاش
    const cachedData = localStorage.getItem('site_cache_v3');
    if (cachedData) {
        applyAllData(JSON.parse(cachedData));
    }

    // 🌐 2. الاتصال بفايربيس
    db.ref().on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            localStorage.setItem('site_cache_v3', JSON.stringify(data));
            applyAllData(data);
            handleSmartWelcome(data.settings);
        }
    });

} catch (error) { console.error("Firebase Error:", error); }


// ============================================================
// [SECTION 1]: دالة التطبيق الشاملة
// ============================================================
function applyAllData(data) {
    if (!data) return;
    applySettings(data);
    applyContent(data);
    
    renderComplexSchedule(data.schedule_complex);
    renderTeachers(data.teachers_list_v2, data.settings);
    renderCustomCards(data.custom_cards);
    renderRanks(data.ranks_list, data.settings);
    renderHolidays(data.holidays_list);
}


// ============================================================
// [SECTION 2]: منطق الترحيب الذكي
// ============================================================
function handleSmartWelcome(settings) {
    if (!settings || !settings.welcome_screen || settings.welcome_screen.active !== true) return;
    const lastSeen = localStorage.getItem('welcome_last_seen_time');
    const now = new Date().getTime();
    if ((now - (lastSeen || 0)) > (12 * 60 * 60 * 1000)) {
        showWelcomeOverlay(settings.welcome_screen);
        localStorage.setItem('welcome_last_seen_time', now);
    }
}

function showWelcomeOverlay(config) {
    const overlay = document.getElementById('welcome-overlay'); if(!overlay) return;
    document.getElementById('welcome-title').innerText = config.title || "أهلاً بك";
    let message = config.message || "نورتنا يا {name}";
    message = message.replace("{name}", localStorage.getItem('studentName') || "يا بطل");
    document.getElementById('welcome-text').innerText = message;
    overlay.style.display = 'flex';
    setTimeout(() => { overlay.style.opacity = '0'; setTimeout(() => overlay.style.display = 'none', 500); }, 3000);
}


// ============================================================
// [SECTION 3]: الإعدادات وتعبئة النصوص (تطبيق الثيم)
// ============================================================

function applySettings(data) {
    if(!data.settings) return;
    const s = data.settings;

    // 🎨 تطبيق الثيم (الألوان) بشكل فوري
    if(s.theme_color) {
        document.documentElement.style.setProperty('--primary-color', s.theme_color);
        document.documentElement.style.setProperty('--accent-color', s.theme_color); 
        
        // فرض اللون على الهيدر مباشرة في حال تأخر الـ CSS
        const header = document.querySelector('header');
        if(header) header.style.backgroundColor = s.theme_color;
    }

    // 2. وضع الصيانة
    const maint = document.getElementById('maintenance-mode');
    if(s.maintenance_mode === true) {
        maint.style.display = 'flex';
        document.querySelector('.container').style.display = 'none';
        document.querySelector('header').style.display = 'none';
    } else {
        maint.style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        document.querySelector('header').style.display = 'block';
    }

    // 3. الإشعارات
    const popup = document.getElementById('site-notification');
    const dontShow = localStorage.getItem('dont_show_popup');
    if(s.popup_active === true && dontShow !== 'true') {
        setTimeout(() => {
             const overlay = document.getElementById('welcome-overlay');
             if(overlay.style.display === 'none' || overlay.style.opacity === '0') popup.style.display = 'flex';
        }, 3500);
        setSafeTxt('notif-title', s.popup_title, "تنبيه هام");
        setSafeTxt('notif-body', s.popup_body, "...");
    } else { popup.style.display = 'none'; }

    // 4. إظهار/إخفاء الأقسام
    toggleSection('block-news', s.show_news);
    toggleSection('block-student', s.show_student);
    toggleSection('block-question', s.show_question);
    toggleSection('block-teachers', s.show_teachers);
    toggleSection('block-schedule', s.show_schedule);
    toggleSection('block-ranks', s.show_ranks);

    if(s.video_url) { const vid = document.getElementById('bg-video'); if(vid && !vid.src.includes(s.video_url)) vid.src = s.video_url; }
}

function applyContent(data) {
    // شريط الأخبار
    if(data.news_bar) setSafeTxt('dynamic-news-bar', data.news_bar.text, "أهلاً بكم في حلقات الثريا...");
    
    // السؤال الأسبوعي
    if(data.weekly_question) {
        setHTML('weekly-question-text', `<strong>سؤال الأسبوع:</strong> ${data.weekly_question.text || "سيتم نشره قريباً"}`);
        setSafeTxt('weekly-winner-text', data.weekly_question.last_winner, "بانتظار الفائز");
    }
    
    // نجم الأسبوع
    if(data.top_student) { 
        setSafeTxt('top-student-name', data.top_student.name, "..."); 
        setSafeTxt('top-student-desc', data.top_student.category, "..."); 
    }
    
    // نصوص الموقع الأساسية
    const c = data.site_content || {};
    setSafeTxt('txt_header_title', c.txt_header_title, "حلقات الثريا");
    setSafeTxt('txt_header_subtitle', c.txt_header_subtitle, "لتعليم القرآن الكريم");
    setSafeTxt('txt_header_location', c.txt_header_location, "حضرموت - غيل باوزير");
    
    setSafeTxt('txt_news_title', c.txt_news_title, "📢 آخر الأخبار");
    setSafeTxt('txt_student_title', c.txt_student_title, "نجم الأسبوع");
    setSafeTxt('txt_question_title', c.txt_question_title, "❓ السؤال الأسبوعي");
    setSafeTxt('txt_about_title', c.txt_about_title, "🕌 من نحن");
    setSafeTxt('txt_contact_title', c.txt_contact_title, "📞 تواصل معنا");
    setSafeTxt('txt_footer', c.txt_footer, "جميع الحقوق محفوظة © 2026");
    
    if(c.txt_schedule_title) setSafeTxt('txt_schedule_title', c.txt_schedule_title, "📅 الجداول الدراسية");
    if(c.txt_teachers_title) setSafeTxt('txt_teachers_title', c.txt_teachers_title, "👨‍🏫 المعلمون");

    // معالجة نص "من نحن"
    if(c.txt_about_content) {
        let text = c.txt_about_content;
        text = text.replace(/\n/g, '<br>');
        text = text.replace(/\{(.*?)\}/g, '<span class="quran-verse-simple">﴾ $1 ﴿</span>');
        setHTML('txt_about_content', text);
    } else {
        setHTML('txt_about_content', "نحن حلقات الثريا لتحفيظ القرآن الكريم...");
    }
}


// ============================================================
// [SECTION 4]: دوال الرسم
// ============================================================

function renderCustomCards(list) {
    const container = document.getElementById('dynamic-custom-cards-container');
    if(!container) return; container.innerHTML = ''; if(!list) return;
    Object.values(list).forEach(card => {
        if(card.active === false) return;
        const div = document.createElement('div');
        div.className = 'custom-dynamic-card';
        div.style.borderRightColor = card.color || '#3b82f6';
        div.innerHTML = `<h3 style="color:${card.color || '#333'}">${card.title}</h3><p style="white-space: pre-line;">${card.text}</p>`;
        if(card.link) div.innerHTML += `<a href="${card.link}" target="_blank" class="nav-btn" style="margin-top:10px; border-color:${card.color}; color:${card.color}; width:auto; display:inline-block;">${card.btn_text || 'اضغط هنا'}</a>`;
        container.appendChild(div);
    });
}

function renderTeachers(list, settings) {
    const container = document.getElementById('dynamic-teachers-container');
    if(!container) return; container.innerHTML = '';
    const spacing = (settings && settings.teacher_spacing) ? settings.teacher_spacing + 'px' : '15px';
    if(!list) { container.innerHTML = '<p>لا يوجد معلمون حالياً</p>'; return; }
    Object.values(list).forEach(t => {
        if(t.active === false) return; 
        let iconHtml = t.emoji && t.emoji.trim() !== "" ? `<div class="teacher-icon" style="background:transparent; font-size:1.8rem;">${t.emoji}</div>` : `<div class="teacher-icon"><i class="fas fa-user-tie"></i></div>`;
        const div = document.createElement('div');
        div.className = 'teacher-row'; div.style.marginBottom = spacing;
        div.innerHTML = `${iconHtml}<div class="teacher-info"><h4>${t.name}</h4><p>${t.role || 'معلم فاضل'}</p></div>`;
        container.appendChild(div);
    });
}

// رسم الأوائل
function renderRanks(list, settings) {
    const container = document.getElementById('dynamic-ranks-list');
    if(!container) return; container.innerHTML = '';
    if(!document.getElementById('student-toast-msg')) { const t=document.createElement('div'); t.id='student-toast-msg'; t.className='student-toast'; document.body.appendChild(t); }
    if(!list) { container.innerHTML = '<p style="text-align:center; padding:20px;">لم يتم رفع الأسماء بعد</p>'; return; }
    const design = (settings && settings.ranks_design_v8) ? settings.ranks_design_v8 : { header_bg: '#047857', header_text: '#ffffff', student_color: '#333333', ring_size: '1.2', name_size: '1.0' };
    const groups = {};
    Object.values(list).forEach(r => { if(r.active===false)return; let n=r.ring?r.ring.trim():"حلقات عامة"; if(!groups[n])groups[n]=[]; groups[n].push(r); });
    Object.keys(groups).sort().forEach(ringName => {
        const students = groups[ringName].sort((a,b) => a.rank - b.rank);
        const card = document.createElement('div'); card.className = 'rank-group-card';
        let html = `<div class="rank-group-header" style="background-color:${design.header_bg}; color:${design.header_text}; font-size:${design.ring_size}rem; text-align:center;">${ringName}</div><div class="students-list">`;
        students.forEach(s => {
            let medal = s.rank==1?'🥇':(s.rank==2?'🥈':(s.rank==3?'🥉':'🔹'));
            const safeMsg = (s.message||"مبارك التفوق!").replace(/'/g, "\\'"); const safeName = s.name.replace(/'/g, "\\'");
            html += `<div class="student-list-item" style="color:${design.student_color}; font-size:${design.name_size}rem; text-align:right;" oncontextmenu="return false;" ontouchstart="handleTouchStart(this,'${safeName}','${safeMsg}')" ontouchend="handleTouchEnd(this)" onmousedown="handleTouchStart(this,'${safeName}','${safeMsg}')" onmouseup="handleTouchEnd(this)"><span class="rank-icon">${medal}</span><span class="student-name-text">${s.name}</span></div>`;
        });
        html += '</div>'; card.innerHTML = html; container.appendChild(card);
    });
}

// === منطق الضغط المطول ===
let longPressTimer; const LONG_PRESS_DURATION=600;
function handleTouchStart(el,n,m){ el.classList.add('pressing'); longPressTimer=setTimeout(()=>{showStudentPraise(n,m);if(navigator.vibrate)navigator.vibrate(50);},LONG_PRESS_DURATION); }
function handleTouchEnd(el){ el.classList.remove('pressing'); if(longPressTimer)clearTimeout(longPressTimer); }
function showStudentPraise(n,m){ const t=document.getElementById('student-toast-msg'); t.innerHTML=`<div style="font-weight:bold;margin-bottom:5px;color:#fbbf24;font-size:1.2rem;">${n}</div><div style="font-size:1rem;">${m}</div>`; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),4000); }

function renderHolidays(list) { const ul=document.getElementById('dynamic-holidays-list'); if(!ul)return; ul.innerHTML=''; if(!list){ul.innerHTML='<li>لا توجد إجازات</li>';return;} Object.values(list).forEach(h=>{if(h.active===false)return; const li=document.createElement('li');li.innerText=h.text;ul.appendChild(li);}); }
function renderComplexSchedule(d) {
    const c=document.getElementById('dynamic-schedule-container'); if(!c)return; c.innerHTML=''; if(!d){c.innerHTML='<p style="text-align:center;">لا توجد جداول</p>';return;}
    Object.keys(d).sort().forEach(k => { const s=d[k]; if(!s.rings)return;
        const h=document.createElement('div'); h.className='time-group-title'; h.innerText=s.title||"فترة"; c.appendChild(h);
        Object.values(s.rings).forEach(r => {
            const b=document.createElement('div'); b.className='ring-accordion-btn'; b.innerHTML=`<span>📖 ${r.name}</span> <span>▼</span>`;
            const p=document.createElement('div'); p.className='ring-schedule-panel';
            p.innerHTML=`<table class="schedule-table-simple"><thead><tr><th>اليوم</th><th>المقرر</th></tr></thead><tbody><tr><td>السبت</td><td>${r.sat||'-'}</td></tr><tr><td>الأحد</td><td>${r.sun||'-'}</td></tr><tr><td>الاثنين</td><td>${r.mon||'-'}</td></tr><tr><td>الثلاثاء</td><td>${r.tue||'-'}</td></tr><tr><td>الأربعاء</td><td>${r.wed||'-'}</td></tr><tr><td>الخميس</td><td>${r.thu||'-'}</td></tr></tbody></table>`;
            b.onclick=function(){this.classList.toggle('active'); p.style.display=(p.style.display==="block")?"none":"block"; this.querySelector('span:last-child').innerText=(p.style.display==="block")?'▲':'▼';};
            c.appendChild(b); c.appendChild(p);
        });
    });
}

// Helpers
function setSafeTxt(id, text, defaultText) { const el = document.getElementById(id); if(el) el.innerText = (text && text.trim() !== "") ? text : defaultText; }
function setHTML(id,t){const e=document.getElementById(id);if(e)e.innerHTML=t;} 
function toggleSection(id,s){const e=document.getElementById(id);if(e)e.style.display=s?'block':'none';}
function closePopup(){document.getElementById('site-notification').style.display='none';}
function disablePopupForever(){if(document.getElementById('popup-forever-check').checked){localStorage.setItem('dont_show_popup','true');alert("تم!");closePopup();}}
function openLoginModal(){document.getElementById('login-modal').style.display='flex';}
function secureLogin(){const u=document.getElementById('admin-user').value;const p=document.getElementById('admin-pass').value;if(!u||!p)return alert("أدخل البيانات");firebase.auth().signInWithEmailAndPassword(u,p).then(()=>window.location.href="admin.html").catch(e=>alert("خطأ: "+e.message));}
