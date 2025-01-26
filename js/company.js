
// Company prestige and management functions
import { loadStaff, loadFarmlands } from './database/adminFunctions.js';

export function getMoney() {
  return parseFloat(localStorage.getItem('money') || '0');
}

export function getCompanyName() {
  return localStorage.getItem('companyName');
}

export function calculateRealPrestige(prestigeHit = 0) {
  const money = getMoney();
  const moneyPrestige = money / 10000000;
  const farmlands = loadFarmlands();

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
