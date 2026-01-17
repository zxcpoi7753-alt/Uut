// js/calculator.js - حاسبة الختم الذكية (الاتجاهين)

// متغيرات لحفظ خيارات المستخدم للحاسبة الأولى
let selectedDaysPerWeek = 0;
let selectedAmount = 0;

// 1. تهيئة القوائم المنسدلة عند التحميل
function initCalculator() {
    // تعبئة أزرار الأيام (الحاسبة الأولى)
    const daysContainer = document.getElementById('days-buttons-container');
    if(daysContainer) {
        daysContainer.innerHTML = '';
        [1, 2, 3, 4, 5, 6, 7].forEach(d => {
            daysContainer.innerHTML += `<div class="calc-btn-option" onclick="selectDays(${d}, this)">${d} أيام</div>`;
        });
    }

    // تعبئة أزرار المقدار (الحاسبة الأولى)
    const amountContainer = document.getElementById('amount-buttons-container');
    if(amountContainer) {
        amountContainer.innerHTML = '';
        const amounts = [
            { label: "وجه واحد", val: 1 },
            { label: "صفحة واحدة", val: 2 }, // الصفحة وجهين في الغالب، أو حسب الاصطلاح (هنا نعتبرها صفحة كاملة ورقة واحدة = وجهين؟ عادة في الحلقات الصفحة = وجه. سأفترض الصفحة = 1 والورقة = 2. لكن للتسهيل سأجعل القيم واضحة)
            // سأعتمد: الصفحة = وجه واحد (المعيار الشائع)
            // لتفادي اللبس سأسميها بوضوح
            { label: "وجه (صفحة)", val: 1 },
            { label: "ورقة (وجهين)", val: 2 },
            { label: "ربع حزب", val: 5 },
            { label: "نصف حزب", val: 10 }
        ];
        
        amounts.forEach(opt => {
            amountContainer.innerHTML += `<div class="calc-btn-option" onclick="selectAmount(${opt.val}, this)">${opt.label}</div>`;
        });
        // زر "محدد" لإظهار حقل الإدخال اليدوي
        amountContainer.innerHTML += `<div class="calc-btn-option" onclick="showCustomInput(this)">عدد آخر...</div>`;
    }

    // تعبئة قوائم الوقت (الحاسبة العكسية)
    populateDropdown('target-days', 0, 30, ' يوم');
    populateDropdown('target-months', 0, 11, ' شهر');
    populateDropdown('target-years', 0, 5, ' سنة');
}

function populateDropdown(id, start, end, suffix) {
    const el = document.getElementById(id);
    if(!el) return;
    el.innerHTML = `<option value="0">0${suffix}</option>`;
    for(let i=1; i<=end; i++) { // بدأنا من 1 لأن 0 مضاف
        el.innerHTML += `<option value="${i}">${i}${suffix}</option>`;
    }
}


// --- منطق الحاسبة الأولى (بناءً على الجهد) ---

function selectDays(days, btn) {
    selectedDaysPerWeek = days;
    // تلوين الزر المختار
    document.querySelectorAll('#days-buttons-container .calc-btn-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    
    // الانتقال للخطوة 2
    document.getElementById('calc-step-2').style.display = 'block';
    // تمرير ناعم
    document.getElementById('calc-step-2').scrollIntoView({behavior: 'smooth'});
}

function selectAmount(amount, btn) {
    selectedAmount = amount;
    document.getElementById('custom-amount-div').style.display = 'none'; // إخفاء المخصص
    
    document.querySelectorAll('#amount-buttons-container .calc-btn-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    
    calculatePlan(selectedAmount);
}

function showCustomInput(btn) {
    document.querySelectorAll('#amount-buttons-container .calc-btn-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('custom-amount-div').style.display = 'block';
}

function calculatePlan(pagesPerDay) {
    if(!selectedDaysPerWeek || !pagesPerDay) return;
    
    const totalPages = 604;
    const pagesPerWeek = pagesPerDay * selectedDaysPerWeek;
    const weeksNeeded = totalPages / pagesPerWeek;
    const monthsNeeded = weeksNeeded / 4.3;
    const yearsNeeded = monthsNeeded / 12;

    let timeText = "";
    if (yearsNeeded >= 1) {
        const y = Math.floor(yearsNeeded);
        const m = Math.round((yearsNeeded - y) * 12);
        timeText = `${y} سنة و ${m} شهر`;
    } else if (monthsNeeded >= 1) {
        timeText = `${Math.round(monthsNeeded)} شهر تقريباً`;
    } else {
        timeText = `${Math.round(weeksNeeded)} أسبوع تقريباً`;
    }

    const resDiv = document.getElementById('calc-result');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `
        <h3 style="color:var(--primary-color); margin-top:0;">🎉 خطتك جاهزة!</h3>
        <p>إذا استمريت بهذا المعدل، ستختم القرآن كاملاً خلال:</p>
        <p style="font-size:1.5rem; color:var(--accent-color); margin:10px 0;">⏳ ${timeText}</p>
        <small style="color:gray">بمعدل ${selectedDaysPerWeek} أيام في الأسبوع</small>
    `;
    
    document.getElementById('reset-calc').style.display = 'block';
    resDiv.scrollIntoView({behavior: 'smooth'});
}

function resetCalc() {
    selectedDaysPerWeek = 0;
    selectedAmount = 0;
    document.getElementById('calc-step-2').style.display = 'none';
    document.getElementById('calc-result').style.display = 'none';
    document.getElementById('reset-calc').style.display = 'none';
    document.querySelectorAll('.calc-btn-option').forEach(b => b.classList.remove('selected'));
    document.getElementById('custom-pages').value = '';
    document.getElementById('custom-amount-div').style.display = 'none';
    // العودة للأعلى
    document.getElementById('calc-step-1').scrollIntoView({behavior: 'smooth'});
}


// --- منطق الحاسبة العكسية (بناءً على الوقت) [تم إصلاحها] ---

function calculateReversePlan() {
    // جلب القيم
    const planTypeInputs = document.getElementsByName('planType');
    let planType = "حفظ"; // افتراضي
    for(let r of planTypeInputs) if(r.checked) planType = r.value;

    const d = parseInt(document.getElementById('target-days').value) || 0;
    const m = parseInt(document.getElementById('target-months').value) || 0;
    const y = parseInt(document.getElementById('target-years').value) || 0;

    // حساب إجمالي الأيام
    const totalDaysTarget = d + (m * 30) + (y * 365);

    if (totalDaysTarget === 0) {
        if(window.showToast) window.showToast("الرجاء تحديد المدة أولاً!", "error");
        return;
    }

    const totalPagesQuran = 604;
    // المعادلة: الكمية اليومية = عدد صفحات المصحف / عدد الأيام المتاحة
    const pagesPerDay = totalPagesQuran / totalDaysTarget;

    // تنسيق النتيجة للنص
    let resultAmountText = "";
    
    if (pagesPerDay < 1) {
        // إذا كان أقل من صفحة (مثلاً نصف صفحة)
        const percent = Math.round(pagesPerDay * 100);
        resultAmountText = `حوالي <strong>${percent}%</strong> من الصفحة`;
    } else {
        resultAmountText = `حوالي <strong>${pagesPerDay.toFixed(1)}</strong> صفحة`;
    }

    // صياغة الرسالة حسب النوع (حفظ/قراءة)
    let actionVerb = planType === "حفظ" ? "تحفظ" : "تقرأ";
    let titleText = planType === "حفظ" ? "🧠 خطة الحفظ المقترحة" : "📖 خطة القراءة المقترحة";

    // عرض النتيجة (بنفس تصميم الحاسبة الأولى)
    const resultDiv = document.getElementById('reverse-calc-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <h3 style="color:var(--primary-color); margin-top:0;">${titleText}</h3>
        <p>لكي تختم القرآن في هذه المدة، عليك أن ${actionVerb} يومياً:</p>
        <p style="font-size:1.5rem; color:var(--accent-color); margin:10px 0;">${resultAmountText}</p>
        <div style="font-size:0.9rem; color:gray; border-top:1px solid rgba(0,0,0,0.1); padding-top:5px; margin-top:5px;">
            المدة المحددة: ${y > 0 ? y + ' سنة ' : ''}${m > 0 ? m + ' شهر ' : ''}${d > 0 ? d + ' يوم' : ''}
        </div>
    `;
    
    // تمرير للنتيجة
    resultDiv.scrollIntoView({behavior: 'smooth'});
}
