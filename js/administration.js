// administration.js

import { Task } from './loadPanel.js'; 
import { saveTask, activeTasks } from '/js/database/adminFunctions.js';

import { addConsoleMessage } from '/js/console.js';
import { getPreviousSeasonAndYear , extractSeasonAndYear } from './utils.js'; // Import the function
import {calculateWorkApplied } from './staff.js';

export function handleGenericTask(taskType, taskFunction, additionalTaskParams = {}) {
  const { fieldId, resourceName, buildingName, storage } = additionalTaskParams; // Destructure storage as selectedTool

  const isTaskAlreadyActive = activeTasks.some(task =>
    task.taskName.startsWith(taskType) &&
    (fieldId === undefined || task.fieldId === fieldId) &&
    (buildingName === undefined || task.buildingName === buildingName)
  );

  if (isTaskAlreadyActive) {
    const activeTask = activeTasks.find(task =>
      task.taskName.startsWith(taskType) &&
      (fieldId === undefined || task.fieldId === fieldId) &&
      (buildingName === undefined || task.buildingName === buildingName)
    );

    if (activeTask) {
      const extraWork = taskFunction(activeTask, 'update');
      activeTask.workTotal += extraWork;

      let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
      const taskIndex = tasks.findIndex(task => task.taskId === activeTask.taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex].workTotal = activeTask.workTotal;
        localStorage.setItem('tasks', JSON.stringify(tasks));
      }

      addConsoleMessage(`${taskType} task not completed. More work added: ${activeTask.workTotal}`);
    }
  } else {
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const field = farmlands[fieldId] || {};
    const fieldName = field.name || (fieldId !== undefined ? `Field ${fieldId}` : '');
    const vintage = field.vintage || localStorage.getItem('year') || '';
    const plantedResourceName = field.plantedResourceName || resourceName;

    // Destructure additional details from the taskFunction output
    const { taskName, workTotal, iconPath, taskType } = taskFunction(null, 'initialize', { fieldId, resourceName, buildingName, storage }); // Pass storage here

    // Ensure the task is initialized with all relevant information
    const task = new Task(taskName, taskFunction, undefined, workTotal, plantedResourceName,
                          '', vintage, '', iconPath, fieldName, taskType, 0, []);

    Object.assign(task, { fieldId, resourceName, fieldName, vintage, buildingName, storage }); // Include storage again

    saveTask({
      taskName: task.taskName,
      taskId: task.taskId,
      workTotal: task.workTotal,
      workProgress: task.workProgress,
      iconPath,
      type: task.type,
      staff: task.staff,
      fieldId,
      resourceName: plantedResourceName,
      fieldName,
      vintage,
      buildingName,
      storage // Add storage to the saved task
    });

    const messageParts = [`${taskType} task started`];
    if (fieldName) messageParts.push(`for ${fieldName}`);
    if (plantedResourceName) messageParts.push(`with ${plantedResourceName}`);
    if (buildingName) messageParts.push(`Building: ${buildingName}`);
    if (vintage) messageParts.push(`, ${vintage}`);


    const completeMessage = messageParts.join(' ');

    activeTasks.push(task);
    addConsoleMessage(completeMessage);
  }
}

export function bookkeepingTaskFunction(task, mode) {
  if (mode === 'initialize') {
    const currentSeason = localStorage.getItem('season') || 'Unknown Season';
    const currentYear = parseInt(localStorage.getItem('year'), 10) || new Date().getFullYear();

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const currentSeasonTransactionsCount = transactions.filter(transaction => {
      // Validate to ensure parsing is correct
      const { season, year } = extractSeasonAndYear(transaction.date);
      console.log(`Checking Transaction: ${transaction} -> Season: ${season}, Year: ${year}`);
      return season === currentSeason && year === currentYear;
    }).length;

    console.log(`Bookkeeping Task for ${currentSeason} ${currentYear}: ${currentSeasonTransactionsCount} transactions found.`);

    return {
      taskName: `Bookkeeping, ${currentSeason} ${currentYear}`,
      workTotal: currentSeasonTransactionsCount,
      iconPath: '/assets/icon/icon_bookkeeping.webp',
      taskType: 'Administration'
    };
  } else if (mode === 'update') {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const currentSeason = localStorage.getItem('season');
    const currentYear = parseInt(localStorage.getItem('year'), 10);

    const currentSeasonTransactionsCount = transactions.filter(transaction => {
      const { season, year } = extractSeasonAndYear(transaction.date);
      console.log(`Update Checking: Season: ${season}, Year: ${year}`);
      return season === currentSeason && year === currentYear;
    }).length;

    console.log(`Bookkeeping Update for ${currentSeason} ${currentYear}: ${currentSeasonTransactionsCount} transactions processed.`);
    return currentSeasonTransactionsCount * 1.1;
  }

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

export function maintenanceTaskFunction(task, mode) {
  if (mode === 'initialize') {
    // Setup for a maintenance task upon building creation
    const taskName = `Building & Maintenance`;
    const workTotal = 1000; // Example work total
    const iconPath = '/assets/icon/icon_maintenance.webp'; // Path to maintenance task icon

    return {
      taskName,
      workTotal,
      iconPath,
      taskType: 'Building & Maintenance'
    };
  } else if (mode === 'update') {
    const additionalWork = 10; // Example additional work on update
    return additionalWork;
  }

  // Calculate the actual work done by applying staff and tool effects
  const workApplied = calculateWorkApplied(task.staff || [], 'maintenanceTaskFunction');
  return workApplied;
}