// js/quran_app.js - المصحف، المنبه، والحماية

// --- 1. نظام الحماية (Anti-Copy) ---
document.addEventListener('keydown', function(e) {
    // السماح بالنسخ فقط إذا كان العنصر هو نص قرآني
    if (e.ctrlKey && e.key === 'c') {
        const selection = window.getSelection();
        if (selection.anchorNode && selection.anchorNode.parentElement.classList.contains('quran-verse') || 
            selection.anchorNode.parentElement.closest('.quran-text-content')) {
            return; // السماح بالنسخ
        }
        e.preventDefault();
        showToast("🚫 النسخ مسموح للآيات القرآنية فقط", "error");
    }
});

// منع الزر الأيمن في كل الموقع ما عدا المصحف
document.addEventListener('contextmenu', function(e) {
    if (e.target.classList.contains('quran-verse') || e.target.closest('.quran-text-content')) {
        return; // السماح
    }
    e.preventDefault();
});


// --- 2. تطبيق المصحف (الختمة) ---
let fullQuranData = null;

async function openQuranApp() {
    const container = document.getElementById('quran-app-container');
    // فتح القائمة
    container.style.maxHeight = "1000px"; // قيمة تقريبية للفتح
    
    // تحميل البيانات لأول مرة
    if (!fullQuranData) {
        try {
            const response = await fetch('quran.json');
            if(!response.ok) throw new Error("ملف المصحف غير موجود");
            fullQuranData = await response.json();
            renderSurahGrid();
        } catch (error) {
            showToast("جاري تجهيز المصحف... حاول مرة أخرى", "info");
        }
    }
}

// رسم شبكة السور (الفهرس)
function renderSurahGrid(filter = "") {
    const grid = document.getElementById('surah-grid');
    grid.innerHTML = "";
    
    // استخدام SURAH_NAMES من data.js
    if(typeof SURAH_NAMES === 'undefined') return;

    SURAH_NAMES.forEach((name, index) => {
        if (index === 0) return; // تخطي العنصر الفارغ
        if (filter && !name.includes(filter)) return; // فلترة البحث

        const box = document.createElement('div');
        box.className = 'surah-box';
        box.innerHTML = `<span class="surah-number">${index}</span>${name}`;
        box.onclick = () => loadSurah(index);
        grid.appendChild(box);
    });
}

// البحث عن سورة
function filterSurahs() {
    const query = document.getElementById('quran-search').value;
    renderSurahGrid(query);
}

// فتح سورة للقراءة
function loadSurah(surahIndex) {
    if(!fullQuranData) return;
    
    const surahData = fullQuranData[surahIndex.toString()];
    if(!surahData) return;

    document.getElementById('surah-grid').style.display = 'none';
    document.getElementById('reading-area').style.display = 'block';
    document.getElementById('quran-header-controls').style.display = 'none'; // إخفاء البحث
    
    document.getElementById('current-surah-title').innerText = `سورة ${surahData.name}`;
    
    const contentDiv = document.getElementById('quran-text-display');
    contentDiv.innerHTML = "";

    // البسملة (ما عدا التوبة والفاتحة لأنها فيها أصلاً)
    if(surahIndex !== 1 && surahIndex !== 9) {
        contentDiv.innerHTML += `<div style="text-align:center; margin-bottom:15px; font-size:1.2rem;">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>`;
    }

    let fullText = "";
    surahData.ayahs.forEach(ayah => {
        // إضافة زر الحفظ (Bookmark) قبل الآية
        fullText += `
            <span class="ayah-span" id="ayah-${surahIndex}-${ayah.num}">
                ${ayah.text} 
                <span class="quran-symbol">(${ayah.num})</span>
                <span class="bookmark-btn" onclick="saveBookmark(${surahIndex}, ${ayah.num})" title="احفظ مكاني">🔖</span>
            </span> 
        `;
    });
    contentDiv.innerHTML += fullText;
}

function closeReading() {
    document.getElementById('reading-area').style.display = 'none';
    document.getElementById('surah-grid').style.display = 'grid';
    document.getElementById('quran-header-controls').style.display = 'flex';
}

// --- 3. نظام الحفظ (Bookmarks) ---
function saveBookmark(surah, ayah) {
    localStorage.setItem('quranBookmark', JSON.stringify({ surah, ayah }));
    showToast(`تم حفظ مكانك: سورة ${SURAH_NAMES[surah]} - آية ${ayah}`, "success");
    
    // تلوين الأيقونة
    document.querySelectorAll('.bookmark-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function goToBookmark() {
    const saved = localStorage.getItem('quranBookmark');
    if(!saved) {
        showToast("لم تقم بحفظ أي مكان سابقاً", "info");
        return;
    }
    const { surah, ayah } = JSON.parse(saved);
    
    // تأكد من تحميل البيانات
    if(!fullQuranData) {
        openQuranApp().then(() => {
            loadSurah(surah);
            setTimeout(() => scrollToAyah(surah, ayah), 300);
        });
    } else {
        loadSurah(surah);
        setTimeout(() => scrollToAyah(surah, ayah), 100);
    }
}

function scrollToAyah(surah, ayah) {
    const el = document.getElementById(`ayah-${surah}-${ayah}`);
    if(el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.backgroundColor = "rgba(251, 191, 36, 0.3)"; // وميض خفيف
        setTimeout(() => el.style.backgroundColor = "transparent", 2000);
    }
}

// --- 4. منبه الحفظ الذكي ⏰ ---
function setStudyAlarm() {
    const timeInput = document.getElementById('alarm-time').value;
    if(!timeInput) {
        showToast("الرجاء اختيار وقت أولاً", "error");
        return;
    }

    // طلب إذن الإشعارات
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // حفظ الوقت
    localStorage.setItem('studyAlarm', timeInput);
    
    // جلب الاسم
    let name = localStorage.getItem('studentName') || "يا بطل";
    
    showToast(`تم ضبط المنبه على ${timeInput}.. سنذكرك يا ${name}!`, "success");

    // التحقق الدوري (كل دقيقة)
    setInterval(() => {
        const now = new Date();
        const current = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        
        if (current === timeInput) {
            new Notification("حلقات الثريا 🕌", {
                body: `حان وقت الحفظ والمراجعة يا ${name}.. القرآن ينتظرك!`,
                icon: "1768411699920.png"
            });
        }
    }, 60000); // فحص كل 60 ثانية
}

function showDuaa() {
    alert("اللهم ارحمني بالقرآن واجعله لي إماماً ونوراً وهدى ورحمة...");
    // يمكن استبدال الـ alert بـ Modal جميل لاحقاً
}
