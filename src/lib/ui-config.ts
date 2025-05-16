/**
 * UI Configuration - Design System Constants
 * 
 * Este arquivo centraliza as configurações de UI para manter consistência
 * entre componentes. Use estas constantes em vez de valores hardcoded.
 */

// Classes Tailwind para componentes de card
export const cardStyles = {
  // Estilo base para todos os cards
  base: "bg-card text-card-foreground rounded-xl shadow-sm transition-all duration-300 overflow-hidden",
  
  // Variações de hover
  hover: {
    default: "hover:shadow-md",
    lift: "hover:shadow-md hover:translate-y-[-4px]",
    scale: "hover:shadow-md hover:scale-[1.02]",
    highlight: "hover:border-primary/20",
  },
  
  // Variações de conteúdo
  content: {
    default: "p-4 space-y-3",
    compact: "p-3 space-y-2",
    spacious: "p-6 space-y-4",
  },
  
  // Variações de footer
  footer: {
    default: "px-4 py-3",
    separated: "px-4 py-3 mt-2 border-t border-border/30 bg-muted/10",
    flush: "px-4 py-3",
  }
};

// Classes para badges
export const badgeStyles = {
  // Estilos base para badges
  base: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  
  // Variantes semânticas que usam variáveis de tema
  variant: {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "bg-background shadow-sm text-foreground",
    success: "bg-emerald-500 text-white",
    warning: "bg-amber-500 text-white",
    danger: "bg-destructive text-destructive-foreground",
    info: "bg-blue-500 text-white",
  }
};

// Classes para botões de ação
export const buttonStyles = {
  // Variantes de botão
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
    outline: "bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    gradient: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm",
    soft: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  
  // Tamanhos
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-12 rounded-md px-6 text-base",
    xl: "h-14 rounded-md px-8 text-lg",
    icon: "h-10 w-10",
    "icon-sm": "h-8 w-8",
    "icon-lg": "h-12 w-12",
  },
  
  // Estilos de animação para botões
  animation: {
    pulse: "animate-pulse",
    slideIcon: "group-hover:translate-x-1 transition-transform duration-300"
  }
};

// Estilos para campos de formulário
export const formStyles = {
  // Base para inputs, selects, textareas
  input: {
    base: "flex h-10 w-full rounded-md bg-white px-3 py-2 text-sm shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  },
  
  // Selects
  select: {
    base: "flex h-10 w-full items-center justify-between rounded-md bg-white px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    trigger: "flex h-10 w-full items-center justify-between rounded-md bg-white px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    content: "bg-white shadow-md rounded-md border-0 p-1",
  },
  
  // Textarea
  textarea: {
    base: "flex min-h-[80px] w-full rounded-md bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  },
  
  // Switch/Toggle
  switch: {
    base: "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200",
    thumb: "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
  }
};

// Estilos para backgrounds decorativos
export const decorativeBackgrounds = {
  // Degradês suaves
  gradient: {
    subtle: "bg-gradient-to-br from-background to-muted",
    accent: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
    warm: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
    cool: "bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30",
  },
  
  // Elementos decorativos
  decorative: {
    blob: "animate-blob filter blur-3xl opacity-10 mix-blend-multiply",
    dots: "bg-grid-slate-200/50 dark:bg-grid-slate-800/50 bg-[length:20px_20px]",
    noise: "bg-noise-light dark:bg-noise-dark opacity-30"
  }
};

// Efeitos de transição
export const transitionEffects = {
  appear: {
    fadeIn: "animate-in fade-in duration-300",
    fadeInUp: "animate-in fade-in slide-in-from-bottom-4 duration-300",
    fadeInDown: "animate-in fade-in slide-in-from-top-4 duration-300",
    zoom: "animate-in fade-in zoom-in-95 duration-300",
  },
  
  disappear: {
    fadeOut: "animate-out fade-out duration-300",
    fadeOutUp: "animate-out fade-out slide-out-to-top-4 duration-300",
    fadeOutDown: "animate-out fade-out slide-out-to-bottom-4 duration-300",
    zoom: "animate-out fade-out zoom-out-95 duration-300",
  }
};

// Utilitários de tipografia
export const typography = {
  // Título principal
  title: {
    gradient: "bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent",
    warm: "bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent",
    cool: "bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent",
  },
  
  // Variantes de truncamento de texto
  truncate: {
    single: "whitespace-nowrap overflow-hidden text-ellipsis",
    lines: (lines: number) => `line-clamp-${lines}`
  }
};

// Efeitos de hover para imagens
export const imageEffects = {
  hover: {
    scale: "transition-transform duration-500 group-hover:scale-110",
    rotate: "transition-transform duration-500 group-hover:rotate-2 group-hover:scale-105",
    brighten: "transition-all duration-500 group-hover:brightness-110 group-hover:saturate-110",
  },
  
  overlay: {
    dark: "absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300",
    light: "absolute inset-0 bg-gradient-to-t from-white/60 via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300", 
  }
};