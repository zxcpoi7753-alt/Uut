/* ============================================================
   ملف: js/admin_logic.js
   الوظيفة: حماية لوحة التحكم + إدارة البيانات مع فايربيس
   ============================================================ */

// 1. إعدادات فايربيس (بطاقة الهوية الخاصة بمشروعك)
const firebaseConfig = {
  apiKey: "AIzaSyBm8ML-1EKvQT76FJlzIQf4sn4M-MHhiRk",
  authDomain: "quran-app-93e24.firebaseapp.com",
  projectId: "quran-app-93e24",
  storageBucket: "quran-app-93e24.firebasestorage.app",
  messagingSenderId: "82150677933",
  appId: "1:82150677933:web:64213e04463c1bb3179524"
};

// تهيئة الاتصال إذا لم يكن مهيأ
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const auth = firebase.auth();

// ==========================================
// 2. نظام الحماية الصارم (The Security Guard) 👮‍♂️
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        // ✅ نعم، المستخدم مسجل دخول
        console.log("تم التحقق من المدير:", user.email);
        
        // 1. إظهار الصفحة (كانت مخفية)
        document.body.style.display = "flex"; 
        
        // 2. عرض الإيميل في الأعلى
        const emailDisplay = document.getElementById('admin-email-display');
        if(emailDisplay) emailDisplay.innerText = user.email;
        
        // 3. بدء جلب البيانات
        startAdminListener(); 
    } else {
        // ❌ لا، غير مسجل دخول -> طرد فوري
        window.location.replace("index.html");
    }
});

function logout() {
    if(confirm("هل أنت متأكد من تسجيل الخروج؟")) {
        auth.signOut().then(() => {
            window.location.replace("index.html");
        });
    }
}

// ==========================================
// 3. دوال الواجهة (التبويبات)
// ==========================================
function showTab(tabId) {
    // إخفاء كل الأقسام
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    // إظهار القسم المطلوب
    document.getElementById(tabId).classList.add('active');
    
    // تحديث شكل القائمة الجانبية
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
    if(event && event.target) {
        let target = event.target.closest('a');
        if(target) target.classList.add('active');
    }
}

// ==========================================
// 4. مراقب البيانات (جلب وعرض البيانات)
// ==========================================
function startAdminListener() {
    db.ref().on('value', (snapshot) => {
        const d = snapshot.val();
        if(!d) return;

        // أ. تعبئة الإعدادات العامة
        if(d.settings) {
            setCheck('toggle_maint', d.settings.maintenance_mode);
            setVal('inp_video', d.settings.video_url);
            setCheck('notify_active', d.settings.popup_active);
            setVal('notify_title', d.settings.popup_title);
            setVal('notify_body', d.settings.popup_body);
            
            // مربعات الاختيار للأقسام
            ['news','student','question','ranks','schedule','teachers'].forEach(k => {
                setCheck('show_'+k, d.settings['show_'+k]);
            });
        }
        
        // ب. تعبئة النصوص
        if(d.site_content) {
            setVal('inp_header_title', d.site_content.txt_header_title);
            setVal('inp_header_subtitle', d.site_content.txt_header_subtitle);
            setVal('inp_header_location', d.site_content.txt_header_location);
            setVal('inp_about_content', d.site_content.txt_about_content);
        }
        if(d.news_bar) setVal('inp_news_bar', d.news_bar.text);
        if(d.weekly_question) {
            setVal('inp_q_text', d.weekly_question.text);
            setVal('inp_q_winner', d.weekly_question.last_winner);
        }

        // ج. رسم القوائم (البطاقات، المعلمين، إلخ)
        renderList('custom-cards-list-admin', d.custom_cards, 'card');
        renderList('teachers-list-v2-admin', d.teachers_list_v2, 'teacher');
        renderList('ranks-list-admin', d.ranks_list, 'rank');
        renderList('holidays-list-admin', d.holidays_list, 'holiday');
        renderComplexScheduleAdmin(d.schedule_complex);
    });
}

// ==========================================
// 5. دوال الحفظ (Save Functions)
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

function saveNewsBar() { db.ref('news_bar').set({ text: val('inp_news_bar') }).then(()=>alert("✅ تم تحديث الشريط")); }
function saveQuestion() { db.ref('weekly_question').set({ text: val('inp_q_text'), last_winner: val('inp_q_winner') }).then(()=>alert("✅ تم حفظ السؤال")); }
function saveAbout() { db.ref('site_content/txt_about_content').set(val('inp_about_content')).then(()=>alert("✅ تم حفظ من نحن")); }

// ==========================================
// 6. دوال الإضافة والحذف (CRUD)
// ==========================================

// --- البطاقات ---
function addCustomCard() {
    const title = val('card_title');
    if(!title) return alert("اكتب العنوان");
    db.ref('custom_cards').push({
        title: title, text: val('card_text'), color: val('card_color'),
        btn_text: val('card_btn_text'), link: val('card_link'), active: true
    }).then(() => { alert("✅ تمت الإضافة"); setVal('card_title',''); setVal('card_text',''); });
}
function deleteCustomCard(key) { if(confirm("حذف؟")) db.ref('custom_cards/'+key).remove(); }

// --- الجداول ---
function addComplexSchedule() {
    const timeKey = val('comp_sch_time');
    const name = val('comp_sch_name');
    if(!name) return alert("اكتب اسم الحلقة");
    
    let timeTitle = (timeKey === 'time_1') ? '☀️ حلقات العصر' : '🌙 حلقات المغرب';
    db.ref(`schedule_complex/${timeKey}/title`).set(timeTitle);
    
    db.ref(`schedule_complex/${timeKey}/rings`).push({
        name: name,
        sat: val('d_sat'), sun: val('d_sun'), mon: val('d_mon'),
        tue: val('d_tue'), wed: val('d_wed'), thu: val('d_thu')
    }).then(() => {
        alert("✅ تم إضافة الجدول");
        setVal('comp_sch_name','');
        ['d_sat','d_sun','d_mon','d_tue','d_wed','d_thu'].forEach(id => setVal(id,''));
    });
}
function deleteComplexRing(timeKey, ringKey) { if(confirm("حذف؟")) db.ref(`schedule_complex/${timeKey}/rings/${ringKey}`).remove(); }

// --- المعلمون ---
function addTeacherV2() {
    const name = val('t_name_v2');
    if(!name) return alert("اكتب الاسم");
    db.ref('teachers_list_v2').push({ name: name, role: val('t_role_v2') })
    .then(() => { alert("✅ تم"); setVal('t_name_v2',''); setVal('t_role_v2',''); });
}
function deleteTeacherV2(key) { if(confirm("حذف؟")) db.ref('teachers_list_v2/'+key).remove(); }

// --- الأوائل ---
function addRank() {
    const name = val('rank_name');
    if(!name) return alert("اكتب الاسم");
    db.ref('ranks_list').push({ rank: val('rank_num'), name: name, ring: val('rank_ring') })
    .then(() => { alert("✅ تم"); setVal('rank_name',''); });
}
function deleteRank(key) { if(confirm("حذف؟")) db.ref('ranks_list/'+key).remove(); }

// --- الإجازات ---
function addHoliday() {
    const txt = val('holiday_txt');
    if(!txt) return alert("اكتب النص");
    db.ref('holidays_list').push({ text: txt }).then(() => { alert("✅ تم"); setVal('holiday_txt',''); });
}
function deleteHoliday(key) { if(confirm("حذف؟")) db.ref('holidays_list/'+key).remove(); }

// ==========================================
// 7. أدوات مساعدة (Helpers)
// ==========================================
function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function isChecked(id) { const el = document.getElementById(id); return el ? el.checked : false; }
function setVal(id, v) { const el = document.getElementById(id); if(el) el.value = v || ""; }
function setCheck(id, v) { const el = document.getElementById(id); if(el) el.checked = v; }

// دالة الرسم (Render)
function renderList(elId, data, type) {
    const el = document.getElementById(elId);
    if(!el) return;
    el.innerHTML = '';
    if(!data) { el.innerHTML = '<p style="text-align:center;color:gray">لا توجد بيانات</p>'; return; }

    Object.entries(data).forEach(([key, item]) => {
        let content = '', func = '';
        if(type === 'card') { content = `<strong style="color:${item.color}">${item.title}</strong>`; func = `deleteCustomCard('${key}')`; }
        else if(type === 'teacher') { content = `<strong>${item.name}</strong> <small>(${item.role})</small>`; func = `deleteTeacherV2('${key}')`; }
        else if(type === 'rank') { content = `#${item.rank}: <strong>${item.name}</strong> <small>(${item.ring})</small>`; func = `deleteRank('${key}')`; }
        else if(type === 'holiday') { content = item.text; func = `deleteHoliday('${key}')`; }
        
        el.innerHTML += `<div class="dynamic-item"><div>${content}</div><button onclick="${func}" class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;">حذف</button></div>`;
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
            el.innerHTML += `<h4 style="margin:10px 0; color:#3b82f6;">${title}</h4>`;
            Object.entries(data[timeKey].rings).forEach(([key, ring]) => {
                el.innerHTML += `<div class="dynamic-item"><div>📖 <strong>${ring.name}</strong></div><button onclick="deleteComplexRing('${timeKey}', '${key}')" class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;">حذف</button></div>`;
            });
        }
    });
}
