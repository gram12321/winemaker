// utils.js
export function getFlagIcon(countryName) {
  const countryToFlagCode = {
    "Italy": "it",
    "France": "fr",
    "Spain": "es",
    // Add other countries as needed
  };

  const flagCode = countryToFlagCode[countryName];

  // Return the HTML for the flag icon
  return flagCode 
    ? `<span class="flag-icon flag-icon-${flagCode}" style="vertical-align: middle; margin-right: 5px;"></span>`
    : ''; // Return an empty string if no flag is found
}