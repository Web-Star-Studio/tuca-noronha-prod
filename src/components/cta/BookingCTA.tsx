"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BookingCTA() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-50 via-gray-50 to-blue-50" />
        
        {/* Decorative elements */}
        <motion.div 
          className="absolute -top-10 right-20 opacity-10 text-blue-300"
          animate={{ 
            y: [0, 10, 0],
            rotate: [0, 3, 0]
          }}
          transition={{ 
            duration: 8, 
            ease: "easeInOut", 
            repeat: Infinity 
          }}
        >
          <Sparkles className="w-72 h-72" />
        </motion.div>
        
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl">
            {/* Background image/pattern */}
            <div className="absolute inset-0 opacity-10">
              <Image
                src="/images/bg-pattern.png"
                alt="Pattern"
                fill
                className="object-cover opacity-20"
              />
            </div>
            
            {/* Content wrapper */}
            <div className="relative z-10 lg:grid lg:grid-cols-5 items-center">
              {/* Left side - Content */}
              <div className="col-span-3 p-10 lg:p-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                    Transforme seus sonhos em memórias
                    <span className="text-blue-200"> inesquecíveis</span> em Noronha
                  </h2>
                  
                  <p className="text-white/80 text-lg mb-8 max-w-xl">
                    Não espere mais para viver a experiência única que Fernando de Noronha oferece. 
                    Reserve agora e garanta momentos que ficarão para sempre em suas melhores lembranças.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Calendar className="w-4 h-4 text-blue-200" />
                      <span className="text-white text-sm">Disponibilidade imediata</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                      <MapPin className="w-4 h-4 text-blue-200" />
                      <span className="text-white text-sm">Melhores localizações</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <Link href="/pacotes">
                      <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-full px-8">
                        Explorar pacotes
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    
                    <Link href="/atividades">
                      <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white rounded-full px-8 border border-white/20">
                        Ver atividades
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>
              
              {/* Right side - Image */}
              <div className="hidden lg:block col-span-2 h-full relative">
                <div className="absolute -right-10 inset-y-0">
                  <motion.div 
                    className="relative h-full w-[380px]"
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-l from-transparent to-blue-600 z-10" />
                    <Image
                      src="https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=1200&auto=format&fit=crop"
                      alt="Fernando de Noronha"
                      fill
                      className="object-cover rounded-l-3xl"
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-center">
            {[
              { value: "98%", label: "Clientes satisfeitos" },
              { value: "20+", label: "Anos de experiência" },
              { value: "150+", label: "Pacotes exclusivos" },
              { value: "5000+", label: "Viagens realizadas" }
            ].map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <p className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}