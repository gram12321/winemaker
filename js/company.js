
// Company prestige and management functions
import { loadStaff } from './database/adminFunctions.js';

export function getMoney() {
  return parseFloat(localStorage.getItem('money') || '0');
}

export function getCompanyName() {
  return localStorage.getItem('companyName');
}

export function calculateRealPrestige(prestigeHit = 0, farmlands = null) {
  const money = getMoney();
  const moneyPrestige = money / 10000000;

  if (!farmlands) {
    farmlands = JSON.parse(localStorage.getItem('ownedFarmlands') || '[]');
  }

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
