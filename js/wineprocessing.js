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

    const gameYear = localStorage.getItem('year') || ''; // Consistent use of game year
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
            iconPath,
            '',  // fieldName is empty because it's not field-specific
            'Winery'  // Specify the type of the task as "Winery"
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
            iconPath: iconPath,
            type: 'Winery'  // Include type in the saved task information
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

    // Log the resource details, including the fieldName and fieldPrestige
    console.log(`Resource for crushing:`, {
        name: resource.resource.name,
        amount: resource.amount,
        state: resource.state,
        vintage: resource.vintage,
        quality: resource.quality,
        fieldName: resource.fieldName, // Log fieldName
        fieldPrestige: resource.fieldPrestige // Add fieldPrestige
    });

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

    // Log after adding Must to confirm fieldPrestige is passed
    console.log(`Must added to inventory:`, {
        name: resource.resource.name,
        amount: mustProduced,
        state: 'Must',
        vintage: resource.vintage,
        quality: resource.quality,
        fieldName: resource.fieldName,
        fieldPrestige: resource.fieldPrestige // Verify this is passed along
    });

    // Persist changes
    saveInventory();

    const remainingGrapes = resource.amount - actualIncrement;

    // Format the addConsoleMessage with the additional information
    addConsoleMessage(
        `${formatNumber(mustProduced)} liters of <strong>${selectedResource}, ${resource.vintage},</strong> ${resource.quality} have been crushed into must. ${formatNumber(remainingGrapes)} tons of <strong>${selectedResource}, ${resource.vintage},</strong> still remain in the warehouse.`
    );

    return actualIncrement; // Return the actual work completed
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
            iconPath,
            '',  // fieldName is empty because it's not field-specific
            'Winery'  // Specify the type of the task as "Winery"
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
            iconPath: iconPath,
             type: 'Winery', // Explicitly pass in type
                staff: task.staff
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

    // Log the resource details before processing
    console.log(`Starting fermentation for:`, {
        name: resource.resource.name,
        amount: resource.amount,
        state: resource.state,
        vintage: resource.vintage,
        quality: resource.quality,
        fieldName: resource.fieldName,
        fieldPrestige: resource.fieldPrestige // Log fieldPrestige
    });

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

    // Log after adding Bottle to confirm fieldPrestige is passed
    console.log(`Bottle added to inventory:`, {
        name: resource.resource.name,
        amount: actualIncrement,
        state: 'Bottle',
        vintage: resource.vintage,
        quality: resource.quality,
        fieldName: resource.fieldName,
        fieldPrestige: resource.fieldPrestige // Verify this is passed along
    });

    // Persist changes
    saveInventory();

    addConsoleMessage(`${actualIncrement} unit(s) of ${selectedResource} has been fermented and bottled.`);

    return actualIncrement; // Return the actual work completed
}