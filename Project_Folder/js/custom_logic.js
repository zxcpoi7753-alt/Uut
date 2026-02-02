/* ============================================================
   ملف: js/custom_logic.js (V18 - إصلاح وظائف الأزرار والإشعارات)
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

    // تشغيل الدوال عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', function() {
        initAccordion(); // تشغيل القوائم المنسدلة
        initCalculator(); // تشغيل الآلة الحاسبة
    });

    // الاتصال بقاعدة البيانات
    db.ref().on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            applyAllData(data);
            // التعامل مع الإشعار المنبثق
            if(data.settings) handlePopupNotification(data.settings);
        }
    });

} catch (error) { console.error("Firebase Error:", error); }


// ============================================================
// 1. منطق الأكورديون (فتح وإغلاق القوائم) ✅
// ============================================================
function initAccordion() {
    const accButtons = document.querySelectorAll('.accordion-btn');
    accButtons.forEach(btn => {
        // إزالة أي مستمعي أحداث سابقين لتجنب التكرار
        btn.onclick = null;
        
        btn.onclick = function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            
            if (panel.style.display === "block") {
                panel.style.display = "none";
                // تغيير السهم (اختياري حسب الـ HTML لديك)
                const icon = this.querySelector('i');
                if(icon) icon.className = "fas fa-chevron-down";
            } else {
                panel.style.display = "block";
                const icon = this.querySelector('i');
                if(icon) icon.className = "fas fa-chevron-up";
            }
        };
    });
}

// ============================================================
// 2. منطق الآلة الحاسبة ✅
// ============================================================
function initCalculator() {
    const calcBtn = document.getElementById('calc-plan-btn');
    if(calcBtn) {
        calcBtn.onclick = function() {
            const d = parseFloat(document.getElementById('seal_days').value) || 0;
            const m = parseFloat(document.getElementById('seal_months').value) || 0;
            const y = parseFloat(document.getElementById('seal_years').value) || 0;

            const totalDays = d + (m * 30) + (y * 365);
            const resultArea = document.getElementById('calc-result-area');
            
            if (totalDays <= 0) {
                resultArea.innerHTML = "<p style='color:red;'>الرجاء إدخال مدة صحيحة!</p>";
                return;
            }

            const totalPages = 604;
            const pagesPerDay = totalPages / totalDays;
            
            let msg = "";
            if (pagesPerDay < 1) {
                msg = `لختم القرآن في <strong>${totalDays}</strong> يوم، تحتاج لقراءة جزء بسيط يومياً (أقل من صفحة).`;
            } else {
                msg = `تحتاج لقراءة <strong>${Math.ceil(pagesPerDay)}</strong> صفحات يومياً لختم القرآن في الموعد.`;
            }

            resultArea.innerHTML = `
                <div style="background:#e6fffa; border:1px solid #047857; padding:15px; border-radius:10px; margin-top:15px;">
                    <h4 style="margin:0 0 10px 0; color:#047857;">النتيجة:</h4>
                    <p>${msg}</p>
                </div>`;
            resultArea.style.display = 'block';
        };
    }
}

// ============================================================
// 3. منطق الإشعارات المنبثقة (Popups) ✅
// ============================================================
function handlePopupNotification(settings) {
    const popup = document.getElementById('site-notification');
    // تأكد من وجود العنصر في HTML
    if (!popup) return;

    // التحقق من "عدم الإظهار مرة أخرى"
    const dontShow = localStorage.getItem('dont_show_popup_v2'); 
    
    if (settings.popup_active === true && dontShow !== 'true') {
        // إظهار النافذة
        popup.style.display = 'flex'; // استخدام display:flex للتوسط
        
        // تعبئة البيانات
        const titleEl = document.getElementById('notif-title');
        const bodyEl = document.getElementById('notif-body');
        if(titleEl) titleEl.innerText = settings.popup_title || "تنبيه";
        if(bodyEl) bodyEl.innerText = settings.popup_body || "";
    } else {
        popup.style.display = 'none';
    }
}

// دالة إغلاق الإشعار (يجب ربطها بزر الإغلاق في HTML)
window.closeNotification = function() {
    const popup = document.getElementById('site-notification');
    if(popup) popup.style.display = 'none';
    
    // حفظ خيار عدم الإظهار إذا تم تحديده (اختياري)
    const checkbox = document.getElementById('popup-forever-check');
    if(checkbox && checkbox.checked) {
        localStorage.setItem('dont_show_popup_v2', 'true');
    }
};


// ============================================================
// 4. تطبيق البيانات العامة (كما كان سابقاً)
// ============================================================
function applyAllData(data) {
    data = data || {}; 
    
    // الألوان والهيدر
    const s = data.settings || {};
    const themeColor = s.theme_color || '#047857';
    document.documentElement.style.setProperty('--primary-color', themeColor);
    document.documentElement.style.setProperty('--accent-color', themeColor); // جعلنا الأكسنت نفس اللون للتبسيط
    
    const header = document.querySelector('header');
    if(header) header.style.backgroundColor = themeColor;

    // تعبئة النصوص
    const c = data.site_content || {};
    setText('txt_header_title', c.txt_header_title, "حلقات الثريا");
    setColor('txt_header_title', '#ffffff'); // أبيض إجباري

    setText('txt_header_subtitle', c.txt_header_subtitle, "لتعليم القرآن الكريم");
    setColor('txt_header_subtitle', '#ffffff');

    setText('txt_header_location', c.txt_header_location, "حضرموت - غيل باوزير");
    setColor('txt_header_location', '#ffffff');

    // باقي القوائم
    renderComplexSchedule(data.schedule_complex);
    renderTeachers(data.teachers_list_v2, s);
    renderCustomCards(data.custom_cards);
    renderRanks(data.ranks_list, s);
    renderHolidays(data.holidays_list);
}

// دوال مساعدة
function setText(id, text, def) { const el = document.getElementById(id); if(el) el.innerText = text || def; }
function setColor(id, color) { const el = document.getElementById(id); if(el) el.style.color = color; }

// ============================================================
// 5. دوال الرسم (Ranks, Teachers...) - نفس المنطق السابق
// ============================================================
function renderRanks(list, settings) {
    const container = document.getElementById('dynamic-ranks-list');
    if(!container) return; container.innerHTML = '';
    if(!list) { container.innerHTML = '<p style="text-align:center;">لا يوجد بيانات</p>'; return; }
    
    const design = (settings && settings.ranks_design_v8) ? settings.ranks_design_v8 : { header_bg: '#047857', header_text: '#ffffff', student_color: '#333' };
    
    // تجميع الحلقات
    const groups = {};
    Object.values(list).forEach(r => { if(r.active!==false) { let n=r.ring?r.ring.trim():"عام"; if(!groups[n])groups[n]=[]; groups[n].push(r); } });
    
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
    const spacing = (settings && settings.teacher_spacing) ? settings.teacher_spacing + 'px' : '10px';
    
    if(!list) return;
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

function renderCustomCards(list) {
    const container = document.getElementById('dynamic-custom-cards-container');
    if(!container) return; container.innerHTML = '';
    if(!list) return;
    Object.values(list).forEach(c => {
        if(c.active===false) return;
        // هنا يمكن إضافة كود رسم البطاقات حسب تصميمك
    });
}

function renderComplexSchedule(d) { /* كود الجداول السابق */ }
function renderHolidays(l) { /* كود الإجازات السابق */ }
