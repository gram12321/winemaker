import { formatNumber } from './utils.js';  // Ensure correct path
import { renderCompanyInfo } from './database/loadSidebar.js';

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
        const formattedAmount = formatNumber(Math.abs(transaction.amount));

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.type}</td>
            <td>${transaction.description}</td>
            <td>€${formattedAmount}</td>
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

    document.getElementById('weekly-income').textContent = `€${formatNumber(weeklyIncome)}`;
    document.getElementById('weekly-expenses').textContent = `€${formatNumber(weeklyExpenses)}`;
    document.getElementById('net-income').textContent = `€${formatNumber(netIncome)}`;
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

    // Update the player's balance
    const currentMoney = parseInt(localStorage.getItem('money'), 10) || 0;
    const newMoney = currentMoney + amount;
    localStorage.setItem('money', newMoney);

    // Optionally update any related UI directly here
    renderCompanyInfo();
}

// Add a recurring transaction with frequency in weeks
export function addRecurringTransaction(type, description, amount, frequencyInWeeks) {
    let recurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || [];
    const currentWeek = parseInt(localStorage.getItem('week'), 10) || 1;
    // Check if the transaction already exists
    const transactionIndex = recurringTransactions.findIndex(transaction =>
        transaction.type === type && transaction.description === description
    );
    if (transactionIndex !== -1) {
        // Update the existing transaction
        recurringTransactions[transactionIndex].amount = amount;
        recurringTransactions[transactionIndex].frequencyInWeeks = frequencyInWeeks;
        recurringTransactions[transactionIndex].nextDueWeek = currentWeek + frequencyInWeeks;
        console.log(`Updated recurring transaction: ${description}`);
    } else {
        // Add the new recurring transaction if it doesn't exist
        recurringTransactions.push({
            type,
            description,
            amount,
            frequencyInWeeks,
            nextDueWeek: currentWeek + frequencyInWeeks
        });
        console.log(`Added new recurring transaction: ${description}`);
    }
    // Save the transactions back to localStorage
    localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
}


// Function to process recurring transactions
export function processRecurringTransactions(currentWeek) {
    let recurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || [];
    recurringTransactions.forEach(transaction => {
        if (currentWeek >= transaction.nextDueWeek) {
            // Record the transaction
            addTransaction(transaction.type, transaction.description, transaction.amount);
            // Schedule the next occurrence
            transaction.nextDueWeek += transaction.frequencyInWeeks;
        }
    });
    localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
}

// Initialize finance management when the document is ready
document.addEventListener('DOMContentLoaded', initializeFinance);