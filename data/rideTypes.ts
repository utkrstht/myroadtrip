import { RideType } from '../types';

export const rideTypes: RideType[] = [
  {
    id: 'airport',
    title: 'Airport Transfers',
    description: 'Reliable airport pickup and drop-off service',
    icon: 'airplane',
  },
  {
    id: 'long-trip',
    title: 'Long Trips (min. 2 days)',
    description: 'Multi-day trips with accommodation',
    icon: 'map',
  },
  {
    id: '8-hours',
    title: '8 Hours Service',
    description: 'Fixed 8-hour service package',
    icon: 'time',
  },
  {
    id: 'hourly',
    title: 'Hourly/As Directed',
    description: 'Flexible hourly service up to 24 hours',
    icon: 'schedule',
  },
  {
    id: 'day-trip',
    title: 'Day Trip',
    description: 'Full day excursion service',
    icon: 'wb-sunny',
  },
  {
    id: 'point-to-point',
    title: 'Point-to-Point',
    description: 'Direct transportation between two locations',
    icon: 'navigation',
  },
];