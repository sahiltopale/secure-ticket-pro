# Local setup

## What you need

- **Node.js 20+**
- **npm** (comes with Node.js)
- **MetaMask** browser extension
- A wallet switched to **Sepolia Testnet**
- Some **Sepolia ETH** from a faucet for gas fees

## Install the app

1. Open a terminal in the project folder.
2. Install dependencies:

```bash
npm install
```

This installs everything already used by the app, including:

- `react`
- `vite`
- `typescript`
- `tailwindcss`
- `ethers`
- `@supabase/supabase-js`
- `html5-qrcode`
- `lucide-react`

You do **not** need to install these one by one.

## Run locally

Start the app:

```bash
npm run dev
```

Then open the local URL shown in the terminal, usually:

```bash
http://localhost:5173
```

## MetaMask setup

1. Open MetaMask.
2. Switch the network to **Sepolia Testnet**.
3. If Sepolia is missing, add it in MetaMask or let the app switch you automatically.
4. Make sure the wallet has **Sepolia ETH** for gas.

## Important blockchain note

The app is now wired to this deployed Sepolia contract:

```text
0x0f427d1e17A1C7D74d3604F4762e551AC1982e6D
```

You do **not** need to paste the contract address again and again.
Only update the address in the code if you deploy a **new contract** from Remix.

## If you redeploy from Remix later

Update the contract address in:

```text
src/services/blockchainService.ts
```

If the ABI changes, update the ABI there too.

## Backend note

The app already uses the connected backend project, so for normal local frontend testing you do **not** need to install a separate backend server.

## Recommended test flow

1. Run `npm run dev`
2. Log in
3. Connect MetaMask
4. Confirm MetaMask is on **Sepolia**
5. Book a seat
6. Check **My Tickets**
7. Scan and permit entry from mobile
8. Confirm the ticket moves without needing a page refresh