// wineprocessing.js
import { addConsoleMessage } from './console.js';
import { inventoryInstance } from './resource.js';
import { saveInventory, saveTask, activeTasks } from './database/adminFunctions.js';
import { Task } from './loadPanel.js';
import { formatNumber,  } from './utils.js';
import {calculateWorkApplied } from './staff.js';

export function handleWineryTask(selectedResource, taskType, resourceState) {
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === resourceState);

    if (!resource) {
        addConsoleMessage(`The resource ${selectedResource} is not available in the form of ${resourceState}.`);
        return;
    }

    const gameYear = localStorage.getItem('year') || '';
    const taskName = taskType === "Crushing" ? "Crushing Grapes" : "Fermenting";
    const iconPath = taskType === "Crushing" ? '/assets/icon/icon_pressing.webp' : '/assets/icon/icon_fermentation.webp';

    const isTaskAlreadyActive = activeTasks.some(task =>
        task.taskName === taskName &&
        task.resourceName === selectedResource &&
        task.resourceState === resourceState &&
        task.vintage === resource.vintage &&
        task.quality === resource.quality
    );

    if (!isTaskAlreadyActive) {
        const taskFunction = taskType === "Crushing" ? () => grapeCrushing(selectedResource) : () => fermentMust(selectedResource);

        const task = new Task(
            taskName,
            taskFunction,
            undefined,
            resource.amount,
            selectedResource,
            resourceState,
            resource.vintage,
            resource.quality,
            iconPath,
            '',
            'Winery'
        );

        Object.assign(task, {
            resourceName: selectedResource,
            resourceState: resourceState,
            vintage: resource.vintage,
            quality: resource.quality
        });

        const taskInfo = {
            taskName: task.taskName,
            resourceName: selectedResource,
            resourceState: resourceState,
            vintage: resource.vintage,
            quality: resource.quality,
            taskId: task.taskId,
            workTotal: resource.amount,
            iconPath: iconPath,
            type: 'Winery'
        };

        saveTask(taskInfo);
        activeTasks.push(task);
        addConsoleMessage(`${taskType} task started for ${selectedResource}, Vintage ${resource.vintage}, Quality ${resource.quality}.`);
    } else {
        addConsoleMessage(`A ${taskType} task for ${selectedResource}, Vintage ${resource.vintage}, Quality ${resource.quality} is already active.`);
    }
}

export function grapeCrushing(selectedResource) {
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === 'Grapes');

    if (!resource) {
        addConsoleMessage(`No resource found for <strong>${selectedResource}</strong>.`);
        return 0;
    }

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const currentTask = tasks.find(task => task.taskName === "Crushing Grapes" && task.resourceName === selectedResource);

    // Calculate work applied using staff assignments
    const workApplied = calculateWorkApplied(currentTask?.staff || [], 'grapeCrushing');

    const actualIncrement = Math.min(workApplied, resource.amount);

    // Define a ratio for crushing, e.g., how much Must is produced from Grapes
    const crushingYieldRatio = 600; // 600 liters of Must per ton of Grapes

    // Calculate actual must produced
    const mustProduced = actualIncrement * crushingYieldRatio;

    // Update inventory to reflect the crushing process, include fieldName and fieldPrestige
    inventoryInstance.removeResource(
        resource.resource.name,
        actualIncrement,
        resource.state,
        resource.vintage,
        resource.quality,
        resource.fieldName,
        resource.fieldPrestige // Pass the field's prestige along
    );

    inventoryInstance.addResource(
        resource.resource.name,
        mustProduced,
        'Must',
        resource.vintage,
        resource.quality,
        resource.fieldName,
        resource.fieldPrestige // Pass the field's prestige along
    );

    // Persist changes
    saveInventory();

    const remainingGrapes = resource.amount - actualIncrement;

    // Format the addConsoleMessage with the additional information
    addConsoleMessage(
        `${formatNumber(mustProduced)} liters of <strong>${selectedResource}, ${resource.vintage},</strong> ${resource.quality} have been crushed into must. ${formatNumber(remainingGrapes)} tons of <strong>${selectedResource}, ${resource.vintage},</strong> still remain in the warehouse.`
    );

    return actualIncrement; // Return the actual work completed
}


export function fermentMust(selectedResource) {
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === 'Must');

    if (!resource || resource.amount < 1) {
        addConsoleMessage(`Unable to ferment ${selectedResource}. Ensure there is sufficient quantity of Must.`);
        return 0; // Return 0 if no progress is made
    }

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const currentTask = tasks.find(task => task.taskName === "Fermenting" && task.resourceName === selectedResource);

    // Calculate work applied using staff assignments
    const workApplied = calculateWorkApplied(currentTask?.staff, 'fermentMust');

    // Ferment only the work that can be applied or the amount available, whichever is smaller
    const actualIncrement = Math.min(workApplied, resource.amount);

    // Remove units from the must resource and add as bottles, include fieldName and fieldPrestige
    inventoryInstance.removeResource(
        resource.resource.name,
        actualIncrement,
        'Must',
        resource.vintage,
        resource.quality,
        resource.fieldName,
        resource.fieldPrestige // Include fieldPrestige
    );

    inventoryInstance.addResource(
        resource.resource.name,
        actualIncrement,
        'Bottle',
        resource.vintage,
        resource.quality,
        resource.fieldName,
        resource.fieldPrestige // Include fieldPrestige
    );

    // Persist changes
    saveInventory();

    addConsoleMessage(`${actualIncrement} liters of ${selectedResource} has been fermented and bottled.`);

    return actualIncrement; // Return the actual work completed
}