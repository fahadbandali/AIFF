# AIFF - Personal Finance Manager

A full-stack personal finance application that connects to banks/credit cards via Plaid, allowing transaction auditing, categorization, and budget management.

## Features

- 🏦 **Bank Connection**: Securely connect bank accounts via Plaid
- 💰 **Account Dashboard**: View all connected accounts and balances
- 🔒 **Bank-Level Security**: AES-256-GCM encryption for access tokens
- 📊 **Transaction Tracking**: Coming soon
- 🏷️ **Smart Categorization**: Coming soon
- 📈 **Budget Management**: Coming soon

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- React Router v6 for routing
- TanStack Query for data fetching
- DaisyUI + Tailwind CSS for styling
- react-plaid-link for bank connection

### Backend
- Node.js with Express
- TypeScript
- LowDB for local JSON storage
- Plaid SDK for bank integration
- AES-256-GCM encryption for sensitive data

## Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm package manager (`npm install -g pnpm`)
- Plaid account (free Sandbox tier available)

### 1. Clone and Install

```bash
git clone <repository-url>
cd AIFF
pnpm install
```

### 2. Plaid Account Setup

1. Sign up for Plaid: https://dashboard.plaid.com/signup
2. Navigate to **Team Settings** → **Keys**
3. Copy your **Sandbox** credentials:
   - Client ID
   - Secret (Sandbox)

### 3. Backend Configuration

Create `/backend/.env` file:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DB_PATH=./data/db.json

# Plaid API Credentials
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_secret_here
PLAID_ENV=sandbox

# Encryption Key (generate with command below)
PLAID_ENCRYPTION_KEY=your_32_byte_hex_key
```

**Generate encryption key:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as `PLAID_ENCRYPTION_KEY`.

### 4. Frontend Configuration (Optional)

Create `/frontend/.env` if you need to customize the API URL:

```bash
cd frontend
echo "VITE_API_URL=http://localhost:3000" > .env
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Usage

1. **Landing Page**: Visit http://localhost:5173
2. **Connect Bank**: Click "Get Started" to navigate to `/connect`
3. **Plaid Link**: Click "Connect Bank" to open Plaid Link
4. **Select Bank**: In Sandbox mode, use test credentials:
   - Institution: Any bank (search for "Chase", "Bank of America", etc.)
   - Username: `user_good`
   - Password: `pass_good`
5. **View Dashboard**: After successful connection, you'll be redirected to the dashboard showing your accounts

## Project Structure

```
AIFF/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express app entry point
│   │   ├── middleware/
│   │   │   └── rateLimit.ts      # Rate limiting middleware
│   │   ├── routes/
│   │   │   ├── plaid.ts          # Plaid API endpoints
│   │   │   ├── accounts.ts       # Account endpoints
│   │   │   └── health.ts         # Health check
│   │   └── services/
│   │       ├── database.ts       # LowDB service
│   │       ├── encryption.ts     # AES-256-GCM encryption
│   │       └── plaid.ts          # Plaid SDK wrapper
│   ├── .env.example              # Environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing/          # Landing page
│   │   │   ├── Connect/          # Bank connection page
│   │   │   └── Dashboard/        # Dashboard & account list
│   │   ├── hooks/
│   │   │   └── usePlaid.ts       # React Query hooks
│   │   ├── lib/
│   │   │   └── api.ts            # API client
│   │   ├── App.tsx               # Routes
│   │   └── main.tsx              # Entry point
│   └── package.json
└── openspec/                      # OpenSpec proposals & specs

```

## API Endpoints

### Plaid
- `POST /api/plaid/link-token` - Create link token for Plaid Link
- `POST /api/plaid/exchange-token` - Exchange public token for access token
- `POST /api/plaid/accounts` - Sync accounts from Plaid

### Accounts
- `GET /api/accounts` - Get all connected accounts with balances

### Health
- `GET /api/health` - Health check endpoint

## Security

- ✅ Access tokens encrypted with AES-256-GCM before storage
- ✅ Encryption key stored in environment variable
- ✅ Plaid credentials never exposed to frontend
- ✅ Rate limiting on sensitive endpoints (10 req/min)
- ✅ Input validation with Zod schemas
- ✅ CORS configured for frontend origin only

## Development

### Run Type Checking
```bash
# Backend
cd backend && pnpm typecheck

# Frontend
cd frontend && pnpm typecheck
```

### Run Linting
```bash
# Backend
cd backend && pnpm lint

# Frontend
cd frontend && pnpm lint
```

### Build for Production
```bash
# Backend
cd backend && pnpm build

# Frontend
cd frontend && pnpm build
```

## Plaid Environments

- **Sandbox**: Free tier, test credentials, fake data (current setup)
- **Development**: Real bank connections, limited to 100 items, free
- **Production**: Full access, requires approval and pricing plan

To move from Sandbox → Development:
1. Update `PLAID_ENV=development` in backend/.env
2. Update `PLAID_SECRET` to your Development secret
3. Test with real bank credentials

## Troubleshooting

### Backend won't start
- Verify all environment variables are set in `backend/.env`
- Check `PLAID_ENCRYPTION_KEY` is exactly 64 characters (32-byte hex)
- Ensure Plaid credentials are correct

### Plaid Link doesn't open
- Check browser console for errors
- Verify backend is running on http://localhost:3000
- Ensure link token is being fetched successfully (Network tab)

### "Encryption key validation failed"
- Regenerate encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Update `PLAID_ENCRYPTION_KEY` in backend/.env
- Restart backend server

### Account connection succeeds but no accounts shown
- Check backend console logs for errors
- Verify Plaid credentials are correct
- Check `data/db.json` to see if accounts were stored

## Contributing

This project follows OpenSpec for specification-driven development. See `openspec/` directory for proposals and specs.

## License

Private project - All rights reserved
