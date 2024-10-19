// endDay.js
import { addConsoleMessage } from './console.js';
import { renderCompanyInfo } from './database/loadSidebar.js';

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

export function incrementDay() {
    let currentDay = parseInt(localStorage.getItem('day'), 10);
    let currentSeasonIndex = SEASONS.indexOf(localStorage.getItem('season'));
    let currentYear = parseInt(localStorage.getItem('year'), 10);

    currentDay += 1;

    if (currentDay > 3) { // If day exceeds 3, reset to 1
        currentDay = 1;
        currentSeasonIndex = (currentSeasonIndex + 1) % SEASONS.length;
    }

    if (currentSeasonIndex === 0 && currentDay === 1) { // Only increment year at the start of Spring
        currentYear += 1;
    }

    localStorage.setItem('day', currentDay);
    localStorage.setItem('season', SEASONS[currentSeasonIndex]);
    localStorage.setItem('year', currentYear); // Ensure the year is stored

    addConsoleMessage(`Day increased to: ${currentDay}, Season: ${SEASONS[currentSeasonIndex]}, Year: ${currentYear}`);
    renderCompanyInfo();
}

export function addMoney() {
    const currentMoney = localStorage.getItem('money');
    if (currentMoney !== null) {
        const newMoney = parseInt(currentMoney, 10) + 10000;
        localStorage.setItem('money', newMoney);
        renderCompanyInfo();
    }
}