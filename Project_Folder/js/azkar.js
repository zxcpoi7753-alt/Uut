/* ============================================================
   ملف: js/azkar.js (V30 - تصميم الأذكار والسبحة الأصلي)
   الوظيفة: إدارة عدادات الأذكار والسبحة التفاعلية
   ============================================================ */

let azkarData = null;
let currentSubhaCount = parseInt(localStorage.getItem('subha_count')) || 0;
let lastSubhaCount = currentSubhaCount;
let currentSubhaType = localStorage.getItem('subha_type') || "سبحان الله";

// 1. تحميل تصنيفات الأذكار
window.loadAzkarCategories = async function() {
    const grid = document.getElementById('azkar-categories-grid');
    if (!grid) return;

    // تحميل ملف الأذكار إذا لم يحمل بعد
    if (!azkarData) {
        try {
            const res = await fetch('azkar.json');
            azkarData = await res.json();
        } catch (e) {
            console.error("خطأ في تحميل azkar.json");
            return;
        }
    }

    grid.innerHTML = '';
    document.getElementById('azkar-list-container').style.display = 'none';
    grid.style.display = 'grid';

    // إضافة زر السبحة كأول خيار
    const subhaBtn = document.createElement('button');
    subhaBtn.className = 'nav-btn active';
    subhaBtn.style.background = 'linear-gradient(135deg, #047857, #065f46)';
    subhaBtn.innerHTML = '📿 السبحة الإلكترونية';
    subhaBtn.onclick = openSubha;
    grid.appendChild(subhaBtn);

    // إضافة بقية التصنيفات من الـ JSON
    Object.keys(azkarData).forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.innerText = cat;
        btn.onclick = () => displayAzkarList(cat);
        grid.appendChild(btn);
    });
};

// 2. عرض قائمة الأذكار داخل التصنيف
function displayAzkarList(category) {
    const grid = document.getElementById('azkar-categories-grid');
    const container = document.getElementById('azkar-list-container');
    const list = document.getElementById('azkar-items-list');

    grid.style.display = 'none';
    container.style.display = 'block';
    list.innerHTML = `<h3 style="text-align:center; color:var(--primary-color)">${category}</h3>`;

    azkarData[category].forEach((zkr, index) => {
        const card = document.createElement('div');
        card.className = 'azkar-card';
        card.id = `zkr-${index}`;
        
        // القيمة الحالية للعداد (تبدأ من العدد الأصلي)
        let count = parseInt(zkr.count) || 1;

        card.innerHTML = `
            <p class="azkar-text">${zkr.content}</p>
            <div class="azkar-counter-box">
                <span class="count-num">${count}</span>
            </div>
            ${zkr.description ? `<small class="azkar-desc">${zkr.description}</small>` : ''}
        `;

        card.onclick = function() {
            if (count > 0) {
                count--;
                card.querySelector('.count-num').innerText = count;
                
                // تفاعل الاهتزاز (Haptic Feedback)
                if (navigator.vibrate) navigator.vibrate(20);

                if (count === 0) {
                    card.classList.add('completed');
                    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                }
            }
        };

        list.appendChild(card);
    });
}

// 3. نظام السبحة الإلكترونية الأصلي
function openSubha() {
    const grid = document.getElementById('azkar-categories-grid');
    const subhaArea = document.getElementById('subha-interface');

    grid.style.display = 'none';
    subhaArea.style.display = 'flex';
    subhaArea.className = 'subha-wrapper';

    subhaArea.innerHTML = `
        <div class="subha-header">
            <button onclick="backToAzkarCategories()" class="nav-btn">🔙 عودة</button>
            <h3 style="margin:0;">السبحة الإلكترونية</h3>
        </div>

        <div class="subha-type-selector">
            <button class="type-btn ${currentSubhaType==='سبحان الله'?'active':''}" onclick="setSubhaType('سبحان الله', this)">سبحان الله</button>
            <button class="type-btn ${currentSubhaType==='الحمد لله'?'active':''}" onclick="setSubhaType('الحمد لله', this)">الحمد لله</button>
            <button class="type-btn ${currentSubhaType==='الله أكبر'?'active':''}" onclick="setSubhaType('الله أكبر', this)">الله أكبر</button>
            <button class="type-btn ${currentSubhaType==='لا إله إلا الله'?'active':''}" onclick="setSubhaType('لا إله إلا الله', this)">لا إله إلا الله</button>
        </div>

        <div class="subha-main-circle" onclick="incrementSubha()">
            <div class="subha-count-display">${currentSubhaCount}</div>
            <div class="subha-label">${currentSubhaType}</div>
        </div>

        <div class="subha-controls">
            <button class="control-btn undo" onclick="undoSubha()" title="تراجع">🔙</button>
            <button class="control-btn reset" onclick="resetSubha()" title="تصفير">🔄</button>
        </div>
    `;
}

window.incrementSubha = function() {
    lastSubhaCount = currentSubhaCount;
    currentSubhaCount++;
    updateSubhaUI();
    if (navigator.vibrate) navigator.vibrate(30);
};

window.undoSubha = function() {
    currentSubhaCount = lastSubhaCount;
    updateSubhaUI();
};

window.resetSubha = function() {
    if(confirm("هل تريد تصفير العداد؟")) {
        lastSubhaCount = currentSubhaCount;
        currentSubhaCount = 0;
        updateSubhaUI();
    }
};

window.setSubhaType = function(type, btn) {
    currentSubhaType = type;
    localStorage.setItem('subha_type', type);
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector('.subha-label').innerText = type;
};

function updateSubhaUI() {
    const display = document.querySelector('.subha-count-display');
    if (display) display.innerText = currentSubhaCount;
    localStorage.setItem('subha_count', currentSubhaCount);
}

window.backToAzkarCategories = function() {
    document.getElementById('azkar-list-container').style.display = 'none';
    document.getElementById('subha-interface').style.display = 'none';
    document.getElementById('azkar-categories-grid').style.display = 'grid';
};
