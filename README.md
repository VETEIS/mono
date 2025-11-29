# MONO - Personal Finance Tracker

A lightweight, offline-first personal finance tracker built with Next.js 15, TypeScript, and TailwindCSS. Features a modern dark theme with yellow accent colors, mobile-first responsive design, and complete data privacy with LocalStorage persistence.

## Features

### 💰 Budget (Monthly Budget Tracking)
- **Monthly Budget Management**: Set and edit your monthly budget with visual progress tracking
- **Real-time Budget Calculation**: Automatically tracks income (in) and expenses (out) against your budget
- **Visual Progress Bar**: Color-coded progress indicator (green/yellow/red) showing budget usage
- **Quick Expense Entry**: Click the budget card to quickly add expenses
- **Recent Expenses**: View the 5 most recent budget transactions
- **Auto-archiving**: Previous month's budget data is automatically archived on the first day of each month
- **Monthly Archives**: Access archived months with detailed Excel export functionality

### 💳 Debts (Financial Overview)
- **Total to Receive**: View all money you're expecting to receive
- **Total to Pay**: View all money you need to pay
- **Balance Calculation**: Automatic calculation of net balance (receive - pay)
- **Clickable Cards**: Navigate directly to filtered transaction views
- **Recent Transactions**: Quick overview of your latest financial activity

### 📝 Transactions
- **Full Transaction Management**: Add, edit, and delete transactions
- **Transaction Types**: Categorize as "receive" (income) or "pay" (expenses)
- **Filtering**: Filter transactions by type (receive/pay) via URL parameters
- **Transaction Details**: Label, amount, category, date, and optional notes
- **Budget Transactions**: Separate budget-specific transactions for budget tracking

### 📄 Notes
- **Simple Note Taking**: Create, edit, and delete notes
- **Quick Access**: Notes button in dashboard header with entry count badge
- **Date Tracking**: Automatic date tracking for each note

### ⚙️ Settings
- **Data Export**: Export all your data as JSON backup
- **Data Import**: Import previously exported JSON backups
- **Data Reset**: Permanently delete all transactions and notes (with confirmation)

### 📊 Monthly Archives
- **Automatic Archiving**: Previous month's budget transactions are archived on the 1st of each month
- **Detailed Reports**: Each archive includes:
  - All transactions from that month
  - Budget amount
  - Total income and expenses
  - Net balance
  - Archive timestamp
- **Excel Export**: Download any archived month as a detailed CSV/Excel file
- **Comprehensive Data**: Export includes transaction details, summary statistics, and metadata

## Pages & Navigation

### Main Navigation (Bottom Bar)
- **Budget** (`/`): Monthly budget tracking and expense management
- **Debts** (`/debts`): Financial overview with totals and balance
- **Transactions** (`/transactions`): Complete transaction list with filtering
- **Settings** (`/settings`): Data management and app settings

### Budget Section
- **Budget Home** (`/`): Budget card, recent expenses, archive button
- **Add Expense** (`/budget/new`): Quick expense entry form
- **Budget Transactions** (`/budget/transactions`): Current month's budget transactions
- **Edit Transaction** (`/budget/transactions/[id]`): Edit budget transaction
- **Archived Months** (`/budget/archives`): View and download monthly archives

### Transactions Section
- **All Transactions** (`/transactions`): Complete transaction list with filters
- **Add Transaction** (`/transactions/new`): Add new transaction
- **Edit Transaction** (`/transactions/[id]`): Edit existing transaction

### Notes Section
- **Notes List** (`/notes`): View all notes
- **Add Note** (`/notes/new`): Create new note
- **Edit Note** (`/notes/[id]`): Edit existing note

## Technical Details

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand with LocalStorage persistence
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Currency**: Philippine Peso (PHP)

### Data Storage
- **100% LocalStorage**: All data is stored locally in the browser
- **No Backend**: Completely offline-first, no server required
- **Persistence**: Data persists across browser sessions
- **Storage Key**: `money_manager_data_v1`

### Data Structure
- **Transactions**: Type (receive/pay), label, amount, category, date, notes, budget flag
- **Notes**: Text content and creation date
- **Budget**: Monthly budget amount
- **Monthly Archives**: Complete month snapshots with transactions and statistics

### Key Features
- **Mobile-First Design**: Optimized for mobile devices with responsive layout
- **Dark Theme**: Modern dark UI with yellow accent colors (#FCD34D)
- **Smooth Animations**: Transitions and hover effects throughout
- **Numeric Keypad**: Mobile devices automatically show numeric keypad for amount inputs
- **No Spinners**: Number inputs hide default browser spinners for cleaner UI
- **Custom Dropdowns**: Styled select dropdowns with proper spacing

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build & Deploy

### Build for Production

```bash
npm run build
npm start
```

### Deploy

The app is ready to deploy to Vercel with zero configuration. See [DEPLOYMENT.md](./DEPLOYMENT.md) for a complete deployment guide.

### Quick Deploy

**Option 1: Via Vercel Dashboard (Recommended)**
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Click "Deploy" - Vercel auto-detects Next.js settings

**Option 2: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Usage Guide

### Setting Up Your Budget
1. Navigate to the **Budget** page (home)
2. Click the edit icon on the budget card
3. Enter your monthly budget amount
4. Click "save"

### Adding Expenses
1. Click the budget card on the Budget page, OR
2. Navigate to Budget Transactions and click the "+" button
3. Select type: "in" (income) or "out" (expense) - defaults to "out"
4. Enter label, amount, and category (food/things)
5. Submit - date is automatically set to current date/time

### Viewing Archives
1. Click the Archive button (📦) in the Budget page header
2. Browse archived months
3. Click the download icon to export as Excel/CSV

### Managing Transactions
- **Add**: Use the "+" button or click budget card
- **Edit**: Click on any transaction card
- **Delete**: Use the trash icon on transaction cards
- **Filter**: Use URL parameters (`?filter=receive` or `?filter=pay`)

### Data Backup
1. Go to **Settings**
2. Click "Export Data" to download JSON backup
3. To restore, click "Import Data" and select your backup file

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Budget (home page)
│   ├── debts/             # Debts overview
│   ├── transactions/      # All transactions
│   ├── notes/             # Notes management
│   ├── settings/          # App settings
│   └── budget/            # Budget-specific pages
│       ├── new/           # Add expense
│       ├── transactions/  # Budget transactions
│       └── archives/      # Monthly archives
├── components/            # Reusable components
│   ├── Card.tsx
│   ├── Header.tsx
│   ├── Navbar.tsx
│   ├── Modal.tsx
│   ├── TransactionForm.tsx
│   └── NoteForm.tsx
├── store/                 # Zustand state management
│   └── useStore.ts
├── types/                 # TypeScript types
│   └── index.ts
└── utils/                 # Utility functions
    ├── format.ts          # Currency and date formatting
    └── excel.ts           # Excel export functionality
```

## License

Private project - All rights reserved
