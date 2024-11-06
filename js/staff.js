// staff.js

// Import the necessary data from names.js
import { italianMaleNames, frenchFemaleNames, spanishFemaleNames, usFemaleNames, germanFemaleNames, italianFemaleNames, frenchMaleNames, spanishMaleNames, usMaleNames, germanMaleNames, countryRegionMap } from './names.js'; // Adjust import path if necessary
import { getFlagIconHTML } from './utils.js'; // Import the getFlagIcon function
import { loadStaff } from './database/adminFunctions.js'; // Ensure correct path
import { addRecurringTransaction } from './finance.js'; // Assume you have addRecurringTransaction implemented
import { loadTasks } from './database/adminFunctions.js'; // Import the function to load tasks

export class Staff {
    static latestId = 0; // Tracks the latest ID assigned
    constructor() {
        this.id = ++Staff.latestId; // Auto-increment ID
        this.nationality = this.selectNationality();
        this.name = this.getNameForNationality(this.nationality);
        this.workforce = 50; // Fixed workforce size
        this.wage = 600; // Default wage in Euros per week
    }
    // Method to randomly select a nationality from the countryRegionMap keys
    selectNationality() {
        const countries = Object.keys(countryRegionMap);
        return countries[Math.floor(Math.random() * countries.length)];
    }
    // Method to get a name for the selected nationality
    getNameForNationality(nationality) {
        const nameMap = {
            'Italy': italianMaleNames.concat(italianFemaleNames),
            'France': frenchMaleNames.concat(frenchFemaleNames),
            'Spain': spanishMaleNames.concat(spanishFemaleNames),
            'United States': usMaleNames.concat(usFemaleNames),
            'Germany': germanMaleNames.concat(germanFemaleNames)
        };
        const namesList = nameMap[nationality];
        if (namesList && namesList.length > 0) {
            return namesList[Math.floor(Math.random() * namesList.length)];
        }
        return 'Unknown'; // Fallback name if no list is found
    }
}

export function displayStaff() {
  const staffContainer = document.getElementById('staff-container');
  staffContainer.innerHTML = ''; // Clear any existing content

  // Create table for displaying staff
  const table = document.createElement('table');
  table.className = 'table mt-4';

  const thead = document.createElement('thead');
  thead.className = 'thead-light';
  thead.innerHTML = `
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Nationality</th>
      <th scope="col">Workforce</th>
      <th scope="col">Wage (€)</th>
      <th scope="col">Assigned Tasks</th>
    </tr>
  `;

  const tbody = document.createElement('tbody');
  tbody.id = 'staff-entries';

  // Retrieve staff data from localStorage
  const staffData = JSON.parse(localStorage.getItem('staffData')) || [];

  // Load tasks to check task assignments
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  // Create table rows for each staff member
  staffData.forEach(staff => {
    const assignedTasks = []; // Array to hold task details

    tasks.forEach(task => {
      if (task.staff && task.staff.includes(staff.id.toString())) {
        let locationLabel = 'Unknown'; 
        switch (task.type) {
          case 'Winery':
            locationLabel = 'Winery';
            break;
          case 'Administration':
            locationLabel = 'Administration';
            break;
          case 'Sales':
            locationLabel = 'Sales';
            break;
          default:
            locationLabel = task.fieldName || 'Unknown';
        }
        assignedTasks.push(`<strong>${task.taskName}</strong>, ${locationLabel}`);
      }
    });

    const assignedTaskDetail = assignedTasks.length > 0 ? assignedTasks.join('<br>') : 'None';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${staff.name}</td>
      <td>${getFlagIconHTML(staff.nationality)} ${staff.nationality}</td>
      <td>${staff.workforce}</td>
      <td>€${staff.wage}</td>
      <td>${assignedTaskDetail}</td>
    `;
    tbody.appendChild(row);
  });

  // Append the table head and body to the table
  table.appendChild(thead);
  table.appendChild(tbody);
  staffContainer.appendChild(table);
}

// Function to calculate total staff wages
function calculateTotalStaffWages() {
    const staffMembers = loadStaff();
    return staffMembers.reduce((total, staff) => total + staff.wage, 0);
}

function updateWagesAndRecurringTransaction() {
    const totalWages = calculateTotalStaffWages();
    const frequencyInWeeks = 1; // Weekly frequency
    const description = 'Weekly Staff Wages';

    addRecurringTransaction('Expense', description, -totalWages, frequencyInWeeks);
    console.log(`Updated recurring transaction for staff wages: €${totalWages} every ${frequencyInWeeks} week(s).`);
}

// Initial wage setup. Use updateWagesAndRecurringTransaction to update wage and recurring transaction

export function setupStaffWagesRecurringTransaction() {
    const totalWages = calculateTotalStaffWages();
    const frequencyInWeeks = 1;
    const description = 'Weekly Staff Wages';

    // Load existing recurring transactions
    let recurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || [];

    // Check if the transaction already exists and is up-to-date
    const existingTransaction = recurringTransactions.find(transaction =>
        transaction.type === 'Expense' && transaction.description === description
    );

    if (!existingTransaction || existingTransaction.amount !== -totalWages) {
        // Add or update the transaction only if it doesn't exist or is outdated
        addRecurringTransaction('Expense', description, -totalWages, frequencyInWeeks);
        console.log(`Setup or updated recurring transaction for staff wages: €${totalWages} every ${frequencyInWeeks} week(s).`);
    }
}
