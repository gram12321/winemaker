import { saveCompanyInfo, clearLocalStorage } from './adminFunctions.js';
import { formatNumber } from '../utils.js'; // Ensure the correct path to the utils file
import { Farmland } from '../farmland.js'; // Ensure the correct path

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


export function calculateCompanyPrestige() {
    // Get money from localStorage to use in calculate prestige
    const money = parseFloat(localStorage.getItem('money') || '0');

    // Calculate the prestige based on money
    const moneyPrestige = money / 10000000;

    // Retrieve owned farmlands from localStorage
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];

    // Calculate total farmland prestige
    const totalFarmlandPrestige = farmlands.reduce((total, farmlandData) => {
        const farmland = new Farmland(
            farmlandData.id, 
            farmlandData.name, 
            farmlandData.country, 
            farmlandData.region, 
            farmlandData.acres, 
            farmlandData.plantedResourceName, 
            farmlandData.vineAge, 
            farmlandData.grape, 
            farmlandData.soil, 
            farmlandData.altitude, 
            farmlandData.aspect, 
            farmlandData.density
        );
        return total + farmland.farmlandPrestige;
    }, 0);

    // Combine money prestige and farmland prestige
    const companyPrestige = moneyPrestige + totalFarmlandPrestige;

    // Update localStorage with the calculated prestige
    localStorage.setItem('companyPrestige', companyPrestige.toString());

    return companyPrestige;
}

export function renderCompanyInfo() {
    // Calculate companyPrestige based on current money
    calculateCompanyPrestige();
    const companyName = localStorage.getItem('companyName');
    const money = parseFloat(localStorage.getItem('money') || '0');
    const currentWeek = localStorage.getItem('week');
    const currentSeason = localStorage.getItem('season');
    const currentYear = localStorage.getItem('year');
    const companyPrestige = parseFloat(localStorage.getItem('companyPrestige') || '0');
    const companyInfoDiv = document.getElementById('companyInfo');

    if (companyInfoDiv) {
        companyInfoDiv.innerHTML = `
          <div class="company-name">${companyName}</div>
          <div class="styled-line"></div>
          <div class="info-item date-info">
            <span class="info-label"><img src="/assets/icon/small/sun.png" alt="Date Icon" style="width:24px; height:24px; margin-left:8px; margin-right:8px;"></span>
            <span class="info-content">Week ${currentWeek}, ${currentSeason}, ${currentYear}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><img src="/assets/icon/small/gold.png" alt="Money Icon" style="width:24px; height:24px; margin-left:8px; margin-right:8px;"></span>
            <span class="info-content">€ ${formatNumber(money, 0)}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><img src="/assets/icon/small/prestige.png" alt="Prestige Icon" style="width:24px; height:24px; margin-left:8px; margin-right:8px;"></span>
            <span class="info-content"> ${formatNumber(companyPrestige.toFixed(2), 0)}</span>
          </div>
          <div class="styled-line"></div>
        `;
    }

    const dropdownToggle = document.querySelector('#navbarDropdown');
    if (companyName && dropdownToggle) {
        dropdownToggle.textContent = companyName;
    }
}