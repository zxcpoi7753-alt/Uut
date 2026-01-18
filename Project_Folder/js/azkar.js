// js/azkar.js - (محدث: لون موحد + انتقال تلقائي)

let allAzkarData = [];
let resetSetting = localStorage.getItem('azkarResetPeriod') || '24'; 
let lastResetDate = localStorage.getItem('azkarLastResetDate');

document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('reset-period-select');
    if(select) select.value = resetSetting;
    checkAutoReset(); 
    preloadAzkar(); 
});

// 1. التحميل المسبق
async function preloadAzkar() {
    try {
        let response;
        try { response = await fetch('azkar.json'); if (!response.ok) throw new Error(); }
        catch { response = await fetch('js/azkar.json'); }

        if (response && response.ok) {
            allAzkarData = await response.json();
        }
    } catch (e) { console.warn("انتظار التحميل عند الفتح..."); }
}

// 2. فتح القائمة
async function loadAzkarCategories() {
    const container = document.getElementById('azkar-app-container');
    const btn = document.querySelector('.accordion-btn[onclick="loadAzkarCategories()"]');
    
    if (container.classList.contains('active-panel')) {
        container.style.maxHeight = null;
        container.classList.remove('active-panel');
        if(btn) btn.classList.remove('active-acc');
        return;
    } else {
        container.style.display = 'block';
        container.classList.add('active-panel');
        if(btn) btn.classList.add('active-acc');
        container.style.maxHeight = "800px"; // زدنا الارتفاع قليلاً
    }

    if(allAzkarData.length === 0) {
        try {
            let response;
            try { response = await fetch('azkar.json'); if(!response.ok) throw new Error(); }
            catch { response = await fetch('js/azkar.json'); }
            allAzkarData = await response.json();
        } catch(e) {
            document.getElementById('azkar-categories-grid').innerHTML = '<div style="color:red; text-align:center;">ملف azkar.json مفقود!</div>';
            return;
        }
    }
    
    renderAzkarCategories();
    // تحديث الارتفاع
    setTimeout(() => {
        const h = container.scrollHeight;
        container.style.maxHeight = (h + 50) + "px";
    }, 100);
}

// 3. رسم الأزرار
function renderAzkarCategories() {
    const grid = document.getElementById('azkar-categories-grid');
    grid.innerHTML = "";

    const targetKeywords = ["الصباح", "المساء", "النوم", "الاستيقاظ", "المسجد", "الصلاة"];
    const uniqueCategories = [...new Set(allAzkarData.map(item => item.category))];
    const filteredCategories = uniqueCategories.filter(cat => 
        targetKeywords.some(keyword => cat.includes(keyword))
    );

    filteredCategories.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = 'calc-btn-option';
        let icon = "📿";
        if(cat.includes("الصباح")) icon = "☀️";
        else if(cat.includes("المساء")) icon = "🌙";
        else if(cat.includes("النوم")) icon = "🛌";
        else if(cat.includes("الاستيقاظ")) icon = "🌅";
        else if(cat.includes("المسجد")) icon = "🕌";
        else if(cat.includes("الصلاة")) icon = "🧎";

        btn.innerHTML = `<div style="font-size:1.5rem; margin-bottom:5px;">${icon}</div>${cat}`;
        btn.onclick = () => showAzkarList(cat);
        grid.appendChild(btn);
    });

    // --- زر السبحة (تم توحيد اللون) ---
    const subhaBtn = document.createElement('div');
    subhaBtn.className = 'calc-btn-option'; 
    // حذفنا التنسيقات الخاصة ليصبح مثل إخوته تماماً
    subhaBtn.innerHTML = `<div style="font-size:1.5rem; margin-bottom:5px;">⏱️</div>السبحة الإلكترونية`;
    subhaBtn.onclick = () => showSubhaInterface();
    grid.appendChild(subhaBtn);
}

// 4. عرض القائمة
function showAzkarList(category) {
    document.getElementById('azkar-categories-grid').style.display = 'none';
    const listContainer = document.getElementById('azkar-list-container');
    listContainer.style.display = 'block';
    
    document.getElementById('azkar-category-title').innerText = category;
    
    const itemsDiv = document.getElementById('azkar-items-list');
    itemsDiv.innerHTML = "";

    const zekrList = allAzkarData.filter(item => item.category === category);

    zekrList.forEach((item, index) => {
        const count = item.count ? parseInt(item.count) : 1;
        const storageKey = `zekr_${category}_${index}`;
        const savedCount = localStorage.getItem(storageKey);
        const currentCount = savedCount !== null ? parseInt(savedCount) : count;
        const isCompleted = currentCount <= 0;

        const card = document.createElement('div');
        card.className = 'azkar-card';
        card.innerHTML = `
            <div class="azkar-text">${item.zekr.replace(/\\n/g, '<br>')}</div>
            ${item.description ? `<div class="azkar-meta">💡 ${item.description}</div>` : ''}
            <button class="azkar-counter-btn ${isCompleted ? 'completed' : ''}" 
                    id="btn-${storageKey}" 
                    onclick="updateZekrCounter(this, '${storageKey}', ${count})">
                <span>${isCompleted ? '✅ تم' : currentCount}</span> ${!isCompleted ? '👈 اضغط' : ''}
            </button>
        `;
        itemsDiv.appendChild(card);
    });

    resizeContainer();
    listContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 5. عداد الأذكار
function updateZekrCounter(btn, key, originalTotal) {
    if(btn.classList.contains('completed')) return;

    let current = parseInt(btn.querySelector('span').innerText);
    if (current > 1) {
        current--;
        btn.querySelector('span').innerText = current;
        localStorage.setItem(key, current);
        btn.style.transform = "scale(0.95)";
        setTimeout(() => btn.style.transform = "scale(1)", 100);
    } else {
        btn.innerHTML = "✅ تم الانتهاء";
        btn.classList.add('completed');
        localStorage.setItem(key, 0);
        if (navigator.vibrate) navigator.vibrate(50);
    }
}

function resetCategoryCounters() {
    const catTitle = document.getElementById('azkar-category-title').innerText;
    Object.keys(localStorage).forEach(k => {
        if(k.startsWith(`zekr_${catTitle}`)) localStorage.removeItem(k);
    });
    showAzkarList(catTitle);
    if(window.showToast) window.showToast("تم تصفير القسم", "success");
}

// 6. واجهة السبحة الإلكترونية
let currentTasbeehName = "تسبيح حر";
let currentTasbeehCount = 0;

function showSubhaInterface() {
    document.getElementById('azkar-categories-grid').style.display = 'none';
    const subhaInterface = document.getElementById('subha-interface');
    subhaInterface.style.display = 'block';
    
    const savedName = localStorage.getItem('subha_last_name');
    if(savedName) setTasbeeh(savedName, false); 
    else setTasbeeh("سبحان الله");
    
    resizeContainer();

    // 🔥 ميزة الانتقال التلقائي (Scroll)
    setTimeout(() => {
        subhaInterface.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function setTasbeeh(name, reset = true) {
    currentTasbeehName = name;
    document.getElementById('current-tasbeeh-label').innerText = name;
    
    // تلوين الزر المختار
    document.querySelectorAll('.tasbeeh-btn-small').forEach(btn => {
        if(btn.innerText.includes(name)) {
            btn.style.backgroundColor = "var(--primary-color)";
            btn.style.color = "white";
        } else {
            btn.style.backgroundColor = ""; // Reset
            btn.style.color = "";
        }
    });
    
    if(reset) {
        const saved = localStorage.getItem(`subha_count_${name}`);
        currentTasbeehCount = saved ? parseInt(saved) : 0;
    } else {
        const savedTotal = localStorage.getItem('subha_last_count');
        currentTasbeehCount = savedTotal ? parseInt(savedTotal) : 0;
    }
    
    updateSubhaDisplay();
    localStorage.setItem('subha_last_name', name);
}

function subhaAction(action) {
    if(action === 'count') {
        currentTasbeehCount++;
        if(navigator.vibrate) navigator.vibrate(30);
    } else if (action === 'undo') {
        if(currentTasbeehCount > 0) currentTasbeehCount--;
    } else if (action === 'reset') {
        currentTasbeehCount = 0;
        if(navigator.vibrate) navigator.vibrate(50); 
        if(window.showToast) window.showToast("تم التصفير", "success");
    }

    updateSubhaDisplay();
    localStorage.setItem(`subha_count_${currentTasbeehName}`, currentTasbeehCount);
    localStorage.setItem('subha_last_count', currentTasbeehCount);
}

function updateSubhaDisplay() {
    document.getElementById('main-tasbeeh-counter').innerText = currentTasbeehCount;
    const btn = document.getElementById('big-tap-btn');
    btn.style.transform = "scale(0.98)";
    setTimeout(() => btn.style.transform = "scale(1)", 100);
}

// 7. أدوات مساعدة
function backToAzkarCategories() {
    document.getElementById('azkar-list-container').style.display = 'none';
    document.getElementById('subha-interface').style.display = 'none';
    document.getElementById('azkar-categories-grid').style.display = 'grid';
    resizeContainer();
}

function resizeContainer() {
    const container = document.getElementById('azkar-app-container');
    // إضافة وقت إضافي للسماح للرسم
    setTimeout(() => container.style.maxHeight = container.scrollHeight + 100 + "px", 50);
}

// 8. التصفير التلقائي
function saveResetSetting() {
    const val = document.getElementById('reset-period-select').value;
    localStorage.setItem('azkarResetPeriod', val);
    resetSetting = val;
    if(window.showToast) window.showToast("تم حفظ الإعداد", "success");
}

function checkAutoReset() {
    if(resetSetting === 'manual') return;

    const now = new Date().getTime();
    const last = lastResetDate ? parseInt(lastResetDate) : 0;
    const hoursPassed = (now - last) / (1000 * 60 * 60);
    const threshold = parseInt(resetSetting); 

    if(hoursPassed >= threshold) {
        Object.keys(localStorage).forEach(key => {
            if(key.startsWith('zekr_')) localStorage.removeItem(key);
        });
        localStorage.setItem('azkarLastResetDate', now);
    }
}
