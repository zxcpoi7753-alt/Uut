/* ============================================================
   ملف: js/admin_logic.js
   الوظيفة: لوحة التحكم (CRUD كامل + إصلاح التصميم الجانبي)
   ============================================================ */

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
const auth = firebase.auth();

let editKeys = { card: null, teacher: null, rank: null, holiday: null, complex: null };

// ==========================================
// 1. نظام الحماية (تم الإصلاح هنا) 🛠️
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        // هنا كان الخطأ: غيرنا block إلى flex لكي تظهر القائمة بجانب المحتوى
        document.body.style.display = 'flex'; 
    } else {
        window.location.replace("index.html");
    }
});

function logout() {
    if(confirm("تسجيل خروج؟")) auth.signOut().then(() => window.location.replace("index.html"));
}

function showToast(msg, type='success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = (type==='success'?'✅ ':'❌ ') + msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ==========================================
// 2. عمليات الإضافة والتعديل (CRUD)
// ==========================================

// --- أ. البطاقات (Cards) ---
function addCustomCard() {
    const title = val('card_title');
    if(!title) return showToast("العنوان مطلوب", "error");

    const data = {
        title: title, text: val('card_text'), color: val('card_color'),
        btn_text: val('card_btn_text'), link: val('card_link'), active: true
    };

    if (editKeys.card) {
        db.ref('custom_cards/' + editKeys.card).update(data)
            .then(() => { showToast("تم حفظ التعديلات"); resetForm('card'); });
    } else {
        db.ref('custom_cards').push(data)
            .then(() => { showToast("تمت الإضافة"); resetForm('card'); });
    }
}

// --- ب. المعلمون (Teachers) ---
function addTeacherV2() {
    const name = val('t_name_v2');
    if(!name) return showToast("الاسم مطلوب", "error");
    const data = { name: name, role: val('t_role_v2'), active: true };
    if(editKeys.teacher) {
        db.ref('teachers_list_v2/' + editKeys.teacher).update(data).then(() => { showToast("تم التعديل"); resetForm('teacher'); });
    } else {
        db.ref('teachers_list_v2').push(data).then(() => { showToast("تمت الإضافة"); resetForm('teacher'); });
    }
}

// --- ج. الأوائل (Ranks) ---
function addRank() {
    const name = val('rank_name');
    if(!name) return showToast("الاسم مطلوب", "error");
    const data = { rank: val('rank_num'), name: name, ring: val('rank_ring'), active: true };
    if(editKeys.rank) {
        db.ref('ranks_list/' + editKeys.rank).update(data).then(() => { showToast("تم التعديل"); resetForm('rank'); });
    } else {
        db.ref('ranks_list').push(data).then(() => { showToast("تمت الإضافة"); resetForm('rank'); });
    }
}

// --- د. الإجازات (Holidays) ---
function addHoliday() {
    const txt = val('holiday_txt');
    if(!txt) return showToast("النص مطلوب", "error");
    const data = { text: txt, active: true };
    if(editKeys.holiday) {
        db.ref('holidays_list/' + editKeys.holiday).update(data).then(() => { showToast("تم التعديل"); resetForm('holiday'); });
    } else {
        db.ref('holidays_list').push(data).then(() => { showToast("تمت الإضافة"); resetForm('holiday'); });
    }
}

// --- هـ. الجداول ---
function addComplexSchedule() {
    const timeKey = val('comp_sch_time');
    const name = val('comp_sch_name');
    if(!name) return showToast("اسم الحلقة مطلوب", "error");
    const data = { name: name, sat: val('d_sat'), sun: val('d_sun'), mon: val('d_mon'), tue: val('d_tue'), wed: val('d_wed'), thu: val('d_thu') };
    let timeTitle = (timeKey === 'time_1') ? '☀️ حلقات العصر' : '🌙 حلقات المغرب';
    db.ref(`schedule_complex/${timeKey}/title`).set(timeTitle);
    db.ref(`schedule_complex/${timeKey}/rings`).push(data).then(() => {
        showToast("تمت الإضافة");
        document.getElementById('comp_sch_name').value = '';
        ['d_sat','d_sun','d_mon','d_tue','d_wed','d_thu'].forEach(id => document.getElementById(id).value = '');
    });
}
function deleteComplexRing(timeKey, ringKey) {
    if(confirm("حذف الجدول؟")) db.ref(`schedule_complex/${timeKey}/rings/${ringKey}`).remove();
}

// ==========================================
// 3. دوال التحكم (تعديل - إخفاء - حذف)
// ==========================================

function prepareEdit(type, key, item) {
    if(type === 'card') {
        fill('card_title', item.title); fill('card_text', item.text); fill('card_color', item.color);
        fill('card_btn_text', item.btn_text); fill('card_link', item.link);
        changeBtnText('addCustomCard', '💾 حفظ التعديلات');
    } else if(type === 'teacher') {
        fill('t_name_v2', item.name); fill('t_role_v2', item.role);
        changeBtnText('addTeacherV2', '💾 حفظ التعديلات');
    } else if(type === 'rank') {
        fill('rank_name', item.name); fill('rank_ring', item.ring); fill('rank_num', item.rank);
        changeBtnText('addRank', '💾 حفظ التعديلات');
    } else if(type === 'holiday') {
        fill('holiday_txt', item.text);
        changeBtnText('addHoliday', '💾 حفظ التعديلات');
    }
    editKeys[type] = key;
    document.querySelector('.panel.active').scrollIntoView({ behavior: 'smooth' });
}

function toggleVisibility(path, currentStatus) {
    db.ref(path).update({ active: !currentStatus }).then(() => showToast(currentStatus ? "تم الإخفاء" : "تم الإظهار"));
}

function deleteItem(path) {
    if(confirm("حذف نهائي؟")) db.ref(path).remove().then(() => showToast("تم الحذف 🗑️"));
}

function resetForm(type) {
    editKeys[type] = null;
    if(type === 'card') {
        ['card_title','card_text','card_link','card_btn_text'].forEach(id=>document.getElementById(id).value='');
        changeBtnText('addCustomCard', '<i class="fas fa-plus"></i> إضافة');
    } else if(type === 'teacher') {
        document.getElementById('t_name_v2').value=''; document.getElementById('t_role_v2').value='';
        changeBtnText('addTeacherV2', '<i class="fas fa-plus"></i> إضافة');
    } else if(type === 'rank') {
        document.getElementById('rank_name').value=''; document.getElementById('rank_ring').value='';
        changeBtnText('addRank', '<i class="fas fa-plus"></i> إضافة');
    } else if(type === 'holiday') {
        document.getElementById('holiday_txt').value='';
        changeBtnText('addHoliday', '<i class="fas fa-plus"></i> إضافة');
    }
}

// ==========================================
// 4. المراقب (Realtime Listener)
// ==========================================
db.ref().on('value', (snapshot) => {
    const d = snapshot.val();
    if(!d) return;

    if(d.settings) {
        if(d.settings.welcome_screen) {
            const w = d.settings.welcome_screen;
            if(document.getElementById('welcome_active')) document.getElementById('welcome_active').checked = w.active;
            if(document.getElementById('welcome_title_inp')) document.getElementById('welcome_title_inp').value = w.title || "";
            if(document.getElementById('welcome_msg_inp')) document.getElementById('welcome_msg_inp').value = w.message || "";
        }
        if(document.getElementById('toggle_maint')) document.getElementById('toggle_maint').checked = d.settings.maintenance_mode;
        if(document.getElementById('notify_active')) document.getElementById('notify_active').checked = d.settings.popup_active;
        if(document.getElementById('notify_title')) document.getElementById('notify_title').value = d.settings.popup_title || "";
        if(document.getElementById('notify_body')) document.getElementById('notify_body').value = d.settings.popup_body || "";
        ['news','student','question','ranks','schedule','teachers'].forEach(k => {
            const el = document.getElementById('show_'+k);
            if(el) el.checked = d.settings['show_'+k];
        });
    }

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

    renderList('custom-cards-list-admin', d.custom_cards, 'card');
    renderList('teachers-list-v2-admin', d.teachers_list_v2, 'teacher');
    renderList('ranks-list-admin', d.ranks_list, 'rank');
    renderList('holidays-list-admin', d.holidays_list, 'holiday');
    renderComplexScheduleAdmin(d.schedule_complex);
});

// ==========================================
// 5. دوال الرسم
// ==========================================
function renderList(elementId, data, type) {
    const el = document.getElementById(elementId);
    if(!el) return;
    el.innerHTML = '';
    
    if(!data) { el.innerHTML = '<p style="color:gray; text-align:center;">لا توجد بيانات.</p>'; return; }

    Object.entries(data).forEach(([key, item]) => {
        const isActive = item.active !== false;
        const opacityClass = isActive ? '' : 'hidden-item';
        const eyeIcon = isActive ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        const eyeColorClass = isActive ? 'active' : '';
        const itemStr = JSON.stringify(item).replace(/"/g, '&quot;');
        
        let content = '';
        if(type === 'card') content = `<strong style="color:${item.color}">${item.title}</strong>`;
        else if(type === 'teacher') content = `<strong>${item.name}</strong> <small>(${item.role})</small>`;
        else if(type === 'rank') content = `#${item.rank} <strong>${item.name}</strong>`;
        else if(type === 'holiday') content = item.text;

        let dbPath = '';
        if(type === 'card') dbPath = 'custom_cards/'+key;
        else if(type === 'teacher') dbPath = 'teachers_list_v2/'+key;
        else if(type === 'rank') dbPath = 'ranks_list/'+key;
        else if(type === 'holiday') dbPath = 'holidays_list/'+key;

        el.innerHTML += `
            <div class="dynamic-item ${opacityClass}">
                <div class="item-info">
                    ${!isActive ? '<span style="font-size:0.8rem; background:#cbd5e1; padding:2px 5px; border-radius:4px; margin-left:5px;">مخفي</span>' : ''}
                    ${content}
                </div>
                <div class="action-buttons">
                    <button onclick="prepareEdit('${type}', '${key}', ${itemStr})" class="btn-icon btn-edit" title="تعديل"><i class="fas fa-pen"></i></button>
                    <button onclick="toggleVisibility('${dbPath}', ${isActive})" class="btn-icon btn-hide ${eyeColorClass}" title="إخفاء/إظهار">${eyeIcon}</button>
                    <button onclick="deleteItem('${dbPath}')" class="btn-icon btn-delete" title="حذف نهائي"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    });
}

function renderComplexScheduleAdmin(data) {
    const el = document.getElementById('complex-schedule-list-admin');
    if(!el) return;
    el.innerHTML = '';
    if(!data) return;

    Object.keys(data).sort().forEach(timeKey => {
        if(data[timeKey].rings) {
            const title = (timeKey === 'time_1') ? '☀️ حلقات العصر' : '🌙 حلقات المغرب';
            el.innerHTML += `<h4 style="margin:15px 0 5px 0; color:#3b82f6;">${title}</h4>`;
            Object.entries(data[timeKey].rings).forEach(([key, ring]) => {
                el.innerHTML += `
                    <div class="dynamic-item">
                        <div class="item-info">📖 <strong>${ring.name}</strong></div>
                        <div class="action-buttons">
                            <button onclick="deleteComplexRing('${timeKey}', '${key}')" class="btn-icon btn-delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
            });
        }
    });
}

// Helpers
function showTab(tabId) { document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active')); document.getElementById(tabId).classList.add('active'); }
function val(id) { return document.getElementById(id) ? document.getElementById(id).value : ''; }
function fill(id, v) { if(document.getElementById(id)) document.getElementById(id).value = v || ''; }
function changeBtnText(funcName, txt) { 
    const btns = document.getElementsByTagName('button');
    for(let b of btns) { if(b.getAttribute('onclick') && b.getAttribute('onclick').includes(funcName)) { b.innerHTML = txt; } }
}
function saveGeneral() { db.ref('site_content').update({txt_header_title:val('inp_header_title'), txt_header_subtitle:val('inp_header_subtitle'), txt_header_location:val('inp_header_location')}); db.ref('settings').update({video_url:val('inp_video'), maintenance_mode:document.getElementById('toggle_maint').checked}).then(()=>showToast("تم الحفظ")); }
function saveSections() { db.ref('settings').update({show_news:document.getElementById('show_news').checked, show_student:document.getElementById('show_student').checked, show_question:document.getElementById('show_question').checked, show_ranks:document.getElementById('show_ranks').checked, show_schedule:document.getElementById('show_schedule').checked, show_teachers:document.getElementById('show_teachers').checked}).then(()=>showToast("تم الحفظ")); }
function saveNotification() { db.ref('settings').update({popup_active:document.getElementById('notify_active').checked, popup_title:val('notify_title'), popup_body:val('notify_body')}).then(()=>showToast("تم الحفظ")); }
function saveWelcomeSettings() { db.ref('settings/welcome_screen').update({active:document.getElementById('welcome_active').checked, title:val('welcome_title_inp'), message:val('welcome_msg_inp')}).then(()=>showToast("تم الحفظ")); }
function saveNewsBar() { db.ref('news_bar').set({text:val('inp_news_bar')}).then(()=>showToast("تم الحفظ")); }
function saveQuestion() { db.ref('weekly_question').set({text:val('inp_q_text'), last_winner:val('inp_q_winner')}).then(()=>showToast("تم الحفظ")); }
function saveAbout() { db.ref('site_content/txt_about_content').set(val('inp_about_content')).then(()=>showToast("تم الحفظ")); }
