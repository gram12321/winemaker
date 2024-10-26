import { db, collection, getDocs, getDoc, deleteDoc, setDoc, doc } from './firebase.js';
import { inventoryInstance } from '../resource.js';
import { Task } from '../loadPanel.js'
import { grapeCrushing } from '/js/wineprocessing.js';
import { plantAcres } from '/js/farmland.js';
import { addConsoleMessage } from '../console.js';

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

async function clearLocalStorage() {
  localStorage.removeItem('companyName');
  localStorage.removeItem('money');
  localStorage.removeItem('day'); 
  localStorage.removeItem('season'); 
  localStorage.removeItem('year'); 
  localStorage.removeItem('ownedFarmlands'); 
  localStorage.removeItem('playerInventory');
  localStorage.removeItem('consoleMessages');
  localStorage.removeItem('tasks'); 
  localStorage.removeItem('latestTaskId'); // Remove the latestTaskId from localStorage
  console.log("Local storage cleared.");

  // Reset 'latestTaskId' in memory
  Task.latestTaskId = 0;
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
        localStorage.setItem('money', 10000); // Initialize money with 10000
        localStorage.setItem('day', 1); // Initialize day
        localStorage.setItem('season', 'Spring'); // Initialize season
        localStorage.setItem('year', 2023); // Initialize year
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
        localStorage.setItem('day', data.day);
        localStorage.setItem('season', data.season);
        localStorage.setItem('year', data.year);
        localStorage.setItem('ownedFarmlands', data.ownedFarmlands || '[]');
        localStorage.setItem('playerInventory', data.playerInventory || '[]');
        localStorage.setItem('tasks', JSON.stringify(data.tasks || [])); // Load tasks into localStorage

        // Restore latestTaskId from Firestore
        Task.latestTaskId = data.latestTaskId || 0;
        localStorage.setItem('latestTaskId', Task.latestTaskId.toString());
    }
}

async function saveCompanyInfo() {
  const companyName = localStorage.getItem('companyName');
  const money = localStorage.getItem('money');
  const day = localStorage.getItem('day');
  const season = localStorage.getItem('season');
  const year = localStorage.getItem('year');
  const ownedFarmlands = localStorage.getItem('ownedFarmlands');
  const playerInventory = localStorage.getItem('playerInventory');
  const tasks = JSON.parse(localStorage.getItem('tasks')) || []; // Retrieve tasks as an array

  if (!companyName) {
    console.error("No company name found to save.");
    return;
  }

  try {
    const docRef = doc(db, "companies", companyName);
    await setDoc(docRef, { 
      name: companyName,
      money,
      day,
      season,
      year,
      ownedFarmlands,
      playerInventory,
      tasks, // Store tasks directly in the company document
      latestTaskId: Task.latestTaskId // Save the latestTaskId
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
      console.log("playerInventory is not an array. Most likely nothing is in inventory");
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
        // Log the taskInfo for debugging purposes
        console.log("Attempting to load task:", taskInfo);

        if (taskInfo.taskName === "Crushing Grapes") {
            const resource = inventoryInstance.items.find(item => item.resource.name === taskInfo.resourceName && item.state === 'Grapes');

            if (resource) {
                const task = new Task(
                    taskInfo.taskName,
                    () => grapeCrushing(taskInfo.resourceName),
                    taskInfo.taskId,
                    taskInfo.workTotal,
                    taskInfo.resourceName,
                    taskInfo.resourceState,
                    taskInfo.vintage,
                    taskInfo.quality,
                    taskInfo.iconPath
                );
                task.workProgress = taskInfo.workTotal - resource.amount;
                task.updateProgressBar(); // Ensure progress bar is correctly updated
                activeTasks.push(task);
                addConsoleMessage(`Loaded task: ${taskInfo.taskName} for resource: ${taskInfo.resourceName}.`);
            } else {
                addConsoleMessage(`Task ${taskInfo.taskName} could not be recreated: resource ${taskInfo.resourceName} not available.`);
            }
        } else if (taskInfo.taskName === "Planting") {
            const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
            const field = farmlands[taskInfo.fieldId];

            if (field) {
                const task = new Task(
                    taskInfo.taskName,
                    () => plantAcres(taskInfo.fieldId, taskInfo.resourceName),
                    taskInfo.taskId,
                    taskInfo.workTotal,
                    taskInfo.resourceName,
                    taskInfo.resourceState,
                    '',  // Planting tasks might not involve vintage or quality
                    '',  // Consider this based on more relevant planting attributes
                    taskInfo.iconPath
                );

                task.fieldId = taskInfo.fieldId; // Properly assign fieldId

                task.workProgress = field.currentAcresPlanted || 0;
                task.updateProgressBar(); // Ensure progress bar is correctly updated
                activeTasks.push(task);
                addConsoleMessage(`Loaded planting task for field ID: ${taskInfo.fieldId}`);
            } else {
                addConsoleMessage(`Task ${taskInfo.taskName} could not be recreated: field ID ${taskInfo.fieldId} not available.`);
            }
        }
    });

    // Log the activeTasks array for debugging purposes
    console.log("Active tasks after loading:", activeTasks);
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
        console.warn(`Task with ID ${taskId} was not found or removed. Check if the correct ID is being passed.`);
    } else {
        console.log(`Task with ID ${taskId} successfully removed.`);
    }
}



export { storeCompanyName, saveCompanyInfo, clearLocalStorage, clearFirestore, loadInventory, saveInventory };