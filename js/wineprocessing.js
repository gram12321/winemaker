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

    const isTaskAlreadyActive = activeTasks.some(task => {
        return task.taskName === "Crushing Grapes" &&
               task.resourceName === selectedResource &&
               task.resourceState === 'Grapes' &&
               task.vintage === resource.vintage &&
               task.quality === resource.quality;
    });

    if (!isTaskAlreadyActive) {
        const iconPath = '/assets/icon/icon_pressing.webp'; // Define the icon path

        const task = new Task(
            "Crushing Grapes",
            () => grapeCrushing(selectedResource), // Use the grapeCrushing function
            undefined,
            resource.amount,
            selectedResource,
            'Grapes',
            resource.vintage,
            resource.quality,
            iconPath
        );

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
    const increment = 10;
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === 'Grapes');

    if (!resource || resource.amount <= 0) {
        addConsoleMessage(`Unable to process ${selectedResource}. Ensure it is available.`);
        return 0;
    }

    const actualIncrement = Math.min(increment, resource.amount);

    inventoryInstance.removeResource(resource.resource.name, actualIncrement, resource.state, resource.vintage, resource.quality);
    inventoryInstance.addResource(resource.resource.name, actualIncrement, 'Must', resource.vintage, resource.quality);

    saveInventory();
    addConsoleMessage(`${actualIncrement} units of <strong>${selectedResource}, ${resource.vintage},</strong> ${resource.quality} have been crushed into must.`);

    return actualIncrement;
}

export function fermentMust(selectedResource) {
    // Find the selected must resource
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === 'Must');
    if (resource && resource.amount >= 1) {
        // Remove one unit from the must resource
        inventoryInstance.removeResource(resource.resource.name, 1, 'Must', resource.vintage, resource.quality);
        // Add one unit of the "Bottle" with the same attributes
        inventoryInstance.addResource(resource.resource.name, 1, 'Bottle', resource.vintage, resource.quality);
        // Save the updated inventory to localStorage
        saveInventory();
        addConsoleMessage(`One unit of ${selectedResource} has been fermented into a bottle.`);
    } else {
        addConsoleMessage(`Unable to ferment ${selectedResource}. Ensure there is sufficient quantity of Must.`);
    }
}