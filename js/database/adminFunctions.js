import { db, collection, getDocs, getDoc, deleteDoc, setDoc, doc } from './firebase.js';
import { inventoryInstance } from '../resource.js';
import { Task } from '../loadPanel.js'
import { grapeCrushing } from '/js/wineprocessing.js';
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
    localStorage.removeItem('day'); // Clear day
    localStorage.removeItem('season'); // Clear season
    localStorage.removeItem('year'); // Clear year
    localStorage.removeItem('ownedFarmlands'); // Clear land-related data
    localStorage.removeItem('playerInventory'); // Clear inventory data
    localStorage.removeItem('consoleMessages'); // Clear console messages
    localStorage.removeItem('tasks'); // Clear tasks
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
    // Load existing data into local storage
    const data = docSnap.data();
    localStorage.setItem('companyName', data.name);
    localStorage.setItem('money', data.money);
    localStorage.setItem('day', data.day); // Load day
    localStorage.setItem('season', data.season); // Load season
    localStorage.setItem('year', data.year); // Load year
    localStorage.setItem('ownedFarmlands', data.ownedFarmlands || '[]'); // Load owned farmlands
    localStorage.setItem('playerInventory', data.playerInventory || '[]'); // Load player inventory
  }
}

async function saveCompanyInfo() {
  const companyName = localStorage.getItem('companyName');
  const money = localStorage.getItem('money');
  const day = localStorage.getItem('day'); // Get the day
  const season = localStorage.getItem('season'); // Get the season
  const year = localStorage.getItem('year'); // Get the year
  const ownedFarmlands = localStorage.getItem('ownedFarmlands'); // Get owned farmlands

  // Retrieve the player inventory
  const playerInventory = localStorage.getItem('playerInventory'); // Get the inventory

  if (!companyName) {
    console.error("No company name found to save.");
    return;
  }

  try {
    const docRef = doc(db, "companies", companyName); // Reference a document named after the company
    await setDoc(docRef, { 
      name: companyName,
      money: money,
      day: day,
      season: season,
      year: year,
      ownedFarmlands: ownedFarmlands,
      playerInventory: playerInventory // Save inventory
    });
    console.log("Company info saved successfully");
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
      console.warn("playerInventory is not an array. Initializing with empty array.");
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
        // Add new task, ensure the taskId is already included in taskInfo
        tasks.push(taskInfo);
    } else {
        // Update the existing task
        tasks[existingTaskIndex] = taskInfo;
    }
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

export const instantiatedTasks = []; // Exported array to hold task references
export function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(taskInfo => {
        const resource = inventoryInstance.items.find(item => item.resource.name === taskInfo.resourceName && item.state === 'Grapes');
        if (resource) {
            const task = new Task(
                taskInfo.taskName,
                () => grapeCrushing(taskInfo.resourceName),
                () => Math.random() > taskInfo.conditionProbability,
                taskInfo.taskId // Ensure taskId is passed here
            );
            instantiatedTasks.push(task); // Store reference to the created task
        } else {
            addConsoleMessage(`Task ${taskInfo.taskName} could not be recreated: resource not available.`);
        }
    });
}

// Existing removeTask function with additional code
export function removeTask(taskId) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const initialTaskCount = tasks.length;

    tasks = tasks.filter(task => task.taskId !== taskId);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Update instantiatedTasks to remove the corresponding task
    const taskIndex = instantiatedTasks.findIndex(task => task.taskId === taskId);
    if (taskIndex !== -1) {
        instantiatedTasks.splice(taskIndex, 1); // Remove the task from instantiatedTasks
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