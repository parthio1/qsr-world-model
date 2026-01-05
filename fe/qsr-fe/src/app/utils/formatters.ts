import { WeatherType } from '../types';

export function getWeatherIconName(weatherType: WeatherType): string {
  switch (weatherType) {
    case 'sunny':
      return 'Sun';
    case 'cloudy':
      return 'Cloud';
    case 'rainy':
      return 'CloudRain';
    case 'stormy':
      return 'CloudLightning';
    default:
      return 'Sun';
  }
}

export function getDayOfWeek(date: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}