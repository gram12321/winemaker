// loadPanel.js
import { loadTasks, saveTask, removeTask } from './database/adminFunctions.js';

function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);

            // Now the panel is initialized, and the task list should exist.
            // You can now safely create tasks

            loadTasks();
        });
}

// Initialize the panel
initializePanel();


export class Task {
  constructor(taskName, taskFunction, conditionFunction, taskId) {
    this.taskName = taskName;
    this.taskFunction = taskFunction;
    this.conditionFunction = conditionFunction;
    this.taskId = taskId; // store taskId
    this.createTaskBox();
    console.log(`Task created with ID: ${this.taskId}`); // Debugging output
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
        this.taskFunction();
        if (this.conditionFunction()) {
          this.removeTaskBox();
          console.log(`Executing removeTask for ID: ${this.taskId}`); // Debugging output
          removeTask(this.taskId); // Use taskId for removal
        } else {
          console.log("Task condition not yet fulfilled.");
        }
      }

  removeTaskBox() {
    if (this.taskBox) {
      this.taskBox.remove();
    }
  }
}

export { initializePanel };