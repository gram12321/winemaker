// archetype constants
/**
 * @typedef {Object} RegionalRequirements
 * @property {string} [country] - Required country of origin
 * @property {string[]} [regions] - Allowed regions
 * @property {string[]} [terrainTypes] - Required terrain types
 * @property {string[]} [soilTypes] - Required soil types
 */

/**
 * @typedef {Object} CharacteristicRanges
 * @property {Object.<string, number[]>} idealRanges - Min/max for each characteristic
 * @property {Object.<string, number>} importance - Importance weight of each characteristic
 */

/**
 * @typedef {Object} ProcessingRequirements
 * @property {string[]} [allowedMethods] - List of allowed processing methods
 * @property {boolean} [requireEcological] - Whether ecological farming is required
 */

/**
 * @typedef {Object} IWineArchetype
 * @property {string} name - Name of the archetype
 * @property {string} description - Description of the wine style
 * @property {RegionalRequirements} [regionalReqs] - Region-related requirements
 * @property {ProcessingRequirements} [processingReqs] - Processing-related requirements
 * @property {CharacteristicRanges} characteristics - Characteristic ranges and importance
 * @property {string[][]} balanceGroups - Groups of characteristics that should be balanced
 */

/**
 * @typedef {Object} WineRequirements
 * @property {string[]} [requiredGrapes] - Specific required grape varieties
 * @property {string} [requiredColor] - Required grape color ('red' or 'white')
 * @property {number} [minimumQuality] - Minimum quality required (0-1)
 * @property {number} [minimumVintage] - Minimum vintage year required
 * @property {number} [minimumPrestige] - Minimum field prestige required
 * @property {[number, number]} [oxidationRange] - [min, max] allowed oxidation (0-1)
 * @property {[number, number]} [ripenessRange] - [min, max] required ripeness (0-1)
 */

export const archetypes = {


    sweetWine: {
        name: "Sweet White Wine",
        description: "Rich, sweet white wine with high acidity for balance",
        requirements: {
            requiredColor: "white",
            minimumQuality: 0.6,
            oxidationRange: [0, 0.1],
            ripenessRange: [0.7, 1.0]
        },
        characteristics: {
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
            }
        },
        balanceGroups: [
            ["sweetness", "acidity"],
            ["tannins", "aroma", "body", "spice"]
        ]
    },

    boldRed: {
        name: "Bold Red",
        description: "Full-bodied red wine with high tannins",
        requirements: {
            requiredColor: "red",
            minimumQuality: 0.7,
            minimumPrestige: 0.6
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.0, 0.4],
                acidity: [0.3, 0.7],
                tannins: [0.7, 1.0],
                aroma: [0.3, 0.7],
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
            }
        },
        balanceGroups: [
            ["tannins", "body", "spice"],
            ["acidity", "aroma"]
        ]
    },

    lightWhite: {
        name: "High Quality Light White",
        description: "Crisp, light-bodied white wine",
        requirements: {
            requiredColor: "white",
            minimumQuality: 0.8,
            oxidationRange: [0, 0.2],
            ripenessRange: [0.8, 1.0]
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.2, 0.4],
                acidity: [0.6, 0.9],
                tannins: [0.0, 0.2],
                aroma: [0.6, 0.9],
                body: [0.1, 0.3],
                spice: [0.1, 0.3]
            },
            importance: {
                sweetness: 0.7,
                acidity: 1.0,
                tannins: 0.3,
                aroma: 0.9,
                body: 0.8,
                spice: 0.4
            }
        },
        balanceGroups: [
            ["acidity", "aroma"],
            ["body", "spice"]
        ]
    },

    sparklingWine: {
        name: "Brut Sparkling Wine",
        description: "Crisp, effervescent wine with high acidity",
        requirements: {
            oxidationRange: [0, 0.15],  // Very sensitive to oxidation
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.0, 0.3
                ],
                acidity: [0.7, 1.0],
                tannins: [0.0, 0.2],
                aroma: [0.4, 0.7],
                body: [0.2, 0.4],
                spice: [0.1, 0.3]
            },
            importance: {
                sweetness: 0.8,
                acidity: 1.0,
                tannins: 0.3,
                aroma: 0.7,
                body: 0.9,
                spice: 0.4
            }
        },
        balanceGroups: [
            ["acidity", "body"],
            ["sweetness", "aroma"],
            ["tannins", "spice"]
        ]
    },

    roseWine: {
        name: "Rosé Wine",
        description: "Light, fresh wine with delicate aromatics",
        requirements: {
            requiredColor: "red",
            minimumQuality: 0.65,
            oxidationRange: [0, 0.2],
            ripenessRange: [0.7, 0.9],
            minimumPrestige: 0.4
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.3, 0.5],
                acidity: [0.5, 0.8],
                tannins: [0.2, 0.4],
                aroma: [0.6, 0.9],
                body: [0.3, 0.5],
                spice: [0.2, 0.4]
            },
            importance: {
                sweetness: 0.8,
                acidity: 0.9,
                tannins: 0.6,
                aroma: 1.0,
                body: 0.7,
                spice: 0.6
            }
        },
        balanceGroups: [
            ["sweetness", "acidity", "aroma"],
            ["tannins", "body"],
            ["spice", "body"]
        ]
    },

    classicChardonnay: {
        name: "Classic Chardonnay",
        description: "Traditional Chardonnay with balanced oak influence",
        requirements: {
            requiredGrapes: ["Chardonnay"],
            minimumQuality: 0.7,
            minimumPrestige: 0.5,
            oxidationRange: [0, 0.3],
            ripenessRange: [0.8, 1.0]
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.3, 0.5],
                acidity: [0.5, 0.7],
                tannins: [0.0, 0.2],
                aroma: [0.6, 0.9],
                body: [0.4, 0.6],
                spice: [0.2, 0.4]
            },
            importance: {
                sweetness: 0.7,
                acidity: 0.8,
                tannins: 0.3,
                aroma: 1.0,
                body: 0.8,
                spice: 0.5
            }
        },
        balanceGroups: [
            ["acidity", "sweetness"],
            ["body", "aroma"]
        ]
    },

    orangeWine: {
        name: "Old World Dry Orange Wine",
        description: "Complex skin-contact white wine with bold character",
        requirements: {
            requiredColor: "white"
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.0, 0.3],
                acidity: [0.7, 1.0],
                tannins: [0.6, 0.9],
                aroma: [0.6, 0.9],
                body: [0.5, 0.8],
                spice: [0.5, 0.8]
            },
            importance: {
                sweetness: 0.8,
                acidity: 1.0,
                tannins: 1.0,
                aroma: 0.9,
                body: 0.7,
                spice: 0.7
            }
        },
        balanceGroups: [
            ["tannins", "acidity"],
            ["spice", "body"]
        ]
    },

    americanChardonnay: {
        name: "American Oaked Chardonnay",
        description: "Rich, buttery Chardonnay with pronounced oak influence",
        requirements: {
            requiredGrapes: ["Chardonnay"],
            minimumQuality: 0.7
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.3, 0.5],
                acidity: [0.4, 0.6],
                tannins: [0.1, 0.3],
                aroma: [0.7, 1.0],
                body: [0.7, 1.0],
                spice: [0.6, 0.8]
            },
            importance: {
                sweetness: 0.6,
                acidity: 0.7,
                tannins: 0.4,
                aroma: 0.9,
                body: 1.0,
                spice: 0.8
            }
        },
        balanceGroups: [
            ["body", "spice"],
            ["aroma", "sweetness"]
        ]
    },

    vintageChampagne: {
        name: "Vintage Champagne",
        description: "Prestigious aged sparkling wine from Champagne",
        requirements: {
            requiredColor: "white",
            minimumQuality: 0.85,
            minimumPrestige: 200,
            minimumVintage: 2020 // Example: requires at least 3 years aging
        },
        regionalReqs: {
            country: "France",
            regions: ["Champagne"]
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.1, 0.3],
                acidity: [0.8, 1.0],
                tannins: [0.0, 0.2],
                aroma: [0.7, 1.0],
                body: [0.4, 0.6],
                spice: [0.2, 0.4]
            },
            importance: {
                sweetness: 0.8,
                acidity: 1.0,
                tannins: 0.3,
                aroma: 0.9,
                body: 0.7,
                spice: 0.5
            }
        },
        balanceGroups: [
            ["acidity", "sweetness"],
            ["aroma", "body"]
        ]
    },

    volcanicWhite: {
        name: "Volcanic White",
        description: "Mineral-driven white wine from volcanic soils",
        requirements: {
            requiredColor: "white",
            minimumQuality: 0.75,
            oxidationRange: [0, 0.2],
            ripenessRange: [0.8, 1.0]
        },
        regionalReqs: {
            soilTypes: ["Volcanic Soil"]
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.2, 0.4],
                acidity: [0.7, 0.9],
                tannins: [0.1, 0.3],
                aroma: [0.7, 1.0],
                body: [0.5, 0.7],
                spice: [0.4, 0.6]
            },
            importance: {
                sweetness: 0.6,
                acidity: 1.0,
                tannins: 0.4,
                aroma: 0.9,
                body: 0.7,
                spice: 0.6
            }
        },
        balanceGroups: [
            ["acidity", "aroma"],
            ["body", "spice"]
        ]
    },

    amaroneStyle: {
        name: "Amarone Style",
        description: "Powerful, rich wine in the Amarone tradition",
        requirements: {
            requiredColor: "red",
            minimumQuality: 0.8,
            minimumPrestige: 0.7,
            oxidationRange: [0.1, 0.3],
            ripenessRange: [0.9, 1.0],
            minimumVintage: 2021 // Example: requires at least 2 years aging
        },
        regionalReqs: {
            country: "Italy",
            regions: ["Veneto"]
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.3, 0.5],
                acidity: [0.5, 0.7],
                tannins: [0.7, 1.0],
                aroma: [0.7, 0.9],
                body: [0.8, 1.0],
                spice: [0.6, 0.8]
            },
            importance: {
                sweetness: 0.7,
                acidity: 0.8,
                tannins: 1.0,
                aroma: 0.9,
                body: 1.0,
                spice: 0.8
            }
        },
        balanceGroups: [
            ["tannins", "body"],
            ["sweetness", "acidity"],
            ["aroma", "spice"]
        ]
    },

    oxidatedJura: {
        name: "Oxidative Jura White",
        description: "Traditional oxidative white wine from Jura",
        requirements: {
            requiredColor: "white",
            minimumQuality: 0.7,
            oxidationRange: [0.3, 0.5],
            ripenessRange: [0.7, 0.9]
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.2, 0.4],
                acidity: [0.6, 0.8],
                tannins: [0.2, 0.4],
                aroma: [0.7, 1.0],
                body: [0.5, 0.7],
                spice: [0.4, 0.6]
            },
            importance: {
                sweetness: 0.6,
                acidity: 0.9,
                tannins: 0.5,
                aroma: 1.0,
                body: 0.8,
                spice: 0.7
            }
        },
        balanceGroups: [
            ["acidity", "aroma"],
            ["body", "spice"]
        ]
    },

    naturalWine: {
        name: "Natural Wine",
        description: "Minimal intervention wine made from organic grapes",
        requirements: {
            minimumQuality: 0.7,
            oxidationRange: [0.1, 0.4], // Natural wines often have some oxidation
            ripenessRange: [0.8, 1.0]
        },
        processingReqs: {
            allowedMethods: ["Hand Crushing", "No Crushing"],
            requireEcological: true
        },
        characteristics: {
            idealRanges: {
                sweetness: [0.2, 0.5],
                acidity: [0.6, 0.9],
                tannins: [0.3, 0.7],
                aroma: [0.7, 1.0],
                body: [0.4, 0.7],
                spice: [0.4, 0.7]
            },
            importance: {
                sweetness: 0.6,
                acidity: 0.9,
                tannins: 0.7,
                aroma: 1.0,
                body: 0.8,
                spice: 0.7
            }
        },
        balanceGroups: [
            ["acidity", "tannins"],
            ["aroma", "body", "spice"]
        ]
    }
};