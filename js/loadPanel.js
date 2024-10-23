// loadPanel.js

function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);
        });
}

const tasks = [];

function spawnTask(taskName, taskFunction, conditionFunction) {
    const taskList = document.getElementById('task-list');
    if (!taskList) {
        console.error("Task list element not found.");
        return;
    }
    const taskBox = document.createElement('div');
    taskBox.className = 'task-box bg-secondary text-center mb-2';
    taskBox.dataset.task = taskName;
    taskBox.innerHTML = `<p class="m-0">${taskName}</p>`;
    taskList.appendChild(taskBox);
    tasks.push({
        taskName,
        taskFunction,
        conditionFunction,
        taskBox
    });
}

initializePanel()
export { initializePanel, spawnTask, tasks };