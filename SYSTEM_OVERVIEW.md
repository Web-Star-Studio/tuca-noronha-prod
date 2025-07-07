
# Visão Geral do Sistema: Hub de Turismo em Noronha

## 1. Propósito e Visão

O sistema foi concebido para ser o **hub central de turismo para Fernando de Noronha**, uma plataforma digital que conecta viajantes a uma rede completa de serviços locais, visando simplificar o planejamento de viagens e enriquecer a experiência do turista na ilha.

**O objetivo principal é duplo:**

1.  **Para o Viajante:** Oferecer uma "one-stop-shop" onde é possível descobrir, planejar, reservar e pagar por todas as experiências em Noronha de forma segura e integrada — desde a hospedagem até o passeio de barco.
2.  **Para o Parceiro Local:** Empoderar os empreendedores de Noronha, fornecendo uma ferramenta robusta para gerenciar seus serviços, alcançar mais clientes, controlar suas reservas e profissionalizar sua operação digital.

A plataforma busca ir além de um simples marketplace, utilizando tecnologia para oferecer personalização, recomendações inteligentes e comunicação direta, tornando cada viagem única.

---

## 2. Atores do Sistema

O ecossistema da plataforma é composto por três atores principais:

*   **Viajante (Turista):** O consumidor final. Suas principais ações incluem:
    *   Explorar e descobrir serviços (hospedagens, passeios, eventos, etc.).
    *   Montar roteiros personalizados e salvar itens em uma lista de desejos (`wishlist`).
    *   Realizar reservas e pagamentos online.
    *   Comunicar-se diretamente com os parceiros via chat.
    *   Receber e utilizar vouchers digitais.
    *   Avaliar os serviços após a utilização.

*   **Parceiro (Fornecedor de Serviço):** O empreendedor local. Suas principais ações incluem:
    *   Cadastrar e gerenciar seus serviços (atividades, eventos, veículos, etc.).
    *   Definir preços, disponibilidade e políticas.
    *   Receber e gerenciar reservas através de um painel de controle (`Meu Painel`).
    *   Confirmar reservas, o que pode incluir a captura de pagamentos pré-autorizados.
    *   Interagir com os viajantes via chat para tirar dúvidas.

*   **Administrador (Plataforma):** A equipe que opera o hub. Suas principais ações incluem:
    *   Gerenciar usuários (viajantes e parceiros).
    *   Monitorar a saúde do sistema e as transações.
    *   Acessar relatórios e logs de auditoria.
    *   Gerenciar configurações globais do sistema.
    *   Prestar suporte a usuários e parceiros.

---

## 3. Funcionalidades Principais

O sistema é organizado em domínios de negócio que refletem a jornada do usuário.

### 3.1. Descoberta e Planejamento
*   **Catálogo de Serviços:** Listagem completa de:
    *   Hospedagens
    *   Atividades (passeios, mergulho, etc.)
    *   Eventos (festas, shows, palestras)
    *   Restaurantes
    *   Aluguel de Veículos
*   **Pacotes Turísticos:** Combinação de múltiplos serviços em um único produto, facilitando a compra para o viajante.
*   **Busca e Filtros:** Ferramentas para que os usuários encontrem facilmente o que procuram com base em categorias, datas, preços, etc.
*   **Recomendações com IA:** O sistema utiliza os dados de preferência do usuário para sugerir atividades e serviços personalizados.
*   **Lista de Desejos (Wishlist):** Permite que os viajantes salvem seus itens de interesse para planejamento futuro.

### 3.2. Reservas e Pagamentos
*   **Fluxo de Reserva Unificado:** Um carrinho de compras e um processo de checkout consistentes para todos os tipos de serviços.
*   **Integração com Stripe:** Processamento de pagamentos seguro e robusto. O sistema utiliza `Stripe Connect` para gerenciar pagamentos entre viajantes e parceiros.
*   **Captura Manual de Pagamento:** Para atividades e eventos, o fluxo padrão é de **autorização e captura**. O valor é apenas autorizado no cartão do cliente no momento da reserva. O dinheiro só é capturado (transferido) quando o parceiro **confirma** a reserva, garantindo a disponibilidade.
*   **Status de Reserva:** As reservas passam por um ciclo de vida claro:
    1.  `awaiting_confirmation`: Reserva criada, aguardando aprovação do parceiro.
    2.  `confirmed`: Parceiro confirmou a reserva e o pagamento foi capturado.
    3.  `completed`: O serviço foi utilizado.
    4.  `canceled`: Reserva cancelada.

### 3.3. Comunicação
*   **Chat Integrado:** Um sistema de mensagens em tempo real que conecta viajantes e parceiros, permitindo a comunicação direta para tirar dúvidas sobre reservas e serviços.

### 3.4. Gestão para Parceiros (Dashboard)
*   **Painel de Controle (`Meu Painel`):** Uma área exclusiva onde o parceiro pode:
    *   Gerenciar seus anúncios (criar, editar, pausar).
    *   Visualizar e gerenciar suas reservas (confirmar, cancelar).
    *   Acompanhar o histórico de pagamentos.

### 3.5. Pós-Viagem
*   **Sistema de Vouchers:** Após a confirmação de uma reserva, um voucher digital é gerado e pode ser apresentado ao parceiro no momento do serviço.
*   **Avaliações e Reviews:** Viajantes podem avaliar os serviços que utilizaram, construindo uma base de confiança e feedback na plataforma.

---

## 4. Arquitetura e Tecnologia

*   **Frontend:** **Next.js 15+** com React, utilizando o App Router para uma arquitetura moderna e performática. A estilização é feita com **Tailwind CSS** e **Shadcn/ui** para componentes.
*   **Backend & Banco de Dados:** **Convex**, um backend platform que oferece um banco de dados reativo em tempo real, mutations, actions e cron jobs, tudo em um ambiente TypeScript.
*   **Pagamentos:** **Stripe**, para processamento de cartões de crédito e gestão de transações complexas.
*   **Autenticação:** **Clerk**, para uma gestão de usuários e autenticação moderna e segura.

---

## 5. Exemplo de Fluxo de Uso (Jornada do Viajante)

1.  **Descoberta:** Uma viajante, Ana, acessa a plataforma para planejar sua viagem a Noronha. Ela busca por "passeios de barco".
2.  **Seleção:** Ana encontra um passeio que lhe agrada, lê as avaliações e o adiciona à sua `wishlist`.
3.  **Reserva:** Alguns dias depois, ela decide reservar. Ela seleciona a data e o número de participantes e preenche suas informações de contato.
4.  **Pagamento:** Ana insere os dados do seu cartão de crédito. O sistema, através do Stripe, **autoriza** o valor total no cartão dela, mas ainda não realiza a cobrança. A reserva é criada com o status `awaiting_confirmation`.
5.  **Confirmação do Parceiro:** O parceiro, dono do barco, recebe uma notificação de nova reserva em seu painel. Ele verifica sua agenda e **confirma** a reserva.
6.  **Captura:** A confirmação do parceiro dispara a **captura** do pagamento no Stripe. O valor agora é efetivamente cobrado no cartão de Ana.
7.  **Notificação e Voucher:** Ana recebe um e-mail e uma notificação na plataforma confirmando sua reserva. O status da reserva muda para `confirmed` e um voucher digital é disponibilizado em sua conta.
8.  **Realização:** No dia do passeio, Ana apresenta o voucher ao parceiro.
9.  **Avaliação:** Após o passeio, a plataforma convida Ana a deixar uma avaliação sobre sua experiência. 