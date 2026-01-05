import { Restaurant } from '../types';

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Downtown Atlanta',
    location: 'Peachtree St',
    lastUsed: '2 min ago',
    has_drive_thru: true,
    drive_thru_lanes: 2,
    kitchen_capacity: 10,
    pos_count: 3,
    seating_capacity: 50,
    max_staff: 20,
    max_labor_cost: 1000
  },
  {
    id: '2',
    name: 'Buckhead',
    location: 'Lenox Rd',
    lastUsed: '1 hour ago',
    has_drive_thru: false,
    drive_thru_lanes: 0,
    kitchen_capacity: 8,
    pos_count: 2,
    seating_capacity: 40,
    max_staff: 18,
    max_labor_cost: 900
  },
  {
    id: '3',
    name: 'Midtown',
    location: '10th Street',
    lastUsed: '2 hours ago',
    has_drive_thru: true,
    drive_thru_lanes: 1,
    kitchen_capacity: 12,
    pos_count: 4,
    seating_capacity: 60,
    max_staff: 22,
    max_labor_cost: 1100
  },
  {
    id: '4',
    name: 'Airport',
    location: 'Hartsfield-Jackson',
    lastUsed: '1 day ago',
    has_drive_thru: true,
    drive_thru_lanes: 3,
    kitchen_capacity: 15,
    pos_count: 5,
    seating_capacity: 70,
    max_staff: 25,
    max_labor_cost: 1200
  },
  {
    id: '5',
    name: 'Sandy Springs',
    location: 'Roswell Rd',
    lastUsed: '2 days ago',
    has_drive_thru: false,
    drive_thru_lanes: 0,
    kitchen_capacity: 7,
    pos_count: 1,
    seating_capacity: 30,
    max_staff: 15,
    max_labor_cost: 800
  }
];
