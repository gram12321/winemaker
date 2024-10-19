import { db, collection, getDocs, getDoc, deleteDoc, setDoc, doc } from './firebase.js';

async function clearFirestore() {
    if (confirm('Are you sure you want to delete all companies from Firestore?')) {
        try {
            const querySnapshot = await getDocs(collection(db, "companies"));
            querySnapshot.forEach(async (docSnapshot) => {
                await deleteDoc(docSnapshot.ref);
            });
            alert('All company data cleared from Firestore successfully.');
        } catch (error) {
            console.error('Error clearing Firestore: ', error);
            alert('An error occurred while clearing Firestore.');
        }
    }
}

async function clearLocalStorage() {
    if (confirm('Are you sure you want to clear all local storage data?')) {
        localStorage.removeItem('companyName');
        localStorage.removeItem('money');
        localStorage.removeItem('day'); // Clear day
        localStorage.removeItem('season'); // Clear season
        localStorage.removeItem('year'); // Clear year
        localStorage.removeItem('ownedFarmlands'); // Clear land-related data
        localStorage.removeItem('consoleMessages'); // Clear console messages
        alert('Local storage cleared successfully.');
    }
}

async function storeCompanyName() {
  const companyNameInput = document.getElementById('company-name');
  if (companyNameInput) {
    const companyName = companyNameInput.value;
    if (companyName) {
      const exists = await checkCompanyExists(companyName);
      if (exists) {
        loadExistingCompanyData(companyName);
        window.location.href = 'html/game.html'; // Forward to game.html directly
      } else {
        localStorage.setItem('companyName', companyName);
        localStorage.setItem('money', 10000); // Initialize money with 10000
        localStorage.setItem('day', 1); // Initialize day
        localStorage.setItem('season', 'Spring'); // Initialize season
        localStorage.setItem('year', 2023); // Initialize year
        saveCompanyInfo(); // Save company info to firestore
        window.location.href = 'html/game.html'; // Redirect to game.html
      }
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
    // Load existing data into local storage
    const data = docSnap.data();
    localStorage.setItem('companyName', data.name);
    localStorage.setItem('money', data.money);
    localStorage.setItem('day', data.day); // Load day
    localStorage.setItem('season', data.season); // Load season
    localStorage.setItem('year', data.year); // Load year
    localStorage.setItem('ownedFarmlands', data.ownedFarmlands); // Load owned farmlands
  }
}

async function saveCompanyInfo() {
  const companyName = localStorage.getItem('companyName');
  const money = localStorage.getItem('money');
  const day = localStorage.getItem('day'); // Get the day
  const season = localStorage.getItem('season'); // Get the season
  const year = localStorage.getItem('year'); // Get the year
  const ownedFarmlands = localStorage.getItem('ownedFarmlands'); // Get owned farmlands

  if (!companyName) {
    console.error("No company name found to save.");
    return;
  }

  try {
    const docRef = doc(db, "companies", companyName); // Reference a document named after the company
    await setDoc(docRef, { 
      name: companyName, 
      money: money, 
      day: day, 
      season: season, 
      year: year, 
      ownedFarmlands: ownedFarmlands 
    });
    console.log("Company info saved successfully");
  } catch (error) {
    console.error("Error saving company info: ", error);
  }
}

export { storeCompanyName, saveCompanyInfo, clearLocalStorage, clearFirestore };