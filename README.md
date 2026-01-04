# 🏴‍☠️ TaleWeaver

An immersive pirate-themed text-based RPG game powered by AI, where you embark on adventures as a fearless buccaneer navigating the seven seas.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Authentication](#-authentication)
- [Scripts](#-scripts)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- **Interactive AI-Powered Storytelling**: Engage in dynamic conversations with an AI game master
- **Character Creation**: Create and customize your pirate character with unique stats and backstory
- **Adventure System**: Explore mysterious islands, face dangers, and forge your legend
- **User Authentication**: Secure login system with role-based access control
- **Admin Dashboard**: Monitor API usage statistics and manage users (admin only)
- **Session Management**: Persistent game sessions with conversation history
- **Real-time Chat Interface**: Beautiful, responsive chat UI with markdown support

## 🛠 Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **SQLite** - Lightweight database
- **OpenRouter API** - AI model integration
- **Passport** - Authentication middleware
- **bcrypt** - Password hashing

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Tools
- **pnpm** - Fast, disk space efficient package manager
- **Concurrently** - Run multiple commands concurrently

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **pnpm** (v10.23.0 or higher) - Install with `npm install -g pnpm`

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/TaleWeaver.git
   cd TaleWeaver
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up the database**
   ```bash
   cd apps/backend
   pnpm prisma generate
   pnpm prisma migrate dev
   cd ../..
   ```

4. **Create an admin user** (optional, for admin features)
   ```bash
   cd apps/backend
   pnpm create-admin [email] [password]
   # Example: pnpm create-admin admin@example.com admin123
   cd ../..
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in `apps/backend/` directory:

```env
# Database (optional - defaults to SQLite)
DATABASE_URL=file:./dev.db

# Session Secret (optional - change in production)
SESSION_SECRET=your-secret-key-here

# Node Environment
NODE_ENV=development

# Server Port (optional - defaults to 3001)
PORT=3001

# OpenRouter API Key (required for AI features)
OPENROUTER_API_KEY=your-openrouter-api-key
```

### Frontend Configuration

Create a `.env` file in `apps/frontend/` directory (optional):

```env
# Backend API URL (optional - defaults to http://localhost:3001)
VITE_API_URL=http://localhost:3001
```

## 🎮 Usage

### Starting the Application

**Option 1: Using the start script (recommended)**
```bash
# Windows
start.bat

# Or PowerShell
.\start.ps1

# Linux/Mac
./start.sh
```

**Option 2: Manual start**
```bash
# From the root directory
pnpm start
```

This will start both the backend (port 3001) and frontend (port 5173) concurrently.

### Accessing the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### First Steps

1. **Create an account**: Navigate to `/signup` or click "Créer un compte" on the login page
2. **Login**: Use your credentials to access the game
3. **Start playing**: Begin your adventure by chatting with the AI game master
4. **Create your character**: Follow the character creation process to customize your pirate

## 📁 Project Structure

```
TaleWeaver/
├── apps/
│   ├── backend/              # NestJS backend application
│   │   ├── src/
│   │   │   ├── auth/         # Authentication module
│   │   │   ├── admin/        # Admin management module
│   │   │   ├── chat/         # Chat service
│   │   │   ├── characters/   # Character management
│   │   │   ├── conversations/# Conversation handling
│   │   │   ├── openrouter/   # OpenRouter API integration
│   │   │   └── prisma/       # Prisma service
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Database schema
│   │   │   └── migrations/   # Database migrations
│   │   └── package.json
│   │
│   └── frontend/             # React frontend application
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── contexts/     # React contexts (Auth)
│       │   ├── hooks/        # Custom React hooks
│       │   ├── layouts/      # Layout components
│       │   ├── services/     # API services
│       │   └── App.tsx       # Main app component
│       └── package.json
│
├── package.json             # Root package.json (monorepo)
├── pnpm-workspace.yaml      # pnpm workspace configuration
├── start.ps1                # Windows PowerShell start script
├── start.bat                # Windows batch start script
├── start.sh                 # Linux/Mac start script
├── AUTH_README.md           # Authentication documentation
└── README.md                # This file
```

## 🔐 Authentication

TaleWeaver includes a complete authentication system with:

- User registration and login
- Session management with cookies
- Role-based access control (USER/ADMIN)
- Password change functionality
- Admin user management panel

For detailed authentication documentation, see [AUTH_README.md](./AUTH_README.md).

### Quick Auth Guide

**Creating an Admin User:**
```bash
cd apps/backend
pnpm create-admin admin@example.com yourpassword
```

**User Roles:**
- **USER**: Standard user, can play the game
- **ADMIN**: Can access dashboard, manage users, view statistics

## 📜 Scripts

### Root Level
- `pnpm start` - Start both backend and frontend in development mode

### Backend (`apps/backend/`)
- `pnpm start:dev` - Start backend in watch mode
- `pnpm start:prod` - Start backend in production mode
- `pnpm build` - Build the backend application
- `pnpm prisma generate` - Generate Prisma client
- `pnpm prisma migrate dev` - Create and apply migrations
- `pnpm create-admin` - Create an admin user

### Frontend (`apps/frontend/`)
- `pnpm dev` - Start frontend dev server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

## 💻 Development

### Database Migrations

When modifying the Prisma schema:

```bash
cd apps/backend
pnpm prisma migrate dev --name your_migration_name
pnpm prisma generate
```

### Code Style

The project uses ESLint and Prettier for code formatting. Run:

```bash
# Backend
cd apps/backend
pnpm lint

# Frontend
cd apps/frontend
pnpm lint
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [React](https://react.dev/) - UI library
- [OpenRouter](https://openrouter.ai/) - AI model API
- [Prisma](https://www.prisma.io/) - Next-generation ORM

---

**Made with ❤️ for pirate adventurers**

