// js/azkar.js - نظام الأذكار الذكي

let allAzkarData = [];

// 1. تحميل الأقسام (عند فتح القائمة)
async function loadAzkarCategories() {
    const grid = document.getElementById('azkar-categories-grid');
    const container = document.getElementById('azkar-app-container');
    
    // فتح القائمة (Accordion Logic)
    const btn = document.querySelector('.accordion-btn[onclick="loadAzkarCategories()"]');
    if (container.classList.contains('active-panel')) {
        // إغلاق
        container.style.maxHeight = null;
        container.classList.remove('active-panel');
        if(btn) btn.classList.remove('active-acc');
        return;
    } else {
        // فتح
        container.style.display = 'block';
        container.classList.add('active-panel');
        if(btn) btn.classList.add('active-acc');
        // ارتفاع مبدئي
        container.style.maxHeight = "500px";
    }

    // إذا كانت البيانات محملة مسبقاً، لا داعي للتحميل مرة أخرى
    if(allAzkarData.length > 0) {
        setTimeout(() => container.style.maxHeight = container.scrollHeight + "px", 100);
        return;
    }

    // بدء التحميل
    try {
        grid.innerHTML = '<div style="text-align:center; grid-column:1/-1; color:var(--primary-color);">⏳ جاري تحميل الأذكار...</div>';
        
        const response = await fetch('azkar.json');
        if(!response.ok) throw new Error("فشل العثور على ملف الأذكار");
        
        const data = await response.json();
        allAzkarData = data;
        
        renderAzkarCategories();
        
        // تحديث الارتفاع بعد الرسم
        setTimeout(() => container.style.maxHeight = container.scrollHeight + "px", 100);
        
    } catch (e) {
        console.error(e);
        grid.innerHTML = `<div style="color:red; text-align:center; grid-column:1/-1;">عذراً، لم يتم العثور على ملف azkar.json<br><small>${e.message}</small></div>`;
    }
}

// 2. رسم أزرار الأقسام (الفلترة)
function renderAzkarCategories() {
    const grid = document.getElementById('azkar-categories-grid');
    grid.innerHTML = "";

    // الكلمات المفتاحية للأقسام الـ 6 المطلوبة
    const targetKeywords = ["الصباح", "المساء", "النوم", "الاستيقاظ", "المسجد", "الصلاة"];
    
    // استخراج أسماء الأقسام الموجودة في الملف والتي تحتوي على الكلمات المفتاحية
    const uniqueCategories = [...new Set(allAzkarData.map(item => item.category))];
    
    // فلترة الأقسام
    const filteredCategories = uniqueCategories.filter(cat => 
        targetKeywords.some(keyword => cat.includes(keyword))
    );

    if(filteredCategories.length === 0) {
        grid.innerHTML = "<div>لا توجد أذكار مطابقة للتصنيفات المطلوبة.</div>";
        return;
    }

    filteredCategories.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = 'calc-btn-option'; // نستخدم نفس ستايل الأزرار الموجود
        
        // إضافة أيقونة مناسبة حسب الاسم
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

// 3. عرض قائمة الأذكار لقسم معين
function showAzkarList(category) {
    // إخفاء الشبكة وإظهار القائمة
    document.getElementById('azkar-categories-grid').style.display = 'none';
    const listContainer = document.getElementById('azkar-list-container');
    listContainer.style.display = 'block';
    
    // وضع العنوان
    document.getElementById('azkar-category-title').innerText = category;
    
    const itemsDiv = document.getElementById('azkar-items-list');
    itemsDiv.innerHTML = "";

    // جلب الأذكار التابعة لهذا القسم
    const zekrList = allAzkarData.filter(item => item.category === category);

    zekrList.forEach((item, index) => {
        // تنظيف النص من أي رموز غريبة إن وجدت
        const cleanZekr = item.zekr.replace(/\\n/g, '<br>').replace(/\\"/g, '"');
        const cleanDesc = item.description ? item.description.replace(/\\n/g, ' ') : '';
        // تحديد العدد (الافتراضي 1 إذا لم يوجد)
        const count = item.count ? parseInt(item.count) : 1;
        const countText = count > 1 ? `التكرار: ${count}` : "مرة واحدة";

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

    // تحديث ارتفاع الحاوية
    const container = document.getElementById('azkar-app-container');
    // نعطي مهلة بسيطة ليرسم المتصفح البطاقات ثم نحسب الطول
    setTimeout(() => {
        container.style.maxHeight = container.scrollHeight + "px";
        // التمرير لأعلى القائمة
        listContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// 4. العودة للقائمة الرئيسية
function backToAzkarCategories() {
    document.getElementById('azkar-list-container').style.display = 'none';
    document.getElementById('azkar-categories-grid').style.display = 'grid';
    
    // تحديث الارتفاع
    const container = document.getElementById('azkar-app-container');
    setTimeout(() => container.style.maxHeight = container.scrollHeight + "px", 50);
}

// 5. منطق العداد
function updateZekrCounter(btn, originalCount) {
    if(btn.classList.contains('completed')) return; // انتهى بالفعل

    // نأخذ الرقم الحالي من النص داخل الزر
    let current = parseInt(btn.querySelector('span').innerText);
    
    if (current > 1) {
        current--;
        btn.querySelector('span').innerText = current;
        // تأثير بصري بسيط عند الضغط
        btn.style.transform = "scale(0.95)";
        setTimeout(() => btn.style.transform = "scale(1)", 100);
    } else {
        // انتهى العد
        btn.innerHTML = "✅ تم الانتهاء";
        btn.classList.add('completed');
        
        // تشغيل اهتزاز خفيف للهاتف (إذا كان مدعوماً)
        if (navigator.vibrate) navigator.vibrate(50);
    }
}
