"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, User, Mail, Phone, Calendar, Briefcase, PlusCircle } from "lucide-react";
import { AdminReservationData } from "../AdminReservationCreationForm";
import { Id } from "../../../../convex/_generated/dataModel";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TravelerSelectionStepProps {
  data: Partial<AdminReservationData>;
  onComplete: (data: Partial<AdminReservationData>) => void;
}

type Traveler = {
  _id: Id<"users">;
  clerkId?: string;
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  onboardingCompleted?: boolean;
  joinedAt: string;
};

const getInitials = (name?: string) => {
  if (!name) return "S/N";
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
};

export function TravelerSelectionStep({ data, onComplete }: TravelerSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [selectedTraveler, setSelectedTraveler] = useState<Traveler | null>(() => {
    if (data.travelerId && data.travelerName) {
      return {
        _id: data.travelerId,
        name: data.travelerName,
        email: data.travelerEmail,
        joinedAt: new Date().toLocaleDateString()
      };
    }
    return null;
  });

  const [cursor, setCursor] = useState<string | null>(null);
  const [allTravelers, setAllTravelers] = useState<Traveler[]>([]);
  
  const result = useQuery(
    api.domains.users.queries.listTravelers,
    { 
      search: debouncedSearchTerm || undefined,
      paginationOpts: {
        numItems: 15,
        cursor: cursor,
      }
    }
  );

  // Update travelers when result changes
  React.useEffect(() => {
    if (result?.page) {
      if (cursor === null) {
        // First load or new search
        setAllTravelers(result.page);
      } else {
        // Loading more
        setAllTravelers(prev => [...prev, ...result.page]);
      }
    }
  }, [result?.page, cursor]);

  // Reset when search changes
  React.useEffect(() => {
    setCursor(null);
    setAllTravelers([]);
  }, [debouncedSearchTerm]);

  const travelers = allTravelers;
  const status = result === undefined ? "loading" : "success";
  const canLoadMore = result && !result.isDone;

  const loadMore = () => {
    if (result?.continueCursor) {
      setCursor(result.continueCursor);
    }
  };

  const handleSelectTraveler = (traveler: Traveler) => {
    setSelectedTraveler(traveler);
  };

  const handleContinue = () => {
    if (selectedTraveler) {
      onComplete({
        travelerId: selectedTraveler._id,
        travelerName: selectedTraveler.name,
        travelerEmail: selectedTraveler.email,
        reservationData: {
          ...data.reservationData,
          customerName: selectedTraveler.name || '',
          customerEmail: selectedTraveler.email || '',
          customerPhone: selectedTraveler.phone || '',
        },
      });
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 h-full">
      {/* Search and List Column */}
      <div className="lg:col-span-1 h-full flex flex-col">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar viajante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 text-base"
          />
        </div>

        <Card className="flex-grow">
          <ScrollArea className="h-[400px]">
            <div className="p-2 space-y-1">
              {status === "loading" && Array.from({ length: 7 }).map((_, i) => <TravelerListItemSkeleton key={i} />)}

              {status !== 'loading' && travelers.map((traveler) => (
                <button
                  key={traveler._id}
                  onClick={() => handleSelectTraveler(traveler)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                    selectedTraveler?._id === traveler._id ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  <Avatar>
                    <AvatarImage src={traveler.image} alt={traveler.name} />
                    <AvatarFallback>{getInitials(traveler.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="font-semibold">{traveler.name}</p>
                    <p className="text-sm text-muted-foreground">{traveler.email}</p>
                  </div>
                </button>
              ))}

              {canLoadMore && (
                <Button variant="ghost" onClick={() => loadMore(10)} className="w-full mt-2">
                  Carregar Mais
                </Button>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Details Column */}
      <div className="lg:col-span-2">
        {selectedTraveler ? (
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                 <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={selectedTraveler.image} alt={selectedTraveler.name} />
                    <AvatarFallback className="text-2xl">{getInitials(selectedTraveler.name)}</AvatarFallback>
                 </Avatar>
                 <div>
                    <CardTitle className="text-2xl">{selectedTraveler.name}</CardTitle>
                    <CardDescription>
                       <Badge variant="outline">Viajante</Badge>
                    </CardDescription>
                 </div>
              </div>
               <Button onClick={handleContinue} size="lg">Continuar com {selectedTraveler.name?.split(' ')[0]}</Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
               <div className="grid grid-cols-2 gap-4">
                  <InfoItem icon={Mail} label="Email" value={selectedTraveler.email} />
                  <InfoItem icon={Phone} label="Telefone" value={selectedTraveler.phone} />
                  <InfoItem icon={Calendar} label="Cliente Desde" value={selectedTraveler.joinedAt} />
                  <InfoItem icon={Briefcase} label="Onboarding" value={selectedTraveler.onboardingCompleted ? "Completo" : "Pendente"} />
               </div>
            </CardContent>
          </Card>
        ) : (
           <div className="flex flex-col items-center justify-center h-full border rounded-lg bg-muted/20 text-center p-8">
               <User className="h-16 w-16 text-muted-foreground mb-4" />
               <h3 className="text-xl font-semibold mb-2">Selecione um Viajante</h3>
               <p className="text-muted-foreground mb-6">
                 Use a busca para encontrar um viajante existente ou adicione um novo.
               </p>
               <Button variant="outline" disabled> 
                 <PlusCircle className="mr-2 h-4 w-4" />
                 Criar Novo Viajante (em breve)
               </Button>
            </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number }) {
   if (!value) return null;
   return (
      <div className="flex items-start gap-3">
         <Icon className="h-5 w-5 text-muted-foreground mt-1" />
         <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-semibold">{value}</p>
         </div>
      </div>
   );
}

function TravelerListItemSkeleton() {
    return (
        <div className="flex items-center gap-3 p-2">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-grow space-y-2">
                <div className="h-4 w-3/4 rounded-md bg-muted" />
                <div className="h-3 w-1/2 rounded-md bg-muted" />
            </div>
        </div>
    );
}