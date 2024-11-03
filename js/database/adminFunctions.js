import { db, collection, getDocs, getDoc, deleteDoc, setDoc, doc } from './firebase.js';
import { inventoryInstance } from '../resource.js';
import { Task } from '../loadPanel.js'
import { grapeCrushing, fermentMust } from '/js/wineprocessing.js';
import { plantAcres, uproot } from '/js/farmland.js';
import { harvestAcres} from '/js/vineyard.js';
import { Staff } from '/js/staff.js'; // Adjust the import path if necessary


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
  localStorage.removeItem('ownedFarmlands');
  localStorage.removeItem('playerInventory');
  localStorage.removeItem('consoleMessages');
  localStorage.removeItem('tasks');
  localStorage.removeItem('latestTaskId');
  localStorage.removeItem('staffData'); // Clear staff data
  console.log("Local storage cleared.");
  Task.latestTaskId = 0; // Reset in memory
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
        localStorage.setItem('money', 10000000); // Initialize money with 10000000
        localStorage.setItem('week', 1); // Initialize day
        localStorage.setItem('season', 'Spring'); // Initialize season
        localStorage.setItem('year', 2023); // Initialize year

        // Create two staff members with the same nationality
        const staff1 = new Staff();
        const staff2 = new Staff();
        staff2.nationality = staff1.nationality; // Ensure same nationality

        // Add staff to an array
        const staff = [staff1, staff2];

        // Store staff data in localStorage
        localStorage.setItem('staffData', JSON.stringify(staff.map(staff => ({
          id: staff.id,
          nationality: staff.nationality,
          name: staff.name,
          workforce: staff.workforce,
          wage: staff.wage // Add wage to the stored data
        }))));

        saveCompanyInfo(); // Save company info to firestore
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
    localStorage.setItem('staffData', data.staffData || '[]'); // Restore staff data
    localStorage.setItem('tasks', JSON.stringify(data.tasks || []));
    Task.latestTaskId = data.latestTaskId || 0;
    localStorage.setItem('latestTaskId', Task.latestTaskId.toString());
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
  const staffData = localStorage.getItem('staffData'); // Retrieve staff data
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

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
      staffData, // Save staff data
      tasks,
      latestTaskId: Task.latestTaskId
    });
    console.log("Company info and tasks saved successfully.");
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
      item.resource.name,
      item.amount,
      item.state,
      item.vintage,
      item.quality
    );
  });
}

// Load the inventory at the start
loadInventory();

// Function to save inventory to localStorage
function saveInventory() {
  localStorage.setItem('playerInventory', JSON.stringify(inventoryInstance.items));
}



export function saveTask(taskInfo) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Find if the task already exists based on taskId
    const existingTaskIndex = tasks.findIndex(task => task.taskId === taskInfo.taskId);

    if (existingTaskIndex === -1) {
        tasks.push(taskInfo); // New task
    } else {
        tasks[existingTaskIndex] = taskInfo; // Update existing task
    }

    localStorage.setItem('tasks', JSON.stringify(tasks));
}

export const activeTasks = []; // Exported array to hold task references

export function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    Task.latestTaskId = parseInt(localStorage.getItem('latestTaskId'), 10) || 0;
    activeTasks.length = 0; // Clear existing active tasks

    tasks.forEach(taskInfo => {
        const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
        const field = farmlands[taskInfo.fieldId];

        let executeTaskFunction;
        let task;
        let resource;

        // Determine the function to execute based on task type
        if (taskInfo.taskName === "Crushing Grapes") {
            resource = inventoryInstance.items.find(item => item.resource.name === taskInfo.resourceName && item.state === 'Grapes');
            if (resource) {
                executeTaskFunction = () => grapeCrushing(taskInfo.resourceName);
            }
        } else if (taskInfo.taskName === "Fermenting") {
            resource = inventoryInstance.items.find(item => item.resource.name === taskInfo.resourceName && item.state === 'Must');
            if (resource) {
                executeTaskFunction = () => fermentMust(taskInfo.resourceName);
            }
        } else if (field) {
            switch (taskInfo.taskName) {
                case "Planting":
                    executeTaskFunction = () => plantAcres(taskInfo.fieldId, taskInfo.resourceName);
                    break;
                case "Harvesting":
                    executeTaskFunction = () => harvestAcres(taskInfo.fieldId);
                    break;
                case "Uprooting":
                    executeTaskFunction = () => uproot(taskInfo.fieldId);
                    break;
                default:
                    console.warn(`Unknown task name: ${taskInfo.taskName}`);
            }
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
                taskInfo.fieldName // Pass fieldName
            );

            // Assign common properties for all tasks
            Object.assign(task, {
                fieldId: taskInfo.fieldId, // Assign if applicable
                fieldName: taskInfo.fieldName, // Assign if applicable
                vintage: taskInfo.vintage // Assign vintage
            });

            // Handle task-specific progress
            if (taskInfo.taskName === "Crushing Grapes" && resource) {
                task.workProgress = taskInfo.workTotal - resource.amount;
            } else if (taskInfo.taskName === "Fermenting" && resource) {
                task.workProgress = taskInfo.workTotal - resource.amount;
            } else if (taskInfo.taskName === "Planting") {
                task.workProgress = field.currentAcresPlanted || 0;
            } else if (taskInfo.taskName === "Harvesting") {
                task.workProgress = field.currentAcresHarvested || 0;
            } else if (taskInfo.taskName === "Uprooting") {
                task.workProgress = field.currentAcresUprooted || 0;
            }

            task.updateProgressBar();
            activeTasks.push(task);
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

    // Debugging: Log whether a task was removed
    const tasksAfterRemoval = JSON.parse(localStorage.getItem('tasks'));
    if (initialTaskCount === tasksAfterRemoval.length) {
        
    } 
}


// Function to save the list of staff members to localStorage
export function saveStaff(staffMembers) {
    if (Array.isArray(staffMembers)) {
        localStorage.setItem('staffData', JSON.stringify(staffMembers.map(staff => ({
            id: staff.id,
            nationality: staff.nationality,
            name: staff.name,
            workforce: staff.workforce
        }))));
        console.log("Staff data saved successfully.");
    } else {
        console.error("Failed to save staff: input is not an array.");
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
                staff.workforce = item.workforce;
                return staff;
            });
            console.log("Staff data loaded successfully.");
        } catch (error) {
            console.error("Failed to parse staff data from localStorage.", error);
        }
    }

    return staffMembers;
}


export { storeCompanyName, saveCompanyInfo, clearLocalStorage, clearFirestore, loadInventory, saveInventory };