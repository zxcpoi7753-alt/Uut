/* ============================================================
   ملف: js/custom_logic.js
   الوظيفة: جلب البيانات من فايربيس وعرضها في الصفحة الرئيسية
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

    // الاستماع للبيانات (Realtime)
    db.ref().on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // 1. تطبيق الإعدادات (صيانة، فيديو، إخفاء أقسام)
            applySettings(data);
            
            // 2. تطبيق المحتوى والنصوص
            applyContent(data);
            
            // 3. بناء الأقسام الديناميكية المعقدة
            renderComplexSchedule(data.schedule_complex); // الجداول القديمة
            renderTeachers(data.teachers_list_v2);        // المعلمون (نص)
            renderCustomCards(data.custom_cards);         // الأزرار الإضافية
            renderRanks(data.ranks_list);                 // أوائل الحلقات
            renderHolidays(data.holidays_list);           // الإجازات

            // 4. إخفاء شاشة التحميل (Anti-Flicker)
            setTimeout(() => {
                const loader = document.getElementById('site-loader');
                if(loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.style.display = 'none', 500);
                }
            }, 800);
        }
    });

} catch (error) { console.error(error); }

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

    // ب. الإشعار المنبثق (الذكية)
    const popup = document.getElementById('site-notification');
    const dontShow = localStorage.getItem('dont_show_popup');
    
    // يظهر فقط إذا: (مفعل من الأدمن) + (المستخدم لم يختر "عدم الإظهار")
    if(s.popup_active === true && dontShow !== 'true') {
        popup.style.display = 'flex';
        document.getElementById('notif-title').innerText = s.popup_title || "تنبيه";
        document.getElementById('notif-body').innerText = s.popup_body || "...";
    } else {
        popup.style.display = 'none';
    }

    // ج. إخفاء/إظهار الأقسام الرئيسية
    toggleSection('block-news', s.show_news);
    toggleSection('block-student', s.show_student);
    toggleSection('block-question', s.show_question);
    toggleSection('block-teachers', s.show_teachers);
    toggleSection('block-schedule', s.show_schedule);
    toggleSection('block-ranks', s.show_ranks);

    // د. الفيديو
    if(s.video_url) {
        const vid = document.getElementById('bg-video');
        if(!vid.src.includes(s.video_url)) vid.src = s.video_url;
    }
}

function applyContent(data) {
    // شريط الأخبار والسؤال
    if(data.news_bar) setTxt('dynamic-news-bar', data.news_bar.text);
    if(data.weekly_question) {
        setHTML('weekly-question-text', `<strong>سؤال الأسبوع:</strong> ${data.weekly_question.text}`);
        setTxt('weekly-winner-text', data.weekly_question.last_winner);
    }
    if(data.top_student) {
        setTxt('top-student-name', data.top_student.name);
        setTxt('top-student-desc', data.top_student.category);
    }
    
    // نصوص الموقع (من نحن، الهيدر، الفوتر)
    if(data.site_content) {
        const c = data.site_content;
        setTxt('txt_header_title', c.txt_header_title);
        setTxt('txt_header_subtitle', c.txt_header_subtitle);
        setTxt('txt_header_location', c.txt_header_location);
        setTxt('txt_news_title', c.txt_news_title);
        setTxt('txt_student_title', c.txt_student_title);
        setTxt('txt_question_title', c.txt_question_title);
        setTxt('txt_about_title', c.txt_about_title);
        // هنا نستخدم setHTML ليحافظ على تنسيق الأبيات الشعرية
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

// أ. بناء البطاقات المخصصة
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

// ب. بناء الجدول المعقد
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
            
            let tableHTML = `
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
                </table>
            `;
            panel.innerHTML = tableHTML;

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

// ج. بناء قائمة المعلمين
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
            <div class="teacher-info">
                <h4>${t.name}</h4>
                <p>${t.role || 'معلم فاضل'}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// د. بناء قائمة الأوائل
function renderRanks(list) {
    const container = document.getElementById('dynamic-ranks-list');
    if(!container) return;
    container.innerHTML = '';
    
    if(!list) { container.innerHTML = '<p>لم يتم رفع الأسماء بعد</p>'; return; }

    let html = '<table class="schedule-table-simple" style="width:100%"><thead><tr><th>المركز</th><th>الطالب</th><th>الحلقة</th></tr></thead><tbody>';
    Object.values(list).forEach(r => {
        let medal = '';
        if(r.rank == 1) medal = '🥇';
        else if(r.rank == 2) medal = '🥈';
        else if(r.rank == 3) medal = '🥉';
        
        html += `<tr>
            <td>${medal} ${r.rank}</td>
            <td><strong>${r.name}</strong></td>
            <td>${r.ring}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// هـ. بناء قائمة الإجازات
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

// ==========================================
// 3. دوال مساعدة (Helpers)
// ==========================================

function setTxt(id, txt) { const el = document.getElementById(id); if(el && txt) el.innerText = txt; }
function setHTML(id, txt) { const el = document.getElementById(id); if(el && txt) el.innerHTML = txt; }

function toggleSection(id, show) {
    const el = document.getElementById(id);
    if(el) {
        if(show === true) el.style.display = 'block';
        else el.style.display = 'none';
    }
}

// ==========================================
// 4. دوال التفاعل (Popup & Login)
// ==========================================

function closePopup() {
    document.getElementById('site-notification').style.display = 'none';
}

function disablePopupForever() {
    const checkbox = document.getElementById('popup-forever-check');
    if(checkbox.checked) {
        localStorage.setItem('dont_show_popup', 'true');
        alert("تم! لن تظهر لك هذه الرسالة مرة أخرى في هذا الجهاز.");
        closePopup();
    }
}

function openLoginModal() { document.getElementById('login-modal').style.display = 'flex'; }

function secureLogin() {
    const u = document.getElementById('admin-user').value;
    const p = document.getElementById('admin-pass').value;
    const db = firebase.database();
    
    db.ref('admin_account').once('value').then(snap => {
        const creds = snap.val();
        let realU = "admin", realP = "12345";
        
        if(creds) { 
            realU = creds.username; 
            realP = creds.password; 
        }
        
        if(u === realU && p === realP) {
            localStorage.setItem('admin_token', 'SECRET_PASS_123');
            window.location.href = "admin.html";
        } else {
            alert("⛔ خطأ في اسم المستخدم أو كلمة المرور");
        }
    }).catch(error => {
        console.error(error);
        alert("حدث خطأ في الاتصال، تأكد من الإنترنت.");
    });
}
