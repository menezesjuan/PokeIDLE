# ⚔️ PokeIDLE - Taskbar Hero Pokémon Idle Game

Um jogo IDLE no estilo **Taskbar Hero**, desenvolvido com **Phaser 3**, **TypeScript**, **Vite** e empacotado com **Electron**. Ele consome dados oficiais em tempo real da [PokéAPI](https://pokeapi.co) (com cache local inteligente), incluindo sprites animados, cálculo de atributos reais, árvores de evolução e catálogo de itens.

---

## 🎮 Funcionalidades Principais

### 1. Batalhas por Aproximação ("Bump Combat")
- Os Pokémons se movem e se chocam no centro da arena em intervalos baseados em suas velocidades.
- Efeitos visuais de impacto com recuo, vibração de tela e números flutuantes de dano (`-18`, `CRIT! -35`, `+HEAL`).
- Barras de vida dinâmicas com transições de cor (Verde -> Amarelo -> Vermelho).

### 2. Automação Idle Completa
- **Auto-Hunt**: Encontra e enfrenta novos Pokémons selvagens continuamente ao longo das rotas de Kanto.
- **Auto-Catch**: Arremessa Pokébolas automaticamente ao derrotar um selvagem, calculando taxa de captura da PokéAPI multiplicada pela Pokébola escolhida.
- **Auto-Heal**: Usa poções da mochila automaticamente sempre que o Pokémon ativo cair abaixo de determinada porcentagem de vida.
- **Auto-Sell Duplicates**: Opção de vender automaticamente cópias de Pokémons já obtidos por PokéDollars extras.

### 3. Mochila & Itens da PokéAPI
- **Pokébolas**: `Poké Ball` (1.0x), `Great Ball` (1.5x), `Ultra Ball` (2.0x) e `Master Ball` (100% garantida).
- **Poções de Cura**: `Potion` (+20 HP), `Super Potion` (+60 HP), `Hyper Potion` (+150 HP), `Max Potion` (100% HP) e `Full Restore` (100% HP).
- **Pedras de Evolução**: `Fire Stone`, `Water Stone`, `Thunder Stone`, `Leaf Stone`, `Moon Stone`, `Sun Stone`, `Ice Stone`, `Dusk Stone`, `Shiny Stone`.

### 4. Sistema de Evolução
- **Por Nível**: Pokémons evoluem automaticamente assim que atingem o nível mínimo estabelecido na PokéAPI (ex: Charmander no Lv.16 -> Charmeleon, Lv.36 -> Charizard).
- **Por Pedra**: Pokémons como Pikachu (Thunder Stone -> Raichu), Eevee (Vaporeon, Flareon, Jolteon), Gloom, Clefairy, etc., podem ser evoluídos usando as pedras obtidas na loja ou na mochila.

### 5. Poké Mart & Mercado de Pokémons
- **Comprar Itens**: Compre Pokébolas, Poções e Pedras evolutivas em pacotes de x1 ou x10.
- **Vender Itens**: Revenda itens da mochila por 50% do valor.
- **Vender Pokémons**: Venda Pokémons excedentes do seu PC Storage Box ou do time por PokéDollars com base no nível e raridade.

### 6. Mapa e Progressão por Rotas
- Explore rotas clássicas: **Route 1, Route 2, Viridian Forest, Route 3, Mt. Moon, Cerulean, Vermilion, Rock Tunnel, Pokémon Tower, Safari Zone, Seafoam Islands e Cinnabar Volcano**.
- Derrotar o número necessário de Pokémons em cada rota desbloqueia a rota subsequente.

### 7. Estilo Taskbar Hero
- **Modo Compacto**: Janela horizontal fina para deixar rodando enquanto trabalha ou navega.
- **Fixar no Topo (Always on Top)**: Mantenha o jogo sempre visível acima de outras janelas no Windows.

---

## 🚀 Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org) (v18 ou superior)

### 1. Modo Web (Navegador)
```bash
npm run dev
```
Acesse `http://localhost:5173` no seu navegador.

### 2. Modo Desktop (Electron Companion)
```bash
npm run electron:dev
```
Ou para rodar o build de produção:
```bash
npm run build
npm run electron:start
```

---

## 🛠️ Tecnologias Utilizadas
- **Engine 2D**: [Phaser 3/4](https://phaser.io/)
- **Desktop Runtime**: [Electron](https://www.electronjs.org/)
- **Bundler & Dev Server**: [Vite](https://vite.dev/)
- **Linguagem**: TypeScript
- **Dados & Sprites**: [PokéAPI](https://pokeapi.co/)
