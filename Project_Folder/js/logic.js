/* ============================================================
   ملف: js/logic.js (V27 - المحرك الأساسي)
   الوظيفة: تشغيل الواجهة، فتح القوائم، وإغلاق الإشعارات
   ============================================================ */

// 1. دالة فتح وإغلاق القوائم (Accordion) - إصلاح أزرار ركن الطالب
window.toggleAccordion = function(btn) {
    btn.classList.toggle("active");
    var panel = btn.nextElementSibling;
    
    if (panel.style.display === "block") {
        panel.style.display = "none";
        // تغيير السهم للأسفل
        var arrow = btn.querySelector('span'); 
        if(arrow) arrow.innerText = "▼";
    } else {
        panel.style.display = "block";
        // تغيير السهم للأعلى
        var arrow = btn.querySelector('span'); 
        if(arrow) arrow.innerText = "▲";
    }
};

// 2. دالة إغلاق النافذة المنبثقة (إصلاح مشكلة التعليق)
window.closePopup = function() {
    const popup = document.getElementById('site-notification');
    if(popup) {
        popup.style.display = 'none';
        console.log("تم إغلاق النافذة المنبثقة");
    }
};

window.disablePopupForever = function() {
    const checkbox = document.getElementById('popup-forever-check');
    if(checkbox && checkbox.checked) {
        localStorage.setItem('dont_show_popup_v2', 'true');
        alert("تم! لن تظهر لك هذه الرسالة مرة أخرى.");
    }
    closePopup();
};

// 3. التنقل بين الأقسام
window.showSection = function(sectionId) {
    // إخفاء كل الأقسام
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    
    // إظهار القسم المطلوب
    const target = document.getElementById(`section-${sectionId}`);
    if(target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // إدارة زر الرئيسية في القائمة السفلية
    const homeBtn = document.querySelector('.nav-btn-home');
    if(sectionId === 'home') {
        if(homeBtn) homeBtn.classList.add('active');
    } else {
        if(homeBtn) homeBtn.classList.remove('active');
    }

    // إغلاق القائمة المنسدلة إذا كانت مفتوحة (للموبايل)
    const grid = document.getElementById('nav-menu-grid');
    if (grid && grid.classList.contains('visible')) {
        toggleNavMenu();
    }
};

// 4. القائمة الجانبية (بقية الأقسام)
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

// 5. الوضع الليلي
window.toggleTheme = function() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('theme-btn');
    const isDark = document.body.classList.contains('dark-mode');
    if(btn) btn.innerText = isDark ? "☀️" : "🌙"; 
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

// تطبيق الثيم المحفوظ عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    if(localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('theme-btn');
        if(btn) btn.innerText = "☀️";
    }
});

// 6. نظام التنبيهات (Toast Messages)
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    
    // أنيميشن الدخول
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    // الحذف التلقائي
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

// استبدال alert بـ Toast لجمالية أكثر
window.alert = function(msg) { showToast(msg, 'info'); };
