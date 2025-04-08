// Staff Roles and Skills
export const STAFF_ROLES = {
  VINEYARD_MANAGER: 'VINEYARD_MANAGER',
  MASTER_WINEMAKER: 'MASTER_WINEMAKER',
  MAINTENANCE_SPECIALIST: 'MAINTENANCE_SPECIALIST',
  SALES_DIRECTOR: 'SALES_DIRECTOR',
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER'
} as const;

// Wage Constants
export const BASE_WEEKLY_WAGE = 500;
export const SKILL_WAGE_MULTIPLIER = 1000;
export const SPECIALIZATION_WAGE_BONUS = 0.2;

// Skill Levels - Updated to match old structure more closely
export const SkillLevels = {
  0.1: { name: 'Fresh Off the Vine', modifier: 0.2, costMultiplier: 1 },
  0.2: { name: 'Cork Puller', modifier: 0.3, costMultiplier: 1.5 },
  0.3: { name: 'Cellar Hand', modifier: 0.4, costMultiplier: 2 },
  0.4: { name: 'Vine Whisperer', modifier: 0.5, costMultiplier: 3 },
  0.5: { name: 'Grape Sage', modifier: 0.6, costMultiplier: 4 },
  0.6: { name: 'Vintage Virtuoso', modifier: 0.7, costMultiplier: 6 },
  0.7: { name: 'Wine Wizard', modifier: 0.8, costMultiplier: 8 },
  0.8: { name: 'Terroir Master', modifier: 0.85, costMultiplier: 12 },
  0.9: { name: 'Vineyard Virtuoso', modifier: 0.9, costMultiplier: 16 },
  1.0: { name: 'Living Legend', modifier: 0.95, costMultiplier: 25 }
};

// We might need to adjust the getSkillLevelInfo function in staffService.ts
// or create a new one in utils.ts based on this structure.

// Specialized Roles
export const SpecializedRoles = {
  [STAFF_ROLES.VINEYARD_MANAGER]: {
    id: STAFF_ROLES.VINEYARD_MANAGER,
    title: 'Vineyard Manager',
    description: 'Specializes in vineyard operations and grape cultivation',
    skillBonus: { field: 0.2 },
    defaultTaskTypes: ['planting', 'pruning', 'harvesting']
  },
  [STAFF_ROLES.MASTER_WINEMAKER]: {
    id: STAFF_ROLES.MASTER_WINEMAKER,
    title: 'Master Winemaker',
    description: 'Expert in wine production and cellar operations',
    skillBonus: { winery: 0.2 },
    defaultTaskTypes: ['crushing', 'fermenting', 'aging']
  },
  [STAFF_ROLES.MAINTENANCE_SPECIALIST]: {
    id: STAFF_ROLES.MAINTENANCE_SPECIALIST,
    title: 'Maintenance Specialist',
    description: 'Focuses on equipment maintenance and repairs',
    skillBonus: { maintenance: 0.2 },
    defaultTaskTypes: ['maintenance', 'repair']
  },
  [STAFF_ROLES.SALES_DIRECTOR]: {
    id: STAFF_ROLES.SALES_DIRECTOR,
    title: 'Sales Director',
    description: 'Manages wine sales and customer relations',
    skillBonus: { sales: 0.2 },
    defaultTaskTypes: ['sales', 'marketing']
  },
  [STAFF_ROLES.OPERATIONS_MANAGER]: {
    id: STAFF_ROLES.OPERATIONS_MANAGER,
    title: 'Operations Manager',
    description: 'Oversees administrative tasks and operations',
    skillBonus: { administration: 0.2 },
    defaultTaskTypes: ['administration', 'planning']
  }
};

// Default Teams
export const DefaultTeams = {
  VINEYARD_TEAM: {
    id: 'VINEYARD_TEAM',
    name: 'Vineyard Team',
    description: 'Handles all vineyard operations',
    preferredTaskTypes: ['planting', 'pruning', 'harvesting'],
    recommendedSpecializations: [STAFF_ROLES.VINEYARD_MANAGER]
  },
  WINERY_TEAM: {
    id: 'WINERY_TEAM',
    name: 'Winery Team',
    description: 'Manages wine production',
    preferredTaskTypes: ['crushing', 'fermenting', 'aging'],
    recommendedSpecializations: [STAFF_ROLES.MASTER_WINEMAKER]
  },
  MAINTENANCE_TEAM: {
    id: 'MAINTENANCE_TEAM',
    name: 'Maintenance Team',
    description: 'Handles repairs and upkeep',
    preferredTaskTypes: ['maintenance', 'repair'],
    recommendedSpecializations: [STAFF_ROLES.MAINTENANCE_SPECIALIST]
  },
  SALES_TEAM: {
    id: 'SALES_TEAM',
    name: 'Sales Team',
    description: 'Manages sales and customer relations',
    preferredTaskTypes: ['sales', 'marketing'],
    recommendedSpecializations: [STAFF_ROLES.SALES_DIRECTOR]
  },
  ADMIN_TEAM: {
    id: 'ADMIN_TEAM',
    name: 'Administrative Team',
    description: 'Handles administrative tasks',
    preferredTaskTypes: ['administration', 'planning'],
    recommendedSpecializations: [STAFF_ROLES.OPERATIONS_MANAGER]
  }
};

// Country to Region mapping
export const countryRegionMap = {
  "France": ["Bordeaux", "Burgundy (Bourgogne)", "Champagne", "Loire Valley", "Rhone Valley", "Jura"],
  "Germany": ["Ahr", "Mosel", "Pfalz", "Rheingau", "Rheinhessen"],
  "Italy": ["Piedmont", "Puglia", "Sicily", "Tuscany", "Veneto"],
  "Spain": ["Jumilla", "La Mancha", "Ribera del Duero", "Rioja", "Sherry (Jerez)"],
  "United States": ["Central Coast (California)", "Finger Lakes (New York)", "Napa Valley (California)", "Sonoma County (California)", "Willamette Valley (Oregon)"],
};

// Italian names
export const italianMaleNames = [
  "Alessandro", "Alessio", "Andrea", "Angelo", "Antonio",
  "Carlo", "Claudio", "Cristian", "Davide", "Diego",
  "Edoardo", "Elia", "Emanuele", "Enrico", "Fabrizio",
  "Federico", "Filippo", "Francesco", "Gabriele", "Giacomo",
  "Gianluca", "Giovanni", "Giuseppe", "Jacopo", "Leonardo",
  "Lorenzo", "Luca", "Luigi", "Marco", "Massimo",
  "Matteo", "Mattia", "Michele", "Nicolò", "Paolo",
  "Sergio", "Simone", "Stefano", "Tommaso", "Umberto",
  "Valentino", "Valerio", "Vincenzo", "Vittorio"
];

export const italianFemaleNames = [
  "Alessandra", "Alice", "Anita", "Anna", "Arianna",
  "Beatrice", "Benedetta", "Bianca", "Camilla", "Carla",
  "Carolina", "Caterina", "Chiara", "Claudia", "Cristina",
  "Daniela", "Eleonora", "Elisa", "Elisabetta", "Emma",
  "Federica", "Fiorella", "Francesca", "Gaia", "Giada",
  "Ginevra", "Giorgia", "Giulia", "Ilaria", "Isabella",
  "Lara", "Laura", "Letizia", "Lucia", "Lucrezia",
  "Maddalena", "Maria", "Martina", "Melissa", "Michela",
  "Nadia", "Noemi", "Paola", "Rachele", "Roberta"
];

// French names
export const frenchMaleNames = [
  "Thomas", "Hugo", "Arthur", "Lucas", "Jules",
  "Gabriel", "Théo", "Léon", "Valentin", "Pierre",
  "Quentin", "Clément", "Maxime", "Alexandre", "Antoine",
  "Enzo", "Nathan", "Paul", "Adrien", "Victor",
  "Benjamin", "Simon", "Raphaël", "Mathis", "Nicolas",
  "Axel", "Baptiste", "Samuel", "Émile", "Tristan",
  "Florian", "Damien", "Romain", "Sébastien", "Loïc",
  "Kevin", "Corentin", "Jean", "Julien", "Ludovic"
];

export const frenchFemaleNames = [
  "Camille", "Léa", "Manon", "Inès", "Chloé",
  "Emma", "Jade", "Louise", "Alice", "Clara",
  "Julie", "Margaux", "Anaïs", "Mathilde", "Pauline",
  "Marion", "Adèle", "Jeanne", "Maëlys", "Emilie",
  "Océane", "Zoé", "Louna", "Lucie", "Elsa",
  "Victoire", "Maëva", "Juliette", "Nina", "Amélie",
  "Noémie", "Morgane", "Romane", "Lilou", "Mélanie",
  "Lola", "Alix", "Amandine", "Aline", "Céline"
];

// Spanish names
export const spanishMaleNames = [
  "José", "Antonio", "Juan", "Francisco", "Javier",
  "Carlos", "Daniel", "Miguel", "Jesús", "Alejandro",
  "Manuel", "Rafael", "Luis", "Fernando", "Sergio",
  "Pablo", "Andrés", "José Luis", "Alberto", "Ramón",
  "Jorge", "Enrique", "Vicente", "Pedro", "Ángel",
  "Mario", "Rubén", "Juan Carlos", "Ignacio", "Eduardo",
  "Cristian", "Joaquín", "Iván", "Marcos", "Adrián",
  "Raúl", "Álvaro", "Víctor", "Óscar", "Julián"
];

export const spanishFemaleNames = [
  "María", "Carmen", "Ana", "Laura", "Marta",
  "Sara", "Paula", "Isabel", "Cristina", "Patricia",
  "Sandra", "Raquel", "Pilar", "Rosa", "Elena",
  "Silvia", "Sonia", "Beatriz", "Alicia", "Carolina",
  "Noelia", "Nuria", "Alba", "Julia", "Teresa",
  "Adriana", "Daniela", "Eva", "Irene", "Mar",
  "Lola", "Nerea", "Angela", "Victoria", "Gloria",
  "Marina", "Aurora", "Miriam", "Mercedes", "Yolanda"
];

// US names
export const usMaleNames = [
  "Liam", "Noah", "Oliver", "Elijah", "James",
  "William", "Benjamin", "Lucas", "Henry", "Alexander",
  "Mason", "Michael", "Ethan", "Jacob", "Logan",
  "Jackson", "Levi", "Wyatt", "Sebastian", "Caleb",
  "Dylan", "Matthew", "Luke", "Ryan", "Owen",
  "Nathan", "Cooper", "Lincoln", "Connor", "Grayson",
  "Hunter", "Hudson", "Robert", "Charles", "Eli",
  "Dominic", "Austin", "Carson", "Brody", "Jonathan"
];

export const usFemaleNames = [
  "Olivia", "Ava", "Isabella", "Mia", "Harper",
  "Evelyn", "Abigail", "Ella", "Scarlett", "Grace",
  "Penelope", "Riley", "Layla", "Nora", "Hazel",
  "Violet", "Aurora", "Savannah", "Audrey", "Addison",
  "Lucy", "Stella", "Natalie", "Samantha", "Leah",
  "Hannah", "Maya", "Eleanor", "Madison", "Chloe",
  "Aria", "Brooklyn", "Bella", "Paisley", "Genesis",
  "Aaliyah", "Kennedy", "Piper", "Naomi", "Peyton"
];

// German names
export const germanMaleNames = [
  "Maximilian", "Elias", "Paul", "Leon", "Jonas",
  "Tim", "Lukas", "Erik", "Julian", "Alexander",
  "Jan", "Fabian", "Florian", "Benjamin", "Niklas",
  "Moritz", "David", "Philipp", "Jakob", "Marco",
  "Timo", "Tobias", "Simon", "Marcel", "Andreas",
  "Stefan", "Ralf", "Heinz", "Dieter", "Fritz",
  "Karl", "Uwe", "Bastian", "Lars", "Holger",
  "Thorsten", "Klaus", "Horst", "Wolfgang", "Erwin"
];

export const germanFemaleNames = [
  "Anna", "Lena", "Marie", "Laura", "Katharina",
  "Johanna", "Lisa", "Sophie", "Julia", "Alina",
  "Lea", "Clara", "Amelie", "Mia", "Emma",
  "Lara", "Leonie", "Sarah", "Hanna", "Luisa",
  "Emilia", "Mila", "Charlotte", "Paula", "Isabel",
  "Melina", "Theresa", "Annika", "Eva", "Anja",
  "Carina", "Franziska", "Jasmin", "Tanja", "Stefanie",
  "Sandra", "Daniela", "Nina", "Maren", "Anneliese"
];

// Last names by country
export const lastNamesByCountry = {
  "Italy": [
    "Rossi", "Bianchi", "Romano", "Colombo", "Ricci",
    "Conti", "Greco", "Gallo", "Ferrara", "Rizzo",
    "Caruso", "Moretti", "Lombardi", "Esposito", "Marchetti",
    "Gentile", "Barbieri", "Benedetti", "Leone", "De Luca",
    "Mancini", "Costa", "Monti", "Fontana", "De Santis"
  ],
  "Germany": [
    "Müller", "Schmidt", "Schneider", "Fischer", "Weber",
    "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
    "Schäfer", "Koch", "Bauer", "Richter", "Klein",
    "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann",
    "Braun", "Krüger", "Hofmann", "Lange", "Weiß"
  ],
  "France": [
    "Martin", "Bernard", "Dubois", "Thomas", "Robert",
    "Richard", "Petit", "Durand", "Leroy", "Moreau",
    "Simon", "Laurent", "Lefèvre", "Michel", "Garcia",
    "David", "Bertrand", "Roux", "Vincent", "Fontaine",
    "Rousseau", "Blanchard", "Dumont", "Fournier", "Girard"
  ],
  "Spain": [
    "García", "Martínez", "Rodríguez", "Fernández", "López",
    "González", "Pérez", "Sánchez", "Ramírez", "Torres",
    "Castro", "Ramos", "Delgado", "Morales", "Ortiz",
    "Reyes", "Herrera", "Muñoz", "Navarro", "Domínguez",
    "Gil", "Serrano", "Vázquez", "Blanco", "Molina"
  ],
  "United States": [
    "Smith", "Johnson", "Williams", "Jones", "Brown",
    "Davis", "Miller", "Wilson", "Moore", "Taylor",
    "Anderson", "Thomas", "Jackson", "White", "Harris",
    "Martin", "Thompson", "Garcia", "Martinez", "Robinson",
    "Clark", "Rodriguez", "Lewis", "Lee", "Walker"
  ]
};
