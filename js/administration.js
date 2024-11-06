// administration.js

import { Task } from './loadPanel.js'; 
import { saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { calculateWorkApplied, getPreviousSeasonAndYear , extractSeasonAndYear } from './utils.js'; // Import the function



export function handleBookkeepingTask() {
    const isTaskAlreadyActive = activeTasks.some(task => task.taskName.startsWith("Bookkeeping"));

    if (!isTaskAlreadyActive) {
        const iconPath = '/assets/icon/icon_bookkeeping.webp';

        const currentSeason = localStorage.getItem('season') || 'Unknown Season';
        const currentYear = parseInt(localStorage.getItem('year'), 10) || new Date().getFullYear();
        const { previousSeason, previousYear } = getPreviousSeasonAndYear(currentSeason, currentYear);

        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

        console.log(`Transactions Data: `, transactions);

        // Filter transactions by extracting date components
        const previousSeasonTransactionsCount = transactions.filter(transaction => {
            const { season, year } = extractSeasonAndYear(transaction.date);
            return season === previousSeason && year === previousYear;
        }).length;

        console.log(`Calculated workTotal for Bookkeeping task: ${previousSeasonTransactionsCount}`);

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
    if (!task) {
        console.error("Task object is undefined in bookkeepingTaskFunction");
        return 0;
    }

    // Calculate work applied based on assigned staff
    const workApplied = calculateWorkApplied(task.staff || []);

    // Return the calculated work
    return workApplied;
}