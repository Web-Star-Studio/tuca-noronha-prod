/**
 * Categorias de veículos e preços base - Tarifário 2025
 * Morro do Farol - Fernando de Noronha
 */

export const VEHICLE_CATEGORIES = {
  "bike-eletrica": {
    label: "Bike Elétrica",
    basePricePerDay: 165.00,
  },
  "moto-xre-190": {
    label: "Moto XRE 190",
    basePricePerDay: 220.00,
  },
  "buggy": {
    label: "Buggy",
    basePricePerDay: 440.00,
  },
  "uno-gol": {
    label: "Uno/Gol",
    basePricePerDay: 495.00,
  },
  "jimny-4x4": {
    label: "Jimny 4X4",
    basePricePerDay: 550.00,
  },
  "oroch": {
    label: "Oroch",
    basePricePerDay: 550.00,
  },
  "duster": {
    label: "Duster",
    basePricePerDay: 605.00,
  },
  "jeep-renegade-diesel-4x4": {
    label: "Jeep Renegade Diesel 4X4",
    basePricePerDay: 700.00,
  },
  "l200-triton-diesel-4x4": {
    label: "L200 Triton Diesel 4X4",
    basePricePerDay: 770.00,
  },
  "sprinter-17-1": {
    label: "Sprinter 17 +1",
    basePricePerDay: 2500.00,
  },
} as const;

export type VehicleCategoryKey = keyof typeof VEHICLE_CATEGORIES;

/**
 * Obtém o label legível de uma categoria
 */
export function getCategoryLabel(category: string): string {
  return VEHICLE_CATEGORIES[category as VehicleCategoryKey]?.label || category;
}

/**
 * Obtém o preço base por dia de uma categoria
 */
export function getCategoryBasePrice(category: string): number {
  return VEHICLE_CATEGORIES[category as VehicleCategoryKey]?.basePricePerDay || 0;
}

/**
 * Lista ordenada de categorias para exibição em filtros e selects
 */
export const VEHICLE_CATEGORIES_LIST = Object.entries(VEHICLE_CATEGORIES).map(
  ([value, { label, basePricePerDay }]) => ({
    value,
    label,
    basePricePerDay,
  })
);
