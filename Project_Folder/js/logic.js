// js/logic.js - المحرك الرئيسي (محدث للواتساب وحفظ البيانات)

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
    const btn = document.getElementById('theme-btn');
    if(btn) btn.innerText = isDarkMode ? "☀️" : "🌙"; 
}

// 3. التحكم في القائمة
function toggleNavMenu() {
    const grid = document.getElementById('nav-menu-grid');
    const btn = document.querySelector('.nav-expand-btn');
    
    if (grid.classList.contains('visible')) {
        grid.classList.remove('visible');
        setTimeout(() => grid.classList.add('hidden'), 400); 
        btn.classList.remove('open');
    } else {
        grid.classList.remove('hidden');
        setTimeout(() => grid.classList.add('visible'), 10);
        btn.classList.add('open');
    }
}

// دالة التنقل بين الأقسام
function showSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById(`section-${sectionId}`);
    if(target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // التحميل المسبق للمصحف عند دخول قسم الطالب
    if (sectionId === 'student' && typeof preloadQuranData === 'function') {
        preloadQuranData(); 
    }

    const homeBtn = document.querySelector('.nav-btn-home');
    if(sectionId === 'home') homeBtn.classList.add('active');
    else homeBtn.classList.remove('active');

    const grid = document.getElementById('nav-menu-grid');
    if (grid && grid.classList.contains('visible')) {
        toggleNavMenu();
    }
}

// 4. نظام الآيات الذكي
let availableVerses = []; 
function startVerseTicker() {
    const vDisp = document.getElementById('verse-display');
    if (!vDisp || typeof verses === 'undefined') return;

    const runCycle = () => {
        if (availableVerses.length === 0) availableVerses = [...verses]; 
        const randomIndex = Math.floor(Math.random() * availableVerses.length);
        const verseText = availableVerses[randomIndex];
        availableVerses.splice(randomIndex, 1); 

        vDisp.innerText = verseText;
        vDisp.classList.add('visible'); 

        setTimeout(() => {
            vDisp.classList.remove('visible'); 
            setTimeout(runCycle, 3000); 
        }, 8000);
    };
    runCycle(); 
}

// 5. حفظ واسترجاع بيانات الطالب (الاسم + الحلقة)
function saveStudentName() {
    const nameInput = document.getElementById('student-name-input');
    const ringInput = document.getElementById('student-ring-select');
    const resDiv = document.getElementById('name-save-result');
    
    const name = nameInput.value.trim();
    const ring = ringInput.value;

    if (!name) {
        if(window.showToast) window.showToast("يرجى كتابة الاسم أولاً", "error");
        return;
    }

    localStorage.setItem('studentName', name);
    if(ring) localStorage.setItem('studentRing', ring);
    
    if(resDiv) {
        resDiv.style.display = 'block';
        resDiv.innerHTML = `تم حفظ بياناتك بنجاح يا <strong>${name}</strong> ✅`;
    }
    if(window.showToast) window.showToast("تم الحفظ بنجاح", "success");
    
    updateWelcomeMessage();
}

function deleteStudentName() {
    localStorage.removeItem('studentName');
    localStorage.removeItem('studentRing');
    document.getElementById('student-name-input').value = "";
    document.getElementById('student-ring-select').value = "";
    document.getElementById('name-save-result').style.display = 'none';
    if(window.showToast) window.showToast("تم حذف البيانات", "info");
    updateWelcomeMessage();
}

function updateWelcomeMessage() {
    const savedName = localStorage.getItem('studentName');
    const savedRing = localStorage.getItem('studentRing');
    const msgBox = document.getElementById('home-welcome-msg');
    
    // استرجاع البيانات للحقول في قسم البطاقة
    const nameInput = document.getElementById('student-name-input');
    const ringInput = document.getElementById('student-ring-select');
    if(nameInput && savedName) nameInput.value = savedName;
    if(ringInput && savedRing) ringInput.value = savedRing;

    if (savedName && msgBox) {
        msgBox.style.display = 'block';
        msgBox.innerHTML = `👋 أهلاً بك يا <strong>${savedName}</strong> في حلقات الثريا!`;
    } else if (msgBox) {
        msgBox.style.display = 'none';
    }
}

// 6. إرسال الإجابة عبر الواتساب (الميزة الجديدة)
function sendAnswerViaWhatsapp() {
    const name = localStorage.getItem('studentName') || "طالب (لم يسجل اسمه)";
    const ring = localStorage.getItem('studentRing') || "غير محدد";
    
    // جلب نص السؤال وتنظيفه
    const questionEl = document.getElementById('weekly-question-text');
    let questionText = "سؤال الأسبوع";
    if(questionEl) {
        // إزالة كلمة "سؤال الأسبوع:" المكررة إن وجدت
        questionText = questionEl.innerText.replace(/سؤال الأسبوع:|سؤال الأسبوع/g, "").trim();
    }

    // تجهيز الرسالة
    const message = `السلام عليكم ورحمة الله 🌙

👤 الطالب: ${name}
🕌 الحلقة: ${ring}

❓ سؤال الأسبوع:
${questionText}

✅ الإجابة:
(اكتب إجابتك هنا...)

-----------------------
مرسلة عبر: موقع حلقات الثريا الإلكتروني 📱`;

    // فتح الرابط
    const phone = "967777006546"; // رقم المشرف
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// 7. التهيئة العامة
document.addEventListener('DOMContentLoaded', () => {
    updateWelcomeMessage();
    
    // تفعيل القوائم المنسدلة
    const acc = document.getElementsByClassName("accordion-btn");
    for (let i = 0; i < acc.length; i++) {
        // استثناء الأزرار الخاصة (مصحف، أذكار) لأن لها دوال خاصة
        if (acc[i].getAttribute('onclick') && (acc[i].getAttribute('onclick').includes('openQuranApp') || acc[i].getAttribute('onclick').includes('loadAzkarCategories'))) continue;

        acc[i].addEventListener("click", function() {
            this.classList.toggle("active-acc");
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) panel.style.maxHeight = null;
            else panel.style.maxHeight = panel.scrollHeight + 800 + "px";
        });
    }

    // تعبئة البيانات (أخبار، معلمين، جداول)
    const navGrid = document.getElementById('nav-menu-grid');
    if(navGrid && typeof menus !== 'undefined') {
        menus.forEach(menu => {
            if(menu.id === 'home') return;
            const btn = document.createElement('button');
            btn.className = 'nav-btn'; 
            btn.innerText = menu.text;
            btn.onclick = () => showSection(menu.id);
            navGrid.appendChild(btn);
        });
    }

    if(typeof siteData !== 'undefined') {
        const newsList = document.getElementById('news-list');
        if(newsList) siteData.news.forEach(n => {
            newsList.innerHTML += `<div class="card ${n.winners.length > 0 ? 'clickable' : ''}" onclick="toggleWinners(${n.id})"><strong>📅 ${n.date}</strong><br>${n.text}${n.winners.length > 0 ? `<div id="win-${n.id}" class="winner-list">🎉 الفائزون: ${n.winners.join(' - ')}</div>` : ''}</div>`;
        });

        const tList = document.getElementById('teachers-list');
        if(tList) siteData.teachers.forEach(t => tList.innerHTML += `<div class="card"><strong>${t.name}</strong><br><span style="color:gray">${t.job}</span></div>`);

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

    if(typeof initCalculator === 'function') initCalculator();
    if(typeof initQuiz === 'function') initQuiz();
    startVerseTicker();
});

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
