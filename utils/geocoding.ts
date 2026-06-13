import { Location } from './distanceCalculator';

const PROXY_URL = 'https://maps-proxy-theta.vercel.app/api';
const GOOGLE_MAPS_API_KEY = "AIzaSyBTdGGyYt-lFEBh41fIJGv75auClAaPL5g";
const ROUTE_DISTANCE_OFFSET_KM = 2;

export interface PlacePrediction {
  description: string;
  place_id: string;
}

const fetchDirectionsData = async (
  origin: Location,
  destination: Location,
  waypoints?: Location[]
): Promise<any | null> => {
  if (!origin || !destination) return null;

  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;
  const waypointStr = waypoints && waypoints.length > 0
    ? waypoints.map(w => `${w.latitude},${w.longitude}`).join('|')
    : '';

  try {
    let proxyUrl = `${PROXY_URL}/directions?origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}`;
    if (waypointStr) {
      proxyUrl += `&waypoints=${encodeURIComponent(waypointStr)}`;
    }

    const proxyResponse = await fetch(proxyUrl);
    const proxyData = await proxyResponse.json();

    if (proxyData?.status === 'OK' && Array.isArray(proxyData?.routes) && proxyData.routes.length > 0) {
      return proxyData;
    }
  } catch (proxyError) {
    console.warn('Proxy directions failed, falling back to direct API:', proxyError);
  }

  if (!GOOGLE_MAPS_API_KEY) return null;

  try {
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${GOOGLE_MAPS_API_KEY}`;

    if (waypointStr) {
      url += `&waypoints=${encodeURIComponent(waypointStr)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data?.status === 'OK' && Array.isArray(data?.routes) && data.routes.length > 0) {
      return data;
    }
  } catch (error) {
    console.error('Direct directions fetch failed:', error);
  }

  return null;
};

export const geocodeAddress = async (address: string): Promise<Location | null> => {
  if (!address || !GOOGLE_MAPS_API_KEY) {
    console.error('Missing address or API key');
    return null;
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } else {
      console.error('Geocoding failed with status:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

export const getRouteDurationSeconds = async (
  origin: Location,
  destination: Location,
  waypoints?: Location[]
): Promise<number | null> => {
  if (!origin || !destination) return null;

  try {
    const data = await fetchDirectionsData(origin, destination, waypoints);

    if (data?.status === 'OK' && data.routes && data.routes.length > 0) {
      const legs = data.routes[0].legs || [];
      let seconds = 0;
      for (const leg of legs) {
        if (leg.duration && typeof leg.duration.value === 'number') {
          seconds += leg.duration.value;
        }
      }
      return seconds;
    } else {
      console.error('Directions API failed:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching directions:', error);
    return null;
  }
};

export const getRouteDistanceKm = async (
  origin: Location,
  destination: Location,
  waypoints?: Location[]
): Promise<number | null> => {
  if (!origin || !destination) return null;

  try {
    const data = await fetchDirectionsData(origin, destination, waypoints);

    if (data?.status === 'OK' && data.routes && data.routes.length > 0) {
      const legs = data.routes[0].legs || [];
      let meters = 0;

      for (const leg of legs) {
        if (leg.distance && typeof leg.distance.value === 'number') {
          meters += leg.distance.value;
        }
      }

      const km = meters / 1000;
      return Math.round((km + ROUTE_DISTANCE_OFFSET_KM) * 10) / 10;
    } else {
      console.error('Directions API distance failed:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching route distance:', error);
    return null;
  }
};

export const getPlaceAutocomplete = async (input: string): Promise<PlacePrediction[]> => {
  console.log('[Autocomplete] Starting with input:', input);
  console.log('[Autocomplete] PROXY_URL configured as:', PROXY_URL);
  
  if (!input || input.length < 3) {
    console.log('[Autocomplete] Input too short');
    return [];
  }

  try {
    const encodedInput = encodeURIComponent(input);
    const url = `${PROXY_URL}/autocomplete?input=${encodedInput}`;
    
    console.log('[Autocomplete] Full URL:', url);
    console.log('[Autocomplete] About to fetch...');

    const response = await fetch(url);
    
    console.log('[Autocomplete] Fetch completed! Status:', response.status);
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[Autocomplete] Expected JSON but got:', text.substring(0, 200));
      return [];
    }
    
    const data = await response.json();
    console.log('[Autocomplete] Got data:', JSON.stringify(data).substring(0, 200));

    if (data.status === 'OK' && data.predictions) {
      console.log('[Autocomplete] Success!', data.predictions.length, 'predictions');
      return data.predictions.map((prediction: any) => ({
        description: prediction.description,
        place_id: prediction.place_id,
      }));
    } else {
      console.error('[Autocomplete] API error:', data.status, data.error_message);
      return [];
    }
  } catch (error) {
    console.error('[Autocomplete] Caught error:', error);
    if (error instanceof Error) {
      console.error('[Autocomplete] Error type:', error.constructor.name);
      console.error('[Autocomplete] Error message:', error.message);
    }
    return [];
  }
};

export const getPlaceDetails = async (placeId: string): Promise<string | null> => {
  if (!placeId) {
    return null;
  }

  try {
    const url = `${PROXY_URL}/place-details?place_id=${placeId}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return data.result.formatted_address;
    } else {
      console.error('Place details failed with status:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
};