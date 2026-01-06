
import { useState, useCallback } from 'react';
import { ShiftType, WeatherType, AlignmentTargets, OperatorPriority, Restaurant } from '../types';
import { DAYS_OF_WEEK } from '../constants';

export function useWorldParameters() {
  const [shift, setShift] = useState<ShiftType>('lunch');
  const [dayOfWeek, setDayOfWeek] = useState<string>(() => {
    return DAYS_OF_WEEK[new Date().getDay()];
  });
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [specialEvents, setSpecialEvents] = useState<string[]>([]);

  const toggleSpecialEvent = useCallback((event: string) => {
    setSpecialEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  }, []);

  const removeSpecialEvent = useCallback((event: string) => {
    setSpecialEvents(prev => prev.filter(e => e !== event));
  }, []);

  return {
    shift,
    setShift,
    dayOfWeek,
    setDayOfWeek,
    weather,
    setWeather,
    specialEvents,
    toggleSpecialEvent,
    removeSpecialEvent
  };
}

export function useAlignmentTargets() {
  const [targetLaborCost, setTargetLaborCost] = useState(30.0);
  const [targetWaitTime, setTargetWaitTime] = useState(180);
  const [targetStaffUtilization, setTargetStaffUtilization] = useState(0.82);

  const handleTargetLaborCostChange = useCallback((value: number[]) => {
    setTargetLaborCost(value[0]);
  }, []);

  const handleTargetWaitTimeChange = useCallback((value: number[]) => {
    setTargetWaitTime(value[0]);
  }, []);

  const handleTargetStaffUtilizationChange = useCallback((value: number[]) => {
    setTargetStaffUtilization(value[0]);
  }, []);

  return {
    targetLaborCost,
    targetWaitTime,
    targetStaffUtilization,
    handleTargetLaborCostChange,
    handleTargetWaitTimeChange,
    handleTargetStaffUtilizationChange,
    setTargetLaborCost,
    setTargetWaitTime,
    setTargetStaffUtilization
  };
}

export function useRestaurantManagement(initialRestaurants: Restaurant[]) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [selectedRestaurant, setSelectedRestaurant] = useState(initialRestaurants[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRestaurants = restaurants.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentRestaurant = restaurants.find(r => r.id === selectedRestaurant);

  const addRestaurant = useCallback((name: string, location: string) => {
    const newRestaurant: Restaurant = {
      id: Date.now().toString(),
      name: name.trim(),
      location: location.trim(),
      lastUsed: 'Just now',
      has_drive_thru: false,
      drive_thru_lanes: 0,
      kitchen_capacity: 8,
      pos_count: 2,
      dine_in: true,
      seating_capacity: 40,
      max_staff: 18,
    };
    setRestaurants(prev => [newRestaurant, ...prev]);
    setSelectedRestaurant(newRestaurant.id);
    return newRestaurant;
  }, []);

  const updateRestaurant = useCallback((id: string, updates: Partial<Restaurant>) => {
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  return {
    restaurants,
    selectedRestaurant,
    setSelectedRestaurant,
    searchQuery,
    setSearchQuery,
    filteredRestaurants,
    currentRestaurant,
    addRestaurant,
    updateRestaurant
  };
}

export function useOperatorPriority() {
  const [operatorPriority, setOperatorPriority] = useState<OperatorPriority>('balanced');
  return { operatorPriority, setOperatorPriority };
}