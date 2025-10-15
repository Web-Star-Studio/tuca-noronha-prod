import { create } from "zustand";


export interface ActivityTicket {
  id: string;
  activityId: string;
  name: string;
  description: string;
  price: number;
  availableQuantity: number;
  maxPerOrder: number;
  type: string;
  benefits: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface Activity {
  id: string;
  _id?: string;
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  netRate: number;
  availableTimes: string[];
  category: string;
  duration: string;
  maxParticipants: number;
  minParticipants: number;
  difficulty: string; 
  rating: number;
  adminRating?: number; // Classificação definida pelo admin (0-5)
  imageUrl: string;
  galleryImages: string[];
  highlights: string[];
  includes: string[];
  itineraries: string[];
  itinerary?: any[];
  excludes: string[];
  additionalInfo: string[];
  cancelationPolicy: string[];
  requirements?: string[];
  safetyGuidelines?: string[];
  isFeatured: boolean;
  isActive: boolean;
  isFree?: boolean; // Asset gratuito (sem pagamento)
  hasMultipleTickets?: boolean;
  tickets?: ActivityTicket[];
  ticketTypes?: any[];
  createdAt: string | Date;
  updatedAt?: string | Date;
  partnerId?: string; // Reference to the user who created the activity
  supplierId?: string; // Reference to the supplier (fornecedor)
  creatorName?: string; // Name of the user who created the activity
  creatorEmail?: string; // Email of the user who created the activity
  creatorImage?: string; // Profile image URL of the creator
  _loadTickets?: () => Promise<ActivityTicket[]>; // Function to load tickets data when needed
}

type ActivitiesStore = {
  activities: Activity[];
  categories: string[];
  filteredActivities: Activity[];
  setActivities: (activities: Activity[]) => void;
  setFilteredActivities: (activities: Activity[]) => void;
  featuredActivities: Activity[];
};


const activitiesStore = create<ActivitiesStore>((set) => ({
  activities: [],
  setActivities: (activities: Activity[]) => set({ 
    activities,
    filteredActivities: activities,
    featuredActivities: activities.filter((activity) => activity.isFeatured)
  }),
  filteredActivities: [],
  setFilteredActivities: (filteredActivities: Activity[]) => set({ filteredActivities }),
  categories: ['Aquático', 'Mergulho', 'Barco', 'Ecológico', 'Histórico', 'Terrestre', 'Trilha'],
  featuredActivities: [],
}));

export default activitiesStore;
