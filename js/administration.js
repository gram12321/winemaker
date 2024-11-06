// administration.js

import { Task } from './loadPanel.js'; 
import { saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { calculateWorkApplied } from './utils.js'; // Import the function

export function handleBookkeepingTask() {
    const isTaskAlreadyActive = activeTasks.some(task => task.taskName.startsWith("Bookkeeping"));

    if (!isTaskAlreadyActive) {
        const iconPath = '/assets/icon/icon_bookkeeping.webp';

        // Get the current season and year from localStorage
        const season = localStorage.getItem('season') || 'Unknown Season';
        const year = localStorage.getItem('year') || 'Unknown Year';

        // Construct the task name with season and year
        const taskName = `Bookkeeping, ${season} ${year}`;

        const task = new Task(
            taskName,
            bookkeepingTaskFunction,
            undefined, 
            300, 
            '', 
            '', 
            '', 
            '', 
            iconPath,
            '',
            'Administration'
        );

        task.staff = [];
        task.workProgress = 0;

        // Save task state
        saveTask({
            taskName: task.taskName,
            taskId: task.taskId,
            workTotal: task.workTotal,
            workProgress: task.workProgress,
            iconPath,
            type: task.type,
            staff: task.staff,
        });

        activeTasks.push(task);
        addConsoleMessage(`Bookkeeping task started for the ${season} ${year}.`);
    }
}
export function bookkeepingTaskFunction(task) {
    if (!task) {
        console.error("Task object is undefined in bookkeepingTaskFunction");
        return 0;
    }

    // Calculate work applied based on assigned staff
    const workApplied = calculateWorkApplied(task.staff || []);

    // Return the calculated work
    return workApplied;
}