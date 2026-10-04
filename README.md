# TeleSales CRM — Complete Sales & Tele-Sales Management System

A comprehensive, production-ready CRM system designed to manage the entire Lead journey, from initial entry to Tele-Sales qualification, Sales transfer, and final deal closure. Built with a scalable 4-role architecture (Admin, Head of Sales, Tele-Sales, Sales).

## Tech Stack
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** NextAuth (JWT sessions with strict Middleware protection)
- **Styling:** Tailwind CSS — Dark Glassmorphic UI design, fully RTL-supported (Arabic)
- **AI Integration:** Automated AI Meeting Recording & Analysis

---

## 1. Core Features & Recent Updates

- ✅ **AI Meeting Agent Integration:** Automatically joins scheduled meetings to record, transcribe, and analyze the conversation, posting the summary directly into the client's profile in the CRM.
- ✅ **WhatsApp Web Integration:** Built-in WhatsApp web interface for instant client communication without leaving the CRM.
- ✅ **Advanced Contracts Management:** Ability to upload, track, and manage multiple contracts per client, complete with value calculation and statistics.
- ✅ **Dynamic Dashboards:** Dedicated, isolated dashboards for each role (Admin, Head of Sales, Tele-Sales, Sales) with relevant metrics and charts.
- ✅ **Fair Lead Distribution:** Automated, round-robin lead assignment for active Tele-Sales agents when uploading CSV lists.
- ✅ **Comprehensive Activity Logs:** Every status change, follow-up, meeting, or lead transfer is recorded in an immutable Activity Log.
- ✅ **User Management:** Full UI for the Admin to add, edit, disable, or change passwords for team members.
- ✅ **Real-time Search & Filtering:** Instant search by Name, Phone, Company, or Email across all tables.
- ✅ **Duplicate Prevention:** Strict database-level and UI-level prevention of duplicate phone numbers.

---

## 2. Local Setup & Installation

### Prerequisites
- Node.js 18.17+
- PostgreSQL database (Local or Cloud like Neon/Supabase)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL, and generate a NEXTAUTH_SECRET:
openssl rand -base64 32

# 3. Push schema to database
npm run db:push

# 4. Seed initial mock data (Users + 20 demo leads)
npm run db:seed

# 5. Start the development server
npm run dev
```

The system will run on `http://localhost:3000`.

### Demo Accounts (After Seeding)

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Passw0rd!` |
| Head of Sales | `head.sales` | `Passw0rd!` |
| Tele-Sales | `tele1` to `tele5` | `Passw0rd!` |
| Sales | `sales1`, `sales2` | `Passw0rd!` |

**⚠️ IMPORTANT: Please change these passwords immediately before any production use.**

---

## 3. Architecture & Security

- **Centralized Permissions (`src/lib/permissions.ts`):** Role-Based Access Control (RBAC) is centralized for easy auditing and updates.
- **Middleware Protection:** Route-level protection ensures users can only access their designated dashboards. Unauthorized access attempts are automatically redirected.
- **Single Ownership Model:** A single `assignedToId` tracks the lead's current owner, seamlessly transferring ownership from Tele-Sales to Sales to prevent data conflicts.
- **Active-Only Distribution:** The system only assigns new leads to currently active agents, ensuring no leads are lost to disabled or offline accounts.

---

## 4. Production Deployment

This project is optimized for deployment on Vercel.

1. Push your code to GitHub.
2. Import the project in Vercel as a Next.js application.
3. Ensure the `backend` folder is excluded from the Next.js build (already configured in `tsconfig.json`).
4. Add the required Environment Variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, etc.).
5. Click **Deploy**.
