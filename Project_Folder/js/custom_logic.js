/* ============================================================
   ملف: js/custom_logic.js
   الوظيفة: جلب البيانات + الترحيب الذكي + تطبيق التعديلات (إيموجي ومسافات)
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


// ==========================================
// دالة التطبيق الشاملة
// ==========================================
function applyAllData(data) {
    applySettings(data);
    applyContent(data);
    renderComplexSchedule(data.schedule_complex);
    renderTeachers(data.teachers_list_v2, data.settings); // مررنا الإعدادات هنا لنعرف المسافة
    renderCustomCards(data.custom_cards);
    renderRanks(data.ranks_list);
    renderHolidays(data.holidays_list);
}


// ==========================================
// 🎉 منطق الترحيب الذكي
// ==========================================
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


// ==========================================
// 1. دوال التطبيق الأساسية
// ==========================================

function applySettings(data) {
    if(!data.settings) return;
    const s = data.settings;

    // وضع الصيانة
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

    // الإشعار المنبثق
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

    // الأقسام والفيديو
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

// ==========================================
// 2. دوال بناء المحتوى (Renderers)
// ==========================================

function renderCustomCards(list) {
    const container = document.getElementById('dynamic-custom-cards-container');
    if(!container) return;
    container.innerHTML = ''; 
    if(!list) return;

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

// ⭐ [تحديث هام]: دعم الإيموجي والمسافات للمعلمين
function renderTeachers(list, settings) {
    const container = document.getElementById('dynamic-teachers-container');
    if(!container) return;
    container.innerHTML = '';
    
    // 1. تحديد المسافة من الإعدادات أو استخدام 15px كافتراضي
    const spacing = (settings && settings.teacher_spacing) ? settings.teacher_spacing + 'px' : '15px';
    
    if(!list) { container.innerHTML = '<p>لا يوجد معلمون حالياً</p>'; return; }
    
    Object.values(list).forEach(t => {
        if(t.active === false) return; 

        // 2. التحقق من وجود إيموجي أو استخدام الأيقونة الافتراضية
        let iconHtml = '';
        if (t.emoji && t.emoji.trim() !== "") {
            // إذا يوجد إيموجي، نعرضه بخط كبير وبدون خلفية
            iconHtml = `<div class="teacher-icon" style="background:transparent; font-size:1.8rem;">${t.emoji}</div>`;
        } else {
            // الأيقونة الافتراضية
            iconHtml = `<div class="teacher-icon"><i class="fas fa-user-tie"></i></div>`;
        }

        const div = document.createElement('div');
        div.className = 'teacher-row';
        // 3. تطبيق المسافة هنا 👇
        div.style.marginBottom = spacing; 
        
        div.innerHTML = `
            ${iconHtml}
            <div class="teacher-info"><h4>${t.name}</h4><p>${t.role || 'معلم فاضل'}</p></div>
        `;
        container.appendChild(div);
    });
}

function renderRanks(list) {
    const container = document.getElementById('dynamic-ranks-list');
    if(!container) return;
    container.innerHTML = '';
    if(!list) { container.innerHTML = '<p>لم يتم رفع الأسماء بعد</p>'; return; }
    
    let html = '<table class="schedule-table-simple" style="width:100%"><thead><tr><th>المركز</th><th>الطالب</th><th>الحلقة</th></tr></thead><tbody>';
    Object.values(list).forEach(r => {
        if(r.active === false) return;
        let medal = '';
        if(r.rank == 1) medal = '🥇'; else if(r.rank == 2) medal = '🥈'; else if(r.rank == 3) medal = '🥉';
        html += `<tr><td>${medal} ${r.rank}</td><td><strong>${r.name}</strong></td><td>${r.ring}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderHolidays(list) {
    const ul = document.getElementById('dynamic-holidays-list');
    if(!ul) return;
    ul.innerHTML = '';
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
    if(!container) return;
    container.innerHTML = '';
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

// Helpers
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

/* ============================================================
   🎨 تصميم الجداول المطور (الأوائل + الحلقات) - V3
   ============================================================ */

/* 1. حاوية مجموعة الأوائل (لكل حلقة جدول منفصل) */
.rank-group-card {
    background: white;
    border-radius: 20px; /* زوايا بيضاوية ناعمة */
    box-shadow: 0 10px 30px rgba(0,0,0,0.08); /* ظل فخم */
    margin-bottom: 25px; /* مسافة بين كل حلقة والأخرى */
    overflow: hidden; /* لضمان عدم خروج المحتوى عن الزوايا */
    border: 1px solid rgba(0,0,0,0.05);
    transition: transform 0.3s ease;
}

.rank-group-card:hover {
    transform: translateY(-5px); /* حركة خفيفة عند المرور */
}

/* 2. ترويسة الحلقة (رأس الجدول) */
.rank-group-header {
    background: linear-gradient(135deg, var(--primary), #1e293b); /* تدرج لوني فخم */
    color: white;
    padding: 15px;
    text-align: center;
    font-size: 1.1rem;
    font-weight: bold;
    letter-spacing: 0.5px;
    border-bottom: 3px solid #fbbf24; /* خط ذهبي أسفل العنوان */
}

/* 3. تنسيق الجدول البيضاوي */
.schedule-table-simple {
    width: 100%;
    border-collapse: collapse;
}

.schedule-table-simple th {
    background: #f8fafc;
    color: #475569;
    padding: 12px;
    font-size: 0.9rem;
    border-bottom: 2px solid #e2e8f0;
}

.schedule-table-simple td {
    padding: 12px;
    border-bottom: 1px solid #f1f5f9;
    text-align: center;
    color: #334155;
}

/* تمييز المراكز الثلاثة الأولى */
.rank-row-1 { background: linear-gradient(to left, #fffbeb, #fff); border-right: 4px solid #fbbf24; } /* الأول: ذهبي */
.rank-row-2 { background: linear-gradient(to left, #f8fafc, #fff); border-right: 4px solid #94a3b8; } /* الثاني: فضي */
.rank-row-3 { background: linear-gradient(to left, #fff7ed, #fff); border-right: 4px solid #fdba74; } /* الثالث: برونزي */

/* 4. الجداول الدراسية (تصميم بيضاوي للأزرار والمحتوى) */
.ring-accordion-btn {
    background: white;
    padding: 15px 20px;
    margin-bottom: 10px;
    border-radius: 50px; /* شكل بيضاوي كامل للأزرار */
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    transition: 0.3s;
}

.ring-accordion-btn:hover {
    background: #f0f9ff;
    border-color: var(--primary);
    transform: scale(1.01);
}

.ring-accordion-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    box-shadow: 0 5px 15px rgba(37, 99, 235, 0.3);
}

.ring-schedule-panel {
    display: none;
    background: white;
    border-radius: 20px; /* الحواف الدائرية للجدول */
    padding: 15px;
    margin-bottom: 15px;
    border: 1px solid #e2e8f0;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
    animation: slideDown 0.3s ease-out;
}

/* أنيميشن للفتح */
@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
