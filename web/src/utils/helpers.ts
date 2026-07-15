export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
