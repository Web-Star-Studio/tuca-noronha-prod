"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Camera, Umbrella, Fish } from "lucide-react";
import Image from "next/image";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function DestinationHighlight() {
  return (
    <section className="py-24 lg:py-32 bg-linear-to-r from-blue-100 to-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Conteúdo esquerdo */}
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-6">
              Conheça o Paraíso Brasileiro
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Fernando de Noronha é um arquipélago vulcânico situado a 354 km da
              costa do estado de Pernambuco. Com águas cristalinas,
              biodiversidade marinha exuberante e praias deslumbrantes, o local é
              considerado Patrimônio Natural da Humanidade pela UNESCO.
            </p>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6 mb-10"
            >
              {[
                {
                  icon: <MapPin className="h-6 w-6 text-blue-600" />,
                  title: "21 Praias",
                  desc: "Cada uma com sua beleza única",
                },
                {
                  icon: <Camera className="h-6 w-6 text-blue-600" />,
                  title: "10+ Mirantes",
                  desc: "Vistas panorâmicas incríveis",
                },
                {
                  icon: <Umbrella className="h-6 w-6 text-blue-600" />,
                  title: "Clima Perfeito",
                  desc: "Temperatura média de 28°C",
                },
                {
                  icon: <Fish className="h-6 w-6 text-blue-600" />,
                  title: "Vida Marinha",
                  desc: "Golfinhos, tartarugas e mais",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-200 text-blue-600 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Link href="/sobre">
                <Button
                  className="rounded-full px-8 py-6 bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 group"
                  size="lg"
                >
                  <span className="font-medium">Descubra Mais</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Grid de imagens à direita */}
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="grid grid-cols-12 grid-rows-6 gap-4 h-[550px]">
              {[
                "https://images.unsplash.com/photo-1583078576654-8d59f064b6b1?q=80&w=2127&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                "https://images.unsplash.com/photo-1593193391560-76ce8e2b313c?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                "https://images.unsplash.com/photo-1653937270172-74c3977ad2b8?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              ].map((src, idx) => {
                const spanClasses =
                  idx === 0 ? "col-span-7 row-span-6" : "col-span-5 row-span-3";
                return (
                  <motion.div
                    key={src}
                    className={`${spanClasses} rounded-2xl overflow-hidden shadow-xl`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Image
                      src={src}
                      alt={`Imagem Noronha ${idx + 1}`}
                      className="w-full h-full object-cover"
                      width={1000}
                      height={1000}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
