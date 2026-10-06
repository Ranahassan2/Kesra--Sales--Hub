# Kesra Sales Hub — Complete Sales & Tele-Sales Management System

A comprehensive, production-ready CRM system designed to manage the entire lead journey, from initial entry to Tele-Sales qualification, Sales transfer, and final deal closure. The system is built with a scalable 4-role architecture (Admin, Head of Sales, Tele-Sales, Sales) and integrates AI-driven meeting analysis directly into the sales workflow.

## Technology Stack

*   **Framework:** Next.js 14 (App Router) + TypeScript
*   **Database:** PostgreSQL + Prisma ORM
*   **Authentication:** NextAuth (JWT sessions with strict Middleware protection)
*   **Styling:** Tailwind CSS — Dark Glassmorphic UI design, fully RTL-supported (Arabic)
*   **AI Integration:** Automated AI Meeting Recording & Analysis

---

## Core Features

*   **AI Meeting Agent Integration:** Automatically joins scheduled meetings to record, transcribe, and analyze the conversation, posting the summary directly into the client's profile in the CRM.
*   **WhatsApp Web Integration:** Built-in WhatsApp web interface for instant client communication without leaving the CRM environment.
*   **Advanced Contracts Management:** Ability to upload, track, and manage multiple contracts per client, complete with value calculation and statistics.
*   **Dynamic Dashboards:** Dedicated, isolated dashboards for each role (Admin, Head of Sales, Tele-Sales, Sales) with relevant metrics and charts.
*   **Fair Lead Distribution:** Automated, round-robin lead assignment for active Tele-Sales agents when uploading CSV lists.
*   **Comprehensive Activity Logs:** Every status change, follow-up, meeting, or lead transfer is securely recorded in an immutable Activity Log.
*   **User Management:** Full user interface for the Admin to add, edit, disable, or change passwords for team members.
*   **Duplicate Prevention:** Strict database-level and UI-level prevention of duplicate phone numbers.

---

## Architecture & Security

*   **Centralized Permissions:** Role-Based Access Control (RBAC) is centralized for easy auditing and updates.
*   **Middleware Protection:** Route-level protection ensures users can only access their designated dashboards. Unauthorized access attempts are automatically redirected.
*   **Single Ownership Model:** A single `assignedToId` tracks the lead's current owner, seamlessly transferring ownership from Tele-Sales to Sales to prevent data conflicts.
*   **Active-Only Distribution:** The system only assigns new leads to currently active agents, ensuring no leads are lost to disabled or offline accounts.

---

## Local Setup & Installation

### Prerequisites
*   Node.js 18.17+
*   PostgreSQL database (Local or Cloud like Neon/Supabase)

### Steps

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
# Edit .env and add your DATABASE_URL, and generate a NEXTAUTH_SECRET:
openssl rand -base64 32
```

3. Push schema to database and seed initial mock data:
```bash
npm run db:push
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

---

## Production Deployment

This project is optimized for deployment on Vercel.

1. Push your code to GitHub.
2. Import the project in Vercel as a Next.js application.
3. Ensure the `backend` folder is excluded from the Next.js build.
4. Add the required Environment Variables.
5. Deploy.
