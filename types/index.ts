export interface Vehicle {
  id: string;
  name: string;
  description?: string; 
  model: string;
  year: number;
  capacity: number; 
  luggage?: number;
  icon: string;
  features: string[];
}

export interface RideType {
  id: string;
  title: string;
  description: string;
  icon: string;
  basePrice?: string;
}
export interface Booking {
  id: string; 
  rideType: string; 
  pickupLocation: string; 
  dropoffLocation: string
  date: string;
  time: string; 
  passengers: number; 
  vehicleId: string; 
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'; 
  specialRequests?: string; 
  estimatedPrice?: number; 
  distance?: string; 
  customerName?: string; 
  customerEmail?: string; 
  customerPhone?: string;
  paymentMethod?: string;
  paymentProvider?: string;
  paymentStatus?: string;
  paymentSessionId?: string | null;
  paymentCheckoutUrl?: string | null;
}