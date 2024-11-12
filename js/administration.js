// administration.js

import { Task } from './loadPanel.js'; 
import { saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { getPreviousSeasonAndYear , extractSeasonAndYear } from './utils.js'; // Import the function
import {calculateWorkApplied } from './staff.js';

export function handleBookkeepingTask() {
    const isTaskAlreadyActive = activeTasks.some(task => task.taskName.startsWith("Bookkeeping"));

    const currentSeason = localStorage.getItem('season') || 'Unknown Season';
    const currentYear = parseInt(localStorage.getItem('year'), 10) || new Date().getFullYear();
    const { previousSeason, previousYear } = getPreviousSeasonAndYear(currentSeason, currentYear);

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Filter transactions by extracting date components
    const previousSeasonTransactionsCount = transactions.filter(transaction => {
        const { season, year } = extractSeasonAndYear(transaction.date);
        return season === previousSeason && year === previousYear;
    }).length;

    if (isTaskAlreadyActive) {
        // Find the active task
        const activeTask = activeTasks.find(task => task.taskName.startsWith("Bookkeeping"));

        if (activeTask) {
            // Update the workTotal by adding the new count
            activeTask.workTotal += (previousSeasonTransactionsCount)*1.1;

            // Save the updated task back to localStorage
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const taskIndex = tasks.findIndex(task => task.taskId === activeTask.taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].workTotal = activeTask.workTotal;
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }
        }
        addConsoleMessage(`<span style="color: red;">Bookkeeping for previous season <strong>not</strong> completed. </span> More work has been added to the task: ${activeTask.workTotal}`);
    } else {
        const iconPath = '/assets/icon/icon_bookkeeping.webp';

        const taskName = `Bookkeeping, ${currentSeason} ${currentYear}`;

        const task = new Task(
            taskName,
            bookkeepingTaskFunction,
            undefined, 
            previousSeasonTransactionsCount, 
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
        addConsoleMessage(`Bookkeeping task started for the ${currentSeason} ${currentYear}.`);
    }
}
export function bookkeepingTaskFunction(task) {
    // Calculate work applied based on assigned staff
    const workApplied = calculateWorkApplied(task.staff || [], 'bookkeeping');

    // Return the calculated work
    return workApplied;
}