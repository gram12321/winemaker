// wineprocessing.js
import { addConsoleMessage } from './console.js';
import { inventoryInstance } from './resource.js';
import { saveInventory, saveTask, activeTasks } from './database/adminFunctions.js';
import { Task } from './loadPanel.js';

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
    const increment = 10; // Define the increment for crushing
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === 'Grapes');

    if (!resource || resource.amount <= 0) {
        addConsoleMessage(`Unable to process ${selectedResource}. Ensure it is available.`);
        return 0; // Return 0 if no progress is made
    }

    const actualIncrement = Math.min(increment, resource.amount);

    // Update inventory to reflect the crushing process
    inventoryInstance.removeResource(resource.resource.name, actualIncrement, resource.state, resource.vintage, resource.quality);
    inventoryInstance.addResource(resource.resource.name, actualIncrement, 'Must', resource.vintage, resource.quality);

    // Persist changes
    saveInventory();

    addConsoleMessage(`${actualIncrement} units of <strong>${selectedResource}, ${resource.vintage},</strong> ${resource.quality} have been crushed into must.`);

    return actualIncrement; // Return the actual work completed
}

export function fermentMust(selectedResource) {
    const increment = 1; // Define the increment for fermentation
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === 'Must');

    if (!resource || resource.amount < 1) {
        addConsoleMessage(`Unable to ferment ${selectedResource}. Ensure there is sufficient quantity of Must.`);
        return 0; // Return 0 if no progress is made
    }

    // Ferment only the defined increment or the amount available, whichever is smaller
    const actualIncrement = Math.min(increment, resource.amount);

    // Remove units from the must resource and add as bottles
    inventoryInstance.removeResource(resource.resource.name, actualIncrement, 'Must', resource.vintage, resource.quality);
    inventoryInstance.addResource(resource.resource.name, actualIncrement, 'Bottle', resource.vintage, resource.quality);

    // Persist changes
    saveInventory();

    addConsoleMessage(`${actualIncrement} unit(s) of ${selectedResource} has been fermented into a bottle.`);

    return actualIncrement; // Return the actual work completed
}