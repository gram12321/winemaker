import { saveCompanyInfo, clearLocalStorage } from './adminFunctions.js';
// Define a function to load and initialize the sidebar
export function initializeSidebar() {
    fetch('/html/sidebar.html')
        .then(response => response.text())
        .then(data => {
            const sidebarWrapper = document.getElementById('sidebar-wrapper');
            if (sidebarWrapper) {
                sidebarWrapper.innerHTML = data;

                // Render company information
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
            } else {
                console.error("Sidebar wrapper element not found.");
            }
        })
        .catch(error => console.error('Error loading sidebar:', error));
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
          <div class="company-name">${companyName}</div>
          <div class="styled-line"></div>
          <div class="info-item date-info">
            <span class="info-label"><img src="/assets/icon/sun.png" alt="Date Icon" style="width:24px; height:24px; margin-left:8px; margin-right:8px;">Date:</span>
            <span class="info-content">${currentDay}, ${currentSeason}, ${currentYear}</span>
          </div>
          <div class="styled-line"></div>
          <div class="info-item">
            <span class="info-label"><img src="/assets/icon/gold.png" alt="Money Icon" style="width:24px; height:24px; margin-left:8px; margin-right:8px;">Money:</span>
            <span class="info-content">$${money}</span>
          </div>
        `;
    }

    const dropdownToggle = document.querySelector('#navbarDropdown');
    if (companyName && dropdownToggle) {
        dropdownToggle.textContent = companyName;
    }
}
