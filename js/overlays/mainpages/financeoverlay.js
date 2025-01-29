import { loadCashFlow, updateIncomeStatement } from '/js/finance.js';
import { showMainViewOverlay } from '../overlayUtils.js';

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
                    <p>Details about research and patents will be displayed here.</p>
                </section>
            </div>
        </div>
    `;
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

    loadCashFlow();
    updateIncomeStatement();
}
