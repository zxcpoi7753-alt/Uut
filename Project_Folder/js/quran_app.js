// js/quran_app.js - المصحف (النسخة النهائية: تحميل مسبق + انسيابية الحركة)

let fullQuranData = null; 
let isQuranLoading = false; // لمنع تكرار طلب التحميل في نفس اللحظة

// 1. دالة التحميل المسبق (تعمل في الخلفية عند دخول القسم)
async function preloadQuranData() {
    if (fullQuranData || isQuranLoading) return; // إذا كان محملاً أو جاري التحميل، لا تفعل شيئاً
    
    isQuranLoading = true;
    try {
        const response = await fetch('quran.json');
        if(!response.ok) throw new Error("فشل التحميل المسبق");
        fullQuranData = await response.json();
        // عند الانتهاء، نقوم برسم الشبكة فوراً لتكون جاهزة
        renderSurahGrid();
        console.log("تم تحميل بيانات المصحف في الخلفية بنجاح ✅");
    } catch (e) {
        console.warn("فشل التحميل المسبق، سيتم المحاولة لاحقاً عند الفتح.", e);
    } finally {
        isQuranLoading = false;
    }
}

// 2. دالة فتح تطبيق المصحف (زر الواجهة)
async function openQuranApp() {
    const container = document.getElementById('quran-app-container');
    const btn = document.querySelector('.accordion-btn[onclick="openQuranApp()"]');

    // أ. الإغلاق الانسيابي (إصلاح مشكلة الطوي)
    if (container.classList.contains('active-panel')) {
        // 1. قبل الإغلاق، نثبت الارتفاع الحالي بالأرقام بدلاً من 'none'
        // ليتمكن المتصفح من عمل الانميشن تنازلياً
        container.style.maxHeight = container.scrollHeight + "px";
        
        // 2. تأخير بسيط جداً للسماح للمتصفح بتطبيق الارتفاع الرقمي
        setTimeout(() => {
            container.style.maxHeight = null; // الآن نجعله null للإغلاق
            container.classList.remove('active-panel');
            if(btn) btn.classList.remove('active-acc');
        }, 10);
        
        return; 
    }

    // ب. الفتح
    container.style.display = 'block';
    container.classList.add('active-panel');
    if(btn) btn.classList.add('active-acc');
    
    // وضع ارتفاع مبدئي للانميشن
    container.style.maxHeight = "1000px";

    // ج. التحقق من البيانات
    if (fullQuranData) {
        renderSurahGrid(); 
        // تحديث الارتفاع ليناسب المحتوى
        setTimeout(() => { 
            // إذا كنا في وضع القراءة (والسورة طويلة)، نلغي القيد
            const readingArea = document.getElementById('reading-area');
            if(readingArea && readingArea.style.display === 'block') {
                container.style.maxHeight = 'none';
            } else {
                container.style.maxHeight = container.scrollHeight + 100 + "px"; 
            }
        }, 200);
        return;
    }

    // د. التحميل (في حال فشل التحميل المسبق فقط)
    const grid = document.getElementById('surah-grid');
    try {
        if(grid) grid.innerHTML = '<div style="text-align:center; padding:20px; color:var(--primary-color);">⏳ جاري تحميل المصحف...</div>';

        isQuranLoading = true;
        const response = await fetch('quran.json');
        if(!response.ok) throw new Error(`Status: ${response.status}`);
        
        fullQuranData = await response.json();
        
        renderSurahGrid(); 
        setTimeout(() => { container.style.maxHeight = container.scrollHeight + 100 + "px"; }, 100);
        if(window.showToast) window.showToast("تم تحميل المصحف", "success");
        
    } catch (error) {
        console.error(error);
        if(grid) grid.innerHTML = `<div style="color:red; text-align:center; padding:15px;">خطأ: ${error.message}</div>`;
    } finally {
        isQuranLoading = false;
    }
}

// 3. رسم شبكة السور
function renderSurahGrid(filter = "") {
    const grid = document.getElementById('surah-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    if(typeof SURAH_NAMES === 'undefined') return;

    SURAH_NAMES.forEach((name, index) => {
        if (index === 0) return;
        if (filter && !name.includes(filter)) return;

        const box = document.createElement('div');
        box.className = 'surah-box';
        box.innerHTML = `<span class="surah-number">${index}</span> ${name}`;
        box.onclick = () => loadSurah(index);
        grid.appendChild(box);
    });
}

// 4. البحث
function filterSurahs() {
    const query = document.getElementById('quran-search').value;
    renderSurahGrid(query);
}

// 5. القراءة (مع السماح بالتمدد الطويل)
function loadSurah(surahIndex) {
    if(!fullQuranData) return;
    
    const surahData = fullQuranData[surahIndex.toString()];
    if(!surahData) return;

    document.getElementById('surah-grid').style.display = 'none';
    document.getElementById('reading-area').style.display = 'block';
    
    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'none';
    
    document.getElementById('current-surah-title').innerText = `سورة ${surahData.name}`;
    
    // --- [السماح بالتمدد اللانهائي] ---
    const container = document.getElementById('quran-app-container');
    if(container) {
        container.style.maxHeight = 'none'; 
        container.style.overflow = 'visible';
    }

    const contentDiv = document.getElementById('quran-text-display');
    contentDiv.innerHTML = "";

    if(surahIndex !== 1 && surahIndex !== 9) {
        contentDiv.innerHTML += `<div style="text-align:center; margin-bottom:20px; font-size:1.3rem; color:var(--primary-color); font-family:'Amiri', serif;">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>`;
    }

    let fullText = "";
    surahData.ayahs.forEach(ayah => {
        fullText += `
            <span class="ayah-span" id="ayah-${surahIndex}-${ayah.num}">
                ${ayah.text} 
                <span class="quran-symbol">(${ayah.num})</span>
                <span class="bookmark-btn" onclick="saveBookmark(${surahIndex}, ${ayah.num})" title="حفظ الموضع">🔖</span>
            </span> 
        `;
    });
    contentDiv.innerHTML += fullText;
    
    document.getElementById('reading-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeReading() {
    document.getElementById('reading-area').style.display = 'none';
    document.getElementById('surah-grid').style.display = 'grid';
    
    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'flex';
    
    // إعادة ضبط الارتفاع ليكون محدوداً (بحجم الفهرس) لتعمل انسيابية الإغلاق
    const container = document.getElementById('quran-app-container');
    if(container) {
        container.style.maxHeight = container.scrollHeight + 100 + "px";
    }
}

// 6. الحفظ والمنبه والدعاء
function saveBookmark(surah, ayah) {
    localStorage.setItem('quranBookmark', JSON.stringify({ surah, ayah }));
    if(window.showToast) window.showToast(`تم حفظ: سورة ${SURAH_NAMES[surah]} - آية ${ayah}`, "success");
}

function goToBookmark() {
    const saved = localStorage.getItem('quranBookmark');
    if(!saved) {
        if(window.showToast) window.showToast("لم تحفظ أي موضع بعد", "info");
        return;
    }
    const { surah, ayah } = JSON.parse(saved);
    const jump = () => {
        loadSurah(surah);
        setTimeout(() => scrollToAyah(surah, ayah), 300);
    };

    if(fullQuranData) jump();
    else openQuranApp().then(() => setTimeout(() => { if(fullQuranData) jump(); }, 500));
}

function scrollToAyah(surah, ayah) {
    const el = document.getElementById(`ayah-${surah}-${ayah}`);
    if(el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.backgroundColor = "rgba(251, 191, 36, 0.4)";
        el.style.borderRadius = "5px";
        setTimeout(() => el.style.backgroundColor = "transparent", 2000);
    }
}

function setStudyAlarm() {
    const timeInput = document.getElementById('alarm-time').value;
    if(!timeInput) {
        if(window.showToast) window.showToast("اختر وقتاً أولاً", "error");
        return;
    }
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                localStorage.setItem('studyAlarm', timeInput);
                if(window.showToast) window.showToast(`تم الضبط على: ${timeInput}`, "success");
                if(!window.alarmInterval) checkAlarmLoop(timeInput);
            } else {
                alert("يجب السماح بالإشعارات.");
            }
        });
    } else {
        alert("متصفحك لا يدعم التنبيهات.");
    }
}

function checkAlarmLoop(time) {
    window.alarmInterval = setInterval(() => {
        const now = new Date();
        const current = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        if (current === time) {
            new Notification("حلقات الثريا", { body: "حان وقت وردك القرآني!", icon: "1768411699920.png" });
        }
    }, 60000);
}

function showDuaa() {
    alert("اللهم ارحمني بالقرآن واجعله لي إماماً ونوراً وهدىً ورحمة...");
}
