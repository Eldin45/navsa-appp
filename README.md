# 🌾 NAVSA • Smart Agriculture Platform

[demo](https://navsa.ng) — [github](https://github.com/your-username/navsa) — [docs](https://docs.navsa.ng) — [discord](https://discord.gg/your-invite-link)

> **NAVSA** is a national smart agriculture platform that transforms rural farming communities into digitally connected ecosystems. With integrated IoT sensors, AI-driven agronomy, and a closed-loop wallet system, farmers, organizations, and input suppliers operate as one unified network—bridging the gap between traditional agriculture and modern digital commerce.

## 🚀 Features

- **Dual-Wallet Financial System**: Closed wallet for input purchases, open wallet for harvest payouts, with automatic settlement to suppliers
- **Multi-Tenant Management**: Universities, cooperatives, NGOs, and agencies each manage their own farmer network from one platform
- **IoT & Sensor Integration**: Real-time soil, moisture, and weather telemetry with automated actuator control
- **AI Agronomy Assistant**: Gemini-powered crop advice based on soil, sensor, and weather data
- **Input Supply Chain**: End-to-end flow from farmer request → admin approval → supplier fulfillment → delivery tracking
- **Role-Based Access Control**: Super Admin, Platform Admin, Organization Admin, Farmer, and Supplier roles with granular permissions

## 🛠️ Stack

1. **Frontend**: [Next.js 15](https://nextjs.org) + [React 19](https://react.dev) + [TypeScript](https://typescriptlang.org)
2. **Styling**: [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
3. **Database**: [MySQL/MariaDB](https://mysql.com) with [Prisma ORM](https://prisma.io)
4. **Authentication**: Custom auth system with JWT sessions and role-based middleware
5. **Payments**: Dual-wallet system with PalmPay virtual accounts and automated settlement
6. **IoT Ingestion**: Sensor data pipeline with threshold alerts and actuator command logs
7. **AI Engine**: Google Gemini for agronomic advice with weather + sensor context
8. **Deployment**: Optimized for [Vercel](https://vercel.com) deployment with edge middleware

## 📦 Quick Start

1. **Prerequisites**: Install [Node.js](https://nodejs.org), [Git](https://git-scm.com), and [MySQL](https://mysql.com)

2. **Clone and setup**:

   ```bash
   git clone https://github.com/your-username/navsa.git
   cd navsa-admin
   npm install
   cp .env.example .env
   ```

3. **Configure environment** (`.env`):

   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/navsa_db"
   NEXTAUTH_SECRET="your-secret-key"
   GEMINI_API_KEY="your-google-gemini-key"
   PALMPAY_API_KEY="your-palmpay-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up database**:

   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Run the app**:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to sign in.