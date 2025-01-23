import { loadCashFlow, updateIncomeStatement } from '/js/finance.js';

export function showFinanceOverlay() {
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    overlay.innerHTML = `
        <div class="mainview-overlay-content finance-container">
            <h1 class="mb-4">Finance Management</h1>
            
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

            <!-- Cash Flow Section -->
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
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.style.display = 'block';

    // Initialize finance data
    loadCashFlow();
    updateIncomeStatement();
}
