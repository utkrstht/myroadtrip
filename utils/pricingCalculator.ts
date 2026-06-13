export interface PricingDetails {
  distanceFee: number;
  airportTax: number;
  hourlyFee: number;
  longTripFee: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface PricingInput {
  serviceType: string;
  distance: number;
  pickupLocation: string;
  vehicleId?: string;
  hours?: number;
  nights?: number;
  promoCode?: string;
}

const PROMO_CODES: { [key: string]: number } = {
  'FLAT10': 0.10,
  'SENIOR20': 0.20,
  'LIMO15': 0.15,
};

const AIRPORT_TAX_BY_VEHICLE: { [key: string]: number } = {
  'standard-black-premier': 11,
  'pet-black-premier': 11,
  'xl-black-premier': 26,
  'xxl-black-premier': 26,
};

const getAirportTaxForVehicle = (vehicleId?: string): number => {
  if (!vehicleId) {
    return 26;
  }

  return AIRPORT_TAX_BY_VEHICLE[vehicleId] ?? 26;
};

export const calculatePricing = (input: PricingInput): PricingDetails => {
  let distanceFee = 0;
  let airportTax = 0;
  let hourlyFee = 0;
  let longTripFee = 0;
  let discount = 0;

  const calculateBaseDistanceFee = (dist: number) => {
    if (dist > 100) {
      return dist * 2.5;
    } else if (dist < 20) {
      return 60;
    } else {
      return dist * 3;
    }
  };

  if (input.serviceType === '8-hours') {
  } else if (input.serviceType === 'hourly' && input.hours) {
    hourlyFee = input.hours * 120;
    distanceFee = calculateBaseDistanceFee(input.distance);
  } else if (input.serviceType === 'long-trip' && input.nights) {
    longTripFee = input.nights * 150;
    distanceFee = calculateBaseDistanceFee(input.distance);
  } else {
    distanceFee = calculateBaseDistanceFee(input.distance);
  }

  if (input.pickupLocation.toLowerCase().includes('airport')) {
    airportTax = getAirportTaxForVehicle(input.vehicleId);
  }

  let subtotal = distanceFee + airportTax + hourlyFee + longTripFee;

  if (input.promoCode && PROMO_CODES[input.promoCode.toUpperCase()]) {
    const discountRate = PROMO_CODES[input.promoCode.toUpperCase()];
    discount = subtotal * discountRate;
  }

  const balance = subtotal - discount;
  const tax = balance * 0.05;
  const total = balance + tax;

  return {
    distanceFee,
    airportTax,
    hourlyFee,
    longTripFee,
    discount,
    subtotal,
    tax,
    total,
  };
};