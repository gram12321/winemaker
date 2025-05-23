import { loadCashFlow, updateIncomeStatement } from '/js/finance.js';
import { showMainViewOverlay } from '../overlayUtils.js';
import { upgrade, getBenefitsDescription } from '/js/upgrade.js';  // Change import here
import { getMoney } from '/js/company.js';
import { categorizeUpgrades } from '../../upgrade.js';
import { getFarmlands } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { upgrades } from '../../upgrade.js';

export function showFinanceOverlay() {
    const overlay = showMainViewOverlay(createFinanceOverlayHTML());
    setupFinanceEventListeners(overlay);
    updateUpgradesList();

    // Add tutorial check
    if (tutorialManager.shouldShowTutorial('FINANCE')) {
        tutorialManager.showTutorial('FINANCE');
    }

}

function createFinanceOverlayHTML() {
    return `
        <div class="mainview-overlay-content finance-container">
            <h1 class="mb-4">Finance Management</h1>
            
            <div class="d-flex flex-column">
                <div class="btn-group mb-4">
                    <button class="btn btn-outline-primary active" data-view="income-balance">Income/Balance</button>
                    <button class="btn btn-outline-primary" data-view="cash-flow">Cash Flow</button>
                    <button class="btn btn-outline-primary" data-view="research-upgrades">Research and Upgrades</button>
                </div>

                <div id="period-selector" class="btn-group mb-4" style="display: none;">
                    <button class="btn btn-outline-primary active" data-period="weekly">Weekly</button>
                    <button class="btn btn-outline-primary" data-period="season">Season</button>
                    <button class="btn btn-outline-primary" data-period="year">Year</button>
                </div>
            </div>
            
            <div class="finance-sections">
                <section id="income-balance-section" class="finance-section">
                    <div class="row mb-4">
                        <!-- Income Statement Cards -->
                        <div class="col-md-6">
                            <div class="finance-section income-statement">
                                <h2 class="h4">Income Statement</h2>
                                <div class="stat-card collapsible">
                                    <div class="stat-header" data-bs-toggle="collapse" data-bs-target="#weeklyIncomeDetails">
                                        <div class="stat-label">Weekly Income</div>
                                        <div id="weekly-income" class="stat-value transaction-income">€0</div>
                                        <i class="fas fa-chevron-down"></i>
                                    </div>
                                    <div id="weeklyIncomeDetails" class="collapse stat-details">
                                        <!-- Details will be populated by JS -->
                                    </div>
                                </div>
                                <div class="stat-card collapsible">
                                    <div class="stat-header" data-bs-toggle="collapse" data-bs-target="#weeklyExpensesDetails">
                                        <div class="stat-label">Weekly Expenses</div>
                                        <div id="weekly-expenses" class="stat-value transaction-expense">€0</div>
                                        <i class="fas fa-chevron-down"></i>
                                    </div>
                                    <div id="weeklyExpensesDetails" class="collapse stat-details">
                                        <!-- Details will be populated by JS -->
                                    </div>
                                </div>
                                <div class="stat-card collapsible">
                                    <div class="stat-header" data-bs-toggle="collapse" data-bs-target="#netIncomeDetails">
                                        <div class="stat-label">Net Income</div>
                                        <div id="net-income" class="stat-value">€0</div>
                                        <i class="fas fa-chevron-down"></i>
                                    </div>
                                    <div id="netIncomeDetails" class="collapse stat-details">
                                        <div>
                                            <span>Weekly Income</span>
                                            <span id="net-income-weekly" class="transaction-income">€0</span>
                                        </div>
                                        <div>
                                            <span>Weekly Expenses</span>
                                            <span id="net-income-expenses" class="transaction-expense">€0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="finance-section balance-sheet">
                                <h2 class="h4">Balance Sheet</h2>
                                <div class="stat-card collapsible">
                                    <div class="stat-header" data-bs-toggle="collapse" data-bs-target="#totalAssetsDetails">
                                        <div class="stat-label">Total Assets</div>
                                        <div id="total-assets" class="stat-value transaction-income">€0</div>
                                        <i class="fas fa-chevron-down"></i>
                                    </div>
                                    <div id="totalAssetsDetails" class="collapse stat-details">
                                        <div>
                                            <span>Cash</span>
                                            <span id="total-assets-cash" class="transaction-income">€0</span>
                                        </div>
                                        <div>
                                            <span>Fixed Assets</span>
                                            <span id="total-assets-fixed" class="transaction-income">€0</span>
                                        </div>
                                        <div>
                                            <span>Current Assets</span>
                                            <span id="total-assets-current" class="transaction-income">€0</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-header" data-bs-toggle="collapse" data-bs-target="#cashDetails">
                                        <div class="stat-label">Cash</div>
                                        <div id="cash-balance" class="stat-value transaction-income">€0</div>
                                        <i class="fas fa-chevron-down"></i>
                                    </div>
                                    <div id="cashDetails" class="collapse stat-details">
                                        <div>
                                            <span>Available Cash</span>
                                            <span id="cash-available" class="transaction-income">€0</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-header" data-bs-toggle="collapse" data-bs-target="#fixedAssetsDetails">
                                        <div class="stat-label">Fixed Assets</div>
                                        <div id="fixed-assets" class="stat-value transaction-income">€0</div>
                                        <i class="fas fa-chevron-down"></i>
                                    </div>
                                    <div id="fixedAssetsDetails" class="collapse stat-details">
                                        <div>Buildings: <span id="buildings-value">€0</span></div>
                                        <div>Farmland: <span id="farmland-value">€0</span></div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-header" data-bs-toggle="collapse" data-bs-target="#currentAssetsDetails">
                                        <div class="stat-label">Current Assets (Wine)</div>
                                        <div id="current-assets" class="stat-value transaction-income">€0</div>
                                        <i class="fas fa-chevron-down"></i>
                                    </div>
                                    <div id="currentAssetsDetails" class="collapse stat-details">
                                        <div>Bottles: <span id="bottles-value">€0</span></div>
                                        <div>Grapes: <span id="grapes-value">€0</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="cash-flow-section" class="finance-section" style="display: none;">
                    <div class="row">
                        <div class="col-12">
                            <div class="cash-flow-section">
                                <h2 class="h4 mb-4">Cash Flow Statement</h2>
                                <div class="cash-flow-table">
                                    <table id="cash-flow-table" class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Description</th>
                                                <th>Amount (€)</th>
                                                <th>Balance (€)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="research-upgrades-section" class="finance-section" style="display: none;">
                    <h2 class="h4 mb-4">Research and Upgrades</h2>
                    <div class="upgrade-grid-container">
                        <div class="upgrade-grid-item">
                            <h2>Research</h2>
                            <div id="research-list"></div>
                        </div>
                        <div class="upgrade-grid-item">
                            <h2>Projects</h2>
                            <div id="projects-list"></div>
                        </div>
                        <div class="upgrade-grid-item">
                            <h2>Upgrades</h2>
                            <div id="upgrades-list"></div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

function createUpgradeListHTML(upgrades) {
    return upgrades.map(upgrade => {
        const money = getMoney();
        const canUpgrade = money >= upgrade.requirements.money;
        const farmlands = getFarmlands();
        const farmlandsWithoutUpgrade = farmlands.filter(f => !f.upgrades || !f.upgrades.includes(upgrade.id));
        const statusClass = upgrade.completed && farmlandsWithoutUpgrade.length === 0 ? 'upgrade-completed' : (canUpgrade ? 'upgrade-available' : 'upgrade-unavailable');
        const buttonText = upgrade.completed && farmlandsWithoutUpgrade.length === 0 ? 'Completed' : 'Start Upgrade';
        const benefitsDescription = getBenefitsDescription(upgrade.benefits);

        if (upgrade.applicableTo === 'farmland') {
            const farmlandOptions = farmlandsWithoutUpgrade.map(farmland => `<option value="${farmland.id}">${farmland.name}</option>`).join('');
            return `
                <div class="upgrade-item ${statusClass}" data-upgrade-id="${upgrade.id}">
                    <h3>${upgrade.name}</h3>
                    <p>${upgrade.description}</p>
                    <p>Benefits: ${benefitsDescription}</p>
                    <p>Requirements: €${upgrade.requirements.money}</p>
                    <select class="form-control-sm farmland-select">
                        <option value="">Select Farmland</option>
                        ${farmlandOptions}
                    </select>
                    <button class="btn btn-primary start-upgrade-btn" ${canUpgrade && farmlandOptions ? '' : 'disabled'}>${buttonText}</button>
                </div>
            `;
        } else {
            return `
                <div class="upgrade-item ${statusClass}" data-upgrade-id="${upgrade.id}">
                    <h3>${upgrade.name}</h3>
                    <p>${upgrade.description}</p>
                    <p>Benefits: ${benefitsDescription}</p>
                    <p>Requirements: €${upgrade.requirements.money}</p>
                    <button class="btn btn-primary start-upgrade-btn" ${canUpgrade && !upgrade.completed ? '' : 'disabled'}>${buttonText}</button>
                </div>
            `;
        }
    }).join('');
}

export function updateUpgradesList() {
    const { research, projects, upgradesList } = categorizeUpgrades();
    
    // Check if elements exist before updating
    const researchList = document.getElementById('research-list');
    const projectsList = document.getElementById('projects-list');
    const upgradesListElement = document.getElementById('upgrades-list');

    // Only update if elements exist (we're on the finance overlay)
    if (researchList && projectsList && upgradesListElement) {
        researchList.innerHTML = createUpgradeListHTML(research);
        projectsList.innerHTML = createUpgradeListHTML(projects);
        upgradesListElement.innerHTML = createUpgradeListHTML(upgradesList);
    }
}

function setupFinanceEventListeners(overlay) {
    const btnGroup = overlay.querySelector('.btn-group:first-child');
    const periodSelector = overlay.querySelector('#period-selector');
    
    // Show period selector by default since income-balance is the default tab
    if (periodSelector) {
        periodSelector.style.display = 'flex';
    }

    if (btnGroup) {
        btnGroup.addEventListener('click', (e) => {
            if (!e.target.matches('button')) return;
            
            btnGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const view = e.target.dataset.view;
            const sections = overlay.querySelectorAll('.finance-section');
            sections.forEach(section => {
                section.style.display = section.id.startsWith(view) ? 'block' : 'none';
            });

            // Show/hide period selector based on view
            if (periodSelector) {
                periodSelector.style.display = view === 'income-balance' ? 'flex' : 'none';
            }

            if (view === 'income-balance') {
                const currentPeriod = periodSelector?.querySelector('.active')?.dataset.period || 'weekly';
                updateIncomeStatement(currentPeriod);
                const incomeBalanceSection = overlay.querySelector('#income-balance-section');
                if (incomeBalanceSection) {
                    incomeBalanceSection.querySelectorAll('.finance-section').forEach(el => el.style.display = 'block');
                }
            }
        });
    }

    // Time period selector - Use better selector
    const timePeriodSelector = overlay.querySelector('.btn-group:nth-child(2)');
    if (timePeriodSelector) {
        timePeriodSelector.addEventListener('click', (e) => {
            if (!e.target.matches('button')) return;
            
            timePeriodSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const period = e.target.dataset.period;
            updateIncomeStatement(period);
        });
    }

    // Add event listeners for starting upgrades
    const upgradeSection = overlay.querySelector('#research-upgrades-section');
    upgradeSection.addEventListener('click', (e) => {
        if (e.target.matches('.start-upgrade-btn')) {
            const upgradeId = parseInt(e.target.closest('.upgrade-item').dataset.upgradeId, 10);
            const farmlandSelect = e.target.closest('.upgrade-item').querySelector('.farmland-select');
            
            // Add null check and handle upgrades that don't require farmland
            const upgradeItem = upgrades.find(u => u.id === upgradeId);
            if (upgradeItem.applicableTo === 'farmland') {
                if (!farmlandSelect || !farmlandSelect.value) {
                    addConsoleMessage('Please select a farmland to apply the upgrade.', false, true);
                    return;
                }
                const farmlandId = parseInt(farmlandSelect.value, 10);
                const farmland = getFarmlands().find(f => f.id === farmlandId);
                upgrade(upgradeId, farmland);  // Changed from startUpgradeTask to upgrade
            } else {
                // For non-farmland upgrades, just start the task without a target
                upgrade(upgradeId);  // Changed from startUpgradeTask to upgrade
            }
            
            // Refresh the upgrades list to reflect the new status
            updateUpgradesList();
        }
    });

    loadCashFlow();
    updateIncomeStatement('weekly'); // Pass default period
}

