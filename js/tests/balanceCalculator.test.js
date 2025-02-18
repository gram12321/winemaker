import { balanceCalculator, archetypes } from '../utils/balanceCalculator.js';

/* Test Cases
console.log("=== Balance Calculator Test Suite ===");

// Test 1: Perfect Sweet Wine
const perfectSweet = {
    sweetness: 0.95,
    acidity: 0.9,
    tannins: 0.5,
    aroma: 0.5,
    body: 0.5,
    spice: 0.7
};
console.log("Test 1 - Perfect Sweet Wine:", 
    balanceCalculator(perfectSweet, archetypes.sweetWine), "Expected: archetype~99% dynamic 95%");

// Test 2: Rejected Sweet Wine (Too Low Acidity)
const rejectedSweet = {
    sweetness: 0.9,
    acidity: 0.4,
    tannins: 0.5,
    aroma: 0.5,
    body: 0.5,
    spice: 0.5
};
console.log("Test 2 - Rejected Sweet Wine:", 
    balanceCalculator(rejectedSweet, archetypes.sweetWine), "Expected: >40%");

// Test 3: Perfect Bold Red
const perfectBold = {
    sweetness: 0.2,     // Keep - good for bold red
    acidity: 0.6,      // Keep - balanced with aroma
    tannins: 0.85,     // Matches with body and spice
    aroma: 0.5,        // Increased to better match ideal range
    body: 0.85,        // Adjusted to match tannins
    spice: 0.85        // Adjusted to match tannins/body
};
console.log("Test 3 - Perfect Bold Red:", 
    balanceCalculator(perfectBold, archetypes.boldRed), "Expected: ~96%");

// Test 4: Unbalanced Bold Red (High Tannins with Minimal Body)
const unbalancedBold = {
    sweetness: 0.05,
    acidity: 0.5,
    tannins: 1.0,      // Maximum tannins
    aroma: 0.7,
    body: 0.7,         // Minimum acceptable body
    spice: 0.8         // Creates imbalance with tannins
};
console.log("Test 4 - Unbalanced Bold Red:", 
    balanceCalculator(unbalancedBold, archetypes.boldRed), "Expected: <70%");

// Test 5: Edge Case - All Zeros
const allZeros = {
    sweetness: 0,
    acidity: 0,
    tannins: 0,
    aroma: 0,
    body: 0,
    spice: 0
};
console.log("Test 5 - All Zeros:", 
    balanceCalculator(allZeros, archetypes.boldRed), "Expected: <40%");

// Test 6: Edge Case - All Ones
const allOnes = {
    sweetness: 1,
    acidity: 1,
    tannins: 1,
    aroma: 1,
    body: 1,
    spice: 1
};
console.log("Test 6 - All Ones:", 
    balanceCalculator(allOnes, archetypes.boldRed), "Expected: <40%");
 */