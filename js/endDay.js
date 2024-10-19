// endDay.js
import { addConsoleMessage } from './console.js';
import { renderCompanyInfo } from './database/loadSidebar.js'; // Import renderCompanyInfo

export function initializeDay() {
    if (localStorage.getItem('day') === null) {
        localStorage.setItem('day', 1); // Initialize day to 1 if it doesn't exist
    }
}

export function addMoney() {
    const currentMoney = localStorage.getItem('money');
    if (currentMoney !== null) {
        const newMoney = parseInt(currentMoney, 10) + 10000;
        localStorage.setItem('money', newMoney);
        renderCompanyInfo();
    }
}

export function incrementDay() {
    let currentDay = parseInt(localStorage.getItem('day'), 10);
    currentDay += 1;
    localStorage.setItem('day', currentDay);
    addConsoleMessage(`Day increased to: ${currentDay}`);
    renderCompanyInfo(); // Update the display
}