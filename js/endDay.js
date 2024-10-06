import {updateCompanyInfo} from './companyInfo.js';
function addMoney() {
    const currentMoney = localStorage.getItem('money');
    if (currentMoney !== null) {
        const newMoney = parseInt(currentMoney, 10) + 10000;
        localStorage.setItem('money', newMoney);
     updateCompanyInfo(); // Update the company info display
    } 
}

export { addMoney };