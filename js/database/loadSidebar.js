function initializeSidebar() {
    displayCompanyInfo();

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

export function updateCompanyInfo() {
    const companyName = localStorage.getItem('companyName');
    const money = localStorage.getItem('money');
    const companyInfoDiv = document.getElementById('companyInfo');

    if (companyInfoDiv) {
        companyInfoDiv.innerHTML = `
          <p><strong>Company Info:</strong> ${companyName}</p>
          <p><strong>Money:</strong> $${money}</p>
        `;
    }
    const dropdownToggle = document.querySelector('#navbarDropdown');
    if (companyName && dropdownToggle) {
        dropdownToggle.textContent = companyName;
    }
}

function displayCompanyInfo() {
    const companyName = localStorage.getItem('companyName');
    const money = localStorage.getItem('money');
    const companyInfoDiv = document.getElementById('companyInfo');

    if (companyInfoDiv) {
        companyInfoDiv.innerHTML = `
          <p><strong>Company Info:</strong> ${companyName}</p>
          <p><strong>Money:</strong> $${money}</p>
        `;
    }

    // Update the dropdown menu text
    const dropdownToggle = document.querySelector('#navbarDropdown');
    if (companyName && dropdownToggle) {
        dropdownToggle.textContent = companyName;
    }
}


export { initializeSidebar };