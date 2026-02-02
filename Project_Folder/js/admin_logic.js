/* ============================================================
   ملف: js/admin_logic.js (V21 - إصلاح التنقل بين الصفحات)
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

const SYS_PASS = "12345"; 
let pendingSecureAction = null;
let editKeys = { card: null, teacher: null, rank: null, holiday: null, complex: null };
let pendingDeleteAction = null;

// [SECTION 0]: التحقق من الدخول وإظهار الصفحة
auth.onAuthStateChanged((user) => { 
    if (user) {
        // إظهار الصفحة وإخفاء شاشة التحميل إن وجدت
        document.body.style.display = 'flex'; 
    } else {
        window.location.replace("index.html"); 
    }
});

function showToast(msg, type='success') {
    const c = document.getElementById('toast-container'); if(!c) return;
    const t = document.createElement('div'); t.className = `toast ${type}`;
    t.innerHTML = (type==='success'?'✅ ':'❌ ') + msg; c.appendChild(t); setTimeout(()=>t.remove(),3000);
}

// ============================================================
// 1. نظام التنقل (Tabs System) - الإصلاح الجذري 🛠️
// ============================================================
function showTab(tabId) {
    // 1. إخفاء جميع الأقسام (Panels)
    const allPanels = document.querySelectorAll('.panel');
    allPanels.forEach(panel => {
        panel.style.display = 'none'; // إخفاء قوي
        panel.classList.remove('active');
    });

    // 2. إظهار القسم المطلوب
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) {
        targetPanel.style.display = 'block'; // إظهار قوي
        targetPanel.classList.add('active');
    }

    // 3. تحديث القائمة الجانبية (اختياري لتلوين الزر النشط)
    const menuLinks = document.querySelectorAll('.menu a');
    menuLinks.forEach(link => link.classList.remove('active'));
    
    // محاولة تلوين الزر الذي تم ضغطه (يعتمد على HTML)
    // سيتم تفعيله عبر onclick في HTML
}


// ============================================================
// 2. إدارة النوافذ (Modals)
// ============================================================
function openModal(id) { document.getElementById(id).style.setProperty('display', 'flex', 'important'); }
function closeModal(id) { document.getElementById(id).style.setProperty('display', 'none', 'important'); }

// الخروج
function openLogoutModal() { openModal('logout-modal'); }
function performLogout() { 
    auth.signOut().then(() => window.location.replace("index.html")); 
}

// الحماية
function protectedAction(actionFunction) {
    pendingSecureAction = actionFunction;
    openModal('security-modal');
    document.getElementById('sys_pass_input').value = '';
}

function verifyPasswordAction() {
    if (document.getElementById('sys_pass_input').value === SYS_PASS) {
        closeModal('security-modal');
        if (pendingSecureAction) { pendingSecureAction(); pendingSecureAction = null; }
    } else {
        alert("⛔ كلمة المرور خاطئة!");
    }
}
function closeSecurityModal() { closeModal('security-modal'); pendingSecureAction = null; }

// الحذف
function deleteItem(path) {
    pendingDeleteAction = () => db.ref(path).remove().then(()=>showToast("تم الحذف"));
    openModal('confirm-modal');
}
function confirmAction() { if(pendingDeleteAction) pendingDeleteAction(); closeModal('confirm-modal'); }


// ============================================================
// 3. العمليات (CRUD) - حفظ، إضافة، تعديل
// ============================================================

// الإعدادات العامة
function saveGeneral() {
    db.ref('site_content').update({ 
        txt_header_title: val('inp_header_title'), col_header_title: val('col_header_title'),
        txt_header_subtitle: val('inp_header_subtitle'), col_header_subtitle: val('col_header_subtitle'),
        txt_header_location: val('inp_header_location'), col_header_location: val('col_header_location')
    });
    db.ref('settings').update({ 
        video_url: val('inp_video'), 
        maintenance_mode: document.getElementById('toggle_maint').checked,
        theme_color: val('main_theme_color') 
    }).then(() => showToast("تم الحفظ"));
}

function restoreOriginalDesign() {
    db.ref().update({
        'settings/theme_color': '#047857',
        'site_content/col_header_title': '#ffffff',
        'site_content/col_header_subtitle': '#ffffff',
        'site_content/col_header_location': '#ffffff'
    }).then(() => {
        fill('main_theme_color', '#047857');
        showToast("تمت الاستعادة");
    });
}

function secureFactoryReset() {
    if(confirm("تأكيد الحذف الكامل؟")) {
        db.ref().set({ settings: { theme_color: '#047857' } }).then(() => window.location.reload());
    }
}

function saveWelcomeSettings() { 
    db.ref('settings/welcome_screen').update({ 
        active: document.getElementById('welcome_active').checked, 
        title: val('welcome_title_inp'), 
        message: val('welcome_msg_inp') 
    }).then(()=>showToast("تم الحفظ")); 
}

function saveSections() {
    let s={}; ['news','student','question','ranks','schedule','teachers'].forEach(k=>s['show_'+k]=document.getElementById('show_'+k).checked);
    db.ref('settings').update(s).then(()=>showToast("تم الحفظ"));
}

// الوظائف المساعدة للإضافة
function addCustomCard() {
    const d={title:val('card_title'),text:val('card_text'),color:val('card_color'),btn_text:val('card_btn_text'),link:val('card_link'),active:true};
    if(editKeys.card) db.ref('custom_cards/'+editKeys.card).update(d).then(()=>{showToast("تم التعديل");resetForm('card');});
    else db.ref('custom_cards').push(d).then(()=>{showToast("تمت الإضافة");resetForm('card');});
}

function addComplexSchedule() {
    const k=val('comp_sch_time');
    db.ref(`schedule_complex/${k}/title`).set(k==='time_1'?'☀️ عصر':'🌙 مغرب');
    db.ref(`schedule_complex/${k}/rings`).push({name:val('comp_sch_name'),sat:val('d_sat'),sun:val('d_sun'),mon:val('d_mon'),tue:val('d_tue'),wed:val('d_wed'),thu:val('d_thu')}).then(()=>{showToast("تمت الإضافة");});
}
function deleteComplexRing(t,k) { 
    pendingDeleteAction = () => db.ref(`schedule_complex/${t}/rings/${k}`).remove().then(()=>showToast("تم الحذف"));
    openModal('confirm-modal');
}

function saveTeacherSettings() { db.ref('settings/teacher_spacing').set(val('t_spacing_range')).then(()=>showToast("تم الحفظ")); }
function addTeacherV2() {
    const d={name:val('t_name_v2'),role:val('t_role_v2'),emoji:val('t_emoji'),active:true};
    if(editKeys.teacher) db.ref('teachers_list_v2/'+editKeys.teacher).update(d).then(()=>{showToast("تم التعديل");resetForm('teacher');});
    else db.ref('teachers_list_v2').push(d).then(()=>{showToast("تمت الإضافة");resetForm('teacher');});
}

function saveRankDesign() {
    const design = { header_bg: val('d_header_bg'), header_text: val('d_header_text'), student_color: val('d_student_color'), ring_size: val('d_ring_size'), name_size: val('d_name_size') };
    db.ref('settings/ranks_design_v8').set(design).then(() => showToast("تم الحفظ"));
}
function addRank() {
    const d = { rank: val('rank_num'), name: val('rank_name'), ring: val('rank_ring'), emoji: val('rank_emoji'), message: val('rank_msg'), active: true };
    if(editKeys.rank) db.ref('ranks_list/'+editKeys.rank).update(d).then(()=>{showToast("تم التعديل");resetForm('rank');});
    else db.ref('ranks_list').push(d).then(()=>{showToast("تمت الإضافة");resetForm('rank');});
}

function addHoliday() {
    const d={text:val('holiday_txt'),active:true};
    if(editKeys.holiday) db.ref('holidays_list/'+editKeys.holiday).update(d).then(()=>{showToast("تم التعديل");resetForm('holiday');});
    else db.ref('holidays_list').push(d).then(()=>{showToast("تمت الإضافة");resetForm('holiday');});
}

function saveNewsBar(){ db.ref('news_bar').set({text:val('inp_news_bar')}).then(()=>showToast("تم")); }
function saveQuestion(){ db.ref('weekly_question').set({text:val('inp_q_text'),last_winner:val('inp_q_winner')}).then(()=>showToast("تم")); }
function saveAbout(){ db.ref('site_content/txt_about_content').set(val('inp_about_content')).then(()=>showToast("تم")); }

// Helpers
function val(id) { return document.getElementById(id)?document.getElementById(id).value:''; }
function fill(id,v) { if(document.getElementById(id)) document.getElementById(id).value = v || ''; }
function toggleVisibility(p,s) { db.ref(p).update({active:!s}); }

// [LISTENER] جلب البيانات
db.ref().on('value', (snapshot) => {
    const d = snapshot.val(); if(!d) return;
    
    // تعبئة الإعدادات
    if(d.settings) {
        if(d.settings.theme_color) fill('main_theme_color', d.settings.theme_color);
        if(document.getElementById('toggle_maint')) document.getElementById('toggle_maint').checked = d.settings.maintenance_mode;
        // ... (باقي التعبئة)
    }
    
    // تعبئة القوائم
    renderList('custom-cards-list-admin', d.custom_cards, 'card');
    renderList('teachers-list-v2-admin', d.teachers_list_v2, 'teacher');
    renderList('ranks-list-admin', d.ranks_list, 'rank');
    renderList('holidays-list-admin', d.holidays_list, 'holiday');
    renderComplexScheduleAdmin(d.schedule_complex);
});

// Render Generic List
function renderList(elId, data, type) {
    const el = document.getElementById(elId); if(!el) return; el.innerHTML='';
    if(!data) { el.innerHTML='<p>لا توجد بيانات</p>'; return; }
    
    Object.entries(data).forEach(([key, item]) => {
        const isActive = item.active !== false;
        let content = item.text || item.title || item.name;
        if(type==='rank') content = `#${item.rank} ${item.name} ${item.emoji||''}`;
        
        let path = (type==='card'?'custom_cards':(type==='teacher'?'teachers_list_v2':(type==='rank'?'ranks_list':'holidays_list'))) + '/' + key;
        const itemStr = JSON.stringify(item).replace(/"/g, '&quot;');

        el.innerHTML += `
            <div class="dynamic-item ${isActive?'':'hidden-item'}">
                <div class="item-info">${content}</div>
                <div class="action-buttons">
                    <button onclick="prepareEdit('${type}','${key}',${itemStr})" class="btn-icon btn-edit"><i class="fas fa-pen"></i></button>
                    <button onclick="protectedAction(() => toggleVisibility('${path}',${isActive}))" class="btn-icon btn-hide"><i class="fas fa-${isActive?'eye':'eye-slash'}"></i></button>
                    <button onclick="protectedAction(() => deleteItem('${path}'))" class="btn-icon btn-delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    });
}

function prepareEdit(type, key, item) { 
    editKeys[type] = key;
    // تعبئة الحقول حسب النوع
    if(type === 'rank') { fill('rank_name', item.name); fill('rank_ring', item.ring); fill('rank_num', item.rank); fill('rank_msg', item.message); fill('rank_emoji', item.emoji); }
    else if(type === 'card') { fill('card_title', item.title); fill('card_text', item.text); fill('card_color', item.color); fill('card_btn_text', item.btn_text); fill('card_link', item.link); }
    else if(type === 'teacher') { fill('t_name_v2', item.name); fill('t_role_v2', item.role); fill('t_emoji', item.emoji); }
    else if(type === 'holiday') { fill('holiday_txt', item.text); }
    
    // التمرير لأعلى
    document.querySelector('.panel.active').scrollIntoView({ behavior: 'smooth' });
}

function resetForm(type) { editKeys[type]=null; }

function renderComplexScheduleAdmin(d) {
    const el = document.getElementById('complex-schedule-list-admin'); if(!el) return; el.innerHTML=''; if(!d) return;
    Object.keys(d).sort().forEach(t => { 
        if(d[t].rings) {
            el.innerHTML += `<h4 style="margin:15px 0 5px 0; color:#3b82f6;">${t}</h4>`;
            Object.entries(d[t].rings).forEach(([k, r]) => {
                el.innerHTML += `<div class="dynamic-item"><div class="item-info">📖 ${r.name}</div><div class="action-buttons"><button onclick="protectedAction(() => deleteComplexRing('${t}','${k}'))" class="btn-icon btn-delete"><i class="fas fa-trash"></i></button></div></div>`;
            });
        }
    });
}
