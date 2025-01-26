import { addConsoleMessage } from '/js/console.js';
import { extractSeasonAndYear, formatNumber } from './utils.js';
import taskManager, { TaskType } from './taskManager.js';
import { getGameState, getTransactions } from './database/adminFunctions.js';
import { calculateRealPrestige } from './company.js'; // Add this import

export function bookkeeping() {
  const { week, season: currentSeason, year: currentYear } = getGameState();
  const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];

  // Only trigger on first week of new season
  if (week !== 1) return;

  // Get previous season and year
  const prevSeasonIndex = (seasons.indexOf(currentSeason) - 1 + 4) % 4;
  const prevSeason = seasons[prevSeasonIndex];
  const prevYear = prevSeasonIndex === 3 ? currentYear - 1 : currentYear;

  // Get transactions from previous season
  const transactions = getTransactions();
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
    const currentPrestige = calculateRealPrestige();
    const prestigeHit = -(currentPrestige * 0.1); // Take 10% of current prestige as penalty
    localStorage.setItem('prestigeHit', (parseFloat(localStorage.getItem('prestigeHit') || 0) + prestigeHit).toString());
    const penaltyAmount = existingTasks.reduce((total, task) => {
      const remainingWork = task.totalWork - task.appliedWork;
      return total + (remainingWork * 0.1); // Just the 10% penalty
    }, 0);
    addConsoleMessage(`Incomplete bookkeeping tasks have affected company prestige! Lost ${Math.abs(prestigeHit).toFixed(2)} prestige points (10% of current prestige). ${formatNumber(penaltyAmount, 1)} extra work units added as penalty to the new task.`, false, true);
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

export function maintenanceBuildings() {
    const { week, season, year } = getGameState();
    
    // Only trigger on first week of Spring
    if (week !== 1 || season !== 'Spring') return;

    const buildings = JSON.parse(localStorage.getItem('buildings') || '[]');
    const existingTasks = taskManager.getAllTasks().filter(task => 
        task.name.startsWith('Maintain') && task.type === 'completion'
    );

    // Calculate spillover work with 10% penalty for each building
    const spilloverByBuilding = {};
    const currentPrestige = calculateRealPrestige();
    
    existingTasks.forEach(task => {
        const buildingName = task.target.name;
        const remainingWork = task.totalWork - task.appliedWork;
        spilloverByBuilding[buildingName] = (spilloverByBuilding[buildingName] || 0) + (remainingWork * 1.1);

        // Each unmaintained building causes a 10% prestige hit
        const prestigeHit = -(currentPrestige * 0.1);
        localStorage.setItem('prestigeHit', 
            (parseFloat(localStorage.getItem('prestigeHit') || 0) + prestigeHit).toString()
        );
        
        addConsoleMessage(
            `Incomplete maintenance of ${buildingName} has affected company prestige! Lost ${Math.abs(prestigeHit).toFixed(2)} prestige points (10% of current prestige). Next year's task will include ${formatNumber(remainingWork * 1.1, 1)} additional work units as penalty.`,
            false, true
        );
        taskManager.removeTask(task.id);
    });

    buildings.forEach(building => {
        const baseWork = 100;
        const levelMultiplier = Math.pow(1.2, building.level);
        const spilloverWork = spilloverByBuilding[building.name] || 0;
        const totalWork = Math.round((baseWork * levelMultiplier) + spilloverWork);

        const taskName = `Maintain ${building.name}`;

        taskManager.addCompletionTask(
            taskName,
            TaskType.maintenance,
            totalWork,
            (target, params) => {
                addConsoleMessage(`${taskName} completed successfully!`);
            },
            building,
            { year }
        );
    });
}
