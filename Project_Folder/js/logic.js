// js/logic.js - المحرك الرئيسي للموقع

// 1. نظام التنبيهات (Toast System) - بديل الـ alert
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // types: success, error, info
    toast.innerText = message;

    container.appendChild(toast);

    // الحذف التلقائي بعد 3 ثواني
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

// تجاوز الـ alert الافتراضي ليستخدم التنبيهات الجديدة
window.alert = function(msg) {
    showToast(msg, 'info');
};

// 2. الوضع الليلي
let isDarkMode = false;
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    document.getElementById('theme-btn').innerText = isDarkMode ? "🌙 ليلي" : "☀️ نهاري";
}

// 3. عند تحميل الصفحة (التهيئة الكاملة)
document.addEventListener('DOMContentLoaded', () => {
    
    // أ. استرجاع اسم الطالب
    if(typeof updateWelcomeMessage === 'function') updateWelcomeMessage();

    // ب. تفعيل القوائم المنسدلة (Accordions)
    const acc = document.getElementsByClassName("accordion-btn");
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active-acc");
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + 800 + "px"; // مساحة إضافية للمحتوى الديناميكي
            }
        });
    }

    // ج. بناء القائمة العلوية
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

    // د. عرض البيانات (إذا كانت data.js محملة)
    if(typeof siteData !== 'undefined') {
        
        // 1. الأخبار
        const newsList = document.getElementById('news-list');
        if(newsList) {
            siteData.news.forEach(n => {
                newsList.innerHTML += `
                    <div class="card ${n.winners.length > 0 ? 'clickable' : ''}" onclick="toggleWinners(${n.id})">
                        <strong>📅 ${n.date}</strong><br>${n.text}
                        ${n.winners.length > 0 ? `<div id="win-${n.id}" class="winner-list">🎉 الفائزون: ${n.winners.join(' - ')}</div>` : ''}
                    </div>`;
            });
        }

        // 2. المعلمون
        const tList = document.getElementById('teachers-list');
        if(tList) {
            siteData.teachers.forEach(t => {
                tList.innerHTML += `<div class="card"><strong>${t.name}</strong><br><span style="color:gray">${t.job}</span></div>`;
            });
        }

        // 3. الأوائل (التصميم الجديد بالميداليات) 🥇🥈🥉
        const ranksContainer = document.getElementById('ranks-list');
        if(ranksContainer) {
            siteData.ranks.forEach(r => {
                let studentsHtml = '';
                r.students.forEach((student, index) => {
                    let medal = '';
                    let rankClass = '';
                    
                    if(index === 0) { medal = '🥇'; rankClass = 'rank-1'; }
                    else if(index === 1) { medal = '🥈'; rankClass = 'rank-2'; }
                    else if(index === 2) { medal = '🥉'; rankClass = 'rank-3'; }

                    studentsHtml += `
                        <div class="student-row">
                            <span style="font-weight:bold;">${student}</span>
                            <span class="medal-icon ${rankClass}">${medal}</span>
                        </div>
                    `;
                });

                ranksContainer.innerHTML += `
                    <div class="card rank-card">
                        <div class="rank-header">
                            <div class="rank-icon-ring">🕌</div>
                            <h3 style="margin:0; color:var(--primary-color)">${r.ring}</h3>
                        </div>
                        ${studentsHtml}
                    </div>
                `;
            });
        }

        // 4. أزرار الجداول الدراسية
        const aftContainer = document.getElementById('ring-selectors-afternoon');
        if(aftContainer) {
            siteData.afternoonRings.forEach(ring => {
                const btn = document.createElement('button'); 
                btn.className = 'nav-btn'; 
                btn.innerText = ring.name;
                btn.onclick = () => createTable(ring.name, ring.time, false);
                aftContainer.appendChild(btn);
            });
        }

        const eveContainer = document.getElementById('ring-selectors-evening');
        if(eveContainer) {
            siteData.eveningRings.forEach(ring => {
                const btn = document.createElement('button'); 
                btn.className = 'nav-btn'; 
                btn.innerText = ring.name;
                btn.onclick = () => createTable(ring.name, ring.time, true);
                eveContainer.appendChild(btn);
            });
        }
    }

    // هـ. تشغيل الوحدات الأخرى (الحاسبة والاختبار)
    // سيتم تعريف هذه الدوال في ملفاتها الخاصة لاحقاً
    if(typeof initCalculator === 'function') initCalculator();
    if(typeof initQuiz === 'function') initQuiz();

    // و. شريط الآيات المتحرك
    const vDisp = document.getElementById('verse-display');
    if(vDisp && typeof verses !== 'undefined') {
        const showV = () => {
            vDisp.innerText = verses[Math.floor(Math.random() * verses.length)];
            vDisp.classList.add('visible');
            setTimeout(() => vDisp.classList.remove('visible'), 8000);
        };
        showV(); 
        setInterval(showV, 38000);
    }
});

// --- دوال مساعدة ---

function toggleWinners(id) { 
    const el = document.getElementById(`win-${id}`); 
    if(el) el.style.display = (el.style.display === 'block') ? 'none' : 'block'; 
}

function createTable(ringName, baseTime, isEvening) {
    const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    let tableHtml = `
        <div class="card" style="animation:fadeIn 0.5s">
            <h3 style="color:var(--primary-color); text-align:center; margin-bottom:10px;">📅 جدول ${ringName}</h3>
            <table>
                <thead><tr><th>اليوم</th><th>الوقت</th><th>النشاط</th></tr></thead>
                <tbody>
    `;
    
    days.forEach(day => {
        let timeDisplay = baseTime;
        if (isEvening && day === "الخميس") timeDisplay = "إلى أذان العشاء";
        tableHtml += `<tr><td>${day}</td><td>${timeDisplay}</td><td>حفظ ومراجعة</td></tr>`;
    });
    
    tableHtml += `</tbody></table></div>`;
    
    const displayArea = document.getElementById('schedule-display');
    displayArea.innerHTML = tableHtml;
    
    // تمرير الشاشة للجدول بسلاسة
    displayArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
