// names.js

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

// Country to Region mapping
const countryRegionMap = {
  "Italy": ["Piedmont", "Tuscany", "Veneto", "Sicily", "Puglia"],
  "France": ["Bordeaux", "Burgundy (Bourgogne)", "Champagne", "Loire Valley", "Rhone Valley"],
  "Spain": ["Rioja", "Ribera del Duero", "Jumilla", "La Mancha", "Sherry (Jerez)"],
  "United States": ["Napa Valley (California)", "Sonoma County (California)", "Willamette Valley (Oregon)", "Finger Lakes (New York)", "Central Coast (California)"],
  "Germany": ["Mosel", "Rheingau", "Rheinhessen", "Pfalz", "Ahr"],
};

// Export the arrays and the map to make them available for import in other scripts
export { italianMaleNames, italianFemaleNames, countryRegionMap };