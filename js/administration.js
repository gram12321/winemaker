import { addConsoleMessage } from '/js/console.js';
import { extractSeasonAndYear } from './utils.js'; // Import the function




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