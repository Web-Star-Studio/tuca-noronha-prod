# Visão Geral da Plataforma: Tuca Noronha

Este documento fornece uma visão geral do sistema da plataforma de turismo Tuca Noronha, seus principais objetivos e arquitetura tecnológica.

## 1. Propósito Principal

O sistema é um **hub de turismo B2B2C** projetado para ser o ponto central para todas as atividades turísticas em Fernando de Noronha. Ele conecta viajantes a uma rede completa de serviços locais, com dois objetivos centrais:

- **Para o Viajante:** Oferecer uma experiência "one-stop-shop" para descobrir, planejar, reservar e pagar por todos os serviços em Noronha de forma integrada e segura.
- **Para o Parceiro Local:** Fornecer uma ferramenta digital robusta para que os empreendedores locais possam gerenciar seus serviços, alcançar mais clientes, controlar reservas e profissionalizar suas operações.

## 2. Objetivos Chave

- **Centralização:** Unificar a oferta turística da ilha em um único marketplace digital.
- **Automação:** Automatizar processos de reserva, pagamento e comunicação, reduzindo o trabalho manual para parceiros e administradores.
- **Empoderamento:** Dar aos parceiros locais controle total sobre seus produtos, preços e disponibilidade.
- **Experiência do Usuário:** Proporcionar um fluxo de planejamento e reserva de viagens simples, seguro e personalizado para o turista.

## 3. Principais Funcionalidades

A plataforma é construída sobre um conjunto de domínios de negócio interconectados:

- **Gestão de Ativos:** Parceiros podem gerenciar uma vasta gama de serviços, incluindo:
  - Atividades (passeios, mergulho)
  - Eventos
  - Restaurantes
  - Aluguel de Veículos
  - Pacotes Turísticos

- **Sistema de Reservas Unificado:** Um fluxo de booking consistente para todos os tipos de ativos, com um sistema de pagamento seguro via **Stripe Connect**. Uma característica chave é a **captura manual de pagamento**, onde o valor é apenas autorizado no momento da reserva e capturado após a confirmação do parceiro.

- **Controle de Acesso (RBAC):** Um sistema sofisticado de permissões com quatro papéis principais:
  - **Traveler:** O cliente final.
  - **Partner:** O dono do negócio/serviço.
  - **Employee:** Funcionário de um parceiro com permissões delegadas.
  - **Master:** Administrador da plataforma.

- **Dashboards de Gestão:** Painéis de controle dedicados para parceiros e administradores gerenciarem reservas, finanças, produtos e configurações.

- **Sistemas Avançados:**
  - **Sistema de Cupons:** Ferramenta completa para criação e gerenciamento de cupons de desconto com regras complexas.
  - **Sistema de Vouchers:** Geração automática de vouchers profissionais com QR Code para verificação no check-in.
  - **Chat Integrado:** Comunicação direta em tempo real entre viajantes e parceiros.

## 4. Arquitetura e Tecnologia

A plataforma utiliza uma stack moderna para garantir performance, escalabilidade e uma excelente experiência de desenvolvimento.

- **Frontend:** Next.js 15 (com App Router), React 19, TypeScript.
- **UI:** Tailwind CSS e Shadcn/ui.
- **Backend & Banco de Dados:** Convex (plataforma de backend reativa).
- **Autenticação:** Clerk.
- **Pagamentos:** Stripe (com Stripe Connect para pagamentos de marketplace).
