export interface City {
  name: string;
  state: string;
  region: string;
  uf: string;
}

export const BRAZILIAN_CITIES: City[] = [
  // Acre
  { name: "Rio Branco", state: "Acre", region: "Norte", uf: "AC" },
  { name: "Cruzeiro do Sul", state: "Acre", region: "Norte", uf: "AC" },
  
  // Alagoas
  { name: "Maceió", state: "Alagoas", region: "Nordeste", uf: "AL" },
  { name: "Arapiraca", state: "Alagoas", region: "Nordeste", uf: "AL" },
  { name: "Porto de Pedras", state: "Alagoas", region: "Nordeste", uf: "AL" },
  { name: "Maragogi", state: "Alagoas", region: "Nordeste", uf: "AL" },
  
  // Amapá
  { name: "Macapá", state: "Amapá", region: "Norte", uf: "AP" },
  { name: "Santana", state: "Amapá", region: "Norte", uf: "AP" },
  
  // Amazonas
  { name: "Manaus", state: "Amazonas", region: "Norte", uf: "AM" },
  { name: "Parintins", state: "Amazonas", region: "Norte", uf: "AM" },
  { name: "Itacoatiara", state: "Amazonas", region: "Norte", uf: "AM" },
  { name: "Tefé", state: "Amazonas", region: "Norte", uf: "AM" },
  
  // Bahia
  { name: "Salvador", state: "Bahia", region: "Nordeste", uf: "BA" },
  { name: "Feira de Santana", state: "Bahia", region: "Nordeste", uf: "BA" },
  { name: "Vitória da Conquista", state: "Bahia", region: "Nordeste", uf: "BA" },
  { name: "Camaçari", state: "Bahia", region: "Nordeste", uf: "BA" },
  { name: "Itabuna", state: "Bahia", region: "Nordeste", uf: "BA" },
  { name: "Juazeiro", state: "Bahia", region: "Nordeste", uf: "BA" },
  { name: "Porto Seguro", state: "Bahia", region: "Nordeste", uf: "BA" },
  { name: "Ilhéus", state: "Bahia", region: "Nordeste", uf: "BA" },
  { name: "Lençóis", state: "Bahia", region: "Nordeste", uf: "BA" },
  { name: "Morro de São Paulo", state: "Bahia", region: "Nordeste", uf: "BA" },
  { name: "Trancoso", state: "Bahia", region: "Nordeste", uf: "BA" },
  
  // Ceará
  { name: "Fortaleza", state: "Ceará", region: "Nordeste", uf: "CE" },
  { name: "Caucaia", state: "Ceará", region: "Nordeste", uf: "CE" },
  { name: "Juazeiro do Norte", state: "Ceará", region: "Nordeste", uf: "CE" },
  { name: "Maracanaú", state: "Ceará", region: "Nordeste", uf: "CE" },
  { name: "Sobral", state: "Ceará", region: "Nordeste", uf: "CE" },
  { name: "Crato", state: "Ceará", region: "Nordeste", uf: "CE" },
  { name: "Jericoacoara", state: "Ceará", region: "Nordeste", uf: "CE" },
  { name: "Canoa Quebrada", state: "Ceará", region: "Nordeste", uf: "CE" },
  
  // Distrito Federal
  { name: "Brasília", state: "Distrito Federal", region: "Centro-Oeste", uf: "DF" },
  
  // Espírito Santo
  { name: "Vitória", state: "Espírito Santo", region: "Sudeste", uf: "ES" },
  { name: "Serra", state: "Espírito Santo", region: "Sudeste", uf: "ES" },
  { name: "Vila Velha", state: "Espírito Santo", region: "Sudeste", uf: "ES" },
  { name: "Cariacica", state: "Espírito Santo", region: "Sudeste", uf: "ES" },
  { name: "Guarapari", state: "Espírito Santo", region: "Sudeste", uf: "ES" },
  
  // Goiás
  { name: "Goiânia", state: "Goiás", region: "Centro-Oeste", uf: "GO" },
  { name: "Aparecida de Goiânia", state: "Goiás", region: "Centro-Oeste", uf: "GO" },
  { name: "Anápolis", state: "Goiás", region: "Centro-Oeste", uf: "GO" },
  { name: "Rio Verde", state: "Goiás", region: "Centro-Oeste", uf: "GO" },
  { name: "Caldas Novas", state: "Goiás", region: "Centro-Oeste", uf: "GO" },
  { name: "Pirenópolis", state: "Goiás", region: "Centro-Oeste", uf: "GO" },
  
  // Maranhão
  { name: "São Luís", state: "Maranhão", region: "Nordeste", uf: "MA" },
  { name: "Imperatriz", state: "Maranhão", region: "Nordeste", uf: "MA" },
  { name: "São José de Ribamar", state: "Maranhão", region: "Nordeste", uf: "MA" },
  { name: "Timon", state: "Maranhão", region: "Nordeste", uf: "MA" },
  { name: "Barreirinhas", state: "Maranhão", region: "Nordeste", uf: "MA" },
  
  // Mato Grosso
  { name: "Cuiabá", state: "Mato Grosso", region: "Centro-Oeste", uf: "MT" },
  { name: "Várzea Grande", state: "Mato Grosso", region: "Centro-Oeste", uf: "MT" },
  { name: "Rondonópolis", state: "Mato Grosso", region: "Centro-Oeste", uf: "MT" },
  { name: "Sinop", state: "Mato Grosso", region: "Centro-Oeste", uf: "MT" },
  { name: "Alta Floresta", state: "Mato Grosso", region: "Centro-Oeste", uf: "MT" },
  { name: "Pantanal", state: "Mato Grosso", region: "Centro-Oeste", uf: "MT" },
  
  // Mato Grosso do Sul
  { name: "Campo Grande", state: "Mato Grosso do Sul", region: "Centro-Oeste", uf: "MS" },
  { name: "Dourados", state: "Mato Grosso do Sul", region: "Centro-Oeste", uf: "MS" },
  { name: "Três Lagoas", state: "Mato Grosso do Sul", region: "Centro-Oeste", uf: "MS" },
  { name: "Corumbá", state: "Mato Grosso do Sul", region: "Centro-Oeste", uf: "MS" },
  { name: "Bonito", state: "Mato Grosso do Sul", region: "Centro-Oeste", uf: "MS" },
  
  // Minas Gerais
  { name: "Belo Horizonte", state: "Minas Gerais", region: "Sudeste", uf: "MG" },
  { name: "Uberlândia", state: "Minas Gerais", region: "Sudeste", uf: "MG" },
  { name: "Contagem", state: "Minas Gerais", region: "Sudeste", uf: "MG" },
  { name: "Juiz de Fora", state: "Minas Gerais", region: "Sudeste", uf: "MG" },
  { name: "Betim", state: "Minas Gerais", region: "Sudeste", uf: "MG" },
  { name: "Montes Claros", state: "Minas Gerais", region: "Sudeste", uf: "MG" },
  { name: "Ouro Preto", state: "Minas Gerais", region: "Sudeste", uf: "MG" },
  { name: "Tiradentes", state: "Minas Gerais", region: "Sudeste", uf: "MG" },
  { name: "São João del-Rei", state: "Minas Gerais", region: "Sudeste", uf: "MG" },
  { name: "Diamantina", state: "Minas Gerais", region: "Sudeste", uf: "MG" },
  
  // Pará
  { name: "Belém", state: "Pará", region: "Norte", uf: "PA" },
  { name: "Ananindeua", state: "Pará", region: "Norte", uf: "PA" },
  { name: "Santarém", state: "Pará", region: "Norte", uf: "PA" },
  { name: "Marabá", state: "Pará", region: "Norte", uf: "PA" },
  { name: "Altamira", state: "Pará", region: "Norte", uf: "PA" },
  
  // Paraíba
  { name: "João Pessoa", state: "Paraíba", region: "Nordeste", uf: "PB" },
  { name: "Campina Grande", state: "Paraíba", region: "Nordeste", uf: "PB" },
  { name: "Santa Rita", state: "Paraíba", region: "Nordeste", uf: "PB" },
  { name: "Patos", state: "Paraíba", region: "Nordeste", uf: "PB" },
  
  // Paraná
  { name: "Curitiba", state: "Paraná", region: "Sul", uf: "PR" },
  { name: "Londrina", state: "Paraná", region: "Sul", uf: "PR" },
  { name: "Maringá", state: "Paraná", region: "Sul", uf: "PR" },
  { name: "Ponta Grossa", state: "Paraná", region: "Sul", uf: "PR" },
  { name: "Cascavel", state: "Paraná", region: "Sul", uf: "PR" },
  { name: "São José dos Pinhais", state: "Paraná", region: "Sul", uf: "PR" },
  { name: "Foz do Iguaçu", state: "Paraná", region: "Sul", uf: "PR" },
  
  // Pernambuco
  { name: "Recife", state: "Pernambuco", region: "Nordeste", uf: "PE" },
  { name: "Jaboatão dos Guararapes", state: "Pernambuco", region: "Nordeste", uf: "PE" },
  { name: "Olinda", state: "Pernambuco", region: "Nordeste", uf: "PE" },
  { name: "Caruaru", state: "Pernambuco", region: "Nordeste", uf: "PE" },
  { name: "Petrolina", state: "Pernambuco", region: "Nordeste", uf: "PE" },
  { name: "Paulista", state: "Pernambuco", region: "Nordeste", uf: "PE" },
  { name: "Fernando de Noronha", state: "Pernambuco", region: "Nordeste", uf: "PE" },
  { name: "Porto de Galinhas", state: "Pernambuco", region: "Nordeste", uf: "PE" },
  
  // Piauí
  { name: "Teresina", state: "Piauí", region: "Nordeste", uf: "PI" },
  { name: "Parnaíba", state: "Piauí", region: "Nordeste", uf: "PI" },
  { name: "Picos", state: "Piauí", region: "Nordeste", uf: "PI" },
  { name: "Floriano", state: "Piauí", region: "Nordeste", uf: "PI" },
  
  // Rio de Janeiro
  { name: "Rio de Janeiro", state: "Rio de Janeiro", region: "Sudeste", uf: "RJ" },
  { name: "São Gonçalo", state: "Rio de Janeiro", region: "Sudeste", uf: "RJ" },
  { name: "Duque de Caxias", state: "Rio de Janeiro", region: "Sudeste", uf: "RJ" },
  { name: "Nova Iguaçu", state: "Rio de Janeiro", region: "Sudeste", uf: "RJ" },
  { name: "Niterói", state: "Rio de Janeiro", region: "Sudeste", uf: "RJ" },
  { name: "Campos dos Goytacazes", state: "Rio de Janeiro", region: "Sudeste", uf: "RJ" },
  { name: "Petrópolis", state: "Rio de Janeiro", region: "Sudeste", uf: "RJ" },
  { name: "Angra dos Reis", state: "Rio de Janeiro", region: "Sudeste", uf: "RJ" },
  { name: "Búzios", state: "Rio de Janeiro", region: "Sudeste", uf: "RJ" },
  { name: "Cabo Frio", state: "Rio de Janeiro", region: "Sudeste", uf: "RJ" },
  { name: "Paraty", state: "Rio de Janeiro", region: "Sudeste", uf: "RJ" },
  
  // Rio Grande do Norte
  { name: "Natal", state: "Rio Grande do Norte", region: "Nordeste", uf: "RN" },
  { name: "Mossoró", state: "Rio Grande do Norte", region: "Nordeste", uf: "RN" },
  { name: "Parnamirim", state: "Rio Grande do Norte", region: "Nordeste", uf: "RN" },
  { name: "São Gonçalo do Amarante", state: "Rio Grande do Norte", region: "Nordeste", uf: "RN" },
  { name: "Pipa", state: "Rio Grande do Norte", region: "Nordeste", uf: "RN" },
  
  // Rio Grande do Sul
  { name: "Porto Alegre", state: "Rio Grande do Sul", region: "Sul", uf: "RS" },
  { name: "Caxias do Sul", state: "Rio Grande do Sul", region: "Sul", uf: "RS" },
  { name: "Pelotas", state: "Rio Grande do Sul", region: "Sul", uf: "RS" },
  { name: "Canoas", state: "Rio Grande do Sul", region: "Sul", uf: "RS" },
  { name: "Santa Maria", state: "Rio Grande do Sul", region: "Sul", uf: "RS" },
  { name: "Novo Hamburgo", state: "Rio Grande do Sul", region: "Sul", uf: "RS" },
  { name: "Gramado", state: "Rio Grande do Sul", region: "Sul", uf: "RS" },
  { name: "Canela", state: "Rio Grande do Sul", region: "Sul", uf: "RS" },
  
  // Rondônia
  { name: "Porto Velho", state: "Rondônia", region: "Norte", uf: "RO" },
  { name: "Ji-Paraná", state: "Rondônia", region: "Norte", uf: "RO" },
  { name: "Ariquemes", state: "Rondônia", region: "Norte", uf: "RO" },
  { name: "Vilhena", state: "Rondônia", region: "Norte", uf: "RO" },
  
  // Roraima
  { name: "Boa Vista", state: "Roraima", region: "Norte", uf: "RR" },
  { name: "Rorainópolis", state: "Roraima", region: "Norte", uf: "RR" },
  
  // Santa Catarina
  { name: "Florianópolis", state: "Santa Catarina", region: "Sul", uf: "SC" },
  { name: "Joinville", state: "Santa Catarina", region: "Sul", uf: "SC" },
  { name: "Blumenau", state: "Santa Catarina", region: "Sul", uf: "SC" },
  { name: "São José", state: "Santa Catarina", region: "Sul", uf: "SC" },
  { name: "Chapecó", state: "Santa Catarina", region: "Sul", uf: "SC" },
  { name: "Itajaí", state: "Santa Catarina", region: "Sul", uf: "SC" },
  { name: "Balneário Camboriú", state: "Santa Catarina", region: "Sul", uf: "SC" },
  
  // São Paulo
  { name: "São Paulo", state: "São Paulo", region: "Sudeste", uf: "SP" },
  { name: "Guarulhos", state: "São Paulo", region: "Sudeste", uf: "SP" },
  { name: "Campinas", state: "São Paulo", region: "Sudeste", uf: "SP" },
  { name: "São Bernardo do Campo", state: "São Paulo", region: "Sudeste", uf: "SP" },
  { name: "São José dos Campos", state: "São Paulo", region: "Sudeste", uf: "SP" },
  { name: "Santos", state: "São Paulo", region: "Sudeste", uf: "SP" },
  { name: "Ribeirão Preto", state: "São Paulo", region: "Sudeste", uf: "SP" },
  { name: "Santo André", state: "São Paulo", region: "Sudeste", uf: "SP" },
  { name: "Osasco", state: "São Paulo", region: "Sudeste", uf: "SP" },
  { name: "Sorocaba", state: "São Paulo", region: "Sudeste", uf: "SP" },
  { name: "Ubatuba", state: "São Paulo", region: "Sudeste", uf: "SP" },
  { name: "Ilhabela", state: "São Paulo", region: "Sudeste", uf: "SP" },
  
  // Sergipe
  { name: "Aracaju", state: "Sergipe", region: "Nordeste", uf: "SE" },
  { name: "Nossa Senhora do Socorro", state: "Sergipe", region: "Nordeste", uf: "SE" },
  { name: "Lagarto", state: "Sergipe", region: "Nordeste", uf: "SE" },
  { name: "Itabaiana", state: "Sergipe", region: "Nordeste", uf: "SE" },
  
  // Tocantins
  { name: "Palmas", state: "Tocantins", region: "Norte", uf: "TO" },
  { name: "Araguaína", state: "Tocantins", region: "Norte", uf: "TO" },
  { name: "Gurupi", state: "Tocantins", region: "Norte", uf: "TO" },
  { name: "Porto Nacional", state: "Tocantins", region: "Norte", uf: "TO" },
];

export const BRAZILIAN_STATES = [
  { name: "Acre", uf: "AC", region: "Norte" },
  { name: "Alagoas", uf: "AL", region: "Nordeste" },
  { name: "Amapá", uf: "AP", region: "Norte" },
  { name: "Amazonas", uf: "AM", region: "Norte" },
  { name: "Bahia", uf: "BA", region: "Nordeste" },
  { name: "Ceará", uf: "CE", region: "Nordeste" },
  { name: "Distrito Federal", uf: "DF", region: "Centro-Oeste" },
  { name: "Espírito Santo", uf: "ES", region: "Sudeste" },
  { name: "Goiás", uf: "GO", region: "Centro-Oeste" },
  { name: "Maranhão", uf: "MA", region: "Nordeste" },
  { name: "Mato Grosso", uf: "MT", region: "Centro-Oeste" },
  { name: "Mato Grosso do Sul", uf: "MS", region: "Centro-Oeste" },
  { name: "Minas Gerais", uf: "MG", region: "Sudeste" },
  { name: "Pará", uf: "PA", region: "Norte" },
  { name: "Paraíba", uf: "PB", region: "Nordeste" },
  { name: "Paraná", uf: "PR", region: "Sul" },
  { name: "Pernambuco", uf: "PE", region: "Nordeste" },
  { name: "Piauí", uf: "PI", region: "Nordeste" },
  { name: "Rio de Janeiro", uf: "RJ", region: "Sudeste" },
  { name: "Rio Grande do Norte", uf: "RN", region: "Nordeste" },
  { name: "Rio Grande do Sul", uf: "RS", region: "Sul" },
  { name: "Rondônia", uf: "RO", region: "Norte" },
  { name: "Roraima", uf: "RR", region: "Norte" },
  { name: "Santa Catarina", uf: "SC", region: "Sul" },
  { name: "São Paulo", uf: "SP", region: "Sudeste" },
  { name: "Sergipe", uf: "SE", region: "Nordeste" },
  { name: "Tocantins", uf: "TO", region: "Norte" },
];

// Helper functions
export const getCitiesByState = (state: string): City[] => {
  return BRAZILIAN_CITIES.filter(city => city.state === state);
};

export const getCitiesByRegion = (region: string): City[] => {
  return BRAZILIAN_CITIES.filter(city => city.region === region);
};

export const searchCities = (query: string): City[] => {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return BRAZILIAN_CITIES.filter(city => 
    city.name.toLowerCase().includes(normalizedQuery) ||
    city.state.toLowerCase().includes(normalizedQuery) ||
    city.uf.toLowerCase().includes(normalizedQuery)
  ).slice(0, 20); // Limit to 20 results
}; 