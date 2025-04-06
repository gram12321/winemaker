// Company prestige and management functions
import { getGameState, loadFarmlands, getPrestigeHit } from './database/adminFunctions.js';
import { formatNumber } from './utils.js'; 


export function getMoney() {
  return parseFloat(localStorage.getItem('money') || '0');
}

export function getCompanyName() {
  return localStorage.getItem('companyName');
}

export function calculateRealPrestige() {
  const money = getMoney();
  const moneyPrestige = money / 10000000;
  const farmlands = loadFarmlands();
  const prestigeHit = getPrestigeHit(); // Get current prestigeHit from storage

  const totalFarmlandPrestige = farmlands.reduce((total, farmland) => {
    return total + (farmland.farmlandPrestige || 0);
  }, 0);

  return moneyPrestige + totalFarmlandPrestige + prestigeHit;
}

export function farmlandPrestigeTotal(farmlands) {
  return farmlands.reduce((total, farmland) => {
    return total + (farmland.farmlandPrestige || 0);
  }, 0);
}

export function renderCompanyInfo() {
  const companyInfoDiv = document.getElementById('companyInfo');
  const companyName = getCompanyName();
  const money = getMoney();
  const { week, season, year } = getGameState();
  const prestige = calculateRealPrestige(); // Get real-time calculated prestige

  if (companyInfoDiv && companyName) {
      const tooltipContent = `Company: ${companyName.charAt(0).toUpperCase() + companyName.slice(1)}
Week ${week}, ${season}, ${year}
Money: € ${formatNumber(money, 0)}
Prestige: ${formatNumber(prestige, 2)}`;

      companyInfoDiv.setAttribute('data-tooltip', tooltipContent);
      const formattedCompanyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
      companyInfoDiv.innerHTML = `
        <div class="company-name" title="${formattedCompanyName}">
          <span class="full-name">${formattedCompanyName}</span>
          <span class="short-name">${formattedCompanyName.charAt(0)}</span>
        </div>
        <div class="styled-line"></div>

        <div class="info-item" title="Current Game Date">
          <span class="info-label"><img src="/assets/icon/small/sun.png" alt="Date Icon" style="width:24px; height:24px; margin-left:8px; margin-right:8px;"></span>
          <span class="info-content">Week ${week}, ${season}, ${year}</span>
        </div>

        <div class="info-item" title="Available Company Funds">
          <span class="info-label"><img src="/assets/icon/small/gold.png" alt="Money Icon" style="width:24px; height:24px; margin-left:8px; margin-right:8px;"></span>
          <span class="info-content">€ ${formatNumber(money, 0)}</span>
        </div>
        <div class="info-item" title="Company Prestige">
          <span class="info-label"><img src="/assets/icon/small/prestige.png" alt="Prestige Icon" style="width:24px; height:24px; margin-left:8px; margin-right:8px;"></span>
          <span class="info-content"> ${formatNumber(prestige, 2)}</span>
        </div>
        <div class="styled-line"></div>
      `;
  }

  const dropdownToggle = document.querySelector('#navbarDropdown');
  if (companyName && dropdownToggle) {
      dropdownToggle.textContent = companyName.charAt(0).toUpperCase() + companyName.slice(1);
  }
}