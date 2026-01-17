// js/logic.js

let khatmaShown = false;
let currentPage = null;

/* =========================
   المصحف (الصفحات)
========================= */

function openQuranPage(page) {
    currentPage = page;
    saveLastPage(page);

    const pageBox = document.getElementById("quran-page-box");
    if (!pageBox) return;

    pageBox.textContent = "الصفحة رقم " + page;
    pageBox.classList.add("open");

    if (page >= 604) {
        showKhatmaDua();
    }
}

function resumeReading() {
    const page = getLastPage();
    if (!page) {
        alert("لم تحفظ مكانًا بعد");
        return;
    }
    openQuranPage(parseInt(page));
}

/* =========================
   دعاء الختمة (مرة واحدة)
========================= */

function showKhatmaDua() {
    if (khatmaShown) return;
    khatmaShown = true;

    const duaBox = document.getElementById("khatma-dua");
    if (!duaBox) return;

    duaBox.innerHTML = `
        <p>اللهم تقبل منا تلاوة القرآن،</p>
        <p>واجعله حجةً لنا لا علينا،</p>
        <p>وارزقنا العمل به آناء الليل وأطراف النهار.</p>
    `;
    duaBox.style.display = "block";
}

/* =========================
   السهم (فقط للمصحف)
========================= */

function togglePage(el) {
    // لا يعمل إلا داخل المصحف
    if (!el.closest(".mushaf")) return;
    el.classList.toggle("open");
}

/* =========================
   بقية الأقسام
========================= */

function toggleSections() {
    const section = document.getElementById("sections-rest");
    if (!section) return;

    section.classList.toggle("open");
}

/* =========================
   الوضع الليلي
========================= */

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}
