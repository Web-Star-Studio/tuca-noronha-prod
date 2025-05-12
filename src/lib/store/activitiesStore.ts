import { create } from "zustand";
import { mockedActivities } from "../mocked/activitiesMockedData";

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
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  category: string;
  duration: string;
  maxParticipants: number;
  minParticipants: number;
  difficulty: string; 
  rating: number;
  imageUrl: string;
  galleryImages: string[];
  highlights: string[];
  includes: string[];
  itineraries: string[];
  excludes: string[];
  additionalInfo: string[];
  cancelationPolicy: string[];
  isFeatured: boolean;
  isActive: boolean;
  hasMultipleTickets?: boolean;
  tickets?: ActivityTicket[];
  createdAt: Date;
  updatedAt?: Date;
  partnerId?: string; // Reference to the user who created the activity
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
  activities: mockedActivities,
  setActivities: (activities: Activity[]) => set({ activities }),
  filteredActivities: mockedActivities, // Inicializa com os mesmos dados
  setFilteredActivities: (filteredActivities: Activity[]) => set({ filteredActivities }),
  categories: ['Aquático', 'Mergulho', 'Barco', 'Ecológico', 'Histórico', 'Terrestre', 'Trilha'],
  featuredActivities: mockedActivities.filter((activity) => activity.isFeatured),
}));

export default activitiesStore;
