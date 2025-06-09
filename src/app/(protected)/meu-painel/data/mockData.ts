import { Reservation, Notification, RecommendationItem } from '../types/dashboard';

export const mockReservations: Reservation[] = [
  {
    id: '1',
    type: 'restaurant',
    name: 'Sol & Mar Noronha',
    date: new Date(2024, 7, 15, 19, 30), // Mês é 0-indexado, então 7 é Agosto
    guests: 2,
    status: 'confirmed',
    location: 'Vila dos Remédios, Fernando de Noronha',
    imageUrl: '/images/restaurant-1.jpg',
  },
  {
    id: '2',
    type: 'accommodation',
    name: 'Pousada Mar Azul',
    checkIn: new Date(2024, 7, 20),
    checkOut: new Date(2024, 7, 25),
    guests: 2,
    status: 'confirmed',
    location: 'Praia do Sueste, Fernando de Noronha',
    imageUrl: '/images/accommodation-1.jpg',
  },
  {
    id: '3',
    type: 'activity',
    name: 'Passeio de Barco - Baía dos Golfinhos',
    date: new Date(2024, 7, 22, 10, 0),
    guests: 2,
    status: 'confirmed',
    location: 'Baía dos Golfinhos, Fernando de Noronha',
    imageUrl: '/images/activity-1.jpg',
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Reserva confirmada',
    description: 'Sua reserva no restaurante Sol & Mar Noronha foi confirmada.',
    date: new Date(2025, 4, 5, 10, 30), // Mês é 0-indexado, então 4 é Maio
    read: false,
    type: 'success'
  },
  {
    id: '2',
    title: 'Pontos adicionados',
    description: 'Você recebeu 500 pontos pela sua última reserva.',
    date: new Date(2025, 4, 5, 9, 15),
    read: true,
    type: 'info'
  },
  {
    id: '3',
    title: 'Oferta especial',
    description: 'Você recebeu um desconto especial de 10% na sua próxima reserva.',
    date: new Date(2025, 4, 4, 14, 25),
    read: true,
    type: 'promotion'
  },
  {
    id: '4',
    title: 'Bem-vindo ao programa de fidelidade',
    description: 'Você agora faz parte do nosso programa de fidelidade e pode acumular pontos.',
    date: new Date(2025, 4, 1, 12, 0),
    read: true,
    type: 'info'
  }
];

export const mockRecommendations: RecommendationItem[] = [
  {
    id: '1',
    type: 'restaurant',
    name: 'Mergulho Gastronômico',
    description: 'Restaurante de frutos do mar com vista para o mar, perfeito para casais.',
    imageUrl: '/images/restaurant-2.jpg',
    rating: 4.9,
    tags: ['Frutos do Mar', 'Vista para o Mar', 'Romântico'],
    isActive: true,
    isFeatured: false,
  },
  {
    id: '2',
    type: 'accommodation',
    name: 'Pousada Horizonte Azul',
    description: 'Pousada com vista panorâmica para o oceano, com café da manhã incluso.',
    imageUrl: '/images/accommodation-2.jpg',
    rating: 4.8,
    tags: ['Vista para o Mar', 'Café da Manhã', 'Piscina'],
    isActive: true,
    isFeatured: true,
  },
  {
    id: '3',
    type: 'activity',
    name: 'Mergulho em Águas Cristalinas',
    description: 'Explore a vida marinha em um dos melhores pontos de mergulho da ilha.',
    imageUrl: '/images/activity-2.jpg',
    rating: 4.7,
    tags: ['Aventura', 'Mergulho', 'Natureza'],
    isActive: false,
    isFeatured: false,
  }
]; 