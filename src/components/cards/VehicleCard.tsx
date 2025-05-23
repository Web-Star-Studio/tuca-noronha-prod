import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, Users, Fuel, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VehicleCardProps {
  vehicle: {
    _id: string;
    name: string;
    brand: string;
    model: string;
    category: string;
    year: number;
    color: string;
    seats: number;
    fuelType: string;
    transmission: string;
    pricePerDay: number;
    imageUrl?: string;
  };
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <Card className="overflow-hidden h-full transition-all hover:shadow-md">
      <Link href={`/veiculos/${vehicle._id}`} className="block h-full">
        <div className="relative aspect-[4/3]">
          <Image
            src={
              vehicle.imageUrl ||
              "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"
            }
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover"
          />
          <div className="absolute top-3 right-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={toggleFavorite}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isFavorite ? "fill-rose-500 text-rose-500" : "text-gray-600"
                )}
              />
              <span className="sr-only">Adicionar aos favoritos</span>
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex justify-between items-end">
              <div>
                <Badge
                  variant="secondary"
                  className="mb-1 bg-white/20 backdrop-blur-sm text-white"
                >
                  {vehicle.category}
                </Badge>
                <h3 className="text-lg font-bold text-white">
                  {vehicle.brand} {vehicle.model}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="h-4 w-4 fill-yellow-400" />
                <span className="text-sm font-medium">4.8</span>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{vehicle.seats}</span>
              </div>
              <div className="flex items-center gap-1">
                <Fuel className="h-4 w-4" />
                <span>{vehicle.fuelType}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{vehicle.year}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-lg font-bold">
                R$ {vehicle.pricePerDay.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500"> /dia</span>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
              {vehicle.transmission}
            </Badge>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
} 