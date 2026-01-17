// js/quiz.js

let quranData = null;
let pagesData = null;
let currentQuestion = null;

document.addEventListener("DOMContentLoaded", () => {
    loadQuranData();
});

async function loadQuranData() {
    try {
        const quranRes = await fetch("data/quran.json");
        const pagesRes = await fetch("data/pagesquran.json");

        if (!quranRes.ok || !pagesRes.ok) {
            throw new Error("فشل تحميل بيانات القرآن");
        }

        quranData = await quranRes.json();
        pagesData = await pagesRes.json();

        populateQuizJuz();
    } catch (err) {
        console.error(err);
        alert("تعذر تحميل بيانات القرآن");
    }
}

function populateQuizJuz() {
    const juzSelect = document.getElementById("quiz-juz");
    juzSelect.innerHTML = '<option value="all">كل الأجزاء</option>';

    for (let i = 1; i <= 30; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "الجزء " + i;
        juzSelect.appendChild(opt);
    }
}

function startQuiz() {
    if (!quranData) return;

    const filtered = quranData.filter(a => a.text && a.text.length > 5);
    currentQuestion = filtered[Math.floor(Math.random() * filtered.length)];

    document.getElementById("question-text").innerHTML =
        `<span class="quran-verse">${currentQuestion.text}</span>`;

    document.getElementById("answer-box").style.display = "none";
}

function showAnswer() {
    document.getElementById("answer-box").style.display = "block";
}
