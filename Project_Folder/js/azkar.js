// js/azkar.js - نظام الأذكار (التحميل المسبق الفوري)

let allAzkarData = [];

// 1. دالة التحميل المسبق (تعمل تلقائياً عند فتح الموقع)
async function preloadAzkar() {
    try {
        let response;
        // محاولة 1: البحث في المجلد الرئيسي (المكان الصحيح)
        try {
            response = await fetch('azkar.json');
            if (!response.ok) throw new Error("Not in root");
        } catch (e1) {
            // محاولة 2: البحث داخل مجلد js (احتياطي)
            try {
                response = await fetch('js/azkar.json');
            } catch (e2) { return; } // فشل صامت
        }

        if (response && response.ok) {
            allAzkarData = await response.json();
            console.log("تم تحميل الأذكار في الخلفية بنجاح ✅");
        }
    } catch (e) {
        // لا نزعج المستخدم بأخطاء في الخلفية
        console.warn("فشل التحميل المسبق للأذكار");
    }
}

// استدعاء التحميل فوراً
preloadAzkar();


// 2. دالة فتح القائمة وعرض الأقسام
async function loadAzkarCategories() {
    const grid = document.getElementById('azkar-categories-grid');
    const container = document.getElementById('azkar-app-container');
    
    // منطق الفتح والإغلاق (Accordion)
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
        container.style.maxHeight = "500px"; // ارتفاع مبدئي للحركة
    }

    // ✅ السيناريو الأفضل: البيانات تحملت مسبقاً
    if(allAzkarData.length > 0) {
        renderAzkarCategories();
        setTimeout(() => container.style.maxHeight = container.scrollHeight + "px", 100);
        return;
    }

    // ⚠️ السيناريو البديل: إذا فشل التحميل المسبق، نحاول التحميل الآن
    try {
        grid.innerHTML = '<div style="text-align:center; grid-column:1/-1; color:var(--primary-color);">⏳ جاري تحميل الأذكار...</div>';
        
        let response;
        try { response = await fetch('azkar.json'); if(!response.ok) throw new Error(); }
        catch { response = await fetch('js/azkar.json'); }

        if(!response.ok) throw new Error("الملف غير موجود");
        
        const data = await response.json();
        allAzkarData = data;
        
        renderAzkarCategories();
        setTimeout(() => container.style.maxHeight = container.scrollHeight + "px", 100);
        
    } catch (e) {
        grid.innerHTML = `<div style="color:red; text-align:center; grid-column:1/-1; padding:10px;">
            ⚠️ لم يتم العثور على ملف الأذكار (azkar.json)
        </div>`;
    }
}

// 3. رسم أزرار الأقسام (الفلترة)
function renderAzkarCategories() {
    const grid = document.getElementById('azkar-categories-grid');
    grid.innerHTML = "";

    const targetKeywords = ["الصباح", "المساء", "النوم", "الاستيقاظ", "المسجد", "الصلاة"];
    
    const uniqueCategories = [...new Set(allAzkarData.map(item => item.category))];
    const filteredCategories = uniqueCategories.filter(cat => 
        targetKeywords.some(keyword => cat.includes(keyword))
    );

    if(filteredCategories.length === 0) {
        grid.innerHTML = "<div>لا توجد أذكار مطابقة للتصنيفات المطلوبة.</div>";
        return;
    }

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
}

// 4. عرض قائمة الأذكار لقسم معين
function showAzkarList(category) {
    document.getElementById('azkar-categories-grid').style.display = 'none';
    const listContainer = document.getElementById('azkar-list-container');
    listContainer.style.display = 'block';
    
    document.getElementById('azkar-category-title').innerText = category;
    
    const itemsDiv = document.getElementById('azkar-items-list');
    itemsDiv.innerHTML = "";

    const zekrList = allAzkarData.filter(item => item.category === category);

    zekrList.forEach((item, index) => {
        const cleanZekr = item.zekr.replace(/\\n/g, '<br>').replace(/\\"/g, '"');
        const cleanDesc = item.description ? item.description.replace(/\\n/g, ' ') : '';
        const count = item.count ? parseInt(item.count) : 1;

        const card = document.createElement('div');
        card.className = 'azkar-card';
        card.innerHTML = `
            <div class="azkar-text">${cleanZekr}</div>
            ${cleanDesc ? `<div class="azkar-meta">💡 ${cleanDesc}</div>` : ''}
            <button class="azkar-counter-btn" id="zekr-btn-${index}" onclick="updateZekrCounter(this, ${count})">
                <span>${count}</span> 👈 اضغط للعد
            </button>
        `;
        itemsDiv.appendChild(card);
    });

    const container = document.getElementById('azkar-app-container');
    setTimeout(() => {
        container.style.maxHeight = container.scrollHeight + "px";
        listContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// 5. العودة للقائمة الرئيسية
function backToAzkarCategories() {
    document.getElementById('azkar-list-container').style.display = 'none';
    document.getElementById('azkar-categories-grid').style.display = 'grid';
    
    const container = document.getElementById('azkar-app-container');
    setTimeout(() => container.style.maxHeight = container.scrollHeight + "px", 50);
}

// 6. منطق العداد
function updateZekrCounter(btn, originalCount) {
    if(btn.classList.contains('completed')) return;

    let current = parseInt(btn.querySelector('span').innerText);
    
    if (current > 1) {
        current--;
        btn.querySelector('span').innerText = current;
        btn.style.transform = "scale(0.95)";
        setTimeout(() => btn.style.transform = "scale(1)", 100);
    } else {
        btn.innerHTML = "✅ تم الانتهاء";
        btn.classList.add('completed');
        if (navigator.vibrate) navigator.vibrate(50);
    }
}
