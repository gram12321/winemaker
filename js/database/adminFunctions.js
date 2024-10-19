import { db, collection, getDocs, deleteDoc } from './firebase.js';

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

export { clearLocalStorage, clearFirestore };