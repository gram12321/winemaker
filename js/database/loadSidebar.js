function initializeSidebar() {
        renderCompanyInfo();

    // Attach logout event handler
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('companyName');
            window.location.href = '../index.html';
        });
    }
}

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