# Sistema de Reservas Reais - Guia de Teste

## Implementação Concluída

✅ **Integração com Convex realizada**
- Query `getUserReservations` criada para buscar todas as reservas do usuário
- Hook `useDashboard` atualizado para usar dados reais
- Componentes atualizados para exibir reservas do banco de dados

✅ **Mutation de teste criada**
- `seedTestReservations` permite criar dados de teste
- Cria atividades, restaurantes, hospedagens e reservas
- Apenas usuários master podem executar

✅ **Interface atualizada**
- Cards de estatísticas removidos
- Contador de reservas adicionado
- Loading state implementado
- Botão de teste (apenas em desenvolvimento)

## Como Testar

### 1. Acessar o Painel
- Faça login na aplicação
- Navegue até "Meu Painel"
- Observe que agora usa dados reais do Convex

### 2. Criar Dados de Teste (Desenvolvimento)
- No ambiente de desenvolvimento, aparecerá um card amarelo "Dados de Teste"
- Clique em "Criar Dados de Teste" 
- **Nota**: Apenas usuários com role "master" podem executar

### 3. Verificar Reservas
- Após criar dados de teste, as reservas aparecerão na seção "Próximas Reservas"
- Clique em "Ver Todas" para ver a lista completa
- Navegue para a aba "Reservas" para ver mais detalhes

### 4. Testar com Usuário Traveler
- Certifique-se de que existe um usuário com email "traveler@example.com"
- Role deve ser "traveler" 
- As reservas criadas aparecerão para este usuário

## Estrutura de Dados

### Tipos de Reservas Suportadas
- **Atividades**: Passeios, tours, mergulho
- **Eventos**: Shows, festivais, workshops
- **Restaurantes**: Reservas de mesa
- **Hospedagens**: Pousadas, hotéis
- **Veículos**: Aluguel de carros, motos

### Formato Unificado
```typescript
{
  id: string,
  type: 'activity' | 'event' | 'restaurant' | 'accommodation' | 'vehicle',
  name: string,
  date?: Date,
  checkIn?: Date,
  checkOut?: Date,
  guests: number,
  status: string,
  location: string,
  imageUrl: string,
  confirmationCode: string
}
```

## Próximos Passos

1. **Dados Reais de Produção**: Substituir dados de teste por reservas reais de usuários
2. **Notificações Reais**: Integrar sistema de notificações com dados do Convex
3. **Estatísticas Dinâmicas**: Implementar cálculos reais de pontos, economias, etc.
4. **Cache e Performance**: Otimizar queries para grandes volumes de dados

## Troubleshooting

### Erro "Usuário não autenticado"
- Verifique se está logado com Clerk
- Confirme que o usuário existe na tabela "users" do Convex

### Erro "Apenas usuários master podem executar"
- Verifique o role do usuário no banco
- Atualize o role para "master" se necessário

### Reservas não aparecem
- Confirme que existem reservas para o usuário logado
- Verifique se a query `getUserReservations` está retornando dados
- Use o Convex Dashboard para verificar os dados

### Loading infinito
- Verifique a conexão com o Convex
- Confirme que as variáveis de ambiente estão corretas
- Verifique o console do navegador para erros

## Comandos Úteis

```bash
# Iniciar desenvolvimento
npm run dev

# Acessar Convex Dashboard
npx convex dashboard

# Ver logs do Convex
npx convex logs
``` 