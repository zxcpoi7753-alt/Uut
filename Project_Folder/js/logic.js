// js/logic.js - المحرك الرئيسي للموقع (النسخة 15 المحدثة)

// 1. نظام التنبيهات (Toast System)
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};
window.alert = function(msg) { showToast(msg, 'info'); };

// 2. الوضع الليلي
let isDarkMode = false;
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    // تغيير الأيقونة داخل الزر الدائري الجديد
    const btn = document.getElementById('theme-btn');
    if(btn) btn.innerText = isDarkMode ? "☀️" : "🌙"; 
}

// 3. التحكم في القائمة الجديدة (Sticky Nav)
function toggleNavMenu() {
    const grid = document.getElementById('nav-menu-grid');
    const btn = document.querySelector('.nav-expand-btn');
    
    if (grid.classList.contains('visible')) {
        grid.classList.remove('visible');
        setTimeout(() => grid.classList.add('hidden'), 400); // انتظار الانميشن
        btn.classList.remove('open');
    } else {
        grid.classList.remove('hidden');
        // تأخير بسيط لتفعيل الترانزيشن
        setTimeout(() => grid.classList.add('visible'), 10);
        btn.classList.add('open');
    }
}

// دالة التنقل بين الأقسام
function showSection(sectionId) {
    // إخفاء كل الأقسام
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    
    // إظهار القسم المطلوب
    const target = document.getElementById(`section-${sectionId}`);
    if(target) {
        target.classList.add('active');
        // تمرير للشاشة للأعلى قليلاً
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // تحديث حالة زر الرئيسية
    const homeBtn = document.querySelector('.nav-btn-home');
    if(sectionId === 'home') homeBtn.classList.add('active');
    else homeBtn.classList.remove('active');

    // إغلاق القائمة المنسدلة إذا كانت مفتوحة (للجوال)
    const grid = document.getElementById('nav-menu-grid');
    if (grid && grid.classList.contains('visible')) {
        toggleNavMenu();
    }
}

// 4. نظام الآيات الذكي (عدم التكرار + التوقيت)
let availableVerses = []; // مخزن مؤقت للآيات غير المعروضة

function startVerseTicker() {
    const vDisp = document.getElementById('verse-display');
    if (!vDisp || typeof verses === 'undefined') return;

    const runCycle = () => {
        // أ. إذا انتهت الآيات، نعد تعبئة المخزن من القائمة الأصلية
        if (availableVerses.length === 0) {
            availableVerses = [...verses]; // نسخ المصفوفة
        }

        // ب. اختيار آية عشوائية وحذفها من المخزن (لمنع التكرار)
        const randomIndex = Math.floor(Math.random() * availableVerses.length);
        const verseText = availableVerses[randomIndex];
        availableVerses.splice(randomIndex, 1); 

        // ج. عرض الآية
        vDisp.innerText = verseText;
        vDisp.classList.add('visible'); // ظهور (Fade In)

        // د. الانتظار 8 ثواني وهي ظاهرة
        setTimeout(() => {
            vDisp.classList.remove('visible'); // اختفاء (Fade Out)

            // هـ. الانتظار 3 ثواني وهي مختفية، ثم بدء دورة جديدة
            setTimeout(runCycle, 3000); 

        }, 8000);
    };

    runCycle(); // بدء الدورة الأولى
}

// 5. التهيئة العامة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    
    if(typeof updateWelcomeMessage === 'function') updateWelcomeMessage();
    
    // تفعيل القوائم المنسدلة (Accordions)
    const acc = document.getElementsByClassName("accordion-btn");
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active-acc");
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) panel.style.maxHeight = null;
            else panel.style.maxHeight = panel.scrollHeight + 800 + "px";
        });
    }

    // بناء شبكة القائمة (ما عدا الرئيسية)
    const navGrid = document.getElementById('nav-menu-grid');
    if(navGrid && typeof menus !== 'undefined') {
        menus.forEach(menu => {
            if(menu.id === 'home') return; // تخطي زر الرئيسية لأنه موجود بالأعلى
            
            const btn = document.createElement('button');
            btn.className = 'nav-btn'; 
            btn.innerText = menu.text;
            btn.onclick = () => showSection(menu.id);
            navGrid.appendChild(btn);
        });
    }

    // تعبئة البيانات (الأخبار، المعلمين، الأوائل)
    if(typeof siteData !== 'undefined') {
        // الأخبار
        const newsList = document.getElementById('news-list');
        if(newsList) siteData.news.forEach(n => {
            newsList.innerHTML += `<div class="card ${n.winners.length > 0 ? 'clickable' : ''}" onclick="toggleWinners(${n.id})"><strong>📅 ${n.date}</strong><br>${n.text}${n.winners.length > 0 ? `<div id="win-${n.id}" class="winner-list">🎉 الفائزون: ${n.winners.join(' - ')}</div>` : ''}</div>`;
        });

        // المعلمون
        const tList = document.getElementById('teachers-list');
        if(tList) siteData.teachers.forEach(t => tList.innerHTML += `<div class="card"><strong>${t.name}</strong><br><span style="color:gray">${t.job}</span></div>`);

        // الأوائل (بالميداليات)
        const ranksContainer = document.getElementById('ranks-list');
        if(ranksContainer) {
            siteData.ranks.forEach(r => {
                let studentsHtml = '';
                r.students.forEach((student, index) => {
                    let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                    let rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : 'rank-3';
                    studentsHtml += `<div class="student-row"><span style="font-weight:bold;">${student}</span><span class="medal-icon ${rankClass}">${medal}</span></div>`;
                });
                ranksContainer.innerHTML += `<div class="card rank-card"><div class="rank-header"><div class="rank-icon-ring">🕌</div><h3 style="margin:0; color:var(--primary-color)">${r.ring}</h3></div>${studentsHtml}</div>`;
            });
        }

        // أزرار الجداول
        const aftContainer = document.getElementById('ring-selectors-afternoon');
        if(aftContainer) siteData.afternoonRings.forEach(ring => {
            const btn = document.createElement('button'); btn.className = 'nav-btn'; btn.innerText = ring.name;
            btn.onclick = () => createTable(ring.name, ring.time, false);
            aftContainer.appendChild(btn);
        });

        const eveContainer = document.getElementById('ring-selectors-evening');
        if(eveContainer) siteData.eveningRings.forEach(ring => {
            const btn = document.createElement('button'); btn.className = 'nav-btn'; btn.innerText = ring.name;
            btn.onclick = () => createTable(ring.name, ring.time, true);
            eveContainer.appendChild(btn);
        });
    }

    // تشغيل الوحدات والآيات
    if(typeof initCalculator === 'function') initCalculator();
    if(typeof initQuiz === 'function') initQuiz();
    startVerseTicker();
});

// دوال مساعدة
function toggleWinners(id) { const el = document.getElementById(`win-${id}`); if(el) el.style.display = (el.style.display === 'block') ? 'none' : 'block'; }
function createTable(ringName, baseTime, isEvening) {
    const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    let tableHtml = `<div class="card" style="animation:fadeIn 0.5s"><h3 style="color:var(--primary-color); text-align:center; margin-bottom:10px;">📅 جدول ${ringName}</h3><table><thead><tr><th>اليوم</th><th>الوقت</th><th>النشاط</th></tr></thead><tbody>`;
    days.forEach(day => {
        let timeDisplay = baseTime;
        if (isEvening && day === "الخميس") timeDisplay = "إلى أذان العشاء";
        tableHtml += `<tr><td>${day}</td><td>${timeDisplay}</td><td>حفظ ومراجعة</td></tr>`;
    });
    tableHtml += `</tbody></table></div>`;
    const displayArea = document.getElementById('schedule-display');
    displayArea.innerHTML = tableHtml;
    displayArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
