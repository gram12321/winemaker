// js/loadsave.js
import { db, doc, setDoc } from './firebase.js';

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

export { saveCompanyInfo };