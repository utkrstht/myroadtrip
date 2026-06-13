export interface EmailData {
  service_type: string;
  pickup_date: string;
  pickup_time: string;
  pickup_location: string;
  dropoff_location: string;
  distance: string;
  distance_fee: string;
  airport_tax: string;
  discount: string;
  balance: string;
  tax: string;
  total: string;
  first_name: string;
  last_name?: string;
  phone: string;
  email: string;
  passengers: string;
  hourly_fee: string;
  longtrip_fee: string;
  info: string;
  stops: string;
  hours: string;
  nights: string;
  pay_meth: string;
  child_seats: string;
  bulky_luggage: string;
  car: string;
}

export interface CancelEmailData {
  first_name: string;
  last_name?: string;
  service_type: string;
  car: string;
  pickup_date: string;
  pickup_time: string;
  pickup_location: string;
  dropoff_location: string;
  email: string;
  phone: string;
  info?: string;
}

const API_URL = 'https://nodejs-serverless-function-express-pi-swart-45.vercel.app/api/send-email';
const CANCEL_API_URL = 'https://nodejs-serverless-function-express1-nine.vercel.app/api/cancel';

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const sendBookingEmail = async (data: EmailData): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }, 15000);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Email sent successfully:', result);
      return true;
    } else {
      const errorData = await response.json();
      console.error('Failed to send email:', errorData);
      return false;
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendCancelEmail = async (data: CancelEmailData): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(CANCEL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }, 15000);

    let resultText = await response.text();
    const result = resultText || "<empty response>";

    if (!response.ok) {
      console.error(
        `Cancel email failed - ${response.status} ${response.statusText}:`,
        result
      );
      return false;
    }

    console.log("Cancel email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Failed to send cancel email:", error);
    return false;
  }
};
