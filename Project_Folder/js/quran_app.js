// js/quran_app.js - المصحف (الجزء الأول: الفتح والتحميل)

let fullQuranData = null; 

// 1. دالة فتح تطبيق المصحف (تم إصلاح الزر + منع تكرار التحميل)
async function openQuranApp() {
    const container = document.getElementById('quran-app-container');
    const btn = document.querySelector('.accordion-btn[onclick="openQuranApp()"]'); // تحديد الزر لتفعيل التنسيق

    // أ. إصلاح مشكلة الزر: التحقق هل القائمة مفتوحة حالياً؟
    // إذا كانت مفتوحة، نقوم بإغلاقها ونخرج من الدالة
    if (container.classList.contains('active-panel') && container.style.maxHeight && container.style.maxHeight !== '0px') {
        container.style.maxHeight = null;
        container.classList.remove('active-panel');
        if(btn) btn.classList.remove('active-acc'); // إزالة تنسيق النشاط من الزر
        return; 
    }

    // ب. إذا كانت مغلقة، نقوم بفتحها
    container.style.display = 'block';
    container.classList.add('active-panel');
    if(btn) btn.classList.add('active-acc');
    
    // إعطاء ارتفاع مبدئي (سيتغير لاحقاً ليصبح لانهائي عند القراءة)
    container.style.maxHeight = "1000px"; 

    // ج. إصلاح تكرار التحميل: هل البيانات موجودة مسبقاً؟
    if (fullQuranData) {
        // البيانات موجودة في الذاكرة، اعرض القائمة فوراً دون انتظار
        renderSurahGrid(); 
        // نقوم بتحديث الارتفاع ليتناسب مع المحتوى الموجود
        setTimeout(() => { container.style.maxHeight = container.scrollHeight + 100 + "px"; }, 100);
        return;
    }

    // د. إذا كانت المرة الأولى فقط، نقوم بالتحميل
    const grid = document.getElementById('surah-grid');
    try {
        if(grid) grid.innerHTML = '<div style="text-align:center; padding:20px; color:var(--primary-color);">⏳ جاري تحميل بيانات المصحف لأول مرة...</div>';

        // تمت إزالة الرقم العشوائي (cacheBuster) ليحفظ المتصفح الملف
        const response = await fetch('quran.json');
        
        if(!response.ok) throw new Error(`فشل التحميل: ${response.status}`);
        
        fullQuranData = await response.json();
        
        renderSurahGrid(); 
        // تحديث الارتفاع بعد تحميل البيانات
        setTimeout(() => { container.style.maxHeight = container.scrollHeight + 100 + "px"; }, 100);
        
        if(window.showToast) window.showToast("تم تحميل المصحف بنجاح", "success");
        
    } catch (error) {
        console.error("خطأ المصحف:", error);
        if(grid) grid.innerHTML = `<div style="color:red; text-align:center; padding:15px;">خطأ في الملفات: ${error.message}</div>`;
    }
}

// 2. رسم شبكة السور
function renderSurahGrid(filter = "") {
    const grid = document.getElementById('surah-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    // التأكد من وجود مصفوفة الأسماء من ملف data.js
    if(typeof SURAH_NAMES === 'undefined') {
        grid.innerHTML = "<p style='color:red; text-align:center;'>خطأ: ملف data.js غير محمل</p>";
        return;
    }

    SURAH_NAMES.forEach((name, index) => {
        if (index === 0) return; // تخطي الرقم 0
        if (filter && !name.includes(filter)) return; // فلتر البحث

        const box = document.createElement('div');
        box.className = 'surah-box';
        // إضافة تنسيق CSS للصندوق مباشرة هنا أو في ملف CSS (يفضل CSS)
        // سنعتمد على كلاس surah-box الموجود مسبقاً
        box.innerHTML = `<span class="surah-number">${index}</span> ${name}`;
        
        // عند الضغط يتم تحميل السورة
        box.onclick = () => loadSurah(index);
        
        grid.appendChild(box);
    });
}

// 3. البحث
function filterSurahs() {
    const query = document.getElementById('quran-search').value;
    renderSurahGrid(query);
}
// 4. القراءة (تم إصلاح مشكلة السور الطويلة مثل البقرة)
function loadSurah(surahIndex) {
    if(!fullQuranData) return;
    
    const surahData = fullQuranData[surahIndex.toString()];
    if(!surahData) return;

    // تبديل الواجهة: إخفاء الشبكة وإظهار منطقة القراءة
    document.getElementById('surah-grid').style.display = 'none';
    document.getElementById('reading-area').style.display = 'block';
    
    // إخفاء أدوات البحث العلوية
    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'none';
    
    // وضع العنوان
    document.getElementById('current-surah-title').innerText = `سورة ${surahData.name}`;
    
    // --- [الإصلاح الجذري لمشكلة النزول] ---
    // نقوم بإزالة قيد الارتفاع (max-height) تماماً عن الحاوية الأم
    const container = document.getElementById('quran-app-container');
    if(container) {
        container.style.maxHeight = 'none'; // السماح بالتمدد اللانهائي
        container.style.overflow = 'visible'; // التأكد من ظهور كل المحتوى
    }
    // ----------------------------------------

    const contentDiv = document.getElementById('quran-text-display');
    contentDiv.innerHTML = ""; // تنظيف النص القديم

    // إضافة البسملة (ما عدا الفاتحة والتوبة)
    if(surahIndex !== 1 && surahIndex !== 9) {
        contentDiv.innerHTML += `<div style="text-align:center; margin-bottom:20px; font-size:1.3rem; color:var(--primary-color); font-family:'Amiri', serif;">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>`;
    }

    // بناء النص القرآني
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
    
    // الانتقال لأعلى منطقة القراءة بنعومة
    document.getElementById('reading-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeReading() {
    // العودة للفهرس
    document.getElementById('reading-area').style.display = 'none';
    document.getElementById('surah-grid').style.display = 'grid'; // إعادة الشبكة
    
    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'flex';
    
    // إعادة الارتفاع الطبيعي للقائمة (لتعمل الانسيابية عند الإغلاق لاحقاً)
    const container = document.getElementById('quran-app-container');
    if(container) {
        // نضبط الارتفاع على حجم المحتوى الحالي (الفهرس)
        container.style.maxHeight = container.scrollHeight + 100 + "px";
        // يمكن إعادة overflow إلى hidden إذا أردت، لكن visible آمن
    }
}

// 5. الحفظ (Bookmark)
function saveBookmark(surah, ayah) {
    localStorage.setItem('quranBookmark', JSON.stringify({ surah, ayah }));
    if(window.showToast) window.showToast(`تم حفظ: سورة ${SURAH_NAMES[surah]} - آية ${ayah}`, "success");
}

function goToBookmark() {
    const saved = localStorage.getItem('quranBookmark');
    if(!saved) {
        if(window.showToast) window.showToast("لم تقم بحفظ أي موضع بعد!", "info");
        return;
    }
    
    const { surah, ayah } = JSON.parse(saved);
    
    // دالة مساعدة للذهاب للمكان
    const jump = () => {
        loadSurah(surah);
        // تأخير بسيط جداً لضمان رسم السورة قبل التمرير
        setTimeout(() => scrollToAyah(surah, ayah), 300);
    };

    if(fullQuranData) {
        jump();
    } else {
        // إذا لم تكن البيانات محملة، نفتح التطبيق أولاً
        openQuranApp().then(() => {
            // ننتظر قليلاً ثم نذهب
            setTimeout(() => {
                if(fullQuranData) jump();
            }, 500);
        });
    }
}

function scrollToAyah(surah, ayah) {
    const el = document.getElementById(`ayah-${surah}-${ayah}`);
    if(el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // وميض لتمييز الآية
        el.style.backgroundColor = "rgba(251, 191, 36, 0.4)";
        el.style.borderRadius = "5px";
        setTimeout(() => el.style.backgroundColor = "transparent", 2000);
    }
}

// 6. المنبه
function setStudyAlarm() {
    const timeInput = document.getElementById('alarm-time').value;
    if(!timeInput) {
        if(window.showToast) window.showToast("الرجاء اختيار وقت أولاً", "error");
        return;
    }

    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                localStorage.setItem('studyAlarm', timeInput);
                if(window.showToast) window.showToast(`تم ضبط المنبه على الساعة: ${timeInput}`, "success");
                
                // بدء فحص الوقت
                if(!window.alarmInterval) checkAlarmLoop(timeInput);
            } else {
                alert("يجب السماح بالإشعارات من إعدادات المتصفح ليعمل المنبه.");
            }
        });
    } else {
        alert("عذراً، متصفحك لا يدعم التنبيهات.");
    }
}

function checkAlarmLoop(time) {
    // تخزين الـ interval في window لنمنع تكراره
    window.alarmInterval = setInterval(() => {
        const now = new Date();
        const current = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        
        if (current === time) {
            new Notification("حلقات الثريا", { 
                body: "حان وقت وردك القرآني يا بطل! 📖", 
                icon: "1768411699920.png" 
            });
            // تشغيل صوت بسيط إن أمكن (اختياري)
        }
    }, 60000); // فحص كل دقيقة
}

// 7. دعاء الختم
function showDuaa() {
    alert("اللهم ارحمني بالقرآن واجعله لي إماماً ونوراً وهدىً ورحمة...");
}
