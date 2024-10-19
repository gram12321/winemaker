 import { renderCompanyInfo } from './database/loadSidebar.js';
export function addMoney() {
    const currentMoney = localStorage.getItem('money');
    if (currentMoney !== null) {
        const newMoney = parseInt(currentMoney, 10) + 10000;
        localStorage.setItem('money', newMoney);
         renderCompanyInfo(); // Update the company info display
    } 
}

