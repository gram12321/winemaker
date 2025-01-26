
import { addConsoleMessage } from '../console.js';
import { formatNumber } from '../utils.js';
import { showHireStaffOverlay } from './hirestaffoverlay.js';
import taskManager, { TaskType } from '../taskManager.js';
import { showStandardOverlay, hideOverlay } from './overlayUtils.js';

export function showHireStaffOptionsOverlay() {
    const overlayContainer = showStandardOverlay(createHireStaffOptionsHTML());
    setupHireStaffOptionsEventListeners(overlayContainer);
    return overlayContainer;
}

function createHireStaffOptionsHTML() {
    const initialCandidates = 5;
    const costPerCandidate = 2000;
    const initialTotalCost = initialCandidates * costPerCandidate;

    return `
        <div class="overlay-content overlay-container">
            <section class="overlay-section card mb-4">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Staff Search Options</h3>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label for="candidates-slider" class="form-label">Number of Candidates to Search For:</label>
                        <div class="d-flex align-items-center">
                            <span class="mr-2">Min (3)</span>
                            <input type="range" class="custom-range" id="candidates-slider" min="3" max="10" step="1" value="${initialCandidates}">
                            <span class="ml-2">Max (10)</span>
                        </div>
                        <div>
                            Selected candidates: <span id="candidates-value">${initialCandidates}</span>
                        </div>
                    </div>
                    <div class="cost-details d-flex justify-content-between mt-3">
                        <div class="hiring-overlay-info-box">
                            <span>Cost per candidate: </span><span>€${formatNumber(costPerCandidate)}</span>
                        </div>
                        <div class="hiring-overlay-info-box">
                            <span>Total Cost: </span><span id="total-cost">€${formatNumber(initialTotalCost)}</span>
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
    const slider = overlayContainer.querySelector('#candidates-slider');
    const candidatesValue = overlayContainer.querySelector('#candidates-value');
    const totalCostDisplay = overlayContainer.querySelector('#total-cost');
    const costPerCandidate = 2000;

    slider.addEventListener('input', () => {
        const numberOfCandidates = parseInt(slider.value);
        candidatesValue.textContent = numberOfCandidates;
        const totalCost = numberOfCandidates * costPerCandidate;
        totalCostDisplay.textContent = `€${formatNumber(totalCost)}`;
    });

    const searchBtn = overlayContainer.querySelector('.search-btn');
    searchBtn.addEventListener('click', () => {
        const numberOfCandidates = parseInt(slider.value);
        const totalCost = numberOfCandidates * costPerCandidate;
        const workRequired = 10 * numberOfCandidates;

        // Add transaction for search cost
        addTransaction('Expense', `Staff Search Cost (${numberOfCandidates} candidates)`, -totalCost);

        taskManager.addCompletionTask(
            'Staff Search',
            TaskType.administration,
            workRequired,
            (target, params) => {
                showHireStaffOverlay(params.numberOfCandidates);
            },
            null,
            { numberOfCandidates },
            () => {
                addConsoleMessage(`Started searching for ${numberOfCandidates} potential candidates. HR department needs ${workRequired} work units to complete the search.`);
                hideOverlay(overlayContainer);
            }
        );
    });

    const closeBtn = overlayContainer.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        hideOverlay(overlayContainer);
    });
}
