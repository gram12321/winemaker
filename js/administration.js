import { addConsoleMessage } from '/js/console.js';
import { extractSeasonAndYear } from './utils.js'; // Import the function

export function Bookkeeping() {
  const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];
  const currentSeason = localStorage.getItem('season');
  const currentYear = parseInt(localStorage.getItem('year'), 10);
  const currentWeek = parseInt(localStorage.getItem('week'), 10);

  // Only trigger on first week of new season
  if (currentWeek !== 1) return;

  // Get previous season and year
  const prevSeasonIndex = (seasons.indexOf(currentSeason) - 1 + 4) % 4;
  const prevSeason = seasons[prevSeasonIndex];
  const prevYear = prevSeasonIndex === 3 ? currentYear - 1 : currentYear;

  // Get transactions from previous season
  const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  const prevSeasonTransactions = transactions.filter(transaction => {
    const { season, year } = extractSeasonAndYear(transaction.date);
    return season === prevSeason && year === prevYear;
  });

  // Check for unfinished bookkeeping tasks
  const existingTasks = taskManager.getAllTasks().filter(task => 
    task.name.startsWith('Bookkeeping') && task.type === 'progressive'
  );

  let spilloverWork = 0;
  if (existingTasks.length > 0) {
    // Apply 10% penalty to remaining work
    spilloverWork = existingTasks.reduce((total, task) => {
      const remainingWork = task.totalWork - task.appliedWork;
      return total + (remainingWork * 1.1);
    }, 0);

    // Apply prestige penalty for incomplete tasks
    const prestigeHit = -0.1 * existingTasks.length;
    localStorage.setItem('prestigeHit', (parseFloat(localStorage.getItem('prestigeHit') || 0) + prestigeHit).toString());
    addConsoleMessage(`Incomplete bookkeeping tasks have affected company prestige!`, false, true);
  }

  // Create new task
  const totalWork = (prevSeasonTransactions.length * 10) + spilloverWork;
  const taskName = `Bookkeeping ${prevSeason} ${prevYear}`;

  taskManager.addProgressiveTask(
    taskName,
    TaskType.administration,
    totalWork,
    (target, progress, params) => {
      if (progress >= 1) {
        addConsoleMessage(`${taskName} completed successfully!`);
      }
    },
    null,
    { prevSeason, prevYear }
  );
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