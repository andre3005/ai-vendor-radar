import type { Jurisdiction } from './types'

export interface CityPreset { city: string; country: string; jurisdiction: Jurisdiction; lat: number; lng: number }

export const CITY_PRESETS: CityPreset[] = [
  { city: 'Ashburn', country: 'United States', jurisdiction: 'US', lat: 39.04372, lng: -77.48749 },
  { city: 'Portland', country: 'United States', jurisdiction: 'US', lat: 45.5152, lng: -122.67839 },
  { city: 'Dallas', country: 'United States', jurisdiction: 'US', lat: 32.77666, lng: -96.79699 },
  { city: 'San Jose', country: 'United States', jurisdiction: 'US', lat: 37.33874, lng: -121.88633 },
  { city: 'Montréal', country: 'Canada', jurisdiction: 'CA', lat: 45.50169, lng: -73.56726 },
  { city: 'Toronto', country: 'Canada', jurisdiction: 'CA', lat: 43.65107, lng: -79.34702 },
  { city: 'Calgary', country: 'Canada', jurisdiction: 'CA', lat: 51.04473, lng: -114.07188 },
  { city: 'Dublin', country: 'Ireland', jurisdiction: 'EU', lat: 53.34981, lng: -6.26031 },
  { city: 'Frankfurt', country: 'Germany', jurisdiction: 'EU', lat: 50.11092, lng: 8.68213 },
  { city: 'Paris', country: 'France', jurisdiction: 'EU', lat: 48.85661, lng: 2.35222 },
  { city: 'Amsterdam', country: 'Netherlands', jurisdiction: 'EU', lat: 52.37022, lng: 4.89517 },
  { city: 'Stockholm', country: 'Sweden', jurisdiction: 'EU', lat: 59.32932, lng: 18.06858 },
  { city: 'Madrid', country: 'Spain', jurisdiction: 'EU', lat: 40.41678, lng: -3.70379 },
  { city: 'Oslo', country: 'Norway', jurisdiction: 'EU', lat: 59.91387, lng: 10.75225 },
  { city: 'London', country: 'United Kingdom', jurisdiction: 'UK', lat: 51.50735, lng: -0.12776 },
  { city: 'Singapore', country: 'Singapore', jurisdiction: 'SG', lat: 1.35208, lng: 103.81984 },
  { city: 'Tokyo', country: 'Japan', jurisdiction: 'JP', lat: 35.6762, lng: 139.65031 },
  { city: 'Osaka', country: 'Japan', jurisdiction: 'JP', lat: 34.69374, lng: 135.50218 },
  { city: 'Shenzhen', country: 'China', jurisdiction: 'CN', lat: 22.5431, lng: 114.05787 },
  { city: 'Hangzhou', country: 'China', jurisdiction: 'CN', lat: 30.27408, lng: 120.15507 },
  { city: 'Beijing', country: 'China', jurisdiction: 'CN', lat: 39.9042, lng: 116.40739 },
  { city: 'Sydney', country: 'Australia', jurisdiction: 'OTHER', lat: -33.86882, lng: 151.20929 },
  { city: 'São Paulo', country: 'Brazil', jurisdiction: 'OTHER', lat: -23.55052, lng: -46.63331 },
  { city: 'Mumbai', country: 'India', jurisdiction: 'OTHER', lat: 19.07598, lng: 72.87766 },
  { city: 'Dubai', country: 'United Arab Emirates', jurisdiction: 'OTHER', lat: 25.2048, lng: 55.27078 },
]
