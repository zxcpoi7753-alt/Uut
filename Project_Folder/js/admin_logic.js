/* ملف: js/admin_logic.js */

// 1. التحقق من الدخول
const token = localStorage.getItem('admin_token');
if (token !== 'SECRET_PASS_123') {
    window.location.replace("index.html");
}

const firebaseConfig = {
    apiKey: "AIzaSyBm8ML-1EKvQT76FJlzIQf4sn4M-MHhiRk",
    authDomain: "quran-app-93e24.firebaseapp.com",
    projectId: "quran-app-93e24",
    storageBucket: "quran-app-93e24.firebasestorage.app",
    messagingSenderId: "82150677933",
    appId: "1:82150677933:web:64213e04463c1bb3179524"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. التنقل بين التبويبات
function showTab(tabId) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
    event.target.closest('a').classList.add('active');
}

function logout() {
    if(confirm("تسجيل الخروج؟")) {
        localStorage.removeItem('admin_token');
        window.location.replace("index.html");
    }
}

// 3. دوال مساعدة
function val(id) { return document.getElementById(id).value; }
function isChecked(id) { return document.getElementById(id).checked; }

// ==========================================
// 4. دوال الحفظ الأساسية
// ==========================================

function saveGeneral() {
    db.ref('site_content').update({
        txt_header_title: val('inp_header_title'),
        txt_header_subtitle: val('inp_header_subtitle'),
        txt_header_location: val('inp_header_location')
    });
    db.ref('settings').update({
        video_url: val('inp_video'),
        maintenance_mode: document.getElementById('toggle_maint').checked
    }).then(() => alert("✅ تم الحفظ"));
}

function saveSections() {
    db.ref('settings').update({
        show_news: isChecked('show_news'),
        show_student: isChecked('show_student'),
        show_question: isChecked('show_question'),
        show_ranks: isChecked('show_ranks'),
        show_schedule: isChecked('show_schedule'),
        show_teachers: isChecked('show_teachers')
    }).then(() => alert("✅ تم تحديث الأقسام"));
}

function saveNotification() {
    db.ref('settings').update({
        popup_active: isChecked('notify_active'),
        popup_title: val('notify_title'),
        popup_body: val('notify_body')
    }).then(() => alert("✅ تم تحديث الإشعار"));
}

// ==========================================
// 5. دوال الإضافة والحذف
// ==========================================

// أ. البطاقات المخصصة
function addCustomCard() {
    const title = val('card_title');
    if(!title) return alert("اكتب عنوان البطاقة");

    const cardData = {
        title: title,
        text: val('card_text'),
        color: val('card_color'),
        btn_text: val('card_btn_text'),
        link: val('card_link'),
        active: true
    };

    db.ref('custom_cards').push(cardData).then(() => {
        alert("✅ تم إضافة البطاقة");
        document.getElementById('card_title').value = '';
        document.getElementById('card_text').value = '';
    });
}
function deleteCustomCard(key) {
    if(confirm("حذف هذه البطاقة؟")) db.ref('custom_cards/' + key).remove();
}

// ب. الجداول المعقدة
function addComplexSchedule() {
    const timeKey = val('comp_sch_time');
    const name = val('comp_sch_name');
    
    if(!name) return alert("اكتب اسم الحلقة");

    const scheduleData = {
        name: name,
        sat: val('d_sat'), sun: val('d_sun'), mon: val('d_mon'),
        tue: val('d_tue'), wed: val('d_wed'), thu: val('d_thu')
    };

    let timeTitle = (timeKey === 'time_1') ? '☀️ حلقات العصر' : '🌙 حلقات المغرب';
    db.ref(`schedule_complex/${timeKey}/title`).set(timeTitle);

    db.ref(`schedule_complex/${timeKey}/rings`).push(scheduleData).then(() => {
        alert("✅ تم إضافة الحلقة والجدول");
        document.getElementById('comp_sch_name').value = '';
        ['d_sat','d_sun','d_mon','d_tue','d_wed','d_thu'].forEach(id => document.getElementById(id).value = '');
    });
}
function deleteComplexRing(timeKey, ringKey) {
    if(confirm("حذف هذه الحلقة وجدولها؟")) {
        db.ref(`schedule_complex/${timeKey}/rings/${ringKey}`).remove();
    }
}

// ج. المعلمون
function addTeacherV2() {
    const name = val('t_name_v2');
    const role = val('t_role_v2');
    if(!name) return alert("اكتب اسم المعلم");

    db.ref('teachers_list_v2').push({ name: name, role: role })
    .then(() => {
        alert("✅ تم إضافة المعلم");
        document.getElementById('t_name_v2').value = '';
        document.getElementById('t_role_v2').value = '';
    });
}
function deleteTeacherV2(key) { if(confirm("حذف هذا المعلم؟")) db.ref('teachers_list_v2/'+key).remove(); }

// د. الأوائل
function addRank() {
    const name = val('rank_name');
    if(!name) return alert("اكتب اسم الطالب");
    db.ref('ranks_list').push({
        rank: val('rank_num'),
        name: name,
        ring: val('rank_ring')
    }).then(() => { 
        alert("✅ تم إضافة الطالب للقائمة"); 
        document.getElementById('rank_name').value = ''; 
    });
}
function deleteRank(key) { if(confirm("حذف هذا الطالب؟")) db.ref('ranks_list/'+key).remove(); }

// هـ. الإجازات
function addHoliday() {
    const txt = val('holiday_txt');
    if(!txt) return alert("اكتب نص الإجازة");
    db.ref('holidays_list').push({ text: txt }).then(() => { 
        alert("✅ تم إضافة الإجازة"); 
        document.getElementById('holiday_txt').value = ''; 
    });
}
function deleteHoliday(key) { if(confirm("حذف هذه الإجازة؟")) db.ref('holidays_list/'+key).remove(); }

// و. حفظ النصوص
function saveNewsBar() { db.ref('news_bar').set({ text: val('inp_news_bar') }).then(()=>alert("✅ تم تحديث الشريط")); }
function saveQuestion() { db.ref('weekly_question').set({ text: val('inp_q_text'), last_winner: val('inp_q_winner') }).then(()=>alert("✅ تم تحديث السؤال")); }
function saveAbout() { db.ref('site_content/txt_about_content').set(val('inp_about_content')).then(()=>alert("✅ تم حفظ نص من نحن")); }

// ==========================================
// 6. تحميل وعرض البيانات
// ==========================================
db.ref().on('value', (snapshot) => {
    const d = snapshot.val();
    if(!d) return;

    if(d.settings) {
        document.getElementById('toggle_maint').checked = d.settings.maintenance_mode;
        document.getElementById('inp_video').value = d.settings.video_url || "";
        document.getElementById('notify_active').checked = d.settings.popup_active;
        document.getElementById('notify_title').value = d.settings.popup_title || "";
        document.getElementById('notify_body').value = d.settings.popup_body || "";
        
        ['news','student','question','ranks','schedule','teachers'].forEach(k => {
            const el = document.getElementById('show_'+k);
            if(el) el.checked = d.settings['show_'+k];
        });
    }
    
    if(d.site_content) {
        document.getElementById('inp_header_title').value = d.site_content.txt_header_title || "";
        document.getElementById('inp_header_subtitle').value = d.site_content.txt_header_subtitle || "";
        document.getElementById('inp_header_location').value = d.site_content.txt_header_location || "";
        document.getElementById('inp_about_content').value = d.site_content.txt_about_content || "";
    }
    if(d.news_bar) document.getElementById('inp_news_bar').value = d.news_bar.text;
    if(d.weekly_question) {
        document.getElementById('inp_q_text').value = d.weekly_question.text;
        document.getElementById('inp_q_winner').value = d.weekly_question.last_winner;
    }

    renderList('custom-cards-list-admin', d.custom_cards, 'card');
    renderList('teachers-list-v2-admin', d.teachers_list_v2, 'teacher');
    renderList('ranks-list-admin', d.ranks_list, 'rank');
    renderList('holidays-list-admin', d.holidays_list, 'holiday');
    renderComplexScheduleAdmin(d.schedule_complex);
});

function renderList(id, data, type) {
    const el = document.getElementById(id);
    el.innerHTML = '';
    if(!data) { el.innerHTML = '<p>لا توجد بيانات.</p>'; return; }

    Object.entries(data).forEach(([key, item]) => {
        let content = '', func = '';
        if(type === 'card') { content = `<strong style="color:${item.color}">${item.title}</strong>`; func = `deleteCustomCard('${key}')`; } 
        else if(type === 'teacher') { content = `<strong>${item.name}</strong> <small>(${item.role})</small>`; func = `deleteTeacherV2('${key}')`; } 
        else if(type === 'rank') { content = `Rank ${item.rank}: <strong>${item.name}</strong> <small>(${item.ring})</small>`; func = `deleteRank('${key}')`; } 
        else if(type === 'holiday') { content = item.text; func = `deleteHoliday('${key}')`; }
        
        el.innerHTML += `<div class="dynamic-item"><div>${content}</div><button onclick="${func}" class="btn btn-danger" style="padding:4px 10px; font-size:0.8rem;">حذف</button></div>`;
    });
}

function renderComplexScheduleAdmin(data) {
    const el = document.getElementById('complex-schedule-list-admin');
    el.innerHTML = '';
    if(!data) { el.innerHTML = '<p>لا توجد جداول.</p>'; return; }

    Object.keys(data).sort().forEach(timeKey => {
        if(data[timeKey].rings) {
            const title = (timeKey === 'time_1') ? '☀️ حلقات العصر' : '🌙 حلقات المغرب';
            el.innerHTML += `<h4 style="margin:15px 0 5px 0; color:#3b82f6; border-bottom:2px solid #e2e8f0; padding-bottom:5px;">${title}</h4>`;
            Object.entries(data[timeKey].rings).forEach(([key, ring]) => {
                el.innerHTML += `<div class="dynamic-item"><div>📖 <strong>${ring.name}</strong></div><button onclick="deleteComplexRing('${timeKey}', '${key}')" class="btn btn-danger" style="padding:4px 10px; font-size:0.8rem;">حذف</button></div>`;
            });
        }
    });
}
