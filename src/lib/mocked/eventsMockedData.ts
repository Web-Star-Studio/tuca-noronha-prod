import { Event } from "../store/eventsStore";

export const events: Event[] = [
    {
      id: 1,
      name: "Festival Gastronômico de Noronha",
      description: "O Festival Gastronômico reúne os melhores chefs do Brasil em Fernando de Noronha, com pratos exclusivos à base de frutos do mar e ingredientes locais.",
      short_description: "Alta gastronomia na ilha com chefs renomados.",
      date: "2025-07-10",
      start_time: "18:00",
      end_time: "23:00",
      location: "Vila dos Remédios - Praça Central",
      price: 180,
      image_url: "https://source.unsplash.com/featured/?gourmet,food,beach",
      category: "Gastronomia",
      featured: true,
      capacity: 200,
      available_spots: 120,
      organizer: "Associação Gastronômica Noronha",
      status: "scheduled",
      policies: "Cancelamentos permitidos até 72h antes com reembolso total.",
      tickets: [
        {
          id: 101,
          event_id: 1,
          name: "Entrada Regular",
          price: 180,
          available_quantity: 100,
          max_per_order: 4,
          type: "regular",
          benefits: ["Acesso completo ao festival", "Degustação de pratos"]
        },
        {
          id: 102,
          event_id: 1,
          name: "VIP Experience",
          price: 320,
          available_quantity: 20,
          max_per_order: 2,
          type: "vip",
          benefits: ["Área exclusiva", "Degustação premium", "Meet & Greet com chefs"]
        }
      ]
    },
    {
      id: 2,
      name: "Luau na Praia do Cachorro",
      description: "Uma noite mágica com música ao vivo, fogueira na areia e drinks tropicais. Traga sua canga e curta o melhor da noite noronhense sob as estrelas.",
      short_description: "Fogueira, música e clima de lua cheia.",
      date: "2025-06-15",
      start_time: "20:00",
      end_time: "00:00",
      location: "Praia do Cachorro",
      price: 100,
      image_url: "https://source.unsplash.com/featured/?beach,fire,music",
      category: "Música ao Vivo",
      featured: false,
      capacity: 150,
      available_spots: 60,
      organizer: "Noronha Noite",
      status: "scheduled",
      policies: "Evento sujeito às condições climáticas. Cancelamento com reembolso em caso de chuva.",
      tickets: [
        {
          id: 103,
          event_id: 2,
          name: "Ingresso Único",
          price: 100,
          available_quantity: 100,
          max_per_order: 5,
          type: "regular",
          benefits: ["Entrada ao luau", "Drink de boas-vindas"]
        }
      ]
    },
    {
      id: 3,
      name: "Corrida Ecológica Noronha Trail Run",
      description: "Desafie-se em uma corrida ecológica por trilhas incríveis de Fernando de Noronha. Percurso com subidas, mata atlântica e visuais deslumbrantes.",
      short_description: "Corrida desafiadora em meio à natureza.",
      date: "2025-08-22",
      start_time: "07:00",
      end_time: "11:00",
      location: "Trilha do Piquinho",
      price: 150,
      image_url: "https://source.unsplash.com/featured/?trailrunning,nature,athlete",
      category: "Esporte",
      featured: true,
      capacity: 300,
      available_spots: 275,
      organizer: "Noronha Ativa",
      status: "scheduled",
      policies: "Reembolsos disponíveis até 7 dias antes do evento.",
      tickets: [
        {
          id: 104,
          event_id: 3,
          name: "Inscrição Geral",
          price: 150,
          available_quantity: 250,
          max_per_order: 3,
          type: "regular",
          benefits: ["Kit atleta", "Medalha de participação", "Hidratação no percurso"]
        },
        {
          id: 105,
          event_id: 3,
          name: "Inscrição VIP",
          price: 250,
          available_quantity: 25,
          max_per_order: 1,
          type: "vip",
          benefits: ["Kit premium", "Acesso ao lounge pós-corrida", "Camisa exclusiva"]
        }
      ]
    }
  ];
  