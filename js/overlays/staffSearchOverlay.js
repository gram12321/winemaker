import { addConsoleMessage } from '../console.js';
import { formatNumber, skillLevels, getSkillLevelInfo  } from '../utils.js';
import { showHireStaffOverlay } from './hirestaffoverlay.js';
import taskManager from '../taskManager.js';
import { showStandardOverlay, hideOverlay } from './overlayUtils.js';
import { addTransaction} from '../finance.js';
import { getMoney } from '../database/adminFunctions.js';
import { createWorkCalculationTable } from '../components/workCalculationTable.js';
import { calculateHiringWork } from './hirestaffoverlay.js';
import { createOverlayHTML, createSlider, createInfoBox, createTextCenter, createCheckbox } from '../components/createOverlayHTML.js';

export function showStaffSearchOverlay() {
    const overlayContainer = showStandardOverlay(createStaffSearchHTML());
    setupStaffSearchEventListeners(overlayContainer);
    return overlayContainer;
}

function createStaffSearchHTML() {
    const initialCandidates = 5;
    const initialSkill = 0.3;
    const initialCost = calculateSearchCost(initialCandidates, initialSkill, []);
    const skillInfo = getSkillLevelInfo(initialSkill);
    const initialWork = calculateTotalWork(initialCandidates, initialSkill, []);
    const searchWorkData = calculateSearchWorkData(initialCandidates, initialSkill, []);
    const hiringWorkData = estimateHiringWorkData(initialSkill, []); // Remove numberOfCandidates parameter

    // Calculate combined work
    const combinedWorkMin = searchWorkData.totalWork + hiringWorkData.totalWork;
    const combinedWorkMax = searchWorkData.totalWork + hiringWorkData.maxWork;
    const combinedWorkDisplay = combinedWorkMax ? 
        `${formatNumber(combinedWorkMin)} - ${formatNumber(combinedWorkMax)}` : 
        formatNumber(combinedWorkMin);

    const content = `
        <div class="form-group mb-4 d-flex justify-content-center">
            <div class="slider-container">
                ${createSlider({
                    id: 'candidates-slider',
                    label: 'Number of Candidates:',
                    min: 3,
                    max: 10,
                    step: 1,
                    value: initialCandidates,
                    showValue: true,
                    valuePrefix: 'Selected candidates: ',
                    lowLabel: 'Min (3)',
                    highLabel: 'Max (10)'
                })}

                ${createSlider({
                    id: 'skill-slider',
                    label: 'Required Skill Level:',
                    min: 0.1,
                    max: 1.0,
                    step: 0.1,
                    value: initialSkill,
                    lowLabel: skillLevels[0.1].name,
                    highLabel: skillLevels[1.0].name
                })}
                ${createTextCenter({
                    text: initialSkill,  // Pass the skill level value directly
                    className: 'skill-level-container',
                    format: (value) => `Skill Level: ${getSkillLevelInfo(value).formattedName}`  // Format the entire string here
                })}
            </div>

            <div class="specialized-roles-container checkbox-container">
                <label class="form-label">Specialized Role Requirements:</label>
                ${Object.entries(specializedRoles).map(([key, role]) => 
                    createCheckbox({
                        id: `${key}-role`,
                        label: role.title,
                        className: 'role-checkbox',
                        dataset: { role: key },
                        title: role.description,
                        styled: true // Use the new styled checkbox
                    })
                ).join('')}
            </div>
        </div>

        <hr class="overlay-divider">

        <div class="cost-details d-flex justify-content-sm-around">
            ${createInfoBox({
                label: 'Cost per candidate',
                value: `€${formatNumber(Math.round(calculateSearchCost(1, initialSkill, [])))}`
            })}
            ${createInfoBox({
                label: 'Total Cost',
                value: `€${formatNumber(initialCost)}`,
                id: 'total-cost'
            })}
            ${createInfoBox({
                label: 'Total Work',
                value: combinedWorkDisplay,
                id: 'total-work'
            })}
        </div>

        <div class="work-calculations mt-4">
            ${createTextCenter({
                text: 'Staff Search Process',
                isHeadline: true,
                headlineLevel: 4
            })}
            <div id="search-work-calculation">
                ${createWorkCalculationTable(searchWorkData)}
            </div>

            ${createTextCenter({
                text: 'Hiring Process',
                isHeadline: true,
                headlineLevel: 4
            })}
            <div id="hiring-work-calculation">
                ${createWorkCalculationTable(hiringWorkData)}
            </div>
        </div>
    `;

    return createOverlayHTML({
        title: 'Staff Search Options',
        content,
        buttonText: 'Start Search',
        buttonClass: 'btn-primary search-btn'
    });
}

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

// Adjusted function to calculate total work required
function calculateTotalWork(numberOfCandidates, skillLevel, selectedRoles) {
    const baseWork = 10;
    const skillWorkMultiplier = 1 + (skillLevel - 0.1) * 0.5; // Skill level has a moderate impact
    const roleWorkMultiplier = 1 + selectedRoles.length * 0.3; // Specialized roles have a smaller impact

    return Math.round(baseWork * numberOfCandidates * skillWorkMultiplier * roleWorkMultiplier);
}

function calculateSearchWorkData(numberOfCandidates, skillLevel, selectedRoles) {
    return {
        amount: numberOfCandidates,
        unit: 'candidates',
        tasks: ['Staff Search'],
        totalWork: calculateTotalWork(numberOfCandidates, skillLevel, selectedRoles),
        methodName: `${skillLevels[skillLevel].name} Level Search`,
        methodModifier: skillLevel - 0.1, // Show how much extra work compared to basic search
        location: 'administration'
    };
}

function estimateHiringWorkData(skillLevel = 0.1, selectedRoles = []) {  // Remove numberOfCandidates parameter
    const minWage = 600;
    const maxWage = 3000;
    
    const maxWorkValue = calculateHiringWork(
        skillLevel, 
        selectedRoles, 
        maxWage,
        null
    ).totalWork;
    
    return calculateHiringWork(
        skillLevel, 
        selectedRoles, 
        minWage,
        `${selectedRoles.length > 0 ? 'Complex' : 'Standard'} ${skillLevels[skillLevel].name} Level Hiring`,
        maxWorkValue
    );
}

export function staffSearch(numberOfCandidates, skillLevel, selectedRoles) {
    const totalCost = calculateSearchCost(numberOfCandidates, skillLevel, selectedRoles);
    const totalWork = calculateTotalWork(numberOfCandidates, skillLevel, selectedRoles);

    // Check if player has enough money
    const currentMoney = getMoney();
    if (currentMoney < totalCost) {
        addConsoleMessage(`Insufficient funds for staff search. Required: €${formatNumber(totalCost)}, Available: €${formatNumber(currentMoney)}`);
        return;
    }

    // Add transaction for search cost
    addTransaction('Expense', `Staff Search Cost (${numberOfCandidates} ${skillLevels[skillLevel].name} candidates)`, -totalCost);

    // Create task
    taskManager.addCompletionTask(
        'Staff Search',
        'administration',
        totalWork,
        performStaffSearch,
        null,
        { 
            numberOfCandidates, 
            skillModifier: skillLevels[skillLevel].modifier,
            selectedRoles
        }
    );

    const rolesText = selectedRoles.length > 0 
        ? ` specializing in ${selectedRoles.map(r => specializedRoles[r].title).join(', ')}`
        : '';
    addConsoleMessage(
        `Started searching for ${numberOfCandidates} ${skillLevels[skillLevel].name}-level candidates${rolesText} (Cost: €${formatNumber(totalCost)})`
    );
}

export function performStaffSearch(target, params) {
    showHireStaffOverlay(
        params.numberOfCandidates, 
        params.skillModifier,
        params.selectedRoles
    );
}

function setupStaffSearchEventListeners(overlayContainer) {
    const candidatesSlider = overlayContainer.querySelector('#candidates-slider');
    const skillSlider = overlayContainer.querySelector('#skill-slider');
    const roleCheckboxes = overlayContainer.querySelectorAll('.role-checkbox');

    function updateDisplay() {
        const numberOfCandidates = parseInt(candidatesSlider.value);
        const skillLevel = parseFloat(skillSlider.value);
        const selectedRoles = Array.from(roleCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.role);

        updateDisplayValues(overlayContainer, numberOfCandidates, skillLevel, selectedRoles);
    }

    // Setup slider and checkbox event listeners
    candidatesSlider.addEventListener('input', updateDisplay);
    skillSlider.addEventListener('input', updateDisplay);
    roleCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateDisplay);
    });

    // Setup search button
    const searchBtn = overlayContainer.querySelector('.search-btn');
    searchBtn.addEventListener('click', () => {
        const numberOfCandidates = parseInt(candidatesSlider.value);
        const skillLevel = parseFloat(skillSlider.value);
        const selectedRoles = Array.from(roleCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.role);

        staffSearch(numberOfCandidates, skillLevel, selectedRoles);
        hideOverlay(overlayContainer);
    });

    // Setup close button
    const closeBtn = overlayContainer.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        hideOverlay(overlayContainer);
    });
}

function updateDisplayValues(overlayContainer, numberOfCandidates, skillLevel, selectedRoles) {
    const candidatesValue = overlayContainer.querySelector('#candidates-value');
    const skillLevelContainer = overlayContainer.querySelector('.skill-level-container');
    const totalCostDisplay = overlayContainer.querySelector('#total-cost');
    const totalWorkDisplay = overlayContainer.querySelector('#total-work');
    const costPerCandidateElement = overlayContainer.querySelector('.planting-overlay-info-box span:last-child');

    const totalCost = calculateSearchCost(numberOfCandidates, skillLevel, selectedRoles);
    const costPerCandidate = calculatePerCandidateCost(numberOfCandidates, skillLevel);
    const totalWork = calculateTotalWork(numberOfCandidates, skillLevel, selectedRoles);
    const skillInfo = getSkillLevelInfo(skillLevel);

    // Update work calculation displays
    const searchWorkData = calculateSearchWorkData(numberOfCandidates, skillLevel, selectedRoles);
    const hiringWorkData = estimateHiringWorkData(skillLevel, selectedRoles);

    // Calculate combined work display
    const combinedWorkMin = searchWorkData.totalWork + hiringWorkData.totalWork;
    const combinedWorkMax = searchWorkData.totalWork + hiringWorkData.maxWork;
    const combinedWorkDisplay = combinedWorkMax ? 
        `${formatNumber(combinedWorkMin)} - ${formatNumber(combinedWorkMax)}` : 
        formatNumber(combinedWorkMin);

    if (candidatesValue) candidatesValue.textContent = numberOfCandidates;
    if (skillLevelContainer) skillLevelContainer.innerHTML = `Skill Level: ${skillInfo.formattedName}`;
    if (costPerCandidateElement) costPerCandidateElement.textContent = `€${formatNumber(costPerCandidate)}`;
    if (totalCostDisplay) totalCostDisplay.innerHTML = `€${formatNumber(totalCost)}`;
    if (totalWorkDisplay) totalWorkDisplay.innerHTML = combinedWorkDisplay;

    // Update tables
    const searchContainer = overlayContainer.querySelector('#search-work-calculation');
    if (searchContainer) {
        searchContainer.innerHTML = createWorkCalculationTable(searchWorkData);
    }

    const hiringContainer = overlayContainer.querySelector('#hiring-work-calculation');
    if (hiringContainer) {
        hiringContainer.innerHTML = createWorkCalculationTable(hiringWorkData);
    }
}
