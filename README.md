# CodeSync

> A real-time collaborative coding workspace with integrated chat and whiteboard

## ✨ Features

- **Real-Time Code Collaboration** - Multiple users can code together simultaneously
- **Live Chat** - Integrated team communication
- **Shared Whiteboard** - Draw and visualize ideas together
- **Room-Based Sessions** - Create and join rooms with unique codes
- **User Authentication** - Secure login with Google OAuth support
- **Auto-Expiring Rooms** - Rooms expire after 30 minutes of inactivity
- **Production-Ready** - Fully Dockerized with security best practices

## 🛠️ Tech Stack

### Frontend
- React 19 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Monaco Editor for code editing
- Socket.IO client for real-time communication
- Zustand for state management

### Backend
- Node.js + TypeScript
- Express.js framework
- Socket.IO for WebSocket connections
- Prisma ORM with PostgreSQL (Supabase)
- JWT authentication
- Bcrypt password hashing
- Redis for session management

### Infrastructure
- Docker + Docker Compose
- Nginx for frontend serving
- Multi-stage builds for optimization
- Health checks and auto-restart policies

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for production)
- Supabase account (or PostgreSQL database)

### Development Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd codesync
```

2. **Install dependencies**
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. **Set up environment variables**
```bash
cd server
cp .env.example .env
# Update .env with your credentials
```

4. **Run database migrations**
```bash
cd server
npx prisma migrate dev
npx prisma generate
```

5. **Start development servers**
```bash
# Backend (from server directory)
npm run dev

# Frontend (from client directory)
npm run dev
```

Visit `http://localhost:5173` to see the app!

### Production Deployment

```bash
# Build and start all services with Docker
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Project Structure

```
codesync/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand state stores
│   │   └── shared/        # Shared types and utilities
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── models/       # Database models
│   │   └── utils/        # Helper functions
│   ├── prisma/           # Database schema and migrations
│   └── Dockerfile
│
├── docker-compose.yml    # Docker orchestration
└── DEPLOYMENT.md         # Production deployment guide
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ CORS protection
- ✅ XSS prevention headers
- ✅ CSRF protection
- ✅ SQL injection protection (Prisma ORM)
- ✅ Rate limiting ready
- ✅ Environment variable validation
- ✅ Non-root Docker containers
- ✅ Security headers (CSP, X-Frame-Options, etc.)

## 📝 Environment Variables

See `.env.example` files in server directory for all required variables:
- Database connection string
- JWT secret key
- Google OAuth credentials
- Redis password
- Frontend URL for CORS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your portfolio or commercial applications.

## 🎯 Roadmap

- [ ] File sharing in rooms
- [ ] Code execution environment
- [ ] Video/audio chat
- [ ] Persistent room history
- [ ] User profiles and avatars
- [ ] Room permissions and roles
- [ ] Export code/chat history

## 👨‍💻 Author

Built with ❤️ for modern collaborative development

## 🐛 Known Issues

None at the moment! Report issues on GitHub.
