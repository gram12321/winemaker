// administration.js

import { Task } from './loadPanel.js'; 
import { saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { getPreviousSeasonAndYear , extractSeasonAndYear } from './utils.js'; // Import the function
import {calculateWorkApplied } from './staff.js';

export function handleGenericTask  (taskType, taskFunction) {
  const isTaskAlreadyActive = activeTasks.some(task => task.taskName.startsWith(taskType));

  if (isTaskAlreadyActive) {
    const activeTask = activeTasks.find(task => task.taskName.startsWith(taskType));

    if (activeTask) {
      const extraWork = taskFunction(activeTask, 'update');
      activeTask.workTotal += extraWork;

      // Save the updated task back to localStorage
      let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
      const taskIndex = tasks.findIndex(task => task.taskId === activeTask.taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex].workTotal = activeTask.workTotal;
        localStorage.setItem('tasks', JSON.stringify(tasks));
      }

      addConsoleMessage(`${taskType} task not completed. More work added: ${activeTask.workTotal}`);
    }
  } else {
    const { taskName, workTotal, iconPath, taskType } = taskFunction(null, 'initialize');

    const task = new Task(
      taskName,           // The name of the task (e.g., 'Bookkeeping, Spring 2023')
      taskFunction,       // The function to execute for this task (e.g., bookkeepingTaskFunction)
      undefined,          // Task ID, left undefined to let the constructor generate a new ID
      workTotal,          // Total amount of work needed to complete the task, serving as the goal
      '',                 // resourceName, here left as an empty string since it's not applicable
      '',                 // resourceState, here left as an empty string since it's not applicable
      '',                 // vintage, here left as an empty string since it's not applicable
      '',                 // quality, here left as an empty string since it's not applicable
      iconPath,           // Path to the icon image representing the task
      '',                 // fieldName, left as an empty string since it's not applicable
      taskType,           // Type of task (e.g., 'Administration'), categorizing the task
      0,                  // workProgress, initialized to 0, representing the current progress
      []                  // staff, initialized as an empty array to later hold staff members assigned to the task
    );

    // SaveTask can remain unchanged since workProgress and staff are part of the task object now
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
    addConsoleMessage(`${taskType} task started.`);
  }
}

export function bookkeepingTaskFunction(task, mode) {
  if (mode === 'initialize') {
    const currentSeason = localStorage.getItem('season') || 'Unknown Season';
    const currentYear = parseInt(localStorage.getItem('year'), 10) || new Date().getFullYear();
    const { previousSeason, previousYear } = getPreviousSeasonAndYear(currentSeason, currentYear);

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const previousSeasonTransactionsCount = transactions.filter(transaction => {
      const { season, year } = extractSeasonAndYear(transaction.date);
      return season === previousSeason && year === previousYear;
    }).length;

    return {
      taskName: `Bookkeeping, ${currentSeason} ${currentYear}`,
      workTotal: previousSeasonTransactionsCount,
      iconPath: '/assets/icon/icon_bookkeeping.webp',
      taskType: 'Administration'
    };
  } else if (mode === 'update') {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const { previousSeason, previousYear } = getPreviousSeasonAndYear(
      localStorage.getItem('season'),
      parseInt(localStorage.getItem('year'), 10)
    );

    const previousSeasonTransactionsCount = transactions.filter(transaction => {
      const { season, year } = extractSeasonAndYear(transaction.date);
      return season === previousSeason && year === previousYear;
    }).length;

    return previousSeasonTransactionsCount * 1.1;
  }

  // Work application logic for task execution
  const workApplied = calculateWorkApplied(task.staff || [], 'bookkeepingTaskFunction');
  return workApplied;
}

// Add this function in the administration.js file
export function hiringTaskFunction(task, mode) {
    if (mode === 'initialize') {
        const taskName = `Hiring Task`;
        const workTotal = 100; // Example work total, adjust as needed
        const iconPath = '/assets/icon/icon_hiring.webp'; // An icon specific to the hiring task
        return {
            taskName,
            workTotal,
            iconPath,
            taskType: 'Administration'
        };
    } else if (mode === 'update') {
        const additionalWork = 80; // Example additional work, adjust as needed
        return additionalWork;
    }

    // Apply work if task execution
    const workApplied = calculateWorkApplied(task.staff || [], 'hiringTaskFunction');
    return workApplied;
}