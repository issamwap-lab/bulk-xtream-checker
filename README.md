# Bulk Xtream Checker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A fast, parallelized Next.js application designed to verify IPTV/Xtream Codes credentials in bulk. Active lines are displayed in a real-time, sortable table and cached safely on the client side.

## 🚀 Features

- **Parallel Verification:** Validates multiple lines concurrently using custom configuration limits (`CHECK_CONCURRENCY`).
- **Real-Time UI Updates:** Active rows appear seamlessly as they resolve, accompanied by a global progress bar.
- **Smart Data Handling:** 
  - Automatically deduplicates input lines before initiating checks.
  - Reclassifies "Lifetime/Unlimited" accounts seamlessly.
  - Skips, counts, and filters out expired, banned, or unreachable links.
- **Local Persistence:** Results are saved strictly inside the visitor's browser (`localStorage`). No server-side storage or logging of your credentials takes place.
- **Fully Interactive Table:** Sort rows instantly by clicking any column header.
- **Control Flows:** Pause/Stop a running check at any time without losing already processed rows.

## 🛠️ Configuration

Tunable parameters can be adjusted globally inside `lib/config.ts`:

| Parameter | Description | Default |
| :--- | :--- | :--- |
| `LINE_CHECK_TIMEOUT_MS` | Server-side max timeout for an individual provider call | `8000` (8s) |
| `CLIENT_CHECK_TIMEOUT_MS` | Client-side safety threshold before dropping the request | Varies |
| `CHECK_CONCURRENCY` | Maximum number of concurrent validation threads | `6` |

## 📋 Supported Formats

The parser normalizes one API credential per line. The following formats are natively supported:

* **URL Style:** `http://host:port/player_api.php?username=...&password=...`
* **M3U Style:** `http://host:port/get.php?username=...&password=...&type=m3u_plus&output=ts`
* **Excel / Space-Separated:** `http://host:port username password`

## ⚙️ Getting Started

Follow these instructions to set up and run the project locally on your machine.

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

### Local Installation

1. Clone the repository:
```bash
git clone [https://github.com/issamwap/bulk-xtream-checker.git](https://github.com/issamwap/bulk-xtream-checker.git)
```

2. Navigate into the project folder:
```bash
cd bulk-xtream-checker
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

5. Open the URL printed in the terminal (usually http://localhost:3000).

## 🔒 Privacy & API Design

- **`POST /api/check-line`**: This endpoint handles normalization and contacts the remote provider's `player_api.php`.
- **Zero Logging:** Credentials pass through the endpoint solely for routing to bypass CORS restrictions; they are never written to a database or stored on the server.

## 📄 License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute this software, provided that the original copyright notice and attribution are included. See the [LICENSE](./LICENSE) file for details.
