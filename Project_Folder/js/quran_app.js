// js/quran_app.js - المصحف (النسخة النهائية: السكرول الداخلي + التحميل المسبق)

let fullQuranData = null; 
let isQuranLoading = false; 

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
        console.warn("فشل التحميل المسبق، سيتم المحاولة لاحقاً عند الفتح.", e);
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
    
    // ارتفاع مبدئي للانميشن
    container.style.maxHeight = "800px"; // لا نحتاج لارتفاع لانهائي الآن بسبب السكرول الداخلي

    // ج. التحقق من البيانات
    if (fullQuranData) {
        renderSurahGrid(); 
        // تحديث الارتفاع ليناسب المحتوى (سواء الفهرس أو القراءة)
        setTimeout(() => { 
            // جعل الارتفاع مرناً ولكن ليس لانهائياً، ليسمح بظهور السكرول الداخلي
            // سنعتمد على scrollHeight لضمان ظهور الصندوق كاملاً
            container.style.maxHeight = container.scrollHeight + 50 + "px"; 
        }, 200);
        return;
    }

    // د. التحميل (في حال فشل التحميل المسبق)
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

// 5. القراءة (تم التعديل ليتناسب مع السكرول الداخلي)
function loadSurah(surahIndex) {
    if(!fullQuranData) return;
    
    const surahData = fullQuranData[surahIndex.toString()];
    if(!surahData) return;

    document.getElementById('surah-grid').style.display = 'none';
    document.getElementById('reading-area').style.display = 'block';
    
    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'none';
    
    document.getElementById('current-surah-title').innerText = `سورة ${surahData.name}`;
    
    // --- [تعديل هام] ---
    // لم نعد بحاجة لإلغاء max-height لأننا نستخدم overflow-y: auto في CSS
    // لكن نحتاج لتحديث ارتفاع الكونتينر الأب فقط ليستوعب صندوق القراءة الجديد
    const container = document.getElementById('quran-app-container');
    if(container) {
         // نعطيه وقتاً بسيطاً ليحسب الارتفاع الجديد مع السكرول
         setTimeout(() => {
             container.style.maxHeight = container.scrollHeight + 50 + "px";
         }, 50);
    }
    // -------------------

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
    
    // التمرير لأعلى *داخل الصندوق* وليس الصفحة كاملة
    // بما أن السكرول في contentDiv، فالأمر scrollTo يعمل عليه
    // لكننا نستخدم scrollIntoView للعنصر، وهو يعمل بشكل تلقائي
    const readingArea = document.getElementById('reading-area');
    if(readingArea) readingArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeReading() {
    document.getElementById('reading-area').style.display = 'none';
    document.getElementById('surah-grid').style.display = 'grid';
    
    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'flex';
    
    // تحديث الارتفاع ليعود لحجم الفهرس
    const container = document.getElementById('quran-app-container');
    if(container) {
        // تأخير بسيط جداً لضمان اختفاء منطقة القراءة وحساب ارتفاع الفهرس
        setTimeout(() => {
            container.style.maxHeight = container.scrollHeight + 50 + "px";
        }, 50);
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
