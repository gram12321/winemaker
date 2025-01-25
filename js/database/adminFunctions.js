import { db, collection, getDocs, getDoc, deleteDoc, setDoc, doc } from './firebase.js';
import { displayFarmland } from '../overlays/mainpages/landoverlay.js'; // Ensure this import is present
import { Staff, createNewStaff, getLastNameForNationality } from '/js/staff.js';
import { addTransaction } from '/js/finance.js';
import { bookkeepingTaskFunction, hiringTaskFunction, maintenanceTaskFunction } from '/js/administration.js';
import { inventoryInstance } from '/js/resource.js';
import { performHarvest } from '../overlays/harvestOverlay.js'; // Import the centralized function
import { performCrushing } from '../overlays/crushingOverlay.js'; // Import the centralized function
import { performFermentation } from '../wineprocessing.js'; // Import the centralized function

async function clearFirestore() {
  if (confirm('Are you sure you want to delete all companies from Firestore?')) {
    try {
      const querySnapshot = await getDocs(collection(db, "companies"));
      querySnapshot.forEach(async (docSnapshot) => {
        await deleteDoc(docSnapshot.ref);
      });
      alert('All company data cleared from Firestore successfully.');
    } catch (error) {
      console.error('Error clearing Firestore: ', error);
      alert('An error occurred while clearing Firestore.');
    }
  }
}

// Existing clearLocalStorage function in adminFunctions.js
async function clearLocalStorage() {
  localStorage.removeItem('companyName');
  localStorage.removeItem('money');
  localStorage.removeItem('week');
  localStorage.removeItem('season');
  localStorage.removeItem('year');
  localStorage.removeItem('calculatedPrestige');     // Ensure we clear prestige
  localStorage.removeItem('PrestigeHit');  // Ensure we clear prestige hit
  localStorage.removeItem('ownedFarmlands');
  localStorage.removeItem('buildings');
  localStorage.removeItem('playerInventory');
  localStorage.removeItem('consoleMessages');
  localStorage.removeItem('staffData');
  localStorage.removeItem('latestStaffId');
  localStorage.removeItem('wineOrders');
  localStorage.removeItem('transactions'); // Clear transactions data
  localStorage.removeItem('recurringTransactions'); // Clear recurring transactions data
  localStorage.removeItem('activeTasks'); // Clear active tasks
  console.log("Local storage cleared.");
}

async function storeCompanyName() {
  const companyNameInput = document.getElementById('company-name');
  if (companyNameInput) {
    const companyName = companyNameInput.value;
    if (companyName) {
      const exists = await checkCompanyExists(companyName);
      if (exists) {
        await loadExistingCompanyData(companyName);
        window.location.href = 'html/game.html'; // Forward to game.html directly
      } else {
        localStorage.setItem('companyName', companyName);
        localStorage.setItem('money', 0); // Initialize money with 10000000, set to 0 will get 1000000 in a transaction

        // Set initial date values before logging the transaction
        localStorage.setItem('week', 1); // Initialize week
        localStorage.setItem('season', 'Spring'); // Initialize season
        localStorage.setItem('year', 2025); // Initialize year

        // Log the initial income transaction
        addTransaction('Income', 'Initial Company Setup', 10000000);

        // Create the first staff member
        const staff1 = createNewStaff();

        // Create the second staff member and ensure the same nationality
        const staff2 = createNewStaff();
        staff2.nationality = staff1.nationality;
        staff2.name = staff2.getNameForNationality(staff2.nationality);
        staff2.lastName = getLastNameForNationality(staff2.nationality);

        // Add staff to an array
        const staff = [staff1, staff2];

        // Save staff data using saveStaff
        saveStaff(staff);

        await saveCompanyInfo(); // Save company info to Firestore
        window.location.href = 'html/game.html'; // Redirect to game.html
      }
    }
  }
}

async function checkCompanyExists(companyName) {
  const docRef = doc(db, "companies", companyName);
  const docSnap = await getDoc(docRef);

  return docSnap.exists(); // Check if the document exists
}

async function loadExistingCompanyData(companyName) {
  const docRef = doc(db, "companies", companyName);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    localStorage.setItem('companyName', data.name);
    localStorage.setItem('money', data.money);
    localStorage.setItem('week', data.week);
    localStorage.setItem('season', data.season);
    localStorage.setItem('year', data.year);

    localStorage.setItem('ownedFarmlands', data.ownedFarmlands || '[]');
    localStorage.setItem('playerInventory', data.playerInventory || '[]');
    localStorage.setItem('buildings', data.buildings || '[]');
    localStorage.setItem('staffData', data.staffData || '[]');
    localStorage.setItem('transactions', JSON.stringify(data.transactions || [])); // Load transactions
    localStorage.setItem('recurringTransactions', JSON.stringify(data.recurringTransactions || [])); // Load recurring transactions
    localStorage.setItem('activeTasks', JSON.stringify(data.activeTasks || [])); // Load active tasks
  }
}

async function saveCompanyInfo() {
  const companyName = localStorage.getItem('companyName');
  const money = localStorage.getItem('money');
  const week = localStorage.getItem('week');
  const season = localStorage.getItem('season');
  const year = localStorage.getItem('year');

  const ownedFarmlands = localStorage.getItem('ownedFarmlands');
  const playerInventory = localStorage.getItem('playerInventory');
  const staffData = localStorage.getItem('staffData');
  const transactions = JSON.parse(localStorage.getItem('transactions')) || []; // Retrieve transactions
  const recurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || []; // Retrieve recurring transactions
  const activeTasks = JSON.parse(localStorage.getItem('activeTasks')) || []; // Retrieve active tasks
  const prestigeHit = localStorage.getItem('prestigeHit');
  const calculatedPrestige = localStorage.getItem('calculatedPrestige');

  if (!companyName) {
    console.error("No company name found to save.");
    return;
  }

  try {
    const docRef = doc(db, "companies", companyName);
    await setDoc(docRef, {
      name: companyName,
      money,
      week,
      season,
      year,
      ownedFarmlands,
      playerInventory,
      staffData,
      transactions, // Save transactions
      recurringTransactions, // Save recurring transactions
      activeTasks, // Save active tasks
      prestigeHit,
      calculatedPrestige,
    });
  } catch (error) {
    console.error("Error saving company info: ", error);
  }
}

// Function to load inventory from localStorage
function loadInventory() {
  let savedInventory = localStorage.getItem('playerInventory');

  // Safely parse JSON data
  try {
    savedInventory = JSON.parse(savedInventory);
    // Ensure savedInventory is an array
    if (!Array.isArray(savedInventory)) {
      savedInventory = [];
    }
  } catch (error) {
    console.warn("Failed to parse playerInventory from localStorage. Initializing with empty array.");
    savedInventory = [];
  }
  // Populate the inventory instance
  savedInventory.forEach(item => {
    inventoryInstance.addResource(
      { name: item.resource.name, naturalYield: item.resource.naturalYield || 1 },
      item.amount,
      item.state,
      item.vintage,
      item.quality,
      item.fieldName,
      item.fieldPrestige,
      item.storage
    );
  });
}

// Load the inventory at the start
loadInventory();

// Function to save inventory to localStorage
function saveInventory() {
  localStorage.setItem('playerInventory', JSON.stringify(inventoryInstance.items));
}

// Function to save the list of staff members to localStorage
export function saveStaff(staffMembers) {
  if (Array.isArray(staffMembers)) {
    localStorage.setItem('staffData', JSON.stringify(staffMembers.map(staff => ({
      id: staff.id,
      nationality: staff.nationality,
      name: staff.name,
      lastName: staff.lastName,
      workforce: staff.workforce,
      wage: staff.wage,
      skills: staff.skills // Include skills in the saved data
    }))));
  }
}

/**
 * Loads staff members from localStorage.
 * @returns {Array} Array of Staff objects.
 */
export function loadStaff() {
  let staffMembers = [];
  let savedStaffData = localStorage.getItem('staffData');

  if (savedStaffData) {
    try {
      const parsedData = JSON.parse(savedStaffData);
      staffMembers = parsedData.map(item => {
        const staff = new Staff();
        staff.id = item.id;
        staff.nationality = item.nationality;
        staff.name = item.name;
        staff.lastName = item.lastName;
        staff.workforce = item.workforce;
        staff.wage = item.wage;
        staff.skills = item.skills; // Load skills from parsed data
        return staff;
      });
    } catch (error) {
      console.error("Failed to parse staff data from localStorage.", error);
    }
  }

  return staffMembers;
}

let currentWineOrders = [];

export function saveWineOrders(wineOrders) {
  currentWineOrders = wineOrders;
  localStorage.setItem('wineOrders', JSON.stringify(wineOrders));
}

export function loadWineOrders() {
  if (currentWineOrders.length > 0) {
    return currentWineOrders;
  }

  const savedWineOrders = localStorage.getItem('wineOrders');
  if (savedWineOrders) {
    try {
      currentWineOrders = JSON.parse(savedWineOrders);
    } catch (error) {
      console.error("Failed to parse wine orders from localStorage.", error);
      currentWineOrders = [];
    }
  }
  return currentWineOrders;
}

export function removeWineOrder(index) {
  const wineOrders = loadWineOrders();
  if (index >= 0 && index < wineOrders.length) {
    wineOrders.splice(index, 1);
    saveWineOrders(wineOrders);
    return true;
  }
  return false;
}

export function addWineOrder(order) {
  currentWineOrders.push(order);
  saveWineOrders(currentWineOrders);
}

// Functions to save and load buildings from localStorage
export function storeBuildings(buildings) {
  localStorage.setItem('buildings', JSON.stringify(buildings));
}

export function loadBuildings() {
  const buildingsJSON = localStorage.getItem('buildings');
  if (buildingsJSON) {
    return JSON.parse(buildingsJSON);
  }
  return [];
}

// In-memory storage for farmlands
let farmlandsStore = [];

// Function to load farmlands from localStorage
/**
 * Loads all owned farmlands from localStorage
 * @returns {Array} Array of farmland objects, or empty array if none exist
 */
export function loadFarmlands() {
  const farmlandsJSON = localStorage.getItem('ownedFarmlands');
  if (farmlandsJSON) {
    farmlandsStore = JSON.parse(farmlandsJSON);
  }
  return farmlandsStore;
}

/**
 * Saves farmlands to localStorage
 * @private
 */
function saveFarmlandsToStorage() {
  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlandsStore));
}

/**
 * Adds a new farmland to the store
 * @param {Object} farmland - The farmland object to add
 */
export function addFarmland(farmland) {
  farmlandsStore.push(farmland);
  saveFarmlandsToStorage();
}

/**
 * Updates specific properties of a farmland
 * @param {number} farmlandId - The ID of the farmland to update
 * @param {Object} updates - Object containing the properties to update
 * @returns {boolean} True if update successful, false if farmland not found
 */
export function updateFarmland(farmlandId, updates) {
  const farmlands = loadFarmlands();
  const farmlandIndex = farmlands.findIndex(f => f.id === parseInt(farmlandId));

  if (farmlandIndex !== -1) {
    farmlands[farmlandIndex] = {
      ...farmlands[farmlandIndex],
      ...updates
    };
    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    return true;
  }
  return false;
}

// Game state management functions
export function getGameState() {
  return {
    week: parseInt(localStorage.getItem('week'), 10) || 1,
    season: localStorage.getItem('season') || 'Spring',
    year: parseInt(localStorage.getItem('year'), 10) || 2023
  };
}

export function updateGameState(week, season, year) {
  localStorage.setItem('week', week);
  localStorage.setItem('season', season);
  localStorage.setItem('year', year);
}

export function getMoney() {
  return parseFloat(localStorage.getItem('money') || '0');
}

export function getCompanyName() {
  return localStorage.getItem('companyName');
}

// Farmland management functions
export function getFarmlands() {
  return JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
}

export function updateAllFarmlands(farmlands) {
  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
}

// Get prestige functions
export function getPrestigeHit() {
  const prestigeHit = localStorage.getItem('prestigeHit');
  return prestigeHit === null ? 0 : Number(prestigeHit); // Explicit null check and conversion
}

export function setPrestigeHit(value) {
  if (value === null || value === undefined) {
    localStorage.removeItem('prestigeHit');
  } else {
    localStorage.setItem('prestigeHit', Number(value)); // Ensure we store as number
  }
}

export function calculateRealPrestige() {
  const money = getMoney();
  const moneyPrestige = money / 10000000;
  const farmlands = loadFarmlands();

  const totalFarmlandPrestige = farmlands.reduce((total, farmland) => {
    return total + (farmland.farmlandPrestige || 0);
  }, 0);

  const prestigeHit = getPrestigeHit();
  const calculatedPrestige = moneyPrestige + totalFarmlandPrestige + prestigeHit;

  // Store the calculated value
  localStorage.setItem('calculatedPrestige', calculatedPrestige.toString());
  return calculatedPrestige;
}

export function getCalculatedPrestige() {
  return parseFloat(localStorage.getItem('calculatedPrestige') || '0');
}

// Task persistence functions
export function saveTasks(tasks) {
  const taskData = Array.from(tasks.entries()).map(([id, task]) => ({
    id: task.id,
    name: task.name,
    type: task.type,
    taskType: task.taskType,
    totalWork: task.totalWork, // Save totalWork
    appliedWork: task.appliedWork, // Save appliedWork
    progress: task.progress,
    target: task.target,
    params: task.params,
    assignedStaff: task.assignedStaff // Include assigned staff
  }));
  localStorage.setItem('activeTasks', JSON.stringify(taskData));
}

export function loadTasks() {
  const taskData = JSON.parse(localStorage.getItem('activeTasks') || '[]');
  const tasks = new Map();
  taskData.forEach(task => {
    tasks.set(task.id, {
      ...task,
      callback: getTaskCallback(task.name, task.taskType)
    });
  });
  return tasks;
}

// Helper function to get the appropriate callback based on task name and type
function getTaskCallback(taskName, taskType) {
  switch (taskName.toLowerCase()) {
    case 'planting':
      return (target, progress, params) => {
        // Planting callback logic
        if (progress >= 1) {
          const { selectedResource, selectedDensity, totalCost } = params;
          updateFarmland(target.id, {
            density: selectedDensity,
            plantedResourceName: selectedResource,
            vineAge: 0,
            status: 'No yield in first season'
          });
          addTransaction('Expense', `Planting on ${target.name}`, -totalCost);
          displayFarmland(); // Now properly imported
        }
      };
    case 'hiring process':
      return (target, params) => {
        const { staff, hiringExpense } = params;
        const staffMembers = loadStaff();
        staffMembers.push(staff);
        saveStaff(staffMembers);
        addTransaction('Expense', `Hiring expense for ${staff.firstName} ${staff.lastName}`, -hiringExpense);
      };
    case 'harvesting':
      return (target, progress, params) => {
        const harvestedAmount = params.totalHarvest * (progress - (params.lastProgress || 0));
        params.lastProgress = progress;
        performHarvest(target, target.id, params.selectedTool, harvestedAmount);
      };
    case 'crushing':
      return (target, progress, params = {}) => {
        if (!params.lastProgress) params.lastProgress = 0;
        const mustAmount = params.totalGrapes * 0.6;
        const processedAmount = mustAmount * (progress - params.lastProgress);
        params.lastProgress = progress;
        performCrushing(params.selectedStorages, processedAmount, params.totalGrapes);
      };
    case 'fermentation':
      return (target, progress, params) => {
        performFermentation(target, progress, params);
      };
    // Add more cases for other task types
    default:
      return () => console.warn(`No callback found for task: ${taskName}`);
  }
}

export {
  storeCompanyName,
  saveCompanyInfo,
  clearLocalStorage,
  clearFirestore,
  loadInventory,
  saveInventory
};

