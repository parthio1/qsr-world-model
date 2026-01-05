import { useState, useCallback } from 'react';
import { WorldParameters, AlignmentWeights, OperatorPriority, Restaurant } from '../types';
import { DEFAULT_ALIGNMENT_WEIGHTS, DAYS_OF_WEEK } from '../constants';

export function useWorldParameters() {
  const [shift, setShift] = useState<WorldParameters['shift']>('lunch');
  const [dayOfWeek, setDayOfWeek] = useState<string>(() => {
    return DAYS_OF_WEEK[new Date().getDay()];
  });
  const [weather, setWeather] = useState<WorldParameters['weather']>('sunny');
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

export function useAlignmentWeights() {
  const [profitWeight, setProfitWeight] = useState(DEFAULT_ALIGNMENT_WEIGHTS.profit);
  const [customerSatisfactionWeight, setCustomerSatisfactionWeight] = useState(DEFAULT_ALIGNMENT_WEIGHTS.customer_satisfaction);
  const [staffWellbeingWeight, setStaffWellbeingWeight] = useState(DEFAULT_ALIGNMENT_WEIGHTS.staff_wellbeing);

  const totalWeight = profitWeight + customerSatisfactionWeight + staffWellbeingWeight;
  const isWeightValid = totalWeight === 100;

  const handleProfitWeightChange = useCallback((value: number[]) => {
    setProfitWeight(value[0]);
  }, []);

  const handleCustomerSatisfactionWeightChange = useCallback((value: number[]) => {
    setCustomerSatisfactionWeight(value[0]);
  }, []);

  const handleStaffWellbeingWeightChange = useCallback((value: number[]) => {
    setStaffWellbeingWeight(value[0]);
  }, []);

  return {
    profitWeight,
    customerSatisfactionWeight,
    staffWellbeingWeight,
    totalWeight,
    isWeightValid,
    handleProfitWeightChange,
    handleCustomerSatisfactionWeightChange,
    handleStaffWellbeingWeightChange,
    setProfitWeight,
    setCustomerSatisfactionWeight,
    setStaffWellbeingWeight
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
      seating_capacity: 40,
      max_staff: 18,
      max_labor_cost: 900,
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