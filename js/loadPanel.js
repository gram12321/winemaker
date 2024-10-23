// loadPanel.js
function initializePanel() {
    fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);

            document.querySelectorAll('.task-box').forEach(box => {
                box.addEventListener('click', (event) => {
                    const task = event.currentTarget.getAttribute('data-task');
                    startTask(task);
                });
            });
        });
}

function startTask(task) {
    console.log(`${task} started`);
    // Simulating a task delay using setTimeout
    setTimeout(() => {
        console.log(`${task} completed`);
        proceedToNextTask(task);
    }, 3000); // 3 seconds delay
}

function proceedToNextTask(task) {
    // Logic for determining and displaying the next task
    if (task === "grapeCrushing") {
        const taskList = document.getElementById('task-list');
        const newTaskBox = document.createElement('div');
        newTaskBox.className = 'task-box bg-secondary text-center mb-2';
        newTaskBox.dataset.task = 'fermentMust';
        newTaskBox.innerHTML = '<p class="m-0">Ferment Must</p>';
        newTaskBox.addEventListener('click', (event) => {
            const task = event.currentTarget.getAttribute('data-task');
            startTask(task);
        });
        taskList.appendChild(newTaskBox);
    }
}

initializePanel();