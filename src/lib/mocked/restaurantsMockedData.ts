export const restaurants = [
    {
      id: "resto-001",
      name: "Sol & Mar Noronha",
      slug: "sol-e-mar-noronha",
      description: "Gastronomia sofisticada com ingredientes locais e vista para o mar.",
      description_long: "Localizado na Praia da Conceição, o Sol & Mar Noronha oferece uma fusão de sabores nordestinos e mediterrâneos com um ambiente romântico à beira-mar. Ideal para ocasiões especiais e experiências memoráveis.",
      address: {
        street: "Rua da Praia, 102",
        city: "Fernando de Noronha",
        state: "PE",
        zipCode: "53990-000",
        neighborhood: "Vila dos Remédios",
        coordinates: {
          latitude: -3.8434,
          longitude: -32.4232
        }
      },
      phone: "+55 81 99999-8888",
      website: "https://solemarnoronha.com",
      cuisine: ["Brasileira Contemporânea", "Frutos do Mar", "Mediterrânea"],
      priceRange: "$$$",
      diningStyle: "Fine Dining",
      hours: {
        Monday: ["18:00-22:30"],
        Tuesday: ["18:00-22:30"],
        Wednesday: ["18:00-22:30"],
        Thursday: ["18:00-22:30"],
        Friday: ["18:00-23:00"],
        Saturday: ["13:00-16:00", "18:00-23:00"],
        Sunday: ["13:00-16:00", "18:00-22:00"]
      },
      features: ["Vista para o mar", "Adega", "Private Dining"],
      dressCode: "Casual Chic",
      paymentOptions: ["Visa", "MasterCard", "Pix", "Elo"],
      parkingDetails: "Estacionamento gratuito na frente",
      mainImage: "https://plus.unsplash.com/premium_photo-1661953124283-76d0a8436b87?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmVzdGF1cmFudGV8ZW58MHx8MHx8fDA%3D",
      galleryImages: [
        "https://source.unsplash.com/featured/?fine,dining",
        "https://source.unsplash.com/featured/?seafood"
      ],
      menuImages: [
        "https://source.unsplash.com/featured/?menu",
        "https://source.unsplash.com/featured/?wine"
      ],
      rating: {
        overall: 4.8,
        food: 4.9,
        service: 4.7,
        ambience: 4.9,
        value: 4.6,
        noiseLevel: "Moderate",
        totalReviews: 327
      },
      acceptsReservations: true,
      maximumPartySize: 12,
      tags: ["Romântico", "Vista para o mar", "Vegan Options"],
      executiveChef: "Renata Carvalho",
      privatePartyInfo: "Eventos privativos com música ao vivo e menu personalizado.",
      isActive: true,
      isFeatured: true,
      createdAt: "2024-11-12T18:45:00.000Z",
      updatedAt: "2025-03-01T14:32:00.000Z"
    },
    {
      id: "resto-002",
      name: "Canto do Pescador",
      slug: "canto-do-pescador",
      description: "Comida caseira nordestina em um ambiente rústico e acolhedor.",
      description_long: "Especializado em moquecas, peixes frescos e pratos típicos da região, o Canto do Pescador é o ponto de encontro dos amantes da culinária raiz com tempero forte e sabor marcante.",
      address: {
        street: "Travessa da Vila, 44",
        city: "Fernando de Noronha",
        state: "PE",
        zipCode: "53990-000",
        neighborhood: "Floresta Velha",
        coordinates: {
          latitude: -3.8412,
          longitude: -32.4220
        }
      },
      phone: "+55 81 98888-7777",
      website: "https://cantodopescador.com.br",
      cuisine: ["Nordestina", "Caseira"],
      priceRange: "$$",
      diningStyle: "Casual",
      hours: {
        Monday: ["11:30-15:00", "18:30-21:30"],
        Tuesday: ["11:30-15:00", "18:30-21:30"],
        Wednesday: ["11:30-15:00", "18:30-21:30"],
        Thursday: ["11:30-15:00", "18:30-21:30"],
        Friday: ["11:30-15:00", "18:30-22:00"],
        Saturday: ["11:30-15:30", "18:30-22:00"],
        Sunday: []
      },
      features: ["Pet Friendly", "Pratos para compartilhar"],
      dressCode: "Casual",
      paymentOptions: ["Visa", "MasterCard", "Pix", "Dinheiro"],
      parkingDetails: "Sem estacionamento próprio",
      mainImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      galleryImages: [
        "https://source.unsplash.com/featured/?moqueca",
        "https://source.unsplash.com/featured/?rustic,restaurant"
      ],
      menuImages: [
        "https://source.unsplash.com/featured/?menu,nordeste"
      ],
      rating: {
        overall: 4.5,
        food: 4.7,
        service: 4.4,
        ambience: 4.3,
        value: 4.7,
        noiseLevel: "Quiet",
        totalReviews: 182
      },
      acceptsReservations: false,
      maximumPartySize: 8,
      tags: ["Local", "Barato", "Sem glúten"],
      executiveChef: "Pedro Nascimento",
      privatePartyInfo: "Atende festas de aniversário e grupos turísticos mediante reserva antecipada.",
      isActive: true,
      isFeatured: false,
      createdAt: "2023-06-01T12:00:00.000Z",
      updatedAt: "2025-01-10T09:12:00.000Z"
    },
    {
      id: "resto-003",
      name: "Raízes Veganas",
      slug: "raizes-veganas",
      description: "Opções veganas criativas e sustentáveis com ingredientes orgânicos da ilha.",
      description_long: "Raízes Veganas é o primeiro restaurante 100% plant-based de Fernando de Noronha. Com um menu sazonal, pratos coloridos e sucos funcionais, promove saúde e sustentabilidade no paraíso.",
      address: {
        street: "Av. Noronha Sustentável, 71",
        city: "Fernando de Noronha",
        state: "PE",
        zipCode: "53990-000",
        neighborhood: "Boldró",
        coordinates: {
          latitude: -3.8480,
          longitude: -32.4265
        }
      },
      phone: "+55 81 98765-1234",
      website: "https://raizesveganasnoronha.com",
      cuisine: ["Vegana", "Orgânica", "Saudável"],
      priceRange: "$$",
      diningStyle: "Casual",
      hours: {
        Monday: ["12:00-16:00"],
        Tuesday: ["12:00-16:00"],
        Wednesday: ["12:00-16:00"],
        Thursday: ["12:00-16:00"],
        Friday: ["12:00-16:00", "18:00-21:00"],
        Saturday: ["12:00-17:00", "18:00-21:00"],
        Sunday: ["12:00-17:00"]
      },
      features: ["Orgânico", "Pet Friendly", "Takeout"],
      dressCode: "Casual",
      paymentOptions: ["Pix", "Visa", "MasterCard"],
      parkingDetails: "Estacionamento compartilhado ao lado",
      mainImage: "https://plus.unsplash.com/premium_photo-1724707432836-aefde6bffb72?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      galleryImages: [
        "https://source.unsplash.com/featured/?plantbased",
        "https://source.unsplash.com/featured/?healthy,dish"
      ],
      menuImages: [
        "https://source.unsplash.com/featured/?vegan,menu"
      ],
      rating: {
        overall: 4.6,
        food: 4.8,
        service: 4.5,
        ambience: 4.4,
        value: 4.7,
        noiseLevel: "Quiet",
        totalReviews: 95
      },
      acceptsReservations: true,
      maximumPartySize: 10,
      tags: ["100% Vegano", "Sustentável", "Orgânico", "Sem lactose"],
      executiveChef: "Camila Duarte",
      privatePartyInfo: "Oferece workshops de culinária vegana para grupos fechados.",
      isActive: true,
      isFeatured: true,
      createdAt: "2024-02-20T16:00:00.000Z",
      updatedAt: "2025-04-15T10:30:00.000Z"
    }
  ];