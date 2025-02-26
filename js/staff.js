import { italianMaleNames, frenchFemaleNames, spanishFemaleNames, usFemaleNames, germanFemaleNames, italianFemaleNames, frenchMaleNames, spanishMaleNames, usMaleNames, germanMaleNames, countryRegionMap, lastNamesByCountry  } from './names.js'; // Adjust import path if necessary
import { getFlagIconHTML, getSkillLevelInfo } from './utils.js'; // Import the getFlagIcon function and getSkillLevelInfo
import { loadTasks as loadTasksFromStorage } from './database/adminFunctions.js';
import { addRecurringTransaction } from './finance.js'; // Assume you have addRecurringTransaction implemented
import { showStaffOverlay } from './overlays/showstaffoverlay.js'; // Import the new staff overlay
import { specializedRoles } from './overlays/staffSearchOverlay.js'; // Keep this import
import { loadStaff } from './database/initiation.js';

// Remove the duplicate declaration and just export the imported specializedRoles
export { specializedRoles };

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

  constructor(firstName, lastName, skills = {}, skillLevel = 0.1, specializedRoles = []) {
    this.id = ++Staff.latestId; 
    localStorage.setItem('latestStaffId', Staff.latestId);
    this.firstName = firstName;
    this.lastName = lastName;
    this.nationality = this.selectNationality();
    this.name = `${firstName} ${lastName}`;
    this.workforce = 50;
    this.wage = 600;
    this.skills = new Skills(skills);
    this.experience = 0; // For future use in leveling up get experience from tasks completed / workapplyed 
    this.skillLevel = skillLevel;  // Add skill level
    this.specializedRoles = specializedRoles.length > 0 ? specializedRoles : ['Wine Enthusiast'];  // Set default role
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
function randomizeSkills(skillModifier = 0.5, specializedRole = null) {
    // Calculate base skill value first
    const baseValue = (Math.random() * 0.6) + (skillModifier * 0.4);
    
    // For specialized roles, add a percentage-based bonus that scales with skill
    if (specializedRole) {
        const remainingPotential = 1.0 - baseValue;
        const bonusPercentage = 0.2 + (skillModifier * 0.2); // 20-40%
        const bonus = remainingPotential * bonusPercentage;
        // Return number directly, no .toFixed(2)
        return Math.min(1.0, baseValue + bonus);
    }
    
    // Return number directly, no .toFixed(2)
    return baseValue;
}

export function createNewStaff(skillModifier = 0.5, specializedRoles = []) {
    const nationality = Staff.prototype.selectNationality();
    const firstName = Staff.prototype.getNameForNationality(nationality);
    const lastName = getLastNameForNationality(nationality);
    
    const skills = {
        field: { field: randomizeSkills(skillModifier, specializedRoles.includes('field')) },
        winery: { winery: randomizeSkills(skillModifier, specializedRoles.includes('winery')) },
        administration: { administration: randomizeSkills(skillModifier, specializedRoles.includes('administration')) },
        sales: { sales: randomizeSkills(skillModifier, specializedRoles.includes('sales')) },
        maintenance: { maintenance: randomizeSkills(skillModifier, specializedRoles.includes('maintenance')) }
    };

    const BASE_WEEKLY_WAGE = 500; // Base weekly wage for lowest skill
    const SKILL_WAGE_MULTIPLIER = 1000; // Multiplier for skills

    // Calculate wage based on skills
    const calculateWage = (skills) => {
        // Get average of all skills
        const avgSkill = (
            skills.field.field +
            skills.winery.winery +
            skills.administration.administration +
            skills.sales.sales +
            skills.maintenance.maintenance
        ) / 5;

        // Add bonus for specialized roles (30% per specialization)
        const specializationBonus = specializedRoles.length > 0 ? 
            Math.pow(1.3, specializedRoles.length) : 1;

        // Calculate monthly wage:
        // Base (500/week) + Skill bonus (up to 1000/week extra) * specialization bonus
        const weeklyWage = (BASE_WEEKLY_WAGE + (avgSkill * SKILL_WAGE_MULTIPLIER)) * specializationBonus;
        
        // Convert to monthly (multiply by 52/12)
        return Math.round(weeklyWage * 52/12) || BASE_WEEKLY_WAGE * 52/12; // Fallback to base wage if calculation fails
    };

    const newStaff = new Staff(firstName, lastName, skills, skillModifier);
    newStaff.specializedRoles = specializedRoles;  // Set specialized roles
    newStaff.workforce = 50;
    newStaff.wage = calculateWage(skills);
    
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
        <th scope="col">Skill Level</th>
        <th scope="col">Specialization</th>
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
        const totalSkills = staff.skills.field.field + 
                          staff.skills.winery.winery + 
                          staff.skills.administration.administration + 
                          staff.skills.sales.sales + 
                          staff.skills.maintenance.maintenance;
        const maxTotalSkills = 5.0;
        const containerWidth = (totalSkills / maxTotalSkills) * 100;
        
        const skillsHTML = `
          <div class="skill-bar-outer">
            <div class="skill-bar-container" style="width: ${containerWidth}%">
              <div class="skill-bar field-skill-bar" style="width: ${(staff.skills.field.field / totalSkills) * 100}%;" title="Field Skill: ${staff.skills.field.field}">F</div>
              <div class="skill-bar winery-skill-bar" style="width: ${(staff.skills.winery.winery / totalSkills) * 100}%;" title="Winery Skill: ${staff.skills.winery.winery}">W</div>
              <div class="skill-bar admin-skill-bar" style="width: ${(staff.skills.administration.administration / totalSkills) * 100}%;" title="Administration Skill: ${staff.skills.administration.administration}">A</div>
              <div class="skill-bar sales-skill-bar" style="width: ${(staff.skills.sales.sales / totalSkills) * 100}%;" title="Sales Skill: ${staff.skills.sales.sales}">S</div>
              <div class="skill-bar maintenance-skill-bar" style="width: ${(staff.skills.maintenance.maintenance / totalSkills) * 100}%;" title="Maintenance Skill: ${staff.skills.maintenance.maintenance}">M</div>
            </div>
          </div>
        `;

        const skillInfo = getSkillLevelInfo(staff.skillLevel);
        const specializationHTML = staff.specializedRoles.map(role => {
            const roleInfo = specializedRoles[role] || { title: role }; // Fallback if role not found
            return `<span class="specialization ${role}">${roleInfo.title}</span>`;
        }).join(', ');

        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.innerHTML = `
          <td>${staff.name}</td>
          <td>${getFlagIconHTML(staff.nationality)} ${staff.nationality}</td>
          <td>${skillInfo.formattedName}</td>
          <td>${specializationHTML}</td>
          <td>€${staff.wage}</td>
          <td>${assignedTaskDetail}</td>
          <td>${skillsHTML}</td>
        `;
        tbody.appendChild(row);

        // Add event listener to open overlay on row click
        row.addEventListener('click', () => {
            showStaffOverlay(staff); // Pass the correct staff object
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

export function getDefaultTeams() {
  return [
    {
      name: 'Administration Team',
      description: 'Handle company administration and paperwork',
      flagCode: 'bookkeeping',
      teamPicture: 'placeholder.webp',
      members: [],
      defaultTaskTypes: ['administration']  // Changed from taskManager.ADMINISTRATION
    },
    {
      name: 'Building & Maintenance Team',
      description: 'Maintain and upgrade facilities',
      flagCode: 'maintain',
      teamPicture: 'placeholder.webp',
      members: [],
      defaultTaskTypes: ['maintenance']  // Changed from taskManager.MAINTENANCE
    },
    {
      name: 'Vineyard Team',
      description: 'Coordinate vineyard operations',
      flagCode: 'harvesting',
      teamPicture: 'placeholder.webp',
      members: [],
      defaultTaskTypes: ['field']  // Changed from taskManager.FIELD
    },
    {
      name: 'Winery Team',
      description: 'Oversee winery processes',
      flagCode: 'crushing',
      teamPicture: 'placeholder.webp',
      members: [],
      defaultTaskTypes: ['winery']  // Changed from taskManager.WINERY
    },
    {
      name: 'Sales Team',
      description: 'Manage your sales force',
      flagCode: 'sales',
      teamPicture: 'placeholder.webp',
      members: [],
      defaultTaskTypes: ['sales']  // Changed from taskManager.SALES
    }
  ];
}