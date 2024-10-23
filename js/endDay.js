// endDay.js
import { addConsoleMessage } from './console.js';
import { renderCompanyInfo } from './database/loadSidebar.js';
import { inventoryInstance, displayInventory } from './resource.js'; // Import needed functions
import { saveInventory } from './database/adminFunctions.js';
import { tasks } from './loadPanel.js'; // Import the tasks array


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

    // Execute tasks on each day increment
    tasks.forEach((task, index) => {
        const taskFunc = new Function(`return ${task.taskFunction}`)();
        const conditionFunc = new Function(`return ${task.conditionFunction}`)();
        taskFunc();
        if (conditionFunc()) {
            console.log(`${task.taskName} completed`);
            task.taskBox.remove();
            tasks.splice(index, 1);
        }
    });

    }

export function sellWines(resourceName) {
    const resourceIndex = inventoryInstance.items.findIndex(item => item.resource.name === resourceName && item.state === 'Bottle');

    if (resourceIndex !== -1) {
        const resource = inventoryInstance.items[resourceIndex];

        if (resource.amount > 0) {
            resource.amount -= 1; // Reduce the inventory by 1

            addMoney(100); // Add $100 for each wine sold

            if (resource.amount === 0) {
                // Optionally remove the item if the amount reaches zero
                inventoryInstance.items.splice(resourceIndex, 1);
            }

            saveInventory(); // Save the inventory updates

            // Optionally, refresh the inventory display if your UI supports it
            displayInventory(inventoryInstance, ['winecellar-table-body'], true);
        }
    }
}

export function addMoney(amount) {
    const currentMoney = localStorage.getItem('money');
    if (currentMoney !== null) {
        const newMoney = parseInt(currentMoney, 10) + amount;
        localStorage.setItem('money', newMoney);
        renderCompanyInfo();
    }
}