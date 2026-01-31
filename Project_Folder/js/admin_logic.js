/* ============================================================
   ملف: js/admin_logic.js
   الوظيفة: المنطق البرمجي للوحة التحكم (محمي بنظام Auth)
   ============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyBm8ML-1EKvQT76FJlzIQf4sn4M-MHhiRk",
    authDomain: "quran-app-93e24.firebaseapp.com",
    projectId: "quran-app-93e24",
    storageBucket: "quran-app-93e24.firebasestorage.app",
    messagingSenderId: "82150677933",
    appId: "1:82150677933:web:64213e04463c1bb3179524"
};

// تهيئة الاتصال
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// ==========================================
// 1. نظام الحماية (The Gatekeeper) - معدل لمنع الوميض
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        // المستخدم مسجل دخول كمدير - الآن فقط نظهر الصفحة
        console.log("Admin Logged in:", user.email);
        document.body.style.display = 'flex'; // إعادة إظهار الصفحة (لأنها مخفية في HTML)
    } else {
        // لا يوجد مستخدم - ابقِ الصفحة مخفية واطرد المستخدم
        console.warn("Unauthorized access attempt.");
        // الصفحة ستبقى (display: none) لذلك لن يرى المستخدم شيئاً
        window.location.replace("index.html");
    }
});

function logout() {
    if(confirm("هل أنت متأكد من تسجيل الخروج؟")) {
        auth.signOut().then(() => {
            window.location.replace("index.html");
        }).catch((error) => {
            console.error("Logout Error:", error);
            alert("حدث خطأ أثناء الخروج");
        });
    }
}

// ==========================================
// 2. أدوات التحكم بالواجهة (UI Helpers)
// ==========================================

function showTab(tabId) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
    if(event && event.target) {
        let target = event.target.closest('a');
        if(target) target.classList.add('active');
    }
}

function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function isChecked(id) { const el = document.getElementById(id); return el ? el.checked : false; }

// ==========================================
// 3. عمليات الحفظ (Save Operations)
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
    }).then(() => alert("✅ تم حفظ الإعدادات العامة"));
}

function saveSections() {
    db.ref('settings').update({
        show_news: isChecked('show_news'),
        show_student: isChecked('show_student'),
        show_question: isChecked('show_question'),
        show_ranks: isChecked('show_ranks'),
        show_schedule: isChecked('show_schedule'),
        show_teachers: isChecked('show_teachers')
    }).then(() => alert("✅ تم تحديث ظهور الأقسام"));
}

function saveNotification() {
    db.ref('settings').update({
        popup_active: isChecked('notify_active'),
        popup_title: val('notify_title'),
        popup_body: val('notify_body')
    }).then(() => alert("✅ تم تحديث الإشعار"));
}

function saveNewsBar() { 
    db.ref('news_bar').set({ text: val('inp_news_bar') }).then(()=>alert("✅ تم تحديث شريط الأخبار")); 
}
function saveQuestion() { 
    db.ref('weekly_question').set({ text: val('inp_q_text'), last_winner: val('inp_q_winner') }).then(()=>alert("✅ تم تحديث السؤال")); 
}
function saveAbout() { 
    db.ref('site_content/txt_about_content').set(val('inp_about_content')).then(()=>alert("✅ تم حفظ نص من نحن")); 
}

// ==========================================
// 4. دوال الإضافة والحذف (CRUD)
// ==========================================

// --- البطاقات المخصصة ---
function addCustomCard() {
    const title = val('card_title');
    if(!title) return alert("اكتب عنوان البطاقة أولاً!");

    const cardData = {
        title: title,
        text: val('card_text'),
        color: val('card_color'),
        btn_text: val('card_btn_text'),
        link: val('card_link'),
        active: true
    };

    db.ref('custom_cards').push(cardData).then(() => {
        alert("✅ تمت إضافة البطاقة");
        document.getElementById('card_title').value = '';
        document.getElementById('card_text').value = '';
    });
}
function deleteCustomCard(key) {
    if(confirm("حذف هذه البطاقة نهائياً؟")) db.ref('custom_cards/' + key).remove();
}

// --- الجداول الدراسية ---
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
        alert("✅ تم إضافة الجدول");
        document.getElementById('comp_sch_name').value = '';
        ['d_sat','d_sun','d_mon','d_tue','d_wed','d_thu'].forEach(id => document.getElementById(id).value = '');
    });
}
function deleteComplexRing(timeKey, ringKey) {
    if(confirm("حذف هذا الجدول؟")) {
        db.ref(`schedule_complex/${timeKey}/rings/${ringKey}`).remove();
    }
}

// --- المعلمون ---
function addTeacherV2() {
    const name = val('t_name_v2');
    if(!name) return alert("اكتب اسم المعلم");

    db.ref('teachers_list_v2').push({ name: name, role: val('t_role_v2') })
    .then(() => {
        alert("✅ تم إضافة المعلم");
        document.getElementById('t_name_v2').value = '';
        document.getElementById('t_role_v2').value = '';
    });
}
function deleteTeacherV2(key) { if(confirm("حذف المعلم؟")) db.ref('teachers_list_v2/'+key).remove(); }

// --- الأوائل ---
function addRank() {
    const name = val('rank_name');
    if(!name) return alert("اكتب اسم الطالب");
    db.ref('ranks_list').push({
        rank: val('rank_num'),
        name: name,
        ring: val('rank_ring')
    }).then(() => { 
        alert("✅ تم إضافة الطالب"); 
        document.getElementById('rank_name').value = ''; 
    });
}
function deleteRank(key) { if(confirm("حذف الطالب؟")) db.ref('ranks_list/'+key).remove(); }

// --- الإجازات ---
function addHoliday() {
    const txt = val('holiday_txt');
    if(!txt) return alert("اكتب نص الإجازة");
    db.ref('holidays_list').push({ text: txt }).then(() => { 
        alert("✅ تم إضافة الإجازة"); 
        document.getElementById('holiday_txt').value = ''; 
    });
}
function deleteHoliday(key) { if(confirm("حذف الإجازة؟")) db.ref('holidays_list/'+key).remove(); }


// ==========================================
// 5. مراقب البيانات (Realtime Listener)
// ==========================================
db.ref().on('value', (snapshot) => {
    const d = snapshot.val();
    if(!d) return;

    // أ. تعبئة حقول الإعدادات
    if(d.settings) {
        if(document.getElementById('toggle_maint')) document.getElementById('toggle_maint').checked = d.settings.maintenance_mode;
        if(document.getElementById('inp_video')) document.getElementById('inp_video').value = d.settings.video_url || "";
        if(document.getElementById('notify_active')) document.getElementById('notify_active').checked = d.settings.popup_active;
        if(document.getElementById('notify_title')) document.getElementById('notify_title').value = d.settings.popup_title || "";
        if(document.getElementById('notify_body')) document.getElementById('notify_body').value = d.settings.popup_body || "";
        
        // --- (جديد) إعدادات الترحيب الذكي ---
        if(d.settings.welcome_screen) {
            const w = d.settings.welcome_screen;
            if(document.getElementById('welcome_active')) document.getElementById('welcome_active').checked = w.active;
            if(document.getElementById('welcome_title_inp')) document.getElementById('welcome_title_inp').value = w.title || "";
            if(document.getElementById('welcome_msg_inp')) document.getElementById('welcome_msg_inp').value = w.message || "";
        }

        ['news','student','question','ranks','schedule','teachers'].forEach(k => {
            const el = document.getElementById('show_'+k);
            if(el) el.checked = d.settings['show_'+k];
        });
    }
    
    // ب. تعبئة النصوص
    if(d.site_content) {
        if(document.getElementById('inp_header_title')) document.getElementById('inp_header_title').value = d.site_content.txt_header_title || "";
        if(document.getElementById('inp_header_subtitle')) document.getElementById('inp_header_subtitle').value = d.site_content.txt_header_subtitle || "";
        if(document.getElementById('inp_header_location')) document.getElementById('inp_header_location').value = d.site_content.txt_header_location || "";
        if(document.getElementById('inp_about_content')) document.getElementById('inp_about_content').value = d.site_content.txt_about_content || "";
    }
    if(d.news_bar && document.getElementById('inp_news_bar')) document.getElementById('inp_news_bar').value = d.news_bar.text;
    if(d.weekly_question) {
        if(document.getElementById('inp_q_text')) document.getElementById('inp_q_text').value = d.weekly_question.text;
        if(document.getElementById('inp_q_winner')) document.getElementById('inp_q_winner').value = d.weekly_question.last_winner;
    }

    // ج. رسم القوائم الحالية
    renderList('custom-cards-list-admin', d.custom_cards, 'card');
    renderList('teachers-list-v2-admin', d.teachers_list_v2, 'teacher');
    renderList('ranks-list-admin', d.ranks_list, 'rank');
    renderList('holidays-list-admin', d.holidays_list, 'holiday');
    renderComplexScheduleAdmin(d.schedule_complex);
});


// ==========================================
// 6. دوال الرسم المساعدة
// ==========================================

function renderList(elementId, data, type) {
    const el = document.getElementById(elementId);
    if(!el) return;
    el.innerHTML = '';
    
    if(!data) { el.innerHTML = '<p style="color:gray; text-align:center;">لا توجد بيانات حالياً.</p>'; return; }

    Object.entries(data).forEach(([key, item]) => {
        let content = '', func = '';
        if(type === 'card') {
            content = `<strong style="color:${item.color}">${item.title}</strong>`;
            func = `deleteCustomCard('${key}')`;
        } else if(type === 'teacher') {
            content = `<strong>${item.name}</strong> <small style="color:gray;">(${item.role})</small>`;
            func = `deleteTeacherV2('${key}')`;
        } else if(type === 'rank') {
            content = `#${item.rank}: <strong>${item.name}</strong> <small>(${item.ring})</small>`;
            func = `deleteRank('${key}')`;
        } else if(type === 'holiday') {
            content = item.text;
            func = `deleteHoliday('${key}')`;
        }
        
        el.innerHTML += `
            <div class="dynamic-item">
                <div>${content}</div>
                <button onclick="${func}" class="btn btn-danger" style="padding:4px 10px; font-size:0.8rem;">حذف</button>
            </div>`;
    });
}

function renderComplexScheduleAdmin(data) {
    const el = document.getElementById('complex-schedule-list-admin');
    if(!el) return;
    el.innerHTML = '';
    
    if(!data) { el.innerHTML = '<p style="color:gray;">لا توجد جداول.</p>'; return; }

    Object.keys(data).sort().forEach(timeKey => {
        if(data[timeKey].rings) {
            const title = (timeKey === 'time_1') ? '☀️ حلقات العصر' : '🌙 حلقات المغرب';
            el.innerHTML += `<h4 style="margin:15px 0 5px 0; color:#3b82f6; border-bottom:1px solid #e2e8f0; padding-bottom:5px;">${title}</h4>`;
            
            Object.entries(data[timeKey].rings).forEach(([key, ring]) => {
                el.innerHTML += `
                    <div class="dynamic-item">
                        <div>📖 <strong>${ring.name}</strong></div>
                        <button onclick="deleteComplexRing('${timeKey}', '${key}')" class="btn btn-danger" style="padding:4px 10px; font-size:0.8rem;">حذف</button>
                    </div>`;
            });
        }
    });
}
