export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  conditions: string;
  uvIndex: number;
  rainChance: number;
  lastUpdated: string;
}

export interface TideData {
  height: number;
  time: string;
  type: 'high' | 'low';
  nextTide: {
    time: string;
    type: 'high' | 'low';
    height: number;
  };
}

export interface SeaConditions {
  waveHeight: number;
  seaState: 'calm' | 'slight' | 'moderate' | 'rough';
  waterTemperature: number;
  visibility: number;
  swellDirection: string;
}

export interface BeachStatus {
  isOpen: boolean;
  alerts: string[];
  crowdLevel: 'low' | 'medium' | 'high';
  parkingAvailable: boolean;
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  icon: any;
  timestamp: Date;
}

export interface WeatherSummary {
  temperature: number;
  condition: string;
  rainChance: number;
  windSpeed: number;
  alerts: WeatherAlert[];
} 