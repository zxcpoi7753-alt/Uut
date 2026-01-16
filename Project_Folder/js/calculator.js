// js/calculator.js - حاسبة الخطط القرآنية (نظام الأزرار)

let selectedDays = 0; // تخزين عدد الأيام المختارة

// 1. تهيئة الحاسبة (يتم استدعاؤها من logic.js)
function initCalculator() {
    renderDaysButtons();
    renderAmountButtons();
    
    // تهيئة حاسبة "دليل الختم" (القوائم المنسدلة)
    populateSelect("target-days", 1, 30, "يوم");
    populateSelect("target-months", 1, 12, "شهر");
    populateSelect("target-years", 1, 10, "سنة");
    
    // تعبئة خيارات التخطي
    const skipSelect = document.getElementById("skipped-parts");
    if(skipSelect && skipSelect.options.length <= 1) { // تجنب التكرار
        for(let i=1; i<=29; i++) {
            let option = document.createElement("option");
            option.value = i; option.text = i + " جزء";
            skipSelect.appendChild(option);
        }
    }
}

// 2. رسم أزرار الأيام
function renderDaysButtons() {
    const container = document.getElementById('days-buttons-container');
    if(!container) return;
    
    container.innerHTML = ''; // تنظيف
    const daysOptions = [
        { v: 1, t: "يوم واحد" }, { v: 2, t: "يومان" },
        { v: 3, t: "3 أيام" }, { v: 4, t: "4 أيام" },
        { v: 5, t: "5 أيام" }, { v: 6, t: "6 أيام" },
        { v: 7, t: "يومياً (7)" }
    ];

    daysOptions.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'calc-btn-option';
        btn.innerText = opt.t;
        btn.onclick = () => {
            // إزالة التحديد السابق
            document.querySelectorAll('#days-buttons-container .calc-btn-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            selectedDays = opt.v;
            
            // الانتقال للخطوة التالية
            document.getElementById('calc-step-2').style.display = 'block';
            
            // تمرير بسيط للأسفل
            setTimeout(() => {
                document.getElementById('calc-step-2').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        };
        container.appendChild(btn);
    });
}

// 3. رسم أزرار الكمية
function renderAmountButtons() {
    const container = document.getElementById('amount-buttons-container');
    if(!container) return;
    
    container.innerHTML = '';
    const amountsOptions = [
        { v: 0.5, t: "نصف صفحة" }, { v: 1, t: "صفحة واحدة" },
        { v: 2, t: "صفحتان" }, { v: 3, t: "3 صفحات" },
        { v: 4, t: "4 صفحات" }, { v: 10, t: "نصف جزء" },
        { v: 20, t: "جزء كامل" }
    ];

    amountsOptions.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'calc-btn-option';
        btn.innerText = opt.t;
        btn.onclick = () => calculatePlan(opt.v);
        container.appendChild(btn);
    });

    // زر "رقم آخر"
    const customBtn = document.createElement('div');
    customBtn.className = 'calc-btn-option';
    customBtn.innerText = "✏️ رقم آخر";
    customBtn.style.borderColor = "var(--accent-color)";
    customBtn.onclick = () => {
        document.getElementById('custom-amount-div').style.display = 'block';
    };
    container.appendChild(customBtn);
}

// 4. دالة الحساب (المنطق)
function calculatePlan(pagesPerDay) {
    pagesPerDay = parseFloat(pagesPerDay);
    if(!pagesPerDay || pagesPerDay <= 0) {
        if(window.showToast) window.showToast("الرجاء اختيار رقم صحيح", "error");
        else alert("الرجاء اختيار رقم صحيح");
        return;
    }

    const totalPages = 604;
    const weeklyPages = selectedDays * pagesPerDay;
    const weeksNeeded = totalPages / weeklyPages;
    const totalDaysNeeded = Math.ceil(weeksNeeded * 7);
    
    let durationText = "";
    if (totalDaysNeeded < 30) durationText = `${totalDaysNeeded} يوم`;
    else if (totalDaysNeeded < 365) {
        const months = Math.floor(totalDaysNeeded / 30);
        const days = totalDaysNeeded % 30;
        durationText = `${months} شهر و ${days} يوم`;
    } else {
        const years = Math.floor(totalDaysNeeded / 365);
        const months = Math.floor((totalDaysNeeded % 365) / 30);
        durationText = `${years} سنة و ${months} شهر`;
    }

    const resultDiv = document.getElementById('calc-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <h3>🎉 النتيجة المتوقعة</h3>
        <p>معدل الحفظ الأسبوعي: <strong>${weeklyPages} صفحات</strong></p>
        <p style="font-size:1.2rem; color:var(--primary-color); font-weight:bold;">
            ستختم القرآن كاملاً بإذن الله خلال:<br>
            ⏳ ${durationText}
        </p>
        <p style="font-size:0.9rem; color:gray">استعن بالله ولا تعجز 💪</p>
    `;
    
    // إخفاء الخيارات وإظهار زر إعادة الحساب
    document.getElementById('calc-step-2').style.display = 'none';
    document.getElementById('calc-step-1').style.display = 'none';
    document.getElementById('reset-calc').style.display = 'block';
    
    // تكبير اللوحة
    const panel = resultDiv.closest('.accordion-panel');
    panel.style.maxHeight = panel.scrollHeight + 500 + "px";
}

// 5. إعادة تعيين الحاسبة
function resetCalc() {
    selectedDays = 0;
    document.getElementById('calc-result').style.display = 'none';
    document.getElementById('reset-calc').style.display = 'none';
    document.getElementById('calc-step-2').style.display = 'none';
    document.getElementById('custom-amount-div').style.display = 'none';
    document.getElementById('calc-step-1').style.display = 'block';
    document.getElementById('custom-pages').value = '';
    
    // إزالة التحديد
    document.querySelectorAll('.calc-btn-option').forEach(b => b.classList.remove('selected'));

    const panel = document.getElementById('calc-step-1').closest('.accordion-panel');
    panel.style.maxHeight = panel.scrollHeight + "px";
}

// 6. دوال مساعدة لحاسبة الدليل العكسي
function populateSelect(id, min, max, labelSuffix) {
    const select = document.getElementById(id);
    if(!select || select.options.length > 1) return; // منع التكرار
    
    let optionZero = document.createElement("option");
    optionZero.value = 0; optionZero.text = "0 " + labelSuffix; select.appendChild(optionZero);
    for(let i=min; i<=max; i++) {
        let option = document.createElement("option");
        option.value = i; option.text = i + " " + labelSuffix; select.appendChild(option);
    }
}

function calculateReversePlan() {
    const days = parseInt(document.getElementById('target-days').value) || 0;
    const months = parseInt(document.getElementById('target-months').value) || 0;
    const years = parseInt(document.getElementById('target-years').value) || 0;
    const skipped = parseInt(document.getElementById('skipped-parts').value) || 0;
    const planType = document.querySelector('input[name="planType"]:checked').value;
    
    const totalDaysAvailable = days + (months * 30) + (years * 365);
    
    if (totalDaysAvailable === 0) { 
        if(window.showToast) showToast("يرجى اختيار مدة زمنية", "error");
        else alert("يرجى اختيار مدة زمنية");
        return; 
    }

    const remainingParts = 30 - skipped;
    const totalPages = remainingParts * 20;
    const dailyPages = totalPages / totalDaysAvailable;
    let amountText = "";

    if(dailyPages >= 20) amountText = `<strong>${(dailyPages/20).toFixed(1)} جزء</strong> يومياً`;
    else if (dailyPages >= 1) amountText = `<strong>${Math.ceil(dailyPages)} صفحات</strong> يومياً`;
    else { const lines = Math.ceil(dailyPages * 15); amountText = `<strong>${lines} أسطر</strong> يومياً`; }

    const resultDiv = document.getElementById('reverse-calc-result');
    resultDiv.style.display = "block";
    
    // تحديث ارتفاع اللوحة
    const panel = resultDiv.closest('.accordion-panel');
    panel.style.maxHeight = panel.scrollHeight + 500 + "px";
    
    resultDiv.innerHTML = `<h3>🎯 خطتك المقترحة</h3><p>المطلوب منك (${planType}) بمعدل:</p><div style="font-size:1.5rem; color:var(--primary-color); margin:10px 0;">${amountText}</div>`;
}
