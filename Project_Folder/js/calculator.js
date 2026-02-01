/* ============================================================
   ملف: js/custom_logic.js (V7 - تطبيق التصميم الديناميكي + الإصلاحات)
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
    applySettings(data);
    applyContent(data);
    
    renderComplexSchedule(data.schedule_complex);
    renderTeachers(data.teachers_list_v2, data.settings);
    renderCustomCards(data.custom_cards);
    renderRanks(data.ranks_list, data.settings); // 👈 نمرر الإعدادات هنا للتصميم
    renderHolidays(data.holidays_list);
}


// ============================================================
// [SECTION 2]: منطق الترحيب الذكي
// ============================================================
function handleSmartWelcome(settings) {
    if (!settings || !settings.welcome_screen || settings.welcome_screen.active !== true) return;

    const lastSeen = localStorage.getItem('welcome_last_seen_time');
    const now = new Date().getTime();
    const hours = 12; 
    const diff = now - (lastSeen || 0);

    if (diff > (hours * 60 * 60 * 1000)) {
        showWelcomeOverlay(settings.welcome_screen);
        localStorage.setItem('welcome_last_seen_time', now);
    }
}

function showWelcomeOverlay(config) {
    const overlay = document.getElementById('welcome-overlay');
    if(!overlay) return;

    const titleEl = document.getElementById('welcome-title');
    const msgEl = document.getElementById('welcome-text');
    let studentName = localStorage.getItem('studentName') || "يا بطل";
    
    titleEl.innerText = config.title || "أهلاً بك";
    let message = config.message || "نورتنا يا {name}";
    message = message.replace("{name}", studentName);
    msgEl.innerText = message;

    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 500);
    }, 3000);
}


// ============================================================
// [SECTION 3]: الإعدادات وتعبئة النصوص
// ============================================================

function applySettings(data) {
    if(!data.settings) return;
    const s = data.settings;

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

    const popup = document.getElementById('site-notification');
    const dontShow = localStorage.getItem('dont_show_popup');
    if(s.popup_active === true && dontShow !== 'true') {
        setTimeout(() => {
             const overlay = document.getElementById('welcome-overlay');
             if(overlay.style.display === 'none' || overlay.style.opacity === '0') {
                 popup.style.display = 'flex';
             }
        }, 3500);
        document.getElementById('notif-title').innerText = s.popup_title || "تنبيه";
        document.getElementById('notif-body').innerText = s.popup_body || "...";
    } else {
        popup.style.display = 'none';
    }

    toggleSection('block-news', s.show_news);
    toggleSection('block-student', s.show_student);
    toggleSection('block-question', s.show_question);
    toggleSection('block-teachers', s.show_teachers);
    toggleSection('block-schedule', s.show_schedule);
    toggleSection('block-ranks', s.show_ranks);

    if(s.video_url) {
        const vid = document.getElementById('bg-video');
        if(vid && !vid.src.includes(s.video_url)) vid.src = s.video_url;
    }
}

function applyContent(data) {
    if(data.news_bar) setTxt('dynamic-news-bar', data.news_bar.text);
    if(data.weekly_question) {
        setHTML('weekly-question-text', `<strong>سؤال الأسبوع:</strong> ${data.weekly_question.text}`);
        setTxt('weekly-winner-text', data.weekly_question.last_winner);
    }
    if(data.top_student) {
        setTxt('top-student-name', data.top_student.name);
        setTxt('top-student-desc', data.top_student.category);
    }
    if(data.site_content) {
        const c = data.site_content;
        setTxt('txt_header_title', c.txt_header_title);
        setTxt('txt_header_subtitle', c.txt_header_subtitle);
        setTxt('txt_header_location', c.txt_header_location);
        setTxt('txt_news_title', c.txt_news_title);
        setTxt('txt_student_title', c.txt_student_title);
        setTxt('txt_question_title', c.txt_question_title);
        setTxt('txt_about_title', c.txt_about_title);
        setHTML('txt_about_content', c.txt_about_content); 
        setTxt('txt_contact_title', c.txt_contact_title);
        setTxt('txt_footer', c.txt_footer);
        if(c.txt_schedule_title) setTxt('txt_schedule_title', c.txt_schedule_title);
        if(c.txt_teachers_title) setTxt('txt_teachers_title', c.txt_teachers_title);
    }
}


// ============================================================
// [SECTION 4]: دوال الرسم (Renderers)
// ============================================================

function renderCustomCards(list) {
    const container = document.getElementById('dynamic-custom-cards-container');
    if(!container) return; container.innerHTML = ''; if(!list) return;

    Object.values(list).forEach(card => {
        if(card.active === false) return;
        const div = document.createElement('div');
        div.className = 'custom-dynamic-card';
        div.style.borderRightColor = card.color || '#3b82f6';
        let html = `<h3 style="color:${card.color || '#333'}">${card.title}</h3>`;
        html += `<p style="white-space: pre-line;">${card.text}</p>`;
        if(card.link) {
            html += `<a href="${card.link}" target="_blank" class="nav-btn" style="margin-top:10px; border-color:${card.color}; color:${card.color}; width:auto; display:inline-block;">${card.btn_text || 'اضغط هنا'}</a>`;
        }
        div.innerHTML = html;
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
        let iconHtml = t.emoji && t.emoji.trim() !== "" 
            ? `<div class="teacher-icon" style="background:transparent; font-size:1.8rem;">${t.emoji}</div>`
            : `<div class="teacher-icon"><i class="fas fa-user-tie"></i></div>`;

        const div = document.createElement('div');
        div.className = 'teacher-row';
        div.style.marginBottom = spacing;
        div.innerHTML = `${iconHtml}<div class="teacher-info"><h4>${t.name}</h4><p>${t.role || 'معلم فاضل'}</p></div>`;
        container.appendChild(div);
    });
}

// ⭐ [تحديث الأوائل V7: تطبيق التصميم من الأدمن]
function renderRanks(list, settings) {
    const container = document.getElementById('dynamic-ranks-list');
    if(!container) return;
    container.innerHTML = '';

    // إنشاء التوست
    if(!document.getElementById('student-toast-msg')) {
        const toast = document.createElement('div');
        toast.id = 'student-toast-msg';
        toast.className = 'student-toast';
        document.body.appendChild(toast);
    }
    
    if(!list) { container.innerHTML = '<p style="text-align:center; padding:20px;">لم يتم رفع الأسماء بعد</p>'; return; }

    // 1. جلب إعدادات التصميم (مع قيم افتراضية خضراء جميلة)
    const design = (settings && settings.ranks_design) ? settings.ranks_design : {
        ring_color: '#10b981', // أخضر فاتح للحدود
        name_color: '#064e3b', // أخضر غامق للنصوص
        ring_size: '1.6',      // حجم خط الحلقة
        name_size: '1.5',      // حجم خط الطالب
        zoom: '100'            // الزوم الطبيعي
    };

    // 2. تجميع الحلقات
    const groups = {};
    Object.values(list).forEach(r => {
        if(r.active === false) return;
        let ringName = r.ring ? r.ring.trim() : "حلقات عامة"; 
        if(!groups[ringName]) groups[ringName] = [];
        groups[ringName].push(r);
    });

    // 3. الرسم
    Object.keys(groups).sort().forEach(ringName => {
        const students = groups[ringName].sort((a,b) => a.rank - b.rank);
        
        const card = document.createElement('div');
        card.className = 'rank-group-card';
        
        // تطبيق الزوم
        card.style.zoom = design.zoom + '%';
        
        // تطبيق ستايل الحلقة (لون، حجم، توسيط)
        let html = `
            <div class="rank-group-header" style="
                text-align: center;
                color: ${design.name_color};
                border-bottom-color: ${design.ring_color};
                font-size: ${design.ring_size}rem;
            ">
                ${ringName}
            </div>
            <div class="students-list">`;
        
        students.forEach(s => {
            let rankClass = '';
            let medal = '';
            if(s.rank == 1) { rankClass = 'rank-1'; medal = '🥇'; }
            else if(s.rank == 2) { rankClass = 'rank-2'; medal = '🥈'; }
            else if(s.rank == 3) { rankClass = 'rank-3'; medal = '🥉'; }
            else { rankClass = 'rank-other'; medal = `#${s.rank}`; }

            const msgContent = (s.message && s.message.trim() !== "") ? s.message : "مبارك التفوق والنجاح! 🌟";
            const safeMsg = msgContent.replace(/'/g, "\\'");
            const safeName = s.name.replace(/'/g, "\\'");

            // تطبيق ستايل الطالب (اتجاه معكوس، لون، حجم)
            html += `
                <div class="student-item ${rankClass}" 
                     style="flex-direction: row-reverse;" 
                     oncontextmenu="return false;" 
                     ontouchstart="handleTouchStart(this, '${safeName}', '${safeMsg}')" 
                     ontouchend="handleTouchEnd(this)" 
                     onmousedown="handleTouchStart(this, '${safeName}', '${safeMsg}')" 
                     onmouseup="handleTouchEnd(this)">
                     
                    <div class="s-rank-icon" style="margin-right:20px; margin-left:0;">${medal}</div>
                    
                    <div class="s-name" style="
                        text-align: right;
                        color: ${design.name_color};
                        font-size: ${design.name_size}rem;
                    ">
                        ${s.name}
                    </div>
                </div>
            `;
        });
        
        html += '</div>'; 
        card.innerHTML = html;
        container.appendChild(card);
    });
}

// === منطق الضغط المطول ===
let longPressTimer;
const LONG_PRESS_DURATION = 700;

function handleTouchStart(el, name, msg) {
    el.classList.add('pressing'); 
    longPressTimer = setTimeout(() => {
        showStudentPraise(name, msg);
        if(navigator.vibrate) navigator.vibrate(50); 
    }, LONG_PRESS_DURATION);
}

function handleTouchEnd(el) {
    el.classList.remove('pressing');
    if(longPressTimer) clearTimeout(longPressTimer);
}

function showStudentPraise(name, msg) {
    const toast = document.getElementById('student-toast-msg');
    toast.innerHTML = `
        <div style="font-weight:bold; margin-bottom:8px; color:#fbbf24; font-size:1.4rem;">${name}</div>
        <div style="line-height:1.6; font-size:1.1rem;">${msg}</div>
    `;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}


function renderHolidays(list) {
    const ul = document.getElementById('dynamic-holidays-list');
    if(!ul) return; ul.innerHTML = '';
    if(!list) { ul.innerHTML = '<li>لا توجد إجازات قريبة</li>'; return; }
    Object.values(list).forEach(h => {
        if(h.active === false) return;
        const li = document.createElement('li');
        li.innerText = h.text;
        ul.appendChild(li);
    });
}

function renderComplexSchedule(data) {
    const container = document.getElementById('dynamic-schedule-container');
    if(!container) return; container.innerHTML = '';
    if(!data) { container.innerHTML = '<p style="text-align:center;">لا توجد جداول حالياً</p>'; return; }
    Object.keys(data).sort().forEach(timeKey => {
        const timeSection = data[timeKey];
        if(!timeSection.rings) return;
        const timeHeader = document.createElement('div');
        timeHeader.className = 'time-group-title';
        timeHeader.innerText = timeSection.title || "فترة";
        container.appendChild(timeHeader);
        Object.values(timeSection.rings).forEach(ring => {
            const btn = document.createElement('div');
            btn.className = 'ring-accordion-btn';
            btn.innerHTML = `<span>📖 ${ring.name}</span> <span>▼</span>`;
            const panel = document.createElement('div');
            panel.className = 'ring-schedule-panel';
            panel.innerHTML = `
                <table class="schedule-table-simple">
                    <thead><tr><th>اليوم</th><th>المقرر / النشاط</th></tr></thead>
                    <tbody>
                        <tr><td>السبت</td><td>${ring.sat || '-'}</td></tr>
                        <tr><td>الأحد</td><td>${ring.sun || '-'}</td></tr>
                        <tr><td>الاثنين</td><td>${ring.mon || '-'}</td></tr>
                        <tr><td>الثلاثاء</td><td>${ring.tue || '-'}</td></tr>
                        <tr><td>الأربعاء</td><td>${ring.wed || '-'}</td></tr>
                        <tr><td>الخميس</td><td>${ring.thu || '-'}</td></tr>
                    </tbody>
                </table>`;
            btn.onclick = function() {
                this.classList.toggle('active');
                if (panel.style.display === "block") {
                    panel.style.display = "none";
                    this.querySelector('span:last-child').innerText = '▼';
                } else {
                    panel.style.display = "block";
                    this.querySelector('span:last-child').innerText = '▲';
                }
            };
            container.appendChild(btn);
            container.appendChild(panel);
        });
    });
}


// ============================================================
// [SECTION 5]: دوال مساعدة (Helpers)
// ============================================================
function setTxt(id, txt) { const el = document.getElementById(id); if(el && txt) el.innerText = txt; }
function setHTML(id, txt) { const el = document.getElementById(id); if(el && txt) el.innerHTML = txt; }
function toggleSection(id, show) {
    const el = document.getElementById(id);
    if(el) { el.style.display = show === true ? 'block' : 'none'; }
}
function closePopup() { document.getElementById('site-notification').style.display = 'none'; }
function disablePopupForever() {
    if(document.getElementById('popup-forever-check').checked) {
        localStorage.setItem('dont_show_popup', 'true');
        alert("تم! لن تظهر لك هذه الرسالة مرة أخرى.");
        closePopup();
    }
}
function openLoginModal() { document.getElementById('login-modal').style.display = 'flex'; }
function secureLogin() {
    const u = document.getElementById('admin-user').value;
    const p = document.getElementById('admin-pass').value;
    if (!u || !p) return alert("أدخل البيانات");
    
    firebase.auth().signInWithEmailAndPassword(u, p)
        .then(() => window.location.href = "admin.html")
        .catch(e => alert("خطأ في الدخول: " + e.message));
}
