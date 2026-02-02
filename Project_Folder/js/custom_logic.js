/* ============================================================
   ملف: js/custom_logic.js (V24 - مسؤول البيانات فقط)
   تنبيه: تم حذف جميع دوال الحاسبة والاختبارات لمنع التعارض
   مع الملفات القديمة (calculator.js, quiz.js).
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

    // الاستماع للبيانات من قاعدة البيانات
    db.ref().on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            console.log("تم استلام البيانات من فايربيس...");
            
            // 1. تطبيق الإعدادات العامة (مثل الصيانة)
            applySettings(data);
            
            // 2. تعبئة النصوص (العناوين، الأخبار)
            applyContent(data);
            
            // 3. رسم الجداول والقوائم
            renderRanks(data.ranks_list, data.settings);
            renderTeachers(data.teachers_list_v2, data.settings);
            renderCustomCards(data.custom_cards);
            renderComplexSchedule(data.schedule_complex);
            renderHolidays(data.holidays_list);

            // 4. التعامل مع الإشعار المنبثق
            if(data.settings) handlePopupNotification(data.settings);
        }
    });

} catch (error) { console.error("Firebase Error:", error); }


// ============================================================
// 1. دوال تطبيق البيانات (Data Rendering)
// ============================================================

function applySettings(data) {
    const s = data.settings || {};
    
    // تطبيق لون الثيم
    const themeColor = s.theme_color || '#047857';
    document.documentElement.style.setProperty('--primary-color', themeColor);
    const header = document.querySelector('header');
    if(header) header.style.backgroundColor = themeColor;

    // إخفاء/إظهار الأقسام حسب لوحة التحكم
    toggleSection('block-news', s.show_news);
    toggleSection('block-student', s.show_student);
    toggleSection('block-question', s.show_question);
    toggleSection('block-teachers', s.show_teachers);
    toggleSection('block-schedule', s.show_schedule);
    toggleSection('block-ranks', s.show_ranks);

    // فيديو الخلفية
    if(s.video_url) {
        const vid = document.getElementById('bg-video');
        if(vid && !vid.src.includes(s.video_url)) vid.src = s.video_url;
    }
}

function applyContent(data) {
    // شريط الأخبار
    if(data.news_bar) setTxt('dynamic-news-bar', data.news_bar.text);
    
    // سؤال الأسبوع
    if(data.weekly_question) {
        setHTML('weekly-question-text', `<strong>سؤال الأسبوع:</strong> ${data.weekly_question.text || ''}`);
        setTxt('weekly-winner-text', data.weekly_question.last_winner);
    }
    
    // نجم الأسبوع
    if(data.top_student) { 
        setTxt('top-student-name', data.top_student.name); 
        setTxt('top-student-desc', data.top_student.category); 
    }
    
    // نصوص الموقع
    const c = data.site_content || {};
    setTxt('txt_header_title', c.txt_header_title);
    setTxt('txt_header_subtitle', c.txt_header_subtitle);
    setTxt('txt_header_location', c.txt_header_location);
    setHTML('txt_about_content', c.txt_about_content);
}

// ============================================================
// 2. دوال الرسم (Ranks, Teachers, Schedule)
// ============================================================

function renderRanks(list, settings) {
    const container = document.getElementById('dynamic-ranks-list');
    if(!container) return; container.innerHTML = '';
    
    if(!list) { container.innerHTML = '<p style="text-align:center;">جاري انتظار النتائج...</p>'; return; }
    
    const design = (settings && settings.ranks_design_v8) ? settings.ranks_design_v8 : { header_bg: '#047857', header_text: '#ffffff', student_color: '#333' };
    
    // تجميع الطلاب حسب الحلقات
    const groups = {};
    Object.values(list).forEach(r => { if(r.active!==false) { let n=r.ring?r.ring.trim():"عام"; if(!groups[n])groups[n]=[]; groups[n].push(r); } });
    
    // الترتيب والعرض
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
    const spacing = (settings && settings.teacher_spacing) ? settings.teacher_spacing + 'px' : '10px';

    Object.values(list).forEach(t => {
        if(t.active===false) return;
        const div = document.createElement('div');
        div.className = 'teacher-row';
        div.style.marginBottom = spacing;
        div.innerHTML = `<div class="teacher-icon">${t.emoji||'👤'}</div>
                         <div class="teacher-info"><h4>${t.name}</h4><p>${t.role||''}</p></div>`;
        container.appendChild(div);
    });
}

function renderComplexSchedule(data) {
    const container = document.getElementById('dynamic-schedule-container');
    if(!container) return; container.innerHTML = '';
    if(!data) return;

    Object.keys(data).sort().forEach(timeKey => {
        const section = data[timeKey];
        if(!section.rings) return;

        const title = document.createElement('div');
        title.className = 'time-group-title';
        title.innerText = section.title || "فترة";
        container.appendChild(title);

        Object.values(section.rings).forEach(ring => {
            // نستخدم نفس كلاسات Accordion الموجودة في CSS
            const btn = document.createElement('div');
            btn.className = 'ring-accordion-btn';
            btn.innerHTML = `<span>📖 ${ring.name}</span> <span>▼</span>`;
            
            const panel = document.createElement('div');
            panel.className = 'ring-schedule-panel';
            panel.innerHTML = `
                <table class="schedule-table-simple">
                    <thead><tr><th>اليوم</th><th>المقرر</th></tr></thead>
                    <tbody>
                        <tr><td>السبت</td><td>${ring.sat||'-'}</td></tr>
                        <tr><td>الأحد</td><td>${ring.sun||'-'}</td></tr>
                        <tr><td>الاثنين</td><td>${ring.mon||'-'}</td></tr>
                        <tr><td>الثلاثاء</td><td>${ring.tue||'-'}</td></tr>
                        <tr><td>الأربعاء</td><td>${ring.wed||'-'}</td></tr>
                        <tr><td>الخميس</td><td>${ring.thu||'-'}</td></tr>
                    </tbody>
                </table>`;
            
            // حدث النقر الخاص بالجدول فقط (لا يتعارض مع ركن الطالب)
            btn.onclick = function() {
                this.classList.toggle('active');
                panel.style.display = (panel.style.display === "block") ? "none" : "block";
                this.querySelector('span:last-child').innerText = (panel.style.display === "block") ? '▲' : '▼';
            };

            container.appendChild(btn);
            container.appendChild(panel);
        });
    });
}

function renderHolidays(list) {
    const ul = document.getElementById('dynamic-holidays-list');
    if(!ul) return; ul.innerHTML = '';
    if(!list) { ul.innerHTML = '<li>لا توجد إجازات حالياً</li>'; return; }
    Object.values(list).forEach(h => {
        if(h.active!==false) {
            const li = document.createElement('li');
            li.innerText = h.text;
            ul.appendChild(li);
        }
    });
}

function renderCustomCards(list) {
    const container = document.getElementById('dynamic-custom-cards-container');
    if(!container) return; container.innerHTML = '';
    if(!list) return;
    Object.values(list).forEach(c => {
        if(c.active!==false) {
            const div = document.createElement('div');
            div.className = 'custom-dynamic-card';
            div.style.borderRightColor = c.color;
            div.innerHTML = `<h3 style="color:${c.color}">${c.title}</h3><p>${c.text}</p>`;
            if(c.link) div.innerHTML += `<a href="${c.link}" class="nav-btn" style="color:${c.color}; border-color:${c.color}">اضغط هنا</a>`;
            container.appendChild(div);
        }
    });
}

// ============================================================
// 3. دوال مساعدة وإشعارات
// ============================================================

function handlePopupNotification(settings) {
    const popup = document.getElementById('site-notification');
    if (!popup) return;
    
    const dontShow = localStorage.getItem('dont_show_popup_v2'); 
    
    if (settings.popup_active === true && dontShow !== 'true') {
        popup.style.display = 'flex';
        if(document.getElementById('notif-title')) document.getElementById('notif-title').innerText = settings.popup_title || "تنبيه";
        if(document.getElementById('notif-body')) document.getElementById('notif-body').innerText = settings.popup_body || "";
    } else {
        popup.style.display = 'none';
    }
}

// إغلاق الإشعار (مفصول عن منطق ركن الطالب)
window.closeNotification = function() {
    const popup = document.getElementById('site-notification');
    if(popup) popup.style.display = 'none';
    const checkbox = document.getElementById('popup-forever-check');
    if(checkbox && checkbox.checked) localStorage.setItem('dont_show_popup_v2', 'true');
};

function setTxt(id, txt) { const el = document.getElementById(id); if(el && txt) el.innerText = txt; }
function setHTML(id, txt) { const el = document.getElementById(id); if(el && txt) el.innerHTML = txt; }
function toggleSection(id, s){ const e=document.getElementById(id); if(e) e.style.display = s ? 'block' : 'none'; }
