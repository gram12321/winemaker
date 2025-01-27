import { addConsoleMessage } from '../console.js';
import { formatNumber, skillLevels, getSkillLevelInfo  } from '../utils.js';
import { showHireStaffOverlay } from './hirestaffoverlay.js';
import taskManager, { TaskType } from '../taskManager.js';
import { showStandardOverlay, hideOverlay } from './overlayUtils.js';
import { addTransaction} from '../finance.js'
import { getMoney } from '../database/adminFunctions.js';

// Add new constant for specialized roles
export const specializedRoles = {
    field: { title: "Vineyard Manager", description: "Expert in vineyard operations" },
    winery: { title: "Master Winemaker", description: "Specialist in wine production" },
    administration: { title: "Estate Administrator", description: "Expert in business operations" },
    sales: { title: "Sales Director", description: "Specialist in wine marketing and sales" },
    maintenance: { title: "Technical Director", description: "Expert in facility maintenance" }
};

function calculateSearchCost(numberOfCandidates, skillLevel, selectedRoles) {
    const baseCost = 2000;
    const skillMultiplier = skillLevels[skillLevel].costMultiplier;
    
    // Exponential scaling based on candidates and skill
    const candidateScaling = Math.pow(numberOfCandidates, 1.5);
    const skillScaling = Math.pow(skillMultiplier, 1.8);
    
    // Linear scaling for specialized roles (2x per role)
    const specializationMultiplier = selectedRoles.length > 0 ? Math.pow(2, selectedRoles.length) : 1;
    
    // Combine all scalings
    const totalMultiplier = (candidateScaling * skillScaling * specializationMultiplier);
    
    return Math.round(baseCost * totalMultiplier);
}

// Add new function to calculate per-candidate cost
function calculatePerCandidateCost(totalCandidates, skillLevel) {
    // Calculate total cost and divide by number of candidates
    // This ensures the per-candidate cost also scales with the total number of candidates
    const totalCost = calculateSearchCost(totalCandidates, skillLevel, []);
    return Math.round(totalCost / totalCandidates);
}

export function showHireStaffOptionsOverlay() {
    const overlayContainer = showStandardOverlay(createHireStaffOptionsHTML());
    setupHireStaffOptionsEventListeners(overlayContainer);
    return overlayContainer;
}

function createHireStaffOptionsHTML() {
    const initialCandidates = 5;
    const initialSkill = 0.3; // Updated to use 0.1-1.0 scale
    const initialCost = calculateSearchCost(initialCandidates, initialSkill, []);
    const skillInfo = getSkillLevelInfo(initialSkill);

    return `
        <div class="overlay-content overlay-container">
            <section class="overlay-section card mb-4">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Staff Search Options</h3>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <div class="card-body">
                    <div class="form-group mb-4">
                        <label for="candidates-slider" class="form-label">Number of Candidates:</label>
                        <div class="d-flex align-items-center">
                            <span class="mr-2">Min (3)</span>
                            <input type="range" class="custom-range" id="candidates-slider" min="3" max="10" step="1" value="${initialCandidates}">
                            <span class="ml-2">Max (10)</span>
                        </div>
                        <div>Selected candidates: <span id="candidates-value">${initialCandidates}</span></div>
                    </div>

                    <div class="form-group mb-4">
                        <label for="skill-slider" class="form-label">Required Skill Level:</label>
                        <div class="d-flex align-items-center">
                            <span class="mr-2">${skillLevels[0.1].name}</span>
                            <input type="range" class="custom-range" id="skill-slider" 
                                min="0.1" max="1.0" step="0.1" value="${initialSkill}">
                            <span class="ml-2">${skillLevels[1.0].name}</span>
                        </div>
                        <div class="skill-level-container">Skill Level: <span id="skill-display">${skillInfo.formattedName}</span></div>
                    </div>

                    <div class="form-group mb-4">
                        <label class="form-label">Specialized Role Requirements:</label>
                        <div class="specialized-roles-container">
                            ${Object.entries(specializedRoles).map(([key, role]) => `
                                <div class="role-checkbox">
                                    <input type="checkbox" id="${key}-role" class="role-checkbox" data-role="${key}">
                                    <label for="${key}-role" title="${role.description}">${role.title}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <hr class="overlay-divider">

                    <div class="cost-details d-flex justify-content-between mt-3">
                        <div class="hiring-overlay-info-box">
                            <span>Cost per candidate: </span>
                            <span>€${formatNumber(Math.round(calculateSearchCost(1, initialSkill, [])))}</span>
                        </div>
                        <div class="hiring-overlay-info-box">
                            <span>Total Cost: </span>
                            <span id="total-cost">€${formatNumber(initialCost)}</span>
                        </div>
                    </div>

                    <div class="d-flex justify-content-center mt-4">
                        <button class="btn btn-primary search-btn">Start Search</button>
                    </div>
                </div>
            </section>
        </div>
    `;
}

function setupHireStaffOptionsEventListeners(overlayContainer) {
    const candidatesSlider = overlayContainer.querySelector('#candidates-slider');
    const skillSlider = overlayContainer.querySelector('#skill-slider');
    const candidatesValue = overlayContainer.querySelector('#candidates-value');
    const skillValue = overlayContainer.querySelector('#skill-display');  // Updated selector
    const totalCostDisplay = overlayContainer.querySelector('#total-cost');
    const roleCheckboxes = overlayContainer.querySelectorAll('.role-checkbox');

    function updateDisplay() {
        const numberOfCandidates = parseInt(candidatesSlider.value);
        const skillLevel = parseFloat(skillSlider.value); // Updated to use float
        const selectedRoles = Array.from(roleCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.role);

        const totalCost = calculateSearchCost(numberOfCandidates, skillLevel, selectedRoles);
        const costPerCandidate = calculatePerCandidateCost(numberOfCandidates, skillLevel, selectedRoles);

        // Update candidates
        candidatesValue.textContent = numberOfCandidates;

        // Update skill level - using parent container to avoid element removal issues
        const skillInfo = getSkillLevelInfo(skillLevel);
        const skillLevelContainer = overlayContainer.querySelector('.skill-level-container');
        skillLevelContainer.innerHTML = `Skill Level: ${skillInfo.formattedName}`;
        
        // Update costs
        overlayContainer.querySelector('.hiring-overlay-info-box span:last-child').textContent = 
            `€${formatNumber(costPerCandidate)}`;
        totalCostDisplay.textContent = `€${formatNumber(totalCost)}`;

        // Add role multiplier info if any roles are selected
        if (selectedRoles.length > 0) {
            const roleMultiplier = Math.pow(2, selectedRoles.length);
            const rolesText = selectedRoles.map(role => specializedRoles[role].title).join(', ');
            addConsoleMessage(`Specialized roles selected (${rolesText}) - Cost multiplier: ${roleMultiplier}x`);
        }
    }

    candidatesSlider.addEventListener('input', updateDisplay);
    skillSlider.addEventListener('input', updateDisplay);

    const searchBtn = overlayContainer.querySelector('.search-btn');
    searchBtn.addEventListener('click', () => {
        const numberOfCandidates = parseInt(candidatesSlider.value);
        const skillLevel = parseFloat(skillSlider.value); // Updated to use float
        const selectedRoles = Array.from(roleCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.role);
        const totalCost = calculateSearchCost(numberOfCandidates, skillLevel, selectedRoles);
        const workRequired = 10 * numberOfCandidates;

        // Check if player has enough money
        const currentMoney = getMoney();
        if (currentMoney < totalCost) {
            addConsoleMessage(`Insufficient funds for staff search. Required: €${formatNumber(totalCost)}, Available: €${formatNumber(currentMoney)}`);
            return;
        }

        // Add transaction for search cost
        addTransaction('Expense', `Staff Search Cost (${numberOfCandidates} ${skillLevels[skillLevel].name} candidates)`, -totalCost);

        taskManager.addCompletionTask(
            'Staff Search',
            TaskType.administration,
            workRequired,
            (target, params) => {
                showHireStaffOverlay(
                    params.numberOfCandidates, 
                    params.skillModifier,
                    params.selectedRoles
                );
            },
            null,
            { 
                numberOfCandidates, 
                skillModifier: skillLevels[skillLevel].modifier,
                selectedRoles
            },
            () => {
                const rolesText = selectedRoles.length > 0 
                    ? ` specializing in ${selectedRoles.map(r => specializedRoles[r].title).join(', ')}`
                    : '';
                addConsoleMessage(
                    `Started searching for ${numberOfCandidates} ${skillLevels[skillLevel].name}-level candidates${rolesText} (Cost: €${formatNumber(totalCost)})`
                );
                hideOverlay(overlayContainer);
            }
        );
    });

    const closeBtn = overlayContainer.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        hideOverlay(overlayContainer);
    });

    // Add event listeners for checkboxes
    roleCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateDisplay);
    });
}
