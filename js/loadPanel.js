// loadPanel.js
import { loadTasks, removeTask } from './database/adminFunctions.js';
import { activeTasks } from './database/adminFunctions.js'; // Import the instantiatedTasks array

// Function to initialize the task panel
function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);

            // Now the panel is initialized, and the task list should exist.
            loadTasks(); // This ensures tasks are loaded freshly onto the panel
        });
}

export function executeAllTasks() {
        activeTasks.forEach(task => {
        executeTaskFunction(task); // Execute the task function for each instantiated task
    });
}

// Standalone function to execute a task
export class Task {
    // Initialize 'latestTaskId' from localStorage, or start at 0 if not set
    static latestTaskId = parseInt(localStorage.getItem('latestTaskId'), 10) || 0;

    constructor(taskName, taskFunction, taskId = null, workTotal = 0) {
        this.taskName = taskName;
        this.taskFunction = taskFunction;
        this.taskId = taskId || Task.generateTaskId();
        this.workTotal = workTotal;
        this.workProgress = 0; // Initialize progress to zero

        this.createTaskBox();
        console.log(`Task created with ID: ${this.taskId}`);
    }

    static generateTaskId() {
        const newTaskId = ++Task.latestTaskId; // Increment the task ID
        // Store the new task ID back in localStorage
        localStorage.setItem('latestTaskId', newTaskId);
        return newTaskId;
    }

    createTaskBox() {
        // Get the task list element
        const taskList = document.getElementById('task-list');
        if (!taskList) {
            console.error("Element 'task-list' not found");
            return;
        }

        // Create the task box element
        const taskBox = document.createElement('div');
        taskBox.className = 'task-box bg-light p-2 mb-2';
        taskBox.innerHTML = `<strong>${this.taskName}</strong>`;

        // Create the execute button
        const executeButton = document.createElement('button');
        executeButton.className = 'btn btn-primary btn-sm ml-2';
        executeButton.textContent = 'Execute';
        executeButton.onclick = () => executeTaskFunction(this);

        // Add the progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress mt-2';
        progressBar.innerHTML = `
            <div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
        `;

        // Append the button and progress bar to the task box
        taskBox.appendChild(executeButton);
        taskBox.appendChild(progressBar);

        // Append task box to task list
        taskList.appendChild(taskBox);

        // Store reference to task box for future updates
        this.taskBox = taskBox;
    }

    updateProgressBar() {
        if (this.taskBox) {
            const progressBar = this.taskBox.querySelector('.progress-bar');
            const progress = (this.workProgress / this.workTotal) * 100;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
    }

    removeTaskBox() {
        if (this.taskBox) {
            this.taskBox.remove();
        }
    }
}

// Note: Ensure the executeTaskFunction is updated to increment workProgress like below:

export function executeTaskFunction(task) {
    // Run the task function
    if (task.taskFunction) {
        task.taskFunction();
        task.workProgress++; // Assume progress increment per execution
        task.updateProgressBar(); // Update the progress bar
    }

    // Check the progress
    if (task.workProgress >= task.workTotal) { // Evaluate progress instead of using conditionFunction
        // Task is complete
        task.removeTaskBox();
        console.log(`Executing removeTask for ID: ${task.taskId}`); // Debugging output
        removeTask(task.taskId); // Use taskId for removal
    } else {
        console.log(`Task condition not yet fulfilled. Progress: ${task.workProgress}/${task.workTotal}`);
    }
}

export { initializePanel };

