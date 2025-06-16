"use client";

import { useState } from "react";
import { MapPin, Navigation, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BeachLocationProps {
  beach: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    distance?: {
      fromCenter: string;
      walkingTime: string;
      drivingTime: string;
    };
    nearbyAttractions?: string[];
    parkingInfo?: string;
    accessNotes?: string;
  };
}

export function BeachLocation({ beach }: BeachLocationProps) {
  const [showDirections, setShowDirections] = useState(false);

  const openInMaps = () => {
    if (beach.coordinates) {
      const url = `https://www.google.com/maps/search/?api=1&query=${beach.coordinates.lat},${beach.coordinates.lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(beach.name + " Fernando de Noronha")}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
          <MapPin className="h-5 w-5" />
          Localização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coordenadas */}
        {beach.coordinates && (
          <div className="text-sm text-blue-800">
            <strong>Coordenadas:</strong> {beach.coordinates.lat}, {beach.coordinates.lng}
          </div>
        )}

        {/* Distâncias */}
        {beach.distance && (
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-white/50 p-3 rounded-lg">
              <div className="text-xs text-blue-600 font-medium">Do Centro</div>
              <div className="text-sm font-semibold text-blue-900">{beach.distance.fromCenter}</div>
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <div className="text-xs text-blue-600 font-medium">A pé</div>
              <div className="text-sm font-semibold text-blue-900 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {beach.distance.walkingTime}
              </div>
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <div className="text-xs text-blue-600 font-medium">De carro</div>
              <div className="text-sm font-semibold text-blue-900 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {beach.distance.drivingTime}
              </div>
            </div>
          </div>
        )}

        {/* Atrações Próximas */}
        {beach.nearbyAttractions && beach.nearbyAttractions.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-blue-900 mb-2">Próximo a:</h5>
            <div className="flex flex-wrap gap-1">
              {beach.nearbyAttractions.map((attraction, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  {attraction}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Informações de Estacionamento */}
        {beach.parkingInfo && (
          <div className="bg-white/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <div className="text-xs text-blue-600 font-medium">Estacionamento</div>
                <div className="text-sm text-blue-800">{beach.parkingInfo}</div>
              </div>
            </div>
          </div>
        )}

        {/* Notas de Acesso */}
        {beach.accessNotes && (
          <div className="bg-white/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Navigation className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <div className="text-xs text-blue-600 font-medium">Como Chegar</div>
                <div className="text-sm text-blue-800">{beach.accessNotes}</div>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={openInMaps}
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Abrir no Maps
          </Button>
          
          <Button
            onClick={() => setShowDirections(!showDirections)}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Rotas
          </Button>
        </div>

        {/* Instruções de Direção */}
        {showDirections && (
          <div className="bg-white/70 p-3 rounded-lg border border-blue-200">
            <h6 className="text-sm font-medium text-blue-900 mb-2">Como chegar:</h6>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. Saia da Vila dos Remédios em direção à BR-363</p>
              <p>2. Siga as placas indicativas para {beach.name}</p>
              <p>3. {beach.accessNotes || "Siga as instruções locais para acesso"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 