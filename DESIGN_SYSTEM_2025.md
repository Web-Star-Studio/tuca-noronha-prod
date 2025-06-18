# Design System 2025 - TN Next
## Sistema de Design Minimalista e Sofisticado

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Filosofia de Design](#filosofia-de-design)
3. [Paleta de Cores](#paleta-de-cores)
4. [Tipografia](#tipografia)
5. [Espaciamento e Layout](#espaciamento-e-layout)
6. [Componentes Base](#componentes-base)
7. [Padrões de Interface](#padrões-de-interface)
8. [Responsividade Mobile-First](#responsividade-mobile-first)
9. [Microinterações](#microinterações)
10. [Acessibilidade](#acessibilidade)
11. [Guia de Migração](#guia-de-migração)

---

## 🎯 Visão Geral

Este design system representa uma evolução sophisticada e minimalista da interface atual, focada em:

- **Clareza Visual**: Elementos com propósito claro e hierarquia bem definida
- **Elegância Discreta**: Sofisticação sem ostentação
- **Performance**: Otimização para carregamento rápido e interações fluidas
- **Acessibilidade Universal**: Design inclusivo para todos os usuários
- **Mobile-First**: Experiência impecável em dispositivos móveis

### Inspirações de Referência

- **Linear**: Interface clean e focada em produtividade
- **Notion**: Hierarquia de informações e espaçamento inteligente
- **Vercel**: Minimalismo técnico e tipografia refinada
- **Stripe**: Clareza em transações complexas
- **MynaUI**: Componentes modernos e bem estruturados

---

## 🎨 Filosofia de Design

### Principios Fundamentais

#### 1. **Minimalismo Intencional**
- Remover elementos desnecessários
- Cada elemento deve ter um propósito claro
- Priorizar conteúdo sobre decoração

#### 2. **Hierarquia Visual Clara**
- Uso estratégico de peso tipográfico
- Contraste inteligente para guiar o olhar
- Espaçamento como elemento de design

#### 3. **Consistência Sistemática**
- Padrões reutilizáveis em toda aplicação
- Comportamentos previsíveis
- Manutenibilidade através de tokens de design

#### 4. **Elegância Discreta**
- Sofisticação sem complexidade
- Animações sutis e intencionais
- Acabamentos refinados

---

## 🎨 Paleta de Cores

### Sistema de Cores Refinado

```css
/* Base Colors - Neutrals */
:root {
  /* Whites & Grays - Increased contrast */
  --white: #ffffff;
  --gray-50: #fafbfc;
  --gray-100: #f4f6f8;
  --gray-200: #e8ebef;
  --gray-300: #d1d9e0;
  --gray-400: #9ba5b4;
  --gray-500: #6b7684;
  --gray-600: #4a5568;
  --gray-700: #2d3748;
  --gray-800: #1a202c;
  --gray-900: #171923;
  
  /* Primary Blues - More sophisticated */
  --blue-50: #f0f4ff;
  --blue-100: #e0e9ff;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --blue-700: #1d4ed8;
  
  /* Semantic Colors */
  --success-500: #10b981;
  --warning-500: #f59e0b;
  --error-500: #ef4444;
  --info-500: #3b82f6;
}

/* Dark Theme */
.dark {
  --gray-50: #0a0e13;
  --gray-100: #161b22;
  --gray-200: #21262d;
  --gray-300: #30363d;
  --gray-400: #484f58;
  --gray-500: #656d76;
  --gray-600: #8b949e;
  --gray-700: #b1bac4;
  --gray-800: #c9d1d9;
  --gray-900: #f0f6fc;
}
```

### Aplicação de Cores

#### Backgrounds
- **Primário**: `--white` / `--gray-50` (dark)
- **Secundário**: `--gray-50` / `--gray-100` (dark)
- **Elevado**: `--white` com sombra sutil
- **Overlay**: `rgba(0,0,0,0.05)` / `rgba(255,255,255,0.05)` (dark)

#### Textos
- **Primário**: `--gray-900` / `--gray-100` (dark)
- **Secundário**: `--gray-600` / `--gray-400` (dark)
- **Terciário**: `--gray-500` / `--gray-500` (dark)
- **Disabled**: `--gray-400` / `--gray-600` (dark)

---

## ✍️ Tipografia

### Sistema Tipográfico Refinado

```css
/* Font Families */
:root {
  --font-primary: 'Inter Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', 'Fira Code', monospace;
}

/* Type Scale - Modular Scale 1.250 */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */

/* Line Heights */
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Aplicação Tipográfica

#### Hierarquia de Títulos
```tsx
// H1 - Page Title
className="text-3xl font-bold leading-tight text-gray-900 tracking-tight"

// H2 - Section Title  
className="text-2xl font-semibold leading-tight text-gray-900"

// H3 - Subsection Title
className="text-xl font-semibold leading-snug text-gray-900"

// H4 - Component Title
className="text-lg font-medium leading-snug text-gray-900"
```

#### Corpo de Texto
```tsx
// Body Large
className="text-lg leading-relaxed text-gray-700"

// Body Regular
className="text-base leading-normal text-gray-700"

// Body Small
className="text-sm leading-normal text-gray-600"

// Caption
className="text-xs leading-normal text-gray-500"
```

---

## 📐 Espaciamento e Layout

### Sistema de Espaciamento

```css
/* Spacing Scale - Base 4px */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Grid System

```tsx
// Container Sizes
const containers = {
  sm: "max-w-screen-sm",    // 640px
  md: "max-w-screen-md",    // 768px
  lg: "max-w-screen-lg",    // 1024px
  xl: "max-w-screen-xl",    // 1280px
  "2xl": "max-w-screen-2xl" // 1536px
}

// Layout Patterns
className="container mx-auto px-4 md:px-6 lg:px-8"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

### Elevação e Sombras

```css
/* Shadow System */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

---

## 🧩 Componentes Base

### Button - Refinado

```tsx
// Primary Action
<Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
  Confirmar Reserva
</Button>

// Secondary Action  
<Button className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200">
  Cancelar
</Button>

// Ghost Action
<Button className="bg-transparent hover:bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg transition-all duration-200">
  Editar
</Button>
```

### Card - Minimalista

```tsx
<Card className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
  <CardHeader className="p-6 pb-4">
    <CardTitle className="text-xl font-semibold text-gray-900">
      Título do Card
    </CardTitle>
  </CardHeader>
  <CardContent className="px-6 pb-6">
    <p className="text-base text-gray-600 leading-relaxed">
      Conteúdo do card com informações relevantes.
    </p>
  </CardContent>
</Card>
```

### Input - Clean

```tsx
<div className="space-y-2">
  <Label className="text-sm font-medium text-gray-700">
    Email
  </Label>
  <Input 
    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
    placeholder="seu@email.com"
  />
</div>
```

### Navigation - Sofisticada

```tsx
<nav className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full px-6 py-2 shadow-sm">
  <ul className="flex items-center space-x-8">
    <li>
      <a className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors duration-200">
        Início
      </a>
    </li>
    <li>
      <a className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200">
        Reservas
      </a>
    </li>
  </ul>
</nav>
```

---

## 🏗️ Padrões de Interface

### Dashboard Layout

```tsx
// Modern Sidebar Layout
<div className="flex h-screen bg-gray-50">
  {/* Sidebar */}
  <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
    <div className="p-6">
      <Logo />
    </div>
    <Navigation />
  </aside>
  
  {/* Main Content */}
  <main className="flex-1 overflow-y-auto">
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <PageTitle />
        <UserActions />
      </div>
    </header>
    <div className="p-6">
      <PageContent />
    </div>
  </main>
</div>
```

### Card Grid Patterns

```tsx
// Responsive Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <Card key={item.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300">
      <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
        <Image 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={item.image}
          alt={item.title}
        />
      </div>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {item.title}
        </h3>
        <p className="text-gray-600">
          {item.description}
        </p>
      </CardContent>
    </Card>
  ))}
</div>
```

### Form Patterns

```tsx
// Structured Form Layout
<form className="space-y-8">
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-6">
      Informações Básicas
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField>
        <Label>Nome Completo</Label>
        <Input />
      </FormField>
      <FormField>
        <Label>Email</Label>
        <Input type="email" />
      </FormField>
    </div>
  </div>
  
  <div className="flex justify-end space-x-4">
    <Button variant="ghost">Cancelar</Button>
    <Button type="submit">Salvar</Button>
  </div>
</form>
```

---

## 📱 Responsividade Mobile-First

### Breakpoints

```css
/* Mobile First Approach */
/* xs: 0px - 639px (default) */
/* sm: 640px+ */
/* md: 768px+ */
/* lg: 1024px+ */
/* xl: 1280px+ */
/* 2xl: 1536px+ */
```

### Padrões Mobile

#### Navigation Mobile
```tsx
// Mobile Hamburger Menu
<div className="lg:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="h-6 w-6" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="w-80">
      <nav className="flex flex-col space-y-4 mt-8">
        {navItems.map((item) => (
          <a 
            key={item.href}
            href={item.href}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <item.icon className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">{item.label}</span>
          </a>
        ))}
      </nav>
    </SheetContent>
  </Sheet>
</div>
```

#### Card Responsive
```tsx
// Responsive Card Layout
<Card className="w-full max-w-sm md:max-w-md lg:max-w-lg">
  <div className="aspect-[4/3] md:aspect-video overflow-hidden rounded-t-xl">
    <Image className="w-full h-full object-cover" />
  </div>
  <CardContent className="p-4 md:p-6">
    <h3 className="text-lg md:text-xl font-semibold mb-2">
      {title}
    </h3>
    <p className="text-sm md:text-base text-gray-600">
      {description}
    </p>
  </CardContent>
</Card>
```

#### Touch Targets
```css
/* Minimum touch target size */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Mobile-friendly spacing */
.mobile-spacing {
  padding: 1rem;
}

@media (min-width: 768px) {
  .mobile-spacing {
    padding: 1.5rem;
  }
}
```

---

## ✨ Microinterações

### Animações Sutis

```css
/* Smooth transitions */
.smooth-transition {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover effects */
.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.02);
}

/* Loading states */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.loading-pulse {
  animation: pulse-subtle 2s infinite;
}

/* Slide animations */
.slide-in-right {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Estados Interativos

```tsx
// Button with loading state
<Button 
  disabled={isLoading}
  className="relative"
>
  {isLoading && (
    <div className="absolute inset-0 flex items-center justify-center">
      <Spinner className="h-4 w-4" />
    </div>
  )}
  <span className={isLoading ? "opacity-0" : "opacity-100"}>
    Confirmar
  </span>
</Button>

// Input with validation states
<Input 
  className={cn(
    "transition-all duration-200",
    error && "border-red-500 focus:ring-red-500",
    success && "border-green-500 focus:ring-green-500"
  )}
/>
```

---

## ♿ Acessibilidade

### Contraste e Legibilidade

```css
/* WCAG AA Compliant Colors */
.text-high-contrast {
  color: #1a202c; /* 16.75:1 ratio on white */
}

.text-medium-contrast {
  color: #4a5568; /* 7.54:1 ratio on white */
}

/* Focus states */
.focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### Navegação por Teclado

```tsx
// Skip navigation
<a 
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
>
  Pular para conteúdo principal
</a>

// Proper heading hierarchy
<main id="main-content">
  <h1>Página Principal</h1>
  <section>
    <h2>Seção 1</h2>
    <h3>Subseção 1.1</h3>
  </section>
</main>
```

### ARIA Labels

```tsx
// Descriptive labels
<Button 
  aria-label="Fechar modal de reserva"
  aria-describedby="reservation-help-text"
>
  <X className="h-4 w-4" />
</Button>

// Status announcements
<div 
  role="status" 
  aria-live="polite"
  className="sr-only"
>
  {statusMessage}
</div>
```

---

## 🔄 Guia de Migração

### Fase 1: Fundações (Semana 1-2)

1. **Atualizar Sistema de Cores**
   ```diff
   - bg-blue-500
   + bg-blue-600
   
   - text-gray-500  
   + text-gray-600
   ```

2. **Implementar Nova Tipografia**
   ```tsx
   // Instalar Inter Variable
   npm install @next/font
   
   // Configurar em layout
   import { Inter } from 'next/font/google'
   const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
   ```

3. **Atualizar Espaciamento**
   ```diff
   - p-4
   + p-6
   
   - gap-4
   + gap-6
   ```

### Fase 2: Componentes (Semana 3-4)

1. **Refatorar Buttons**
   ```tsx
   // Substituir buttons existentes
   <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
   ```

2. **Atualizar Cards**
   ```tsx
   // Novo padrão de cards
   <Card className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
   ```

3. **Reformular Forms**
   ```tsx
   // Inputs com novo estilo
   <Input className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
   ```

### Fase 3: Layouts (Semana 5-6)

1. **Dashboard Sidebar**
   - Implementar novo layout de sidebar
   - Atualizar navegação mobile
   - Melhorar responsividade

2. **Grid Systems**
   - Padronizar grids responsivos
   - Implementar novos padrões de card

3. **Navigation**
   - Redesenhar header principal
   - Implementar breadcrumbs consistentes

### Fase 4: Refinamentos (Semana 7-8)

1. **Microinterações**
   - Adicionar animações sutis
   - Implementar estados de loading
   - Melhorar feedback visual

2. **Acessibilidade**
   - Revistar contraste de cores
   - Implementar navegação por teclado
   - Adicionar ARIA labels

3. **Performance**
   - Otimizar animações
   - Reduzir CSS desnecessário
   - Implementar lazy loading para componentes

---

## 📊 Métricas de Sucesso

### Performance
- **Lighthouse Score**: 95+ em todas as categorias
- **First Contentful Paint**: < 1.5s
- **Cumulative Layout Shift**: < 0.1

### Acessibilidade
- **WCAG AA Compliance**: 100%
- **Contrast Ratio**: Mínimo 7:1 para texto principal
- **Keyboard Navigation**: Funcional em todos os componentes

### User Experience
- **Mobile Usability**: Score 100 no Google PageSpeed
- **Touch Target Size**: Mínimo 44px em dispositivos móveis
- **Error States**: Mensagens claras e acionáveis

---

## 🚀 Próximos Passos

1. **Revisar Documento**: Alinhar com equipe sobre direcionamento
2. **Criar Protótipos**: Desenvolver componentes chave no Figma
3. **Implementar Gradualmente**: Seguir cronograma de migração
4. **Testar Continuamente**: Validar cada fase com usuários reais
5. **Documentar Progresso**: Manter changelog atualizado

---

*Este documento será atualizado conforme evoluímos o sistema. Última atualização: Janeiro 2025* 