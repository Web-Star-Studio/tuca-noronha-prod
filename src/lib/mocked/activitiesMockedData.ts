import { Activity } from "../store/activitiesStore";

export const mockedActivities: Activity[] = [
    {
      id: "4",
      title: "Tour Completo pela Ilha",
      description: "Um tour completo por toda a ilha de Fernando de Noronha, visitando as principais praias, mirantes e pontos históricos. Perfeito para quem quer conhecer tudo em um só dia.",
      shortDescription: "Conheça todos os principais pontos da ilha em um dia.",
      price: 350,
      category: "Terrestre",
      duration: "6 horas",
      maxParticipants: 12,
      minParticipants: 4,
      difficulty: "Fácil",
      rating: 4.9,
      imageUrl: "https://images.unsplash.com/photo-1583078576654-8d59f064b6b1?q=80&w=2127&auto=format&fit=crop",
      galleryImages: [
        "https://images.unsplash.com/photo-1593193391560-76ce8e2b313c?q=80&w=1935&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1653937270172-74c3977ad2b8?q=80&w=1935&auto=format&fit=crop"
      ],
      highlights: [
        "Visita a 8+ praias em um único dia",
        "Paradas em mirantes com vista panorâmica",
        "Explicações sobre história e ecologia da ilha"
      ],
      includes: [
        "Transporte em veículo 4x4",
        "Guia especializado",
        "Almoço típico",
        "Água e frutas"
      ],
      itineraries: [
        "Saída do centro às 8h",
        "Visita às praias do lado oeste pela manhã",
        "Almoço em restaurante local",
        "Visita às praias do lado leste à tarde",
        "Retorno ao centro às 16h"
      ],
      excludes: [
        "Taxa de preservação ambiental",
        "Bebidas alcoólicas"
      ],
      additionalInfo: [
        "Traga protetor solar, chapéu e roupas leves",
        "Calçados confortáveis recomendados"
      ],
      cancelationPolicy: [
        "Cancelamento com até 48h: reembolso integral",
        "Menos de 48h: 50% de reembolso"
      ],
      isFeatured: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "1",
      title: "Trilha do Atalaia",
      description: "Explore as piscinas naturais da Trilha do Atalaia, uma das experiências mais preservadas de Noronha. A caminhada leva a uma belíssima piscina natural repleta de vida marinha.",
      shortDescription: "Caminhada ecológica até piscinas naturais.",
      price: 150,
      category: "Trilha",
      duration: "2 horas",
      maxParticipants: 6,
      minParticipants: 2,
      difficulty: "Média",
      rating: 4.8,
      imageUrl: "https://viagenseoutrashistorias.com.br/wp-content/uploads/2020/11/trilha-da-atalaia-noronha-9.jpg",
      galleryImages: [
        "https://viagenseoutrashistorias.com.br/wp-content/uploads/2020/11/trilha-da-atalaia-noronha-9.jpg",
        "https://viagenseoutrashistorias.com.br/wp-content/uploads/2020/11/trilha-da-atalaia-noronha-9.jpg"
      ],
      highlights: [
        "Piscina natural com visibilidade incrível",
        "Observação de peixes e corais",
        "Trilha com monitor ambiental"
      ],
      includes: [
        "Guia credenciado",
        "Seguro aventura"
      ],
      itineraries: [
        "Ponto de encontro na sede do ICMBio",
        "Caminhada até a entrada da trilha",
        "Chegada à piscina do Atalaia",
        "Tempo para banho e observação marinha"
      ],
      excludes: [
        "Transporte até o ponto de encontro",
        "Alimentação"
      ],
      additionalInfo: [
        "Necessário agendamento prévio",
        "Levar roupa de banho e protetor solar biodegradável"
      ],
      cancelationPolicy: [
        "Cancelamento com até 48h: reembolso integral",
        "Menos de 48h: 50% de reembolso"
      ],
      isFeatured: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "2",
      title: "Passeio de Barco com Pôr do Sol",
      description: "Um passeio de barco inesquecível pelas águas cristalinas de Noronha, com parada para banho e finalização ao pôr do sol na Baía dos Golfinhos.",
      shortDescription: "Passeio de barco com parada para banho e pôr do sol.",
      price: 250,
      category: "Barco",
      duration: "3 horas",
      maxParticipants: 20,
      minParticipants: 1,
      difficulty: "Fácil",
      rating: 4.9,
      imageUrl: "https://www.viagenscinematograficas.com.br/wp-content/uploads/2019/06/Fernando-de-Noronha-Passeio-de-Barco-Capa.jpg",
      galleryImages: [
        "https://www.viagenscinematograficas.com.br/wp-content/uploads/2019/06/Fernando-de-Noronha-Passeio-de-Barco-Capa.jpg",
        "https://www.viagenscinematograficas.com.br/wp-content/uploads/2019/06/Fernando-de-Noronha-Passeio-de-Barco-Capa.jpg"
      ],
      highlights: [
        "Vista da ilha pelo mar",
        "Banho de mar em locais paradisíacos",
        "Pôr do sol inesquecível"
      ],
      includes: [
        "Capitão e tripulação",
        "Bebidas não alcoólicas",
        "Equipamento de snorkel"
      ],
      itineraries: [
        "Saída do Porto de Santo Antônio",
        "Navegação pela costa com paradas para banho",
        "Pôr do sol na Baía dos Golfinhos"
      ],
      excludes: [
        "Transporte até o porto",
        "Bebidas alcoólicas"
      ],
      additionalInfo: [
        "Recomenda-se levar toalha e protetor solar",
        "Passeio sujeito a condições climáticas"
      ],
      cancelationPolicy: [
        "Cancelamento com até 24h: reembolso integral",
        "Menos de 24h: não reembolsável"
      ],
      isFeatured: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "3",
      title: "Mergulho com Cilindro na Praia do Porto",
      description: "Experimente a vida submarina de Noronha com mergulho com cilindro, acompanhado por instrutores experientes. Ideal para iniciantes.",
      shortDescription: "Mergulho guiado com cilindro na Praia do Porto.",
      price: 420,
      category: "Mergulho",
      duration: "1 hora e 30 minutos",
      maxParticipants: 4,
      minParticipants: 1,
      difficulty: "Moderada",
      rating: 4.7,
      imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2970&auto=format&fit=crop",
      galleryImages: [
        "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?q=80&w=2970&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1560275619-4cc5fa59d3ae?q=80&w=2919&auto=format&fit=crop"
      ],
      highlights: [
        "Mergulho com cilindro em águas claras",
        "Observação de tartarugas e peixes coloridos",
        "Acompanhamento por instrutores certificados"
      ],
      includes: [
        "Equipamento completo de mergulho",
        "Instrução teórica e prática",
        "Guia/instrutor certificado"
      ],
      itineraries: [
        "Recepção na base de mergulho",
        "Orientação e preparação",
        "Mergulho guiado de 30 a 40 minutos"
      ],
      excludes: [
        "Fotos e vídeos do mergulho (opcional, à parte)"
      ],
      additionalInfo: [
        "Atividade não recomendada para gestantes",
        "Obrigatório saber nadar"
      ],
      cancelationPolicy: [
        "Cancelamento com 72h de antecedência: reembolso total",
        "Menos de 72h: 50% de reembolso"
      ],
      isFeatured: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  