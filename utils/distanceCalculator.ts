// Calgary coordinates
export const CALGARY_COORDS = {
  latitude: 51.0447,
  longitude: -114.0719,
};

export interface Location {
  latitude: number;
  longitude: number;
}

export const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371; 
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
    Math.cos(toRad(point2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const calculateTotalDistance = (locations: Location[]): number => {
  if (locations.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < locations.length - 1; i++) {
    totalDistance += calculateDistance(locations[i], locations[i + 1]);
  }
  
  return Math.round(totalDistance * 10) / 10;
};