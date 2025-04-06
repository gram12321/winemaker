export function calculateHarvestCharacteristics(baseCharacteristics, params) {
    const { ripeness, qualityFactor, suitability, altitude, medianAltitude, maxAltitude } = params;
    
    // Calculate altitude effect (-1 to 1 range)
    const altitudeEffect = (altitude - medianAltitude) / (maxAltitude - medianAltitude);
    
    // Deep clone and initialize base characteristics with 0.5 base value
    const harvestedCharacteristics = {};
    const characteristics = ['acidity', 'aroma', 'body', 'spice', 'sweetness', 'tannins'];
    
    characteristics.forEach(char => {
        harvestedCharacteristics[char] = 0.5 + (baseCharacteristics[char] || 0);
    });

    // Ripeness effects
    Object.entries({
        sweetness: (ripeness - 0.5) * 0.4,
        acidity: -(ripeness - 0.5) * 0.3,
        tannins: (ripeness - 0.5) * 0.2
    }).forEach(([char, mod]) => {
        harvestedCharacteristics[char] += mod;
    });

    // Quality factor effects
    Object.entries({
        body: (qualityFactor - 0.5) * 0.2,
        aroma: (qualityFactor - 0.5) * 0.3,
        tannins: (qualityFactor - 0.5) * 0.2
    }).forEach(([char, mod]) => {
        harvestedCharacteristics[char] += mod;
    });

    // Altitude effects
    Object.entries({
        acidity: altitudeEffect * 0.2,
        aroma: altitudeEffect * 0.15,
        body: -altitudeEffect * 0.1
    }).forEach(([char, mod]) => {
        harvestedCharacteristics[char] += mod;
    });

    // Region suitability effects
    Object.entries({
        body: (suitability - 0.5) * 0.2,
        aroma: (suitability - 0.5) * 0.3
    }).forEach(([char, mod]) => {
        harvestedCharacteristics[char] += mod;
    });

    // Normalize all values to 0-1 range
    Object.keys(harvestedCharacteristics).forEach(key => {
        harvestedCharacteristics[key] = Math.max(0, Math.min(1, harvestedCharacteristics[key]));
    });

    return harvestedCharacteristics;
}
