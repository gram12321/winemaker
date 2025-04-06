
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

export const getNationalityFlag = (nationality: string): string => {
  return `/assets/icon/flags/icon_${nationality.toLowerCase()}.webp`;
};

export const getFallbackFlag = (): string => {
  return `/assets/icon/flags/icon_default.webp`;
};
