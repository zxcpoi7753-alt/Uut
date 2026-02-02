/* ============================================================
   ملف: js/admin_logic.js (V15 - الحماية الشاملة لكل زر)
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

// 🔐 إعدادات الحماية (كلمة السر)
const SYS_PASS = "12345"; 
let pendingSecureAction = null; // لتخزين الأمر المعلق
let editKeys = { card: null, teacher: null, rank: null, holiday: null, complex: null };
let pendingDeleteAction = null;

// [SECTION 0]: التحقق من الدخول
auth.onAuthStateChanged((user) => { if (user) document.body.style.display = 'flex'; else window.location.replace("index.html"); });
function showToast(msg, type='success') {
    const c = document.getElementById('toast-container'); if(!c) return;
    const t = document.createElement('div'); t.className = `toast ${type}`;
    t.innerHTML = (type==='success'?'✅ ':'❌ ') + msg; c.appendChild(t); setTimeout(()=>t.remove(),3000);
}

// ============================================================
// 🛡️ نظام إدارة النوافذ والحماية (Popups & Security)
// ============================================================

// دالة عامة لفتح أي نافذة بقوة
function openModal(id) {
    const el = document.getElementById(id);
    if(el) el.style.setProperty('display', 'flex', 'important');
}
function closeModal(id) {
    const el = document.getElementById(id);
    if(el) el.style.setProperty('display', 'none', 'important');
}

// 1. الخروج
function openLogoutModal() { openModal('logout-modal'); }
function performLogout() { 
    closeModal('logout-modal');
    auth.signOut().then(() => window.location.replace("index.html")); 
}

// 2. الحماية (كلمة المرور)
function protectedAction(actionFunction) {
    pendingSecureAction = actionFunction;
    openModal('security-modal');
    document.getElementById('sys_pass_input').value = '';
    document.getElementById('sys_pass_input').focus();
}

function verifyPasswordAction() {
    const inputPass = document.getElementById('sys_pass_input').value;
    if (inputPass === SYS_PASS) {
        closeModal('security-modal');
        if (pendingSecureAction) {
            pendingSecureAction(); // تنفيذ الأمر المعلق
            pendingSecureAction = null;
        }
    } else {
        alert("⛔ كلمة المرور خاطئة!");
        document.getElementById('sys_pass_input').value = '';
    }
}

function closeSecurityModal() {
    closeModal('security-modal');
    pendingSecureAction = null;
}

// 3. الحذف
function deleteItem(path) {
    pendingDeleteAction = () => db.ref(path).remove().then(()=>showToast("تم الحذف"));
    openModal('confirm-modal');
}
function confirmAction() { if(pendingDeleteAction) pendingDeleteAction(); closeModal('confirm-modal'); }


// ============================================================
// [SECTION 1]: العمليات الرئيسية (كلها محمية الآن)
// ============================================================

function saveGeneral() {
    db.ref('site_content').update({ 
        txt_header_title: val('inp_header_title'), col_header_title: val('col_header_title'),
        txt_header_subtitle: val('inp_header_subtitle'), col_header_subtitle: val('col_header_subtitle'),
        txt_header_location: val('inp_header_location'), col_header_location: val('col_header_location'),
        txt_about_content: val('inp_about_content')
    });
    db.ref('settings').update({ 
        video_url: val('inp_video'), 
        maintenance_mode: document.getElementById('toggle_maint').checked,
        theme_color: val('main_theme_color') 
    }).then(() => showToast("تم الحفظ بنجاح 🎨"));
}

function restoreOriginalDesign() {
    const updates = {};
    updates['settings/theme_color'] = '#047857';
    updates['site_content/col_header_title'] = '#ffffff';
    updates['site_content/col_header_subtitle'] = '#ffffff';
    updates['site_content/col_header_location'] = '#ffffff';
    
    document.getElementById('main_theme_color').value = "#047857";
    fill('col_header_title', '#ffffff'); fill('col_header_subtitle', '#ffffff'); fill('col_header_location', '#ffffff');

    db.ref().update(updates).then(() => showToast("تمت الاستعادة ✨"));
}

function secureFactoryReset() {
    if(confirm("تحذير نهائي: سيتم مسح كل البيانات!")) {
        const updates = {};
        updates['settings'] = null; updates['site_content'] = null;
        updates['custom_cards'] = null; updates['teachers_list_v2'] = null;
        updates['ranks_list'] = null; updates['holidays_list'] = null;
        updates['news_bar'] = null; updates['weekly_question'] = null;
        updates['schedule_complex'] = null;
        updates['settings/theme_color'] = '#047857';
        
        db.ref().update(updates).then(() => {
            alert("تم التصفير.");
            window.location.reload();
        });
    }
}

function saveWelcomeSettings() { db.ref('settings/welcome_screen').update({ active: document.getElementById('welcome_active').checked, title: val('welcome_title_inp'), message: val('welcome_msg_inp') }).then(()=>showToast("تم الحفظ")); }

// [SECTION 2-8]: باقي الوظائف
function saveSections() {
    let s={}; ['news','student','question','ranks','schedule','teachers'].forEach(k=>s['show_'+k]=document.getElementById('show_'+k).checked);
    db.ref('settings').update(s).then(()=>showToast("تم الحفظ"));
}
function addCustomCard() {
    const d={title:val('card_title'),text:val('card_text'),color:val('card_color'),btn_text:val('card_btn_text'),link:val('card_link'),active:true};
    if(editKeys.card) db.ref('custom_cards/'+editKeys.card).update(d).then(()=>{showToast("تم التعديل");resetForm('card');});
    else db.ref('custom_cards').push(d).then(()=>{showToast("تمت الإضافة");resetForm('card');});
}
function addComplexSchedule() {
    const k=val('comp_sch_time');
    db.ref(`schedule_complex/${k}/title`).set(k==='time_1'?'☀️ عصر':'🌙 مغرب');
    db.ref(`schedule_complex/${k}/rings`).push({name:val('comp_sch_name'),sat:val('d_sat'),sun:val('d_sun'),mon:val('d_mon'),tue:val('d_tue'),wed:val('d_wed'),thu:val('d_thu')}).then(()=>{showToast("تمت الإضافة"); document.getElementById('comp_sch_name').value='';});
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

function addRank() {
    const name = val('rank_name'); if(!name) return showToast("الاسم مطلوب","error");
    const d = { 
        rank: val('rank_num'), name: name, ring: val('rank_ring'), 
        emoji: val('rank_emoji'), // حفظ الإيموجي الاختياري
        message: val('rank_msg'), active: true 
    };
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
function showTab(id) { document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function val(id) { return document.getElementById(id)?document.getElementById(id).value:''; }
function fill(id,v) { if(document.getElementById(id)) document.getElementById(id).value = v || ''; }
function toggleVisibility(p,s) { db.ref(p).update({active:!s}); }

// [LISTENER]
db.ref().on('value', (snapshot) => {
    const d = snapshot.val(); if(!d) return;
    if(d.settings) {
        if(d.settings.theme_color) fill('main_theme_color', d.settings.theme_color);
        if(d.settings.welcome_screen) { if(document.getElementById('welcome_active')) document.getElementById('welcome_active').checked = d.settings.welcome_screen.active; fill('welcome_title_inp', d.settings.welcome_screen.title); fill('welcome_msg_inp', d.settings.welcome_screen.message); }
        if(d.settings.teacher_spacing && document.getElementById('t_spacing_range')) { document.getElementById('t_spacing_range').value = d.settings.teacher_spacing; document.getElementById('t_spacing_display').innerText = d.settings.teacher_spacing + 'px'; }
        if(document.getElementById('toggle_maint')) document.getElementById('toggle_maint').checked = d.settings.maintenance_mode;
        ['news','student','question','ranks','schedule','teachers'].forEach(k => { const el = document.getElementById('show_'+k); if(el) el.checked = d.settings['show_'+k]; });
    }
    if(d.site_content) { 
        fill('inp_header_title', d.site_content.txt_header_title); fill('col_header_title', d.site_content.col_header_title || '#ffffff');
        fill('inp_header_subtitle', d.site_content.txt_header_subtitle); fill('col_header_subtitle', d.site_content.col_header_subtitle || '#ffffff');
        fill('inp_header_location', d.site_content.txt_header_location); fill('col_header_location', d.site_content.col_header_location || '#ffffff');
        fill('inp_about_content', d.site_content.txt_about_content); fill('inp_video', d.settings ? d.settings.video_url : '');
    }
    if(d.news_bar) fill('inp_news_bar', d.news_bar.text);
    if(d.weekly_question) { fill('inp_q_text', d.weekly_question.text); fill('inp_q_winner', d.weekly_question.last_winner); }
    
    renderList('custom-cards-list-admin', d.custom_cards, 'card');
    renderList('teachers-list-v2-admin', d.teachers_list_v2, 'teacher');
    renderList('ranks-list-admin', d.ranks_list, 'rank');
    renderList('holidays-list-admin', d.holidays_list, 'holiday');
    renderComplexScheduleAdmin(d.schedule_complex);
});

// Render List (With Security)
function renderList(elId, data, type) {
    const el = document.getElementById(elId); if(!el) return; el.innerHTML='';
    if(!data) { el.innerHTML='<p>لا توجد بيانات</p>'; return; }
    
    if(type === 'rank') { 
        const ringsSet = new Set(); Object.values(data).forEach(item => { if(item.ring) ringsSet.add(item.ring.trim()); }); 
        const dataList = document.getElementById('ring_suggestions'); if(dataList) { dataList.innerHTML = ''; ringsSet.forEach(r => { dataList.innerHTML += `<option value="${r}">`; }); }
    }

    Object.entries(data).forEach(([key, item]) => {
        const isActive = item.active !== false;
        let content = '';
        
        if(type==='card') {
            content = `<strong style="color:${item.color}">${item.title}</strong>`;
        } else if(type==='teacher') {
            content = `<span style="font-size:1.2rem; margin-left:5px;">${item.emoji||'👤'}</span> <strong>${item.name}</strong> <span style="color:gray; font-size:0.85rem;">(${item.role||'-'})</span>`;
        } else if(type==='rank') {
            // عرض الإيموجي أو الميدالية
            let displayBadge = item.emoji ? item.emoji : (item.rank==1?'🥇':(item.rank==2?'🥈':(item.rank==3?'🥉':'🎖️')));
            content = `<span style="font-size:1.2rem;">${displayBadge}</span> <strong>${item.name}</strong> <small>(${item.rank})</small>`;
        } else {
            content = item.text;
        }
        
        let path = (type==='card'?'custom_cards':(type==='teacher'?'teachers_list_v2':(type==='rank'?'ranks_list':'holidays_list'))) + '/' + key;
        const itemStr = JSON.stringify(item).replace(/"/g, '&quot;');

        // 🛡️ كل زر هنا محمي
        el.innerHTML += `
            <div class="dynamic-item ${isActive?'':'hidden-item'}">
                <div class="item-info" style="display:flex; align-items:center;">${content}</div>
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
    if(type === 'rank') { 
        fill('rank_name', item.name); fill('rank_ring', item.ring); fill('rank_num', item.rank); fill('rank_msg', item.message); 
        fill('rank_emoji', item.emoji); 
    }
    else if(type === 'card') { fill('card_title', item.title); fill('card_text', item.text); fill('card_color', item.color); fill('card_btn_text', item.btn_text); fill('card_link', item.link); }
    else if(type === 'teacher') { fill('t_name_v2', item.name); fill('t_role_v2', item.role); fill('t_emoji', item.emoji); }
    else if(type === 'holiday') { fill('holiday_txt', item.text); }
    document.querySelector('.panel.active').scrollIntoView({ behavior: 'smooth' });
}

function resetForm(type) { editKeys[type]=null; }
function renderComplexScheduleAdmin(d) {
    const el = document.getElementById('complex-schedule-list-admin'); if(!el) return; el.innerHTML=''; if(!d) return;
    Object.keys(d).sort().forEach(t => { if(d[t].rings) {
        el.innerHTML += `<h4 style="margin:15px 0 5px 0; color:#3b82f6;">${t==='time_1'?'☀️ عصر':'🌙 مغرب'}</h4>`;
        Object.entries(d[t].rings).forEach(([k, r]) => {
            el.innerHTML += `<div class="dynamic-item"><div class="item-info">📖 <strong>${r.name}</strong></div><div class="action-buttons"><button onclick="protectedAction(() => deleteComplexRing('${t}','${k}'))" class="btn-icon btn-delete"><i class="fas fa-trash"></i></button></div></div>`;
        });
    }});
}
