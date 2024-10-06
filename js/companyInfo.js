import { db, doc, getDoc } from './firebase.js';

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

export { storeCompanyName };

export function updateCompanyInfo() {
    const companyName = localStorage.getItem('companyName');
    const money = localStorage.getItem('money');
    const companyInfoDiv = document.getElementById('companyInfo');

    if (companyInfoDiv) {
        companyInfoDiv.innerHTML = `
          <p><strong>Company Info:</strong> ${companyName}</p>
          <p><strong>Money:</strong> $${money}</p>
        `;
    }
    const dropdownToggle = document.querySelector('#navbarDropdown');
    if (companyName && dropdownToggle) {
        dropdownToggle.textContent = companyName;
    }
}