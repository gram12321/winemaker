// Add this function to the appropriate file where it best fits; possibly in 'endDay.js' or another central script

import { Task } from './loadPanel.js'; // Ensure you import Task if not already
import { saveTask, activeTasks } from './database/adminFunctions.js'; // Import necessary functions

export function bookkeepingTask() {
    const taskName = "Bookkeeping";
    const workTotal = 50; // Define the total work for bookkeeping task
    const iconPath = '/assets/icon/icon_bookkeeping.webp'; // Set an appropriate icon path
    const taskType = 'Administration';

    // Check if the bookkeeping task is already active
    const isTaskAlreadyActive = activeTasks.some(task => task.taskName === taskName);

    if (!isTaskAlreadyActive) {
        const task = new Task(
            taskName,
            bookkeepingFunction, // This function will outline what bookkeeping involves
            undefined,
            workTotal,
            '',
            '',
            '',
            '',
            iconPath,
            '',
            taskType
        );

        // Save the task in local storage for persistence
        saveTask({
            taskName: task.taskName,
            taskId: task.taskId,
            workTotal: workTotal,
            iconPath: iconPath,
            type: taskType,
            staff: task.staff
        });

        activeTasks.push(task);
        console.log(`Bookkeeping task started for the new season.`);
    }
}

// Define what bookkeeping involves as a function
export function bookkeepingFunction(taskId) {
    // Retrieve current progress from localStorage
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskIndex = tasks.findIndex(task => task.taskId === taskId);

    if (taskIndex === -1) {
        console.error("Task not found!");
        return 0;
    }

    // Retrieve current progress
    const currentProgress = tasks[taskIndex].workProgress || 0;
    console.log("Performing bookkeeping tasks...");

    const increment = 10;
    const newProgress = currentProgress + increment;
    tasks[taskIndex].workProgress = Math.min(newProgress, tasks[taskIndex].workTotal);

    // Save the updated task list back to localStorage
    localStorage.setItem('tasks', JSON.stringify(tasks));

    return increment; // Return increment for processing logic
}