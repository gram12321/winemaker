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
  await saveTasksToFirestore();  // Save tasks before clearing
  localStorage.removeItem('companyName');
  localStorage.removeItem('money');
  localStorage.removeItem('day'); 
  localStorage.removeItem('season'); 
  localStorage.removeItem('year'); 
  localStorage.removeItem('ownedFarmlands'); 
  localStorage.removeItem('playerInventory');
  localStorage.removeItem('consoleMessages');
  localStorage.removeItem('tasks'); 
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
    localStorage.setItem('tasks', data.tasks || '[]');  // Load tasks into localStorage
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
  const tasks = localStorage.getItem('tasks');  // Get tasks from localStorage

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
      tasks  // Save tasks alongside other company data
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

async function saveTasksToFirestore() {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const companyName = localStorage.getItem('companyName');

  if (!companyName) {
      console.error("No company name set, cannot save tasks to Firestore.");
      return;
  }
  try {
      const tasksCollectionRef = collection(db, "companies", companyName, "tasks");

      const saveTasksPromises = tasks.map(taskInfo => {
          const taskRef = doc(tasksCollectionRef, String(taskInfo.taskId));
          return setDoc(taskRef, taskInfo); // Save each task individually
      });
      await Promise.all(saveTasksPromises); // Wait for all tasks to be saved
      console.log("Tasks saved to Firestore successfully.");
  } catch (error) {
      console.error("Error saving tasks to Firestore:", error);
  }
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

export const activeTasks = []; // Exported array to hold task references
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
              activeTasks.push(task); // Store reference to the created task
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