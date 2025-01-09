import { formatNumber } from './utils.js';
import { renderCompanyInfo } from './database/loadSidebar.js';
import { saveCompanyInfo } from './database/adminFunctions.js';

export function loadCashFlow() {
  const cashFlowTableBody = document.getElementById('cash-flow-table')?.querySelector('tbody');
  if (!cashFlowTableBody) return;

  cashFlowTableBody.innerHTML = '';
  const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  let runningBalance = 0;

  const balanceAfterTransactions = transactions.map(transaction => {
    runningBalance += transaction.amount;
    return runningBalance;
  });

  for (let i = transactions.length - 1; i >= 0; i--) {
    const transaction = transactions[i];
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.date}</td>
      <td>${transaction.type}</td>
      <td>${transaction.description}</td>
      <td class="${transaction.amount > 0 ? 'transaction-income' : 'transaction-expense'}">
        €${formatNumber(Math.abs(transaction.amount))}
      </td>
      <td>€${formatNumber(balanceAfterTransactions[i])}</td>
    `;
    cashFlowTableBody.appendChild(row);
  }
}

export function updateIncomeStatement() {
  const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  const weeklyIncome = transactions.reduce((sum, t) => 
    t.type === 'Income' ? sum + t.amount : sum, 0);
  const weeklyExpenses = transactions.reduce((sum, t) => 
    t.type === 'Expense' ? sum + Math.abs(t.amount) : sum, 0);

  document.getElementById('weekly-income').textContent = `€${formatNumber(weeklyIncome)}`;
  document.getElementById('weekly-expenses').textContent = `€${formatNumber(weeklyExpenses)}`;
  document.getElementById('net-income').textContent = `€${formatNumber(weeklyIncome - weeklyExpenses)}`;
}

export function addTransaction(type, description, amount) {
  const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  const date = `Week ${localStorage.getItem('week')}, ${localStorage.getItem('season')}, ${localStorage.getItem('year')}`;

  transactions.push({ date, type, description, amount });
  localStorage.setItem('transactions', JSON.stringify(transactions));

  const currentMoney = parseInt(localStorage.getItem('money'), 10) || 0;
  localStorage.setItem('money', currentMoney + amount);

  renderCompanyInfo();
  saveCompanyInfo();
}

export function processRecurringTransactions(currentWeek) {
  const recurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || [];

  recurringTransactions.forEach(transaction => {
    if (currentWeek >= transaction.nextDueWeek) {
      addTransaction(transaction.type, transaction.description, transaction.amount);
      transaction.nextDueWeek += transaction.frequencyInWeeks;
      if (transaction.nextDueWeek > 12) transaction.nextDueWeek -= 12;
    }
  });

  localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
}

export function addRecurringTransaction(type, description, amount, frequencyInWeeks) {
  const recurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || [];
  const currentWeek = parseInt(localStorage.getItem('week'), 10) || 1;
  const nextDueWeek = currentWeek + frequencyInWeeks;

  const existingIndex = recurringTransactions.findIndex(t => 
    t.type === type && t.description === description);

  if (existingIndex !== -1) {
    recurringTransactions[existingIndex] = { 
      type, description, amount, frequencyInWeeks, nextDueWeek 
    };
  } else {
    recurringTransactions.push({ 
      type, description, amount, frequencyInWeeks, nextDueWeek 
    });
  }

  localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
}