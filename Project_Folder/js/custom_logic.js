/* ============================================================
   ملف: js/custom_logic.js (يعمل مع V20 - إصلاح أزرار الطالب)
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

    // 1. تشغيل الوظائف عند تحميل الصفحة مباشرة
    document.addEventListener('DOMContentLoaded', function() {
        console.log("تم تحميل الصفحة، جاري تشغيل الأزرار...");
        initAccordion();   // تشغيل القوائم المنسدلة (دليلي، خطتي...)
        initCalculator();  // تشغيل الحاسبة
    });

    // 2. الاتصال بقاعدة البيانات لجلب المحتوى
    db.ref().on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            applyAllData(data);
            if(data.settings) handlePopupNotification(data.settings);
        }
    });

} catch (error) { console.error("Firebase Error:", error); }


// ============================================================
// 1. إصلاح أزرار ركن الطالب (Accordion Fix) 🛠️
// ============================================================
function initAccordion() {
    // نحدد كل الأزرار التي لها كلاس accordion-btn
    const accButtons = document.querySelectorAll('.accordion-btn');
    
    if(accButtons.length === 0) {
        console.warn("لم يتم العثور على أزرار accordion-btn");
        return;
    }

    accButtons.forEach(btn => {
        // تنظيف الأحداث القديمة
        btn.onclick = null;
        
        // إضافة حدث النقر الجديد
        btn.onclick = function() {
            console.log("تم ضغط الزر:", this.innerText);
            
            // التبديل بين الفتح والإغلاق
            this.classList.toggle('active');
            
            // العنصر التالي هو المحتوى (Panel)
            const panel = this.nextElementSibling;
            
            if (panel) {
                if (panel.style.display === "block") {
                    panel.style.display = "none";
                } else {
                    panel.style.display = "block";
                }
            } else {
                console.error("لا يوجد محتوى (panel) بعد هذا الزر!");
            }
        };
    });
}


// ============================================================
// 2. تشغيل الآلة الحاسبة (My Plan) 🧮
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
                resultArea.innerHTML = "<p style='color:red; font-weight:bold;'>⚠️ الرجاء إدخال مدة صحيحة!</p>";
                resultArea.style.display = 'block';
                return;
            }

            const totalPages = 604;
            const pagesPerDay = totalPages / totalDays;
            
            let msg = "";
            if (pagesPerDay < 1) {
                msg = `لختم القرآن في <strong>${totalDays}</strong> يوم، تحتاج لقراءة أقل من صفحة يومياً.`;
            } else {
                msg = `تحتاج لقراءة <strong>${Math.ceil(pagesPerDay)}</strong> صفحات يومياً.`;
            }

            resultArea.innerHTML = `
                <div style="background:#e6fffa; border:1px solid #047857; padding:15px; border-radius:10px; margin-top:15px;">
                    <h4 style="margin:0 0 10px 0; color:#047857;">📊 النتيجة:</h4>
                    <p style="font-size:1.1rem;">${msg}</p>
                </div>`;
            resultArea.style.display = 'block';
        };
    }
}


// ============================================================
// 3. الدوال الأساسية (الرسم والعرض)
// ============================================================
function applyAllData(data) {
    data = data || {};
    const s = data.settings || {};
    
    // الهيدر والألوان
    const themeColor = s.theme_color || '#047857';
    document.documentElement.style.setProperty('--primary-color', themeColor);
    const header = document.querySelector('header');
    if(header) header.style.backgroundColor = themeColor;

    // النصوص
    const c = data.site_content || {};
    setText('txt_header_title', c.txt_header_title, "حلقات الثريا");
    setText('txt_header_subtitle', c.txt_header_subtitle, "لتعليم القرآن الكريم");
    setText('txt_header_location', c.txt_header_location, "حضرموت - غيل باوزير");

    // استدعاء دوال الرسم
    renderRanks(data.ranks_list, s);
    renderTeachers(data.teachers_list_v2, s);
    renderCustomCards(data.custom_cards);
    renderComplexSchedule(data.schedule_complex);
    renderHolidays(data.holidays_list);
}

// دوال مساعدة
function setText(id, text, def) { 
    const el = document.getElementById(id); 
    if(el) {
        el.innerText = text || def; 
        el.style.color = "#ffffff"; // تثبيت الأبيض للهيدر
    }
}

// رسم الأوائل (يمين - يسار)
function renderRanks(list, settings) {
    const container = document.getElementById('dynamic-ranks-list');
    if(!container) return; container.innerHTML = '';
    
    // إنشاء عنصر التوست للتهنئة
    if(!document.getElementById('student-toast-msg')) { 
        const t=document.createElement('div'); t.id='student-toast-msg'; t.className='student-toast'; 
        document.body.appendChild(t); 
    }

    if(!list) { container.innerHTML = '<p style="text-align:center;">لا توجد بيانات</p>'; return; }
    
    const design = (settings && settings.ranks_design_v8) ? settings.ranks_design_v8 : { header_bg: '#047857', header_text: '#ffffff', student_color: '#333' };
    
    const groups = {};
    Object.values(list).forEach(r => { if(r.active!==false) { let n=r.ring?r.ring.trim():"عام"; if(!groups[n])groups[n]=[]; groups[n].push(r); } });
    
    Object.keys(groups).sort().forEach(ringName => {
        const students = groups[ringName].sort((a,b) => a.rank - b.rank);
        const card = document.createElement('div'); card.className = 'rank-group-card';
        
        let html = `<div class="rank-group-header" style="background:${design.header_bg}; color:${design.header_text};">${ringName}</div><div class="students-list">`;
        
        students.forEach(s => {
            let badge = s.emoji ? s.emoji : (s.rank==1?'🥇':(s.rank==2?'🥈':(s.rank==3?'🥉':'🎖️')));
            const safeMsg = (s.message||"مبارك!").replace(/'/g, "\\'"); 
            const safeName = s.name.replace(/'/g, "\\'");
            
            html += `<div class="student-list-item" onclick="showStudentPraise('${safeName}', '${safeMsg}')">
                        <span class="student-name-text" style="color:${design.student_color}">${s.name}</span>
                        <span class="rank-icon">${badge}</span>
                     </div>`;
        });
        html += '</div>';
        card.innerHTML = html;
        container.appendChild(card);
    });
}

function showStudentPraise(n,m){ 
    const t=document.getElementById('student-toast-msg'); 
    t.innerHTML=`<div style="font-weight:bold;margin-bottom:5px;color:#fbbf24;font-size:1.2rem;">${n}</div><div>${m}</div>`; 
    t.classList.add('show'); 
    setTimeout(()=>t.classList.remove('show'),3000); 
}

// رسم المعلمين
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

// التعامل مع الإشعارات
function handlePopupNotification(settings) {
    const popup = document.getElementById('site-notification');
    if (!popup) return;
    
    const dontShow = localStorage.getItem('dont_show_popup_v2'); 
    if (settings.popup_active === true && dontShow !== 'true') {
        popup.style.display = 'flex';
        const titleEl = document.getElementById('notif-title');
        const bodyEl = document.getElementById('notif-body');
        if(titleEl) titleEl.innerText = settings.popup_title || "تنبيه";
        if(bodyEl) bodyEl.innerText = settings.popup_body || "";
    } else {
        popup.style.display = 'none';
    }
}
window.closeNotification = function() {
    const popup = document.getElementById('site-notification');
    if(popup) popup.style.display = 'none';
    const checkbox = document.getElementById('popup-forever-check');
    if(checkbox && checkbox.checked) localStorage.setItem('dont_show_popup_v2', 'true');
};

// دوال فارغة لتجنب الأخطاء إذا لم تكن البيانات موجودة
function renderCustomCards(l){}
function renderComplexSchedule(d){}
function renderHolidays(l){}
