/* ============================================================
   ملف: js/custom_logic.js
   الوظيفة: تشغيل الصفحة الرئيسية + تسجيل الدخول الآمن
   ============================================================ */

// 1. إعدادات فايربيس (نفس الإعدادات الجديدة بالضبط)
const firebaseConfig = {
  apiKey: "AIzaSyBm8ML-1EKvQT76FJlzIQf4sn4M-MHhiRk",
  authDomain: "quran-app-93e24.firebaseapp.com",
  projectId: "quran-app-93e24",
  storageBucket: "quran-app-93e24.firebasestorage.app",
  messagingSenderId: "82150677933",
  appId: "1:82150677933:web:64213e04463c1bb3179524"
};

// تهيئة فايربيس
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const auth = firebase.auth();

// ==========================================
// 2. كود جلب البيانات للصفحة الرئيسية (للزوار)
// ==========================================
const elements = {
    headerTitle: document.getElementById('header-title'),
    headerSubtitle: document.getElementById('header-subtitle'),
    headerLocation: document.getElementById('header-location'),
    videoSource: document.getElementById('video-source'),
    bgVideo: document.getElementById('bg-video'),
    newsText: document.getElementById('news-text'),
    qText: document.getElementById('question-text'),
    qWinner: document.getElementById('winner-name'),
    aboutContent: document.getElementById('about-content'),
    btnsContainer: document.getElementById('dynamic-btns-container'),
    teachersList: document.getElementById('teachers-list-v2'),
    ranksList: document.getElementById('ranks-list'),
    scheduleList: document.getElementById('complex-schedule-container'),
    holidaysList: document.getElementById('holidays-ticker')
};

// الاستماع للبيانات الحية
db.ref().on('value', (snapshot) => {
    const d = snapshot.val();
    if (!d) return;

    // النصوص الأساسية
    if (d.site_content) {
        if (elements.headerTitle) elements.headerTitle.innerText = d.site_content.txt_header_title || "حلقات النور";
        if (elements.headerSubtitle) elements.headerSubtitle.innerText = d.site_content.txt_header_subtitle || "لتعليم القرآن الكريم";
        if (elements.headerLocation) elements.headerLocation.innerText = d.site_content.txt_header_location || "المسجد";
        if (elements.aboutContent) elements.aboutContent.innerHTML = (d.site_content.txt_about_content || "").replace(/\n/g, '<br>');
    }

    // الفيديو
    if (d.settings && d.settings.video_url && elements.videoSource) {
        if (elements.videoSource.src !== d.settings.video_url) {
            elements.videoSource.src = d.settings.video_url;
            elements.bgVideo.load();
        }
    }

    // شريط الأخبار والسؤال
    if (d.news_bar && elements.newsText) elements.newsText.innerText = d.news_bar.text || "أهلاً بكم...";
    if (d.weekly_question) {
        if (elements.qText) elements.qText.innerText = d.weekly_question.text || "...";
        if (elements.qWinner) elements.qWinner.innerText = d.weekly_question.last_winner || "...";
    }

    // الإشعار المنبثق
    if(d.settings && d.settings.popup_active) {
        // يمكنك تفعيل كود الإشعار هنا إذا كان لديك عنصر له في الـ HTML
    }

    // القوائم (البطاقات، المعلمين، الأوائل)
    renderHomeList(elements.btnsContainer, d.custom_cards, 'card');
    renderHomeList(elements.teachersList, d.teachers_list_v2, 'teacher');
    renderHomeList(elements.ranksList, d.ranks_list, 'rank');
    renderHomeList(elements.holidaysList, d.holidays_list, 'holiday');
    renderHomeSchedule(elements.scheduleList, d.schedule_complex);
    
    // إخفاء الأقسام حسب الإعدادات
    if(d.settings) {
        toggleSection('news-bar', d.settings.show_news);
        toggleSection('weekly-question', d.settings.show_question);
        toggleSection('student-registration', d.settings.show_student);
        toggleSection('top-students', d.settings.show_ranks);
        toggleSection('schedule-section', d.settings.show_schedule);
        toggleSection('teachers-section', d.settings.show_teachers);
    }
});

// ==========================================
// 3. كود تسجيل الدخول (الحصري والآمن) 🔐
// ==========================================

// دالة فتح/غلق نافذة الدخول
function toggleLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
    }
}

// دالة التحقق من الدخول
function checkLogin() {
    const email = document.getElementById('admin_email').value; // تأكد أن الـ ID في الـ HTML هو admin_email
    const pass = document.getElementById('admin_pass').value;   // تأكد أن الـ ID في الـ HTML هو admin_pass
    const btn = document.querySelector('.btn-login');

    if(!email || !pass) {
        alert("الرجاء كتابة البريد وكلمة المرور");
        return;
    }

    // تغيير نص الزر ليعرف المستخدم أن شيئاً يحدث
    const originalText = btn.innerHTML;
    btn.innerHTML = "جاري التحقق... ⏳";

    // الاتصال بفايربيس
    auth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            // ✅ نجح الدخول
            console.log("Logged in:", userCredential.user.email);
            btn.innerHTML = "✅ تم الدخول!";
            setTimeout(() => {
                window.location.href = "admin.html"; // الانتقال لصفحة الأدمن
            }, 1000);
        })
        .catch((error) => {
            // ❌ فشل الدخول
            console.error(error);
            let msg = "خطأ في الدخول!";
            if(error.code === 'auth/user-not-found') msg = "هذا المستخدم غير موجود";
            if(error.code === 'auth/wrong-password') msg = "كلمة المرور خاطئة";
            if(error.code === 'auth/invalid-email') msg = "صيغة البريد غير صحيحة";
            
            alert("⛔ " + msg);
            btn.innerHTML = originalText; // إعادة الزر كما كان
        });
}

// ==========================================
// 4. دوال مساعدة للعرض (Render Helpers)
// ==========================================
function renderHomeList(container, data, type) {
    if(!container) return;
    container.innerHTML = '';
    if(!data) return;

    Object.values(data).forEach(item => {
        if(type === 'card' && item.active) {
            container.innerHTML += `
                <a href="${item.link}" class="main-btn" style="background:${item.color}">
                    <h3>${item.title}</h3>
                    <p>${item.text}</p>
                    <span>${item.btn_text} <i class="fas fa-arrow-left"></i></span>
                </a>`;
        } else if(type === 'teacher') {
            container.innerHTML += `
                <div class="teacher-card">
                    <div class="icon"><i class="fas fa-user-tie"></i></div>
                    <h3>${item.name}</h3>
                    <p>${item.role}</p>
                </div>`;
        } else if(type === 'rank') {
            container.innerHTML += `
                <div class="rank-card">
                    <div class="rank-badge">#${item.rank}</div>
                    <h3>${item.name}</h3>
                    <p>${item.ring}</p>
                </div>`;
        } else if(type === 'holiday') {
            container.innerHTML += `<div class="ticker-item"><i class="fas fa-star"></i> ${item.text}</div>`;
        }
    });
}

function renderHomeSchedule(container, data) {
    if(!container || !data) return;
    container.innerHTML = '';
    
    Object.keys(data).sort().forEach(timeKey => {
        if(data[timeKey].rings) {
            let html = `<div class="schedule-block"><h3>${data[timeKey].title || 'حلقات'}</h3><div class="table-wrapper"><table><thead><tr><th>الحلقة</th><th>السبت</th><th>الأحد</th><th>الاثنين</th><th>الثلاثاء</th><th>الأربعاء</th><th>الخميس</th></tr></thead><tbody>`;
            
            Object.values(data[timeKey].rings).forEach(ring => {
                html += `<tr>
                    <td class="ring-name">${ring.name}</td>
                    <td>${ring.sat || '-'}</td><td>${ring.sun || '-'}</td>
                    <td>${ring.mon || '-'}</td><td>${ring.tue || '-'}</td>
                    <td>${ring.wed || '-'}</td><td>${ring.thu || '-'}</td>
                </tr>`;
            });
            html += `</tbody></table></div></div>`;
            container.innerHTML += html;
        }
    });
}

function toggleSection(id, show) {
    const el = document.getElementById(id);
    if(el) el.style.display = show ? 'block' : 'none';
}
