/* ============================================================
   ملف: js/logic.js (V32 - الإصلاح النهائي للقوائم)
   الوظيفة: إجبار القوائم على الفتح وبناء العناصر يدوياً
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log("جاري تهيئة النظام V32...");
    
    // تشغيل الدوال الأساسية
    populateJuzuDropdowns();
    if(typeof startVerseTicker === 'function') startVerseTicker();

    // بناء القائمة فوراً عند التحميل
    buildNavigationMenu();

    // استرجاع الثيم
    if(localStorage.getItem('site_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

// ==========================================
// 1. وظيفة فتح قائمة "بقية الأقسام" (الحل الجذري)
// ==========================================
window.toggleNavMenu = function() {
    const grid = document.getElementById('nav-menu-grid');
    const btn = document.querySelector('.nav-expand-btn');
    const arrow = document.getElementById('nav-arrow');
    
    if(!grid) return;

    // خطوة أمان: إذا كانت القائمة فارغة، قم ببنائها الآن فوراً
    if(grid.children.length === 0) {
        console.log("القائمة فارغة، جاري البناء...");
        buildNavigationMenu();
    }

    // التبديل بين الإظهار والإخفاء (مباشرة بستايل العنصر)
    if (grid.style.display === 'grid') {
        // إغلاق
        grid.style.display = 'none';
        if(btn) btn.classList.remove('open');
        if(arrow) arrow.innerText = "▼"; // سهم لأسفل
    } else {
        // فتح (إجبار الظهور كشبكة)
        grid.style.display = 'grid';
        if(btn) btn.classList.add('open');
        if(arrow) arrow.innerText = "▲"; // سهم لأعلى
    }
};

// ==========================================
// 2. دالة بناء أزرار القائمة (مدمجة هنا لضمان وجودها)
// ==========================================
function buildNavigationMenu() {
    const navGrid = document.getElementById('nav-menu-grid');
    if(!navGrid) return;

    // القائمة الثابتة لضمان ظهورها حتى لو لم تكن هناك انترنت
    const menus = [
        { id: 'ranks', text: '🏆 الأوائل' },
        { id: 'schedule', text: '📅 الجداول' },
        { id: 'teachers', text: '👨‍🏫 المعلمون' },
        { id: 'student', text: '📖 ركن الطالب' },
        { id: 'myname', text: '🏷️ بطاقتي' },
        { id: 'about', text: '🕌 من نحن' }
    ];

    navGrid.innerHTML = ''; // تنظيف
    menus.forEach(menu => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        // إضافة ستايل بسيط لضمان أن الزر يظهر بشكل جيد
        btn.style.padding = "15px";
        btn.style.fontSize = "1rem";
        btn.style.cursor = "pointer";
        btn.innerText = menu.text;
        
        // ربط الزر بدالة الانتقال
        btn.onclick = function() {
            showSection(menu.id);
        };
        
        navGrid.appendChild(btn);
    });
    
    // إضافة تنسيق الشبكة يدوياً لضمان الشكل
    navGrid.style.gridTemplateColumns = "repeat(2, 1fr)";
    navGrid.style.gap = "10px";
    navGrid.style.marginTop = "10px";
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
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // إغلاق القائمة الجانبية بعد الاختيار
    const grid = document.getElementById('nav-menu-grid');
    if(grid && grid.style.display === 'grid') {
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
// 4. بقية الوظائف (الأدمن، الأكورديون، وغيرها)
// ==========================================

window.openLoginModal = function() {
    const modal = document.getElementById('login-modal');
    if(modal) modal.style.display = 'flex';
};

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
        const first = select.options[0];
        select.innerHTML = '';
        select.appendChild(first);
        for(let i=1; i<=30; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = `الجزء ${i}`;
            select.appendChild(opt);
        }
    });
}

// الألوان والتنبيهات
window.setQuranTheme = function(theme) {
    const display = document.getElementById('quran-text-display');
    const area = document.getElementById('reading-area');
    if(!display) return;
    if(theme === 'yellow') {
        if(area) area.style.backgroundColor = "#fdf6e3";
        display.style.backgroundColor = "#fdf6e3";
        display.style.color = "#5b4636";
    } else {
        if(area) area.style.backgroundColor = "#ffffff";
        display.style.backgroundColor = "#ffffff";
        display.style.color = "#000";
    }
    showToast("تم تغيير اللون 🎨", "info");
};

window.showToast = function(msg, type='info') {
    const box = document.getElementById('toast-container');
    if(!box) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerText = msg;
    box.appendChild(t);
    setTimeout(() => { t.style.opacity='1'; }, 10);
    setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),500); }, 3000);
};

window.alert = function(m) { showToast(m); };
window.closePopup = function() { document.getElementById('site-notification').style.display='none'; };

window.toggleTheme = function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('site_theme', isDark ? 'dark' : 'light');
};
