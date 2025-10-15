// Serviço para integração com APIs de clima em tempo real
import { WeatherData, TideData, SeaConditions, BeachStatus } from '@/types/weather';

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/3.0/onecall';

// Coordenadas de Fernando de Noronha
const NORONHA_COORDINATES = {
  lat: -3.8566,
  lng: -32.4297
};

interface OpenWeatherResponse {
  current: {
    temp: number;
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    visibility: number;
    weather: Array<{
      main: string;
      description: string;
    }>;
    uvi: number;
  };
  hourly: Array<{
    dt: number;
    pop: number; // Probability of precipitation
  }>;
  alerts?: Array<{
    event: string;
    description: string;
  }>;
}

class WeatherService {
  private isProduction = process.env.NODE_ENV === 'production';
  
  async getWeatherData(coordinates?: { lat: number; lng: number }): Promise<WeatherData> {
    if (!this.isProduction || !OPENWEATHER_API_KEY) {
      // Fallback para dados simulados em desenvolvimento
      return this.getSimulatedWeatherData();
    }

    try {
      const coords = coordinates || NORONHA_COORDINATES;
      const url = `${OPENWEATHER_BASE_URL}?lat=${coords.lat}&lon=${coords.lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data: OpenWeatherResponse = await response.json();
      
      return {
        temperature: Math.round(data.current.temp * 10) / 10,
        humidity: data.current.humidity,
        windSpeed: Math.round(data.current.wind_speed * 3.6), // m/s para km/h
        windDirection: this.getWindDirection(data.current.wind_deg),
        visibility: Math.round(data.current.visibility / 1000), // metros para km
        conditions: data.current.weather[0]?.description || 'Ensolarado',
        uvIndex: Math.round(data.current.uvi),
        rainChance: Math.round((data.hourly[0]?.pop || 0) * 100),
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error fetching real weather data:', error);
      // Fallback para dados simulados em caso de erro
      return this.getSimulatedWeatherData();
    }
  }

  async getTideData(): Promise<TideData> {
    // API de marés seria integrada aqui (ex: NOAA, Tábua de Marés)
    // Por enquanto, dados simulados baseados em padrões reais
    return this.getSimulatedTideData();
  }

  async getSeaConditions(): Promise<SeaConditions> {
    // API de condições marítimas seria integrada aqui
    // Por enquanto, dados simulados
    return this.getSimulatedSeaConditions();
  }

  async getBeachStatus(): Promise<BeachStatus> {
    // Sistema de monitoramento de praias seria integrado aqui
    // Por enquanto, dados simulados
    return this.getSimulatedBeachStatus();
  }

  // Métodos de simulação (fallback)
  private async getSimulatedWeatherData(): Promise<WeatherData> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const baseTemp = 26 + Math.random() * 4;
    const isRainy = Math.random() > 0.7;
    
    return {
      temperature: Math.round(baseTemp * 10) / 10,
      humidity: Math.round((65 + Math.random() * 20)),
      windSpeed: Math.round((8 + Math.random() * 12)),
      windDirection: ['NE', 'E', 'SE', 'S'][Math.floor(Math.random() * 4)],
      visibility: Math.round((15 + Math.random() * 10)),
      conditions: isRainy ? 'Parcialmente nublado' : 'Ensolarado',
      uvIndex: Math.round(8 + Math.random() * 3),
      rainChance: isRainy ? Math.round(30 + Math.random() * 40) : Math.round(Math.random() * 20),
      lastUpdated: new Date().toISOString()
    };
  }

  private async getSimulatedTideData(): Promise<TideData> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const now = new Date();
    const nextHour = new Date(now.getTime() + (3 + Math.random() * 4) * 60 * 60 * 1000);
    
    return {
      height: Math.round((1.2 + Math.random() * 0.8) * 10) / 10,
      time: now.toISOString(),
      type: Math.random() > 0.5 ? 'high' : 'low',
      nextTide: {
        time: nextHour.toISOString(),
        type: Math.random() > 0.5 ? 'high' : 'low',
        height: Math.round((1.0 + Math.random() * 1.0) * 10) / 10
      }
    };
  }

  private async getSimulatedSeaConditions(): Promise<SeaConditions> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const waveHeight = Math.round((0.5 + Math.random() * 1.5) * 10) / 10;
    let seaState: SeaConditions['seaState'] = 'calm';
    
    if (waveHeight > 1.5) seaState = 'moderate';
    else if (waveHeight > 1.0) seaState = 'slight';
    
    return {
      waveHeight,
      seaState,
      waterTemperature: Math.round((26 + Math.random() * 2) * 10) / 10,
      visibility: Math.round((20 + Math.random() * 10)),
      swellDirection: ['NE', 'E', 'SE'][Math.floor(Math.random() * 3)]
    };
  }

  private async getSimulatedBeachStatus(): Promise<BeachStatus> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const alerts: string[] = [];
    const crowdLevel = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as BeachStatus['crowdLevel'];
    
    if (Math.random() > 0.8) alerts.push('Período de desova de tartarugas - mantenha distância');
    if (Math.random() > 0.9) alerts.push('Ventos fortes - cuidado com atividades aquáticas');
    
    return {
      isOpen: Math.random() > 0.05,
      alerts,
      crowdLevel,
      parkingAvailable: Math.random() > 0.3
    };
  }

  private getWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }
}

export const weatherService = new WeatherService(); 