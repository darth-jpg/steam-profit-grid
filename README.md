# 📈 Steam Profit Grid (To Profit or Not to Profit)

> An advanced financial and analytical dashboard designed to optimize Steam farming and item trading, complemented by a companion browser extension for automated telemetry syncing.

---

## 🚀 Key Features

### 📈 1. Interactive Analytical Table (The Profit Grid)
* **TOP 50 Active Steam Games:** Enriched database containing 50 popular Steam titles with active community market economies (CS2/Rust skins, TF2 keys, War Thunder trophies, and popular clicker items like Banana, Cats, Cucumber, and Egg).
* **Smooth Pagination:** Clean table layouts presenting exactly **10 games per page**, fully integrated with query searches and profile filters.
* **Farming Profile Filters:** Instantly filter matches optimized for low-end machines (`Low-Spec AFK`), high profitability (`High Yield`), or rapid volatility (`Hype Speculation`).
* **Accordion Grid View:** Click on any game row to expand it vertically on the spot, rendering dynamic Recharts 7-day price trend history and custom Hype metrics side-by-side.
* **Side-by-Side Asset Comparison:** Select up to 2 games using the GitCompare panel to get an automated system verdict comparing active players, volume, liquidity, and net hourly ROI.
* **Excel-Compatible CSV Export:** Download data directly from the grid in a localized `.csv` format (configured with Excel UTF-8 BOM and `;` delimiters).

### 💼 2. Wallet Simulator & Parallel Scanner
* **Parallel Steam ID Scanner:** Enter your SteamID64 or profile URL and the Next.js API query-fetches all supported app inventories in parallel (`Promise.all`) behind the scenes.
* **Interactive Allocation Pie Chart:** Visualizes asset share distribution by value in your wallet. **Click on any slice of the chart** to instantly filter the loaded items table for that specific game.
* **Clean Default State:** Starts completely empty, letting you build custom simulations manually or load inventories via public Steam scans.

### 🔌 3. Chrome Companion Extension (Plugin)
* **Silent Telemetry Syncing:** A lightweight Google Chrome Manifest V3 browser extension.
* **Background Integration:** When you navigate to your Steam Community Inventory page, the extension automatically counts items and POSTs telemetry payloads to the dashboard's `/api/report-farm` endpoint, keeping your wallet up to date effortlessly.

---

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router, React 19, TypeScript)
* **Design & Styling:** Vanilla CSS (Charcoal background `#0b0e14`, Emerald Green `#0ecb81` for yields, Crimson Red `#f6465d` for market fees)
* **Charts:** Recharts (Area, Line, and interactive Pie Chart)
* **Icons:** Lucide React
* **Extension:** Chrome Extensions Manifest V3 (Vanilla JS, HTML)
* **APIs:** Seamless integration with official Steam Web API endpoints

---

## 📦 Getting Started

### 💻 Web Dashboard (Next.js)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/darth-jpg/steam-profit-grid.git
   cd steam-profit-grid
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   Create a `.env.local` file in the root directory and add your Steam Web API Key to enable Vanity URL resolving:
   ```env
   STEAM_API_KEY=YOUR_STEAM_API_KEY
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

5. **Generate Production Build:**
   ```bash
   npm run build
   ```

---

### 🔌 Chrome Companion Extension (Plugin)

To load the extension locally in your browser:

1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **Developer Mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `/extension` folder located inside your cloned project directory:
   `steam-profit-grid/extension`
5. Click on the extension icon in your browser toolbar, configure your dashboard server URL (e.g., `http://localhost:3000`), and save your Steam ID.
6. Open your public Steam inventory page in Chrome and check the console logs to see telemetry being reported in the background!

---

## 🚀 Deploy

This application is fully optimized and ready to deploy to the **Vercel Platform** with a single click by connecting your GitHub repository.
