"use client"

import activitiesStore from "@/lib/store/activitiesStore"
import { useRestaurantsStore } from "@/lib/store/restaurantsStore"
import { Calendar, DollarSign, MapPin, PackageSearch, PieChart, ShoppingBag, Utensils, Users, Car } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ElementType
}) {
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg border-none transition-all duration-300 ease-in-out hover:translate-y-[-2px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">{title}</CardTitle>
        <div className="p-2 rounded-full bg-blue-50">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function RecentActivities() {
  const activities = activitiesStore(state => state.activities)
  const recentActivities = activities.slice(0, 5)
  
  return (
    <Card className="col-span-3 bg-white/90 backdrop-blur-sm shadow-md border-none overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100">
        <CardTitle className="text-slate-800">Atividades Recentes</CardTitle>
        <CardDescription>Últimas 5 atividades cadastradas no sistema</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {recentActivities.map(activity => (
            <div key={activity.id} className="flex items-center p-4 hover:bg-slate-50 transition-colors duration-200">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-4 relative">
                {activity.imageUrl && activity.imageUrl.trim() !== '' ? (
                  <Image 
                    src={activity.imageUrl} 
                    alt={activity.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.title}</p>
                <p className="text-sm text-muted-foreground">R$ {activity.price.toFixed(2)}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(activity.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentRestaurants() {
  const restaurants = useRestaurantsStore(state => state.restaurants)
  const recentRestaurants = restaurants.slice(0, 5)
  
  return (
    <Card className="col-span-3 bg-white/90 backdrop-blur-sm shadow-md border-none overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100">
        <CardTitle className="text-slate-800">Restaurantes Recentes</CardTitle>
        <CardDescription>Últimos 5 restaurantes cadastrados no sistema</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {recentRestaurants.map(restaurant => (
            <div key={restaurant.id} className="flex items-center p-4 hover:bg-slate-50 transition-colors duration-200">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-4 relative">
                {restaurant.mainImage && restaurant.mainImage.trim() !== '' ? (
                  <Image 
                    src={restaurant.mainImage} 
                    alt={restaurant.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{restaurant.name}</p>
                <p className="text-sm text-muted-foreground">{restaurant.cuisine.join(', ')}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {restaurant.priceRange}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const activities = activitiesStore(state => state.activities)
  const restaurants = useRestaurantsStore(state => state.restaurants)
  const featuredActivities = activitiesStore(state => state.featuredActivities)
  const featuredRestaurants = useRestaurantsStore(state => state.featuredRestaurants)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">Dashboard</h2>
        <p className="text-muted-foreground text-sm">
          Visão geral das operações do sistema TN Next.
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="bg-white/80 backdrop-blur-sm border-none shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Visão Geral</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Relatórios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <DashboardCard
              title="Atividades"
              value={activities.length.toString()}
              description="Total de atividades cadastradas"
              icon={PackageSearch}
            />
            <DashboardCard
              title="Restaurantes"
              value={restaurants.length.toString()}
              description="Total de restaurantes cadastrados"
              icon={Utensils}
            />
            <DashboardCard
              title="Veículos"
              value="0"
              description="Total de veículos disponíveis"
              icon={Car}
            />
            <DashboardCard
              title="Em Destaque"
              value={(featuredActivities.length + featuredRestaurants.length).toString()}
              description="Itens em destaque no site"
              icon={ShoppingBag}
            />
            <DashboardCard
              title="Reservas"
              value="142"
              description="Reservas realizadas (último mês)"
              icon={Calendar}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <RecentActivities />
            <Card className="col-span-4 bg-white/90 backdrop-blur-sm shadow-md border-none overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100">
                <CardTitle className="text-slate-800">Visão Geral de Vendas</CardTitle>
                <CardDescription>Vendas por categoria nas últimas semanas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-muted-foreground bg-gradient-to-br from-slate-50 to-white rounded-md">
                  <div className="flex items-center justify-center p-10 rounded-full bg-blue-50/70 shadow-inner">
                    <PieChart className="mr-2 text-blue-600" size={24} /> 
                    <span className="text-slate-600 font-medium">Gráfico de Vendas (Mock)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-white/90 backdrop-blur-sm shadow-md border-none overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100">
                <CardTitle className="text-slate-800">Atividade Recente no Site</CardTitle>
                <CardDescription>Visitas e ações de usuários nas últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">248 novos visitantes</p>
                    </div>
                    <div className="text-sm text-muted-foreground">hoje</div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">86 visualizações de atividades</p>
                    </div>
                    <div className="text-sm text-muted-foreground">hoje</div>
                  </div>
                  <div className="flex items-center">
                    <Utensils className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">54 visualizações de restaurantes</p>
                    </div>
                    <div className="text-sm text-muted-foreground">hoje</div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">32 visualizações de eventos</p>
                    </div>
                    <div className="text-sm text-muted-foreground">hoje</div>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">12 reservas realizadas</p>
                    </div>
                    <div className="text-sm text-muted-foreground">hoje</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <RecentRestaurants />
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm shadow-md border-none overflow-hidden transition-all duration-300 ease-in-out">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100">
              <CardTitle className="text-slate-800">Relatórios</CardTitle>
              <CardDescription>Visualize relatórios detalhados do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white rounded-lg">
                <div className="text-slate-500 p-8 rounded-xl bg-blue-50/50 shadow-inner flex flex-col items-center">
                  <PieChart className="h-10 w-10 mb-3 text-blue-600 opacity-50" />
                  <span className="font-medium">Área de relatórios detalhados a ser implementada.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
