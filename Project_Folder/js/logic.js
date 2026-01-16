// js/logic.js - المنطق الرئيسي والربط
let isDarkMode = false;
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    document.getElementById('theme-btn').innerText = isDarkMode ? "🌙 ليلي" : "☀️ نهاري";
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    // 1. استرجاع الاسم
    updateWelcomeMessage();

    // 2. تفعيل القوائم المنسدلة
    const acc = document.getElementsByClassName("accordion-btn");
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active-acc");
            const panel = this.nextElementSibling;
            panel.style.maxHeight = panel.style.maxHeight ? null : panel.scrollHeight + 500 + "px";
        });
    }

    // 3. بناء القائمة العلوية
    const navContainer = document.getElementById('nav-buttons');
    if(navContainer && typeof menus !== 'undefined') {
        menus.forEach(menu => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn'; btn.innerText = menu.text;
            btn.onclick = () => {
                document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
                const target = document.getElementById(`section-${menu.id}`);
                if(target) target.classList.add('active');
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            navContainer.appendChild(btn);
        });
        if(navContainer.firstChild) navContainer.firstChild.classList.add('active');
    }

    // 4. تعبئة القوائم (من data.js)
    if(typeof siteData !== 'undefined') {
        // الأخبار
        const newsList = document.getElementById('news-list');
        if(newsList) siteData.news.forEach(n => {
            newsList.innerHTML += `<div class="card ${n.winners.length > 0 ? 'clickable' : ''}" onclick="toggleWinners(${n.id})"><strong>📅 ${n.date}</strong><br>${n.text}${n.winners.length > 0 ? `<div id="win-${n.id}" class="winner-list">الفائزون: ${n.winners.join(' - ')}</div>` : ''}</div>`;
        });
        // المعلمون
        const tList = document.getElementById('teachers-list');
        if(tList) siteData.teachers.forEach(t => tList.innerHTML += `<div class="card"><strong>${t.name}</strong><br><span style="color:gray">${t.job}</span></div>`);
    }

    // 5. تهيئة الحاسبة والاختبار
    if(typeof populateSelect === 'function') {
        populateSelect("target-days", 1, 30, "يوم");
        populateSelect("target-months", 1, 12, "شهر");
        populateSelect("target-years", 1, 10, "سنة");
    }
    if(typeof initQuiz === 'function') initQuiz();

    // 6. شريط الآيات
    const vDisp = document.getElementById('verse-display');
    if(vDisp && typeof verses !== 'undefined') {
        const showV = () => {
            vDisp.innerText = verses[Math.floor(Math.random() * verses.length)];
            vDisp.classList.add('visible');
            setTimeout(() => vDisp.classList.remove('visible'), 8000);
        };
        showV(); setInterval(showV, 38000);
    }
});

// دوال مساعدة عامة
function toggleWinners(id) { const el = document.getElementById(`win-${id}`); if(el) el.style.display = (el.style.display === 'block') ? 'none' : 'block'; }
function createTable(ringName, baseTime, isEvening) { /* (نفس كود الجدول السابق) */ 
    let days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    let table = `<h3>جدول ${ringName}</h3><table><thead><tr><th>اليوم</th><th>الوقت</th><th>الملاحظة</th></tr></thead><tbody>`;
    days.forEach(day => {
        let timeDisplay = baseTime;
        if (isEvening && day === "الخميس") timeDisplay = "إلى أذان العشاء";
        table += `<tr><td>${day}</td><td>${timeDisplay}</td><td>حفظ ومراجعة</td></tr>`;
    });
    document.getElementById('schedule-display').innerHTML = table + `</tbody></table>`;
}
