import taskManager, { TaskType } from './taskManager.js';
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { getMoney } from './company.js';
import { getFarmlands, updateAllFarmlands } from './database/adminFunctions.js';
import { updatePatentsList } from './overlays/mainpages/financeoverlay.js';

// Predefined patents and research items
const patents = [
  {
    id: 1,
    name: "Advanced Irrigation",
    description: "Improves water usage efficiency in vineyards.",
    requirements: { money: 10000, time: 4 }, // Example requirements
    benefits: { farmlandHealth: 0.1 }, // Example benefits
    taskParameters: { totalWork: 100, taskType: TaskType.field },
    completed: false // Track completion status
  },
  {
    id: 2,
    name: "Soil Analysis",
    description: "Provides detailed soil composition analysis.",
    requirements: { money: 5000000, time: 2 },
    benefits: { soilQuality: 0.2 },
    taskParameters: { totalWork: 50, taskType: TaskType.field },
    completed: false // Track completion status
  }
  // Add more patents/research items as needed
];

// Function to start a patent/research task
export function startPatentTask(patentId) {
  const patent = patents.find(p => p.id === patentId);
  if (!patent) {
    addConsoleMessage(`Patent with ID ${patentId} not found.`, false, true);
    return;
  }

  const money = getMoney();
  if (money < patent.requirements.money) {
    addConsoleMessage(`Not enough money to start ${patent.name}. Required: €${patent.requirements.money}`, false, true);
    return;
  }

  // Deduct the required money
  addTransaction('Expense', `Started research on ${patent.name}`, -patent.requirements.money);

  // Start the task using taskManager
  taskManager.addCompletionTask(
    patent.name,
    patent.taskParameters.taskType,
    patent.taskParameters.totalWork,
    (target, params) => {
      // Apply benefits upon completion
      applyPatentBenefits(patent);
      patent.completed = true; // Mark as completed
      addConsoleMessage(`Research on ${patent.name} completed. Benefits applied.`);
      updatePatentsList(); // Refresh the patents list
    }
  );
}

// Function to apply benefits of a completed patent
function applyPatentBenefits(patent) {
  // Apply the benefits to the relevant game entities
  // Example: Increase farmland health
  if (patent.benefits.farmlandHealth) {
    const farmlands = getFarmlands();
    farmlands.forEach(field => {
      const beforeHealth = field.farmlandHealth;
      field.farmlandHealth = Math.min(1.0, field.farmlandHealth + patent.benefits.farmlandHealth);
      const afterHealth = field.farmlandHealth;
      addConsoleMessage(`Farmland health for ${field.name} improved from ${beforeHealth} to ${afterHealth}.`);
    });
    updateAllFarmlands(farmlands);
  }

  // Add more benefit applications as needed
}

// Function to get the benefits description
export function getBenefitsDescription(benefits) {
  const descriptions = [];
  if (benefits.farmlandHealth) {
    descriptions.push(`Farmland Health: +${benefits.farmlandHealth * 100}%`);
  }
  if (benefits.soilQuality) {
    descriptions.push(`Soil Quality: +${benefits.soilQuality * 100}%`);
  }
  // Add more benefit descriptions as needed
  return descriptions.join(', ');
}

export { patents };
