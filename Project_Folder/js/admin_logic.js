/* ============================================================
   ملف: js/admin_logic.js (V12 - ضبط المصنع + الألوان الدقيقة)
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
let pendingDeleteAction = null;

// [SECTION 0]: Auth & Toast
auth.onAuthStateChanged((user) => { if (user) document.body.style.display = 'flex'; else window.location.replace("index.html"); });
function logout() { if(confirm("خروج؟")) auth.signOut().then(() => window.location.replace("index.html")); }
function showToast(msg, type='success') {
    const c = document.getElementById('toast-container'); if(!c) return;
    const t = document.createElement('div'); t.className = `toast ${type}`;
    t.innerHTML = (type==='success'?'✅ ':'❌ ') + msg; c.appendChild(t); setTimeout(()=>t.remove(),3000);
}

// [SECTION 1]: الإعدادات العامة + الألوان الدقيقة
function saveGeneral() {
    // 1. حفظ نصوص الهيدر + ألوانها الخاصة
    db.ref('site_content').update({ 
        txt_header_title: val('inp_header_title'), 
        col_header_title: val('col_header_title'), // لون العنوان

        txt_header_subtitle: val('inp_header_subtitle'), 
        col_header_subtitle: val('col_header_subtitle'), // لون الوصف

        txt_header_location: val('inp_header_location'),
        col_header_location: val('col_header_location'), // لون الموقع

        txt_about_content: val('inp_about_content')
    });
    
    // 2. حفظ الثيم العام
    db.ref('settings').update({ 
        video_url: val('inp_video'), 
        maintenance_mode: document.getElementById('toggle_maint').checked,
        theme_color: val('main_theme_color') 
    }).then(() => showToast("تم حفظ الإعدادات والألوان 🎨"));
}

// زر استعادة الثيم الأخضر
function resetTheme() {
    if(confirm("هل تريد استعادة اللون الأخضر الافتراضي؟")) {
        document.getElementById('main_theme_color').value = "#047857";
        db.ref('settings/theme_color').set("#047857").then(() => showToast("تمت الاستعادة"));
    }
}

// ⚠️ زر ضبط المصنع (Factory Reset)
function factoryReset() {
    if(confirm("⚠️ تحذير خطير!\nهل أنت متأكد أنك تريد حذف كل شيء واستعادة ضبط المصنع؟\nسيتم حذف جميع الطلاب والمعلمين والألوان المخصصة.")) {
        if(confirm("تأكيد نهائي: هل أنت متأكد تماماً؟ لا يمكن التراجع!")) {
            const updates = {};
            // مسح كل الجداول
            updates['settings'] = null; 
            updates['site_content'] = null;
            updates['custom_cards'] = null;
            updates['teachers_list_v2'] = null;
            updates['ranks_list'] = null;
            updates['holidays_list'] = null;
            updates['news_bar'] = null;
            updates['weekly_question'] = null;
            updates['schedule_complex'] = null;
            
            // إعادة تعيين الثيم الافتراضي فوراً
            updates['settings/theme_color'] = '#047857';

            db.ref().update(updates).then(() => {
                alert("تم تصفير الموقع بنجاح! سيتم إعادة تحميل الصفحة.");
                window.location.reload();
            });
        }
    }
}

function saveWelcomeSettings() { db.ref('settings/welcome_screen').update({ active: document.getElementById('welcome_active').checked, title: val('welcome_title_inp'), message: val('welcome_msg_inp') }).then(()=>showToast("تم الحفظ")); }

// [SECTION 2-5]: Cards, Schedule, Teachers
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
    document.getElementById('confirm-modal').style.display = 'flex';
}
function saveTeacherSettings() { db.ref('settings/teacher_spacing').set(val('t_spacing_range')).then(()=>showToast("تم الحفظ")); }
function addTeacherV2() {
    const d={name:val('t_name_v2'),role:val('t_role_v2'),emoji:val('t_emoji'),active:true};
    if(editKeys.teacher) db.ref('teachers_list_v2/'+editKeys.teacher).update(d).then(()=>{showToast("تم التعديل");resetForm('teacher');});
    else db.ref('teachers_list_v2').push(d).then(()=>{showToast("تمت الإضافة");resetForm('teacher');});
}

// [SECTION 6]: Ranks (تصميم + استعادة)
function saveRankDesign() {
    const design = {
        header_bg: val('d_header_bg'), header_text: val('d_header_text'),
        student_color: val('d_student_color'),
        ring_size: val('d_ring_size'), name_size: val('d_name_size')
    };
    db.ref('settings/ranks_design_v8').set(design).then(() => showToast("تم حفظ الألوان 🎨"));
}
function resetRankDesign() {
    if(confirm("استعادة ألوان الأوائل الافتراضية؟")) {
        // القيم الافتراضية (أخضر وأبيض)
        fill('d_header_bg', '#064e3b'); fill('d_header_text', '#ffffff'); fill('d_student_color', '#333333');
        fill('d_ring_size', '1.2'); fill('d_name_size', '1.0');
        saveRankDesign(); // حفظ تلقائي
    }
}
function addRank() {
    const name = val('rank_name'); if(!name) return showToast("الاسم مطلوب","error");
    const d = { rank: val('rank_num'), name: name, ring: val('rank_ring'), message: val('rank_msg'), active: true };
    if(editKeys.rank) db.ref('ranks_list/'+editKeys.rank).update(d).then(()=>{showToast("تم التعديل");resetForm('rank');});
    else db.ref('ranks_list').push(d).then(()=>{showToast("تمت الإضافة");resetForm('rank');});
}

// [SECTION 7-8]: Holidays, News
function addHoliday() {
    const d={text:val('holiday_txt'),active:true};
    if(editKeys.holiday) db.ref('holidays_list/'+editKeys.holiday).update(d).then(()=>{showToast("تم التعديل");resetForm('holiday');});
    else db.ref('holidays_list').push(d).then(()=>{showToast("تمت الإضافة");resetForm('holiday');});
}
function saveNewsBar(){ db.ref('news_bar').set({text:val('inp_news_bar')}).then(()=>showToast("تم")); }
function saveQuestion(){ db.ref('weekly_question').set({text:val('inp_q_text'),last_winner:val('inp_q_winner')}).then(()=>showToast("تم")); }
function saveAbout(){ db.ref('site_content/txt_about_content').set(val('inp_about_content')).then(()=>showToast("تم")); }

// === Modal Logic ===
function deleteItem(path) {
    pendingDeleteAction = () => db.ref(path).remove().then(()=>showToast("تم الحذف"));
    document.getElementById('confirm-modal').style.display = 'flex';
}
function confirmAction() { if(pendingDeleteAction) pendingDeleteAction(); closeModal(); }
function closeModal() { document.getElementById('confirm-modal').style.display = 'none'; pendingDeleteAction = null; }

// Helpers
function showTab(id) { document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function val(id) { return document.getElementById(id)?document.getElementById(id).value:''; }
function fill(id,v) { if(document.getElementById(id)) document.getElementById(id).value = v || ''; }
function toggleVisibility(p,s) { db.ref(p).update({active:!s}); }

// [LISTENER] مراقب البيانات (تحديث الحقول الجديدة)
db.ref().on('value', (snapshot) => {
    const d = snapshot.val(); if(!d) return;

    if(d.settings) {
        if(d.settings.ranks_design_v8) {
            const rd = d.settings.ranks_design_v8;
            fill('d_header_bg', rd.header_bg); fill('d_header_text', rd.header_text);
            fill('d_student_color', rd.student_color);
            fill('d_ring_size', rd.ring_size); fill('d_name_size', rd.name_size);
        }
        if(d.settings.theme_color) fill('main_theme_color', d.settings.theme_color);
        
        if(d.settings.welcome_screen) { if(document.getElementById('welcome_active')) document.getElementById('welcome_active').checked = d.settings.welcome_screen.active; fill('welcome_title_inp', d.settings.welcome_screen.title); fill('welcome_msg_inp', d.settings.welcome_screen.message); }
        if(d.settings.teacher_spacing && document.getElementById('t_spacing_range')) { document.getElementById('t_spacing_range').value = d.settings.teacher_spacing; document.getElementById('t_spacing_display').innerText = d.settings.teacher_spacing + 'px'; }
        if(document.getElementById('toggle_maint')) document.getElementById('toggle_maint').checked = d.settings.maintenance_mode;
        ['news','student','question','ranks','schedule','teachers'].forEach(k => { const el = document.getElementById('show_'+k); if(el) el.checked = d.settings['show_'+k]; });
    }
    
    // تحميل النصوص والألوان الخاصة بها
    if(d.site_content) { 
        fill('inp_header_title', d.site_content.txt_header_title); 
        fill('col_header_title', d.site_content.col_header_title || '#ffffff'); // Load color

        fill('inp_header_subtitle', d.site_content.txt_header_subtitle); 
        fill('col_header_subtitle', d.site_content.col_header_subtitle || '#ffffff'); // Load color

        fill('inp_header_location', d.site_content.txt_header_location); 
        fill('col_header_location', d.site_content.col_header_location || '#ffffff'); // Load color

        fill('inp_about_content', d.site_content.txt_about_content);
        fill('inp_video', d.settings ? d.settings.video_url : '');
    }
    
    if(d.news_bar) fill('inp_news_bar', d.news_bar.text);
    if(d.weekly_question) { fill('inp_q_text', d.weekly_question.text); fill('inp_q_winner', d.weekly_question.last_winner); }

    renderList('custom-cards-list-admin', d.custom_cards, 'card');
    renderList('teachers-list-v2-admin', d.teachers_list_v2, 'teacher');
    renderList('ranks-list-admin', d.ranks_list, 'rank');
    renderList('holidays-list-admin', d.holidays_list, 'holiday');
    renderComplexScheduleAdmin(d.schedule_complex);
});

// Render List (Standard)
function renderList(elId, data, type) {
    const el = document.getElementById(elId); if(!el) return; el.innerHTML='';
    if(!data) { el.innerHTML='<p>لا توجد بيانات</p>'; return; }
    
    if(type === 'rank') {
        const ringsSet = new Set();
        Object.values(data).forEach(item => { if(item.ring) ringsSet.add(item.ring.trim()); });
        const dataList = document.getElementById('ring_suggestions');
        if(dataList) { dataList.innerHTML = ''; ringsSet.forEach(r => { dataList.innerHTML += `<option value="${r}">`; }); }
    }

    Object.entries(data).forEach(([key, item]) => {
        const isActive = item.active !== false;
        let content = '';
        if(type==='card') content = `<strong style="color:${item.color}">${item.title}</strong>`;
        else if(type==='teacher') content = `${item.emoji||''} <strong>${item.name}</strong>`;
        else if(type==='rank') content = `#${item.rank} <strong>${item.name}</strong> <small>(${item.ring})</small>`;
        else content = item.text;
        
        let path = (type==='card'?'custom_cards':(type==='teacher'?'teachers_list_v2':(type==='rank'?'ranks_list':'holidays_list'))) + '/' + key;
        const itemStr = JSON.stringify(item).replace(/"/g, '&quot;');

        el.innerHTML += `
            <div class="dynamic-item ${isActive?'':'hidden-item'}">
                <div class="item-info">${content}</div>
                <div class="action-buttons">
                    <button onclick="prepareEdit('${type}','${key}',${itemStr})" class="btn-icon btn-edit"><i class="fas fa-pen"></i></button>
                    <button onclick="toggleVisibility('${path}',${isActive})" class="btn-icon btn-hide"><i class="fas fa-${isActive?'eye':'eye-slash'}"></i></button>
                    <button onclick="deleteItem('${path}')" class="btn-icon btn-delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    });
}
function prepareEdit(type, key, item) { 
    editKeys[type] = key;
    if(type === 'rank') { fill('rank_name', item.name); fill('rank_ring', item.ring); fill('rank_num', item.rank); fill('rank_msg', item.message); }
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
            el.innerHTML += `<div class="dynamic-item"><div class="item-info">📖 <strong>${r.name}</strong></div><div class="action-buttons"><button onclick="deleteComplexRing('${t}','${k}')" class="btn-icon btn-delete"><i class="fas fa-trash"></i></button></div></div>`;
        });
    }});
}
