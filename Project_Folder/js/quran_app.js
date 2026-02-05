/* ============================================================
   ملف: js/quran_app.js (V30 - الإصدار المطور)
   الوظيفة: تشغيل المصحف، البحث بالآيات، ونظام العلامات المرجعية
   ============================================================ */

let fullQuranData = null;
let currentFontSize = 1.3; // الحجم الافتراضي
let isDataLoading = false;

// 1. التحميل المسبق للبيانات لضمان السرعة
async function preloadQuranData() {
    if (fullQuranData || isDataLoading) return;
    isDataLoading = true;
    try {
        const response = await fetch('quran.json');
        fullQuranData = await response.json();
        renderSurahGrid();
        console.log("تم تحميل بيانات المصحف بنجاح ✅");
    } catch (e) {
        console.error("خطأ في تحميل بيانات المصحف:", e);
    } finally {
        isDataLoading = false;
    }
}

// 2. فتح تطبيق المصحف
async function openQuranApp() {
    await preloadQuranData();
    document.getElementById('surah-grid').style.display = 'grid';
    document.getElementById('reading-area').style.display = 'none';
}

// 3. عرض شبكة السور
function renderSurahGrid(filteredList = null) {
    const grid = document.getElementById('surah-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // استخدام الأسماء من SURAH_NAMES (data.js) أو من JSON
    const list = filteredList || Object.keys(fullQuranData || {});

    list.forEach(num => {
        const s = fullQuranData[num];
        const card = document.createElement('div');
        card.className = 'surah-card';
        card.innerHTML = `
            <div class="surah-num">${num}</div>
            <div class="surah-info">
                <h4>${s.name}</h4>
                <span>${s.ayahCount} آية</span>
            </div>
        `;
        card.onclick = () => loadSurah(num);
        grid.appendChild(card);
    });
}

// 4. البحث عن سورة
window.filterSurahs = function() {
    const term = document.getElementById('quran-search-surah').value.trim();
    if (!fullQuranData) return;
    
    const filtered = Object.keys(fullQuranData).filter(num => 
        fullQuranData[num].name.includes(term) || num.toString() === term
    );
    renderSurahGrid(filtered);
};

// 5. البحث العميق بنص الآية (ميزة جديدة)
window.searchByAyahText = function() {
    const term = document.getElementById('quran-search-ayah').value.trim();
    const grid = document.getElementById('surah-grid');
    
    if (term.length < 3) {
        if(term.length === 0) renderSurahGrid();
        return;
    }

    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">جاري البحث عن الآية...</p>';
    
    let resultsHtml = '';
    let count = 0;

    Object.keys(fullQuranData).forEach(sNum => {
        fullQuranData[sNum].ayahs.forEach(ayah => {
            if (ayah.text.includes(term)) {
                count++;
                if (count > 20) return; // تحديد النتائج لسرعة العرض
                resultsHtml += `
                    <div class="search-result-item" onclick="loadSurah(${sNum}, ${ayah.num})">
                        <strong>سورة ${fullQuranData[sNum].name} (آية ${ayah.num}):</strong>
                        <p class="quran-verse-small">"...${ayah.text}..."</p>
                    </div>`;
            }
        });
    });

    if (count === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">لم يتم العثور على نتائج للآية.</p>';
    } else {
        grid.innerHTML = `<div style="grid-column: 1/-1;">${resultsHtml}</div>`;
    }
};

// 6. عرض السورة المختار (مع دعم العلامة المرجعية)
window.loadSurah = function(surahNum, highlightAyah = null) {
    const s = fullQuranData[surahNum];
    if (!s) return;

    document.getElementById('surah-grid').style.display = 'none';
    document.getElementById('reading-area').style.display = 'block';
    document.getElementById('current-surah-title').innerText = `سورة ${s.name}`;

    const display = document.getElementById('quran-text-display');
    display.innerHTML = '';

    // البسملة (لغير التوبة والفاتحة)
    if (surahNum !== "1" && surahNum !== "9") {
        display.innerHTML += `<div class="basmala">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>`;
    }

    s.ayahs.forEach(ayah => {
        const ayahSpan = document.createElement('span');
        ayahSpan.id = `ayah-${surahNum}-${ayah.num}`;
        ayahSpan.className = 'ayah-text';
        ayahSpan.style.fontSize = currentFontSize + 'rem';
        
        // زر العلامة المرجعية بجانب كل آية
        ayahSpan.innerHTML = `
            ${ayah.text} 
            <span class="ayah-end" onclick="saveBookmark(${surahNum}, ${ayah.num})">
                (${ayah.num}) <i class="bookmark-icon">🔖</i>
            </span>
        `;
        
        if (highlightAyah && ayah.num === highlightAyah) {
            ayahSpan.classList.add('highlight-ayah');
        }

        display.appendChild(ayahSpan);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (highlightAyah) {
        setTimeout(() => {
            const el = document.getElementById(`ayah-${surahNum}-${highlightAyah}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
    }
};

// 7. نظام العلامة المرجعية (Bookmark)
window.saveBookmark = function(sNum, aNum) {
    const bookmark = { sNum, aNum, sName: fullQuranData[sNum].name };
    localStorage.setItem('quran_bookmark', JSON.stringify(bookmark));
    showToast(`تم حفظ العلامة المرجعية: سورة ${bookmark.sName} آية ${aNum} 🔖`, "success");
};

window.goToBookmark = function() {
    const saved = localStorage.getItem('quran_bookmark');
    if (!saved) {
        showToast("لا توجد علامة مرجعية محفوظة بعد.", "info");
        return;
    }
    const b = JSON.parse(saved);
    loadSurah(b.sNum, b.aNum);
};

// 8. التحكم في حجم الخط والرجوع
window.changeFontSize = function(delta) {
    currentFontSize += delta * 0.1;
    if (currentFontSize < 1) currentFontSize = 1;
    if (currentFontSize > 3) currentFontSize = 3;
    
    document.querySelectorAll('.ayah-text').forEach(el => {
        el.style.fontSize = currentFontSize + 'rem';
    });
};

window.closeReading = function() {
    document.getElementById('reading-area').style.display = 'none';
    document.getElementById('surah-grid').style.display = 'grid';
};

// 9. دالة تغيير لون الصفحة (يستدعيها index.html)
window.setQuranTheme = function(theme) {
    const display = document.getElementById('quran-text-display');
    const readingArea = document.getElementById('reading-area');
    if (!display || !readingArea) return;

    if (theme === 'yellow') {
        readingArea.style.backgroundColor = "#fdf6e3";
        display.style.backgroundColor = "#fdf6e3";
        display.style.color = "#5b4636";
    } else {
        readingArea.style.backgroundColor = "#ffffff";
        display.style.backgroundColor = "#ffffff";
        display.style.color = "var(--text-dark)";
    }
};
