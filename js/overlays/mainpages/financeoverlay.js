import { loadCashFlow, updateIncomeStatement } from '/js/finance.js';
import { showMainViewOverlay } from '../overlayUtils.js';
import { patents, startPatentTask, getBenefitsDescription } from '/js/research.js';
import { getMoney } from '/js/company.js';

export function showFinanceOverlay() {
    const overlay = showMainViewOverlay(createFinanceOverlayHTML());
    setupFinanceEventListeners(overlay);
}

function createFinanceOverlayHTML() {
    return `
        <div class="mainview-overlay-content finance-container">
            <h1 class="mb-4">Finance Management</h1>
            
            <div class="btn-group mb-4">
                <button class="btn btn-outline-primary active" data-view="income-balance">Income/Balance</button>
                <button class="btn btn-outline-primary" data-view="cash-flow">Cash Flow</button>
                <button class="btn btn-outline-primary" data-view="research-patents">Research and Patents</button>
            </div>
            
            <div class="finance-sections">
                <section id="income-balance-section" class="finance-section">
                    <div class="row mb-4">
                        <!-- Income Statement Cards -->
                        <div class="col-md-6">
                            <div class="finance-section income-statement">
                                <h2 class="h4">Income Statement</h2>
                                <div class="stat-card">
                                    <div class="stat-label">Weekly Income</div>
                                    <div id="weekly-income" class="stat-value transaction-income">€0</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Weekly Expenses</div>
                                    <div id="weekly-expenses" class="stat-value transaction-expense">€0</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Net Income</div>
                                    <div id="net-income" class="stat-value">€0</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="finance-section balance-sheet">
                                <h2 class="h4">Balance Sheet</h2>
                                <div class="stat-card">
                                    <div class="stat-label">Total Assets</div>
                                    <div id="total-assets" class="stat-value">€0</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Cash</div>
                                    <div id="cash-balance" class="stat-value">€0</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Fixed Assets</div>
                                    <div id="fixed-assets" class="stat-value">€0</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Current Assets (Wine)</div>
                                    <div id="current-assets" class="stat-value">€0</div>
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

                <section id="research-patents-section" class="finance-section" style="display: none;">
                    <h2 class="h4 mb-4">Research and Patents</h2>
                    <div id="patents-list" class="patents-list">
                        ${createPatentsListHTML()}
                    </div>
                </section>
            </div>
        </div>
    `;
}

function createPatentsListHTML() {
    return patents.map(patent => {
        const money = getMoney();
        const canResearch = money >= patent.requirements.money;
        const statusClass = patent.completed ? 'research-completed' : (canResearch ? 'research-available' : 'research-unavailable');
        const buttonText = patent.completed ? 'Completed' : 'Start Research';
        const benefitsDescription = getBenefitsDescription(patent.benefits);
        return `
            <div class="patent-item ${statusClass}" data-patent-id="${patent.id}">
                <h3>${patent.name}</h3>
                <p>${patent.description}</p>
                <p>Benefits: ${benefitsDescription}</p>
                <p>Requirements: €${patent.requirements.money}</p>
                <button class="btn btn-primary start-research-btn" ${canResearch && !patent.completed ? '' : 'disabled'}>${buttonText}</button>
            </div>
        `;
    }).join('');
}

function setupFinanceEventListeners(overlay) {
    const btnGroup = overlay.querySelector('.btn-group');
    btnGroup.addEventListener('click', (e) => {
        if (!e.target.matches('button')) return;
        
        // Update active button
        btnGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Show/hide sections based on selected view
        const view = e.target.dataset.view;
        const sections = overlay.querySelectorAll('.finance-section');
        sections.forEach(section => {
            section.style.display = section.id.startsWith(view) ? 'block' : 'none';
        });

        // Update income statement when switching back to income/balance
        if (view === 'income-balance') {
            updateIncomeStatement();
            // Ensure all child elements are displayed
            const incomeBalanceSection = overlay.querySelector('#income-balance-section');
            incomeBalanceSection.querySelectorAll('.finance-section').forEach(el => el.style.display = 'block');
        }
    });

    // Add event listeners for starting research
    const researchSection = overlay.querySelector('#research-patents-section');
    researchSection.addEventListener('click', (e) => {
        if (e.target.matches('.start-research-btn')) {
            const patentId = parseInt(e.target.closest('.patent-item').dataset.patentId, 10);
            startPatentTask(patentId);
            // Refresh the patents list to reflect the new status
            const patentsList = researchSection.querySelector('#patents-list');
            patentsList.innerHTML = createPatentsListHTML();
        }
    });

    loadCashFlow();
    updateIncomeStatement();
}

export function updatePatentsList() {
    const patentsList = document.querySelector('#patents-list');
    if (patentsList) {
        patentsList.innerHTML = createPatentsListHTML();
    }
}
