export function calculateHarvestCharacteristics(baseCharacteristics, params) {
    const { ripeness, qualityFactor, suitability, altitude, medianAltitude, maxAltitude } = params;
    
    console.log("\n=== Harvest Characteristics Calculation ===");
    console.log("Initial Parameters:");
    console.log("Ripeness:", ripeness.toFixed(3));
    console.log("Quality Factor:", qualityFactor.toFixed(3));
    console.log("Regional Suitability:", suitability.toFixed(3));
    console.log("Altitude:", altitude, "m");
    
    // Calculate altitude effect (-1 to 1 range)
    const altitudeEffect = (altitude - medianAltitude) / (maxAltitude - medianAltitude);
    console.log("Altitude Effect:", altitudeEffect.toFixed(3));
    
    // Deep clone and initialize base characteristics with 0.5 base value
    const harvestedCharacteristics = {};
    const characteristics = ['acidity', 'aroma', 'body', 'spice', 'sweetness', 'tannins'];
    
    characteristics.forEach(char => {
        harvestedCharacteristics[char] = 0.5 + (baseCharacteristics[char] || 0);
    });

    console.log("\nBase Characteristics (after 0.5 base addition):");
    Object.entries(harvestedCharacteristics).forEach(([key, value]) => {
        console.log(`${key}: ${value.toFixed(3)}`);
    });

    console.log("\nApplying Modifications:");
    
    // Log each modification step
    function logModification(characteristic, oldValue, modifier, reason) {
        const newValue = harvestedCharacteristics[characteristic];
        console.log(`${characteristic}: ${oldValue.toFixed(3)} -> ${newValue.toFixed(3)} (${modifier.toFixed(3)}) [${reason}]`);
    }

    // Ripeness effects
    Object.entries({
        sweetness: (ripeness - 0.5) * 0.4,
        acidity: -(ripeness - 0.5) * 0.3,
        tannins: (ripeness - 0.5) * 0.2
    }).forEach(([char, mod]) => {
        const oldValue = harvestedCharacteristics[char];
        harvestedCharacteristics[char] += mod;
        logModification(char, oldValue, mod, 'Ripeness');
    });

    // Quality factor effects
    Object.entries({
        body: (qualityFactor - 0.5) * 0.2,
        aroma: (qualityFactor - 0.5) * 0.3,
        tannins: (qualityFactor - 0.5) * 0.2
    }).forEach(([char, mod]) => {
        const oldValue = harvestedCharacteristics[char];
        harvestedCharacteristics[char] += mod;
        logModification(char, oldValue, mod, 'Quality');
    });

    // Altitude effects
    Object.entries({
        acidity: altitudeEffect * 0.2,
        aroma: altitudeEffect * 0.15,
        body: -altitudeEffect * 0.1
    }).forEach(([char, mod]) => {
        const oldValue = harvestedCharacteristics[char];
        harvestedCharacteristics[char] += mod;
        logModification(char, oldValue, mod, 'Altitude');
    });

    // Region suitability effects
    Object.entries({
        body: (suitability - 0.5) * 0.2,
        aroma: (suitability - 0.5) * 0.3
    }).forEach(([char, mod]) => {
        const oldValue = harvestedCharacteristics[char];
        harvestedCharacteristics[char] += mod;
        logModification(char, oldValue, mod, 'Suitability');
    });

    // Normalize all values to 0-1 range
    Object.keys(harvestedCharacteristics).forEach(key => {
        const beforeNorm = harvestedCharacteristics[key];
        harvestedCharacteristics[key] = Math.max(0, Math.min(1, harvestedCharacteristics[key]));
        console.log(`${key}: ${(baseCharacteristics[key] + 0.5).toFixed(3)} -> ${harvestedCharacteristics[key].toFixed(3)} [Normalized]`);

    });


    return harvestedCharacteristics;
}
