// staff.js

// Import the necessary data from names.js
import { italianMaleNames, frenchFemaleNames, spanishFemaleNames, usFemaleNames, germanFemaleNames, italianFemaleNames, frenchMaleNames, spanishMaleNames, usMaleNames, germanMaleNames, countryRegionMap, lastNamesByCountry  } from './names.js'; // Adjust import path if necessary
import { getFlagIconHTML } from './utils.js'; // Import the getFlagIcon function
import { loadStaff } from './database/adminFunctions.js'; // Ensure correct path
import { addRecurringTransaction } from './finance.js'; // Assume you have addRecurringTransaction implemented
import { loadTasks } from './database/adminFunctions.js'; // Import the function to load tasks

class FieldSkills {
  constructor(field) {
      this.field = field.field || 0;
  }
}
class WinerySkills {
  constructor(winery) {
      this.winery = winery.winery || 0;
  }
}
class AdministrationSkills {
  constructor(administration) {
      this.administration = administration.administration || 0;
  }
}
class SalesSkills {
  constructor(sales) {
      this.sales = sales.sales || 0;
  }
}
class Skills {
  constructor(skills) {
      this.field = new FieldSkills(skills.field || {});
      this.winery = new WinerySkills(skills.winery || {});
      this.administration = new AdministrationSkills(skills.administration || {});
      this.sales = new SalesSkills(skills.sales || {});
  }
}
// Main Staff class
export class Staff {
  static latestId = 0;
  constructor(firstName, lastName, skills = {}) {
      this.id = ++Staff.latestId;
      this.firstName = firstName;
      this.lastName = lastName;
      this.nationality = this.selectNationality();
      this.name = this.getNameForNationality(this.nationality);
      this.workforce = 50;
      this.wage = 600;
      this.skills = new Skills(skills);
  }
  selectNationality() {
      const countries = Object.keys(countryRegionMap);
      return countries[Math.floor(Math.random() * countries.length)];
  }
  getNameForNationality(nationality) {
      const nameMap = {
          'Italy': italianMaleNames.concat(italianFemaleNames),
          'France': frenchMaleNames.concat(frenchFemaleNames),
          'Spain': spanishMaleNames.concat(spanishFemaleNames),
          'United States': usMaleNames.concat(usFemaleNames),
          'Germany': germanMaleNames.concat(germanFemaleNames),
      };
      const namesList = nameMap[nationality];
      return namesList ? namesList[Math.floor(Math.random() * namesList.length)] : 'Unknown';
  }
}

function getLastNameForNationality(nationality) {
  const lastNamesList = lastNamesByCountry[nationality];
  return lastNamesList ? lastNamesList[Math.floor(Math.random() * lastNamesList.length)] : 'Unknown';
}
function randomizeSkills() {
  return Math.random();
}
function createNewStaff() {
  const nationality = Staff.prototype.selectNationality();
  const firstName = Staff.prototype.getNameForNationality(nationality);
  const lastName = getLastNameForNationality(nationality);
  const skills = {
      field: { field: randomizeSkills() },
      winery: { winery: randomizeSkills() },
      administration: { administration: randomizeSkills() },
      sales: { sales: randomizeSkills() }
  };
  const newStaff = new Staff(firstName, lastName, skills);
  newStaff.workforce = 50;
  newStaff.wage = 600;
  return newStaff;
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
    }
}
