import { db, collection, getDocs, getDoc, deleteDoc, setDoc, doc } from './firebase.js';

async function clearLocalStorage() {
    if (confirm('Are you sure you want to clear all local storage data?')) {
        localStorage.removeItem('companyName');
        localStorage.removeItem('money');
        localStorage.removeItem('ownedFarmlands'); // Clear land-related data
        localStorage.removeItem('consoleMessages'); // Clear console messages
        alert('Local storage cleared successfully.');
    }
}

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
  }
}


async function saveCompanyInfo() {
  const companyName = localStorage.getItem('companyName');
  const money = localStorage.getItem('money');

  if (!companyName) {
    console.error("No company name found to save.");
    return;
  }

  try {
    const docRef = doc(db, "companies", companyName); // Reference a document named after the company
    await setDoc(docRef, { name: companyName, money: money });
    console.log("Company info saved successfully");
  } catch (error) {
    console.error("Error saving company info: ", error);
  }
}

export { storeCompanyName, saveCompanyInfo, clearLocalStorage, clearFirestore };
