// finance.js

// Function to initialize the finance management page
function initializeFinance() {
    const cashFlowTable = document.getElementById('cash-flow-table');
    const weeklyIncomeElement = document.getElementById('weekly-income');

    // Check if elements exist before proceeding
    if (cashFlowTable && weeklyIncomeElement) {
        loadCashFlow();
        updateIncomeStatement();
    }
}

// Function to load cash flow data dynamically into the table
function loadCashFlow() {
    const cashFlowTableBody = document.getElementById('cash-flow-table').querySelector('tbody');
    cashFlowTableBody.innerHTML = '';  // Clear existing entries

    // Retrieve transactions from localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.type}</td>
            <td>${transaction.description}</td>
            <td>${transaction.amount < 0 ? '€' + (transaction.amount * -1) : '€' + transaction.amount}</td>
        `;
        cashFlowTableBody.appendChild(row);
    });
}

// Function to update the income statement
function updateIncomeStatement() {
    // Retrieve transactions from localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    const weeklyIncome = transactions.filter(t => t.type === 'Income').reduce((sum, i) => sum + i.amount, 0);
    const weeklyExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, i) => sum + Math.abs(i.amount), 0);
    const netIncome = weeklyIncome - weeklyExpenses;

    document.getElementById('weekly-income').textContent = weeklyIncome;
    document.getElementById('weekly-expenses').textContent = weeklyExpenses;
    document.getElementById('net-income').textContent = netIncome;
}

// Function to add a transaction entry with a specific date format
export function addTransaction(type, description, amount) {
    // Retrieve existing transactions
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Format the custom date based on the game's week, season, and year
    const week = localStorage.getItem('week');
    const season = localStorage.getItem('season');
    const year = localStorage.getItem('year');
    const date = `Week ${week}, ${season}, ${year}`;

    // Add the new transaction
    transactions.push({
        date,
        type,
        description,
        amount,
    });

    // Store the updated transactions back to local storage
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Initialize finance management when the document is ready
document.addEventListener('DOMContentLoaded', initializeFinance);