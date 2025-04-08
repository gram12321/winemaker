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

const countryToFlagCode: Record<string, string> = {
  "Italy": "it",
  "France": "fr",
  "Spain": "es",
  "US": "us",
  "United States": "us",
  "Germany": "de",
};

export const getNationalityFlag = (nationality: string): string => {
  const countryCode = countryToFlagCode[nationality] || 'eu';
  return countryCode;
};

export function getFlagIconClass(countryName: string): string {
  const countryCode = countryToFlagCode[countryName];
  return countryCode || '';
}

export const getFallbackFlag = (): string => {
  return 'eu';
};
