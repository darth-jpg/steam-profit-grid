# 📈 Steam Profit Grid (To Profit or Not to Profit)

> Um dashboard financeiro e analítico avançado concebido para otimizar o farming AFK, idle farming e trading de itens no Mercado da Comunidade Steam, complementado com uma extensão de navegador para sincronização automática.

---

## 🚀 Funcionalidades Principais (Key Features)

### 📈 1. Grelha Analítica Interativa (The Profit Grid)
* **TOP 50 Jogos Reais da Steam:** Base de dados atualizada e enriquecida com os 50 jogos mais populares da Steam com economias ativas de mercado (skins, caixas, chaves, cartas colecionáveis e jogos de clique).
* **Paginação Fluida:** Visualização organizada com **10 jogos por página** integrada com pesquisa textual e filtros.
* **Filtros por Perfil de Farmer:** Filtre instantaneamente por jogos adequados a máquinas fracas (`Low-Spec AFK`), alto rendimento (`High Yield`) ou especulação rápida (`Hype Speculation`).
* **Accordion Grid (Visualização em Leque):** Ao clicar em qualquer linha da tabela, ela expande-se verticalmente no local, renderizando o gráfico dinâmico Recharts de variação de preço a 7 dias e estatísticas de Hype exclusivas daquele jogo.
* **Comparador de Ativos:** Escolha 2 jogos em simultâneo utilizando a ferramenta GitCompare para obter um veredito automático de ROI líquido e liquidez lado a lado.
* **Exportação CSV:** Descarregue relatórios e cotações em formato `.csv` com formatação compatível com Excel UTF-8 BOM e delimitador `;`.

### 💼 2. Simulador de Carteira & Sincronizador Automático
* **Scanner Paralelo Multi-Jogo:** Insira o seu SteamID64 ou link de perfil e a API irá consultar todos os inventários de jogos suportados em paralelo (`Promise.all`) em segundo plano de forma otimizada.
* **Gráfico de Distribuição Interativo (Pie Chart):** Visualize a alocação de valor de cada jogo na sua carteira. **Clique em qualquer fatia do gráfico** para filtrar automaticamente a tabela de itens abaixo para esse jogo específico.
* **Carteira Limpa por Definição:** Comece do zero com a carteira vazia e adicione manualmente itens ou faça a leitura automática da Steam.

### 🔌 3. Extensão Chrome Companion (Plugin)
* **Telemetria Silenciosa:** Uma extensão leve Manifest V3 para o Google Chrome/Brave/Edge.
* **Integração:** Sempre que abrir a sua página de inventário na Steam Community, a extensão analisa a quantidade de itens visíveis e envia a telemetria via POST para o endpoint `/api/report-farm` do seu dashboard em background, mantendo a sua carteira sincronizada sem esforço.

---

## 🛠️ Tecnologias Utilizadas (Tech Stack)

* **Framework:** Next.js (App Router, React 19, TypeScript)
* **Design & Styling:** Vanilla CSS (Charcoal Background `#0b0e14`, Emerald Green `#0ecb81` para lucros, Crimson Red `#f6465d` para taxas)
* **Gráficos:** Recharts (Área, Linhas e Pie Chart)
* **Ícones:** Lucide React
* **Extensão:** Chrome Extensions Manifest V3 (Vanilla JS, HTML)
* **APIs:** Integração direta com a Steam Web API oficial

---

## 📦 Como Instalar e Correr Localmente (Getting Started)

### 💻 Dashboard Web (Next.js)

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/darth-jpg/steam-profit-grid.git
   cd steam-profit-grid
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configuração de Variáveis de Ambiente (Opcional):**
   Crie um ficheiro `.env.local` na raiz do projeto e configure a sua chave da API Steam para permitir a resolução de Vanity URLs:
   ```env
   STEAM_API_KEY=O_SEU_STEAM_API_KEY
   ```

4. **Iniciar o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Abra **[http://localhost:3000](http://localhost:3000)** no seu navegador.

5. **Gerar Build de Produção:**
   ```bash
   npm run build
   ```

---

### 🔌 Extensão Chrome Companion (Plugin)

Para carregar a extensão localmente no seu browser:

1. Abra o Google Chrome e aceda a `chrome://extensions/`.
2. Ative o **Developer Mode** (Modo de Programador) no canto superior direito.
3. Clique em **Load unpacked** (Carregar expandida) no canto superior esquerdo.
4. Selecione a subpasta `/extension` localizada dentro da pasta do repositório clonado:
   `steam-profit-grid/extension`
5. Clique no ícone da extensão no navegador, configure o URL do seu dashboard (ex: `http://localhost:3000`) e o seu Steam ID.
6. Aceda à página de inventário público da Steam no Chrome e veja a telemetria a ser enviada em background!

---

## 🚀 Deploy

A aplicação está totalmente configurada e otimizada para ser colocada online na **Vercel** com um único clique, bastando conectar a sua conta do GitHub!
