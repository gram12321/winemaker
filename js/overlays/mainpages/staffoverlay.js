import { displayStaff } from '/js/staff.js';
import { showHireStaffOptionsOverlay } from '/js/overlays/hireStaffOptionsOverlay.js';
import { showTeamManagementOverlay } from '/js/overlays/teamManagementOverlay.js';
import { showMainViewOverlay } from '../overlayUtils.js';
import taskManager, { TaskType } from '../../taskManager.js';
import { addConsoleMessage } from '../../console.js';

export function showStaffOverlay() {
    const overlay = showMainViewOverlay(createStaffOverlayHTML());
    setupStaffOverlayEventListeners(overlay);
}

function createStaffOverlayHTML() {
    return `
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Staff Management</h2>

            <div class="overlay-sections">
                <section id="staff-section" class="overlay-section card mb-4">
                    <img src="/assets/pic/staff_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Staff">
                    <div class="card-header text-white d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, var(--color-accent), #8B4513);">
                        <h3 class="h5 mb-0">Staff Overview</h3>
                        <div class="btn-group">
                            <button class="btn btn-light btn-sm" id="team-management-btn">Team Management</button>
                            <button class="btn btn-light btn-sm" id="hire-staff-btn">Hire Staff</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="staff-container" class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Nationality</th>
                                        <th>Workforce</th>
                                        <th>Wage (€)</th>
                                        <th>Assigned Tasks</th>
                                        <th class="skills-column">Skills</th>
                                    </tr>
                                </thead>
                                <tbody id="staff-entries">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

function setupStaffOverlayEventListeners(overlay) {
    displayStaff();

    const hireStaffBtn = overlay.querySelector('#hire-staff-btn');
    const teamManagementBtn = overlay.querySelector('#team-management-btn');
    
    if (hireStaffBtn) {
        hireStaffBtn.addEventListener('click', () => {
            showHireStaffOptionsOverlay();
        });
    }
    
    if (teamManagementBtn) {
        teamManagementBtn.addEventListener('click', () => {
            showTeamManagementOverlay();
        });
    }
}