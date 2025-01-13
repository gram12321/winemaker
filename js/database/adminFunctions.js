import { db, collection, getDocs, getDoc, deleteDoc, setDoc, doc } from './firebase.js';

import { Staff, createNewStaff, getLastNameForNationality  } from '/js/staff.js';
import { addTransaction } from '/js/finance.js';
import { bookkeepingTaskFunction, hiringTaskFunction, maintenanceTaskFunction } from '/js/administration.js';
import { inventoryInstance } from '/js/resource.js';

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
  localStorage.removeItem('companyPrestige');
  localStorage.removeItem('currentPrestigeHit');
  localStorage.removeItem('ownedFarmlands');
  localStorage.removeItem('buildings');
  localStorage.removeItem('playerInventory');
  localStorage.removeItem('consoleMessages');
  localStorage.removeItem('staffData');
  localStorage.removeItem('latestStaffId');
  localStorage.removeItem('wineOrders');
  localStorage.removeItem('transactions'); // Clear transactions data
  localStorage.removeItem('recurringTransactions'); // Clear recurring transactions data
  console.log("Local storage cleared.");
}


async function storeCompanyName() {
  const companyNameInput = document.getElementById('company-name');
  if (companyNameInput) {
    const companyName = companyNameInput.value;
    if (companyName) {
      const exists = await checkCompanyExists(companyName);
      if (exists) {
        loadExistingCompanyData(companyName);
        window.location.href = 'html/game.html'; // Forward to game.html directly
      } else {
        localStorage.setItem('companyName', companyName);
        localStorage.setItem('money', 0); // Initialize money with 10000000
        localStorage.setItem('companyPrestige', 0);

        // Set initial date values before logging the transaction
        localStorage.setItem('week', 1); // Initialize week
        localStorage.setItem('season', 'Spring'); // Initialize season
        localStorage.setItem('year', 2023); // Initialize year

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

        saveCompanyInfo(); // Save company info to Firestore
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
    localStorage.setItem('companyPrestige', data.companyPrestige);
    localStorage.setItem('currentPrestigeHit', data.currentPrestigeHit);
    localStorage.setItem('ownedFarmlands', data.ownedFarmlands || '[]');
    localStorage.setItem('playerInventory', data.playerInventory || '[]');
    localStorage.setItem('buildings', data.buildings || '[]');
    localStorage.setItem('staffData', data.staffData || '[]');
    localStorage.setItem('transactions', JSON.stringify(data.transactions || [])); // Load transactions
  }
}

async function saveCompanyInfo() {
  const companyName = localStorage.getItem('companyName');
  const money = localStorage.getItem('money');
  const week = localStorage.getItem('week');
  const season = localStorage.getItem('season');
  const year = localStorage.getItem('year');
  const companyPrestige = localStorage.getItem('companyPrestige');
  const currentPrestigeHit = localStorage.getItem('companyPrestige');
  const ownedFarmlands = localStorage.getItem('ownedFarmlands');
  const playerInventory = localStorage.getItem('playerInventory');
  const staffData = localStorage.getItem('staffData');
  const transactions = JSON.parse(localStorage.getItem('transactions')) || []; // Retrieve transactions

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
      companyPrestige,
      currentPrestigeHit,
      ownedFarmlands,
      playerInventory,
      staffData,
      transactions,
    });
  } catch (error) {
    console.error('Error saving company data:', error);
    alert('An error occurred while saving company data.');
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

function saveTask(taskInfo) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Find if the task already exists based on taskId
    const existingTaskIndex = tasks.findIndex(task => task.taskId === taskInfo.taskId);

    if (existingTaskIndex === -1) {
        tasks.push(taskInfo); // Add new task
    } else {
        tasks[existingTaskIndex] = taskInfo; // Update existing task
    }

    localStorage.setItem('tasks', JSON.stringify(tasks)); // Save back to localStorage
    
}

export const activeTasks = []; // Exported array to hold task references


export function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    Task.latestTaskId = parseInt(localStorage.getItem('latestTaskId'), 10) || 0;
    activeTasks.length = 0; // Clear existing active tasks

    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const inventoryResources = inventoryInstance.items;

    tasks.forEach(taskInfo => {
        const field = farmlands[taskInfo.fieldId];
        let executeTaskFunction;
        let task;
        let resource;

        switch (true) {
            case taskInfo.taskName.startsWith("Bookkeeping"):
                executeTaskFunction = bookkeepingTaskFunction;
                break;
            case taskInfo.taskName === "Crushing Grapes":
                resource = inventoryResources.find(item => item.resource.name === taskInfo.resourceName && item.state === 'Grapes');
                executeTaskFunction = resource ? () => grapeCrushing(taskInfo.resourceName) : null;
                break;
            case taskInfo.taskName === "Fermenting":
                resource = inventoryResources.find(item => item.resource.name === taskInfo.resourceName && item.state === 'Must');
                executeTaskFunction = resource ? () => fermentMust(taskInfo.resourceName) : null;
                break;
            case taskInfo.taskName === "Planting":
                if (field) executeTaskFunction = () => plantAcres(taskInfo.fieldId, taskInfo.resourceName);
                break;
            case taskInfo.taskName === "Harvesting":
                if (field) executeTaskFunction = () => harvestAcres(taskInfo.fieldId);
                break;
            case taskInfo.taskName === "Uprooting":
                if (field) executeTaskFunction = () => uproot(taskInfo.fieldId);
                break;
            case taskInfo.taskName === "Clearing":
                if (field) executeTaskFunction = () => clearing(taskInfo.fieldId);
                break;
            case taskInfo.taskName.startsWith("Hiring"):
                executeTaskFunction = hiringTaskFunction;
                break;
            case taskInfo.taskName.startsWith("Building & Maintenance"):
                executeTaskFunction = maintenanceTaskFunction;
                break;
            default:
                console.warn(`Unknown task name: ${taskInfo.taskName}`);
        }

        if (executeTaskFunction) {
            task = new Task(
                taskInfo.taskName,
                executeTaskFunction,
                taskInfo.taskId,
                taskInfo.workTotal,
                taskInfo.resourceName,
                taskInfo.resourceState,
                taskInfo.vintage,
                taskInfo.quality,
                taskInfo.iconPath,
                taskInfo.fieldName,
                taskInfo.type,
                taskInfo.workProgress || 0,
                Array.isArray(taskInfo.staff) ? taskInfo.staff : [],
                taskInfo.buildingName // Ensure buildingName is passed
            );

            // Assign task-specific properties including fieldId and fieldName if applicable
            Object.assign(task, {
                fieldId: taskInfo.fieldId,
                fieldName: taskInfo.fieldName,
                vintage: taskInfo.vintage,
              storage: taskInfo.storage // Attach storage here from taskInfo
            });

            // Initialize the task box with staff information and update visuals
            task.updateTaskBoxWithStaff(task.staff);
            task.updateProgressBar(); // Update progress bar initially
            activeTasks.push(task); // Add task to activeTasks array
        }
    });
}

// Existing removeTask function with additional code
export function removeTask(taskId) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const initialTaskCount = tasks.length;

    tasks = tasks.filter(task => task.taskId !== taskId);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Update activeTasks to remove the corresponding task
    const taskIndex = activeTasks.findIndex(task => task.taskId === taskId);
    if (taskIndex !== -1) {
          activeTasks.splice(taskIndex, 1); // Remove the task from activeTasks
    }

    
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

// Function to load staff members from localStorage
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

export function removeWineOrder(orderIndex) {
    if (orderIndex >= 0 && orderIndex < currentWineOrders.length) {
        currentWineOrders.splice(orderIndex, 1);
        saveWineOrders(currentWineOrders);
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
  if (farmlandsStore.length === 0) {
    const farmlandsJSON = localStorage.getItem('ownedFarmlands');
    if (farmlandsJSON) {
      farmlandsStore = JSON.parse(farmlandsJSON);
    }
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

export { 
  storeCompanyName, 
  saveCompanyInfo, 
  clearLocalStorage, 
  clearFirestore, 
  loadInventory, 
  saveInventory,
  saveTask
};