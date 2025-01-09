
import { formatNumber } from '/js/utils.js';
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
            
            <div class="row">
                <!-- Income Statement Cards -->
                <div class="col-md-4">
                    <div class="income-statement">
                        <h2 class="h4 mb-4">Income Statement</h2>
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

                <!-- Cash Flow Section -->
                <div class="col-md-8">
                    <div class="cash-flow-section">
                        <h2 class="h4 mb-4">Cash Flow Statement</h2>
                        <div class="cash-flow-table">
                            <table class="table table-hover">
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
