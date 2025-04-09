export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

/**
 * Formats a number using German locale settings (dot for thousands, comma for decimal).
 * Handles large numbers by abbreviating with 'Mio'.
 */
export function formatNumber(value: number, decimals = 0): string {
  if (value === null || value === undefined) return "N/A";
  // Check if value is effectively zero
  if (Math.abs(value) < 0.0005) return "0";

  const isNegative = value < 0;
  const absValue = Math.abs(value);
  let formattedValue;

  if (absValue >= 1_000_000) {
    formattedValue = `${(absValue / 1_000_000).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} Mio`;
  } else {
    formattedValue = absValue.toLocaleString('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  return isNegative ? `-${formattedValue}` : formattedValue;
}

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

/**
 * Returns a Tailwind CSS text color class based on a value (0-1).
 */
export function getColorClass(value: number): string {
  const level = Math.max(0, Math.min(9, Math.floor(value * 10)));
  const colorMap: Record<number, string> = {
    0: 'text-red-600',
    1: 'text-red-500',
    2: 'text-orange-500',
    3: 'text-amber-500',
    4: 'text-yellow-500',
    5: 'text-lime-500',
    6: 'text-lime-600',
    7: 'text-green-600',
    8: 'text-green-700',
    9: 'text-green-800',
  };
  return colorMap[level] || 'text-gray-500'; // Default to gray if level is unexpected
}
