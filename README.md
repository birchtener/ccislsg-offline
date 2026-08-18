<img width="1816" height="434" alt="header" src="https://github.com/user-attachments/assets/ac675e67-bb9a-4269-b59b-1f402706f426" />

---

# CCISLSG HUB

## Welcome to the **College of Computing and Information Sciences - Local Student Government (CCISLSG) Web Platform**. This is a robust, full-stack Next.js application designed to streamline student services, event management, financial tracking, and organization operations for the CCIS Local Student Government (CCISLSG).

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router & React Server Components)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first styling framework)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Accessible, customizable components built on Radix Primitives)
- **Database ORM:** [Prisma ORM](https://www.prisma.io/) (Type-safe schema management and database client)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (Relational database for secure transactional storage)

---

## Features & Project Structure

The platform is divided into three core access layers:

### 1. Main Navigation Menu (Public & Student Facing)

- **Home:** Live announcements, an active bulletin board for past/upcoming events, and frequently asked questions (FAQs).
- **About Us:** Showcasing the CCISLSG Vision, Mission, Goals, and an interactive Organizational Structure chart.
- **Projects:** Dedicated space tracking ongoing initiatives, future plans, and key achievements.
- **Events:** Active event pages featuring live countdowns, titles, detailed descriptions, and photo documentation galleries.

### 2. Student Hub (Authenticated Student Portal)

- **Attendance Tracking:** Transparency portal showing clock-in/clock-out records (`ID | Status | Event`).
- **Payments & Dues:**
- _College Fees (CF):_ Tracking status by ID and Semester.
- _Merchandise Fees (MF):_ Item breakdowns, quantities, and claim statuses.

- **Clearance & Do-Day:** Tracks required vs. actual rendered hours for organization community service, accounting for deductions via donations or alternative tasks.
- **Feedback Dropbox:** A direct, private channel for students to submit feedback.

### 3. Administrative Dashboard (RBAC Enabled)

Equipped with a strict **Role-Based Access Control (RBAC)** matrix:

- **Super Admin:** Full system access.
- **Fiscal Executives:** Financial management, item pricing, and payment CRUD.
- **Secretariat & Progreps:** Managing attendance records, feedback analysis, and clearance lists.
- **Property Custodian:** Managing the dynamic inventory system (Categorized non-merchandise and sizing JSON arrays for merchandise).
- **Vision Committee:** Dedicated access for publishing official announcements.

---

## Getting Started

### Prerequisites

Ensure you have **Node.js (v18.x or higher)** and `npm` / `yarn` / `pnpm` installed.

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/birchtener/ccislsg-hub.git
cd ccislsg-hub
```

2. **Install dependencies:**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ccis_db?schema=public"
BETTER_AUTH_SECRET="your_better_auth_secret"
BETTER_AUTH_URL="http://localhost:3000"
```

4. **Run database migrations:**

```bash
npx prisma migrate dev --name init
```

5. **Run the development server:**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

---

## Core System Workflows (For Developers)

### Clearance Sanction Formula

When rendering time for Do-day sanctions, the final remaining balance is calculated dynamically to accommodate special cases:

$$\text{Remaining Sanction Hours} = \text{Obliged Time} - (\text{Actual Rendered Time} + \text{Donation/Condition Deductions})$$

### Transaction Confirmation Flow

To prevent accidental duplicates or erroneous entries, the `Confirmation Modal` triggers a strict payload validation displaying:

- Student Profile (`Name`, `ID`, `Year`, `Program`)
- Transaction Meta (`Type (CF/MF)`, `Amount`, `Semester/Item Details`)
- _Safety Check:_ Automatically runs a background query checking for any other unpaid or identical pending orders from the same student before confirming.

---

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`).
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
3. Push to the branch (`git push origin feature/AmazingFeature`).
4. Open a Pull Request against the `main` branch.

What to change:

1. next.config.ts
2. env BETTER_AUTH_URL="http://10.111.11.44:3000"
