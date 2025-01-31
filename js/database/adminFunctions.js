import { db, collection, getDocs, getDoc, deleteDoc, setDoc, doc } from './firebase.js';
import { Staff, createNewStaff, getDefaultTeams } from '/js/staff.js';
import { addTransaction } from '/js/finance.js';
import { inventoryInstance } from '/js/resource.js';

let teams = []; // In-memory storage for teams

async function clearFirestore() {
  if (confirm('Are you sure you want to delete all companies from Firestore?')) {
    try {
      const querySnapshot = await getDocs(collection(db, "companies"));
      querySnapshot.forEach(async (docSnapshot) => {
        await deleteDoc(docSnapshot.ref);
      });
      
    } catch (error) {
      console.error('Error clearing Firestore: ', error);
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
  localStorage.removeItem('prestigeHit');  // Ensure we clear prestige hit
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
  localStorage.removeItem('deletedDefaultTeams'); 
  localStorage.removeItem('teams'); 
  localStorage.removeItem('panelCollapsed'); 
  localStorage.removeItem('sidebarCollapsed'); 
  localStorage.removeItem('upgrades'); // Clear upgrades data
  
  console.log("Local storage cleared.");
}

async function storeCompanyName(companyName, startingCondition = null) {
  if (companyName) {
    const exists = await checkCompanyExists(companyName);
    if (exists) {
      await loadExistingCompanyData(companyName);
      window.location.href = 'html/game.html'; // Forward to game.html directly
    } else {
      localStorage.setItem('companyName', companyName);
      localStorage.setItem('money', 0); // Set initial money to 0
      localStorage.setItem('startingCountry', startingCondition ? startingCondition.name : 'France');

      // Set initial date values before logging the transaction
      localStorage.setItem('week', 1); // Initialize week
      localStorage.setItem('season', 'Spring'); // Initialize season
      localStorage.setItem('year', 2025); // Initialize year

      // Log the initial income transaction
      const startingMoney = startingCondition ? startingCondition.startingMoney : 1000000;
      addTransaction('Income', 'Initial Company Setup', startingMoney);

      // Create initial staff members based on starting country
      let staff1, staff2;
      const country = startingCondition ? startingCondition.name : 'France';

      switch (country) {
        case 'Italy':
          staff1 = createNewStaff(0.5, ['winery']);
          staff1.firstName = 'Roberto';
          staff1.lastName = 'De Luca';
          staff1.nationality = 'Italy';
          staff1.name = 'Roberto De Luca';
          
          staff2 = createNewStaff(0.5);
          staff2.firstName = 'Bianca';
          staff2.lastName = 'De Luca';
          staff2.nationality = 'Italy';
          staff2.name = 'Bianca De Luca';
          break;

        case 'France':
          staff1 = createNewStaff(0.5, ['winery']);
          staff1.firstName = 'Pierre';
          staff1.lastName = 'Latosha';
          staff1.nationality = 'France';
          staff1.name = 'Pierre Latosha';
          
          staff2 = createNewStaff(0.5);
          staff2.firstName = 'Camillé';
          staff2.lastName = 'Latosha';
          staff2.nationality = 'France';
          staff2.name = 'Camillé Latosha';
          break;

        case 'Germany':
          staff1 = createNewStaff(0.5, ['winery']);
          staff1.firstName = 'Anna';
          staff1.lastName = 'Weber';
          staff1.nationality = 'Germany';
          staff1.name = 'Anna Weber';
          
          staff2 = createNewStaff(0.5);
          staff2.firstName = 'Hans';
          staff2.lastName = 'Weber';
          staff2.nationality = 'Germany';
          staff2.name = 'Hans Weber';
          break;

        case 'Spain':
          staff1 = createNewStaff(0.5, ['winery']);
          staff1.firstName = 'Miguel';
          staff1.lastName = 'Torres';
          staff1.nationality = 'Spain';
          staff1.name = 'Miguel Torres';
          
          staff2 = createNewStaff(0.5);
          staff2.firstName = 'Isabella';
          staff2.lastName = 'Torres';
          staff2.nationality = 'Spain';
          staff2.name = 'Isabella Torres';
          break;

        case 'United States':
          staff1 = createNewStaff(0.5, ['winery']);
          staff1.firstName = 'Sarah';
          staff1.lastName = 'Mondavi';
          staff1.nationality = 'United States';
          staff1.name = 'Sarah Mondavi';
          
          staff2 = createNewStaff(0.5);
          staff2.firstName = 'Robert';
          staff2.lastName = 'Mondavi';
          staff2.nationality = 'United States';
          staff2.name = 'Robert Mondavi';
          break;
      }

      // Add staff to an array
      const staff = [staff1, staff2];

      // Save staff data using saveStaff
      saveStaff(staff);

      // Create starting farmland if provided
      if (startingCondition && startingCondition.startingFarmland) {
        // Use the pre-generated farmland data directly
        const farmland = startingCondition.startingFarmland;
        const farmlands = [farmland];
        localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
        farmlandsStore = farmlands; // Update the in-memory store
      } else {
        localStorage.setItem('ownedFarmlands', '[]');
        farmlandsStore = []; // Clear the in-memory store
      }

      // Save default teams to localStorage and in-memory storage
      const defaultTeams = getDefaultTeams();
      
      // Assign initial staff to their default teams
      const wineryTeam = defaultTeams.find(team => team.name === 'Winery Team');
      const adminTeam = defaultTeams.find(team => team.name === 'Administration Team');
      
      if (wineryTeam) {
        wineryTeam.members = [staff1];  // Staff ID 1 goes to Winery Team
      }
      if (adminTeam) {
        adminTeam.members = [staff2];    // Staff ID 2 goes to Administration Team
      }

      teams.push(...defaultTeams);
      saveTeams(teams);

      await saveCompanyInfo(); // Save company info to Firestore
      window.location.href = 'html/game.html'; // Redirect to game.html
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
    localStorage.setItem('upgrades', JSON.stringify(data.upgrades || [])); // Load upgrades
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
  const upgrades = JSON.parse(localStorage.getItem('upgrades')) || []; // Retrieve upgrades
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
      upgrades, // Save upgrades
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

// Functions to save and load upgrades from localStorage
export function storeUpgrades(upgrades) {
  localStorage.setItem('upgrades', JSON.stringify(upgrades));
}

export function loadUpgrades() {
  const upgradesJSON = localStorage.getItem('upgrades');
  if (upgradesJSON) {
    return JSON.parse(upgradesJSON);
  }
  return [];
}

// Function to load farmlands from localStorage
let farmlandsStore = [];

export function loadFarmlands() {
  const farmlandsJSON = localStorage.getItem('ownedFarmlands');
  if (farmlandsJSON) {
    farmlandsStore = JSON.parse(farmlandsJSON);
  }
  return farmlandsStore;
}

function saveFarmlandsToStorage() {
  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlandsStore));
}

export function addFarmland(farmland) {
  farmlandsStore.push(farmland);
  saveFarmlandsToStorage();
}

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

// Farmland management functions
export function getFarmlands() {
  return JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
}

export function updateAllFarmlands(farmlands) {
  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
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
      skills: staff.skills,
      skillLevel: staff.skillLevel,  // Save skill level
      specializedRoles: staff.specializedRoles  // Save specialized roles
    }))));
  }
}


export function loadStaff() {
  let staffMembers = [];
  let savedStaffData = localStorage.getItem('staffData');

  if (savedStaffData) {
    try {
      const parsedData = JSON.parse(savedStaffData);
      staffMembers = parsedData.map(item => {
        const staff = new Staff(
          item.name.split(' ')[0], 
          item.lastName, 
          item.skills, 
          item.skillLevel || 0.1  // Load skill level with fallback
        );
        staff.id = item.id;
        staff.nationality = item.nationality;
        staff.name = item.name;
        staff.workforce = item.workforce;
        staff.wage = item.wage;
        staff.specializedRoles = item.specializedRoles || [];  // Load specialized roles with fallback
        return staff;
      });
    } catch (error) {
      console.error("Failed to parse staff data from localStorage.", error);
    }
  }

  return staffMembers;
}

export function loadTeams() {
  const defaultTeams = getDefaultTeams();
  const savedTeams = JSON.parse(localStorage.getItem('teams') || '[]');
  const deletedDefaultTeams = JSON.parse(localStorage.getItem('deletedDefaultTeams') || '[]');
  
  // Filter out deleted default teams
  const activeDefaultTeams = defaultTeams.filter(team => 
      !deletedDefaultTeams.includes(team.name)
  );

  // First, get all saved versions of default teams (to preserve their members)
  const savedDefaultTeams = savedTeams.filter(team => 
      defaultTeams.some(defaultTeam => defaultTeam.name === team.name)
  );

  // Merge saved default teams with active default teams
  const mergedDefaultTeams = activeDefaultTeams.map(defaultTeam => {
      const savedVersion = savedDefaultTeams.find(t => t.name === defaultTeam.name);
      return savedVersion || defaultTeam;
  });

  // Get custom teams (non-default teams)
  const customTeams = savedTeams.filter(team => 
      !defaultTeams.some(defaultTeam => defaultTeam.name === team.name)
  );

  // Combine merged default teams with custom teams
  return [...mergedDefaultTeams, ...customTeams];
}

export function saveTeams(teams) {
  const defaultTeams = getDefaultTeams();
  const defaultTeamNames = defaultTeams.map(t => t.name);

  // Save all teams, including modified default teams
  localStorage.setItem('teams', JSON.stringify(teams));
  
  // Track deleted default teams
  const deletedDefaultTeams = defaultTeamNames.filter(name => 
      !teams.some(t => t.name === name)
  );
  localStorage.setItem('deletedDefaultTeams', JSON.stringify(deletedDefaultTeams));
}

// Prestige storage functions
export function getPrestigeHit() {
  const prestigeHit = localStorage.getItem('prestigeHit');
  return prestigeHit === null ? 0 : Number(prestigeHit);
}

export function setPrestigeHit(value) {
  if (value === null || value === undefined) {
    localStorage.removeItem('prestigeHit');
  } else {
    localStorage.setItem('prestigeHit', Number(value));
  }
}

export function saveCalculatedPrestige(value) {
  localStorage.setItem('calculatedPrestige', value.toString());
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
      // Remove the callback assignment here - it will be handled by TaskManager
      callback: null
    });
  });
  return tasks;
}

export function getTransactions() {
  return JSON.parse(localStorage.getItem('transactions')) || [];
}

export {
  storeCompanyName,
  saveCompanyInfo,
  clearLocalStorage,
  clearFirestore,
  loadInventory,
  checkCompanyExists,
  loadExistingCompanyData,
  saveInventory
};

