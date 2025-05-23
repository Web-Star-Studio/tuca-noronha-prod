'use client'

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import VehicleCard from "@/components/cards/VehicleCard";
import { ArrowRight, Car, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// Define a function to get featured vehicles
const useFeaturedVehicles = () => {
  const result = useQuery(api.vehicles.queries.listVehicles, {
    paginationOpts: { limit: 4, cursor: null },
    status: "available" // Only show available vehicles
  });

  const vehicles = result?.vehicles || [];
  const isLoading = result === undefined;

  return { vehicles, isLoading };
};

export default function FeaturedVehicles() {
  const { vehicles: featuredVehicles, isLoading } = useFeaturedVehicles();
  
  return (
    <section className="py-24 relative overflow-hidden bg-slate-50/30">
      {/* Background design elements */}
      <div className="absolute top-0 right-0 -z-10 opacity-10">
        <Car className="w-72 h-72 text-blue-200" />
      </div>
      <div className="absolute bottom-20 left-10 -z-10 opacity-5">
        <Image 
          src="/images/bg-pattern.png" 
          alt="Pattern" 
          width={500} 
          height={500} 
          className="opacity-20"
        />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-4">
              Veículos para Explorar
            </h2>
            <p className="text-xl text-muted-foreground">
              Mobilidade e conforto para sua experiência em Fernando de Noronha
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-6 md:mt-0"
          >
            <Link href="/veiculos" className="text-blue-600 font-medium flex items-center group hover:underline">
              Ver todos os veículos
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando veículos em destaque...</span>
          </div>
        ) : featuredVehicles.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {featuredVehicles.map((vehicle) => (
              <motion.div
                key={vehicle._id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <VehicleCard vehicle={vehicle} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-gray-500">
              Nenhum veículo em destaque encontrado
            </p>
          </div>
        )}
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-100"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-10">
              <h3 className="text-2xl font-bold mb-2">Liberdade para explorar</h3>
              <p className="text-gray-600">Escolha o veículo ideal para sua aventura em Fernando de Noronha.</p>
            </div>
            <Link 
              href="/veiculos" 
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Alugar veículo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 