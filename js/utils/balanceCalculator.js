export function balanceCalculator(wine, archetype) {
    if (!qualifiesForArchetype(wine, archetype)) return 0;

    let midpointScore = distanceScore(wine, archetype);
    let groupBalance = balanceScore(wine, archetype);

    // Apply sigmoid function with stricter parameters
    let k = 20;  // Even steeper curve
    let threshold = 0.85;  // Higher threshold - be very strict about excellence
    
    // Apply sigmoid to each score
    let midpointSigmoid = 1 / (1 + Math.exp(-k * (midpointScore - threshold)));
    let balanceSigmoid = 1 / (1 + Math.exp(-k * (groupBalance - threshold)));

    // Scale sigmoid outputs to full range
    midpointSigmoid = (midpointSigmoid - 1/(1 + Math.exp(k * threshold))) / 
                      (1/(1 + Math.exp(-k * (1 - threshold))) - 1/(1 + Math.exp(k * threshold)));
    balanceSigmoid = (balanceSigmoid - 1/(1 + Math.exp(k * threshold))) / 
                     (1/(1 + Math.exp(-k * (1 - threshold))) - 1/(1 + Math.exp(k * threshold)));

    // Multiply scores instead of averaging - this makes the system much stricter
    // If either score is low, the final score will be very low
    let combinedScore = midpointSigmoid * balanceSigmoid;
    
    return Math.min(100, combinedScore * 100);
}

function distanceScore(wine, archetype) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const characteristic in archetype.idealRanges) {
        const [min, max] = archetype.idealRanges[characteristic];
        const midpoint = (min + max) / 2;  // Fixed: removed 'and', replaced with '+'
        const value = wine[characteristic];
        const importance = archetype.importance[characteristic] || 1;

        let distance = Math.abs(value - midpoint) / (max - min); // Normalize distance
        let score = Math.pow(1 - Math.pow(distance, 2), importance); // Exponential decay

        totalScore += score * importance;
        totalWeight += importance;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0; // Normalize to 0-1
}

function balanceScore(wine, archetype) {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const group of archetype.balanceGroups) {
        let values = group.map(char => wine[char]).filter(v => v !== undefined);
        if (values.length < 2) continue; // Skip groups with only 1 characteristic

        let weight = group.reduce((sum, char) => sum + (archetype.importance[char] || 1), 0) / group.length;  // Fixed: added dot before reduce

        let pairwiseDistances = [];

        // Compute all pairwise distances
        for (let i = 0; i < values.length; i++) {
            for (let j = i + 1; j < values.length; j++) {
                let difference = Math.abs(values[i] - values[j]); // Absolute difference
                pairwiseDistances.push(difference);
            }
        }

        let avgDistance = pairwiseDistances.reduce((a, b) => a + b, 0) / pairwiseDistances.length;
        let score = Math.pow(1 - Math.pow(avgDistance, 2), weight); // Exponential decay

        totalScore += score * weight;
        totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0; // Normalize
}

function qualifiesForArchetype(wine, archetype) {
    for (const characteristic in archetype.idealRanges) {
        const [min, max] = archetype.idealRanges[characteristic];
        if (wine[characteristic] < min || wine[characteristic] > max) {
            return false; // Reject immediately
        }
    }
    return true;
}

export const archetypes = {
    sweetWine: {
      name: "Sweet Wine",
      idealRanges: {
        sweetness: [0.8, 1.0],  
        acidity: [0.8, 1.0],    
        tannins: [0.3, 0.7],  
        aroma: [0.3, 0.7],     
        body: [0.3, 0.7],       
        spice: [0.3, 0.7]       
      },
      importance: { 
        sweetness: 1.0, 
        acidity: 1.0,
        tannins: 0.5,
        aroma: 0.5,
        body: 0.5,
        spice: 0.5
      },
      balanceGroups: [
        ["sweetness", "acidity"],  // These must be in balance
        ["tannins", "aroma", "body", "spice"]  // These should be similar
      ]
    },
  
    boldRed: {
      name: "Bold Red",
      idealRanges: {
        sweetness: [0.0, 0.4],  
        acidity: [0.3, 0.7],    
        tannins: [0.7, 1.0],  
        aroma: [0.3, 0.7],     // Need to match with acidity
        body: [0.7, 1.0],       
        spice: [0.7, 1.0]       
      },
      importance: { 
        sweetness: 0.5, 
        acidity: 0.8,
        tannins: 1.0,
        aroma: 0.7,
        body: 1.0,
        spice: 0.7
      },
      balanceGroups: [
        ["tannins", "body", "spice"],  // These must be similar
        ["acidity", "aroma"]  // These should not be too far apart
      ]
    }
  };

