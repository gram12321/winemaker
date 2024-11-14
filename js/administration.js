// administration.js

import { Task } from './loadPanel.js'; 
import { saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { getPreviousSeasonAndYear , extractSeasonAndYear } from './utils.js'; // Import the function
import {calculateWorkApplied } from './staff.js';

export function triggerBookkeepingTask() {
    handleGenericTask('Bookkeeping', bookkeepingTaskFunction);
}

export function triggerHiringTask() {
    handleGenericTask('Hiring', hiringTaskFunction);
}

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
      taskName,
      taskFunction,
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
        const workTotal = 10; // Example work total, adjust as needed
        const iconPath = '/assets/icon/icon_hiring.webp'; // An icon specific to the hiring task
        return {
            taskName,
            workTotal,
            iconPath,
            taskType: 'Administration'
        };
    } else if (mode === 'update') {
        const additionalWork = 2; // Example additional work, adjust as needed
        return additionalWork;
    }

    // Apply work if task execution
    const workApplied = calculateWorkApplied(task.staff || [], 'hiringTaskFunction');
    return workApplied;
}