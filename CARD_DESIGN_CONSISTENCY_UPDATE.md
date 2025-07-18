# Atualização de Consistência de Design - Cards

## Resumo
Padronizamos o design dos cards de **Restaurantes** e **Veículos** para seguir o mesmo layout dos cards de **Atividades** e **Eventos**, garantindo consistência visual em toda a aplicação.

## Mudanças Realizadas

### Estrutura Comum dos Cards

1. **Container Principal**
   - Classes: `group overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 rounded-xl flex flex-col h-full w-full bg-white`
   - Removido uso de componentes `Card`, `CardContent`, `CardFooter` do shadcn/ui
   - Usando `div` diretamente para maior controle

2. **Seção de Imagem**
   - Aspect ratio padronizado: `aspect-4/3`
   - Efeito hover: `group-hover:scale-105` na imagem
   - Badge de preço: canto inferior direito
   - Badge de categoria: canto superior esquerdo
   - Badges adicionais: canto superior direito (quando aplicável)

3. **Seção de Conteúdo**
   - Padding: `p-5`
   - Título e QuickStats lado a lado
   - Descrição curta com `line-clamp-2`
   - Informações adicionais com ícones
   - CTA padronizado com "Ver detalhes →"

### Mudanças Específicas

#### RestaurantCard
- **Removido**: componentes Card, Badge, imageEffects
- **Adicionado**: 
  - Badge de status "Aberto" quando aplicável
  - Tags de tipos de cozinha como pills
  - Localização abaixo do título
  - Status (aberto/fechado) no CTA

#### VehicleCard  
- **Removido**: Card, CardContent, WishlistButton, gradiente na imagem
- **Adicionado**:
  - Badge de transmissão no canto superior direito
  - Informações de ano e cor abaixo do título
  - Ícones padronizados para lugares, combustível e ano
  - QuickStats para avaliações

## Benefícios

1. **Consistência Visual**: Todos os cards agora seguem o mesmo padrão visual
2. **Melhor UX**: Informações organizadas de forma consistente
3. **Manutenibilidade**: Estrutura similar facilita futuras atualizações
4. **Performance**: Remoção de componentes desnecessários e uso direto de divs

## Próximos Passos

- Considerar criar um componente genérico `BaseCard` para reutilizar a estrutura comum
- Implementar sistema de avaliações real para veículos
- Adicionar funcionalidade de wishlist de volta aos cards (como botão flutuante ou no hover) 