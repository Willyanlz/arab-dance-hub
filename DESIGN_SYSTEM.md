# Design System - Arab Dance Hub (F.A.D.D.A 2026)

Este documento serve como a **Fonte Única de Verdade (Single Source of Truth)** para a identidade visual e os padrões de desenvolvimento do projeto Arab Dance Hub. Qualquer evolução do site deve seguir rigorosamente estas diretrizes para manter a consistência e a estética premium.

---

## 1. Tipografia

O sistema utiliza duas fontes principais, carregadas via Google Fonts:

- **Serifada (Títulos):** `Playfair Display`
  - **Uso:** Cabeçalhos (`h1`, `h2`, `h3`, `h4`), nomes de sessões e elementos de destaque que evocam elegância e tradição.
  - **Classes Tailwind:** `font-serif`
- **Sem Serifa (Corpo/UI):** `Inter`
  - **Uso:** Textos de corpo, botões, formulários, labels e interfaces administrativas.
  - **Classes Tailwind:** `font-sans`

### Escala de Texto Comum
- **Hero Title:** `text-5xl md:text-7xl font-bold` (Playfair)
- **Section Headers:** `text-3xl md:text-4xl font-bold` (Playfair)
- **Subtitles/Cards:** `text-lg md:text-xl` (Playfair/Inter)
- **Body:** `text-base` (Inter)

---

## 2. Paleta de Cores (Theming)

As cores são definidas como variáveis CSS HSL no `src/index.css`.

### Cores de Marca (Brand)
| Nome | Variável CSS | Tailwind Class | Cor (HSL) | Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Ouro (Gold)** | `--gold` | `text-gold` / `bg-gold` | `38 70% 45%` | Cor primária, botões de ação, ícones. |
| **Ouro Claro** | `--gold-light` | `text-gold-light` | `38 60% 65%` | Destaques em fundo escuro, badges. |
| **Borgonha** | `--burgundy` | `text-burgundy` | `345 40% 35%` | Cor secundária, fundos de destaque. |
| **Areia (Sand)** | `--sand` | `bg-sand` | `35 30% 92%` | Fundos de cards (Light Mode). |
| **Areia Escura** | `--sand-dark` | `text-sand-dark` | `35 20% 80%` | Textos suaves em fundo escuro. |

### Semantic Colors (Shadcn/UI)
- **Background:** `hsl(35 30% 97%)` (Fundo claro/creme)
- **Foreground:** `hsl(20 20% 15%)` (Texto principal quase preto)
- **Primary:** Mapeado para o **Gold**.
- **Secondary:** Mapeado para o **Burgundy**.
- **Destructive:** `hsl(0 84.2% 60.2%)` (Vermelho para proibições/erros).

---

## 3. Estilos e Gradientes Customizados

Definidos em `@layer utilities` no `index.css`:

### Gradientes
- **`.text-gradient-gold`**: Gradiente linear de 135° entre tons de ouro. Usado em títulos de alto impacto.
- **`.bg-gradient-gold`**: Gradiente de fundo para botões primários.
- **`.bg-gradient-hero`**: Gradiente escuro profundo (`20 20% 12%` -> `345 45% 25%`) usado como overlay ou fundo de seções principais.

### Efeitos Visuais
- **`.shimmer`**: Efeito de brilho animado que percorre o elemento. Usado em botões de CTA principais para atrair o olhar.
- **Bordas:** Usar `border-gold` ou `border-gold/50` para dar o toque de luxo aos cards e botões.

---

## 4. Componentes e Padrões (UI Patterns)

### Botões (Buttons)
- **Botão Primário:** `className="bg-gradient-gold text-primary-foreground shimmer"`
- **Botão Outline:** `variant="outline" className="border-gold text-gold-light hover:bg-gold/10"`

### Cards
- Fundo: `bg-card`
- Borda: `border-border`
- Hover: `hover:border-gold/50 transition-colors`

### Layout e Espaçamento
- **Container Máximo:** `max-w-6xl mx-auto` ou `max-w-4xl` para textos centralizados.
- **Padding de Sessão:** `py-20 px-4` (padrão para seções verticais).

---

## 5. Configuração Tailwind (`tailwind.config.ts`)

O arquivo de configuração estende o tema base para incluir:
- **borderRadius:** `lg: var(--radius)` (0.75rem).
- **keyframes:** Inclui `fade-in`, `accordion-down`, `accordion-up`.
- **dark-mode:** Suporta a classe `.dark`.

---

## Instruções para Evolução (AI Guidelines)

Ao criar novos componentes ou páginas:
1. **Priorize Semântica:** Use `primary` para ouro e `secondary` para borgonha.
2. **Contraste:** Em fundos escuros (`bg-gradient-hero`), use `text-gold-light` ou `text-sand-dark`.
3. **Elegância:** Use `font-serif` para títulos. Não economize no espaçamento (`py-20`).
4. **Interatividade:** Adicione `transition-colors` e efeitos de hover suaves.
5. **Gradients:** Títulos principais devem quase sempre usar `.text-gradient-gold`.

# 🚀 Design System + Arquitetura Frontend  
## Arab Dance Hub (F.A.D.D.A 2026)

> Single Source of Truth (SSOT) para UI, UX e desenvolvimento frontend.

---

# 📱 0. Filosofia Base

## Mobile-First (OBRIGATÓRIO)
- Todo layout começa em mobile
- Breakpoints apenas para expansão (md, lg, xl)

## Componentização
- Tudo reutilizável, desacoplado e independente

## Roteamento
- Cada tela = uma rota

---

# 🧠 1. Arquitetura

src/
 ├── app/
 │   ├── home/
 │   ├── events/
 │   ├── artists/
 │   ├── dashboard/
 │   └── auth/
 ├── components/
 │   ├── ui/
 │   ├── shared/
 │   ├── layout/
 │   └── sections/

---

# 🔁 2. Regra CRÍTICA

Cada componente:
- Deve ser isolado
- Deve poder ser reutilizado
- Deve ser acessado via rota ou composição

---

# 🎨 3. Tipografia

- Playfair Display → títulos
- Inter → corpo

---

# 🎨 4. Cores

Gold, Burgundy, Sand

---

# ⚛️ 5. React

- TypeScript obrigatório
- Sem any
- Lógica fora do JSX

---

# 🔀 6. Rotas

/  
/events  
/events/[id]  

---

# ⚡ 7. Performance

- Lazy loading
- Code splitting

---

# ♿ 8. Acessibilidade

- aria-label
- contraste
- teclado

---

# 🧠 9. Diretrizes IA

Deve:
- Mobile-first
- Componentes isolados

Não deve:
- Código gigante
- Misturar responsabilidades

---

# 🏁 Conclusão

Projeto deve ser:
- Escalável
- Limpo
- Reutilizável

---
*Atualizado em: 9 de Abril de 2026*
