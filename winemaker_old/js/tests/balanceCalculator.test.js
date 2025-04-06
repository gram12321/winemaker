import { 
    balanceCalculator, 
    calculateNearestArchetype, 
    baseBalancedRanges, 
    applyRangeAdjustments, 
    applyPenaltyAdjustments,
    distanceScore,
    dynamicBalanceScore,
    balanceScore
} from '../utils/balanceCalculator.js';
import { archetypes } from '../constants/archetypes.js';

// Helper function to create a complete wine object with all required properties
function createCompleteWine(characteristics) {
    return {
        sweetness: 0.5,
        acidity: 0.5,
        tannins: 0.5,
        aroma: 0.5,
        body: 0.5,
        spice: 0.5,
        quality: 0.7,
        vintage: 2023,
        oxidation: 0,
        ripeness: 0.5,
        fieldPrestige: 0.5,
        ...characteristics,
        resource: {
            name: 'Chardonnay',
            grapeColor: 'white',
            ...characteristics.resource
        }
    };
}

function displayTestResults(wine, archetypeName, testName) {
    const selectedArchetype = archetypeName ? archetypes[archetypeName] : null;
    
    // Add processing and regional requirements to the requirements check
    if (selectedArchetype) {
        if (selectedArchetype.processingReqs) {
            selectedArchetype.requirements = {
                ...selectedArchetype.requirements,
                processingReqs: selectedArchetype.processingReqs
            };
        }
        if (selectedArchetype.regionalReqs) {
            selectedArchetype.requirements = {
                ...selectedArchetype.requirements,
                regionalReqs: selectedArchetype.regionalReqs
            };
        }
    }

    const { archetype: nearestArch, distance, qualifies } = calculateNearestArchetype(wine);
    const adjustedRanges = applyRangeAdjustments(wine, baseBalancedRanges);
    const penalties = applyPenaltyAdjustments(wine);

    const testCase = document.createElement('div');
    testCase.className = 'test-case';

    // Test Header
    testCase.innerHTML = `
        <div class="test-header">${testName}</div>
        
        <div class="section-header">Characteristics</div>
        <table class="characteristics-table">
            <tr>
                <th>Characteristic</th>
                <th>Value</th>
                ${selectedArchetype ? '<th>Target Range</th>' : ''}
                <th>Adjusted Range</th>
            </tr>
            ${Object.entries(wine)
                .filter(([key, value]) => typeof value === 'number')
                .map(([key, value]) => `
                    <tr>
                        <td>${key}</td>
                        <td>${value.toFixed(2)}</td>
                        ${selectedArchetype ? 
                            `<td>${selectedArchetype.characteristics?.idealRanges[key] ? 
                                `${selectedArchetype.characteristics.idealRanges[key][0]} - ${selectedArchetype.characteristics.idealRanges[key][1]}` : 
                                'N/A'}</td>` : 
                            ''}
                        <td>${adjustedRanges[key] ? 
                            `${adjustedRanges[key][0].toFixed(2)} - ${adjustedRanges[key][1].toFixed(2)}` : 
                            'N/A'}</td>
                    </tr>
                `).join('')}
        </table>

        ${selectedArchetype ? `
            <div class="section-header">Requirements Check</div>
            <ul class="requirements-list">
                ${Object.entries(selectedArchetype.requirements || {})
                    .map(([req, value]) => {
                        let passed = checkRequirement(wine, req, value);
                        return `<li class="${passed ? 'pass' : 'fail'}">
                            ${req}: ${formatRequirement(req, value)} - ${passed ? '✓' : '✗'}
                        </li>`;
                    }).join('')}
            </ul>

            <div class="section-header">Balance Groups</div>
            ${selectedArchetype.balanceGroups.map((group, i) => {
                const values = group.map(char => wine[char]);
                const avgValue = values.reduce((a, b) => a + b) / values.length;
                const maxDiff = Math.max(...values) - Math.min(...values);
                return `
                    <div>Group ${i + 1} [${group.join(', ')}]:</div>
                    <div>Average: ${avgValue.toFixed(2)}, Max Difference: ${maxDiff.toFixed(2)}</div>
                `;
            }).join('')}
        ` : ''}

        <div class="section-header">Scores</div>
        <table class="scores-table">
            ${getScoresTableContent(wine, selectedArchetype)}
        </table>
    `;

    document.getElementById('testResults').appendChild(testCase);
}

function getScoresTableContent(wine, archetype) {
    if (!archetype) return '';
    
    const midpointScore = distanceScore(wine, archetype);
    const groupBalance = balanceScore(wine, archetype);
    const archetypeBalance = (midpointScore + groupBalance) / 2;
    const dynamicBalance = dynamicBalanceScore(wine, baseBalancedRanges, 0);
    const finalScore = balanceCalculator(wine, archetype);

    return `
        <tr><th>Score Type</th><th>Value</th></tr>
        <tr><td>Midpoint Score</td><td>${(midpointScore * 100).toFixed(1)}%</td></tr>
        <tr><td>Group Balance</td><td>${(groupBalance * 100).toFixed(1)}%</td></tr>
        <tr><td>Archetype Balance</td><td>${(archetypeBalance * 100).toFixed(1)}%</td></tr>
        <tr><td>Dynamic Balance</td><td>${(dynamicBalance * 100).toFixed(1)}%</td></tr>
        <tr><td>Final Balance Score</td><td>${(finalScore * 100).toFixed(1)}%</td></tr>
    `;
}

function checkRequirement(wine, requirement, value) {
    switch(requirement) {
        case 'requiredColor':
            return wine.resource.grapeColor === value;
            
        case 'requiredGrapes':
            return Array.isArray(value) && value.includes(wine.resource.name);
            
        case 'minimumQuality':
            return wine.quality >= value;
            
        case 'minimumVintage':
            return wine.vintage >= value;
            
        case 'minimumPrestige':
            return wine.fieldPrestige >= value;
            
        case 'oxidationRange':
            return wine.oxidation >= value[0] && wine.oxidation <= value[1];
            
        case 'ripenessRange':
            return wine.ripeness >= value[0] && wine.ripeness <= value[1];
            
        case 'processingReqs':
            if (!value) return true;
            let processingValid = true;
            
            if (value.requireEcological) {
                processingValid = processingValid && 
                    wine.fieldSource?.conventional === 'Ecological';
            }
            
            if (value.allowedMethods) {
                processingValid = processingValid && 
                    value.allowedMethods.includes(wine.crushingMethod);
            }
            
            return processingValid;
            
        case 'regionalReqs':
            if (!value) return true;
            let regionValid = true;
            
            if (value.country) {
                regionValid = regionValid && wine.country === value.country;
            }
            
            if (value.regions) {
                regionValid = regionValid && value.regions.includes(wine.region);
            }
            
            if (value.soilTypes) {
                regionValid = regionValid && 
                    value.soilTypes.includes(wine.fieldSource?.soil);
            }
            
            return regionValid;
            
        default:
            return true;
    }
}

function formatRequirement(requirement, value) {
    switch(requirement) {
        case 'requiredColor':
            return `Must be ${value} wine`;
            
        case 'requiredGrapes':
            return `Must use: ${value.join(' or ')}`;
            
        case 'minimumQuality':
            return `Quality ≥ ${(value * 100).toFixed(0)}%`;
            
        case 'minimumVintage':
            return `Vintage ≥ ${value}`;
            
        case 'minimumPrestige':
            return `Prestige ≥ ${(value * 100).toFixed(0)}%`;
            
        case 'oxidationRange':
            return `Oxidation: ${(value[0] * 100).toFixed(0)}%-${(value[1] * 100).toFixed(0)}%`;
            
        case 'ripenessRange':
            return `Ripeness: ${(value[0] * 100).toFixed(0)}%-${(value[1] * 100).toFixed(0)}%`;
            
        case 'processingReqs':
            let reqs = [];
            if (value.requireEcological) reqs.push('Must be ecological');
            if (value.allowedMethods) reqs.push(`Methods: ${value.allowedMethods.join(', ')}`);
            return reqs.join(', ');
            
        case 'regionalReqs':
            let regions = [];
            if (value.country) regions.push(`Country: ${value.country}`);
            if (value.regions) regions.push(`Region: ${value.regions.join(', ')}`);
            if (value.soilTypes) regions.push(`Soil: ${value.soilTypes.join(', ')}`);
            return regions.join(', ');
            
        default:
            return JSON.stringify(value);
    }
}

// Update test execution
console.log("=== Balance Calculator Enhanced Test Suite ===\n");

// Test 1: Perfect Sweet Wine
console.log("Test 1: Perfect Sweet Wine");
const perfectSweet = createCompleteWine({
    sweetness: 0.95,
    acidity: 0.9,
    tannins: 0.5,
    aroma: 0.5,
    body: 0.5,
    spice: 0.7,
    quality: 0.9,
    ripeness: 0.9,
    resource: { name: 'Chardonnay', grapeColor: 'white' }
});
displayTestResults(perfectSweet, 'sweetWine', 'Perfect Sweet Wine');

// Test 2: Bold Red with Synergy
console.log("\nTest 2: Bold Red with Synergy");
const boldRedWithSynergy = createCompleteWine({
    sweetness: 0.2,
    acidity: 0.65,
    tannins: 0.75,
    aroma: 0.5,
    body: 0.75,
    spice: 0.75,
    quality: 0.8,
    fieldPrestige: 0.7,
    resource: { name: 'Primitivo', grapeColor: 'red' }
});
displayTestResults(boldRedWithSynergy, 'boldRed', 'Bold Red with Synergy');

// Test 3: Light White Wine
console.log("\nTest 3: Light White Wine Test");
const lightWhite = createCompleteWine({
    sweetness: 0.3,
    acidity: 0.75,
    tannins: 0.1,
    aroma: 0.8,
    body: 0.2,
    spice: 0.2,
    quality: 0.85,
    oxidation: 0.1,
    ripeness: 0.9,
    resource: { name: 'Chardonnay', grapeColor: 'white' }
});
displayTestResults(lightWhite, 'lightWhite', 'Light White Wine');

// Test 4: Unbalanced Wine
console.log("\nTest 4: Unbalanced Wine");
const unbalancedWine = createCompleteWine({
    sweetness: 0.9,
    acidity: 0.2,
    tannins: 0.8,
    aroma: 0.3,
    body: 0.9,
    spice: 0.1,
    quality: 0.7,
    ripeness: 0.6,
    resource: { name: 'Primitivo', grapeColor: 'red' }
});
displayTestResults(unbalancedWine, null, 'Unbalanced Wine');

// Test 5: Natural Wine Test
console.log("\nTest 5: Natural Wine Test");
const naturalWine = createCompleteWine({
    sweetness: 0.3,
    acidity: 0.8,
    tannins: 0.5,
    aroma: 0.9,
    body: 0.6,
    spice: 0.5,
    quality: 0.8,
    oxidation: 0.2,
    ripeness: 0.9,
    resource: { name: 'Chardonnay', grapeColor: 'white' },
    crushingMethod: 'Hand Crushing',
    fieldSource: { conventional: 'Ecological' }
});
displayTestResults(naturalWine, 'naturalWine', 'Natural Wine');

// Test 6: Oxidative Jura Style
console.log("\nTest 6: Oxidative Jura Style Test");
const oxidativeWine = createCompleteWine({
    sweetness: 0.3,
    acidity: 0.7,
    tannins: 0.3,
    aroma: 0.85,
    body: 0.6,
    spice: 0.5,
    oxidation: 0.4,
    ripeness: 0.8,
    quality: 0.75,
    resource: { name: 'Chardonnay', grapeColor: 'white' }
});
displayTestResults(oxidativeWine, 'oxidatedJura', 'Oxidative Jura Style');

// Test 7: Extreme Values Test
console.log("\nTest 7: Extreme Values Test");
const extremeWine = createCompleteWine({
    sweetness: 1.0,
    acidity: 0.0,
    tannins: 1.0,
    aroma: 0.0,
    body: 1.0,
    spice: 0.0,
    quality: 0.5,
    ripeness: 0.5,
    resource: { name: 'Primitivo', grapeColor: 'red' }
});
displayTestResults(extremeWine, null, 'Extreme Values');

// Additional test for archetype matching
console.log("\nTest 8: Perfect Archetype Match");
const perfectMatch = createCompleteWine({
    sweetness: 0.2,
    acidity: 0.8,
    tannins: 0.1,
    aroma: 0.8,
    body: 0.2,
    spice: 0.2,
    quality: 0.9,
    oxidation: 0.1,
    ripeness: 0.9,
    resource: { name: 'Chardonnay', grapeColor: 'white' }
});
displayTestResults(perfectMatch, 'lightWhite', 'Perfect Archetype Match');

console.log("=== Balance Calculator Archetype Test Suite ===\n");

// Test Cases for each archetype
const archetypeTests = {
    sweetWine: {
        sweetness: 0.9,
        acidity: 0.9,
        tannins: 0.5,
        aroma: 0.5,
        body: 0.5,
        spice: 0.5,
        quality: 0.8,
        oxidation: 0.05,
        ripeness: 0.85,
        resource: { name: 'Chardonnay', grapeColor: 'white' }
    },

    boldRed: {
        sweetness: 0.2,
        acidity: 0.5,
        tannins: 0.85,
        aroma: 0.5,
        body: 0.85,
        spice: 0.85,
        quality: 0.8,
        fieldPrestige: 0.7,
        resource: { name: 'Primitivo', grapeColor: 'red' }
    },

    lightWhite: {
        sweetness: 0.3,
        acidity: 0.75,
        tannins: 0.1,
        aroma: 0.75,
        body: 0.2,
        spice: 0.2,
        quality: 0.85,
        oxidation: 0.1,
        ripeness: 0.9,
        resource: { name: 'Chardonnay', grapeColor: 'white' }
    },

    sparklingWine: {
        sweetness: 0.15,
        acidity: 0.85,
        tannins: 0.1,
        aroma: 0.55,
        body: 0.3,
        spice: 0.2,
        quality: 0.8,
        oxidation: 0.1,
        ripeness: 0.8,
        resource: { name: 'Chardonnay', grapeColor: 'white' }
    },

    roseWine: {
        sweetness: 0.4,
        acidity: 0.65,
        tannins: 0.3,
        aroma: 0.75,
        body: 0.4,
        spice: 0.3,
        quality: 0.75,
        oxidation: 0.1,
        ripeness: 0.8,
        fieldPrestige: 0.5,
        resource: { name: 'Primitivo', grapeColor: 'red' }
    },

    classicChardonnay: {
        sweetness: 0.4,
        acidity: 0.6,
        tannins: 0.1,
        aroma: 0.75,
        body: 0.5,
        spice: 0.3,
        quality: 0.8,
        oxidation: 0.15,
        ripeness: 0.9,
        fieldPrestige: 0.6,
        resource: { name: 'Chardonnay', grapeColor: 'white' }
    },

    orangeWine: {
        sweetness: 0.15,
        acidity: 0.85,
        tannins: 0.75,
        aroma: 0.75,
        body: 0.65,
        spice: 0.65,
        quality: 0.7,
        resource: { name: 'Chardonnay', grapeColor: 'white' }
    },

    americanChardonnay: {
        sweetness: 0.4,
        acidity: 0.5,
        tannins: 0.2,
        aroma: 0.85,
        body: 0.85,
        spice: 0.7,
        quality: 0.8,
        resource: { name: 'Chardonnay', grapeColor: 'white' }
    },

    vintageChampagne: {
        sweetness: 0.2,
        acidity: 0.9,
        tannins: 0.1,
        aroma: 0.85,
        body: 0.5,
        spice: 0.3,
        quality: 0.9,
        vintage: 2019,
        fieldPrestige: 0.95,
        resource: { name: 'Chardonnay', grapeColor: 'white' }
    },

    volcanicWhite: {
        sweetness: 0.3,
        acidity: 0.8,
        tannins: 0.2,
        aroma: 0.85,
        body: 0.6,
        spice: 0.5,
        quality: 0.8,
        oxidation: 0.1,
        ripeness: 0.9,
        resource: { name: 'Chardonnay', grapeColor: 'white' },
        fieldSource: { soil: 'Volcanic Soil' }
    },

    amaroneStyle: {
        sweetness: 0.4,
        acidity: 0.6,
        tannins: 0.85,
        aroma: 0.8,
        body: 0.9,
        spice: 0.7,
        quality: 0.85,
        oxidation: 0.2,
        ripeness: 0.95,
        fieldPrestige: 0.8,
        vintage: 2020,
        resource: { name: 'Primitivo', grapeColor: 'red' }
    },

    oxidatedJura: {
        sweetness: 0.3,
        acidity: 0.7,
        tannins: 0.3,
        aroma: 0.85,
        body: 0.6,
        spice: 0.5,
        quality: 0.75,
        oxidation: 0.4,
        ripeness: 0.8,
        resource: { name: 'Chardonnay', grapeColor: 'white' }
    },

    naturalWine: {
        sweetness: 0.35,
        acidity: 0.75,
        tannins: 0.5,
        aroma: 0.85,
        body: 0.55,
        spice: 0.55,
        quality: 0.8,
        oxidation: 0.25,
        ripeness: 0.9,
        resource: { name: 'Chardonnay', grapeColor: 'white' },
        crushingMethod: 'Hand Crushing',
        fieldSource: { conventional: 'Ecological' }
    }
};

// Run tests for each archetype
Object.entries(archetypeTests).forEach(([archetypeName, characteristics]) => {
    console.log(`\nTest: ${archetypeName}`);
    const wine = createCompleteWine(characteristics);
    displayTestResults(wine, archetypeName, `${archetypeName} Test`);
});
