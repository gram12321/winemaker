// staff.js

// Import the necessary data from names.js
import { 
  italianMaleNames, frenchFemaleNames, spanishFemaleNames, usFemaleNames, germanFemaleNames,
  italianFemaleNames, frenchMaleNames, spanishMaleNames, usMaleNames, germanMaleNames,
  countryRegionMap 
} from './names.js'; // Adjust import path if necessary

export class Staff {
    static latestId = 0; // Tracks the latest ID assigned

    constructor() {
        this.id = ++Staff.latestId; // Auto-increment ID
        this.nationality = this.selectNationality();
        this.name = this.getNameForNationality(this.nationality);
        this.workforce = 50; // Fixed workforce size
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

// staff.js

// Function to display staff in the table on the staff management page
export function displayStaff() {
  // Get the element where we will insert staff data
  const staffEntries = document.getElementById('staff-entries');
  staffEntries.innerHTML = ''; // Clear any existing entries

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
    `;

    // Append the newly created row to the table
    staffEntries.appendChild(row);
  });
}