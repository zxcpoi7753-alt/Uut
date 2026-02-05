/* ============================================================
   ملف: js/calculator.js (V30 - الإصدار المطور)
   الوظيفة: حسابات الختم مع ميزة تخطي الأجزاء والقيود الذكية
   ============================================================ */

let selectedDaysPerWeek = 0;

// 1. تهيئة الحاسبة عند التحميل
function initCalculator() {
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
}

function selectDays(days, btn) {
    selectedDaysPerWeek = days;
    document.querySelectorAll('#days-buttons-container .calc-btn-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('step-2-container').style.display = 'block';
}

// 2. دالة حساب الخطة (على جهدي)
window.calculatePlan = function(amount) {
    if(!selectedDaysPerWeek) { 
        showToast("يرجى اختيار عدد أيام الحفظ أولاً 📅", "error"); 
        return; 
    }

    let pages = parseFloat(amount) || 0;
    
    // القيود الذكية التي طلبتها
    if (pages < 0.1) pages = 0.1;
    if (pages > 1812) pages = 1812;
    
    // تحديث قيمة الحقل إذا كان المستخدم أدخل رقماً يدوياً
    const inputField = document.getElementById('custom-pages-input');
    if(inputField) inputField.value = pages;

    // حساب الصفحات المتبقية (تخطي الأجزاء)
    const skipJuzu = parseInt(document.getElementById('skip-juzu-calc1').value) || 0;
    const totalPagesToFinish = 604 - (skipJuzu * 20.13); // 20.13 هي متوسط صفحات الجزء
    
    const weeklyPages = pages * selectedDaysPerWeek;
    const totalWeeks = totalPagesToFinish / weeklyPages;
    const totalMonths = totalWeeks / 4.3;
    const totalYears = totalMonths / 12;

    renderResultCard('calc-result', pages, totalYears, totalMonths, skipJuzu, "حفظ");
};

// 3. دالة حساب الخطة العكسية (على وقتي)
window.calculateReversePlan = function() {
    const val = parseFloat(document.getElementById('target-val').value) || 0;
    const unit = document.getElementById('target-unit').value;
    const planType = document.querySelector('input[name="planType"]:checked').value;
    const skipJuzu = parseInt(document.getElementById('skip-juzu-calc2').value) || 0;

    if(val <= 0) { showToast("يرجى إدخال مدة صحيحة ⏳", "error"); return; }

    let totalDays = val;
    if(unit === 'months') totalDays = val * 30.4;
    if(unit === 'years') totalDays = val * 365;

    const totalPagesToFinish = 604 - (skipJuzu * 20.13);
    let dailyRequired = totalPagesToFinish / totalDays;

    // تطبيق القيود على النتيجة أيضاً
    if (dailyRequired < 0.1) dailyRequired = 0.1;
    
    renderResultCard('reverse-calc-result', dailyRequired.toFixed(1), null, null, skipJuzu, planType, true);
};

// 4. دالة رسم بطاقة النتيجة الجمالية
function renderResultCard(containerId, pages, years, months, skip, type, isReverse = false) {
    const container = document.getElementById(containerId);
    container.style.display = 'block';

    let timeText = "";
    if(!isReverse) {
        if (years >= 1) timeText = `⏳ ${Math.floor(years)} سنة و ${Math.round((years % 1) * 12)} شهر`;
        else timeText = `⏳ ${Math.ceil(months)} شهر تقريباً`;
    }

    let extraNote = pages >= 1812 ? "<div style='color:#d97706; font-weight:bold; margin-top:5px;'>🌟 ماشاء الله! لقد اخترت معدل (3 ختمات يومياً)</div>" : "";

    container.innerHTML = `
        <div class="result-card-inner">
            <h4 style="margin:0; color:var(--primary-color);">🎉 النتيجة المتوقعة</h4>
            <p style="font-size:0.9rem; color:gray; margin:5px 0;">بناءً على اختيارك لمعدل ${type}: <strong>${pages} صفحة</strong></p>
            ${skip > 0 ? `<p style="font-size:0.8rem; color:#047857;">✅ مع تخطي ${skip} أجزاء منجزة سلفاً.</p>` : ""}
            
            <div class="result-highlight">
                ${isReverse ? `المطلوب منك يومياً:<br><span style="font-size:1.4rem;">${pages} صفحة</span>` : `ستختم القرآن كاملاً بإذن الله خلال:<br><span>${timeText}</span>`}
            </div>
            
            ${extraNote}

            <div class="quran-verse-card">
                ﴿ وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ ﴾
            </div>
            
            <p style="font-size:0.85rem; margin-top:10px;">استعن بالله ولا تعجز 💪</p>
            <small style="color:gray;">نسأل الله أن يبارك في وقتك ويثبتك.</small>
        </div>
    `;
    
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// تهيئة الحاسبة فور تحميل الملف
initCalculator();
