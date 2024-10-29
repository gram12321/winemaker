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
// Export the aspect ratings for use in other parts of the application
export { regionAspectRatings };

// Export the arrays to make them available for import in other scripts
export {
  italianMaleNames,
  italianFemaleNames,
  frenchFemaleNames,
  frenchMaleNames,
  spanishFemaleNames,
  spanishMaleNames,
  usFemaleNames,
  usMaleNames,
  germanFemaleNames,
  germanMaleNames,
  countryRegionMap
};
