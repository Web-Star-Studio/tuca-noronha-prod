import { create } from "zustand";
import { mockedActivities } from "../mocked/activitiesMockedData";

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
  createdAt: Date;
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
