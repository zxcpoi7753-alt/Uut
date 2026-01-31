/* ============================================================
   ملف: js/custom_logic.js
   الوظيفة: جلب البيانات (كاش + مباشر) + الترحيب الذكي
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

    // 🚀 1. التحميل الفوري من الكاش (السرعة القصوى)
    const cachedData = localStorage.getItem('site_cache_v3');
    if (cachedData) {
        console.log("⚡ تحميل من الذاكرة المحلية...");
        const data = JSON.parse(cachedData);
        applyAllData(data); // عرض الموقع فوراً
    }

    // 🌐 2. الاتصال بفايربيس لجلب التحديثات (في الخلفية)
    db.ref().on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            console.log("🔄 تحديث البيانات من السيرفر...");
            
            // تحديث الكاش
            localStorage.setItem('site_cache_v3', JSON.stringify(data));
            
            // تحديث الواجهة
            applyAllData(data);
            
            // تشغيل منطق الترحيب الذكي
            handleSmartWelcome(data.settings);
        }
    });

} catch (error) { console.error("Firebase Error:", error); }


// ==========================================
// دالة التطبيق الشاملة (تستخدم للكاش وللبيانات الجديدة)
// ==========================================
function applyAllData(data) {
    applySettings(data);
    applyContent(data);
    renderComplexSchedule(data.schedule_complex);
    renderTeachers(data.teachers_list_v2);
    renderCustomCards(data.custom_cards);
    renderRanks(data.ranks_list);
    renderHolidays(data.holidays_list);
}


// ==========================================
// 🎉 منطق الترحيب الذكي (نسخة الفحص - Debug)
// ==========================================
function handleSmartWelcome(settings) {
    console.log("🔎 فحص الترحيب الذكي...");

    // 1. التحقق من وجود الإعدادات
    if (!settings || !settings.welcome_screen) {
        console.warn("⚠️ لم يتم العثور على إعدادات الترحيب (يرجى الحفظ من لوحة التحكم)");
        return;
    }

    // 2. التحقق هل هي مفعلة
    if (settings.welcome_screen.active !== true) {
        console.log("ℹ️ الترحيب معطل من لوحة التحكم.");
        return;
    }

    // 3. التحقق من الوقت (12 ساعة)
    const lastSeen = localStorage.getItem('welcome_last_seen_time');
    const now = new Date().getTime();
    const hours = 12; 
    const diff = now - (lastSeen || 0);

    console.log(`🕒 الوقت المنقضي: ${(diff / (1000 * 60)).toFixed(1)} دقيقة`);

    if (diff > (hours * 60 * 60 * 1000)) {
        console.log("✅ الشروط تحققت! جاري الإظهار.");
        showWelcomeOverlay(settings.welcome_screen);
        localStorage.setItem('welcome_last_seen_time', now);
    } else {
        console.log("⏳ لم يحن الوقت بعد.");
    }
}

function showWelcomeOverlay(config) {
    const overlay = document.getElementById('welcome-overlay');
    if(!overlay) return;

    const titleEl = document.getElementById('welcome-title');
    const msgEl = document.getElementById('welcome-text');
    
    // جلب اسم الطالب
    let studentName = localStorage.getItem('studentName') || "يا بطل";
    
    // النصوص
    titleEl.innerText = config.title || "أهلاً بك";
    let message = config.message || "نورتنا يا {name}";
    message = message.replace("{name}", studentName);
    msgEl.innerText = message;

    // إظهار
    overlay.style.display = 'flex';
    
    // إخفاء تلقائي
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 500);
    }, 2500);
}


// ==========================================
// 1. دوال التطبيق الأساسية
// ==========================================

function applySettings(data) {
    if(!data.settings) return;
    const s = data.settings;

    // أ. وضع الصيانة
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

    // ب. الإشعار المنبثق
    const popup = document.getElementById('site-notification');
    const dontShow = localStorage.getItem('dont_show_popup');
    
    if(s.popup_active === true && dontShow !== 'true') {
        // تأخير بسيط لعدم التداخل مع الترحيب
        setTimeout(() => {
             const overlay = document.getElementById('welcome-overlay');
             // يظهر فقط إذا اختفى الترحيب
             if(overlay.style.display === 'none' || overlay.style.opacity === '0') {
                 popup.style.display = 'flex';
             }
        }, 3000);
        
        document.getElementById('notif-title').innerText = s.popup_title || "تنبيه";
        document.getElementById('notif-body').innerText = s.popup_body || "...";
    } else {
        popup.style.display = 'none';
    }

    // ج. الأقسام
    toggleSection('block-news', s.show_news);
    toggleSection('block-student', s.show_student);
    toggleSection('block-question', s.show_question);
    toggleSection('block-teachers', s.show_teachers);
    toggleSection('block-schedule', s.show_schedule);
    toggleSection('block-ranks', s.show_ranks);

    // د. الفيديو
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

function renderTeachers(list) {
    const container = document.getElementById('dynamic-teachers-container');
    if(!container) return;
    container.innerHTML = '';
    if(!list) { container.innerHTML = '<p>لا يوجد معلمون حالياً</p>'; return; }
    Object.values(list).forEach(t => {
        const div = document.createElement('div');
        div.className = 'teacher-row';
        div.innerHTML = `
            <div class="teacher-icon"><i class="fas fa-user-tie"></i></div>
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
        const li = document.createElement('li');
        li.innerText = h.text;
        ul.appendChild(li);
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
