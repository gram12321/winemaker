import { addConsoleMessage } from '../console.js';
import { formatNumber, experienceLevels, getExperienceLevelInfo } from '../utils.js';
import { showHireStaffOverlay } from './hirestaffoverlay.js';
import taskManager, { TaskType } from '../taskManager.js';
import { showStandardOverlay, hideOverlay } from './overlayUtils.js';
import { addTransaction} from '../finance.js'

function calculateSearchCost(numberOfCandidates, experienceLevel) {
    const baseCost = 2000;
    const expMultiplier = experienceLevels[experienceLevel].costMultiplier;
    
    // Exponential scaling based on both factors
    const candidateScaling = Math.pow(numberOfCandidates, 1.5);  // More exponential with more candidates
    const experienceScaling = Math.pow(expMultiplier, 1.8);      // More exponential with higher experience
    
    // Combine the scalings
    const totalMultiplier = (candidateScaling * experienceScaling);
    
    return Math.round(baseCost * totalMultiplier);
}

// Add new function to calculate per-candidate cost
function calculatePerCandidateCost(totalCandidates, experienceLevel) {
    // Calculate total cost and divide by number of candidates
    // This ensures the per-candidate cost also scales with the total number of candidates
    const totalCost = calculateSearchCost(totalCandidates, experienceLevel);
    return Math.round(totalCost / totalCandidates);
}

export function showHireStaffOptionsOverlay() {
    const overlayContainer = showStandardOverlay(createHireStaffOptionsHTML());
    setupHireStaffOptionsEventListeners(overlayContainer);
    return overlayContainer;
}

function createHireStaffOptionsHTML() {
    const initialCandidates = 5;
    const initialExperience = 3;
    const initialCost = calculateSearchCost(initialCandidates, initialExperience);

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
                        <label for="experience-slider" class="form-label">Required Experience Level:</label>
                        <div class="d-flex align-items-center">
                            <span class="mr-2">${experienceLevels[1].name}</span>
                            <input type="range" class="custom-range" id="experience-slider" min="1" max="10" step="1" value="${initialExperience}">
                            <span class="ml-2">${experienceLevels[10].name}</span>
                        </div>
                        <div>Experience Level: <span id="experience-value">${experienceLevels[initialExperience].name}</span></div>
                    </div>

                    <hr class="overlay-divider">

                    <div class="cost-details d-flex justify-content-between mt-3">
                        <div class="hiring-overlay-info-box">
                            <span>Cost per candidate: </span>
                            <span>€${formatNumber(Math.round(calculateSearchCost(1, initialExperience)))}</span>
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
    const experienceSlider = overlayContainer.querySelector('#experience-slider');
    const candidatesValue = overlayContainer.querySelector('#candidates-value');
    const experienceValue = overlayContainer.querySelector('#experience-value');
    const totalCostDisplay = overlayContainer.querySelector('#total-cost');

    function updateDisplay() {
        const numberOfCandidates = parseInt(candidatesSlider.value);
        const experienceLevel = parseInt(experienceSlider.value);
        const totalCost = calculateSearchCost(numberOfCandidates, experienceLevel);

        candidatesValue.textContent = numberOfCandidates;
        experienceValue.textContent = experienceLevels[experienceLevel].name;
        
        // Update cost per candidate using the new calculation
        const costPerCandidate = calculatePerCandidateCost(numberOfCandidates, experienceLevel);
        overlayContainer.querySelector('.hiring-overlay-info-box span:last-child').textContent = 
            `€${formatNumber(costPerCandidate)}`;
        
        // Update total cost
        totalCostDisplay.textContent = `€${formatNumber(totalCost)}`;
    }

    candidatesSlider.addEventListener('input', updateDisplay);
    experienceSlider.addEventListener('input', updateDisplay);

    const searchBtn = overlayContainer.querySelector('.search-btn');
    searchBtn.addEventListener('click', () => {
        const numberOfCandidates = parseInt(candidatesSlider.value);
        const experienceLevel = parseInt(experienceSlider.value);
        const totalCost = calculateSearchCost(numberOfCandidates, experienceLevel);
        const workRequired = 10 * numberOfCandidates;

        // Add transaction for search cost
        addTransaction('Expense', `Staff Search Cost (${numberOfCandidates} ${experienceLevels[experienceLevel].name} candidates)`, -totalCost);

        taskManager.addCompletionTask(
            'Staff Search',
            TaskType.administration,
            workRequired,
            (target, params) => {
                showHireStaffOverlay(params.numberOfCandidates, params.experienceModifier);
            },
            null,
            { 
                numberOfCandidates, 
                experienceModifier: experienceLevels[experienceLevel].modifier 
            },
            () => {
                addConsoleMessage(`Started searching for ${numberOfCandidates} ${experienceLevels[experienceLevel].name}-level candidates (Cost: €${formatNumber(totalCost)})`);
                hideOverlay(overlayContainer);
            }
        );
    });

    const closeBtn = overlayContainer.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        hideOverlay(overlayContainer);
    });
}
