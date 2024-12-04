// loadPanel.js
import { loadStaff} from './database/adminFunctions.js';
import { saveStaff, loadBuildings, storeBuildings   } from './database/adminFunctions.js';
import { addConsoleMessage } from './console.js';
import { formatNumber } from './utils.js';
import { Building } from './buildings.js';
import { selectContainerOverlay } from './overlays/selectContainerOverlay.js';

// Initialize Task Panel
function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);

           ;
        });
}



function openStaffOverlay(currentStaff, staffTaskId, updateTaskBoxCallback) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const overlayContent = document.createElement('div');
    overlayContent.className = 'overlay-content';
    const staffData = loadStaff().map(staff => ({
        ...staff,
        isAssigned: currentStaff.includes(staff.id.toString())
    }));

    // Building UI for staff selection
    overlayContent.innerHTML = `
        <h2>Select Staff</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Nationality</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${staffData.map(({ id, name, nationality, isAssigned }) => `
                    <tr>
                        <td>${name}</td>
                        <td>${nationality}</td>
                        <td>
                            <button class="select-staff" data-id="${id}">
                                ${isAssigned ? 'Remove' : 'Select'}
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <span class="close-btn">Close</span>
    `;
    overlay.appendChild(overlayContent);
    document.body.appendChild(overlay);

    // Close button functionality
    overlay.querySelector('.close-btn').addEventListener('click', () => overlay.remove());

    // Handle staff selection and removal
    overlay.querySelectorAll('.select-staff').forEach(button => {
        button.addEventListener('click', ({ currentTarget }) => {
            const staffId = currentTarget.getAttribute('data-id');
            const isAssigned = currentStaff.includes(staffId);

            if (isAssigned) {
                // Remove staff from task
                currentStaff = currentStaff.filter(id => id !== staffId);
                currentTarget.textContent = 'Select'; // Toggle button label
            } else {
                // Add staff to task
                currentStaff.push(staffId);
                currentTarget.textContent = 'Remove'; // Toggle button label
            }

            // Update the task box to reflect changes
            updateTaskBoxCallback(currentStaff);

            // Update the specific task data in localStorage
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const taskIndex = tasks.findIndex(task => task.taskId === staffTaskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].staff = currentStaff;
                saveTask(tasks[taskIndex]);
            }
        });
    });
}

export { initializePanel };