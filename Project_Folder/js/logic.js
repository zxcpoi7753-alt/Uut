/* ============================================================
   ملف: js/logic.js (V31 - الإصدار المصلح والكامل)
   الوظيفة: التحكم في القوائم، الألوان، التنبيهات، نافذة الأدمن
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log("جاري تهيئة محرك الواجهة V31...");

    // 1. تعبئة قوائم تخطي الأجزاء (1-30) في الحاسبات
    populateJuzuDropdowns();

    // 2. بناء قائمة "بقية الأقسام" ديناميكياً
    buildNavigationMenu();

    // 3. تهيئة شريط الآيات
    if(typeof startVerseTicker === 'function') startVerseTicker();

    // 4. استرجاع الثيم المحفوظ
    const savedTheme = localStorage.getItem('site_theme');
    if(savedTheme === 'dark') document.body.classList.add('dark-mode');
});

// ==========================================
// 1. وظائف التنقل وفتح الأقسام + الأدمن (القسم المعدل)
// ==========================================

// --- إضافة هامة: دالة فتح نافذة الأدمن (كانت ناقصة) ---
window.openLoginModal = function() {
    const modal = document.getElementById('login-modal');
    if(modal) {
        modal.style.display = 'flex'; // استخدام flex لتوسط النافذة
        console.log("تم فتح نافذة الدخول ✅");
    } else {
        console.error("خطأ: نافذة الدخول غير موجودة في HTML");
    }
};

// دالة التنقل بين الأقسام (تم تحسينها)
window.showSection = function(sectionId) {
    console.log("محاولة فتح القسم:", sectionId);

    // إخفاء كل الأقسام أولاً
    document.querySelectorAll('.page-section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    // إظهار القسم المطلوب بقوة
    const target = document.getElementById(`section-${sectionId}`);
    if(target) {
        target.classList.add('active');
        target.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.error(`القسم section-${sectionId} غير موجود!`);
    }

    // إدارة حالة زر الرئيسية (تنشيط/إلغاء تنشيط)
    const homeBtn = document.querySelector('.nav-btn-home');
    if(homeBtn) {
        if(sectionId === 'home') homeBtn.classList.add('active');
        else homeBtn.classList.remove('active');
    }

    // إغلاق القائمة الجانبية للموبايل تلقائياً بعد الاختيار
    const grid = document.getElementById('nav-menu-grid');
    if (grid && grid.classList.contains('visible')) {
        toggleNavMenu();
    }
    
    // تحميل بيانات المصحف مسبقاً إذا دخل المستخدم ركن الطالب
    if(sectionId === 'student' && typeof preloadQuranData === 'function') {
        preloadQuranData();
    }
};

// دالة القائمة المنسدلة (تم تحسينها لمنع الأخطاء)
window.toggleNavMenu = function() {
    const grid = document.getElementById('nav-menu-grid');
    const btn = document.querySelector('.nav-expand-btn');
    const arrow = document.getElementById('nav-arrow');
    
    if(!grid) return; // حماية من الأخطاء
    
    if (grid.classList.contains('visible')) {
        // إغلاق القائمة
        grid.classList.remove('visible');
        setTimeout(() => grid.classList.add('hidden'), 400); 
        if(btn) btn.classList.remove('open');
        if(arrow) arrow.style.transform = "rotate(0deg)";
    } else {
        // فتح القائمة
        grid.classList.remove('hidden');
        setTimeout(() => grid.classList.add('visible'), 10);
        if(btn) btn.classList.add('open');
        if(arrow) arrow.style.transform = "rotate(180deg)";
    }
};

// ==========================================
// 2. وظائف ركن الطالب (الأكورديون والخيارات)
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
        
        // مسح المحتوى الحالي (إلا أول خيار)
        const firstOption = select.options[0];
        select.innerHTML = '';
        select.appendChild(firstOption);

        for(let i=1; i<=30; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = `الجزء ${i}`;
            select.appendChild(opt);
        }
    });
}

// ==========================================
// 3. وظائف المصحف (الألوان والبحث)
// ==========================================

window.setQuranTheme = function(theme) {
    const display = document.getElementById('quran-text-display');
    const readingArea = document.getElementById('reading-area');
    
    if(!display) return;

    if(theme === 'yellow') {
        if(readingArea) readingArea.style.backgroundColor = "#fdf6e3";
        display.style.backgroundColor = "#fdf6e3"; // لون الورق الأصفر
        display.style.color = "#5b4636";
    } else {
        if(readingArea) readingArea.style.backgroundColor = "#ffffff";
        display.style.backgroundColor = "#ffffff";
        display.style.color = "var(--text-dark)";
    }
    showToast(`تم تغيير مظهر المصحف إلى ${theme === 'yellow' ? 'الأصفر' : 'الأبيض'}`, "info");
};

// ==========================================
// 4. نظام التنبيهات والترحيب
// ==========================================

window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};

// استبدال الـ Alert القديم بـ Toast أجمل
window.alert = function(msg) { showToast(msg, 'info'); };

window.closePopup = function() {
    const popup = document.getElementById('site-notification');
    if(popup) popup.style.display = 'none';
};

// ==========================================
// 5. بناء القوائم والآيات
// ==========================================

function buildNavigationMenu() {
    const navGrid = document.getElementById('nav-menu-grid');
    // نتأكد من وجود العنصر ومن وجود بيانات القوائم (siteData قد تكون في data.js)
    if(!navGrid) return;

    // تعريف القوائم يدوياً لضمان العمل حتى لو لم يتم تحميل data.js بشكل صحيح
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
        btn.className = 'nav-btn'; 
        btn.innerText = menu.text;
        // استخدام window.showSection لضمان الوصول للدالة
        btn.onclick = () => window.showSection(menu.id);
        navGrid.appendChild(btn);
    });
}

window.toggleTheme = function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('site_theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('theme-btn');
    if(btn) btn.innerText = isDark ? "☀️" : "🌙";
};
