/* ============================================================
   ملف: js/logic.js (V30 - المحرك الرئيسي المطور)
   الوظيفة: التحكم في القوائم، الألوان، التنبيهات، والتهيئة
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log("جاري تهيئة محرك الواجهة V30...");

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
// 1. وظائف التنقل وفتح الأقسام (حل مشكلة التعليق)
// ==========================================

window.showSection = function(sectionId) {
    // إخفاء كل الأقسام
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
    }

    // إدارة حالة زر الرئيسية
    const homeBtn = document.querySelector('.nav-btn-home');
    if(sectionId === 'home') homeBtn?.classList.add('active');
    else homeBtn?.classList.remove('active');

    // إغلاق القائمة الجانبية للموبايل بعد الاختيار
    const grid = document.getElementById('nav-menu-grid');
    if (grid && grid.classList.contains('visible')) {
        toggleNavMenu();
    }
    
    // تحميل بيانات المصحف إذا دخل المستخدم ركن الطالب
    if(sectionId === 'student' && typeof preloadQuranData === 'function') {
        preloadQuranData();
    }
};

window.toggleNavMenu = function() {
    const grid = document.getElementById('nav-menu-grid');
    const btn = document.querySelector('.nav-expand-btn');
    const arrow = document.getElementById('nav-arrow');
    
    if (grid.classList.contains('visible')) {
        grid.classList.remove('visible');
        setTimeout(() => grid.classList.add('hidden'), 400); 
        btn.classList.remove('open');
        if(arrow) arrow.style.transform = "rotate(0deg)";
    } else {
        grid.classList.remove('hidden');
        setTimeout(() => grid.classList.add('visible'), 10);
        btn.classList.add('open');
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
    if(!display) return;

    if(theme === 'yellow') {
        display.style.backgroundColor = "#fdf6e3"; // لون الورق الأصفر
        display.style.color = "#5b4636";
    } else {
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

// استبدال الـ Alert القديم
window.alert = function(msg) { showToast(msg, 'info'); };

window.closePopup = function() {
    document.getElementById('site-notification').style.display = 'none';
};

// ==========================================
// 5. بناء القوائم والآيات
// ==========================================

function buildNavigationMenu() {
    const navGrid = document.getElementById('nav-menu-grid');
    if(!navGrid || typeof siteData === 'undefined') return;

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
        btn.onclick = () => showSection(menu.id);
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
