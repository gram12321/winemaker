import { italianMaleNames, frenchFemaleNames, spanishFemaleNames, usFemaleNames, germanFemaleNames, italianFemaleNames, frenchMaleNames, spanishMaleNames, usMaleNames, germanMaleNames, countryRegionMap, lastNamesByCountry  } from './names.js'; // Adjust import path if necessary
import { getFlagIconHTML } from './utils.js'; // Import the getFlagIcon function
import { loadStaff } from './database/adminFunctions.js'; // Ensure correct path
import { addRecurringTransaction } from './finance.js'; // Assume you have addRecurringTransaction implemented
import { loadTasks } from './database/adminFunctions.js'; // Import the function to load tasks
import { Task } from './loadPanel.js';  // Adjust the path based on your file structure
import { showStaffOverlay } from './overlays/staffoverlay.js'; // Ensure the correct path

import { getBuildingTools } from './buildings.js'; // Ensure you're importing the tools 


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

  constructor(firstName, lastName, skills = {}) {
    this.id = ++Staff.latestId; 
    localStorage.setItem('latestStaffId', Staff.latestId);
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

function randomizeSkills() {
  return Math.random().toFixed(2);
}

export function createNewStaff() {
  const nationality = Staff.prototype.selectNationality();
  const firstName = Staff.prototype.getNameForNationality(nationality);
  const lastName = getLastNameForNationality(nationality);
  const skills = {
    field: { field: randomizeSkills() },
    winery: { winery: randomizeSkills() },
    administration: { administration: randomizeSkills() },
    sales: { sales: randomizeSkills() },
    maintenance: { maintenance: randomizeSkills() }
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

  const newStaff = new Staff(firstName, lastName, skills);
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
    staffContainer.innerHTML = ''; // Clear any existing content

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
        <th scope="col" class="skills-column" style="min-width: 250px;">Skills</th> <!-- Ensure min-width -->
      </tr>
    `;

    const tbody = document.createElement('tbody');
    tbody.id = 'staff-entries';

    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    staffData.forEach(staff => {
        const assignedTasks = [];
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
        const skillsHTML = `
          <div class="skill-bar-container">
            <div class="skill-bar" style="width: ${parseFloat(staff.skills.field.field) * 100}%; background-color: #ffcc00; height: 20px;" title="Field Skill: ${staff.skills.field.field}">F</div>
            <div class="skill-bar" style="width: ${parseFloat(staff.skills.winery.winery) * 100}%; background-color: #2179ff; height: 20px;" title="Winery Skill: ${staff.skills.winery.winery}">W</div>
            <div class="skill-bar" style="width: ${parseFloat(staff.skills.administration.administration) * 100}%; background-color: #6c757d; height: 20px;" title="Administration Skill: ${staff.skills.administration.administration}">A</div>
            <div class="skill-bar" style="width: ${parseFloat(staff.skills.sales.sales) * 100}%; background-color: #28a745; height: 20px;" title="Sales Skill: ${staff.skills.sales.sales}">S</div>
            <div class="skill-bar" style="width: ${parseFloat(staff.skills.maintenance.maintenance) * 100}%; background-color: #d9534f; height: 20px;" title="Maintenance Skill: ${staff.skills.maintenance.maintenance}">M</div>
          </div>
        `;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="staff-name">${staff.name}</td>
          <td>${getFlagIconHTML(staff.nationality)} ${staff.nationality}</td>
          <td>${staff.workforce}</td>
          <td>€${staff.wage}</td>
          <td>${assignedTaskDetail}</td>
          <td>${skillsHTML}</td>
        `;
        tbody.appendChild(row);

        // Add event listener to open overlay on staff name click
        row.querySelector('.staff-name').addEventListener('click', () => {
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

export function calculateWorkApplied(taskStaff, processingFunction) {
    let workApplied = 0;
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    console.log(`Calculating work applied for processing function: ${processingFunction}`);

    // Look up the relevant task type using processingFunction
    const taskTypeEntry = Object.values(Task.taskTypes).find(entry => 
        entry.processingFunctions.includes(processingFunction)
    );

    if (!taskTypeEntry) {
        console.warn(`Unknown processing function: ${processingFunction}`);
        return workApplied;
    }

    const { processPerWorkApplied, skillKey } = taskTypeEntry;

    // Calculate work applied per staff member
    taskStaff.forEach(staffId => {
        const staffMember = staffData.find(staff => staff.id.toString() === staffId);
        if (staffMember) {
            const taskCount = tasks.reduce((count, task) => {
                return (task.staff && task.staff.includes(staffId.toString())) ? count + 1 : count;
            }, 0);

            let skillLevel = 0;

            if (skillKey && staffMember.skills[skillKey]) {
                skillLevel = parseFloat(staffMember.skills[skillKey][skillKey]);
                console.log(`Staff ID: ${staffId}, Skill Level: ${skillLevel}`);
            } else {
                console.warn(`Unknown skill key: ${skillKey} for Staff ID: ${staffId}`);
            }

            if (taskCount > 0 && skillLevel > 0) {
                const workFromStaff = (staffMember.workforce / taskCount) * skillLevel;
                console.log(`Staff ID: ${staffId}, Task Count: ${taskCount}, Workforce Share: ${staffMember.workforce / taskCount}, Applied Work: ${workFromStaff}`);
                workApplied += workFromStaff;
            }
        } else {
            console.warn(`Staff ID: ${staffId} not found in staff data.`);
        }
    });

    let totalWorkApplied = workApplied * processPerWorkApplied;
    console.log(`Initial Total work applied: ${totalWorkApplied}`);

    // Apply speed bonus only to field tasks
    if (skillKey === 'field') {
        // Get tools specific to field tasks, sorted by speed bonus descending
        const tools = getBuildingTools()
            .filter(tool => tool.buildingType === 'Tool Shed')
            .sort((a, b) => b.speedBonus - a.speedBonus);

        // Assign tools to staff based on available tools
        const assignedTools = new Array(taskStaff.length).fill(null);
        tools.forEach((tool, index) => {
            if (index < taskStaff.length) {
                assignedTools[index] = tool;
            }
        });

        assignedTools.forEach((tool, index) => {
            if (tool) {
                console.log(`Assigning Tool: ${tool.name} to staff ${index + 1}, Speed Bonus: ${tool.speedBonus}`);
                totalWorkApplied += workApplied * (tool.speedBonus - 1.0);
            }
        });

        console.log(`Total work applied with tool assignments: ${totalWorkApplied}`);
    }

    console.log(`Final Total work applied for ${processingFunction}: ${totalWorkApplied}, using Process Per Work Applied: ${processPerWorkApplied}`);
    return totalWorkApplied;
}