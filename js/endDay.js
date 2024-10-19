// endDay.js
import { addConsoleMessage } from './console.js';
import { renderCompanyInfo } from './database/loadSidebar.js';

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

export function initializeDay() {
    if (localStorage.getItem('day') === null) {
        localStorage.setItem('day', 1); // Initialize day to 1 if it doesn't exist
    }
    if (localStorage.getItem('season') === null) {
        localStorage.setItem('season', SEASONS[0]); // Start with Spring
    }
    if (localStorage.getItem('year') === null) {
        localStorage.setItem('year', 2023); // Start with current year
    }
}

export function incrementDay() {
    let currentDay = parseInt(localStorage.getItem('day'), 10);
    let currentSeasonIndex = SEASONS.indexOf(localStorage.getItem('season'));
    let currentYear = parseInt(localStorage.getItem('year'), 10);

    currentDay += 1;

    if (currentDay > 3) { // If day exceeds 3, reset to 1 and change season
        currentDay = 1;
        currentSeasonIndex = (currentSeasonIndex + 1) % SEASONS.length;
        localStorage.setItem('season', SEASONS[currentSeasonIndex]);

        if (currentSeasonIndex === 0) { // After Winter, enter Spring and increment year
            currentYear += 1;
            localStorage.setItem('year', currentYear);
        }
    }

    localStorage.setItem('day', currentDay);
    localStorage.setItem('season', SEASONS[currentSeasonIndex]);

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