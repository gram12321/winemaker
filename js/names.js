// names.js

// Country to Region mapping
const countryRegionMap = {
  "Italy": ["Piedmont", "Tuscany", "Veneto", "Sicily", "Puglia"],
  "France": ["Bordeaux", "Burgundy (Bourgogne)", "Champagne", "Loire Valley", "Rhone Valley"],
  "Spain": ["Rioja", "Ribera del Duero", "Jumilla", "La Mancha", "Sherry (Jerez)"],
  "United States": ["Napa Valley (California)", "Sonoma County (California)", "Willamette Valley (Oregon)", "Finger Lakes (New York)", "Central Coast (California)"],
  "Germany": ["Mosel", "Rheingau", "Rheinhessen", "Pfalz", "Ahr"],
};

// Array of Italian male names
const italianMaleNames = [
  "Alessandro", "Andrea", "Antonio", "Carlo", "Claudio",
  "Davide", "Diego", "Edoardo", "Enrico", "Fabrizio",
  "Federico", "Filippo", "Francesco", "Gabriele", "Giacomo",
  "Gianluca", "Giovanni", "Giuseppe", "Jacopo", "Leonardo",
  "Lorenzo", "Luca", "Luigi", "Marco", "Matteo",
  "Mattia", "Michele", "Nicolò", "Paolo", "Pietro",
  "Riccardo", "Rocco", "Salvatore", "Samuele", "Sandro",
  "Sergio", "Simone", "Stefano", "Tommaso", "Umberto",
  "Valentino", "Valerio", "Vittorio", "Vincenzo", "Alessio",
  "Angelo", "Cristian", "Elia", "Emanuele", "Massimo"
];

// Array of Italian female names
const italianFemaleNames = [
  "Alessandra", "Alice", "Anita", "Anna", "Arianna",
  "Beatrice", "Benedetta", "Bianca", "Camilla", "Carla",
  "Carolina", "Caterina", "Chiara", "Claudia", "Cristina",
  "Daniela", "Eleonora", "Elisa", "Elisabetta", "Emma",
  "Federica", "Fiorella", "Francesca", "Gaia", "Giada",
  "Ginevra", "Giorgia", "Giulia", "Ilaria", "Isabella",
  "Lara", "Laura", "Letizia", "Lucia", "Lucrezia",
  "Maddalena", "Maria", "Martina", "Melissa", "Michela",
  "Nadia", "Noemi", "Paola", "Rachele", "Roberta",
  "Sara", "Silvia", "Sofia", "Valentina", "Vanessa"
];

// French names
const frenchFemaleNames = [
  "Camille", "Léa", "Manon", "Inès", "Chloé", "Emma", "Jade", "Louise", "Alice",
  "Clara", "Julie", "Margaux", "Anaïs", "Mathilde", "Pauline", "Marion", "Adèle", 
  "Jeanne", "Maëlys", "Emilie", "Océane", "Zoé", "Louna", "Lucie", "Elsa", 
  "Victoire", "Maëva", "Juliette", "Nina", "Amélie", "Noémie", "Morgane", 
  "Romane", "Lilou", "Mélanie", "Lola", "Alix", "Amandine", "Aline", "Céline", 
  "Nathalie", "Aurélie", "Sandrine", "Marine", "Gaëlle", "Aurore", "Elodie", 
  "Véronique", "Laetitia", "Sabrina", "Mireille"
];
const frenchMaleNames = [
  "Thomas", "Hugo", "Arthur", "Lucas", "Jules", "Gabriel", "Théo", "Léon", 
  "Valentin", "Pierre", "Quentin", "Clément", "Maxime", "Alexandre", "Antoine",
  "Enzo", "Nathan", "Paul", "Adrien", "Victor", "Benjamin", "Simon", 
  "Raphaël", "Mathis", "Nicolas", "Axel", "Baptiste", "Samuel", "Émile", 
  "Tristan", "Florian", "Damien", "Romain", "Sébastien", "Loïc", "Kevin", 
  "Corentin", "Jean", "Julien", "Ludovic", "Jérémy", "Martin", "Gaël", 
  "Fabien", "Olivier", "Étienne", "Didier", "Gérard", "Laurent", "François", 
  "Olivier", "Pascal"
];
// Spanish names
const spanishFemaleNames = [
  "María", "Carmen", "Ana", "Laura", "Marta", "Sara", "Paula", "Isabel", 
  "Cristina", "Patricia", "Sandra", "Raquel", "Pilar", "Rosa", "Elena", 
  "Silvia", "Sonia", "Beatriz", "Alicia", "Carolina", "Noelia", "Nuria", 
  "Alba", "Julia", "Teresa", "Adriana", "Daniela", "Eva", "Irene", "Mar", 
  "Lola", "Nerea", "Angela", "Victoria", "Gloria", "Marina", "Aurora", 
  "Miriam", "Mercedes", "Yolanda", "Rocío", "Leticia", "Manuela", "Valeria", 
  "Aitana", "Vega", "Estefanía", "Andrea", "Lourdes", "Alejandra", "Macarena"
];
const spanishMaleNames = [
  "José", "Antonio", "Juan", "Francisco", "Javier", "Carlos", "Daniel", 
  "Miguel", "Jesús", "Alejandro", "Manuel", "Rafael", "Luis", "Fernando", 
  "Sergio", "Pablo", "Andrés", "José Luis", "Alberto", "Ramón", "Jorge", 
  "Enrique", "Vicente", "Pedro", "Ángel", "Mario", "Rubén", "Juan Carlos", 
  "Ignacio", "Eduardo", "Cristian", "Joaquín", "Iván", "Marcos", "Adrián", 
  "Raúl", "Álvaro", "Víctor", "Óscar", "Julián", "Gabriel", "Gonzalo", "Jaime", 
  "Ismael", "Aitor", "Santiago", "César", "Emilio", "Fidel", "Matías"
];
// US names
const usFemaleNames = [
  "Olivia", "Ava", "Isabella", "Mia", "Harper", "Evelyn", "Abigail", "Ella", 
  "Scarlett", "Grace", "Penelope", "Riley", "Layla", "Nora", "Hazel", 
  "Violet", "Aurora", "Savannah", "Audrey", "Addison", "Lucy", "Stella", 
  "Natalie", "Samantha", "Leah", "Hannah", "Maya", "Eleanor", "Madison", 
  "Chloe", "Aria", "Brooklyn", "Bella", "Paisley", "Genesis", "Aaliyah", 
  "Kennedy", "Piper", "Naomi", "Peyton", "Sadie", "Ariana", "Lillian", "Zoe", 
  "Rylee", "Aubrey", "Delilah", "Sophie", "Ellie", "Claire", "Skylar"
];
const usMaleNames = [
  "Liam", "Noah", "Oliver", "Elijah", "James", "William", "Benjamin", 
  "Lucas", "Henry", "Alexander", "Mason", "Michael", "Ethan", "Jacob", 
  "Logan", "Jackson", "Levi", "Wyatt", "Sebastian", "Caleb", "Dylan", 
  "Matthew", "Luke", "Ryan", "Owen", "Nathan", "Cooper", "Lincoln", "Connor", 
  "Grayson", "Hunter", "Hudson", "Robert", "Charles", "Eli", "Dominic", 
  "Austin", "Carson", "Brody", "Jonathan", "Colton", "Parker", "Easton", 
  "Jason", "Adrian", "Miles", "Leo", "Brayden", "Tyler", "Weston"
];
// German names
const germanFemaleNames = [
  "Anna", "Lena", "Marie", "Laura", "Katharina", "Johanna", "Lisa", "Sophie", 
  "Julia", "Alina", "Lea", "Clara", "Amelie", "Mia", "Emma", "Lara", 
  "Leonie", "Sarah", "Hanna", "Luisa", "Emilia", "Mila", "Charlotte", 
  "Paula", "Isabel", "Melina", "Theresa", "Annika", "Eva", "Anja", "Carina", 
  "Franziska", "Jasmin", "Tanja", "Stefanie", "Sandra", "Daniela", "Nina", 
  "Maren", "Anneliese", "Greta", "Viktoria", "Heidi", "Angelika", "Martina", 
  "Elke", "Helga", "Dagmar", "Susanne", "Brigitte", "Karin"
];
const germanMaleNames = [
  "Maximilian", "Elias", "Paul", "Leon", "Jonas", "Tim", "Lukas", "Erik", 
  "Julian", "Alexander", "Jan", "Fabian", "Florian", "Benjamin", "Niklas", 
  "Moritz", "David", "Philipp", "Jakob", "Marco", "Timo", "Tobias", "Simon", 
  "Marcel", "Andreas", "Stefan", "Ralf", "Heinz", "Dieter", "Fritz", "Karl", 
  "Uwe", "Bastian", "Lars", "Holger", "Thorsten", "Klaus", "Horst", 
  "Wolfgang", "Erwin", "Jürgen", "Reinhard", "Ulf", "Gerd", "Manfred", "Dirk", 
  "Rainer", "Matthias", "Kurt", "Axel", "Werner"
];

// Aspect ratings for each region
const regionAspectRatings = {
  "Italy": {
    "Piedmont": {
      "North": 0.25, "Northeast": 0.45, "East": 0.65, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.80, "West": 0.60, "Northwest": 0.40
    },
    "Tuscany": {
      "North": 0.30, "Northeast": 0.55, "East": 0.75, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.85, "West": 0.70, "Northwest": 0.50
    },
    "Veneto": {
      "North": 0.20, "Northeast": 0.40, "East": 0.60, "Southeast": 0.95, "South": 1.00,
      "Southwest": 0.85, "West": 0.65, "Northwest": 0.35
    },
    "Sicily": {
      "North": 0.45, "Northeast": 0.65, "East": 0.85, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.80, "West": 0.70, "Northwest": 0.55
    },
    "Puglia": {
      "North": 0.50, "Northeast": 0.65, "East": 0.85, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.85, "West": 0.75, "Northwest": 0.55
    },
  },
  
  "France": {
    "Bordeaux": {
      "North": 0.30, "Northeast": 0.40, "East": 0.60, "Southeast": 0.85, "South": 1.00,
      "Southwest": 0.95, "West": 0.80, "Northwest": 0.50
    },
    "Burgundy (Bourgogne)": {
      "North": 0.25, "Northeast": 0.45, "East": 0.65, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.80, "West": 0.55, "Northwest": 0.40
    },
    "Champagne": {
      "North": 0.20, "Northeast": 0.35, "East": 0.55, "Southeast": 0.90, "South": 1.00,
      "Southwest": 0.80, "West": 0.60, "Northwest": 0.35
    },
    "Loire Valley": {
      "North": 0.30, "Northeast": 0.50, "East": 0.65, "Southeast": 0.85, "South": 1.00,
      "Southwest": 0.90, "West": 0.75, "Northwest": 0.45
    },
    "Rhone Valley": {
      "North": 0.25, "Northeast": 0.50, "East": 0.70, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.85, "West": 0.65, "Northwest": 0.40
    },
  },
  "Spain": {
    "Rioja": {
      "North": 0.40, "Northeast": 0.55, "East": 0.75, "Southeast": 0.85, "South": 1.00,
      "Southwest": 0.90, "West": 0.80, "Northwest": 0.60
    },
    "Ribera del Duero": {
      "North": 0.35, "Northeast": 0.60, "East": 0.80, "Southeast": 0.90, "South": 1.00,
      "Southwest": 0.85, "West": 0.70, "Northwest": 0.55
    },
    "Jumilla": {
      "North": 0.50, "Northeast": 0.65, "East": 0.85, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.80, "West": 0.70, "Northwest": 0.60
    },
    "La Mancha": {
      "North": 0.45, "Northeast": 0.60, "East": 0.85, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.80, "West": 0.75, "Northwest": 0.50
    },
    "Sherry (Jerez)": {
      "North": 0.50, "Northeast": 0.70, "East": 0.85, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.85, "West": 0.80, "Northwest": 0.60
    },
  },
  "United States": {
    "Napa Valley (California)": {
      "North": 0.40, "Northeast": 0.65, "East": 0.85, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.85, "West": 0.75, "Northwest": 0.60
    },
    "Sonoma County (California)": {
      "North": 0.35, "Northeast": 0.60, "East": 0.80, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.85, "West": 0.75, "Northwest": 0.55
    },
    "Willamette Valley (Oregon)": {
      "North": 0.20, "Northeast": 0.45, "East": 0.70, "Southeast": 0.85, "South": 1.00,
      "Southwest": 0.90, "West": 0.65, "Northwest": 0.35
    },
    "Finger Lakes (New York)": {
      "North": 0.25, "Northeast": 0.50, "East": 0.70, "Southeast": 0.85, "South": 1.00,
      "Southwest": 0.85, "West": 0.75, "Northwest": 0.45
    },
    "Central Coast (California)": {
      "North": 0.35, "Northeast": 0.60, "East": 0.80, "Southeast": 1.00, "South": 0.90,
      "Southwest": 0.85, "West": 0.70, "Northwest": 0.50
    },
  },
  "Germany": {
    "Mosel": {
      "North": 0.15, "Northeast": 0.35, "East": 0.65, "Southeast": 0.95, "South": 1.00,
      "Southwest": 0.85, "West": 0.60, "Northwest": 0.30
    },
    "Rheingau": {
      "North": 0.20, "Northeast": 0.50, "East": 0.70, "Southeast": 0.90, "South": 1.00,
      "Southwest": 0.85, "West": 0.75, "Northwest": 0.40
    },
    "Rheinhessen": {
      "North": 0.25, "Northeast": 0.60, "East": 0.80, "Southeast": 0.90, "South": 1.00,
      "Southwest": 0.85, "West": 0.70, "Northwest": 0.50
    },
    "Pfalz": {
      "North": 0.30, "Northeast": 0.65, "East": 0.80, "Southeast": 0.90, "South": 1.00,
      "Southwest": 0.85, "West": 0.70, "Northwest": 0.50
    },
    "Ahr": {
      "North": 0.10, "Northeast": 0.40, "East": 0.65, "Southeast": 0.85, "South": 1.00,
      "Southwest": 0.80, "West": 0.65, "Northwest": 0.35
    },
  },
};

// names.js

const regionSoilTypes = {
  "Italy": {
    "Piedmont": ["Marl", "Clay", "Limestone", "Sandstone", "Silt"],
    "Tuscany": ["Marl", "Clay", "Limestone", "Sand", "Gravel"],
    "Veneto": ["Volcanic Soil", "Clay", "Limestone", "Alluvial Soil", "Gravel"],
    "Sicily": ["Volcanic Soil", "Clay", "Limestone", "Sand", "Alluvial Soil"],
    "Puglia": ["Limestone", "Clay", "Sand", "Silt", "Alluvial Soil"]
  },
  "France": {
    "Bordeaux": ["Gravel", "Limestone", "Clay", "Sand", "Silt"],
    "Burgundy (Bourgogne)": ["Limestone", "Marl", "Clay", "Gravel", "Silt"],
    "Champagne": ["Chalk", "Limestone", "Marl", "Clay", "Sand"],
    "Loire Valley": ["Limestone", "Clay", "Flint", "Gravel", "Alluvial Soil"],
    "Rhone Valley": ["Granite", "Clay", "Pebbles", "Sand", "Schist"]
  },
  "Spain": {
    "Rioja": ["Clay", "Limestone", "Alluvial Soil", "Sand", "Marl"],
    "Ribera del Duero": ["Clay", "Limestone", "Alluvial Soil", "Sand", "Chalk"],
    "Jumilla": ["Limestone", "Clay", "Sand", "Rocky Soil", "Alluvial Soil"],
    "La Mancha": ["Limestone", "Clay", "Sand", "Gravel", "Alluvial Soil"],
    "Sherry (Jerez)": ["Chalk", "Clay", "Sand", "Limestone", "Marl"]
  },
  "United States": {
    "Napa Valley (California)": ["Volcanic Soil", "Alluvial Soil", "Gravel", "Clay", "Sand"],
    "Sonoma County (California)": ["Sandstone", "Volcanic Soil", "Sandy Loam", "Clay", "Gravel"],
    "Willamette Valley (Oregon)": ["Volcanic Soil", "Marine Sedimentary Soil", "Loess", "Clay", "Alluvial Soil"],
    "Finger Lakes (New York)": ["Glacial Soil", "Shale", "Gravel", "Silt", "Clay"],
    "Central Coast (California)": ["Limestone", "Clay", "Sand", "Shale", "Alluvial Soil"]
  },
  "Germany": {
    "Mosel": ["Slate", "Quartzite", "Loess", "Limestone", "Clay"],
    "Rheingau": ["Slate", "Loess", "Clay", "Quartzite", "Gravel"],
    "Rheinhessen": ["Loess", "Limestone", "Clay", "Sand", "Marl"],
    "Pfalz": ["Limestone", "Loess", "Clay", "Sandstone", "Gravel"],
    "Ahr": ["Slate", "Loess", "Gravel", "Volcanic Soil", "Clay"]
  },
};

// names.js

const regionAltitudeRanges = {
  "Italy": {
    "Piedmont": [150, 600],
    "Tuscany": [100, 500],
    "Veneto": [50, 500],
    "Sicily": [200, 1000],
    "Puglia": [50, 400]
  },
  "France": {
    "Bordeaux": [5, 150],
    "Burgundy (Bourgogne)": [200, 500],
    "Champagne": [70, 300],
    "Loire Valley": [10, 300],
    "Rhone Valley": [100, 400]
  },
  "Spain": {
    "Rioja": [300, 700],
    "Ribera del Duero": [700, 1000],
    "Jumilla": [400, 800],
    "La Mancha": [500, 700],
    "Sherry (Jerez)": [0, 100]
  },
  "United States": {
    "Napa Valley (California)": [5, 800],
    "Sonoma County (California)": [10, 700],
    "Willamette Valley (Oregon)": [30, 300],
    "Finger Lakes (New York)": [150, 300],
    "Central Coast (California)": [5, 600]
  },
  "Germany": {
    "Mosel": [100, 400],
    "Rheingau": [80, 300],
    "Rheinhessen": [100, 250],
    "Pfalz": [100, 500],
    "Ahr": [100, 300]
  },
};

// Function to normalize an altitude
export function normalizeAltitude(altitude, [minAltitude, maxAltitude]) {
  return 0.3 + ((altitude - minAltitude) / (maxAltitude - minAltitude)) * (0.7 - 0.3);
}

// Calculate and normalize price factor with real price range integration
export function calculateAndNormalizePriceFactor(country, region, altitude, aspect) {
  const altitudeRange = regionAltitudeRanges[country][region];
  const altitudeNormalized = normalizeAltitude(altitude, altitudeRange);

  const prestigeKey = `${region}, ${country}`;
  const prestigeNormalized = regionPrestigeRankings[prestigeKey];

  const aspectNormalized = regionAspectRatings[country][region][aspect];

  // Calculate raw price factor by multiplying normalized values
  const rawPriceFactor = (prestigeNormalized + aspectNormalized + altitudeNormalized) / 3;

  // Integrate real price range
  const realPriceRange = regionRealPriceRanges[prestigeKey];
 
  // Not in use. Use lower price range directly. And max value only for refference 
    //const realPriceFactor = (realPriceRange[0] + realPriceRange[1]) / 2; // Average or other measure

  // Apply the real price factor (Multiply by 1000 to get € and by 0.4)
  const finalPriceFactor = ( rawPriceFactor +1 ) * realPriceRange[0] ;

  return finalPriceFactor;
}

// Real price range for each region
const regionRealPriceRanges = {
  "Burgundy (Bourgogne), France": [1000000, 10000000],
  "Champagne, France": [500000, 2000000],
  "Napa Valley (California), United States": [300000, 1000000],
  "Bordeaux, France": [100000, 2000000],
  "Tuscany, Italy": [80000, 1000000],
  "Piedmont, Italy": [50000, 700000],
  "Sonoma County (California), United States": [100000, 500000],
  "Rheingau, Germany": [50000, 200000],
  "Mosel, Germany": [30000, 150000],
  "Rioja, Spain": [30000, 100000],
  "Willamette Valley (Oregon), United States": [50000, 250000],
  "Ribera del Duero, Spain": [30000, 80000],
  "Central Coast (California), United States": [20000, 150000],
  "Loire Valley, France": [20000, 80000],
  "Rhone Valley, France": [30000, 120000],
  "Pfalz, Germany": [15000, 60000],
  "Veneto, Italy": [20000, 100000],
  "Sherry (Jerez), Spain": [10000, 40000],
  "Finger Lakes (New York), United States": [10000, 50000],
  "Sicily, Italy": [10000, 60000],
  "La Mancha, Spain": [5000, 30000],
  "Ahr, Germany": [20000, 50000],
  "Jumilla, Spain": [5000, 25000],
  "Rheinhessen, Germany": [10000, 40000],
  "Puglia, Italy": [5000, 30000],

};

const regionPrestigeRankings = {
  "Burgundy (Bourgogne), France": 1.00,
  "Champagne, France": 0.98,
  "Napa Valley (California), United States": 0.90,
  "Bordeaux, France": 0.87,
  "Tuscany, Italy": 0.83,
  "Piedmont, Italy": 0.80,
  "Sonoma County (California), United States": 0.76,
  "Rheingau, Germany": 0.73,
  "Mosel, Germany": 0.72,
  "Rioja, Spain": 0.70,
  "Willamette Valley (Oregon), United States": 0.67,
  "Ribera del Duero, Spain": 0.65,
  "Central Coast (California), United States": 0.63,
  "Loire Valley, France": 0.61,
  "Rhone Valley, France": 0.60,
  "Pfalz, Germany": 0.57,
  "Veneto, Italy": 0.55,
  "Sherry (Jerez), Spain": 0.51,
  "Finger Lakes (New York), United States": 0.48,
  "Sicily, Italy": 0.46,
  "La Mancha, Spain": 0.42,
  "Ahr, Germany": 0.41,
  "Jumilla, Spain": 0.39,
  "Rheinhessen, Germany": 0.37,
  "Puglia, Italy": 0.35
};

// Export the altitude ranges for use in other parts of the application 
export { regionAltitudeRanges, regionPrestigeRankings, regionSoilTypes, regionAspectRatings,italianMaleNames, italianFemaleNames, frenchFemaleNames, frenchMaleNames, spanishFemaleNames, spanishMaleNames, usFemaleNames, usMaleNames, germanFemaleNames, germanMaleNames, countryRegionMap };