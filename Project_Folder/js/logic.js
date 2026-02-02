/* ============================================================
   ملف: js/logic.js (الأصلي)
   الوظيفة: فتح القوائم المنسدلة، التنبيهات، التنقل
   ============================================================ */

// 1. دالة فتح وإغلاق القوائم (Accordion) - هام جداً للأزرار
function toggleAccordion(btn) {
    btn.classList.toggle("active");
    var panel = btn.nextElementSibling;
    if (panel.style.display === "block") {
        panel.style.display = "none";
        // تغيير السهم
        var arrow = btn.querySelector('span'); 
        if(arrow) arrow.innerText = "▼";
    } else {
        panel.style.display = "block";
        var arrow = btn.querySelector('span'); 
        if(arrow) arrow.innerText = "▲";
    }
}

// 2. نظام التنبيهات (Toast)
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};
window.alert = function(msg) { showToast(msg, 'info'); };

// 3. الوضع الليلي
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('theme-btn');
    if(btn) btn.innerText = document.body.classList.contains('dark-mode') ? "☀️" : "🌙"; 
}

// 4. القائمة الجانبية للموبايل
function toggleNavMenu() {
    const grid = document.getElementById('nav-menu-grid');
    const btn = document.querySelector('.nav-expand-btn');
    if (grid.classList.contains('visible')) {
        grid.classList.remove('visible');
        setTimeout(() => grid.classList.add('hidden'), 400); 
        btn.classList.remove('open');
    } else {
        grid.classList.remove('hidden');
        setTimeout(() => grid.classList.add('visible'), 10);
        btn.classList.add('open');
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionId}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
