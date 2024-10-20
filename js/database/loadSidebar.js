import { saveCompanyInfo, clearLocalStorage } from './adminFunctions.js';
function initializeSidebar() {
    renderCompanyInfo();
    // Attach logout event handler
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            saveCompanyInfo();
            clearLocalStorage();
            window.location.href = '../index.html';
        });
    }
}
// Ensure data is saved when the user closes or reloads the page
window.addEventListener('beforeunload', async (event) => {
    await saveCompanyInfo();
    clearLocalStorage();

    event.returnValue = ''; // Triggers a confirmation dialog in supporting browsers
});


export function renderCompanyInfo() {
    const companyName = localStorage.getItem('companyName');
    const money = localStorage.getItem('money');
    const currentDay = localStorage.getItem('day');
    const currentSeason = localStorage.getItem('season');
    const currentYear = localStorage.getItem('year');
    const companyInfoDiv = document.getElementById('companyInfo');

    if (companyInfoDiv) {
        companyInfoDiv.innerHTML = `
          <p><strong>Company Info:</strong> ${companyName}</p>
          <p><strong>Money:</strong> $${money}</p>
          <p><strong>Day:</strong> ${currentDay}</p>
          <p><strong>Season:</strong> ${currentSeason}</p>
          <p><strong>Year:</strong> ${currentYear}</p>
        `;
    }

    const dropdownToggle = document.querySelector('#navbarDropdown');
    if (companyName && dropdownToggle) {
        dropdownToggle.textContent = companyName;
    }
}


export { initializeSidebar };