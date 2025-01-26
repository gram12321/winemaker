
import { addConsoleMessage } from '/js/console.js';
import { extractSeasonAndYear, formatNumber } from './utils.js';
import taskManager, { TaskType } from './taskManager.js';


export function bookkeeping() {
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

  // Calculate base work from transactions
  const baseWork = prevSeasonTransactions.length * 10;

  // Find existing bookkeeping tasks
  const existingTasks = taskManager.getAllTasks().filter(task => 
    task.name.startsWith('Bookkeeping') && task.type === 'completion'
  );

  // Calculate spillover work with 10% penalty
  const spilloverWork = existingTasks.reduce((total, task) => {
    const remainingWork = task.totalWork - task.appliedWork;
    return total + (remainingWork * 1.1);
  }, 0);

  // Remove existing tasks
  existingTasks.forEach(task => {
    taskManager.removeTask(task.id);
  });

  // Apply prestige penalty if there were incomplete tasks
  if (existingTasks.length > 0) {
    const prestigeHit = -0.1 * existingTasks.length;
    localStorage.setItem('prestigeHit', (parseFloat(localStorage.getItem('prestigeHit') || 0) + prestigeHit).toString());
    const penaltyAmount = existingTasks.reduce((total, task) => {
      const remainingWork = task.totalWork - task.appliedWork;
      return total + (remainingWork * 0.1); // Just the 10% penalty
    }, 0);
    addConsoleMessage(`Incomplete bookkeeping tasks have affected company prestige! Lost ${Math.abs(prestigeHit).toFixed(2)} prestige points. ${formatNumber(penaltyAmount, 1)} extra work units added as penalty to the new task.`, false, true);
  }

  // Create new task with combined work
  const totalWork = baseWork + spilloverWork;
  const taskName = `Bookkeeping ${prevSeason} ${prevYear}`;

  taskManager.addCompletionTask(
    taskName,
    TaskType.administration,
    totalWork,
    (target, params) => {
      addConsoleMessage(`${taskName} completed successfully!`);
    },
    null,
    { prevSeason, prevYear }
  );
}

export function hiringTaskFunction(task, mode) {
    if (mode === 'initialize') {
        const taskName = `Hiring Task`;
        const workTotal = 100;
        const iconPath = '/assets/icon/icon_hiring.webp';
        return {
            taskName,
            workTotal,
            iconPath,
            taskType: 'Administration'
        };
    } else if (mode === 'update') {
        const additionalWork = 80;
        return additionalWork;
    }
    const workApplied = calculateWorkApplied(task.staff || [], 'hiringTaskFunction');
    return workApplied;
}

export function maintenanceTaskFunction(task, mode) {
  if (mode === 'initialize') {
    const taskName = `Building & Maintenance`;
    const workTotal = 1000;
    const iconPath = '/assets/icon/icon_maintenance.webp';

    return {
      taskName,
      workTotal,
      iconPath,
      taskType: 'Building & Maintenance'
    };
  } else if (mode === 'update') {
    const additionalWork = 10;
    return additionalWork;
  }

  const workApplied = calculateWorkApplied(task.staff || [], 'maintenanceTaskFunction');
  return workApplied;
}
