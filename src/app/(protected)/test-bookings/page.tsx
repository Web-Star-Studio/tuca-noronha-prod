"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ActivityBookingForm,
  EventBookingForm,
  ImprovedRestaurantReservationForm,
  VehicleBookingForm,
  BookingManagementDashboard 
} from "@/components/bookings";

// Mock data for testing
const mockActivity = {
  _id: "activity1" as any,
  title: "Mergulho com Tartarugas Marinhas",
  price: 150,
  minParticipants: 2,
  maxParticipants: 8,
  hasMultipleTickets: true,
};

const mockEvent = {
  _id: "event1" as any,
  title: "Festival de Música Noronha 2024",
  date: "2024-07-15",
  time: "20:00",
  location: "Praia do Cachorro",
  price: 80,
  hasMultipleTickets: true,
};

const mockRestaurant = {
  _id: "restaurant1" as any,
  name: "Restaurante Maré Alta",
  address: {
    street: "Rua da Praia, 123",
    neighborhood: "Vila dos Remédios",
    city: "Fernando de Noronha",
  },
  maximumPartySize: 12,
  acceptsReservations: true,
  hours: {
    Monday: ["18:00-22:00"],
    Tuesday: ["18:00-22:00"],
    Wednesday: ["18:00-22:00"],
    Thursday: ["18:00-22:00"],
    Friday: ["18:00-23:00"],
    Saturday: ["18:00-23:00"],
    Sunday: ["18:00-22:00"],
  },
};

const mockVehicle = {
  _id: "vehicle1" as any,
  pricePerDay: 120,
};

export default function TestBookingsPage() {
  const [activeTab, setActiveTab] = useState("forms");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Sistema de Reservas - Teste</h1>
        <p className="text-gray-600">
          Teste todas as funcionalidades do novo sistema de reservas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="forms">Formulários de Reserva</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard de Gerenciamento</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Activity Booking */}
            <Card>
              <CardHeader>
                <CardTitle>Reserva de Atividade</CardTitle>
                <CardDescription>
                  Teste o formulário de reserva para atividades como mergulho, trilhas, etc.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityBookingForm
                  activityId={mockActivity._id}
                  activity={mockActivity}
                  onBookingSuccess={(booking) => {
                    console.log("Activity booking success:", booking);
                    alert(`Atividade reservada! Código: ${booking.confirmationCode}`);
                  }}
                />
              </CardContent>
            </Card>

            {/* Event Booking */}
            <Card>
              <CardHeader>
                <CardTitle>Compra de Ingresso</CardTitle>
                <CardDescription>
                  Teste o formulário de compra de ingressos para eventos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventBookingForm
                  eventId={mockEvent._id}
                  event={mockEvent}
                  onBookingSuccess={(booking) => {
                    console.log("Event booking success:", booking);
                    alert(`Ingresso comprado! Código: ${booking.confirmationCode}`);
                  }}
                />
              </CardContent>
            </Card>

            {/* Restaurant Reservation */}
            <Card>
              <CardHeader>
                <CardTitle>Reserva de Restaurante</CardTitle>
                <CardDescription>
                  Teste o formulário de reserva de mesa em restaurantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImprovedRestaurantReservationForm
                  restaurantId={mockRestaurant._id}
                  restaurant={mockRestaurant}
                  onReservationSuccess={(reservation) => {
                    console.log("Restaurant reservation success:", reservation);
                    alert(`Mesa reservada! Código: ${reservation.confirmationCode}`);
                  }}
                />
              </CardContent>
            </Card>

            {/* Vehicle Booking */}
            <Card>
              <CardHeader>
                <CardTitle>Locação de Veículo</CardTitle>
                <CardDescription>
                  Teste o formulário de locação de veículos (buggy, carro, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VehicleBookingForm
                  vehicleId={mockVehicle._id}
                  pricePerDay={mockVehicle.pricePerDay}
                />
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle>Como Testar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold">1. Formulários de Reserva:</h4>
                <p className="text-sm text-gray-600">
                  Preencha os formulários acima para testar cada tipo de reserva. 
                  Certifique-se de estar logado na aplicação.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">2. Validações:</h4>
                <p className="text-sm text-gray-600">
                  Teste validações como datas passadas, limites de participantes, 
                  horários de funcionamento, etc.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">3. Dashboard:</h4>
                <p className="text-sm text-gray-600">
                  Use a aba "Dashboard de Gerenciamento" para ver todas as suas reservas 
                  e testar cancelamentos.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">4. Códigos de Confirmação:</h4>
                <p className="text-sm text-gray-600">
                  Após cada reserva, você receberá um código único (formato: TN + timestamp + random).
                  Use estes códigos para buscar reservas específicas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard de Gerenciamento</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as suas reservas em um só lugar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingManagementDashboard />
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardHeader>
              <CardTitle>Funcionalidades do Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold">🔍 Busca e Filtros:</h4>
                <p className="text-sm text-gray-600">
                  Busque por nome, código de confirmação ou filtre por status (pendente, confirmado, cancelado).
                </p>
              </div>
              <div>
                <h4 className="font-semibold">📱 Abas por Serviço:</h4>
                <p className="text-sm text-gray-600">
                  Atividades, Eventos, Restaurantes e Veículos organizados em abas separadas.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">📋 Detalhes Completos:</h4>
                <p className="text-sm text-gray-600">
                  Clique em "Ver detalhes" para informações completas da reserva.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">❌ Cancelamentos:</h4>
                <p className="text-sm text-gray-600">
                  Cancele reservas pendentes diretamente pelo dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}