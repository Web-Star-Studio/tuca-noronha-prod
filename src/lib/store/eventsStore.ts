import { create } from "zustand";

export interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  price: number;
  image_url: string;
  category: string;
  featured: boolean;
  capacity: number;
  available_spots: number;
  organizer: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  policies?: string; // Added for event policies
  tickets?: EventTicket[]; // Added for event tickets
  short_description?: string; // For display in cards
}

export interface EventTicket {
  id: number;
  event_id: number;
  name: string;
  description?: string;
  price: number;
  available_quantity: number;
  max_per_order: number;
  type: "regular" | "vip" | "discount" | "free";
  benefits?: string[];
}

export interface EventBooking {
  id: number;
  event_id: number;
  user_id: string;
  tickets: number;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled";
  payment_status: "pending" | "paid" | "refunded";
  payment_method?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payment_details?: any;
  created_at: string;
  attendee_info?: AttendeeInfo[];
  event?: {
    id: number;
    name: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    image_url: string;
    // Include other event properties as needed
  };
}

export interface AttendeeInfo {
  name: string;
  email: string;
  document?: string;
  ticketType?: string;
}

export interface EventFilters {
  searchQuery?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "date_asc" | "date_desc" | "price_asc" | "price_desc" | "name";
  limit?: number;
  offset?: number;
}

type EventsStoreState = {
  events: Event[];
  filteredEvents: Event[];
  categories: string[];
  setFilteredEvents: (events: Event[]) => void;
  featuredEvents: Event[];
};

export const useEventsStore = create<EventsStoreState>((set) => ({
  events: [
    {
      id: 1,
      name: "Festival Gastronômico de Noronha",
      description:
        "O Festival Gastronômico reúne os melhores chefs do Brasil em Fernando de Noronha, com pratos exclusivos à base de frutos do mar e ingredientes locais.",
      short_description: "Alta gastronomia na ilha com chefs renomados.",
      date: "2025-07-10",
      start_time: "18:00",
      end_time: "23:00",
      location: "Vila dos Remédios - Praça Central",
      price: 180,
      image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      category: "Gastronômico",
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
          benefits: ["Acesso ao festival", "Degustação de pratos"]
        },
        {
          id: 102,
          event_id: 1,
          name: "VIP Experience",
          price: 320,
          available_quantity: 20,
          max_per_order: 2,
          type: "vip",
          benefits: ["Área VIP", "Degustação premium", "Meet & Greet com chefs"]
        }
      ]
    },
    {
      id: 2,
      name: "Luau na Praia do Cachorro",
      description:
        "Uma noite mágica com música ao vivo, fogueira na areia e drinks tropicais. Traga sua canga e curta o melhor da noite noronhense sob as estrelas.",
      short_description: "Fogueira, música e clima de lua cheia.",
      date: "2025-06-15",
      start_time: "20:00",
      end_time: "00:00",
      location: "Praia do Cachorro",
      price: 100,
      image_url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1969&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      category: "Música ao Vivo",
      featured: true,
      capacity: 150,
      available_spots: 60,
      organizer: "Noronha Noite",
      status: "scheduled",
      policies:
        "Evento sujeito às condições climáticas. Cancelamento com reembolso total em caso de chuva.",
      tickets: [
        {
          id: 103,
          event_id: 2,
          name: "Ingresso Único",
          price: 100,
          available_quantity: 100,
          max_per_order: 5,
          type: "regular",
          benefits: ["Entrada", "Drink de boas-vindas"]
        }
      ]
    },
    {
      id: 3,
      name: "Corrida Ecológica Noronha Trail Run",
      description:
        "Desafie-se em uma corrida ecológica por trilhas incríveis de Fernando de Noronha. Percurso com subidas, mata atlântica e visuais deslumbrantes.",
      short_description: "Corrida desafiadora em meio à natureza.",
      date: "2025-08-22",
      start_time: "07:00",
      end_time: "11:00",
      location: "Trilha do Piquinho",
      price: 150,
      image_url: "https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=2085&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      category: "Esporte",
      featured: true,
      capacity: 300,
      available_spots: 275,
      organizer: "Noronha Ativa",
      status: "scheduled",
      policies:
        "Reembolsos disponíveis até 7 dias antes do evento. Após esse prazo, não haverá reembolso.",
      tickets: [
        {
          id: 104,
          event_id: 3,
          name: "Inscrição Regular",
          price: 150,
          available_quantity: 250,
          max_per_order: 3,
          type: "regular",
          benefits: ["Kit atleta", "Medalha", "Hidratação"]
        },
        {
          id: 105,
          event_id: 3,
          name: "Inscrição VIP",
          price: 250,
          available_quantity: 25,
          max_per_order: 1,
          type: "vip",
          benefits: ["Kit premium", "Camisa exclusiva", "Acesso ao lounge"]
        }
      ]
    },
    {
      id: 4,
      name: "Workshop de Fotografia Marinha",
      description:
        "Aprenda técnicas avançadas de fotografia subaquática com fotógrafos profissionais. Inclui aula teórica e prática com mergulho na Baía dos Porcos.",
      short_description: "Fotografias perfeitas no mundo submarino.",
      date: "2025-07-05",
      start_time: "09:00",
      end_time: "17:00",
      location: "Centro de Visitantes ICMBio",
      price: 350,
      image_url: "https://images.unsplash.com/photo-1744080213179-091b07d559d8?q=80&w=2075&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      category: "Workshop",
      featured: false,
      capacity: 20,
      available_spots: 8,
      organizer: "Noronha Imagem",
      status: "scheduled",
      policies:
        "Requer certificado de mergulho. Equipamento fotográfico pode ser alugado no local.",
      tickets: [
        {
          id: 106,
          event_id: 4,
          name: "Participação Completa",
          price: 350,
          available_quantity: 15,
          max_per_order: 2,
          type: "regular",
          benefits: ["Material didático", "Almoço", "Mergulho guiado"]
        },
        {
          id: 107,
          event_id: 4,
          name: "Apenas Teoria",
          price: 120,
          available_quantity: 5,
          max_per_order: 2,
          type: "discount",
          benefits: ["Material didático", "Almoço"]
        }
      ]
    },
    {
      id: 5,
      name: "Festival de Música de Noronha",
      description:
        "Um festival de música ao ar livre com bandas locais e nacionais, com vistas deslumbrantes do oceano.",
      date: "2025-07-15",
      start_time: "18:00",
      end_time: "23:00",
      location: "Praia do Sancho",
      price: 150,
      image_url:
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      category: "Música",
      featured: true,
      capacity: 300,
      available_spots: 120,
      organizer: "Promoções Noronha",
      status: "scheduled",
      short_description:
        "Festival de música com bandas locais e nacionais na Praia do Sancho",
      tickets: [
        {
          id: 108,
          event_id: 5,
          name: "Ingresso Padrão",
          description: "Acesso ao festival com todas as atrações principais",
          price: 150,
          available_quantity: 100,
          max_per_order: 4,
          type: "regular",
          benefits: ["Acesso a todas as bandas", "Área de alimentação"]
        },
        {
          id: 109,
          event_id: 5,
          name: "Ingresso VIP",
          description: "Acesso premium com área exclusiva e bebidas inclusas",
          price: 300,
          available_quantity: 20,
          max_per_order: 2,
          type: "vip",
          benefits: ["Área VIP", "Open bar", "Área de descanso exclusiva", "Meet & Greet com artistas"]
        }
      ]
    },
    {
      id: 6,
      name: "Feira de Artesanato Local",
      description:
        "Feira com artesanato produzido por moradores da ilha, mostrando a cultura e tradições locais.",
      date: "2025-06-15",
      start_time: "10:00",
      end_time: "18:00",
      location: "Vila dos Remédios",
      price: 0,
      image_url:
        "https://plus.unsplash.com/premium_photo-1714060725310-0a4324bd5842?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      category: "Cultural",
      featured: true,
      capacity: 500,
      available_spots: 500,
      organizer: "Associação de Artesanato",
      status: "scheduled",
      short_description:
        "Feira de artesanato local mostrando a cultura da ilha",
    }
  ],
  filteredEvents: [],
  categories: [
    "Música",
    "Esporte",
    "Workshop",
    "Festa",
    "Cultural",
    "Palestra",
    "Gastronômico",
  ],
  setFilteredEvents: (filteredEvents: Event[]) => set({ filteredEvents }),
  featuredEvents: [],
}));

type EventDetailStore = {
  event: Event | null;
  isLoading: boolean;
  setEvent: (event: Event) => void;
  setLoading: (state: boolean) => void;
};

export const useEventDetailStore = create<EventDetailStore>((set) => ({
  event: null,
  isLoading: true,
  setEvent: (event) => set({ event }),
  setLoading: (state) => set({ isLoading: state }),
}));