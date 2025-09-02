import { api } from "../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const client = new ConvexHttpClient(CONVEX_URL);

// Parse and map guide sections to our taxonomy
const sectionMapping = {
  "planejando a viagem": "planejamento",
  "onde ficar": "hospedagem", 
  "o que fazer": "atividades",
  "as praias de fernando de noronha": "praias",
  "gastronomia local": "restaurantes",
  "cultura e história": "historia",
  "administração da ilha": "historia",
  "clima e atividades": "planejamento",
  "meus cantos favoritos": "atividades",
  "sustentabilidade": "cultura",
  "histórias engraçadas": "cultura"
};

const guideContent = [
  {
    sectionTitle: "Introdução - Boas-vindas ao Paraíso",
    chapter: "introducao",
    section: "planejamento",
    content: `Bem-vindo(a) ao guia mais completo sobre Fernando de Noronha, escrito por mim, Tuca Noronha. Se você está planejando visitar este paraíso brasileiro ou simplesmente quer conhecer mais sobre um dos lugares mais deslumbrantes do mundo, você está no lugar certo.

Sou um apaixonado por esta ilha incrível. Tenho a sorte de viver aqui, ter meus negócios e explorar cada canto desse paraíso, descobrindo suas maravilhas naturais e culturais. Neste e-book, estou feliz em compartilhar minha experiência pessoal e minhas Dicas do Tuca dos cantinhos que amo em Noronha, fornecendo insights que só quem vive e ama Fernando de Noronha pode oferecer.

Fernando de Noronha não é apenas um destino de férias; é um lugar mágico que encanta e transforma todos que o visitam. Desde suas praias paradisíacas e rica vida marinha até sua história fascinante e cultura vibrante, Noronha oferece uma experiência única que você não encontrará em nenhum outro lugar.

**Importante:** Este e-book é um projeto pessoal que provavelmente terá várias atualizações. Ainda falta muita informação que eu gostaria de incluir, mas decidi manter o conteúdo prático e direto para não tornar a leitura cansativa. A cada visita à ilha e a cada nova descoberta, pretendo acrescentar mais detalhes e dicas.

Espero que este e-book não só ajude você a planejar uma viagem inesquecível, mas também inspire você a apreciar e preservar este lugar extraordinário.`
  },
  {
    sectionTitle: "Planejando a Viagem - Melhor Época para Visitar",
    chapter: "planejamento",
    section: "planejamento", 
    content: `A escolha da melhor época para visitar Fernando de Noronha depende do que você deseja fazer. Cada estação oferece uma experiência única.

**Alta Temporada (Dezembro a Fevereiro):**
- **Para Surfe:** Essa é a melhor época para quem curte grandes ondas.
- **Movimento:** Espere um ambiente mais movimentado e preços mais altos.
- **Dicas do Tuca:** "Se você adora o agito e quer surfar nas melhores ondas, esse é o seu momento. Só não se esqueça de reservar tudo com bastante antecedência."

**Baixa Temporada (Março a Junho):**
- **Tranquilidade:** Menos turistas e preços mais acessíveis.
- **Clima:** Embora seja mais tranquilo, é também a época com maior chance de chuvas.
- **Dicas do Tuca:** "Quer aproveitar as praias sem multidões? Venha entre março e junho. Apenas fique de olho na previsão do tempo."

**Período de Mergulho (Setembro a Novembro):**
- **Visibilidade da Água:** Melhores condições para mergulho e snorkeling.
- **Mar Calmo:** Os meses com o mar mais calmo e transparente.
- **Dicas do Tuca:** "Para uma experiência subaquática inesquecível, programe sua visita entre setembro e novembro."`
  },
  {
    sectionTitle: "Como Chegar em Fernando de Noronha",
    chapter: "planejamento",
    section: "planejamento",
    content: `**Avião:**
- **Voos Diários:** Partem de Recife, e em alguns dias da semana de Natal e Fortaleza, operados por companhias como Azul e Voepass. A viagem dura cerca de 1h30.
- **Dicas do Tuca:** "Reserve seus voos com antecedência, especialmente durante a alta temporada, para garantir os melhores preços. Os preços variam bastante, então fique de olho nas promoções."

**Navio:**
- **Histórico:** Embora não haja mais navios de passageiros, já houve no passado algumas opções sazonais.
- **Dicas do Tuca:** "Hoje em dia, a maneira mais prática de chegar é realmente de avião."

**Documentos Necessários:**

**Taxa de Preservação Ambiental (TPA):**
- **Obrigatória:** Calculada com base na duração da estadia. Pode ser paga online antes da viagem ou na chegada.
- **Dicas do Tuca:** "Pague a TPA online antes de chegar para evitar filas e aproveitar ao máximo seu tempo na ilha."

**Documento de Identidade:**
- **Brasileiros:** Documento de identidade válido.
- **Estrangeiros:** Passaporte válido.`
  },
  {
    sectionTitle: "Onde Ficar - Pousadas em Fernando de Noronha",
    chapter: "hospedagem",
    section: "hospedagem",
    content: `Fernando de Noronha oferece uma variedade de pousadas que atendem a todos os gostos e orçamentos. Desde as mais simples até as mais luxuosas, você encontrará o lugar perfeito para sua estadia na ilha.

As pousadas em Fernando de Noronha são diversas e oferecem experiências únicas. Vale a pena explorar bem as opções, pois mesmo dentro da mesma faixa de preço, você pode encontrar diferenças significativas em termos de conforto, serviços e localização.

**Dicas do Tuca:**
- "Procure bem antes de decidir onde ficar, pois na mesma faixa de preço você pode encontrar opções bem diferentes. Avalie o que é mais importante para você, seja a localização, o conforto ou os serviços oferecidos."
- "Sempre confira as avaliações de outros hóspedes para garantir que a pousada atenda às suas expectativas."
- "Procure sempre estabelecimentos legalizados pela administração de Noronha. Isso garante que você terá uma estadia segura e sem imprevistos."

**Importância da Localização:**
A localização da sua pousada pode fazer uma grande diferença na sua experiência em Fernando de Noronha. Ficar perto das principais praias ou do centro pode facilitar o acesso às atrações e economizar tempo.

**Dicas do Tuca:**
- "Escolha uma pousada que esteja bem localizada em relação às atividades que você planeja fazer."
- "Ficar perto das praias pode proporcionar uma experiência mais intensa da beleza natural de Noronha e facilitar o acesso aos passeios."`
  },
  {
    sectionTitle: "Baía do Sancho - A Praia Mais Bonita do Mundo",
    chapter: "praias",
    section: "praias",
    content: `**Descrição:** Há muitos anos considerada uma das praias mais bonitas do mundo, a Baía do Sancho é conhecida por suas águas cristalinas e vida marinha rica. Cercada por falésias, a praia oferece uma experiência única tanto para relaxamento quanto para mergulho.

**Atividades Recomendadas:** Snorkeling, mergulho, nadar, observar a vida marinha.

**Acesso:** Na parada dos passeios de barco ou descendo uma escadaria entre as rochas. A escadaria tem horários específicos de subida e descida:
- **Horários de Subida e Descida da Escada:**
  - **Subida:** 11h às 13h e 15h às 17h.
  - **Descida:** 10h às 12h e 14h às 16h.

**Dicas do Tuca:**
- "Melhor Horário para Visitar: Chegue cedo pela manhã para evitar muitas pessoas e também pegar um lugarzinho embaixo da sombra da árvore."
- "Pontos de Mergulho Favoritos: O lado direito da praia tem os melhores pontos para observar várias espécies de peixes."`
  },
  {
    sectionTitle: "Baía dos Porcos - Vista dos Dois Irmãos",
    chapter: "praias", 
    section: "praias",
    content: `**Descrição:** Uma pequena e encantadora praia localizada ao lado do Morro Dois Irmãos, famosa pelas suas piscinas naturais formadas na maré baixa.

**Atividades Recomendadas:** Snorkeling, fotografia.

**Acesso:** Caminhada curta a partir da Praia da Cacimba do Padre. Mas é uma trilha, então para quem não tem muito costume, vale colocar um calçado legal.

**Dicas do Tuca:**
- "Melhor Horário para Fotos: A luz do fim da tarde realça as cores das rochas e da água, tornando esse o momento perfeito para fotografias."
- "Condições para Visitar: Verifique a maré baixa para aproveitar as piscinas naturais. Assegure-se de usar calçados adequados para caminhar sobre as rochas."
- "Existe uma regra de visitação nela, procure se informar antes de ir."`
  },
  {
    sectionTitle: "Praia do Leão - Desova de Tartarugas", 
    chapter: "praias",
    section: "praias",
    content: `**Descrição:** Uma das mais conhecidas do Mar de Fora, costuma ter grandes ondas. A Praia do Leão é um importante local de desova para tartarugas marinhas.

**Atividades Recomendadas:** Observação de tartarugas (sempre com orientação do Tamar), caminhadas na praia, fotografia.

**Acesso:** Por uma trilha que leva à praia, com um mirante para observar a vista panorâmica. Ela faz parte do parque, então tem que fazer a carteira de visitação.

**Dicas do Tuca:**
- "Melhores Momentos para Ver Tartarugas: Entre janeiro e junho, durante a temporada de desova. Visite ao amanhecer ou ao entardecer para melhores chances, busque sempre orientação no Tamar."
- "Dicas de Segurança e Conservação: Respeite as áreas de desova das tartarugas e mantenha uma distância segura. Evite o uso de luzes brilhantes durante a noite. Cuidado com as correntezas marítimas."
- "Equipamentos Recomendados: Leve uma câmera com zoom para capturar as tartarugas de longe sem perturbá-las. Leve também guarda-sol, pois é bem difícil achar uma sombra."`
  },
  {
    sectionTitle: "Gastronomia - Festival Gastronômico do Zé Maria",
    chapter: "gastronomia",
    section: "restaurantes", 
    content: `**Descrição:** O Festival Gastronômico do Zé Maria acontece às quartas e sábados das 20h às 00h, no Restaurante da Pousada Zé Maria. Você encontrará uma variedade de mais de 40 pratos, entre peixes, frutos do mar, carnes e comida japonesa. Na mesa de sobremesas, tortas, bolos, pudins e mousses não podem faltar.

**Dicas do Tuca:** "Esse merecia um capítulo todo para ele, não só pela qualidade da comida, que é incrível, mas pelo evento que é essa noite. Tem karaokê, dança, muita animação e ainda prêmios para os que cantam bem e mais ainda para os que cantam mal. E o Zé Maria, meu pai, é o carismático anfitrião noronhense que garante a diversão. Não dá para descrever por aqui, realmente é um compromisso obrigatório para quem vem a Noronha. E vai com fome, hein, tem muita variedade boa..."

**Mergulhão:**
- **Descrição:** Um dos restaurantes mais famosos da ilha, com vista panorâmica para o porto e pratos sofisticados.
- **Dicas do Tuca:** "Gosto de comer lá no final de tarde e sempre peço a entrada que leva o nome do restaurante, um mix de frutos do mar delicioso."

**Bar do Meio:**
- **Descrição:** Ótimo local para ver o pôr do sol enquanto desfruta de petiscos e drinks, com música ao vivo.
- **Dicas do Tuca:** "Um lugar descolado, ponto alto para quem quer ver o pôr do sol e curtir um som meio balada. Não tenho prato preferido, geralmente fico nas entradinhas clássicas como isca de peixe."`
  },
  {
    sectionTitle: "Atividades Aquáticas - Mergulho e Passeios",
    chapter: "atividades",
    section: "atividades",
    content: `**Mergulho de Cilindro:**
Fernando de Noronha é um paraíso para os amantes do mergulho com cilindro. Com águas claras e uma abundante vida marinha, você terá experiências inesquecíveis.

**Tipos de Mergulho:**
- **Batismo:** Para iniciantes, com um instrutor por pessoa. Inclui aula no barco sobre uso de equipamentos e normas de segurança.
- **Credenciado:** Para mergulhadores certificados, com dois mergulhos em diferentes pontos da ilha.

**Dicas do Tuca:** "Mesmo se o tempo não estiver perfeito, o mergulho ainda vale muito a pena. Não precisa saber nadar, pois você estará sempre acompanhado por um instrutor."

**Bike Aquática:**
- **Descrição:** O passeio dura entre 45 minutos e 1 hora, começa na Praia do Porto e passa por faixas de areia como a da Biboca, do Cachorro e a do Meio.
- **Dicas do Tuca:** "Pela manhã, a chance de ver golfinhos é maior."

**Canoa Havaiana:**
- **Descrição:** A expedição combina aventura e contemplação, com um roteiro de 4 km saindo da Praia do Porto.
- **Dicas do Tuca:** "Tente ir no horário do nascer do sol. A chance de ver golfinhos de perto é alta e o visual do sol nascendo é inesquecível."`
  },
  {
    sectionTitle: "Trilhas em Fernando de Noronha", 
    chapter: "trilhas",
    section: "trilhas",
    content: `Explorar Fernando de Noronha a pé é uma das melhores maneiras de apreciar sua beleza natural.

**Trilha Atalaia Pontinha Caieira:**
- **Descrição:** 4h de duração, 6,2 km, passando por três piscinas naturais.
- **Dicas do Tuca:** "Use colete flutuante e máscara com snorkel. Leve calçado confortável e água."

**Trilha Capim-Açu:**
- **Descrição:** 6h de duração, 12 km. Passa por mata nativa, mirantes e caverna.
- **Dicas do Tuca:** "Recomendada para quem gosta de desafios. Contrate um guia."

**Trilha Costa da Esmeralda:**
- **Descrição:** Autoguiada, 4h de duração, 5 km pelo mar de dentro.
- **Dicas do Tuca:** "Ótima para snorkeling e fotos incríveis."

**Trilha do Piquinho:**
- **Descrição:** 2h de duração, 1,3 km de subida.
- **Dicas do Tuca:** "Recomendada para ver o nascer ou pôr do sol. Contrate um guia para segurança."`
  },
  {
    sectionTitle: "História e Cultura - Fortes e Museus",
    chapter: "historia",
    section: "historia", 
    content: `**Forte de Nossa Senhora dos Remédios:**
**Descrição:** Um dos principais pontos históricos da ilha, construído no século XVIII, oferece uma vista panorâmica incrível e representa a arquitetura militar portuguesa.

**Dicas do Tuca:** "Visite o Forte ao entardecer para capturar belas fotos do pôr do sol. Em vários pontos que você vai passar durante seus passeios poderá ver ruínas, sempre pergunte ao seu guia o que são elas, tem sempre uma história intrigante por trás."

**Museu do Tubarão:**
**Descrição:** Oferece uma visão sobre a fauna marinha local e a importância da preservação dos tubarões.

**Dicas do Tuca:** "Ótimo lugar para aprender mais sobre a vida marinha e a importância da conservação dos tubarões. As crianças adoram e os adultos também se surpreendem."

**Administração da Ilha:**
Fernando de Noronha é administrada pelo Governo do Estado de Pernambuco, através da Administração do Distrito Estadual de Fernando de Noronha. A ilha é considerada um distrito estadual, sem município próprio.

**Taxa de Preservação Ambiental (TPA):** Para ajudar na conservação, visitantes devem pagar a Taxa de Preservação Ambiental, calculada com base na duração da estadia.`
  }
];

async function ingestContent() {
  console.log("🚀 Iniciando ingestão do conteúdo do guia...");

  for (const section of guideContent) {
    try {
      console.log(`📝 Ingerindo: ${section.sectionTitle}`);
      
      const result = await client.action(api.guide.ingestGuideSectionToRAG, {
        sectionTitle: section.sectionTitle,
        content: section.content,
        section: section.section,
        chapter: section.chapter,
        tags: [section.section, section.chapter]
      });

      console.log(`✅ Sucesso: ${section.sectionTitle} - ${result.chunksIngested} chunks`);
    } catch (error) {
      console.error(`❌ Erro ao ingerir ${section.sectionTitle}:`, error);
    }
  }

  console.log("🎉 Ingestão do conteúdo concluída!");
}

// Execute if run directly
if (require.main === module) {
  ingestContent().catch(console.error);
}

export { ingestContent };
