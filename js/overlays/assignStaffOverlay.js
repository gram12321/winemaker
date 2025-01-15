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
    overlay.className = 'overlay assign-staff-overlay';

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
            <section class="overlay-section card">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h2 class="mb-0">Assign Staff to ${task.name}</h2>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Nationality</th>
                                    <th>Skills</th>
                                    <th class="text-right">Wage</th>
                                    <th>Select</th>
                                </tr>
                            </thead>
                            <tbody>${staffList}</tbody>
                        </table>
                    </div>
                    
                </div>
                <div class="btn-group mt-3">
                        <button class="btn btn-primary save-staff-btn">Save Assignments</button>
                    </div>
            </section>
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

    overlay.querySelector('.close-btn').addEventListener('click', () => {
        overlay.remove();
    });

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });
}
