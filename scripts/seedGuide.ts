

import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { internal } from "../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { config } from "dotenv";

config({ path: ".env.local" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Read the guide content from the public directory
const guideContent = `
Guia Interativo Fernando de Noronha 2025
Guia Geral: Planeje Sua Viagem
Como Chegar e Taxas
A principal forma de chegar é por voos partindo de Recife (REC) ou Natal (NAT), operados principalmente pela Azul e Gol. Reserve com antecedência!
Taxas Obrigatórias (Valores 2025 - Estimativa):
TPA (Taxa de Preservação Ambiental): Valor diário progressivo. Ex: 7 dias ~ R$ 644,43. Pague online para evitar filas.
Ingresso do Parque Nacional (PARNAMAR): R$ 186,50 para brasileiros, válido por 10 dias. Essencial para acessar as principais praias como Sancho, Leão e Sueste.
Onde Ficar
A escolha da vila influencia sua experiência. Todas oferecem ótimas opções de pousadas, de luxo a domiciliares.
Vila dos Remédios: O centro de tudo. Ideal para quem busca conveniência, restaurantes, bares e agito.
Vila do Trinta: Ótimo custo-benefício. Muitos restaurantes e pousadas, com fácil acesso à BR principal.
Floresta Nova/Velha: Mais tranquilidade e charme. Áreas residenciais com pousadas aconchegantes.
Boldró: Perto do pôr do sol mais famoso e do projeto Tamar. Ideal para quem busca sossego e vistas incríveis.
Como se Locomover
Noronha tem várias opções, cada uma com seus prós e contras.
Buggy: O mais popular. Oferece liberdade total. Diárias entre R300−R450 + gasolina (que é cara). Reserve com antecedência.
Ônibus: A opção mais econômica (R5−R10 o trecho). Percorre a BR principal, conectando as vilas e acessos às praias.
Táxi: Tarifas tabeladas. Bom para trechos curtos ou para se locomover à noite.
A pé: Para explorar as vilas e praias próximas, é a melhor forma de sentir a ilha.
As Joias de Noronha: Guia de Praias
Baía do Sancho
Eleita várias vezes a praia mais bonita do mundo. Acesso por escadaria na falésia. Ideal para snorkel e contemplação. Um paraíso de águas cristalinas.
Baía dos Porcos
Pequena e cênica, com o Morro Dois Irmãos ao fundo. Na maré baixa, formam-se piscinas naturais perfeitas para snorkel. Acesso por trilha a partir da Cacimba do Padre.
Praia do Leão
No Mar de Fora, é selvagem e imponente. Principal ponto de desova de tartarugas marinhas (Jan-Jun). O banho exige muita cautela devido às correntes.
Cacimba do Padre
O paraíso dos surfistas entre Dezembro e Março. Famosa pelas ondas perfeitas e a vista para o Morro Dois Irmãos.
Praia da Atalaia
Um verdadeiro aquário natural com visitação controlada. A flutuação em suas águas rasas revela uma vida marinha incrível. Agendamento obrigatório e muito concorrido.
Baía do Sueste
O melhor lugar para nadar com tartarugas gigantes e observar filhotes de tubarão-limão (inofensivos) na beirada. Acesso controlado e ideal para famílias.
Praia da Conceição
A praia mais badalada no final da tarde. Com bares e gente bonita, é o ponto de encontro para curtir o fim de dia com o pé na areia.
Sabores de Noronha: Guia Gastronômico
O Imperdível Festival do Zé Maria
Mais que um jantar, uma experiência. Acontece às quartas e sábados com um banquete de mais de 40 pratos, de paella a sushi, com a presença carismática do anfitrião Zé Maria. É uma festa! Reserva com máxima antecedência é obrigatória.
Restaurantes Clássicos
Mergulhão (Porto): Vista deslumbrante, ideal para almoço ou jantar. Peça o mix de frutos do mar que leva o nome da casa.
Restaurante Varanda (Floresta Velha): Ambiente acolhedor e pratos fartos. O gratinado de frutos do mar é uma especialidade famosa.
Cacimba Bistrô (Vila dos Remédios): Comandado pelo Chef Auricélio Romão. O pastel de lagosta e o penne aos frutos do mar picante são icônicos.
Xica da Silva (Floresta Nova): Ambiente descontraído e famoso pelo seu delicioso e criativo baião de dois com frutos do mar.
Bares e Pontos de Encontro
Bar do Meio (Praia do Meio): O lugar para ver o pôr do sol com música ao vivo, bons drinks e petiscos. Vira uma baladinha à noite.
Duda Rei (Praia da Conceição): O bar de praia perfeito para passar o dia com o pé na areia, cerveja gelada e peixe frito.
Guia Mês a Mês
Janeiro: Auge do Verão e do Surf
Alta temporada, sol intenso, mar vibrante e muita energia. Prepare-se para um ambiente festivo, praias movimentadas e as melhores ondas do ano.
Clima
Temp. Média: 28°C (Máx 32°C)
Chuva: Baixa (66mm)
Mar: Swell forte (Surf)
Visibilidade: Boa
Atividades em Destaque
Surf na Cacimba do Padre: É o pico! Ondas tubulares atraem surfistas do mundo todo. Se não surfa, o espetáculo vale a pena.
Mergulho no Porto: A região do Porto de Santo Antônio costuma ter águas mais calmas, ideal para batismo e snorkel.
Observar a Desova das Tartarugas: Visite a Praia do Leão no final da tarde ou início da manhã para observar, com respeito, a desova das tartarugas marinhas.
Eventos e Festivais
Réveillon de Noronha: A virada do ano é uma das mais famosas do Brasil, com festas privadas (como a do Zé Maria) e uma grande festa pública na Praia do Porto com shows e fogos.
Dica do Mês
Abrace a energia do swell! Para banhos mais tranquilos, opte por praias do Mar de Fora como Sueste. No Mar de Dentro, admire a força das ondas. E o mais importante: reserve TUDO com máxima antecedência.
Fevereiro: O Mês dos Campeonatos de Surf
Fevereiro mantém a energia de janeiro, com calor intenso e mar com fortes ondulações. É o mês que historicamente sedia campeonatos de surf.
Clima
Temp. Média: 28°C (Máx 32°C)
Chuva: Baixa/Moderada (66mm)
Mar: Swell forte (Surf)
Visibilidade: Boa
Atividades em Destaque
Assistir a um Campeonato de Surf: Fique de olho nos calendários da WSL e CBSurf. A Cacimba do Padre ferve com atletas de elite.
Trilha Atalaia: Agende a trilha da Atalaia para uma experiência única de flutuação em um aquário natural. O agendamento é obrigatório e concorrido.
Carnaval: Se o Carnaval cair em fevereiro, aproveite os blocos de rua e uma folia mais intimista, em contato com a comunidade local.
Eventos e Festivais
Hang Loose Pro Contest: Verificar o calendário oficial da World Surf League (WSL) para a confirmação da etapa. Um evento que atrai os melhores surfistas do mundo.
Dica do Mês
Este é o mês para os amantes do mar com personalidade forte. Para não surfistas, foque nas praias abrigadas (Porto, Sueste) e explore as belezas terrestres da ilha. Não subestime o sol!
Março: Transição e Equilíbrio
O auge do swell começa a diminuir e as chuvas se tornam um pouco mais frequentes. Um mês com bom equilíbrio entre a energia do verão e uma atmosfera mais tranquila.
Clima
Temp. Média: 28°C (Máx 30°C)
Chuva: Moderada (131mm)
Mar: Swell diminuindo
Visibilidade: Boa
Atividades em Destaque
Mergulho na Corveta Ipiranga: Para mergulhadores credenciados, as condições que melhoram ao longo do mês podem permitir a exploração de um dos naufrágios mais famosos do Brasil.
Canoa Havaiana: Com o mar potencialmente mais calmo, a experiência de remar ao nascer do sol pode ser ainda mais especial e contemplativa.
Caminhada Histórica: Explore a Vila dos Remédios, visitando a igreja, o palácio e as ruínas, e aprendendo sobre o passado da ilha.
Eventos e Festivais
Páscoa: Se a Páscoa cair em março, pode haver um aumento de turistas e programações especiais em algumas pousadas e restaurantes.
Dica do Mês
Aproveite o mar que começa a acalmar no fim do mês para atividades como stand-up paddle. Esteja preparado para pancadas de chuva, mas não deixe que isso atrapalhe seus planos.
Abril: Baixa Temporada e Ilha Verdejante
Coração da estação chuvosa, mas não se engane: as chuvas são passageiras e a ilha fica exuberante. É o mês da tranquilidade e dos melhores preços.
Clima
Temp. Média: 28°C (Máx 30°C)
Chuva: Alta (205mm)
Mar: Mais calmo
Visibilidade: Variável
Atividades em Destaque
Atividades Culturais: Aproveite um dia mais nublado para visitar o Museu Memorial Noronhense, o Museu do Tubarão ou as palestras no Projeto Tamar.
Fotografia: A luz difusa dos dias nublados e o verde intenso da vegetação criam cenários únicos para fotos espetaculares.
Ilha Tour 4x4: Mesmo com chuva, o tour permite conhecer os principais pontos da ilha de forma confortável e protegida no veículo.
Eventos e Festivais
Ilha do Amor (Fica Comigo): Evento musical programado para os dias 18, 19 e 20 de abril de 2025. Atrai um público jovem e animado.
Weekend do Samba Noronha: Outro evento musical focado no samba, previsto para 18 a 21 de abril de 2025.
Dica do Mês
Seja flexível com o roteiro! Tenha um 'plano B' para dias de chuva. Aproveite os preços de baixa temporada para ficar numa pousada melhor ou fazer aquele passeio que parecia caro.
Maio: Fim das Chuvas e Natureza Exuberante
Maio marca o fim da estação chuvosa. As chuvas diminuem, o sol aparece mais e a ilha, ainda tranquila, está com a vegetação no seu auge de beleza.
Clima
Temp. Média: 28°C (Máx 30°C)
Chuva: Moderada (140mm)
Mar: Calmo
Visibilidade: Melhorando
Atividades em Destaque
Mergulho de Batismo: Com o mar mais calmo e a visibilidade melhorando, maio é um ótimo mês para sua primeira experiência de mergulho com cilindro.
Trilha do Capim-Açu: Para os mais aventureiros (requer guia), é a trilha mais longa da ilha, revelando paisagens selvagens e o lado do Mar de Fora.
Passeio de Barco ao Entardecer: Com o mar calmo, um passeio com churrasco a bordo e pôr do sol é uma experiência memorável e romântica.
Eventos e Festivais
Festival Brasil Sabor: De 22 de maio a 03 de junho. Grande evento gastronômico com chefs renomados, focado na culinária local e sustentabilidade. Reserve com antecedência.
Dica do Mês
Maio é um mês de ouro para quem busca a beleza de Noronha com mais tranquilidade e um clima geralmente favorável. Se a gastronomia te atrai, planeje sua viagem para o final do mês!
Junho: Clima Firme e Mar Calmo
A porta de entrada para a estação seca. Dias ensolarados, mar calmo e a ilha ainda não atingiu a lotação de julho. Mês perfeito para atividades aquáticas.
Clima
Temp. Média: 27°C (Máx 29°C)
Chuva: Baixa (63mm)
Mar: Muito Calmo (Piscina)
Visibilidade: Excelente
Atividades em Destaque
Stand Up Paddle no Porto: O mar calmo transforma a Baía de Santo Antônio em uma grande piscina, perfeita para a prática de SUP e caiaque.
Snorkel na Baía dos Porcos: Com a maré baixa e o mar calmo, as piscinas naturais em frente ao Morro Dois Irmãos ficam repletas de vida marinha.
Aluguel de Barco Privativo: Para uma experiência mais exclusiva, junte um grupo e alugue um barco para explorar a costa no seu próprio ritmo.
Eventos e Festivais
Festival Brasil Sabor: Aproveite os últimos dias do evento gastronômico no início de junho.
Festas Juninas: Embora não seja uma tradição forte, podem ocorrer celebrações comunitárias e temáticas em pousadas. Verifique a programação local.
Dica do Mês
Junho é um mês estratégico: aproveite o clima excelente e o mar calmo antes da chegada da alta temporada de julho. É ideal para quem quer o melhor dos dois mundos: bom tempo e menos agito.
Julho: Férias Escolares e Mar de Piscina
Alta temporada de 'inverno', coincidindo com as férias escolares. A ilha recebe muitas famílias. O clima é seco, os dias ensolarados e o mar de dentro, uma piscina.
Clima
Temp. Média: 27°C (Máx 29°C)
Chuva: Muito Baixa (34mm)
Mar: Muito Calmo (Piscina)
Visibilidade: Excelente
Atividades em Destaque
Mergulho em Família: A excelente visibilidade e o mar calmo são perfeitos para batismos e cursos, tornando a atividade ideal para toda a família.
Snorkel com Tartarugas no Sueste: Um clássico! As águas rasas e calmas da Baía do Sueste são o lugar certo para nadar lado a lado com as tartarugas marinhas.
Pôr do Sol no Forte do Boldró: Um dos programas mais famosos da ilha. Reúna os amigos ou a família, chegue cedo para pegar um bom lugar e aplauda o espetáculo.
Eventos e Festivais
Programação de Férias: Não há grandes festivais, mas a ilha fica animada. Bares e pousadas podem ter programações especiais. A vibe é familiar e descontraída.
Dica do Mês
É alta temporada! Reserve voos, pousadas e, principalmente, passeios concorridos como mergulho e Ilha Tour, com o máximo de antecedência possível para não ficar de fora.
Agosto: O Início da Melhor Época
Agosto inicia o que muitos consideram o melhor período para visitar Noronha. O tempo é firme, o mar é uma piscina e a visibilidade para mergulho atinge seu ápice.
Clima
Temp. Média: 27°C (Máx 29°C)
Chuva: Muito Baixa
Mar: Muito Calmo (Piscina)
Visibilidade: Excepcional
Atividades em Destaque
Mergulho Avançado: A visibilidade excepcional torna agosto ideal para mergulhadores credenciados explorarem pontos mais profundos e desafiadores, como a Corveta.
Caminhada Sancho-Porcos-Cacimba: Com o mar calmo, faça a trilha que liga essas três praias icônicas, parando para mergulhar e tirar fotos inesquecíveis.
Dia de Praia no Sancho: Simplesmente aproveite a praia mais bonita do mundo em suas melhores condições. Leve snorkel, água e relaxe.
Eventos e Festivais
Dia dos Pais: Pode haver promoções ou menus especiais em restaurantes para celebrar a data.
Dica do Mês
Se você é um amante do mergulho, agosto é o seu mês. A visibilidade da água é algo de outro mundo. O vento pode ser um pouco mais forte, o que é ótimo para amenizar o calor.
Setembro: O Paraíso em Sua Essência
O auge da estação seca. Praticamente sem chuvas, mar espelhado e a ilha com uma tranquilidade única. Perfeito para casais e amantes do mergulho.
Clima
Temp. Média: 27°C (Máx 29°C)
Chuva: Mínima
Mar: Espelhado
Visibilidade: Excepcional
Atividades em Destaque
Flutuação na Atalaia: Com o mar calmo, a piscina da Atalaia fica ainda mais cristalina, parecendo um aquário. Agende com antecedência máxima!
Jantar Romântico: O clima tranquilo do mês é perfeito para um jantar especial. Restaurantes como o Mergulhão ou o Cacimba Bistrô são ótimas opções.
Nascer do Sol na Baía dos Golfinhos: Acorde cedo, faça a trilha até o mirante e assista ao show dos golfinhos rotadores com a luz dourada da manhã.
Eventos e Festivais
Semana do Meio Ambiente: Noronha pode ter programações especiais de conscientização e limpeza de praias nesta época.
Dica do Mês
Setembro é considerado por muitos locais como o melhor mês de todos. Aproveite a paz e as condições perfeitas do mar para se reconectar com a natureza e consigo mesmo.
Outubro: Sol, Mergulho e Esportes
Continuação das condições perfeitas de setembro, com sol abundante, mar calmo e ótima visibilidade. A ilha começa a receber eventos esportivos.
Clima
Temp. Média: 28°C (Máx 30°C)
Chuva: Mínima
Mar: Espelhado
Visibilidade: Excepcional
Atividades em Destaque
Mergulho Noturno: Para os mais experientes, o mar calmo de outubro oferece uma oportunidade incrível de explorar a vida marinha noturna da ilha.
Plana Sub (Aquasub): Seja rebocado por um barco segurando uma pranchinha e 'voe' debaixo d'água, avistando tartarugas, raias e a imensidão azul. Uma experiência única!
Acompanhar o Mountain Do: Mesmo que não participe, o clima do evento é contagiante. Vá para a linha de chegada na Praia do Porto para torcer pelos atletas.
Eventos e Festivais
Mountain Do Fernando de Noronha: Uma das corridas de montanha mais desejadas do Brasil, com percursos que passam pelas paisagens mais icônicas da ilha. As inscrições se esgotam rapidamente.
Dica do Mês
Se você é corredor ou triatleta, planeje sua viagem para outubro. Se não, aproveite a ilha com seu clima perfeito e a energia positiva dos eventos esportivos.
Novembro: A Calmaria Antes da Agitação
Último mês de tranquilidade antes da chegada do swell e da alta temporada de fim de ano. O mar ainda está calmo e o clima é ótimo. Excelente custo-benefício.
Clima
Temp. Média: 28°C (Máx 30°C)
Chuva: Baixa
Mar: Calmo, com possível chegada do 1º swell
Visibilidade: Excelente
Atividades em Destaque
Última Chance para o Mergulho "Piscina": Aproveite as últimas semanas do mar espelhado para mergulhar com máxima visibilidade e tranquilidade.
Explorar as Praias do Mar de Dentro: Faça um tour pelas praias do Cachorro, Meio e Conceição, que em breve podem ter seu cenário alterado pelas ondas.
Fotografar o Pôr do Sol no Bar do Meio: Com o tempo firme, o pôr do sol visto do Bar do Meio é um espetáculo de cores. Peça um drink e aproveite.
Eventos e Festivais
Feriados de Novembro: Os feriados de Finados e Proclamação da República podem aumentar o movimento de turistas. Planeje-se caso sua viagem caia nessas datas.
Dica do Mês
Novembro é sua chance de pegar a ilha com o clima perfeito da estação seca, mas com menos gente e preços melhores que no período de agosto a outubro. Fique de olho na possível chegada do primeiro swell no final do mês.
Dezembro: Chegada do Swell e Festas de Fim de Ano
A ilha se transforma. O swell chega com força, trazendo os surfistas. O clima de festa toma conta com a proximidade do Réveillon. A alta temporada está de volta.
Clima
Temp. Média: 28°C (Máx 31°C)
Chuva: Baixa
Mar: Swell chegando/forte
Visibilidade: Boa
Atividades em Destaque
Surfar ou Observar o Surf: As primeiras grandes ondulações chegam à Cacimba do Padre e outras praias do Mar de Dentro. Um show da natureza.
Festival Gastronômico do Zé Maria: Em clima de festa, o famoso festival fica ainda mais especial. Reserve com muita antecedência.
Mergulho no Mar de Fora: Enquanto o Mar de Dentro fica agitado, o Mar de Fora (lado da África) pode apresentar condições mais calmas e ótimas para mergulho.
Eventos e Festivais
Abertura do Verão: Diversas festas e eventos começam a acontecer na segunda quinzena, aquecendo para o Réveillon.
Réveillon de Noronha: Um dos mais disputados do Brasil. Festas como a do Zé Maria, e a festa pública no Porto, atraem milhares de pessoas. O planejamento precisa começar quase um ano antes.
Dica do Mês
Dezembro é para quem gosta de agito e energia. Se busca surf ou festas, é o seu mês. Se prefere tranquilidade, evite a segunda quinzena. A palavra de ordem é planejamento e antecedência máxima.
`;

async function seedGuide() {
  // Split the guide into sections based on titles
  const sections = guideContent.trim().split(/\n(?=[A-Z][a-z_A-Z ]+:)/);

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const sectionTitle = lines[0];
    const content = lines.slice(1).join('\n').trim();

    if (sectionTitle && content) {
      await convex.mutation(api.guide.addSection, {
        sectionTitle,
        content,
      });
      console.log(`Seeding section: ${sectionTitle}`);
    }
  }

  console.log("Seeding complete!");
}

seedGuide().catch(console.error);
