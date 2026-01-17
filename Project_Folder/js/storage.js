// js/storage.js
function saveLastPage(pageNumber) {
    localStorage.setItem("lastQuranPage", pageNumber);
}

function getLastPage() {
    return localStorage.getItem("lastQuranPage");
}
