'use client'

import { useHostingsStore } from "@/lib/store/hostingsStore";
import HostingCard from "@/components/cards/HostingCard";
import { ArrowRight, Home } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function FeaturedHostings() {
  const { hostings } = useHostingsStore();
  
  // Filtrar apenas as hospedagens destacadas
  const featuredHostings = hostings.filter(hosting => hosting.isFeatured);
  
  return (
    <section className="py-24 relative overflow-hidden bg-blue-50/30">
      {/* Background design elements */}
      <div className="absolute top-0 right-0 -z-10 opacity-10">
        <Home className="w-72 h-72 text-blue-200" />
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
              Onde Se Hospedar
            </h2>
            <p className="text-xl text-muted-foreground">
              Encontre as melhores acomodações em Fernando de Noronha
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-6 md:mt-0"
          >
            <Link href="/hospedagens" className="text-blue-600 font-medium flex items-center group hover:underline">
              Ver todas as hospedagens
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {featuredHostings.map((hosting) => (
            <motion.div
              key={hosting.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <HostingCard hosting={hosting} />
            </motion.div>
          ))}
        </motion.div>
        
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
              <h3 className="text-2xl font-bold mb-2">Procurando hospedagem ideal?</h3>
              <p className="text-gray-600">Temos opções para todos os perfis e orçamentos.</p>
            </div>
            <Link 
              href="/hospedagens" 
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Explorar opções
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
