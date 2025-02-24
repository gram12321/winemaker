import { db, collection, getDocs, getDoc, deleteDoc, setDoc, doc } from './firebase.js';
import { createNewStaff, getDefaultTeams, Staff } from '/js/staff.js';
import { addTransaction } from '/js/finance.js';
import { setFarmlandsStore } from '/js/database/adminFunctions.js';
import { Building } from '/js/classes/buildingClasses.js'; 

// Move staff functions here
export function saveStaff(staffMembers) {
    if (Array.isArray(staffMembers)) {
        localStorage.setItem('staffData', JSON.stringify(staffMembers.map(staff => ({
            id: staff.id,
            nationality: staff.nationality,
            name: staff.name,
            lastName: staff.lastName,
            workforce: staff.workforce,
            wage: staff.wage,
            skills: staff.skills,
            skillLevel: staff.skillLevel,
            specializedRoles: staff.specializedRoles
        }))));
    }
}

export function loadStaff() {
    let staffMembers = [];
    let savedStaffData = localStorage.getItem('staffData');

    if (savedStaffData) {
        try {
            const parsedData = JSON.parse(savedStaffData);
            staffMembers = parsedData.map(item => {
                const staff = new Staff(
                    item.name.split(' ')[0], 
                    item.lastName, 
                    item.skills, 
                    item.skillLevel || 0.1
                );
                staff.id = item.id;
                staff.nationality = item.nationality;
                staff.name = item.name;
                staff.workforce = item.workforce;
                staff.wage = item.wage;
                staff.specializedRoles = item.specializedRoles || [];
                return staff;
            });
        } catch (error) {
            console.error("Failed to parse staff data from localStorage.", error);
        }
    }
    return staffMembers;
}

// Team management functions 
export function saveTeams(teams) {
  const defaultTeams = getDefaultTeams();
  const defaultTeamNames = defaultTeams.map(t => t.name);

  localStorage.setItem('teams', JSON.stringify(teams));
  
  const deletedDefaultTeams = defaultTeamNames.filter(name => 
      !teams.some(t => t.name === name)
  );
  localStorage.setItem('deletedDefaultTeams', JSON.stringify(deletedDefaultTeams));
}

export function loadTeams() {
  const defaultTeams = getDefaultTeams();
  const savedTeams = JSON.parse(localStorage.getItem('teams') || '[]');
  const deletedDefaultTeams = JSON.parse(localStorage.getItem('deletedDefaultTeams') || '[]');
  
  const activeDefaultTeams = defaultTeams.filter(team => 
      !deletedDefaultTeams.includes(team.name)
  );

  const savedDefaultTeams = savedTeams.filter(team => 
      defaultTeams.some(defaultTeam => defaultTeam.name === team.name)
  );

  const mergedDefaultTeams = activeDefaultTeams.map(defaultTeam => {
      const savedVersion = savedDefaultTeams.find(t => t.name === defaultTeam.name);
      return savedVersion || defaultTeam;
  });

  const customTeams = savedTeams.filter(team => 
      !defaultTeams.some(defaultTeam => defaultTeam.name === team.name)
  );

  return [...mergedDefaultTeams, ...customTeams];
}

async function clearFirestore() {
  if (confirm('Are you sure you want to delete all companies from Firestore?')) {
    try {
      const querySnapshot = await getDocs(collection(db, "companies"));
      querySnapshot.forEach(async (docSnapshot) => {
        await deleteDoc(docSnapshot.ref);
      });
      
    } catch (error) {
      console.error('Error clearing Firestore: ', error);
    }
  }
}

// Existing clearLocalStorage function in adminFunctions.js
async function clearLocalStorage() {
  localStorage.removeItem('companyName');
  localStorage.removeItem('money');
  localStorage.removeItem('week');
  localStorage.removeItem('season');
  localStorage.removeItem('year');
  localStorage.removeItem('calculatedPrestige');     // Ensure we clear prestige
  localStorage.removeItem('prestigeHit');  // Ensure we clear prestige hit
  localStorage.removeItem('ownedFarmlands');
  localStorage.removeItem('buildings');
  localStorage.removeItem('playerInventory');
  localStorage.removeItem('consoleMessages');
  localStorage.removeItem('staffData');
  localStorage.removeItem('latestStaffId');
  localStorage.removeItem('wineOrders');
  localStorage.removeItem('transactions'); // Clear transactions data
  localStorage.removeItem('recurringTransactions'); // Clear recurring transactions data
  localStorage.removeItem('activeTasks'); // Clear active tasks
  localStorage.removeItem('deletedDefaultTeams'); 
  localStorage.removeItem('teams'); 
  localStorage.removeItem('panelCollapsed'); 
  localStorage.removeItem('sidebarCollapsed'); 
  localStorage.removeItem('upgrades'); // Clear upgrades data
  localStorage.removeItem('seenTutorials'); // Clear tutorial progress
  //localStorage.removeItem('tutorialsEnabled'); // Clear tutorial settings
  
  console.log("Local storage cleared.");
}

async function storeCompanyName(companyName, startingCondition = null) {
  if (companyName) {
    const exists = await checkCompanyExists(companyName);
    if (exists) {
      await loadExistingCompanyData(companyName);
      window.location.href = 'html/game.html'; // Forward to game.html directly
    } else {
      localStorage.setItem('companyName', companyName);
      localStorage.setItem('money', 0); // Set initial money to 0
      
      // Fix: Ensure country is stored in uppercase for tutorial system
      const countryName = startingCondition ? startingCondition.name.toUpperCase() : 'FRANCE';
      localStorage.setItem('startingCountry', countryName);

      // Set initial date values before logging the transaction
      localStorage.setItem('week', 1); // Initialize week
      localStorage.setItem('season', 'Spring'); // Initialize season
      localStorage.setItem('year', 2025); // Initialize year

      // Log the initial income transaction
      const startingMoney = startingCondition ? startingCondition.startingMoney : 1000000;
      addTransaction('Income', 'Initial Company Setup', startingMoney);

      // Initialize staff array at the top
      let staff = [];
      const country = startingCondition ? startingCondition.name : 'France';

      switch (country) {
        case 'Italy':
          const italyStaff1 = createNewStaff(0.5, ['winery']);
          italyStaff1.firstName = 'Roberto';
          italyStaff1.lastName = 'De Luca';
          italyStaff1.nationality = 'Italy';
          italyStaff1.name = 'Roberto De Luca';
          
          const italyStaff2 = createNewStaff(0.5);
          italyStaff2.firstName = 'Bianca';
          italyStaff2.lastName = 'De Luca';
          italyStaff2.nationality = 'Italy';
          italyStaff2.name = 'Bianca De Luca';
          
          staff = [italyStaff1, italyStaff2];
          break;

        case 'France':
          const franceStaff1 = createNewStaff(0.5, ['winery']);
          franceStaff1.firstName = 'Pierre';
          franceStaff1.lastName = 'Latosha';
          franceStaff1.nationality = 'France';
          franceStaff1.name = 'Pierre Latosha';
          
          const franceStaff2 = createNewStaff(0.5);
          franceStaff2.firstName = 'Camillé';
          franceStaff2.lastName = 'Latosha';
          franceStaff2.nationality = 'France';
          franceStaff2.name = 'Camillé Latosha';
          
          staff = [franceStaff1, franceStaff2];
          break;

        case 'Germany':
          const germanStaff1 = createNewStaff(0.5, ['winery']);
          germanStaff1.firstName = 'Johann';
          germanStaff1.lastName = 'Weissburg';
          germanStaff1.nationality = 'Germany';
          germanStaff1.name = 'Johann Weissburg';
          
          const germanStaff2 = createNewStaff(0.5, ['maintenance']);
          germanStaff2.firstName = 'Lukas';
          germanStaff2.lastName = 'Weissburg';
          germanStaff2.nationality = 'Germany';
          germanStaff2.name = 'Lukas Weissburg';
          
          const germanStaff3 = createNewStaff(0.5, ['sales']);
          germanStaff3.firstName = 'Elsa';
          germanStaff3.lastName = 'Weissburg';
          germanStaff3.nationality = 'Germany';
          germanStaff3.name = 'Elsa Weissburg';
          
          const germanStaff4 = createNewStaff(0.5, ['administration']);
          germanStaff4.firstName = 'Klara';
          germanStaff4.lastName = 'Weissburg';
          germanStaff4.nationality = 'Germany';
          germanStaff4.name = 'Klara Weissburg';
          
          staff = [germanStaff1, germanStaff2, germanStaff3, germanStaff4];
          break;

        case 'Spain':
          const spainStaff1 = createNewStaff(0.5, ['winery']);
          spainStaff1.firstName = 'Miguel';
          spainStaff1.lastName = 'Torres';
          spainStaff1.nationality = 'Spain';
          spainStaff1.name = 'Miguel Torres';
          
          const spainStaff2 = createNewStaff(0.5);
          spainStaff2.firstName = 'Isabella';
          spainStaff2.lastName = 'Torres';
          spainStaff2.nationality = 'Spain';
          spainStaff2.name = 'Isabella Torres';
          
          staff = [spainStaff1, spainStaff2];
          break;

        case 'United States':
          const usStaff1 = createNewStaff(0.5, ['winery']);
          usStaff1.firstName = 'Sarah';
          usStaff1.lastName = 'Mondavi';
          usStaff1.nationality = 'United States';
          usStaff1.name = 'Sarah Mondavi';
          
          const usStaff2 = createNewStaff(0.5);
          usStaff2.firstName = 'Robert';
          usStaff2.lastName = 'Mondavi';
          usStaff2.nationality = 'United States';
          usStaff2.name = 'Robert Mondavi';
          
          staff = [usStaff1, usStaff2];
          break;

        default:
          const defaultStaff1 = createNewStaff(0.5, ['winery']);
          const defaultStaff2 = createNewStaff(0.5);
          staff = [defaultStaff1, defaultStaff2];
      }

      // Save staff data
      saveStaff(staff);

      // Assign initial staff to teams
      const defaultTeams = getDefaultTeams();
      const initialTeams = JSON.parse(JSON.stringify(defaultTeams)); // Create deep copy

      // Find and update teams
      const wineryTeam = initialTeams.find(team => team.name === 'Winery Team');
      const adminTeam = initialTeams.find(team => team.name === 'Administration Team');
      const maintenanceTeam = initialTeams.find(team => team.name === 'Building & Maintenance Team');
      
      if (wineryTeam && staff[0]) {
        wineryTeam.members = [staff[0]];
      }
      if (adminTeam && staff[1]) {
        adminTeam.members = [staff[1]];
      }
      if (maintenanceTeam) {
        maintenanceTeam.members = [staff[0], staff[1]];
      }

      saveTeams(initialTeams);

      // Create starting farmland if provided
      if (startingCondition && startingCondition.startingFarmland) {
        // Use the pre-generated farmland data directly
        const farmland = startingCondition.startingFarmland;
        const farmlands = [farmland];
        localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
        setFarmlandsStore(farmlands); // Use the setter instead of direct assignment
      } else {
        localStorage.setItem('ownedFarmlands', '[]');
        setFarmlandsStore([]); // Use the setter instead of direct assignment
      }

      // Initialize with starting buildings
      const startingBuildings = [
        new Building('Warehouse', 1),
        new Building('Office', 1),
        new Building('Wine Cellar', 1),
        new Building('Winery', 1)
      ];
      localStorage.setItem('buildings', JSON.stringify(startingBuildings));

      await saveCompanyInfo(); // Save company info to Firestore
      window.location.href = 'html/game.html'; // Redirect to game.html
    }
  }
}

async function checkCompanyExists(companyName) {
  const docRef = doc(db, "companies", companyName);
  const docSnap = await getDoc(docRef);

  return docSnap.exists(); // Check if the document exists
}

async function loadExistingCompanyData(companyName) {
  const docRef = doc(db, "companies", companyName);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    localStorage.setItem('companyName', data.name);
    localStorage.setItem('money', data.money);
    localStorage.setItem('week', data.week);
    localStorage.setItem('season', data.season);
    localStorage.setItem('year', data.year);
    localStorage.setItem('ownedFarmlands', data.ownedFarmlands || '[]');
    localStorage.setItem('playerInventory', data.playerInventory || '[]');
    localStorage.setItem('buildings', data.buildings || '[]');
    localStorage.setItem('staffData', data.staffData || '[]');
    localStorage.setItem('transactions', JSON.stringify(data.transactions || [])); // Load transactions
    localStorage.setItem('recurringTransactions', JSON.stringify(data.recurringTransactions || [])); // Load recurring transactions
    localStorage.setItem('activeTasks', JSON.stringify(data.activeTasks || [])); // Load active tasks
    localStorage.setItem('upgrades', JSON.stringify(data.upgrades || [])); // Load upgrades
  }
}

async function saveCompanyInfo() {
  const companyName = localStorage.getItem('companyName');
  if (!companyName) {
    console.error("No company name found to save.");
    return;
  }

  try {
    const docRef = doc(db, "companies", companyName);
    await setDoc(docRef, {
      name: companyName,
      money: localStorage.getItem('money'),
      week: localStorage.getItem('week'),
      season: localStorage.getItem('season'),
      year: localStorage.getItem('year'),
      ownedFarmlands: localStorage.getItem('ownedFarmlands'),
      playerInventory: localStorage.getItem('playerInventory'),
      buildings: localStorage.getItem('buildings'), // Just get the raw buildings data
      staffData: localStorage.getItem('staffData'),
      transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
      recurringTransactions: JSON.parse(localStorage.getItem('recurringTransactions') || '[]'),
      activeTasks: JSON.parse(localStorage.getItem('activeTasks') || '[]'),
      upgrades: JSON.parse(localStorage.getItem('upgrades') || '[]'),
      prestigeHit: localStorage.getItem('prestigeHit'),
      calculatedPrestige: localStorage.getItem('calculatedPrestige'),
    });
  } catch (error) {
    console.error("Error saving company info: ", error);
  }
}

export {
    storeCompanyName,
    saveCompanyInfo,
    clearLocalStorage,
    clearFirestore,

    checkCompanyExists,
    loadExistingCompanyData,
};
