import { Hosting } from "../store/hostingsStore";

export const hostings: Hosting[] = [
  {
    id: "host-001",
    name: "Pousada Tucano Vista Mar",
    slug: "pousada-tucano-vista-mar",
    description: "Aconchegante pousada com vista panorâmica para o mar de Fernando de Noronha.",
    description_long: "Localizada em um ponto privilegiado da ilha, a Pousada Tucano Vista Mar oferece uma experiência única de hospedagem em Fernando de Noronha. Com quartos amplos e confortáveis, café da manhã caseiro preparado com ingredientes locais e uma vista de tirar o fôlego para o mar azul-turquesa. A apenas 10 minutos a pé da Praia da Conceição e 15 minutos do centro histórico da Vila dos Remédios.",
    address: {
      street: "Rua das Flores, 150",
      city: "Fernando de Noronha",
      state: "PE",
      zipCode: "53990-000",
      neighborhood: "Floresta Velha",
      coordinates: {
        latitude: -3.8434,
        longitude: -32.4233
      }
    },
    phone: "+55 81 3619-1234",
    website: "https://pousadatucano.com.br",
    type: "Pousada",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    pricePerNight: 750,
    currency: "BRL",
    discountPercentage: 10,
    taxes: 50,
    cleaningFee: 120,
    totalRooms: 12,
    maxGuests: 4,
    bedrooms: 1,
    bathrooms: 1,
    beds: {
      single: 0,
      double: 2,
      queen: 0,
      king: 0
    },
    area: 35,
    amenities: [
      "Wi-Fi gratuito",
      "Ar-condicionado",
      "Café da manhã",
      "Piscina",
      "Estacionamento",
      "Vista para o mar",
      "TV",
      "Frigobar",
      "Varanda"
    ],
    houseRules: [
      "Check-in entre 14h e 20h",
      "Proibido fumar nas acomodações",
      "Não é permitido festas ou eventos",
      "Animais de estimação não são permitidos"
    ],
    cancellationPolicy: "Cancelamento grátis até 7 dias antes. Após este prazo, será cobrado 50% do valor total da reserva.",
    petsAllowed: false,
    smokingAllowed: false,
    eventsAllowed: false,
    minimumStay: 3,
    mainImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    galleryImages: [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1590073242678-70ee3fc28f8a?q=80&w=2121&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    ],
    rating: {
      overall: 4.8,
      cleanliness: 4.9,
      location: 5.0,
      checkin: 4.7,
      value: 4.6,
      accuracy: 4.8,
      communication: 4.7,
      totalReviews: 127
    },
    isActive: true,
    isFeatured: true,
    tags: ["Vista para o mar", "Café da manhã", "Piscina"],
    createdAt: "2023-10-15T10:00:00.000Z",
    updatedAt: "2024-11-20T14:30:00.000Z"
  },
  {
    id: "host-002",
    name: "Villa Noronha Luxo",
    slug: "villa-noronha-luxo",
    description: "Experiência exclusiva em uma villa de luxo com piscina privativa e vista panorâmica.",
    description_long: "Villa Noronha Luxo é uma propriedade exclusiva que combina o conforto de uma hospedagem de alto padrão com a experiência única de estar em Fernando de Noronha. Com amplos espaços, decoração sofisticada e vista privilegiada, a villa oferece piscina privativa, deck para relaxamento, cozinha gourmet totalmente equipada e serviço de concierge para organizar os melhores passeios e experiências na ilha.",
    address: {
      street: "Alameda dos Golfinhos, 42",
      city: "Fernando de Noronha",
      state: "PE",
      zipCode: "53990-000",
      neighborhood: "Boldró",
      coordinates: {
        latitude: -3.8440,
        longitude: -32.4200
      }
    },
    phone: "+55 81 99876-5432",
    website: "https://villanoronhaluxo.com.br",
    type: "Villa",
    checkInTime: "15:00",
    checkOutTime: "12:00",
    pricePerNight: 2800,
    currency: "BRL",
    discountPercentage: 0,
    taxes: 150,
    cleaningFee: 350,
    totalRooms: 1,
    maxGuests: 8,
    bedrooms: 3,
    bathrooms: 3,
    beds: {
      single: 2,
      double: 0,
      queen: 2,
      king: 1
    },
    area: 180,
    amenities: [
      "Wi-Fi gratuito",
      "Ar-condicionado",
      "Piscina privativa",
      "Cozinha completa",
      "Churrasqueira",
      "Smart TV",
      "Serviço de limpeza diário",
      "Vista para o mar",
      "Caixa de som bluetooth",
      "Roupas de cama premium",
      "Amenidades de banho premium",
      "Estacionamento",
      "Transfer do aeroporto"
    ],
    houseRules: [
      "Check-in personalizado",
      "Proibido fumar dentro da casa",
      "Festas e eventos sob consulta",
      "Animais de estimação não são permitidos"
    ],
    cancellationPolicy: "Cancelamento grátis até 30 dias antes. Entre 29 e 15 dias, será cobrado 50% do valor. Menos de 15 dias, não há reembolso.",
    petsAllowed: false,
    smokingAllowed: true,
    eventsAllowed: true,
    minimumStay: 5,
    mainImage: "https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    galleryImages: [
      "https://images.unsplash.com/photo-1615874959474-d609969a20ed?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    ],
    rating: {
      overall: 4.9,
      cleanliness: 5.0,
      location: 4.8,
      checkin: 5.0,
      value: 4.7,
      accuracy: 4.9,
      communication: 5.0,
      totalReviews: 42
    },
    isActive: true,
    isFeatured: true,
    tags: ["Luxo", "Piscina privativa", "Vista panorâmica", "Família"],
    createdAt: "2024-02-05T08:15:00.000Z",
    updatedAt: "2025-01-10T11:45:00.000Z"
  },
  {
    id: "host-003",
    name: "Apartamento Praia do Boldró",
    slug: "apartamento-praia-do-boldro",
    description: "Acomodação simples e funcional a poucos minutos da praia do Boldró.",
    description_long: "Apartamento aconchegante e bem localizado, perfeito para viajantes que buscam conforto com bom custo-benefício. Equipado com o necessário para uma estadia tranquila em Fernando de Noronha, fica a apenas 300m da Praia do Boldró e próximo a restaurantes, mercados e pontos de transporte. Ideal para casais ou pequenos grupos que desejam explorar as belezas naturais da ilha.",
    address: {
      street: "Rua do Boldró, 235",
      city: "Fernando de Noronha",
      state: "PE",
      zipCode: "53990-000",
      neighborhood: "Boldró",
      coordinates: {
        latitude: -3.8395,
        longitude: -32.4181
      }
    },
    phone: "+55 81 99765-4321",
    website: "",
    type: "Apartamento",
    checkInTime: "14:00",
    checkOutTime: "10:00",
    pricePerNight: 390,
    currency: "BRL",
    discountPercentage: 15,
    taxes: 30,
    cleaningFee: 80,
    totalRooms: 1,
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    beds: {
      single: 1,
      double: 1,
      queen: 0,
      king: 0
    },
    area: 28,
    amenities: [
      "Wi-Fi gratuito",
      "Ar-condicionado",
      "Cozinha compacta",
      "TV",
      "Frigobar",
      "Roupa de cama e banho",
      "Secador de cabelo"
    ],
    houseRules: [
      "Check-in entre 14h e 18h",
      "Proibido fumar",
      "Não é permitido festas ou eventos",
      "Animais de estimação não são permitidos"
    ],
    cancellationPolicy: "Cancelamento grátis até 5 dias antes. Menos de 5 dias, será cobrado uma diária.",
    petsAllowed: false,
    smokingAllowed: false,
    eventsAllowed: false,
    minimumStay: 2,
    mainImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    galleryImages: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    ],
    rating: {
      overall: 4.5,
      cleanliness: 4.6,
      location: 4.8,
      checkin: 4.4,
      value: 4.7,
      accuracy: 4.5,
      communication: 4.3,
      totalReviews: 89
    },
    isActive: true,
    isFeatured: false,
    tags: ["Econômico", "Próximo à praia", "Casal"],
    createdAt: "2024-05-18T16:20:00.000Z",
    updatedAt: "2025-03-01T09:10:00.000Z"
  },
  {
    id: "host-004",
    name: "Chalé Eco Noronha",
    slug: "chale-eco-noronha",
    description: "Chalé ecológico com energia solar e reuso de água, para viajantes conscientes.",
    description_long: "O Chalé Eco Noronha é um refúgio sustentável para viajantes que apreciam hospitalidade com responsabilidade ambiental. Construído com materiais naturais e de baixo impacto, o chalé funciona com energia solar, sistema de captação de água da chuva e tratamento de águas cinzas. Envolvido pela vegetação nativa, oferece uma experiência autêntica em harmonia com a natureza exuberante da ilha.",
    address: {
      street: "Estrada da Colina, s/n",
      city: "Fernando de Noronha",
      state: "PE",
      zipCode: "53990-000",
      neighborhood: "Sueste",
      coordinates: {
        latitude: -3.8601,
        longitude: -32.4260
      }
    },
    phone: "+55 81 98888-7777",
    website: "https://chaleconoronha.com.br",
    type: "Chalé",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    pricePerNight: 520,
    currency: "BRL",
    discountPercentage: 0,
    taxes: 40,
    cleaningFee: 100,
    totalRooms: 1,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    beds: {
      single: 0,
      double: 0,
      queen: 1,
      king: 0
    },
    area: 45,
    amenities: [
      "Energia solar",
      "Ventiladores de teto",
      "Cozinha equipada",
      "Produtos de limpeza ecológicos",
      "Wi-Fi via satélite",
      "Horta orgânica",
      "Terraço",
      "Chuveiro aquecido solar",
      "Bicicletas para uso dos hóspedes"
    ],
    houseRules: [
      "Check-in entre 15h e 19h",
      "Consumo consciente de água e energia",
      "Separação do lixo para reciclagem",
      "Uso exclusivo de produtos biodegradáveis"
    ],
    cancellationPolicy: "Cancelamento grátis até 14 dias antes. Após este prazo, será cobrado 30% do valor total da reserva.",
    petsAllowed: true,
    smokingAllowed: false,
    eventsAllowed: false,
    minimumStay: 4,
    mainImage: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    galleryImages: [
      "https://images.unsplash.com/photo-1604014888139-fb8c2cefa42b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?q=80&w=2025&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1605551077935-d670abc9f0b9?q=80&w=2068&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    ],
    rating: {
      overall: 4.7,
      cleanliness: 4.8,
      location: 4.6,
      checkin: 4.7,
      value: 4.5,
      accuracy: 4.9,
      communication: 4.8,
      totalReviews: 53
    },
    isActive: true,
    isFeatured: true,
    tags: ["Sustentável", "Ecológico", "Romântico", "Isolado"],
    createdAt: "2024-07-10T13:45:00.000Z",
    updatedAt: "2025-02-15T10:20:00.000Z"
  }
];
