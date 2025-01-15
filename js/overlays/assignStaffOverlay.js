import { getFlagIconHTML } from '../utils.js';
import { loadStaff } from '../database/adminFunctions.js';
import taskManager from '../taskManager.js';

export function showAssignStaffOverlay(task) {
    const existingOverlay = document.querySelector('.overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const allStaff = loadStaff();
    const currentStaff = task.params.staff || [];

    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const staffList = allStaff.map(staff => `
        <tr>
            <td>${staff.name}</td>
            <td>${getFlagIconHTML(staff.nationality)} ${staff.nationality}</td>
            <td class="text-right">€${staff.wage}</td>
            <td>
                <input type="checkbox" 
                       class="staff-select" 
                       value="${staff.id}"
                       ${currentStaff.includes(staff.id) ? 'checked' : ''}>
            </td>
        </tr>
    `).join('');

    overlay.innerHTML = `
        <div class="overlay-content">
            <h2>Assign Staff to ${task.name}</h2>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Nationality</th>
                            <th>Wage</th>
                            <th>Select</th>
                        </tr>
                    </thead>
                    <tbody>${staffList}</tbody>
                </table>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary save-staff-btn">Save Assignments</button>
                <button class="btn btn-secondary cancel-btn">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Event Listeners
    overlay.querySelector('.save-staff-btn').addEventListener('click', () => {
        const selectedStaff = Array.from(overlay.querySelectorAll('.staff-select:checked'))
            .map(checkbox => parseInt(checkbox.value));
        taskManager.assignStaffToTask(task.id, selectedStaff);
        overlay.remove();
    });

    overlay.querySelector('.cancel-btn').addEventListener('click', () => {
        overlay.remove();
    });

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });
}
