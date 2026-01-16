// js/storage.js - إدارة الذاكرة والكوكيز
function saveStudentName() {
    const nameInput = document.getElementById('student-name-input');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert("الرجاء كتابة الاسم أولاً!");
        return;
    }
    
    localStorage.setItem('studentName', name);
    
    const resDiv = document.getElementById('name-save-result');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `✅ تم حفظ الاسم بنجاح!<br>أهلاً بك يا <strong>${name}</strong>`;
    
    updateWelcomeMessage();
}

function deleteStudentName() {
    localStorage.removeItem('studentName');
    document.getElementById('student-name-input').value = '';
    document.getElementById('name-save-result').style.display = 'none';
    alert("تم حذف الاسم من الجهاز.");
    updateWelcomeMessage();
}

function updateWelcomeMessage() {
    const savedName = localStorage.getItem('studentName');
    const welcomeMsg = document.getElementById('home-welcome-msg');
    const nameInput = document.getElementById('student-name-input');

    if (savedName) {
        if(welcomeMsg) {
            welcomeMsg.style.display = 'block';
            welcomeMsg.innerHTML = `👋 <strong>مرحباً بعودتك يا ${savedName}</strong><br>نتمنى لك يوماً قرآنياً مباركاً.`;
        }
        if(nameInput) nameInput.value = savedName;
    } else {
        if(welcomeMsg) welcomeMsg.style.display = 'none';
    }
}
