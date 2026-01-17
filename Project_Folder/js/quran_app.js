// js/quran_app.js - المصحف، المنبه، والحماية

let fullQuranData = null; // لتخزين بيانات المصحف كاملة

// استبدل أول دالة في ملف js/quran_app.js بهذه:

async function openQuranApp() {
    const container = document.getElementById('quran-app-container');
    
    // 1. إجبار القائمة على الفتح فوراً
    container.style.display = 'block'; // تأكيد الظهور
    setTimeout(() => {
        container.style.maxHeight = "2000px"; // فتح الارتفاع
        container.style.opacity = "1";
    }, 50);

    // 2. تحميل البيانات
    if (!fullQuranData) {
        try {
            // إظهار رسالة تحميل
            const grid = document.getElementById('surah-grid');
            if(grid) grid.innerHTML = '<div style="text-align:center; padding:20px;">⏳ جاري إحضار المصحف...</div>';

            const response = await fetch('quran.json');
            
            if(!response.ok) {
                throw new Error("ملف quran.json غير موجود أو فيه مشكلة");
            }
            
            fullQuranData = await response.json();
            renderSurahGrid(); // رسم الفهرس عند النجاح
            
        } catch (error) {
            console.error(error);
            const grid = document.getElementById('surah-grid');
            if(grid) grid.innerHTML = `<div style="color:red; text-align:center; padding:20px;">
                خطأ في التحميل!<br>
                تأكد أن ملف <b>quran.json</b> موجود بنفس الاسم بجوار index.html
                </div>`;
        }
    }
}

// 3. البحث عن سورة
function filterSurahs() {
    const query = document.getElementById('quran-search').value;
    renderSurahGrid(query);
}

// 4. فتح سورة للقراءة
function loadSurah(surahIndex) {
    if(!fullQuranData) return;
    
    const surahData = fullQuranData[surahIndex.toString()];
    if(!surahData) return;

    // تبديل العرض من الفهرس إلى القراءة
    document.getElementById('surah-grid').style.display = 'none';
    document.getElementById('reading-area').style.display = 'block';
    // إخفاء البحث مؤقتاً
    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'none';
    
    document.getElementById('current-surah-title').innerText = `سورة ${surahData.name}`;
    
    const contentDiv = document.getElementById('quran-text-display');
    contentDiv.innerHTML = "";

    // إضافة البسملة (ما عدا التوبة والفاتحة)
    if(surahIndex !== 1 && surahIndex !== 9) {
        contentDiv.innerHTML += `<div style="text-align:center; margin-bottom:20px; font-size:1.3rem; color:var(--primary-color);">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>`;
    }

    let fullText = "";
    surahData.ayahs.forEach(ayah => {
        // إضافة زر الحفظ (Bookmark) بجانب كل آية
        fullText += `
            <span class="ayah-span" id="ayah-${surahIndex}-${ayah.num}">
                ${ayah.text} 
                <span class="quran-symbol">(${ayah.num})</span>
                <span class="bookmark-btn" onclick="saveBookmark(${surahIndex}, ${ayah.num})" title="حفظ هذا الموضع">🔖</span>
            </span> 
        `;
    });
    contentDiv.innerHTML += fullText;
    
    // تحديث ارتفاع الحاوية لتناسب النص الطويل
    const container = document.getElementById('quran-app-container');
    container.style.maxHeight = "fit-content";
}

// زر الرجوع للفهرس
function closeReading() {
    document.getElementById('reading-area').style.display = 'none';
    document.getElementById('surah-grid').style.display = 'grid';
    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'flex';
}
// --- 5. نظام الحفظ (Bookmarks) ---
function saveBookmark(surah, ayah) {
    // حفظ البيانات في المتصفح
    localStorage.setItem('quranBookmark', JSON.stringify({ surah, ayah }));
    
    // رسالة تأكيد
    if(window.showToast) window.showToast(`تم حفظ مكانك: سورة ${SURAH_NAMES[surah]} - آية ${ayah}`, "success");
    
    // تلوين الأيقونة لتمييزها
    document.querySelectorAll('.bookmark-btn').forEach(b => b.classList.remove('active'));
    // محاولة تلوين الزر الذي تم ضغطه (event is accessible)
    if(event && event.target) event.target.classList.add('active');
}

function goToBookmark() {
    const saved = localStorage.getItem('quranBookmark');
    
    if(!saved) {
        if(window.showToast) window.showToast("لم تقم بحفظ أي مكان سابقاً", "info");
        return;
    }

    const { surah, ayah } = JSON.parse(saved);
    
    // سيناريو 1: البيانات محملة مسبقاً
    if(fullQuranData) {
        loadSurah(surah);
        setTimeout(() => scrollToAyah(surah, ayah), 100);
    } 
    // سيناريو 2: البيانات غير محملة (فتح لأول مرة)
    else {
        openQuranApp().then(() => {
            // ننتظر قليلاً حتى يتم رسم الفهرس ثم نفتح السورة
            setTimeout(() => {
                loadSurah(surah);
                setTimeout(() => scrollToAyah(surah, ayah), 300);
            }, 500);
        });
    }
}

// التمرير السلس للآية المطلوبة
function scrollToAyah(surah, ayah) {
    const el = document.getElementById(`ayah-${surah}-${ayah}`);
    if(el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // وميض لتمييز الآية
        el.style.backgroundColor = "rgba(251, 191, 36, 0.3)";
        setTimeout(() => el.style.backgroundColor = "transparent", 2000);
    }
}

// --- 6. منبه الحفظ الذكي (Alarm) ---
let alarmInterval = null;

function setStudyAlarm() {
    const timeInput = document.getElementById('alarm-time').value;
    if(!timeInput) {
        if(window.showToast) window.showToast("الرجاء اختيار وقت أولاً", "error");
        return;
    }

    // 1. طلب إذن الإشعارات من المتصفح
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                startAlarmCheck(timeInput);
            } else {
                alert("يجب السماح بالإشعارات لكي يعمل المنبه!");
            }
        });
    } else {
        alert("متصفحك لا يدعم الإشعارات");
    }
}

function startAlarmCheck(time) {
    // حفظ الوقت
    localStorage.setItem('studyAlarm', time);
    let name = localStorage.getItem('studentName') || "يا بطل";
    
    if(window.showToast) window.showToast(`تم ضبط المنبه على ${time}.. اترك الصفحة مفتوحة!`, "success");

    // إلغاء أي منبه سابق
    if(alarmInterval) clearInterval(alarmInterval);

    // التحقق كل دقيقة
    alarmInterval = setInterval(() => {
        const now = new Date();
        // تنسيق الوقت الحالي HH:MM
        const current = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        
        if (current === time) {
            // إطلاق الإشعار
            new Notification("حلقات الثريا 🕌", {
                body: `حان وقت الحفظ والمراجعة يا ${name}.. القرآن ينتظرك!`,
                icon: "1768411699920.png", // تأكد من وجود صورة الأيقونة
                requireInteraction: true // يبقى الإشعار حتى يغلقه المستخدم
            });
            
            // تشغيل صوت بسيط (اختياري)
            // const audio = new Audio('notification.mp3'); audio.play();
        }
    }, 60000); // كل 60 ثانية
}

// --- 7. دعاء الختم ---
function showDuaa() {
    const duaaText = `اللهم ارحمني بالقرآن واجعله لي إماماً ونوراً وهدى ورحمة..\n
    اللهم ذكرني منه ما نسيت وعلمني منه ما جهلت وارزقني تلاوته آناء الليل وأطراف النهار واجعله لي حجة يا رب العالمين.`;
    alert(duaaText);
}

// --- 8. نظام الحماية (منع النسخ إلا للآيات) ---
document.addEventListener('keydown', function(e) {
    // اختصار النسخ Ctrl+C
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        const selection = window.getSelection();
        // التحقق هل النص المظلل داخل منطقة المصحف؟
        const isQuranText = selection.anchorNode && 
                           (selection.anchorNode.parentElement.closest('.quran-text-content') || 
                            selection.anchorNode.parentElement.classList.contains('quran-verse'));
        
        if (!isQuranText) {
            e.preventDefault();
            if(window.showToast) window.showToast("🚫 عذراً، النسخ مسموح للآيات القرآنية فقط", "error");
        }
    }
});

// منع الزر الأيمن (Context Menu) إلا فوق المصحف
document.addEventListener('contextmenu', function(e) {
    const isQuranText = e.target.closest('.quran-text-content') || e.target.classList.contains('quran-verse');
    
    if (!isQuranText) {
        e.preventDefault();
    }
});
