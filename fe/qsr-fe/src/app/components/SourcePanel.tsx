import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Search, Building2, MapPin, Settings2, Sliders, ChevronDown, ChevronUp, AlertTriangle, Zap, Cloud, Users, TrendingUp, Calendar, Wrench, Globe, Gauge, Store, Target, Sun, CloudRain, CloudDrizzle, CloudLightning, X, Lock, Scale, DollarSign, Smile, Heart, BarChart3, PlayCircle, Loader2 } from 'lucide-react';
import { PlanFormData, PlanResponse } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { submitPlan } from '../services/api';

interface Store {
  id: string;
  name: string;
  location: string;
  lastUsed: string;
  // Restaurant Configuration (editable)
  has_drive_thru: boolean;
  drive_thru_lanes: number;
  kitchen_capacity: number;
  pos_count: number;
  dine_in: boolean;
  seating_capacity: number;
  // Restaurant Constraints (read-only)
  max_staff: number;
}

interface SimulationConfig {
  difficulty: string;
  season: string;
  stressors: string;
  specialEvent: string;
}

interface SourcePanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onLoadingChange?: (isLoading: boolean) => void;
  onFormDataChange?: (formData: PlanFormData) => void;
}

export function SourcePanel({ isCollapsed, onToggle, onLoadingChange, onFormDataChange }: SourcePanelProps) {
  const [restaurants, setRestaurants] = useState<Store[]>([
    { id: '1', name: 'Downtown Atlanta', location: 'Peachtree St', lastUsed: '2 min ago', has_drive_thru: true, drive_thru_lanes: 2, kitchen_capacity: 10, pos_count: 3, dine_in: true, seating_capacity: 50, max_staff: 20 },
    { id: '2', name: 'Buckhead', location: 'Lenox Rd', lastUsed: '1 hour ago', has_drive_thru: false, drive_thru_lanes: 0, kitchen_capacity: 8, pos_count: 2, dine_in: true, seating_capacity: 40, max_staff: 18 },
    { id: '3', name: 'Midtown', location: '10th Street', lastUsed: '2 hours ago', has_drive_thru: true, drive_thru_lanes: 1, kitchen_capacity: 12, pos_count: 4, dine_in: true, seating_capacity: 60, max_staff: 22 },
    { id: '4', name: 'Airport', location: 'Hartsfield-Jackson', lastUsed: '1 day ago', has_drive_thru: true, drive_thru_lanes: 3, kitchen_capacity: 15, pos_count: 5, dine_in: true, seating_capacity: 70, max_staff: 25 },
    { id: '5', name: 'Sandy Springs', location: 'Roswell Rd', lastUsed: '2 days ago', has_drive_thru: false, drive_thru_lanes: 0, kitchen_capacity: 7, pos_count: 1, dine_in: true, seating_capacity: 30, max_staff: 15 },
  ]);

  const [selectedRestaurant, setSelectedRestaurant] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddRestaurantOpen, setIsAddRestaurantOpen] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newRestaurantLocation, setNewRestaurantLocation] = useState('');
  const [isRestaurantListExpanded, setIsRestaurantListExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    world: false,
    decision: false,
    restaurant: false,
    alignment: false,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // World Parameters (Backend API fields)
  const [shift, setShift] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [dayOfWeek, setDayOfWeek] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  });
  const [weather, setWeather] = useState<'sunny' | 'cloudy' | 'rainy' | 'stormy'>('sunny');
  const [specialEvents, setSpecialEvents] = useState<string[]>([]);

  // Operator Decision Parameters
  const [operatorPriority, setOperatorPriority] = useState<'balanced' | 'minimize_cost' | 'customer_first' | 'staff_wellbeing' | 'maximize_revenue'>('balanced');

  // Alignment Parameters (Operational Targets)
  const [targetLaborCost, setTargetLaborCost] = useState(30.0);
  const [targetWaitTime, setTargetWaitTime] = useState(180);
  const [targetStaffUtilization, setTargetStaffUtilization] = useState(0.82);

  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>({
    difficulty: 'medium',
    season: 'summer',
    stressors: 'none',
    specialEvent: 'none',
  });

  // Toggle special event selection
  const toggleSpecialEvent = (event: string) => {
    setSpecialEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  // Remove special event
  const removeSpecialEvent = (event: string) => {
    setSpecialEvents(prev => prev.filter(e => e !== event));
  };

  // Weather icon helper
  const getWeatherIcon = (weatherType: string) => {
    switch (weatherType) {
      case 'sunny': return <Sun className="h-3.5 w-3.5" />;
      case 'cloudy': return <Cloud className="h-3.5 w-3.5" />;
      case 'rainy': return <CloudRain className="h-3.5 w-3.5" />;
      case 'stormy': return <CloudLightning className="h-3.5 w-3.5" />;
      default: return <Sun className="h-3.5 w-3.5" />;
    }
  };

  // Handle target changes
  const handleTargetLaborCostChange = (value: number[]) => {
    setTargetLaborCost(value[0]);
  };

  const handleTargetWaitTimeChange = (value: number[]) => {
    setTargetWaitTime(value[0]);
  };

  const handleTargetStaffUtilizationChange = (value: number[]) => {
    setTargetStaffUtilization(value[0]);
  };

  const handleAddRestaurant = () => {
    if (newRestaurantName.trim() && newRestaurantLocation.trim()) {
      const newRestaurant: Store = {
        id: Date.now().toString(),
        name: newRestaurantName.trim(),
        location: newRestaurantLocation.trim(),
        lastUsed: 'Just now',
        has_drive_thru: false,
        drive_thru_lanes: 0,
        kitchen_capacity: 8,
        pos_count: 2,
        dine_in: true,
        seating_capacity: 40,
        max_staff: 18,

      };
      setRestaurants([newRestaurant, ...restaurants]);
      setNewRestaurantName('');
      setNewRestaurantLocation('');
      setIsAddRestaurantOpen(false);
      setSelectedRestaurant(newRestaurant.id);
      setIsRestaurantListExpanded(false); // Collapse after adding
    }
  };

  const handleRestaurantChange = (restaurantId: string) => {
    setSelectedRestaurant(restaurantId);
    setIsRestaurantListExpanded(false); // Collapse after selecting
  };

  const filteredRestaurants = restaurants.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentRestaurant = restaurants.find(s => s.id === selectedRestaurant);

  // Effect to broadcast form data changes to parent
  useEffect(() => {
    if (onFormDataChange && currentRestaurant) {
      onFormDataChange({
        shift,
        date: new Date().toISOString().split('T')[0],
        day_of_week: dayOfWeek,
        weather,
        special_events: specialEvents,
        restaurant: currentRestaurant,
        operator_priority: operatorPriority,
        alignment_targets: {
          target_labor_cost_percent: targetLaborCost,
          target_wait_time_seconds: targetWaitTime,
          target_staff_utilization: targetStaffUtilization
        }
      });
    }
  }, [
    shift, dayOfWeek, weather, specialEvents,
    currentRestaurant, operatorPriority,
    targetLaborCost, targetWaitTime, targetStaffUtilization,
    onFormDataChange
  ]);

  // Helper to get difficulty color
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-orange-500';
      case 'extreme': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case 'easy': return 'Light Traffic';
      case 'medium': return 'Normal Ops';
      case 'hard': return 'Rush Hour';
      case 'extreme': return 'Peak Chaos';
      default: return diff;
    }
  };

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <div className="w-14 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-4 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 w-10 h-10"
                >
                  <ChevronLeft className="h-5 w-5 rotate-180" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand panel</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-full h-px bg-slate-200 my-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 w-10 h-10"
                >
                  <Building2 className="h-5 w-5" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Store Selector</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 w-10 h-10"
                >
                  <Sliders className="h-5 w-5" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Simulation Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Setting</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 pb-8">
          {/* Compact Store Selector */}
          <Collapsible open={isRestaurantListExpanded} onOpenChange={setIsRestaurantListExpanded}>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Current Restaurant</h3>
                </div>

                {currentRestaurant && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="font-medium text-slate-900 text-sm">{currentRestaurant.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3 w-3 text-slate-500" />
                      <span className="text-xs text-slate-600">{currentRestaurant.location}</span>
                    </div>
                  </div>
                )}

                <CollapsibleTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                      size="sm"
                    >
                      <span className="text-xs">Switch Restaurant</span>
                      {isRestaurantListExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-3 border-t border-slate-200 pt-4">
                  <Dialog open={isAddRestaurantOpen} onOpenChange={setIsAddRestaurantOpen}>
                    <DialogTrigger asChild>
                      <div>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                          size="sm"
                        >
                          <Plus className="h-3 w-3" />
                          <span className="text-xs">Add restaurant</span>
                        </Button>
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Restaurant</DialogTitle>
                        <DialogDescription>
                          Enter the details for the new restaurant location.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="restaurant-name">Restaurant Name</Label>
                          <Input
                            id="restaurant-name"
                            placeholder="e.g., Downtown Atlanta"
                            value={newRestaurantName}
                            onChange={(e) => setNewRestaurantName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="restaurant-location">Location</Label>
                          <Input
                            id="restaurant-location"
                            placeholder="e.g., Peachtree St"
                            value={newRestaurantLocation}
                            onChange={(e) => setNewRestaurantLocation(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddRestaurantOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddRestaurant} className="bg-blue-600 hover:bg-blue-700">
                          Add Restaurant
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto">
                    <RadioGroup value={selectedRestaurant} onValueChange={handleRestaurantChange}>
                      <div className="space-y-1">
                        {filteredRestaurants.slice(0, 5).map((store) => (
                          <Label
                            key={store.id}
                            htmlFor={`store-${store.id}`}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                          >
                            <RadioGroupItem value={store.id} id={`store-${store.id}`} className="h-3 w-3" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900 truncate">{store.name}</div>
                              <div className="text-xs text-slate-500 truncate">{store.location}</div>
                            </div>
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Key Parameters Card - Always Visible, Groups Collapsible */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 p-3 border-b border-slate-100">
              <Sliders className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-slate-900">Key Parameters</h3>
            </div>

            <div className="p-2 space-y-3">

              {/* World Group */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
                <button
                  onClick={() => toggleGroup('world')}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-900">World</span>
                  </div>
                  {expandedGroups.world ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </button>
                {expandedGroups.world && (
                  <div className="px-2.5 pb-2.5 space-y-3">
                    {/* Shift - Radio Buttons */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-600">Shift *</Label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setShift('breakfast')}
                          className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-all ${shift === 'breakfast'
                            ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          Breakfast
                        </button>
                        <button
                          onClick={() => setShift('lunch')}
                          className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-all ${shift === 'lunch'
                            ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          Lunch
                        </button>
                        <button
                          onClick={() => setShift('dinner')}
                          className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-all ${shift === 'dinner'
                            ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          Dinner
                        </button>
                      </div>
                    </div>

                    {/* Day of Week - Dropdown with Override */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-600">Day of Week *</Label>
                        <span className="text-[10px] text-slate-400">Auto-filled</span>
                      </div>
                      <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                        <SelectTrigger className="h-8 bg-white border-slate-200 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Weather - Dropdown with Icons */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Weather *</Label>
                      <Select value={weather} onValueChange={(value: any) => setWeather(value)}>
                        <SelectTrigger className="h-8 bg-white border-slate-200 text-xs">
                          <div className="flex items-center gap-1.5">
                            {getWeatherIcon(weather)}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sunny">
                            <div className="flex items-center gap-2">
                              <Sun className="h-3.5 w-3.5 text-amber-500" />
                              <span>Sunny</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="cloudy">
                            <div className="flex items-center gap-2">
                              <Cloud className="h-3.5 w-3.5 text-slate-500" />
                              <span>Cloudy</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="rainy">
                            <div className="flex items-center gap-2">
                              <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                              <span>Rainy</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="stormy">
                            <div className="flex items-center gap-2">
                              <CloudLightning className="h-3.5 w-3.5 text-purple-500" />
                              <span>Stormy</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Special Events - Multi-Select */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Special Events</Label>

                      {/* Selected Events Display */}
                      {specialEvents.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {specialEvents.map(event => (
                            <Badge
                              key={event}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              {event}
                              <button
                                onClick={() => removeSpecialEvent(event)}
                                className="ml-1 hover:text-blue-900"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Event Selection Dropdown */}
                      <Select onValueChange={toggleSpecialEvent}>
                        <SelectTrigger className="h-8 bg-white border-slate-200 text-xs">
                          <SelectValue placeholder="+ Add event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Holiday">Holiday</SelectItem>
                          <SelectItem value="Sports Event">Sports Event</SelectItem>
                          <SelectItem value="Concert">Concert</SelectItem>
                          <SelectItem value="Local Festival">Local Festival</SelectItem>
                          <SelectItem value="Promotion Day">Promotion Day</SelectItem>
                          <SelectItem value="School Break">School Break</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Operator Decision Group */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
                <button
                  onClick={() => toggleGroup('decision')}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Gauge className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-xs font-semibold text-slate-900">Operator Decision</span>
                  </div>
                  {expandedGroups.decision ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </button>
                {expandedGroups.decision && (
                  <div className="px-2.5 pb-2.5 space-y-2">

                    {/* Radio Button Options */}
                    <div className="space-y-1.5">
                      {/* Balanced */}
                      <button
                        onClick={() => setOperatorPriority('balanced')}
                        className={`w-full p-2 rounded-md border transition-all text-left ${operatorPriority === 'balanced'
                          ? 'bg-purple-50 border-purple-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 h-3 w-3 rounded-full border-2 flex items-center justify-center ${operatorPriority === 'balanced'
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-slate-300 bg-white'
                            }`}>
                            {operatorPriority === 'balanced' && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <Scale className="h-3.5 w-3.5 text-purple-600" />
                              <span className={`text-xs font-medium ${operatorPriority === 'balanced' ? 'text-purple-900' : 'text-slate-700'
                                }`}>
                                Balanced
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Balance cost, service, and staff
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Minimize Cost */}
                      <button
                        onClick={() => setOperatorPriority('minimize_cost')}
                        className={`w-full p-2 rounded-md border transition-all text-left ${operatorPriority === 'minimize_cost'
                          ? 'bg-purple-50 border-purple-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 h-3 w-3 rounded-full border-2 flex items-center justify-center ${operatorPriority === 'minimize_cost'
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-slate-300 bg-white'
                            }`}>
                            {operatorPriority === 'minimize_cost' && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5 text-green-600" />
                              <span className={`text-xs font-medium ${operatorPriority === 'minimize_cost' ? 'text-purple-900' : 'text-slate-700'
                                }`}>
                                Minimize Cost
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Prioritize lowest labor cost
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Customer First */}
                      <button
                        onClick={() => setOperatorPriority('customer_first')}
                        className={`w-full p-2 rounded-md border transition-all text-left ${operatorPriority === 'customer_first'
                          ? 'bg-purple-50 border-purple-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 h-3 w-3 rounded-full border-2 flex items-center justify-center ${operatorPriority === 'customer_first'
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-slate-300 bg-white'
                            }`}>
                            {operatorPriority === 'customer_first' && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <Smile className="h-3.5 w-3.5 text-blue-600" />
                              <span className={`text-xs font-medium ${operatorPriority === 'customer_first' ? 'text-purple-900' : 'text-slate-700'
                                }`}>
                                Customer First
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Fast service & low wait times
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Staff Wellbeing */}
                      <button
                        onClick={() => setOperatorPriority('staff_wellbeing')}
                        className={`w-full p-2 rounded-md border transition-all text-left ${operatorPriority === 'staff_wellbeing'
                          ? 'bg-purple-50 border-purple-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 h-3 w-3 rounded-full border-2 flex items-center justify-center ${operatorPriority === 'staff_wellbeing'
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-slate-300 bg-white'
                            }`}>
                            {operatorPriority === 'staff_wellbeing' && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <Heart className="h-3.5 w-3.5 text-rose-600" />
                              <span className={`text-xs font-medium ${operatorPriority === 'staff_wellbeing' ? 'text-purple-900' : 'text-slate-700'
                                }`}>
                                Staff Wellbeing
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Avoid overwork
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Maximize Revenue */}
                      <button
                        onClick={() => setOperatorPriority('maximize_revenue')}
                        className={`w-full p-2 rounded-md border transition-all text-left ${operatorPriority === 'maximize_revenue'
                          ? 'bg-purple-50 border-purple-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 h-3 w-3 rounded-full border-2 flex items-center justify-center ${operatorPriority === 'maximize_revenue'
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-slate-300 bg-white'
                            }`}>
                            {operatorPriority === 'maximize_revenue' && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <BarChart3 className="h-3.5 w-3.5 text-amber-600" />
                              <span className={`text-xs font-medium ${operatorPriority === 'maximize_revenue' ? 'text-purple-900' : 'text-slate-700'
                                }`}>
                                Maximize Revenue
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Serve maximum customers
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Restaurant Group */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
                <button
                  onClick={() => toggleGroup('restaurant')}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Store className="h-3.5 w-3.5 text-orange-600" />
                    <span className="text-xs font-semibold text-slate-900">Restaurant</span>
                  </div>
                  {expandedGroups.restaurant ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </button>
                {expandedGroups.restaurant && currentRestaurant && (
                  <div className="px-2.5 pb-2.5 space-y-3">

                    {/* Location Badge */}
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 border border-orange-200 rounded-md">
                      <MapPin className="h-3 w-3 text-orange-600" />
                      <span className="text-xs font-medium text-orange-900">{currentRestaurant.name}</span>
                    </div>

                    {/* Configuration Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Settings2 className="h-3 w-3 text-slate-500" />
                        <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Configuration</Label>
                      </div>

                      {/* Drive-Thru Toggle */}
                      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded-md">
                        <Label htmlFor="drive-thru-toggle" className="text-xs font-medium text-slate-700 cursor-pointer">
                          Drive-Thru
                        </Label>
                        <Switch
                          id="drive-thru-toggle"
                          checked={currentRestaurant.has_drive_thru}
                          onCheckedChange={(checked) => {
                            setRestaurants(restaurants.map(r =>
                              r.id === selectedRestaurant
                                ? { ...r, has_drive_thru: checked, drive_thru_lanes: checked ? r.drive_thru_lanes || 1 : 0 }
                                : r
                            ));
                          }}
                        />
                      </div>

                      {/* Drive-Thru Lanes (conditional) */}
                      {currentRestaurant.has_drive_thru && (
                        <div className="space-y-1">
                          <Label htmlFor="drive-thru-lanes" className="text-xs font-medium text-slate-600">Drive-Thru Lanes</Label>
                          <Input
                            id="drive-thru-lanes"
                            type="number"
                            min="1"
                            max="4"
                            value={currentRestaurant.drive_thru_lanes}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              setRestaurants(restaurants.map(r =>
                                r.id === selectedRestaurant ? { ...r, drive_thru_lanes: Math.max(1, Math.min(4, value)) } : r
                              ));
                            }}
                            className="h-8 bg-white border-slate-200 text-xs"
                          />
                        </div>
                      )}

                      {/* Kitchen Capacity */}
                      <div className="space-y-1">
                        <Label htmlFor="kitchen-capacity" className="text-xs font-medium text-slate-600">Kitchen Capacity (orders/hr)</Label>
                        <Input
                          id="kitchen-capacity"
                          type="number"
                          min="1"
                          value={currentRestaurant.kitchen_capacity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            setRestaurants(restaurants.map(r =>
                              r.id === selectedRestaurant ? { ...r, kitchen_capacity: Math.max(1, value) } : r
                            ));
                          }}
                          className="h-8 bg-white border-slate-200 text-xs"
                        />
                      </div>

                      {/* POS Terminals */}
                      <div className="space-y-1">
                        <Label htmlFor="pos-count" className="text-xs font-medium text-slate-600">POS Terminals</Label>
                        <Input
                          id="pos-count"
                          type="number"
                          min="1"
                          max="6"
                          value={currentRestaurant.pos_count}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            setRestaurants(restaurants.map(r =>
                              r.id === selectedRestaurant ? { ...r, pos_count: Math.max(1, Math.min(6, value)) } : r
                            ));
                          }}
                          className="h-8 bg-white border-slate-200 text-xs"
                        />
                      </div>

                      {/* Seating Capacity */}
                      <div className="space-y-1">
                        <Label htmlFor="seating-capacity" className="text-xs font-medium text-slate-600">Seating Capacity</Label>
                        <Input
                          id="seating-capacity"
                          type="number"
                          min="0"
                          max="150"
                          value={currentRestaurant.seating_capacity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setRestaurants(restaurants.map(r =>
                              r.id === selectedRestaurant ? { ...r, seating_capacity: Math.max(0, Math.min(150, value)) } : r
                            ));
                          }}
                          className="h-8 bg-white border-slate-200 text-xs"
                        />
                      </div>
                    </div>

                    {/* Constraints Section (Read-Only) */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Lock className="h-3 w-3 text-slate-400" />
                        <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Constraints (Read-Only)</Label>
                      </div>

                      <div className="space-y-1.5 px-2 py-2 bg-slate-50 rounded-md border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600">Max Staff</span>
                          <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-700">
                            {currentRestaurant.max_staff} employees
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Alignment Group */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-green-500">
                <button
                  onClick={() => toggleGroup('alignment')}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs font-semibold text-slate-900">Alignment Targets</span>
                  </div>
                  {expandedGroups.alignment ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </button>
                {expandedGroups.alignment && (
                  <div className="px-2.5 pb-2.5 space-y-3">

                    {/* Labor Cost Target */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          Max Labor Cost (%)
                        </Label>
                        <Input
                          type="number"
                          min="10"
                          max="60"
                          value={targetLaborCost}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 30;
                            setTargetLaborCost(Math.max(10, Math.min(60, value)));
                          }}
                          className="h-6 w-14 text-xs text-right px-1.5"
                        />
                      </div>
                      <Slider
                        value={[targetLaborCost]}
                        onValueChange={handleTargetLaborCostChange}
                        min={10}
                        max={60}
                        step={0.5}
                        className="w-full"
                      />
                    </div>

                    {/* Wait Time Target */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                          <Smile className="h-3 w-3 text-blue-600" />
                          Max Wait Time (s)
                        </Label>
                        <Input
                          type="number"
                          min="60"
                          max="600"
                          value={targetWaitTime}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 180;
                            setTargetWaitTime(Math.max(60, Math.min(600, value)));
                          }}
                          className="h-6 w-14 text-xs text-right px-1.5"
                        />
                      </div>
                      <Slider
                        value={[targetWaitTime]}
                        onValueChange={handleTargetWaitTimeChange}
                        min={60}
                        max={600}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    {/* Utilization Target */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                          <Heart className="h-3 w-3 text-rose-600" />
                          Target Utilization
                        </Label>
                        <Input
                          type="number"
                          min="0.5"
                          max="1.0"
                          step="0.01"
                          value={targetStaffUtilization}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0.82;
                            setTargetStaffUtilization(Math.max(0.5, Math.min(1.0, value)));
                          }}
                          className="h-6 w-14 text-xs text-right px-1.5"
                        />
                      </div>
                      <Slider
                        value={[targetStaffUtilization]}
                        onValueChange={handleTargetStaffUtilizationChange}
                        min={0.5}
                        max={1.0}
                        step={0.01}
                        className="w-full"
                      />
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div >
  );
}