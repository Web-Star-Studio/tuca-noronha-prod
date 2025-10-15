"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Cloud, Sun, Droplets, Wind, Thermometer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeatherAlert {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  icon: any;
  timestamp: Date;
}

interface WeatherSummary {
  temperature: number;
  condition: string;
  rainChance: number;
  windSpeed: number;
  alerts: WeatherAlert[];
}

interface WeatherAlertsProps {
  className?: string;
}

export function WeatherAlerts({ className }: WeatherAlertsProps) {
  const [weatherSummary, setWeatherSummary] = useState<WeatherSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchWeatherSummary = async (): Promise<WeatherSummary> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const alerts: WeatherAlert[] = [];
    const rainChance = Math.round(Math.random() * 100);
    const windSpeed = Math.round(8 + Math.random() * 15);
    const temperature = Math.round((26 + Math.random() * 4) * 10) / 10;

    // Gerar alertas baseados nas condições
    if (rainChance > 70) {
      alerts.push({
        id: 'rain-warning',
        type: 'warning',
        title: 'Possibilidade de Chuva',
        message: `${rainChance}% de chance de chuva hoje`,
        icon: Droplets,
        timestamp: new Date()
      });
    }

    if (windSpeed > 18) {
      alerts.push({
        id: 'wind-warning',
        type: 'warning', 
        title: 'Ventos Fortes',
        message: `Ventos de ${windSpeed} km/h - cuidado com atividades aquáticas`,
        icon: Wind,
        timestamp: new Date()
      });
    }

    if (temperature > 30) {
      alerts.push({
        id: 'heat-warning',
        type: 'info',
        title: 'Temperatura Elevada',
        message: `${temperature}°C - use protetor solar e mantenha-se hidratado`,
        icon: Thermometer,
        timestamp: new Date()
      });
    }

    // Sempre adicionar pelo menos um alerta informativo
    if (alerts.length === 0) {
      alerts.push({
        id: 'good-conditions',
        type: 'info',
        title: 'Condições Favoráveis',
        message: 'Dia perfeito para aproveitar as praias!',
        icon: Sun,
        timestamp: new Date()
      });
    }

    // Ocasionalmente adicionar alertas especiais
    if (Math.random() > 0.7) {
      alerts.push({
        id: 'turtle-season',
        type: 'info',
        title: 'Temporada de Tartarugas',
        message: 'Período de desova - respeite as áreas sinalizadas',
        icon: AlertTriangle,
        timestamp: new Date()
      });
    }

    return {
      temperature,
      condition: rainChance > 50 ? 'Nublado' : 'Ensolarado',
      rainChance,
      windSpeed,
      alerts
    };
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWeatherSummary();
      setWeatherSummary(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    
    // Atualizar a cada 10 minutos
    const interval = setInterval(refreshData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getAlertColor = (type: WeatherAlert['type']) => {
    switch (type) {
      case 'danger': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'ensolarado': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'nublado': return <Cloud className="h-4 w-4 text-gray-500" />;
      default: return <Sun className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Resumo do Clima */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-blue-900">Clima Atual</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-6 bg-blue-200 rounded animate-pulse"></div>
            <div className="h-4 bg-blue-200 rounded w-3/4 animate-pulse"></div>
          </div>
        ) : weatherSummary ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getConditionIcon(weatherSummary.condition)}
                <span className="text-sm text-blue-800">{weatherSummary.condition}</span>
              </div>
              <span className="text-lg font-bold text-blue-900">
                {weatherSummary.temperature}°C
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3 text-blue-600" />
                <span className="text-blue-700">{weatherSummary.rainChance}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3 text-cyan-600" />
                <span className="text-blue-700">{weatherSummary.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        ) : null}

        {lastUpdate && (
          <p className="text-xs text-blue-600 mt-2">
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        )}
      </div>

      {/* Alertas */}
      {weatherSummary && weatherSummary.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Alertas</h3>
          <div className="space-y-2">
            {weatherSummary.alerts.map((alert) => {
              const IconComponent = alert.icon;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "p-3 rounded-lg border text-xs",
                    getAlertColor(alert.type)
                  )}
                >
                  <div className="flex items-start gap-2">
                    <IconComponent className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium mb-1">{alert.title}</div>
                      <div className="opacity-90">{alert.message}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dicas Baseadas no Clima */}
      {weatherSummary && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-sm font-medium text-green-900 mb-2">Dica do Dia</h4>
          <p className="text-xs text-green-800">
            {weatherSummary.rainChance > 50 
              ? "Leve uma capa de chuva e planeje atividades cobertas." 
              : weatherSummary.temperature > 30
                ? "Dia quente! Leve muito protetor solar e água."
                : "Condições ideais para explorar as praias e trilhas!"}
          </p>
        </div>
      )}
    </div>
  );
} 