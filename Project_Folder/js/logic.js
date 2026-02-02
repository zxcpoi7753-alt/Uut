/* ============================================================
   ملف: js/logic.js (V28 - المحرك الكامل)
   ============================================================ */

// 1. عند تحميل الصفحة (تشغيل كل شيء)
document.addEventListener('DOMContentLoaded', () => {
    
    // أ. بناء قائمة الأقسام (كان مفقوداً)
    const navGrid = document.getElementById('nav-menu-grid');
    if(navGrid && typeof menus !== 'undefined') {
        navGrid.innerHTML = ''; // تنظيف
        menus.forEach(menu => {
            if(menu.id === 'home') return; // عدم تكرار الرئيسية
            const btn = document.createElement('button');
            btn.className = 'nav-btn'; 
            btn.innerText = menu.text;
            btn.onclick = () => showSection(menu.id);
            navGrid.appendChild(btn);
        });
        console.log("تم بناء القائمة بنجاح ✅");
    }

    // ب. استرجاع اسم الطالب (الترحيب)
    updateWelcomeMessage();

    // ج. تشغيل شريط الآيات
    if(typeof startVerseTicker === 'function') startVerseTicker();
});


// 2. دوال التنقل وفتح القوائم
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

window.showSection = function(sectionId) {
    // إخفاء كل الأقسام
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    
    // إظهار القسم المطلوب
    const target = document.getElementById(`section-${sectionId}`);
    if(target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // تحديث زر الرئيسية
    const homeBtn = document.querySelector('.nav-btn-home');
    if(sectionId === 'home') {
        if(homeBtn) homeBtn.classList.add('active');
    } else {
        if(homeBtn) homeBtn.classList.remove('active');
    }

    // إغلاق القائمة إذا كانت مفتوحة
    const grid = document.getElementById('nav-menu-grid');
    if (grid && grid.classList.contains('visible')) {
        toggleNavMenu();
    }
};


// 3. دالة فتح أزرار ركن الطالب (Accordion)
window.toggleAccordion = function(btn) {
    btn.classList.toggle("active");
    var panel = btn.nextElementSibling;
    
    if (panel.style.display === "block") {
        panel.style.display = "none";
        var arrow = btn.querySelector('span'); 
        if(arrow) arrow.innerText = "▼";
    } else {
        panel.style.display = "block";
        var arrow = btn.querySelector('span'); 
        if(arrow) arrow.innerText = "▲";
    }
};


// 4. إغلاق التنبيهات (Popup)
window.closePopup = function() {
    const popup = document.getElementById('site-notification');
    if(popup) popup.style.display = 'none';
};

window.disablePopupForever = function() {
    const checkbox = document.getElementById('popup-forever-check');
    if(checkbox && checkbox.checked) {
        localStorage.setItem('dont_show_popup_v2', 'true');
        alert("تم! لن تظهر لك هذه الرسالة مرة أخرى.");
    }
    closePopup();
};


// 5. الوظائف المساعدة (الثيم، الترحيب، الآيات)
window.toggleTheme = function() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('theme-btn');
    const isDark = document.body.classList.contains('dark-mode');
    if(btn) btn.innerText = isDark ? "☀️" : "🌙"; 
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

function updateWelcomeMessage() {
    const savedName = localStorage.getItem('studentName');
    const msgBox = document.getElementById('home-welcome-msg');
    const nameInput = document.getElementById('student-name-input'); // في حال وجوده

    if (savedName && msgBox) {
        msgBox.style.display = 'block';
        msgBox.innerHTML = `👋 أهلاً بك يا <strong>${savedName}</strong>`;
    }
    if (nameInput && savedName) nameInput.value = savedName;
}

let availableVerses = []; 
function startVerseTicker() {
    const vDisp = document.getElementById('verse-display');
    if (!vDisp || typeof verses === 'undefined') return;

    const runCycle = () => {
        if (availableVerses.length === 0) availableVerses = [...verses]; 
        const randomIndex = Math.floor(Math.random() * availableVerses.length);
        const verseText = availableVerses[randomIndex];
        availableVerses.splice(randomIndex, 1); 

        vDisp.innerText = verseText;
        vDisp.classList.add('visible'); 

        setTimeout(() => {
            vDisp.classList.remove('visible'); 
            setTimeout(runCycle, 3000); 
        }, 8000);
    };
    runCycle(); 
}

// نظام التنبيهات (Toast)
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
