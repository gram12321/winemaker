import { displayStaff } from '/js/staff.js';
import { showHireStaffOptionsOverlay } from '/js/overlays/hireStaffOptionsOverlay.js';
import { showMainViewOverlay } from '../overlayUtils.js';
import { loadStaff, loadTeams, saveTeams  } from '/js/database/initiation.js';
import { addConsoleMessage } from '/js/console.js';
import { getDefaultTeams } from '../../staff.js';
    

let teams = []; // In-memory storage for teams
let staffMembers = []; // In-memory storage for staff members

export function showStaffOverlay() {
    teams = loadTeams(); // Load teams once
    const overlay = showMainViewOverlay(createStaffOverlayHTML());
    setupStaffOverlayEventListeners(overlay);
    if (tutorialManager.shouldShowTutorial('STAFF')) {
        tutorialManager.showTutorial('STAFF');
    }
}

export function renderTeamMembersHTML() {
    staffMembers = loadStaff(); // Refresh staff members
    return staffMembers.map(staff => `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="${staff.id}" id="staff-${staff.id}">
            <label class="form-check-label" for="staff-${staff.id}">
                ${staff.firstName} ${staff.lastName}
            </label>
        </div>
    `).join('');
}

function createStaffOverlayHTML() {
    staffMembers = loadStaff(); // Load staff members once

    return `
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Staff Management</h2>

            <div class="overlay-sections">
                <section id="staff-section" class="overlay-section card mb-4">
                    <img src="/assets/pic/staff_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Staff">
                    <div class="card-header text-white d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, var(--color-accent), #8B4513);">
                        <h3 class="h5 mb-0">Staff Overview</h3>
                        <div class="btn-group">
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
                <section id="team-section" class="overlay-section card mb-4">
                    <div class="card-header text-white d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, var(--color-accent), #8B4513);">
                        <h3 class="h5 mb-0">Team Management</h3>
                    </div>
                    <div class="card-body">
                        <div class="team-management-grid">
                            <div class="options-container">
                                <!-- Team cards will be dynamically added here -->
                            </div>
                            <div class="options-info-box">
                                <!-- Team details will be shown here -->
                            </div>
                            <div id="team-members-section">
                                <h4>Team Members</h4>
                                <div id="team-members" class="form-control" style="height: auto; max-height: 200px; overflow-y: auto;">
                                    ${renderTeamMembersHTML()}
                                </div>
                            </div>
                        </div>
                        <hr class="overlay-divider">
                        <div class="d-flex flex-column gap-2">
                            <button class="btn btn-primary w-100" id="update-team-btn">Update Team</button>
                            <button class="btn btn-danger w-100" id="delete-team-btn">Delete Team</button>
                            <button class="btn btn-primary w-100" id="toggle-create-team">
                                Create New Team <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <div id="create-team-form" style="display: none;">
                            <div class="form-group mb-3">
                                <label for="team-name">Team Name:</label>
                                <input type="text" id="team-name" class="form-control" placeholder="Enter team name" required>
                            </div>
                            <div class="form-group mb-3">
                                <label for="team-description">Team Description:</label>
                                <textarea id="team-description" class="form-control" rows="3" placeholder="Enter team description" required></textarea>
                            </div>
                            <button class="btn btn-primary" id="save-team-btn">Save Team</button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

function setupStaffOverlayEventListeners(overlay) {
    displayStaff();
    setupHireStaffButton(overlay);
    setupTeamSections(overlay);
    setupSaveTeamButton(overlay);
    setupCreateTeamToggle(overlay); // Add this line
}

export function setupTeamSections(overlay) {
    const teams = loadTeams();
    const teamSection = overlay.querySelector('#team-section');
    const optionsContainer = teamSection.querySelector('.options-container');

    optionsContainer.innerHTML = '';
    teams.forEach(team => {
        optionsContainer.innerHTML += `
            <div class="option-card" data-team="${team.name}">
                <div class="option-header">
                    <img src="/assets/icon/icon_${team.flagCode}.webp" 
                         alt="${team.name}" 
                         style="width: 24px; height: 24px;"
                         onerror="this.style.display='none'">
                    <h4>${team.name}</h4>
                </div>
                <div class="option-description">
                    ${team.description}
                </div>
            </div>
        `;
    });

    // Add click handlers for option cards
    optionsContainer.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', () => {
            optionsContainer.querySelectorAll('.option-card').forEach(c => 
                c.classList.remove('active'));
            card.classList.add('active');
            const teamName = card.dataset.team;
            const selectedTeam = teams.find(t => t.name === teamName);
            if (selectedTeam) {
                updateTeamInfo(selectedTeam);
            }
        });
    });

    // Show first team by default
    if (teams.length > 0) {
        const firstCard = optionsContainer.querySelector('.option-card');
        if (firstCard) {
            firstCard.classList.add('active');
            updateTeamInfo(teams[0]);
        }
    }
}

function updateTeamInfo(team) {
    const infoBox = document.querySelector('.options-info-box');
    const memberSection = document.querySelector('#team-members-section');

    // First, reset all checkboxes
    const checkboxes = memberSection.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    // Then set checked state based on current team members
    if (team.members && Array.isArray(team.members)) {
        team.members.forEach(member => {
            const checkbox = memberSection.querySelector(`input[value="${member.id}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    // Add event listener for update button
    const updateBtn = document.getElementById('update-team-btn');
    updateBtn.onclick = () => {
        const selectedStaffIds = Array.from(memberSection.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => parseInt(cb.value));

        // Update team members based on checkbox state
        let teams = loadTeams();
        const teamIndex = teams.findIndex(t => t.name === team.name);
        if (teamIndex !== -1) {
            // Get all staff members that are checked
            const updatedMembers = staffMembers.filter(staff => 
                selectedStaffIds.includes(staff.id)
            );

            // Create new team object with updated members
            const updatedTeam = {
                ...teams[teamIndex],
                members: updatedMembers
            };

            teams[teamIndex] = updatedTeam;
            saveTeams(teams);
            
            addConsoleMessage(`Team "${team.name}" members have been updated`);
            setupTeamSections(document.querySelector('.mainview-overlay-content'));
            updateTeamInfo(updatedTeam); // Refresh the current view
        }
    };

    // Update info box display
    infoBox.innerHTML = `
        <div class="info-header">
            <img src="/assets/icon/icon_${team.flagCode}.webp" 
                 alt="${team.name}" 
                 style="width: 24px; height: 24px;"
                 onerror="this.style.display='none'">
            <h4>${team.name} Details</h4>
        </div>
        <div class="info-content">
            <div class="info-row">
                <span class="info-label">Description:</span>
                <span class="info-value">${team.description}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Team Members:</span>
                <div class="info-value">
                    ${Array.isArray(team.members) && team.members.length > 0 
                        ? team.members.map(member => 
                            `<div class="team-member">${member.firstName} ${member.lastName}</div>`
                        ).join('')
                        : '<em>No members assigned</em>'}
                </div>
            </div>
            <div class="info-row mt-3">
                <label class="form-label">Auto-assign to task types:</label>
                <div class="task-type-checkboxes">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="field-tasks" 
                               ${team.defaultTaskTypes?.includes('Field') ? 'checked' : ''}>
                        <label class="form-check-label" for="field-tasks">Field Tasks</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="winery-tasks" 
                               ${team.defaultTaskTypes?.includes('Winery') ? 'checked' : ''}>
                        <label class="form-check-label" for="winery-tasks">Winery Tasks</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="administration-tasks" 
                               ${team.defaultTaskTypes?.includes('Administration') ? 'checked' : ''}>
                        <label class="form-check-label" for="administration-tasks">Administration Tasks</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="sales-tasks" 
                               ${team.defaultTaskTypes?.includes('Sales') ? 'checked' : ''}>
                        <label class="form-check-label" for="sales-tasks">Sales Tasks</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="maintenance-tasks" 
                               ${team.defaultTaskTypes?.includes('Building & Maintenance') ? 'checked' : ''}>
                        <label class="form-check-label" for="maintenance-tasks">Maintenance Tasks</label>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add event listeners for task type checkboxes
    const taskTypeMap = {
        'field-tasks': 'Field',
        'winery-tasks': 'Winery',
        'administration-tasks': 'Administration',
        'sales-tasks': 'Sales',
        'maintenance-tasks': 'Building & Maintenance'
    };

    Object.entries(taskTypeMap).forEach(([checkboxId, taskType]) => {
        const checkbox = infoBox.querySelector(`#${checkboxId}`);
        checkbox.addEventListener('change', () => {
            let teams = loadTeams();
            const teamIndex = teams.findIndex(t => t.name === team.name);
            if (teamIndex !== -1) {
                // Initialize defaultTaskTypes array if it doesn't exist
                if (!teams[teamIndex].defaultTaskTypes) {
                    teams[teamIndex].defaultTaskTypes = [];
                }

                // Add or remove the task type based on checkbox state
                if (checkbox.checked) {
                    if (!teams[teamIndex].defaultTaskTypes.includes(taskType)) {
                        teams[teamIndex].defaultTaskTypes.push(taskType);
                    }
                } else {
                    teams[teamIndex].defaultTaskTypes = teams[teamIndex].defaultTaskTypes.filter(t => t !== taskType);
                }

                saveTeams(teams);
                addConsoleMessage(`Updated auto-assignment settings for "${team.name}"`);
            }
        });
    });

    // Add event listener for delete button
    const deleteBtn = document.getElementById('delete-team-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const teamName = team.name; // Use the current team's name
            const defaultTeams = getDefaultTeams();
            const isDefaultTeam = defaultTeams.some(t => t.name === teamName);

            if (isDefaultTeam) {
                const warningModal = document.createElement('div');
                warningModal.className = 'modal fade';
                warningModal.innerHTML = `
                    <div class="modal-dialog">
                        <div class="modal-content overlay-section">
                            <div class="modal-header card-header">
                                <h3 class="modal-title">Warning: Default Team Deletion</h3>
                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                            </div>
                            <div class="modal-body">
                                <p>Warning: "${teamName}" is a default team. Deleting it cannot be undone.</p>
                                <p>Are you sure you want to delete this team?</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="overlay-section-btn" data-dismiss="modal">Cancel</button>
                                <button type="button" class="overlay-section-btn" id="confirmDelete">Delete Team</button>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(warningModal);
                $(warningModal).modal('show');

                document.getElementById('confirmDelete').addEventListener('click', () => {
                    let teams = loadTeams();
                    teams = teams.filter(t => t.name !== teamName);
                    saveTeams(teams);
                    addConsoleMessage(`Team "${teamName}" has been deleted`);
                    setupTeamSections(document.querySelector('.mainview-overlay-content'));
                    $(warningModal).modal('hide');
                    warningModal.remove();
                });

                warningModal.addEventListener('hidden.bs.modal', () => {
                    warningModal.remove();
                });
                return;
            }

            let teams = loadTeams();
            teams = teams.filter(t => t.name !== teamName);
            saveTeams(teams);
            addConsoleMessage(`Team "${teamName}" has been deleted`);
            setupTeamSections(document.querySelector('.mainview-overlay-content'));
        });
    }
}

function setupHireStaffButton(overlay) {
    const hireStaffBtn = overlay.querySelector('#hire-staff-btn');
    if (hireStaffBtn) {
        hireStaffBtn.addEventListener('click', () => {
            showHireStaffOptionsOverlay();
        });
    }
}

function setupTeamManagementButton(overlay) {
    const manageTeamBtn = overlay.querySelector('#manage-team-btn');
    if (manageTeamBtn) {
        manageTeamBtn.addEventListener('click', () => {
            showTeamManagementOverlay();
        });
    }
}

function setupCreateTeamToggle(overlay) {
    const toggleBtn = overlay.querySelector('#toggle-create-team');
    const createTeamForm = overlay.querySelector('#create-team-form');
    const chevron = toggleBtn.querySelector('i');

    if (toggleBtn && createTeamForm) {
        toggleBtn.addEventListener('click', () => {
            const isVisible = createTeamForm.style.display !== 'none';
            createTeamForm.style.display = isVisible ? 'none' : 'block';
            chevron.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        });
    }
}

function createNewTeam(overlay) {
    const teamName = overlay.querySelector('#team-name').value;
    const teamDescription = overlay.querySelector('#team-description').value;

    if (!teamName || !teamDescription) {
        addConsoleMessage('Please fill in all required fields');
        return null;
    }

    return {
        name: teamName,
        description: teamDescription,
        flagCode: teamName.toLowerCase().replace(/\s+/g, ''),
        teamPicture: 'placeholder.webp',
        members: [] // Initialize with empty members array
    };
}

export function updateTeamMembersSection() {
    const teamMembersDiv = document.querySelector('#team-members');
    if (teamMembersDiv) {
        teamMembersDiv.innerHTML = renderTeamMembersHTML();
        // If there's an active team, refresh its checked state
        const activeTeamCard = document.querySelector('.option-card.active');
        if (activeTeamCard) {
            const teamName = activeTeamCard.dataset.team;
            const teams = loadTeams();
            const selectedTeam = teams.find(t => t.name === teamName);
            if (selectedTeam) {
                updateTeamInfo(selectedTeam);
            }
        }
    }
}

function setupSaveTeamButton(overlay) {
    const saveTeamBtn = overlay.querySelector('#save-team-btn');
    if (saveTeamBtn) {
        saveTeamBtn.addEventListener('click', () => {
            const teamNameInput = overlay.querySelector('#team-name');
            const teamDescInput = overlay.querySelector('#team-description');
            const teamName = teamNameInput.value;
            const teams = loadTeams();

            if (teams.some(team => team.name === teamName)) {
                addConsoleMessage('A team with this name already exists. Please choose a different name.');
                return;
            }

            const newTeam = createNewTeam(overlay);
            if (newTeam) {
                teams.push(newTeam);
                saveTeams(teams);

                // Reset form
                teamNameInput.value = '';
                teamDescInput.value = '';

                addConsoleMessage(`Team "${teamName}" has been created`);
                setupTeamSections(overlay);
            }
        });
    }
}