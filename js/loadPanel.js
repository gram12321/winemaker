// loadPanel.js
import { loadTasks, saveTask, removeTask } from './database/adminFunctions.js';
import { inventoryInstance } from './resource.js';
import { grapeCrushing } from '/js/wineprocessing.js';

// Function to initialize the task panel
function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);

            // Now the panel is initialized, and the task list should exist.
            loadTasks();
        });
}

// Standalone function to execute a task
export function executeTaskFunction(task) {
    // Run the task function
    if (task.taskFunction) {
        task.taskFunction();
    }

    // Check the condition
    if (task.conditionFunction && task.conditionFunction()) {
        // Task condition is fulfilled
        task.removeTaskBox();
        console.log(`Executing removeTask for ID: ${task.taskId}`); // Debugging output
        removeTask(task.taskId); // Use taskId for removal
    } else {
        console.log("Task condition not yet fulfilled.");
    }
}

import { instantiatedTasks } from './database/adminFunctions.js'; // Import the instantiatedTasks array

export function executeAllTasks() {
    instantiatedTasks.forEach(task => {
        executeTaskFunction(task); // Execute the task function for each instantiated task
    });
}

// Task class definition with static property for task ID management
export class Task {
    static latestTaskId = 0;  // Static property to track latest task ID

    constructor(taskName, taskFunction, conditionFunction, taskId = null) {
        this.taskName = taskName;
        this.taskFunction = taskFunction;
        this.conditionFunction = conditionFunction;
        this.taskId = taskId || Task.generateTaskId(); // Assign a new ID if not provided

        this.createTaskBox();
        console.log(`Task created with ID: ${this.taskId}`); // Debugging output
    }

    static generateTaskId() {
        return ++Task.latestTaskId; // Increment and return the new task ID
    }

    createTaskBox() {
        // Get the task list element
        const taskList = document.getElementById('task-list');
        if (!taskList) {
            console.error("Element 'task-list' not found");
            return;
        }

        // Create task box element
        const taskBox = document.createElement('div');
        taskBox.className = 'task-box bg-light p-2 mb-2';
        taskBox.innerHTML = `<strong>${this.taskName}</strong>`;

        // Button to execute the task
        const executeButton = document.createElement('button');
        executeButton.className = 'btn btn-primary btn-sm ml-2';
        executeButton.textContent = 'Execute';
        executeButton.onclick = () => this.executeTask();

        taskBox.appendChild(executeButton);

        // Append task box to task list
        taskList.appendChild(taskBox);

        // Store reference to task box for removal later
        this.taskBox = taskBox;
    }

    executeTask() {
        executeTaskFunction(this);
    }

    removeTaskBox() {
        if (this.taskBox) {
            this.taskBox.remove();
        }
    }
}

export { initializePanel };

// Initialize the panel
initializePanel();