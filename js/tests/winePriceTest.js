import { calculateBaseWinePrice, calculateWinePrice, calculateExtremeQualityMultiplier } from '../sales.js';
import { normalizeLandValue } from '../names.js';
import { calculateAgeContribution, calculateLandValueContribution, calculatePrestigeRankingContribution, calculateFragilityBonusContribution } from '../farmland.js';

// Comprehensive function to analyze wine price contributions
export function analyzeWinePriceContribution(quality, wine, farmland) {
    if (!farmland) return { totalPrice: 0, contributions: {} };
    
    // Get quality and balance values
    const qualityValue = quality !== undefined ? quality : 0.5;
    const balanceValue = wine.balance !== undefined ? wine.balance : 0.5;
    
    // 1. Calculate normalized land value
    const normalizedLandValue = normalizeLandValue(farmland.landvalue);
    
    // 2. Calculate base price components
    const landValueComponent = normalizedLandValue * 100 / 2; // 50% of base price
    const fieldPrestigeComponent = wine.fieldPrestige * 100 / 2; // 50% of base price
    const basePrice = landValueComponent + fieldPrestigeComponent;
    
    // 3. Calculate combined quality score and multiplier
    const combinedScore = (qualityValue * 0.6) + (balanceValue * 0.4);
    const priceMultiplier = calculateExtremeQualityMultiplier(combinedScore);
    
    // 4. Calculate final price
    const finalPrice = basePrice * priceMultiplier;
    
    // 5. Break down field prestige components to track ultimate sources
    const vineAgeContribution = calculateAgeContribution(farmland.vineAge) / wine.fieldPrestige * fieldPrestigeComponent;
    const landPrestigeContribution = calculateLandValueContribution(farmland.landvalue) / wine.fieldPrestige * fieldPrestigeComponent;
    const regionPrestigeContribution = calculatePrestigeRankingContribution(farmland.region, farmland.country) / wine.fieldPrestige * fieldPrestigeComponent;
    const fragilityContribution = calculateFragilityBonusContribution(farmland.plantedResourceName) / wine.fieldPrestige * fieldPrestigeComponent;
    
    // 6. Calculate percentage of land value's total influence (direct + through prestige)
    const directLandValueContribution = landValueComponent;
    const indirectLandValueContribution = landPrestigeContribution;
    const totalLandValueInfluence = directLandValueContribution + indirectLandValueContribution;
    const landValuePercentage = (totalLandValueInfluence / basePrice) * 100;
    
    // 7. Calculate how multiplier affects price
    const multiplierEffect = finalPrice - basePrice;
    const qualityEffectOnMultiplier = 0.6 * multiplierEffect; // 60% weight in combined score
    const balanceEffectOnMultiplier = 0.4 * multiplierEffect; // 40% weight in combined score
    
    // 8. Calculate percentage contribution of each factor to final price
    const totalPrice = finalPrice;
    
    // Calculate percentages of final price
    const directLandValuePct = (directLandValueContribution / totalPrice) * 100;
    const indirectLandValuePct = (indirectLandValueContribution / totalPrice) * 100;
    const vineAgePct = (vineAgeContribution / totalPrice) * 100;
    const regionPrestigePct = (regionPrestigeContribution / totalPrice) * 100;
    const fragilityPct = (fragilityContribution / totalPrice) * 100;
    const qualityPct = (qualityEffectOnMultiplier / totalPrice) * 100;
    const balancePct = (balanceEffectOnMultiplier / totalPrice) * 100;
    
    return {
        totalPrice: finalPrice,
        basePrice: basePrice,
        multiplier: priceMultiplier,
        contributions: {
            // Direct contributions to base price
            directLandValue: {
                value: directLandValueContribution,
                percentage: directLandValuePct
            },
            // Through field prestige
            indirectLandValue: {
                value: indirectLandValueContribution,
                percentage: indirectLandValuePct
            },
            vineAge: {
                value: vineAgeContribution,
                percentage: vineAgePct
            },
            regionPrestige: {
                value: regionPrestigeContribution,
                percentage: regionPrestigePct
            },
            fragility: {
                value: fragilityContribution,
                percentage: fragilityPct
            },
            // Quality and balance effects
            quality: {
                value: qualityEffectOnMultiplier,
                percentage: qualityPct
            },
            balance: {
                value: balanceEffectOnMultiplier,
                percentage: balancePct
            },
            // Summary
            totalLandValueInfluence: {
                value: totalLandValueInfluence,
                percentage: (directLandValuePct + indirectLandValuePct)
            }
        },
        // Raw values for reference
        rawValues: {
            normalizedLandValue,
            fieldPrestige: wine.fieldPrestige,
            qualityValue,
            balanceValue,
            combinedScore
        }
    };
}

// Create a test wine object
function createTestWine(params = {}) {
    return {
        resource: { name: 'Test Wine', grapeColor: 'red' },
        quality: 0.7,
        balance: 0.7,
        fieldPrestige: 0.5,
        ...params
    };
}

// Create a test farmland object
function createTestFarmland(params = {}) {
    return {
        landvalue: 50000,
        vineAge: '15',
        country: 'France',
        region: 'Bordeaux',
        plantedResourceName: 'Primitivo',
        ...params
    };
}

// Test cases
export const testCases = [
    {
        name: "Average Quality Wine from Bordeaux",
        wine: createTestWine({ quality: 0.7, balance: 0.6, fieldPrestige: 0.5 }),
        farmland: createTestFarmland({ landvalue: 50000, vineAge: '10', region: 'Bordeaux' }),
        quality: 0.7
    },
    {
        name: "High Quality Wine from Burgundy",
        wine: createTestWine({ quality: 0.9, balance: 0.85, fieldPrestige: 0.8 }),
        farmland: createTestFarmland({ landvalue: 800000, vineAge: '30', region: 'Burgundy (Bourgogne)', country: 'France' }),
        quality: 0.9
    },
    {
        name: "Exceptional Wine from Champagne",
        wine: createTestWine({ quality: 0.98, balance: 0.97, fieldPrestige: 0.95 }),
        farmland: createTestFarmland({ landvalue: 1500000, vineAge: '50', region: 'Champagne', country: 'France' }),
        quality: 0.98
    },
    {
        name: "Low Quality Wine from La Mancha",
        wine: createTestWine({ quality: 0.4, balance: 0.3, fieldPrestige: 0.2 }),
        farmland: createTestFarmland({ landvalue: 10000, vineAge: '3', region: 'La Mancha', country: 'Spain' }),
        quality: 0.4
    }
];

// Running tests and displaying results
export function runPriceAnalysisTests() {
    return testCases.map(testCase => {
        const analysis = analyzeWinePriceContribution(testCase.quality, testCase.wine, testCase.farmland);
        return {
            name: testCase.name,
            analysis: analysis
        };
    });
}

// Format price analysis for display
export function formatPriceAnalysis(analysis) {
    if (!analysis || !analysis.contributions) {
        return 'Invalid analysis data';
    }

    let result = `
        <div class="price-analysis">
            <h3>Wine Price Breakdown</h3>
            <p><strong>Base Price:</strong> €${analysis.basePrice.toFixed(2)}</p>
            <p><strong>Price Multiplier:</strong> ${analysis.multiplier.toFixed(2)}x</p>
            <p><strong>Final Price:</strong> €${analysis.totalPrice.toFixed(2)}</p>
            
            <h4>Price Contribution by Factor:</h4>
            <table class="price-factors">
                <tr>
                    <th>Factor</th>
                    <th>Value (€)</th>
                    <th>Percentage</th>
                </tr>
                ${Object.entries(analysis.contributions)
                    .filter(([key]) => key !== 'totalLandValueInfluence') // Exclude summary
                    .map(([key, data]) => `
                        <tr>
                            <td>${formatFactorName(key)}</td>
                            <td>€${data.value.toFixed(2)}</td>
                            <td>${data.percentage.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
            </table>
            
            <h4>Total Land Value Influence:</h4>
            <p>${analysis.contributions.totalLandValueInfluence.percentage.toFixed(1)}% of the final price</p>
            
            <h4>Raw Values:</h4>
            <ul>
                ${Object.entries(analysis.rawValues).map(([key, value]) => `
                    <li>${key}: ${typeof value === 'number' ? value.toFixed(3) : value}</li>
                `).join('')}
            </ul>
        </div>
    `;
    
    return result;
}

function formatFactorName(key) {
    const nameMap = {
        'directLandValue': 'Land Value (Direct)',
        'indirectLandValue': 'Land Value (through Prestige)',
        'vineAge': 'Vine Age',
        'regionPrestige': 'Region Reputation',
        'fragility': 'Grape Type',
        'quality': 'Wine Quality',
        'balance': 'Wine Balance'
    };
    
    return nameMap[key] || key;
}
