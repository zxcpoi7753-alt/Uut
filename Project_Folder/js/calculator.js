// js/calculator.js - حاسبة الخطط القرآنية
let selectedDays = 0;

function populateSelect(id, min, max, labelSuffix) {
    const select = document.getElementById(id);
    if(!select) return;
    let optionZero = document.createElement("option");
    optionZero.value = 0; optionZero.text = "0 " + labelSuffix; select.appendChild(optionZero);
    for(let i=min; i<=max; i++) {
        if(i===0) continue;
        let option = document.createElement("option");
        option.value = i; option.text = i + " " + labelSuffix; select.appendChild(option);
    }
}

function calculatePlan(pagesPerDay) {
    pagesPerDay = parseFloat(pagesPerDay);
    if(!pagesPerDay || pagesPerDay <= 0) return alert("الرجاء إدخال رقم صحيح");

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
    resultDiv.innerHTML = `<h3>🎉 النتيجة المتوقعة</h3><p>معدل الحفظ الأسبوعي: <strong>${weeklyPages} صفحات</strong></p><p style="font-size:1.2rem; color:var(--primary-color); font-weight:bold;">ستختم القرآن كاملاً بإذن الله خلال:<br>⏳ ${durationText}</p>`;
    
    document.getElementById('calc-step-2').style.display = 'none';
    document.getElementById('reset-calc').style.display = 'block';
    const panel = resultDiv.closest('.accordion-panel');
    panel.style.maxHeight = panel.scrollHeight + "px";
}

function resetCalc() {
    selectedDays = 0;
    document.getElementById('calc-result').style.display = 'none';
    document.getElementById('reset-calc').style.display = 'none';
    document.getElementById('calc-step-2').style.display = 'none';
    document.getElementById('custom-amount-div').style.display = 'none';
    document.getElementById('calc-step-1').style.display = 'block';
    document.getElementById('custom-pages').value = '';
    const panel = document.getElementById('calc-step-1').closest('.accordion-panel');
    panel.style.maxHeight = panel.scrollHeight + "px";
}

function calculateReversePlan() {
    const days = parseInt(document.getElementById('target-days').value) || 0;
    const months = parseInt(document.getElementById('target-months').value) || 0;
    const years = parseInt(document.getElementById('target-years').value) || 0;
    const skipped = parseInt(document.getElementById('skipped-parts').value) || 0;
    const planType = document.querySelector('input[name="planType"]:checked').value;
    const totalDaysAvailable = days + (months * 30) + (years * 365);
    
    if (totalDaysAvailable === 0) { alert("يرجى اختيار مدة زمنية"); return; }

    const remainingParts = 30 - skipped;
    const totalPages = remainingParts * 20;
    const dailyPages = totalPages / totalDaysAvailable;
    let amountText = "";

    if(dailyPages >= 20) amountText = `<strong>${(dailyPages/20).toFixed(1)} جزء</strong> يومياً`;
    else if (dailyPages >= 1) amountText = `<strong>${Math.ceil(dailyPages)} صفحات</strong> يومياً`;
    else { const lines = Math.ceil(dailyPages * 15); amountText = `<strong>${lines} أسطر</strong> يومياً`; }

    const resultDiv = document.getElementById('reverse-calc-result');
    resultDiv.style.display = "block";
    resultDiv.closest('.accordion-panel').style.maxHeight = resultDiv.closest('.accordion-panel').scrollHeight + 500 + "px"; 
    resultDiv.innerHTML = `<h3>🎯 خطتك المقترحة</h3><p>المطلوب منك (${planType}) بمعدل:</p><div style="font-size:1.5rem; color:var(--primary-color); margin:10px 0;">${amountText}</div>`;
}
