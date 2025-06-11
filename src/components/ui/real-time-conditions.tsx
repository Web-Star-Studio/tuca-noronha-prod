"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Thermometer, Droplets, Wind, Eye, Waves, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WeatherData {
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

interface TideData {
  height: number;
  time: string;
  type: 'high' | 'low';
  nextTide: {
    time: string;
    type: 'high' | 'low';
    height: number;
  };
}

interface SeaConditions {
  waveHeight: number;
  seaState: 'calm' | 'slight' | 'moderate' | 'rough';
  waterTemperature: number;
  visibility: number;
  swellDirection: string;
}

interface BeachStatus {
  isOpen: boolean;
  alerts: string[];
  crowdLevel: 'low' | 'medium' | 'high';
  parkingAvailable: boolean;
}

interface RealTimeConditionsProps {
  beachName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  className?: string;
}

export function RealTimeConditions({ beachName, coordinates, className }: RealTimeConditionsProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [tide, setTide] = useState<TideData | null>(null);
  const [seaConditions, setSeaConditions] = useState<SeaConditions | null>(null);
  const [beachStatus, setBeachStatus] = useState<BeachStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simular dados em tempo real (em produção, seria integração com APIs reais)
  const fetchWeatherData = async (): Promise<WeatherData> => {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Dados simulados baseados em Fernando de Noronha
    const baseTemp = 26 + Math.random() * 4; // 26-30°C
    const isRainy = Math.random() > 0.7; // 30% chance de chuva
    
    return {
      temperature: Math.round(baseTemp * 10) / 10,
      humidity: Math.round((65 + Math.random() * 20)), // 65-85%
      windSpeed: Math.round((8 + Math.random() * 12)), // 8-20 km/h
      windDirection: ['NE', 'E', 'SE', 'S'][Math.floor(Math.random() * 4)],
      visibility: Math.round((15 + Math.random() * 10)), // 15-25 km
      conditions: isRainy ? 'Parcialmente nublado' : 'Ensolarado',
      uvIndex: Math.round(8 + Math.random() * 3), // 8-11
      rainChance: isRainy ? Math.round(30 + Math.random() * 40) : Math.round(Math.random() * 20),
      lastUpdated: new Date().toISOString()
    };
  };

  const fetchTideData = async (): Promise<TideData> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const now = new Date();
    const nextHour = new Date(now.getTime() + (3 + Math.random() * 4) * 60 * 60 * 1000);
    
    return {
      height: Math.round((1.2 + Math.random() * 0.8) * 10) / 10, // 1.2-2.0m
      time: now.toISOString(),
      type: Math.random() > 0.5 ? 'high' : 'low',
      nextTide: {
        time: nextHour.toISOString(),
        type: Math.random() > 0.5 ? 'high' : 'low',
        height: Math.round((1.0 + Math.random() * 1.0) * 10) / 10
      }
    };
  };

  const fetchSeaConditions = async (): Promise<SeaConditions> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const waveHeight = Math.round((0.5 + Math.random() * 1.5) * 10) / 10; // 0.5-2.0m
    let seaState: SeaConditions['seaState'] = 'calm';
    
    if (waveHeight > 1.5) seaState = 'moderate';
    else if (waveHeight > 1.0) seaState = 'slight';
    
    return {
      waveHeight,
      seaState,
      waterTemperature: Math.round((26 + Math.random() * 2) * 10) / 10, // 26-28°C
      visibility: Math.round((20 + Math.random() * 10)), // 20-30m
      swellDirection: ['NE', 'E', 'SE'][Math.floor(Math.random() * 3)]
    };
  };

  const fetchBeachStatus = async (): Promise<BeachStatus> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const alerts: string[] = [];
    const crowdLevel = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as BeachStatus['crowdLevel'];
    
    if (Math.random() > 0.8) alerts.push('Período de desova de tartarugas - mantenha distância');
    if (Math.random() > 0.9) alerts.push('Ventos fortes - cuidado com atividades aquáticas');
    
    return {
      isOpen: Math.random() > 0.05, // 95% chance de estar aberta
      alerts,
      crowdLevel,
      parkingAvailable: Math.random() > 0.3 // 70% chance de ter vaga
    };
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [weatherData, tideData, seaData, statusData] = await Promise.all([
        fetchWeatherData(),
        fetchTideData(),
        fetchSeaConditions(),
        fetchBeachStatus()
      ]);
      
      setWeather(weatherData);
      setTide(tideData);
      setSeaConditions(seaData);
      setBeachStatus(statusData);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Erro ao carregar dados. Tente novamente.');
      console.error('Error fetching real-time data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Atualizar dados a cada 5 minutos
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [beachName, coordinates]);

  const getSeaStateColor = (state: SeaConditions['seaState']) => {
    switch (state) {
      case 'calm': return 'text-green-600 bg-green-50 border-green-200';
      case 'slight': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rough': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCrowdLevelColor = (level: BeachStatus['crowdLevel']) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (error) {
    return (
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAllData}
              className="ml-auto h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-blue-200 bg-blue-50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <Waves className="h-5 w-5" />
            Condições Atuais - {beachName}
          </CardTitle>
          <div className="flex items-center gap-2">
            {beachStatus?.isOpen ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Aberta
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Fechada
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAllData}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
        {lastUpdate && (
          <p className="text-xs text-blue-600">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/50 p-3 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Condições Meteorológicas */}
            {weather && (
              <div className="grid md:grid-cols-4 gap-3">
                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-medium text-blue-700">Temperatura</span>
                  </div>
                  <div className="text-lg font-semibold text-blue-900">{weather.temperature}°C</div>
                </div>

                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Umidade</span>
                  </div>
                  <div className="text-lg font-semibold text-blue-900">{weather.humidity}%</div>
                </div>

                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="h-4 w-4 text-cyan-600" />
                    <span className="text-xs font-medium text-blue-700">Vento</span>
                  </div>
                  <div className="text-sm font-semibold text-blue-900">
                    {weather.windSpeed} km/h {weather.windDirection}
                  </div>
                </div>

                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-medium text-blue-700">Visibilidade</span>
                  </div>
                  <div className="text-lg font-semibold text-blue-900">{weather.visibility} km</div>
                </div>
              </div>
            )}

            {/* Condições do Mar e Maré */}
            <div className="grid md:grid-cols-2 gap-4">
              {seaConditions && (
                <div className="bg-white/50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Waves className="h-4 w-4" />
                    Condições do Mar
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Altura das ondas:</span>
                      <span className="font-semibold text-blue-900">{seaConditions.waveHeight}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Estado do mar:</span>
                      <Badge className={cn("text-xs", getSeaStateColor(seaConditions.seaState))}>
                        {seaConditions.seaState === 'calm' ? 'Calmo' :
                         seaConditions.seaState === 'slight' ? 'Ligeiro' :
                         seaConditions.seaState === 'moderate' ? 'Moderado' : 'Agitado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Temp. da água:</span>
                      <span className="font-semibold text-blue-900">{seaConditions.waterTemperature}°C</span>
                    </div>
                  </div>
                </div>
              )}

              {tide && (
                <div className="bg-white/50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Informações de Maré
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Altura atual:</span>
                      <span className="font-semibold text-blue-900">{tide.height}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Próxima maré:</span>
                      <span className="font-semibold text-blue-900">
                        {tide.nextTide.type === 'high' ? 'Alta' : 'Baixa'} às{' '}
                        {new Date(tide.nextTide.time).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status da Praia */}
            {beachStatus && (
              <div className="bg-white/50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3">Status da Praia</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Movimento:</span>
                      <Badge className={cn("text-xs", getCrowdLevelColor(beachStatus.crowdLevel))}>
                        {beachStatus.crowdLevel === 'low' ? 'Tranquilo' :
                         beachStatus.crowdLevel === 'medium' ? 'Moderado' : 'Movimentado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Estacionamento:</span>
                      <Badge className={cn(
                        "text-xs",
                        beachStatus.parkingAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      )}>
                        {beachStatus.parkingAvailable ? 'Disponível' : 'Lotado'}
                      </Badge>
                    </div>
                  </div>
                  
                  {beachStatus.alerts.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-blue-700">Alertas:</span>
                      <ul className="mt-1 space-y-1">
                        {beachStatus.alerts.map((alert, index) => (
                          <li key={index} className="text-xs text-orange-700 flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 