/* ============================================================
   ملف: js/calculator.js (الأصلي)
   الوظيفة: حسابات خطة الختم ودليل الختم
   ============================================================ */

let selectedDaysPerWeek = 0;

// تشغيل عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    initCalculator();
});

function initCalculator() {
    // تعبئة أزرار الأيام
    const daysContainer = document.getElementById('days-buttons-container');
    if(daysContainer) {
        daysContainer.innerHTML = '';
        [1, 2, 3, 4, 5, 6, 7].forEach(d => {
            const btn = document.createElement('div');
            btn.className = 'calc-btn-option';
            btn.innerText = `${d} أيام`;
            btn.onclick = function() { selectDays(d, this); };
            daysContainer.appendChild(btn);
        });
    }

    // تعبئة أزرار المقدار
    const amountContainer = document.getElementById('amount-buttons-container');
    if(amountContainer) {
        amountContainer.innerHTML = '';
        const amounts = [
            {l:"نصف صفحة", v:0.5}, {l:"صفحة واحدة", v:1}, {l:"صفحتان", v:2},
            {l:"3 صفحات", v:3}, {l:"4 صفحات", v:4}, {l:"5 صفحات", v:5}
        ];
        amounts.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'calc-btn-option';
            btn.innerText = opt.l;
            btn.onclick = function() { calculatePlan(opt.v); };
            amountContainer.appendChild(btn);
        });
    }
    
    // تعبئة القوائم المنسدلة لدليل الختم
    populateSelect('target-days', 30, 'يوم');
    populateSelect('target-months', 12, 'شهر');
    populateSelect('target-years', 5, 'سنة');
}

function populateSelect(id, max, label) {
    const sel = document.getElementById(id);
    if(!sel) return;
    sel.innerHTML = `<option value="0">0 ${label}</option>`;
    for(let i=1; i<=max; i++) sel.innerHTML += `<option value="${i}">${i} ${label}</option>`;
}

function selectDays(days, btn) {
    selectedDaysPerWeek = days;
    document.querySelectorAll('#days-buttons-container .calc-btn-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('step-2-container').style.display = 'block';
}

// دالة الحساب (ختمتي)
window.calculatePlan = function(amount) {
    if(!selectedDaysPerWeek) { alert("اختر عدد الأيام أولاً"); return; }
    
    const totalPages = 604;
    const pagesPerWeek = amount * selectedDaysPerWeek;
    const weeksNeeded = totalPages / pagesPerWeek;
    const monthsNeeded = weeksNeeded / 4.3;
    const yearsNeeded = monthsNeeded / 12;

    let timeText = "";
    if (yearsNeeded >= 1) {
        timeText = `${Math.floor(yearsNeeded)} سنة و ${Math.round((yearsNeeded%1)*12)} شهر`;
    } else {
        timeText = `${Math.round(monthsNeeded)} شهر تقريباً`;
    }

    const resDiv = document.getElementById('calc-result');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `<strong>النتيجة:</strong><br>ستختم خلال <strong>${timeText}</strong> بإذن الله.<br><small>(بمعدل ${amount} صفحة، ${selectedDaysPerWeek} أيام أسبوعياً)</small>`;
    document.getElementById('reset-calc').style.display = 'block';
}

window.resetCalc = function() {
    selectedDaysPerWeek = 0;
    document.getElementById('step-2-container').style.display = 'none';
    document.getElementById('calc-result').style.display = 'none';
    document.getElementById('reset-calc').style.display = 'none';
    document.querySelectorAll('.calc-btn-option').forEach(b => b.classList.remove('selected'));
}

// دالة الحساب العكسي (دليلي)
window.calculateReversePlan = function() {
    const d = parseInt(document.getElementById('target-days').value) || 0;
    const m = parseInt(document.getElementById('target-months').value) || 0;
    const y = parseInt(document.getElementById('target-years').value) || 0;

    let totalDays = d + (m * 30) + (y * 365);
    if(totalDays === 0) return alert("اختر المدة أولاً");

    const totalPages = 604;
    const daily = totalPages / totalDays;
    
    const resDiv = document.getElementById('reverse-calc-result');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `لختم القرآن في هذه المدة، عليك قراءة:<br><strong style="font-size:1.2rem; color:var(--primary-color)">${daily.toFixed(1)} صفحة يومياً</strong>`;
}
