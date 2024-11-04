// wineprocessing.js
import { addConsoleMessage } from './console.js';
import { inventoryInstance } from './resource.js';
import { saveInventory, saveTask, activeTasks } from './database/adminFunctions.js';
import { Task } from './loadPanel.js';
import { formatNumber, calculateWorkApplied } from './utils.js';

export function handleGrapeCrushingTask(selectedResource) {
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === 'Grapes');

    if (!resource) {
        addConsoleMessage(`The resource ${selectedResource} is not available.`);
        return;
    }

    const gameYear = localStorage.getItem('year') || ''; // Example of consistency if you use vintage
    const isTaskAlreadyActive = activeTasks.some(task => 
        task.taskName === "Crushing Grapes" &&
        task.resourceName === selectedResource &&
        task.resourceState === 'Grapes' &&
        task.vintage === resource.vintage &&
        task.quality === resource.quality
    );

    if (!isTaskAlreadyActive) {
        const iconPath = '/assets/icon/icon_pressing.webp';

        const task = new Task(
            "Crushing Grapes",
            () => grapeCrushing(selectedResource),
            undefined,
            resource.amount,
            selectedResource,
            'Grapes',
            resource.vintage,
            resource.quality,
            iconPath
        );

        // Assign any specific properties as needed, similar to other tasks
        Object.assign(task, {
            resourceName: selectedResource,
            resourceState: 'Grapes',
            vintage: resource.vintage,
            quality: resource.quality
        });

        const taskInfo = {
            taskName: task.taskName,
            resourceName: selectedResource,
            resourceState: 'Grapes',
            vintage: resource.vintage,
            quality: resource.quality,
            taskId: task.taskId,
            workTotal: resource.amount,
            iconPath: iconPath
        };

        saveTask(taskInfo);
        activeTasks.push(task);
        addConsoleMessage(`Crushing task started for ${selectedResource}, Vintage ${resource.vintage}, Quality ${resource.quality}.`);
    } else {
        addConsoleMessage(`A Crushing task for ${selectedResource}, Vintage ${resource.vintage}, Quality ${resource.quality} is already active.`);
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
    const workApplied = calculateWorkApplied(currentTask?.staff || 1); // Fallback to 1 to avoid multiplying by 0

    const actualIncrement = Math.min(workApplied, resource.amount);

    // Define a ratio for crushing, e.g., how much Must is produced from Grapes
    const crushingYieldRatio = 600; // 600 liters of Must per ton of Grapes

    // Calculate actual must produced
    const mustProduced = actualIncrement * crushingYieldRatio;

    // Update inventory to reflect the crushing process
    inventoryInstance.removeResource(resource.resource.name, actualIncrement, resource.state, resource.vintage, resource.quality);
    inventoryInstance.addResource(resource.resource.name, mustProduced, 'Must', resource.vintage, resource.quality);

    // Persist changes
    saveInventory();

    const remainingGrapes = resource.amount - actualIncrement;

    // Format the addConsoleMessage with the additional information
    addConsoleMessage(
        `${formatNumber(mustProduced)} tons of <strong>${selectedResource}, ${resource.vintage},</strong> ${resource.quality} have been crushed into must. ${formatNumber(remainingGrapes)} tons of <strong>${selectedResource}, ${resource.vintage},</strong> still remain in the warehouse.`
    );

    return actualIncrement; // Return the actual work completed (Return work for task process)
}

export function handleFermentationTask(selectedResource) {
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === 'Must');

    if (!resource) {
        addConsoleMessage(`The resource ${selectedResource} is not available.`);
        return;
    }

    const gameYear = localStorage.getItem('year') || ''; // Example of consistency if you use vintage
    const isTaskAlreadyActive = activeTasks.some(task =>
        task.taskName === "Fermenting" &&
        task.resourceName === selectedResource &&
        task.resourceState === 'Must' &&
        task.vintage === resource.vintage &&
        task.quality === resource.quality
    );

    if (!isTaskAlreadyActive) {
        const iconPath = '/assets/icon/icon_fermentation.webp';

        const task = new Task(
            "Fermenting",
            () => fermentMust(selectedResource),
            undefined,
            resource.amount,
            selectedResource,
            'Must',
            resource.vintage,
            resource.quality,
            iconPath
        );

        // Assign any specific properties as needed
        Object.assign(task, {
            resourceName: selectedResource,
            resourceState: 'Must',
            vintage: resource.vintage,
            quality: resource.quality
        });

        const taskInfo = {
            taskName: task.taskName,
            resourceName: selectedResource,
            resourceState: 'Must',
            vintage: resource.vintage,
            quality: resource.quality,
            taskId: task.taskId,
            workTotal: resource.amount,
            iconPath: iconPath
        };

        saveTask(taskInfo);
        activeTasks.push(task);
        addConsoleMessage(`Fermentation task started for ${selectedResource}, Vintage ${resource.vintage}, Quality ${resource.quality}.`);
    } else {
        addConsoleMessage(`A Fermentation task for ${selectedResource}, Vintage ${resource.vintage}, Quality ${resource.quality} is already active.`);
    }
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
    const workApplied = calculateWorkApplied(currentTask?.staff || 1); // Fallback to 1 to avoid multiplying by 0

    // Ferment only the work that can be applied or the amount available, whichever is smaller
    const actualIncrement = Math.min(workApplied, resource.amount);

    // Remove units from the must resource and add as bottles
    inventoryInstance.removeResource(resource.resource.name, actualIncrement, 'Must', resource.vintage, resource.quality);
    inventoryInstance.addResource(resource.resource.name, actualIncrement, 'Bottle', resource.vintage, resource.quality);

    // Persist changes
    saveInventory();

    addConsoleMessage(`${actualIncrement} unit(s) of ${selectedResource} has been fermented and bottled.`);

    return actualIncrement; // Return the actual work completed
}