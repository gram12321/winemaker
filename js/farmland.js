// Define the Farmland class
class Farmland {
  // Constructor to initialize the properties
  constructor(id, name, country, region, acres) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.region = region;
    this.acres = acres;
  }
}

// Export the Farmland class to make it available for import in other scripts
export { Farmland };