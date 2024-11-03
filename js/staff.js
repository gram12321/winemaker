// staff.js

// Import the necessary data from names.js
import { 
  italianMaleNames, frenchFemaleNames, spanishFemaleNames, usFemaleNames, germanFemaleNames,
  italianFemaleNames, frenchMaleNames, spanishMaleNames, usMaleNames, germanMaleNames,
  countryRegionMap 
} from './names.js'; // Adjust import path if necessary

import { loadStaff } from './database/adminFunctions.js'; // Ensure correct path
import { addRecurringTransaction } from './finance.js'; // Assume you have addRecurringTransaction implemented

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



// Function to display staff in the table on the staff management page
export function displayStaff() {
  // Get the element where we will insert staff data
  const staffContainer = document.getElementById('staff-container');
  staffContainer.innerHTML = ''; // Clear any existing content

  // Table structure creation
  const table = document.createElement('table');
  table.className = 'table mt-4';

  const thead = document.createElement('thead');
  thead.className = 'thead-light';
  thead.innerHTML = `
    <tr>
      <th scope="col">ID</th>
      <th scope="col">Name</th>
      <th scope="col">Nationality</th>
      <th scope="col">Workforce</th>
      <th scope="col">Wage (€)</th>
    </tr>
  `;

  const tbody = document.createElement('tbody');
  tbody.id = 'staff-entries';

  // Retrieve staff data from localStorage
  const staffData = JSON.parse(localStorage.getItem('staffData')) || [];

  // Iterate through each staff member to create table rows
  staffData.forEach(staff => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${staff.id}</td>
      <td>${staff.name}</td>
      <td>${staff.nationality}</td>
      <td>${staff.workforce}</td>
      <td>€${staff.wage}</td>
    `;
    tbody.appendChild(row);
  });

  // Assemble the table
  table.appendChild(thead);
  table.appendChild(tbody);
  staffContainer.appendChild(table);
}

// Function to calculate total staff wages
function calculateTotalStaffWages() {
    const staffMembers = loadStaff();
    return staffMembers.reduce((total, staff) => total + staff.wage, 0);
}
// Setup the staff wages as a recurring transaction
// Setup or update staff wages as a recurring transaction
function setupStaffWagesRecurringTransaction() {
    const totalWages = calculateTotalStaffWages();
    const frequencyInWeeks = 1; // Every week
    const description = 'Weekly Staff Wages';
    // Use the addRecurringTransaction function to handle the transaction
    addRecurringTransaction('Expense', description, -totalWages, frequencyInWeeks);
    console.log(`Setup or updated recurring transaction for staff wages: €${totalWages} every ${frequencyInWeeks} week(s).`);
}
// Call this function during initialization of the game or after adding staff
setupStaffWagesRecurringTransaction();