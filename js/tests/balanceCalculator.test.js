import { balanceCalculator } from '../utils/balanceCalculator.js';
import { archetypes } from '../constants/archetypes.js';

console.log("=== Balance Calculator Test Suite ===\n");

// Test 1: Perfect Sweet Wine (Archetype Test)
const perfectSweet = {
    sweetness: 0.95,
    acidity: 0.9,
    tannins: 0.5,
    aroma: 0.5,
    body: 0.5,
    spice: 0.7
};
console.log("Test 1 - Perfect Sweet Wine:", 
    balanceCalculator(perfectSweet, archetypes.sweetWine),
    "Expected: ~99%");

console.log("\n=== Synergy vs No-Synergy in Archetypes Test ===");

// Test 2A: Bold Red with Synergy-qualifying values (but within archetype ranges)
const boldRedWithSynergy = {
    sweetness: 0.2,     // Within archetype range
    acidity: 0.5,       // Within archetype range (changed from 0.75)
    tannins: 0.75,      // Within archetype range
    aroma: 0.5,         // Within archetype range
    body: 0.75,         // Within archetype range
    spice: 0.75         // Within archetype range
};

// Test 2B: Bold Red without Synergy-qualifying values but same archetype fit
const boldRedNoSynergy = {
    sweetness: 0.2,     // Same archetype fit
    acidity: 0.6,       // Different but still in archetype range
    tannins: 0.75,      // Same archetype fit
    aroma: 0.5,         // Same
    body: 0.75,         // Same
    spice: 0.75         // Same
};

console.log("Test 2A - Bold Red with Synergy Values:", 
    balanceCalculator(boldRedWithSynergy, archetypes.boldRed));
console.log("Test 2B - Bold Red without Synergy Values:", 
    balanceCalculator(boldRedNoSynergy, archetypes.boldRed),
    "Expected: Test 2A and 2B should have identical scores (synergies shouldn't affect archetype scoring)");

console.log("\n=== Dynamic Balance Synergy Test ===");

// Test 3: Same wines but without archetype (should now show difference due to synergy)
console.log("Test 3A - Dynamic Balance with Synergy:", 
    balanceCalculator(boldRedWithSynergy, null));
console.log("Test 3B - Dynamic Balance without Synergy:", 
    balanceCalculator(boldRedNoSynergy, null),
    "Expected: Test 3A should score higher than 3B due to synergy bonus in dynamic calculation");

console.log("\n=== Synergy Bonus Tests ===");

// Test 1: Perfect synergy between body and spice
const bodySpiceSynergy = {
    sweetness: 0.5,
    acidity: 0.5,
    tannins: 0.5,
    aroma: 0.5,
    body: 0.7,    // Within synergy range
    spice: 0.7    // Exactly matches body
};
console.log("Test 1 - Body-Spice Synergy:", 
    balanceCalculator(bodySpiceSynergy, null), 
    "Expected: High score with synergy bonus");

// Test 2: Same wine but without synergy-qualifying values
const noSynergy = {
    sweetness: 0.5,
    acidity: 0.5,
    tannins: 0.5,
    aroma: 0.5,
    body: 0.5,    // Outside synergy range
    spice: 0.4    // Not matching body
};
console.log("Test 2 - No Synergy:", 
    balanceCalculator(noSynergy, null),
    "Expected: Lower than Test 1");

console.log("\n=== Penalty System Tests ===");

// Test 3: High tannins with reduced sweetness penalty
const highTanninLowSweet = {
    sweetness: 0.3,   // Low sweetness
    acidity: 0.5,
    tannins: 0.8,     // High tannins
    aroma: 0.5,
    body: 0.5,
    spice: 0.5
};
console.log("Test 3 - High Tannins, Low Sweet (Compatible):", 
    balanceCalculator(highTanninLowSweet, null),
    "Expected: Moderate score, reduced penalties");

// Test 4: High tannins with high sweetness penalty
const highTanninHighSweet = {
    sweetness: 0.8,   // High sweetness
    acidity: 0.5,
    tannins: 0.8,     // High tannins
    aroma: 0.5,
    body: 0.5,
    spice: 0.5
};
console.log("Test 4 - High Tannins, High Sweet (Conflict):", 
    balanceCalculator(highTanninHighSweet, null),
    "Expected: Much lower than Test 3");

console.log("\n=== Multiple Synergy Test ===");

// Test 5: Wine with multiple synergies
const multiSynergy = {
    sweetness: 0.5,    // Moderate (good for aroma balance)
    acidity: 0.75,     // High (synergy with tannins)
    tannins: 0.75,     // High (synergy with acidity)
    aroma: 0.7,        // Higher than body (synergy)
    body: 0.6,         // Good range for body-spice
    spice: 0.65        // Close to body
};
console.log("Test 5 - Multiple Synergies:", 
    balanceCalculator(multiSynergy, null),
    "Expected: Very high score with multiple bonuses");

console.log("\n=== Archetype with Synergy Test ===");

// Test 6: Bold Red that also hits synergies
const boldRedSynergy = {
    sweetness: 0.2,     // Good for bold red
    acidity: 0.75,      // High (synergy with tannins)
    tannins: 0.8,       // Perfect for bold red + synergy
    aroma: 0.5,         // Within archetype range
    body: 0.75,         // Good for bold red
    spice: 0.77         // Close to body, good for bold red
};
console.log("Test 6 - Bold Red with Synergies:", 
    balanceCalculator(boldRedSynergy, archetypes.boldRed),
    "Expected: High score from both archetype and synergies");

console.log("\n=== Extreme Values Test ===");

// Test 7: Extreme values with compensating relationships
const extremeBalanced = {
    sweetness: 0.9,    // Very high
    acidity: 0.85,     // Balanced with sweetness
    tannins: 0.2,      // Very low (good with high sweet)
    aroma: 0.5,
    body: 0.7,         // Good range
    spice: 0.65        // Close to body
};
console.log("Test 7 - Extreme but Balanced Values:", 
    balanceCalculator(extremeBalanced, null),
    "Expected: Decent score despite extremes");
