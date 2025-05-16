# Sistema de Controle de Acesso Baseado em Papéis (RBAC) para Tuca Noronha

## 1. Introdução

Este documento descreve o sistema de Controle de Acesso Baseado em Papéis (RBAC) para a plataforma Tuca Noronha. O objetivo do RBAC é garantir que os usuários tenham acesso apenas às funcionalidades e dados relevantes para suas responsabilidades e necessidades, protegendo a integridade e a segurança do sistema.

A plataforma Tuca Noronha utilizará Next.js 15, React 19, Convex como banco de dados e Clerk para autenticação e gerenciamento de usuários. Os papéis definidos serão armazenados e gerenciados em conjunto com o Clerk e a lógica de autorização será implementada nas funções backend do Convex.

## 2. Definição dos Papéis (Roles)

Identificamos quatro papéis principais na plataforma Tuca Noronha:

1.  **Traveler (Viajante):**
    * **Descrição:** Usuário final que consome os serviços oferecidos pela plataforma, como reserva de hospedagens, compra de atividades, aluguel de carros, etc.
    * **Objetivo Principal:** Encontrar, reservar e gerenciar seus serviços de viagem.

2.  **Partner (Parceiro):**
    * **Descrição:** Entidade (empresa ou indivíduo) que possui um ou mais ativos (hotéis, restaurantes, locadoras de veículos, provedores de atividades/eventos) e os disponibiliza no hub Tuca Noronha.
    * **Objetivo Principal:** Gerenciar seus ativos, disponibilidade, preços, reservas e sua equipe (Employees) na plataforma.

3.  **Employee (Colaborador do Parceiro):**
    * **Descrição:** Usuário que trabalha para um Partner e possui permissões delegadas por este para gerenciar aspectos específicos dos ativos do Partner.
    * **Objetivo Principal:** Auxiliar na gestão operacional dos ativos do Partner, conforme as permissões concedidas.

4.  **Master (Administrador Geral):**
    * **Descrição:** Administrador com acesso total ao sistema Tuca Noronha.
    * **Objetivo Principal:** Gerenciar toda a plataforma, usuários, parceiros, configurações e garantir o bom funcionamento do sistema.

## 3. Funcionalidades e Permissões por Papel

A seguir, detalhamos as principais funcionalidades e permissões (CRUD - Criar, Ler, Atualizar, Deletar) para cada papel em relação aos diferentes recursos da plataforma.

---

### 3.1. Traveler

| Recurso/Funcionalidade        | Criar (C) | Ler (R)   | Atualizar (U) | Deletar (D) | Observações                                                                 |
| :---------------------------- | :-------- | :-------- | :------------ | :---------- | :-------------------------------------------------------------------------- |
| **Conta Pessoal** | ✅         | ✅         | ✅             | ✅          | Gerenciar próprio perfil, preferências, dados de pagamento.                   |
| **Busca de Serviços** |           | ✅         |               |             | Hospedagens, Voos, Carros, Restaurantes, Atividades, Eventos.             |
| **Detalhes de Serviços** |           | ✅         |               |             | Ver informações completas, preços, disponibilidade, avaliações.            |
| **Reservas/Compras** | ✅         | ✅ (próprias) | ✅ (próprias)  | ✅ (próprias) | Conforme políticas de cancelamento/alteração.                             |
| **Lista de Desejos** | ✅         | ✅         | ✅             | ✅          | Salvar serviços de interesse.                                               |
| **Avaliações e Comentários** | ✅         | ✅         | ✅ (próprias)  | ✅ (próprias) | Apenas para serviços consumidos/reservados.                                 |
| **Histórico de Reservas** |           | ✅ (próprias) |               |             |                                                                             |
| **Pagamentos** | ✅         | ✅ (próprios) |               |             | Realizar pagamentos, ver histórico de transações.                           |
| **Notificações** |           | ✅         | ✅ (status)    |             | Receber notificações sobre reservas, promoções.                             |
| **Suporte ao Cliente** | ✅         | ✅ (próprios) |               |             | Abrir e acompanhar tickets de suporte.                                      |

---

### 3.2. Partner

| Recurso/Funcionalidade                | Criar (C) | Ler (R)         | Atualizar (U)   | Deletar (D)   | Observações                                                                                                |
| :------------------------------------ | :-------- | :-------------- | :-------------- | :------------ | :--------------------------------------------------------------------------------------------------------- |
| **Conta da Empresa/Parceiro** | ✅         | ✅               | ✅               | ⚠️ (Solicitar) | Gerenciar perfil da empresa, dados bancários, contatos.                                                    |
| **Ativos (Próprios)** | ✅         | ✅ (próprios)    | ✅ (próprios)    | ✅ (próprios)  | Hotéis, Restaurantes, Carros, Atividades, Eventos. Inclui fotos, descrições, comodidades.                  |
|   ↳ Disponibilidade e Preços          | ✅         | ✅ (próprios)    | ✅ (próprios)    | ✅ (próprios)  | Gerenciar inventário, tarifas, restrições, promoções para seus ativos.                                     |
| **Reservas (de seus Ativos)** |           | ✅ (de seus ativos) | ✅ (status)      | ⚠️ (conforme política) | Ver e gerenciar reservas recebidas para seus ativos (confirmar, cancelar, etc.).                          |
| **Employees (Colaboradores)** | ✅         | ✅ (de sua empresa) | ✅ (permissões) | ✅ (de sua empresa) | Convidar, gerenciar papéis de acesso dos seus Employees aos seus ativos.                                 |
| **Relatórios (de seus Ativos)** |           | ✅               |                 |               | Vendas, ocupação, performance.                                                                             |
| **Avaliações (de seus Ativos)** |           | ✅               | ✅ (responder)   |               | Ver e responder avaliações de seus serviços.                                                               |
| **Configurações (de seus Ativos)** |           | ✅               | ✅               |               | Políticas de cancelamento, regras específicas do ativo.                                                    |
| **Comunicação com Travelers** |           | ✅               | ✅               |               | Responder a perguntas sobre seus ativos/reservas (via sistema de mensagens).                             |
| **Pagamentos/Repasses** |           | ✅ (próprios)    |                 |               | Visualizar histórico de repasses.                                                                          |
| **Notificações** |           | ✅               | ✅ (status)      |               | Sobre novas reservas, cancelamentos, mensagens.                                                            |

---

### 3.3. Employee

O acesso do Employee é **condicional às permissões atribuídas pelo Partner** para ativos específicos.

| Recurso/Funcionalidade                | Criar (C) | Ler (R)         | Atualizar (U)   | Deletar (D)   | Observações                                                                                                                               |
| :------------------------------------ | :-------- | :-------------- | :-------------- | :------------ | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Conta Pessoal** |           | ✅               | ✅ (limitado)    |               | Gerenciar próprio perfil (nome, senha).                                                                                                   |
| **Ativos (Designados pelo Partner)** | ⚠️ (C.P.) | ✅ (C.P.)        | ✅ (C.P.)        | ⚠️ (C.P.)     | C.P. = Conforme Permissão. Pode incluir gerenciar fotos, descrições.                                                                      |
|   ↳ Disponibilidade e Preços          | ⚠️ (C.P.) | ✅ (C.P.)        | ✅ (C.P.)        | ⚠️ (C.P.)     | Gerenciar inventário, tarifas para ativos designados.                                                                                     |
| **Reservas (dos Ativos Designados)** |           | ✅ (C.P.)        | ✅ (status, C.P.) | ⚠️ (C.P.)     | Ver e gerenciar (confirmar, check-in/out, cancelar) reservas dos ativos aos quais tem acesso.                                           |
| **Relatórios (dos Ativos Designados)**|           | ✅ (C.P.)        |                 |               | Acesso limitado a relatórios operacionais dos ativos designados.                                                                          |
| **Comunicação com Travelers** |           | ✅ (C.P.)        | ✅ (C.P.)        |               | Responder a perguntas sobre ativos/reservas designados.                                                                                   |
| **Notificações** |           | ✅ (C.P.)        |                 |               | Sobre novas reservas, cancelamentos, mensagens relacionadas aos seus ativos.                                                              |
| *Não tem acesso a:* |           |                 |                 |               | Gerenciamento de outros Employees, configurações gerais da empresa do Partner, dados financeiros do Partner, criação de novos ativos. |

---

### 3.4. Master

| Recurso/Funcionalidade                | Criar (C) | Ler (R)   | Atualizar (U) | Deletar (D) | Observações                                                                                                                             |
| :------------------------------------ | :-------- | :-------- | :------------ | :---------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **Gerenciamento de Usuários (Todos)** | ✅         | ✅         | ✅             | ✅          | Inclui Travelers, Partners, Employees. Gerenciar papéis, status da conta (ativo, suspenso).                                           |
| **Gerenciamento de Partners** | ✅         | ✅         | ✅             | ✅          | Aprovar/reprovar novos cadastros, gerenciar contratos, suspender contas.                                                                  |
| **Gerenciamento de Ativos (Todos)** | ⚠️ (Mod.)  | ✅         | ✅ (Mod.)      | ✅ (Mod.)   | Mod. = Moderacional. Capacidade de intervir, editar ou remover ativos que violem políticas ou por questões de suporte.                 |
| **Gerenciamento de Reservas (Todas)** | ⚠️ (Sup.)  | ✅         | ✅ (Sup.)      | ✅ (Sup.)   | Sup. = Suporte. Acesso para fins de suporte, resolução de disputas.                                                                       |
| **Configurações da Plataforma** | ✅         | ✅         | ✅             | ✅          | Taxas, comissões, categorias de serviço, termos de uso, políticas de privacidade, integrações de pagamento, configurações de e-mail. |
| **Relatórios Globais e Analytics** |           | ✅         |               |             | Performance da plataforma, transações, crescimento de usuários/parceiros.                                                               |
| **Logs do Sistema e Auditoria** |           | ✅         |               |             | Acompanhar atividades importantes e alterações no sistema.                                                                              |
| **Gerenciamento de Conteúdo** | ✅         | ✅         | ✅             | ✅          | Moderação de avaliações, conteúdo gerado por usuários e parceiros.                                                                        |
| **Ferramentas de Suporte** | ✅         | ✅         | ✅             | ✅          | Gerenciar tickets de suporte, FAQs.                                                                                                     |
| **Gestão Financeira da Plataforma** |           | ✅         | ✅             |             | Conciliação, visão geral de transações, repasses.                                                                                       |

## 4. Gerenciamento de Papéis e Permissões

### 4.1. Atribuição de Papéis

* **Traveler:** Papel padrão para novos usuários que se cadastram na plataforma via Clerk para consumir serviços.
* **Partner:**
    * Pode ser um fluxo de cadastro específico para parceiros.
    * Após aprovação (pelo Master), o usuário Clerk é associado a um "Partner Account" no Convex e seu papel é atualizado nos metadados do Clerk (ex: `publicMetadata: { role: 'partner', partnerId: 'convexPartnerId' }`).
* **Employee:**
    * Convidado pelo Partner através da plataforma.
    * Um novo usuário Clerk é criado (ou um existente é vinculado) e associado à organização do Partner no Clerk e ao `partnerId` no Convex.
    * O papel "employee" é definido nos metadados do Clerk (`publicMetadata: { role: 'employee', partnerId: 'convexPartnerId', organizationId: 'clerkOrgId' }`).
* **Master:** Atribuído manualmente a usuários específicos (equipe Tuca Noronha) diretamente no Clerk ou através de uma interface administrativa interna.

### 4.2. Gerenciamento de Permissões de Employee pelo Partner

* O Partner terá uma interface para gerenciar seus Employees.
* Para cada Employee, o Partner poderá associá-lo a um ou mais dos seus **ativos** (ex: Hotel A, Atividade B).
* Para cada associação Employee-Ativo, o Partner poderá definir um **nível de permissão** ou um conjunto de permissões granulares. Exemplos de níveis:
    * **Visualizador:** Apenas lê informações do ativo e reservas.
    * **Operador:** Pode gerenciar disponibilidade, preços básicos, confirmar/cancelar reservas do ativo.
    * **Gerente do Ativo:** Controle quase total sobre o ativo específico (descrição, fotos, preços avançados, disponibilidade), mas não sobre outros ativos ou configurações do Partner.
* Essa lógica de permissão granular Employee-Ativo será armazenada no Convex (ex: tabela `employeeAssetPermissions`).

## 5. Considerações Técnicas com a Stack (Next.js, Convex, Clerk)

* **Clerk:**
    * Servirá como provedor de identidade primário.
    * Os papéis principais (Traveler, Partner, Employee, Master) podem ser armazenados nos `publicMetadata` ou `privateMetadata` do usuário no Clerk.
    * As "Organizações" do Clerk podem ser utilizadas para agrupar Partners e seus Employees, facilitando o gerenciamento de membros da equipe do parceiro.
    * O `userId` do Clerk será a chave para vincular ao perfil de usuário no Convex.

* **Convex:**
    * Armazenará todos os dados da aplicação (perfis de usuário detalhados, ativos dos parceiros, reservas, avaliações, etc.).
    * Uma tabela `users` no Convex armazenará informações adicionais e o `clerkId` para referência.
    * Funções backend (queries, mutations, actions) no Convex verificarão o papel do usuário (obtido de `ctx.auth.getUserIdentity()` e dos metadados do Clerk) antes de executar operações.
    * Para o gerenciamento granular de permissões Partner -> Employee -> Ativo, será necessário um modelo de dados específico no Convex. Por exemplo:
        * `partners`: { `userId` (Clerk ID do dono), `companyName`, ... }
        * `assets`: { `partnerId`, `type` (hotel, activity, etc.), `name`, ... }
        * `employeeAssignments`: { `employeeUserId` (Clerk ID), `partnerId`, `assetId`, `permissions`: ["view_reservations", "edit_availability"] }
    * A lógica de autorização dentro das funções Convex garantirá que um Employee só possa modificar ativos aos quais foi explicitamente designado pelo Partner com as permissões adequadas.

* **Next.js (Frontend):**
    * Utilizará os hooks do Clerk (`useUser`, `useAuth`) para obter informações do usuário autenticado e seu papel.
    * Renderizará condicionalmente componentes e funcionalidades da UI com base no papel e permissões do usuário.
    * Chamará as funções Convex (queries e mutations) que, por sua vez, aplicarão as regras de RBAC no backend.
    * Rotas protegidas e layouts específicos por papel podem ser implementados usando o middleware do Next.js e a verificação de autenticação/autorização do Clerk.

## 6. Fluxo de Exemplo (Partner gerenciando Employee)

1.  Um **Partner** loga na plataforma.
2.  Acessa a seção "Minha Equipe".
3.  Convida um novo **Employee** fornecendo um e-mail.
4.  O Employee recebe o convite, cria uma conta (ou loga se já tiver) e é associado à organização do Partner no Clerk.
5.  O Partner, na sua interface, vê o novo Employee e pode:
    * Associar o Employee a um ou mais dos seus ativos (ex: "Hotel Praia Linda").
    * Definir as permissões do Employee para o "Hotel Praia Linda" (ex: "Gerenciar Reservas", "Atualizar Tarifas").
6.  Quando o **Employee** loga, o sistema verifica suas permissões (via Convex, consultando as `employeeAssignments` relacionadas ao seu `userId` e `partnerId`).
7.  O Employee só poderá ver e interagir com o "Hotel Praia Linda" e apenas com as funcionalidades permitidas (ex: ver e confirmar reservas, mas não alterar a descrição principal do hotel).

Este sistema RBAC visa fornecer uma estrutura flexível e segura para o crescimento da plataforma Tuca Noronha, atendendo às diversas necessidades de seus usuários.
