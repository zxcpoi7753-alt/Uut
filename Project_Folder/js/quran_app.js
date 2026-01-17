// js/quran_app.js - المصحف (النسخة النهائية: خط + تلميحات + حدود التكبير)

let fullQuranData = null; 
let isQuranLoading = false; 
let currentFontSize = 1.3; // حجم الخط الافتراضي (rem)

// 1. دالة التحميل المسبق
async function preloadQuranData() {
    if (fullQuranData || isQuranLoading) return; 
    
    isQuranLoading = true;
    try {
        const response = await fetch('quran.json');
        if(!response.ok) throw new Error("فشل التحميل المسبق");
        fullQuranData = await response.json();
        renderSurahGrid();
        console.log("تم تحميل بيانات المصحف في الخلفية بنجاح ✅");
    } catch (e) {
        console.warn("فشل التحميل المسبق.", e);
    } finally {
        isQuranLoading = false;
    }
}

// 2. دالة فتح تطبيق المصحف
async function openQuranApp() {
    const container = document.getElementById('quran-app-container');
    const btn = document.querySelector('.accordion-btn[onclick="openQuranApp()"]');

    // أ. الإغلاق الانسيابي
    if (container.classList.contains('active-panel')) {
        container.style.maxHeight = container.scrollHeight + "px"; // تثبيت الارتفاع
        setTimeout(() => {
            container.style.maxHeight = null; // إغلاق
            container.classList.remove('active-panel');
            if(btn) btn.classList.remove('active-acc');
        }, 10);
        return; 
    }

    // ب. الفتح
    container.style.display = 'block';
    container.classList.add('active-panel');
    if(btn) btn.classList.add('active-acc');
    
    container.style.maxHeight = "800px"; // ارتفاع مبدئي

    // ج. التحقق من البيانات
    if (fullQuranData) {
        renderSurahGrid(); 
        setTimeout(() => { 
            container.style.maxHeight = container.scrollHeight + 50 + "px"; 
        }, 200);
        return;
    }

    // د. التحميل (إذا لم يحمل مسبقاً)
    const grid = document.getElementById('surah-grid');
    try {
        if(grid) grid.innerHTML = '<div style="text-align:center; padding:20px; color:var(--primary-color);">⏳ جاري تحميل المصحف...</div>';

        isQuranLoading = true;
        const response = await fetch('quran.json');
        if(!response.ok) throw new Error(`Status: ${response.status}`);
        
        fullQuranData = await response.json();
        renderSurahGrid(); 
        setTimeout(() => { container.style.maxHeight = container.scrollHeight + 50 + "px"; }, 100);
        if(window.showToast) window.showToast("تم تحميل المصحف", "success");
        
    } catch (error) {
        console.error(error);
        if(grid) grid.innerHTML = `<div style="color:red; text-align:center; padding:15px;">خطأ: ${error.message}</div>`;
    } finally {
        isQuranLoading = false;
    }
}

// 3. التحكم في حجم الخط (معدل مع تنبيهات)
function changeFontSize(step) {
    // التحقق من الحدود قبل التغيير
    if (step > 0 && currentFontSize >= 3.0) {
        if(window.showToast) window.showToast("⚠️ وصلت لأكبر حجم للخط", "info");
        return;
    }
    if (step < 0 && currentFontSize <= 0.8) {
         if(window.showToast) window.showToast("⚠️ وصلت لأصغر حجم للخط", "info");
         return;
    }

    currentFontSize += (step * 0.1); 
    
    // تأكيد الحدود رقمياً
    if(currentFontSize < 0.8) currentFontSize = 0.8;
    if(currentFontSize > 3.0) currentFontSize = 3.0;

    const textDiv = document.getElementById('quran-text-display');
    if(textDiv) {
        textDiv.style.fontSize = currentFontSize + "rem";
    }
}

// 4. رسم شبكة السور
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

// 5. البحث
function filterSurahs() {
    const query = document.getElementById('quran-search').value;
    renderSurahGrid(query);
}

// 6. القراءة
function loadSurah(surahIndex) {
    if(!fullQuranData) return;
    
    const surahData = fullQuranData[surahIndex.toString()];
    if(!surahData) return;

    document.getElementById('surah-grid').style.display = 'none';
    document.getElementById('reading-area').style.display = 'block';
    
    // إظهار تلميح الحفظ
    const tip = document.getElementById('bookmark-tip');
    if(tip) tip.style.display = 'block';

    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'none';
    
    document.getElementById('current-surah-title').innerText = `سورة ${surahData.name}`;
    
    // تحديث ارتفاع الحاوية
    const container = document.getElementById('quran-app-container');
    if(container) {
         setTimeout(() => {
             container.style.maxHeight = container.scrollHeight + 50 + "px";
         }, 50);
    }

    const contentDiv = document.getElementById('quran-text-display');
    contentDiv.innerHTML = "";
    // تطبيق حجم الخط الحالي
    contentDiv.style.fontSize = currentFontSize + "rem";

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
    
    // تمرير ناعم
    const readingArea = document.getElementById('reading-area');
    if(readingArea) readingArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeReading() {
    document.getElementById('reading-area').style.display = 'none';
    document.getElementById('surah-grid').style.display = 'grid';
    
    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'flex';
    
    const container = document.getElementById('quran-app-container');
    if(container) {
        setTimeout(() => {
            container.style.maxHeight = container.scrollHeight + 50 + "px";
        }, 50);
    }
}

// 7. الحفظ والمنبه والدعاء
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
