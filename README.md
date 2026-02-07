# KPT Sports Backend

## Setup

1. Install dependencies: `npm install`

2. Set up environment variables in .env

3. Start server: `npm start`

## Data Migration Scripts

### scripts/migrate-results-data.js

- One-time local migration script
- Used to backfill `playerId` and `diplomaYear` for results
- Must be run manually with Node.js
- Not part of production runtime or deployment

**How to run:**
```bash
node scripts/migrate-results-data.js
```