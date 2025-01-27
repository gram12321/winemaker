import { italianMaleNames, frenchFemaleNames, spanishFemaleNames, usFemaleNames, germanFemaleNames, italianFemaleNames, frenchMaleNames, spanishMaleNames, usMaleNames, germanMaleNames, countryRegionMap, lastNamesByCountry  } from './names.js'; // Adjust import path if necessary
import { getFlagIconHTML } from './utils.js'; // Import the getFlagIcon function
import { loadStaff, loadTasks as loadTasksFromStorage } from './database/adminFunctions.js';
import { addRecurringTransaction } from './finance.js'; // Assume you have addRecurringTransaction implemented
import { showStaffOverlay } from './overlays/showstaffoverlay.js'; // Import the new staff overlay


//import { getBuildingTools } from './buildings.js'; // Ensure you're importing the tools 


class MaintenanceSkills {
  constructor(maintenance) {
    this.maintenance = maintenance.maintenance || 0;
  }
}

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
    this.maintenance = new MaintenanceSkills(skills.maintenance || {});
  }
}

export class Staff {
  static latestId = parseInt(localStorage.getItem('latestStaffId'), 10) || 0;

  constructor(firstName, lastName, skills = {}, experienceLevel = 0.1) {
    this.id = ++Staff.latestId; 
    localStorage.setItem('latestStaffId', Staff.latestId);
    this.firstName = firstName;
    this.lastName = lastName;
    this.nationality = this.selectNationality();
    this.name = `${firstName} ${lastName}`;
    this.workforce = 50;
    this.wage = 600;
    this.skills = new Skills(skills);
    this.experienceLevel = experienceLevel;  // Add experience level
    this.specializedRoles = [];  // Add specialized roles array
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

// Modify the randomizeSkills function to accept an experience modifier and specialized roles
function randomizeSkills(experienceModifier = 0.5, specializedRole = null) {
    // Calculate base skill value first
    const baseValue = (Math.random() * 0.6) + (experienceModifier * 0.4);
    
    // For specialized roles, add a percentage-based bonus that scales with experience
    if (specializedRole) {
        // Bonus is 20-40% of remaining potential (1.0 - baseValue)
        // Higher experience = bigger percentage of the remaining gap
        const remainingPotential = 1.0 - baseValue;
        const bonusPercentage = 0.2 + (experienceModifier * 0.2); // 20-40%
        const bonus = remainingPotential * bonusPercentage;
        return Math.min(1.0, baseValue + bonus).toFixed(2);
    }
    
    return baseValue.toFixed(2);
}

export function createNewStaff(experienceModifier = 0.5, specializedRoles = []) {
    const nationality = Staff.prototype.selectNationality();
    const firstName = Staff.prototype.getNameForNationality(nationality);
    const lastName = getLastNameForNationality(nationality);
    
    const skills = {
        field: { field: randomizeSkills(experienceModifier, specializedRoles.includes('field')) },
        winery: { winery: randomizeSkills(experienceModifier, specializedRoles.includes('winery')) },
        administration: { administration: randomizeSkills(experienceModifier, specializedRoles.includes('administration')) },
        sales: { sales: randomizeSkills(experienceModifier, specializedRoles.includes('sales')) },
        maintenance: { maintenance: randomizeSkills(experienceModifier, specializedRoles.includes('maintenance')) }
    };

    const skillMultiplier = 100;

    // Calculate wage based on skills
    const calculateWage = (skills) => (
        skills.field.field * skillMultiplier +
        skills.winery.winery * skillMultiplier +
        skills.administration.administration * skillMultiplier +
        skills.sales.sales * skillMultiplier +
        skills.maintenance.maintenance * skillMultiplier
    );

    const newStaff = new Staff(firstName, lastName, skills, experienceModifier);
    newStaff.specializedRoles = specializedRoles;  // Set specialized roles
    newStaff.workforce = 50;
    newStaff.wage = Math.round((0.75 + Math.random() * 1.25) * calculateWage(skills));
    
    return newStaff;
}

export function getLastNameForNationality(nationality) {
  const lastNamesList = lastNamesByCountry[nationality];
  return lastNamesList ? lastNamesList[Math.floor(Math.random() * lastNamesList.length)] : 'Unknown';
}


export function displayStaff() {
    
    const staffContainer = document.getElementById('staff-container');
    
    staffContainer.innerHTML = '';
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
        <th scope="col" class="skills-column" style="min-width: 250px;">Skills</th>
      </tr>
    `;

    const tbody = document.createElement('tbody');
    tbody.id = 'staff-entries';

    const staffData = loadStaff();
    const tasks = loadTasksFromStorage();

    staffData.forEach(staff => {
        const assignedTasks = [];
        tasks.forEach(task => {
            if (Array.isArray(task.assignedStaff) && task.assignedStaff.some(s => s.id === staff.id)) {
                if (task.target) {
                    assignedTasks.push(`<strong>${task.target.name}</strong> (${task.name})`);
                } else {
                    assignedTasks.push(`<strong>${task.name}</strong>`);
                }
            }
        });

        const assignedTaskDetail = assignedTasks.length > 0 ? assignedTasks.join('<br>') : 'None';
        const totalSkills = parseFloat(staff.skills.field.field) + 
                          parseFloat(staff.skills.winery.winery) + 
                          parseFloat(staff.skills.administration.administration) + 
                          parseFloat(staff.skills.sales.sales) + 
                          parseFloat(staff.skills.maintenance.maintenance);
        const maxTotalSkills = 5.0;
        const containerWidth = (totalSkills / maxTotalSkills) * 100;
        
        const skillsHTML = `
          <div class="skill-bar-outer">
            <div class="skill-bar-container" style="width: ${containerWidth}%">
              <div class="skill-bar" style="width: ${(parseFloat(staff.skills.field.field) / totalSkills) * 100}%; background-color: #ffcc00;" title="Field Skill: ${staff.skills.field.field}">F</div>
              <div class="skill-bar" style="width: ${(parseFloat(staff.skills.winery.winery) / totalSkills) * 100}%; background-color: #2179ff;" title="Winery Skill: ${staff.skills.winery.winery}">W</div>
              <div class="skill-bar" style="width: ${(parseFloat(staff.skills.administration.administration) / totalSkills) * 100}%; background-color: #6c757d;" title="Administration Skill: ${staff.skills.administration.administration}">A</div>
              <div class="skill-bar" style="width: ${(parseFloat(staff.skills.sales.sales) / totalSkills) * 100}%; background-color: #28a745;" title="Sales Skill: ${staff.skills.sales.sales}">S</div>
              <div class="skill-bar" style="width: ${(parseFloat(staff.skills.maintenance.maintenance) / totalSkills) * 100}%; background-color: #d9534f;" title="Maintenance Skill: ${staff.skills.maintenance.maintenance}">M</div>
            </div>
          </div>
        `;

        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.innerHTML = `
          <td>${staff.name}</td>
          <td>${getFlagIconHTML(staff.nationality)} ${staff.nationality}</td>
          <td>${staff.workforce}</td>
          <td>€${staff.wage}</td>
          <td>${assignedTaskDetail}</td>
          <td>${skillsHTML}</td>
        `;
        tbody.appendChild(row);

        // Add event listener to open overlay on row click
        row.addEventListener('click', () => {
            showStaffOverlay(staff);
        });
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    staffContainer.appendChild(table);
}

// Function to calculate total staff wages
function calculateTotalStaffWages() {
    const staffMembers = loadStaff();
    return staffMembers.reduce((total, staff) => total + staff.wage, 0);
}

// Initial wage setup

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