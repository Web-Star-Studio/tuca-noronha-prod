export const mockTickets = [
  {
    id: 1,
    event_id: 1,
    name: "Ingresso Padrão",
    description: "Acesso ao festival com todas as atrações principais",
    price: 150,
    available_quantity: 100,
    max_per_order: 4,
    type: "regular",
    benefits: ["Acesso a todas as bandas", "Área de alimentação"]
  },
  {
    id: 2,
    event_id: 1,
    name: "Ingresso VIP",
    description: "Acesso premium com área exclusiva e bebidas inclusas",
    price: 300,
    available_quantity: 20,
    max_per_order: 2,
    type: "vip",
    benefits: ["Área VIP", "Open bar", "Área de descanso exclusiva", "Meet & Greet com artistas"]
  },
  {
    id: 3,
    event_id: 2,
    name: "Corrida 5km",
    description: "Participação na prova de 5km",
    price: 80,
    available_quantity: 30,
    max_per_order: 1,
    type: "regular",
    benefits: ["Kit do corredor", "Medalha de participação", "Hidratação"]
  },
  {
    id: 4,
    event_id: 2,
    name: "Corrida 10km",
    description: "Participação na prova de 10km",
    price: 100,
    available_quantity: 20,
    max_per_order: 1,
    type: "regular",
    benefits: ["Kit do corredor", "Medalha de participação", "Hidratação", "Camiseta técnica"]
  }
];
