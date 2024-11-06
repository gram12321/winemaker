// administration.js

import { Task } from './loadPanel.js'; 
import { saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { calculateWorkApplied } from './utils.js'; // Import the function

export function handleBookkeepingTask() {
    const isTaskAlreadyActive = activeTasks.some(task => task.taskName === "Bookkeeping");

    if (!isTaskAlreadyActive) {
        const iconPath = '/assets/icon/icon_bookkeeping.webp';
        const task = new Task(
            "Bookkeeping",
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
            // Include other necessary task properties
        });

        activeTasks.push(task);
        addConsoleMessage(`Bookkeeping task started for the new season.`);
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