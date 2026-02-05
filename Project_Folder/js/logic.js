/* ============================================================
   ملف: js/logic.js (V33 - الإصلاح المتوافق مع CSS)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log("جاري تهيئة النظام V33...");
    
    // 1. بناء القائمة فوراً
    buildNavigationMenu();

    // 2. تعبئة قوائم الأجزاء
    populateJuzuDropdowns();

    // 3. تشغيل شريط الآيات
    if(typeof startVerseTicker === 'function') startVerseTicker();

    // 4. استرجاع الثيم
    if(localStorage.getItem('site_theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('theme-btn');
        if(btn) btn.innerText = "☀️";
    }
});

// ==========================================
// 1. وظيفة فتح قائمة "بقية الأقسام" (الحل الصحيح)
// ==========================================
window.toggleNavMenu = function() {
    const grid = document.getElementById('nav-menu-grid');
    const btn = document.querySelector('.nav-expand-btn');
    const arrow = document.getElementById('nav-arrow');
    
    if(!grid) return;

    // خطوة أمان: إذا كانت القائمة فارغة، قم ببنائها الآن
    if(grid.children.length === 0) {
        buildNavigationMenu();
    }

    // استخدام الكلاس visible كما هو في ملف layout.css
    if (grid.classList.contains('visible')) {
        // إغلاق
        grid.classList.remove('visible');
        setTimeout(() => grid.classList.add('hidden'), 400); // للتوافق مع الأنيميشن
        if(btn) btn.classList.remove('open');
        if(arrow) arrow.style.transform = "rotate(0deg)";
    } else {
        // فتح
        grid.classList.remove('hidden');
        // تأخير بسيط جداً للسماح للـ CSS بتفعيل الحركة
        setTimeout(() => grid.classList.add('visible'), 10);
        
        if(btn) btn.classList.add('open');
        if(arrow) arrow.style.transform = "rotate(180deg)";
    }
};

// ==========================================
// 2. دالة بناء أزرار القائمة
// ==========================================
function buildNavigationMenu() {
    const navGrid = document.getElementById('nav-menu-grid');
    if(!navGrid) return;

    const menus = [
        { id: 'ranks', text: '🏆 الأوائل' },
        { id: 'schedule', text: '📅 الجداول' },
        { id: 'teachers', text: '👨‍🏫 المعلمون' },
        { id: 'student', text: '📖 ركن الطالب' },
        { id: 'myname', text: '🏷️ بطاقتي' },
        { id: 'about', text: '🕌 من نحن' }
    ];

    navGrid.innerHTML = ''; 
    menus.forEach(menu => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn'; // سيأخذ تنسيق CSS الموجود
        btn.innerText = menu.text;
        btn.onclick = function() {
            showSection(menu.id);
        };
        navGrid.appendChild(btn);
    });
}

// ==========================================
// 3. وظيفة التنقل بين الأقسام
// ==========================================
window.showSection = function(sectionId) {
    // إخفاء الكل
    document.querySelectorAll('.page-section').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
    });

    // إظهار المطلوب
    const target = document.getElementById(`section-${sectionId}`);
    if(target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active'), 10); // تفعيل أنيميشن الظهور
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // إغلاق القائمة الجانبية تلقائياً
    const grid = document.getElementById('nav-menu-grid');
    if(grid && grid.classList.contains('visible')) {
        toggleNavMenu();
    }
    
    // تنشيط زر الرئيسية
    const homeBtn = document.querySelector('.nav-btn-home');
    if(homeBtn) {
        if(sectionId === 'home') homeBtn.classList.add('active');
        else homeBtn.classList.remove('active');
    }

    // تحميل المصحف لركن الطالب
    if(sectionId === 'student' && typeof preloadQuranData === 'function') {
        preloadQuranData();
    }
};

// ==========================================
// 4. دالة فتح نافذة الأدمن (حل مشكلة القفل)
// ==========================================
window.openLoginModal = function() {
    const modal = document.getElementById('login-modal');
    if(modal) {
        modal.style.display = 'flex'; // تأكدنا من ملف CSS أن display الافتراضي هو flex للتوسط
    } else {
        alert("خطأ: نافذة الدخول غير موجودة");
    }
};

// ==========================================
// 5. دوال مساعدة (الأكورديون، التنبيهات، الألوان)
// ==========================================
window.toggleAccordion = function(btn) {
    btn.classList.toggle("active");
    const panel = btn.nextElementSibling;
    const arrow = btn.querySelector('span');
    
    if (panel.style.display === "block") {
        panel.style.display = "none";
        if(arrow) arrow.innerText = "▼";
    } else {
        panel.style.display = "block";
        if(arrow) arrow.innerText = "▲";
    }
};

function populateJuzuDropdowns() {
    const ids = ['skip-juzu-calc1', 'skip-juzu-calc2', 'quiz-juz'];
    ids.forEach(id => {
        const select = document.getElementById(id);
        if(!select) return;
        if(select.options.length > 1) return; // منع التكرار
        
        for(let i=1; i<=30; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = `الجزء ${i}`;
            select.appendChild(opt);
        }
    });
}

window.showToast = function(msg, type='info') {
    const box = document.getElementById('toast-container');
    if(!box) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerText = msg;
    box.appendChild(t);
    setTimeout(() => t.style.opacity='1', 10);
    setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),500); }, 3000);
};

window.alert = function(m) { showToast(m); };
window.closePopup = function() { 
    const p = document.getElementById('site-notification');
    if(p) p.style.display='none'; 
};
window.disablePopupForever = function() {
    const chk = document.getElementById('popup-forever-check');
    if(chk && chk.checked) localStorage.setItem('dont_show_popup_v2', 'true');
    closePopup();
};
