// js/quran_app.js - المصحف، المنبه، والحماية (نسخة التصحيح)

let fullQuranData = null; 

// 1. دالة فتح تطبيق المصحف (مع كشف الأخطاء)
async function openQuranApp() {
    const container = document.getElementById('quran-app-container');
    
    // إجبار القائمة على الفتح
    container.style.display = 'block';
    setTimeout(() => {
        container.style.maxHeight = "2000px";
        container.classList.add('active-panel');
    }, 50);

    // تحميل البيانات
    if (!fullQuranData) {
        const grid = document.getElementById('surah-grid');
        try {
            // رسالة جاري التحميل
            if(grid) grid.innerHTML = '<div style="text-align:center; padding:20px; color:var(--primary-color);">⏳ جاري الاتصال بقاعدة البيانات...</div>';

            // إضافة رقم عشوائي للرابط لإجبار المتصفح على تحميل نسخة جديدة وتجاهل الكاش القديم
            const cacheBuster = new Date().getTime(); 
            const response = await fetch(`quran.json?v=${cacheBuster}`);
            
            // فحص هل الملف موجود فعلاً؟
            if(!response.ok) {
                throw new Error(`فشل التحميل: ${response.status} ${response.statusText}`);
            }
            
            // محاولة قراءة البيانات
            fullQuranData = await response.json();
            
            // إذا وصلنا هنا فالأمور طيبة
            renderSurahGrid(); 
            if(window.showToast) window.showToast("تم تحميل المصحف بنجاح 📖", "success");
            
        } catch (error) {
            console.error("خطأ المصحف:", error);
            if(grid) {
                // طباعة الخطأ التقني بالكامل على الشاشة لنعرف السبب
                grid.innerHTML = `
                    <div style="background:#fee2e2; color:#b91c1c; padding:15px; border-radius:8px; text-align:center; direction:ltr;">
                        <strong>⛔ حدث خطأ تقني:</strong><br>
                        <span style="font-family:monospace; font-size:0.9rem;">${error.message}</span>
                        <br><br>
                        <small style="color:black; direction:rtl; display:block;">
                        📸 صور هذه الشاشة وأرسلها لي لنحل المشكلة فوراً.
                        </small>
                    </div>
                `;
            }
        }
    }
}

// 2. رسم شبكة السور
function renderSurahGrid(filter = "") {
    const grid = document.getElementById('surah-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    if(typeof SURAH_NAMES === 'undefined') {
        grid.innerHTML = "<p style='color:red'>خطأ: ملف data.js لم يتم تحميله.</p>";
        return;
    }

    SURAH_NAMES.forEach((name, index) => {
        if (index === 0) return;
        if (filter && !name.includes(filter)) return;

        const box = document.createElement('div');
        box.className = 'surah-box';
        box.innerHTML = `<span class="surah-number">${index}</span>${name}`;
        box.onclick = () => loadSurah(index);
        grid.appendChild(box);
    });
}

// 3. البحث
function filterSurahs() {
    const query = document.getElementById('quran-search').value;
    renderSurahGrid(query);
}

// 4. القراءة
function loadSurah(surahIndex) {
    if(!fullQuranData) return;
    
    const surahData = fullQuranData[surahIndex.toString()];
    if(!surahData) return;

    document.getElementById('surah-grid').style.display = 'none';
    document.getElementById('reading-area').style.display = 'block';
    
    // إخفاء البحث
    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'none';
    
    document.getElementById('current-surah-title').innerText = `سورة ${surahData.name}`;
    
    const contentDiv = document.getElementById('quran-text-display');
    contentDiv.innerHTML = "";

    if(surahIndex !== 1 && surahIndex !== 9) {
        contentDiv.innerHTML += `<div style="text-align:center; margin-bottom:20px; font-size:1.3rem; color:var(--primary-color);">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>`;
    }

    let fullText = "";
    surahData.ayahs.forEach(ayah => {
        fullText += `
            <span class="ayah-span" id="ayah-${surahIndex}-${ayah.num}">
                ${ayah.text} 
                <span class="quran-symbol">(${ayah.num})</span>
                <span class="bookmark-btn" onclick="saveBookmark(${surahIndex}, ${ayah.num})" title="حفظ">🔖</span>
            </span> 
        `;
    });
    contentDiv.innerHTML += fullText;
}

function closeReading() {
    document.getElementById('reading-area').style.display = 'none';
    document.getElementById('surah-grid').style.display = 'grid';
    const controls = document.querySelector('.quran-header-controls');
    if(controls) controls.style.display = 'flex';
}

// 5. الحفظ (Bookmark)
function saveBookmark(surah, ayah) {
    localStorage.setItem('quranBookmark', JSON.stringify({ surah, ayah }));
    if(window.showToast) window.showToast(`تم حفظ: سورة ${SURAH_NAMES[surah]} - آية ${ayah}`, "success");
}

function goToBookmark() {
    const saved = localStorage.getItem('quranBookmark');
    if(!saved) {
        if(window.showToast) window.showToast("لم تحفظ مكاناً بعد", "info");
        return;
    }
    const { surah, ayah } = JSON.parse(saved);
    if(fullQuranData) {
        loadSurah(surah);
        setTimeout(() => scrollToAyah(surah, ayah), 100);
    } else {
        openQuranApp().then(() => {
            setTimeout(() => {
                if(fullQuranData) {
                    loadSurah(surah);
                    setTimeout(() => scrollToAyah(surah, ayah), 300);
                }
            }, 500);
        });
    }
}

function scrollToAyah(surah, ayah) {
    const el = document.getElementById(`ayah-${surah}-${ayah}`);
    if(el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.backgroundColor = "rgba(251, 191, 36, 0.3)";
        setTimeout(() => el.style.backgroundColor = "transparent", 2000);
    }
}

// 6. المنبه
function setStudyAlarm() {
    const timeInput = document.getElementById('alarm-time').value;
    if(!timeInput) return alert("اختر وقتاً أولاً");

    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                localStorage.setItem('studyAlarm', timeInput);
                if(window.showToast) window.showToast(`تم ضبط المنبه: ${timeInput}`, "success");
                checkAlarmLoop(timeInput);
            } else {
                alert("يجب السماح بالإشعارات!");
            }
        });
    } else {
        alert("متصفحك لا يدعم التنبيهات");
    }
}

function checkAlarmLoop(time) {
    setInterval(() => {
        const now = new Date();
        const current = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        if (current === time) {
            new Notification("حلقات الثريا", { body: "حان وقت وردك يا بطل!", icon: "1768411699920.png" });
        }
    }, 60000);
}

// 7. دعاء الختم
function showDuaa() {
    alert("اللهم ارحمني بالقرآن...");
}
