export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Returns the two-letter country code for a given country name.
 * Used for flag icon CSS classes.
 * @param countryName The full name of the country (e.g., "United States", "France").
 * @returns The two-letter country code (e.g., "us", "fr") or an empty string if not found.
 */
export function getCountryCodeForFlag(countryName: string | undefined | null): string {
  if (!countryName) return ''; // Handle undefined or null input

  const countryToCodeMap: Record<string, string> = {
    "Italy": "it",
    "France": "fr",
    "Spain": "es",
    "US": "us", // Handle abbreviation
    "United States": "us",
    "Germany": "de",
    // Add other countries used in your game here
  };

  return countryToCodeMap[countryName] || ''; // Return code or empty string
}
