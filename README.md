<div align="center">

# 📹 VidConnect

### *Connect Through Stories, Not Just Text*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-%5E18.0.0-blue)](https://reactjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**VidConnect** is a next-generation social discovery platform that revolutionizes how people connect online. Through authentic short video introductions and AI-powered matching, users discover genuine connections with like-minded individuals, build meaningful communities, and form lasting relationships based on shared interests and values.

[🚀 Live Demo](https://vidconnect.app) · [📖 Documentation](https://docs.vidconnect.app) · [🐛 Report Bug](https://github.com/yourusername/VidConnect/issues) · [✨ Request Feature](https://github.com/yourusername/VidConnect/issues)

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🎯 Why VidConnect?](#-why-vidconnect)
- [🏗️ Architecture](#️-architecture)
- [🚀 Getting Started](#-getting-started)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🎨 Tech Stack](#-tech-stack)
- [📱 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [🗺️ Roadmap](#️-roadmap)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)
- [📧 Contact](#-contact)

---

## ✨ Features

### 🎥 **Video Profiles**
- **Authentic Introductions**: Record 30-90 second video profiles to showcase your true personality
- **Multi-take Recording**: Re-record until you're satisfied with your introduction
- **Video Trimming**: Built-in editor to trim and perfect your video
- **Thumbnail Selection**: Choose the best frame as your profile thumbnail
- **Auto-transcription**: AI-powered transcription for accessibility and searchability

### 🤝 **Smart Matching Algorithm**
- **Interest-Based Matching**: Connect with people who share your hobbies and passions
- **AI Personality Analysis**: Advanced ML algorithms analyze video content to understand personality traits
- **Compatibility Scoring**: See how well you match with potential connections
- **Mutual Interest Detection**: Discover shared interests automatically
- **Geographic Proximity**: Optional location-based matching for local connections

### 🌐 **Community Discovery**
- **Interest-Based Groups**: Join communities centered around specific topics
- **Community Events**: Participate in virtual meetups and discussions
- **Group Video Threads**: Share video updates within communities
- **Community Challenges**: Engage in fun activities and challenges
- **Moderation Tools**: Robust community management features

### 🔒 **Privacy & Safety**
- **Granular Privacy Controls**: Choose who can see your profile and videos
- **Block & Report**: Easy tools to manage unwanted interactions
- **Video Approval System**: Review your matches before connections are made
- **End-to-End Encryption**: Secure video messaging between connections
- **Data Export**: Full control over your personal data with export capabilities
- **GDPR Compliant**: Built with privacy regulations in mind

### 📱 **Cross-Platform Experience**
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile
- **Progressive Web App (PWA)**: Install as a native app on any device
- **Offline Mode**: Access cached content without internet connection
- **Native Mobile Apps**: iOS and Android apps with push notifications
- **Dark Mode**: Easy on the eyes with automatic theme switching

### 🔔 **Engagement Features**
- **Smart Notifications**: Get notified about new matches and messages
- **Video Reactions**: React to profiles with emojis and quick responses
- **Connection Requests**: Send and receive connection invitations
- **Ice Breakers**: AI-generated conversation starters based on shared interests
- **Activity Feed**: Stay updated with your network's activities

---

## 🎯 Why VidConnect?

### The Problem
Traditional social platforms rely heavily on text profiles and static photos, making it difficult to:
- Gauge someone's true personality and energy
- Build authentic connections beyond superficial interactions
- Find people who genuinely share your interests and values
- Express yourself beyond carefully curated images

### The Solution
VidConnect brings authenticity back to online connections through:
- **Video-first approach** that captures personality, tone, and authenticity
- **AI-powered matching** that goes beyond basic keywords
- **Community-driven discovery** for finding your tribe
- **Privacy-focused design** that puts users in control

### Who Is It For?
- 🎓 **Students** looking to find study partners and friends in new cities
- 💼 **Professionals** seeking networking opportunities and mentorship
- 🎨 **Creators** wanting to collaborate with like-minded artists
- 🏃 **Hobbyists** finding partners for activities and shared interests
- 🌍 **Travelers** connecting with locals and fellow explorers
- 🎮 **Gamers** forming teams and finding gaming buddies

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React Web  │  │   iOS App    │  │  Android App │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│                     (Express.js + JWT)                       │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   User       │  │   Matching   │  │  Community   │
│   Service    │  │   Service    │  │   Service    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │    Redis     │  │  PostgreSQL  │      │
│  │  (NoSQL DB)  │  │   (Cache)    │  │ (Analytics)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Cloudinary  │  │   AWS S3     │  │   WebRTC     │
│   (Videos)   │  │  (Backups)   │  │ (Real-time)  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### System Components

**Frontend**
- React 18 with TypeScript
- Redux Toolkit for state management
- React Router for navigation
- TailwindCSS for styling
- WebRTC for video recording
- Socket.io client for real-time features

**Backend**
- Node.js with Express
- MongoDB for user data and profiles
- Redis for session management and caching
- PostgreSQL for analytics and reporting
- JWT for authentication
- Socket.io for real-time communication

**Infrastructure**
- Cloudinary for video storage and processing
- AWS S3 for backups and file storage
- AWS CloudFront for CDN
- Docker for containerization
- Kubernetes for orchestration
- GitHub Actions for CI/CD

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (v8 or higher) or **yarn** (v1.22+)
- **MongoDB** (v5.0+) - [Download](https://www.mongodb.com/try/download/community)
- **Redis** (v6.0+) - [Download](https://redis.io/download)
- **Git** - [Download](https://git-scm.com/downloads)

Optional but recommended:
- **Docker** & **Docker Compose** - [Download](https://www.docker.com/products/docker-desktop)
- **Postman** for API testing - [Download](https://www.postman.com/downloads/)

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 10GB

**Recommended:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 20GB+ SSD

---

## 📦 Installation

### Option 1: Manual Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/VidConnect.git
cd VidConnect
```

#### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

#### 3. Set Up Environment Variables

**Backend** (`backend/.env`):
```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/vidconnect
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
COOKIE_EXPIRE=7

# Cloudinary (Video Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@vidconnect.app
FROM_NAME=VidConnect

# AWS S3 (Optional Backup)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=vidconnect-backups

# AI/ML Services
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_API_KEY=your_huggingface_key

# Analytics
GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

#### 4. Start the Services

**Start MongoDB:**
```bash
# Linux/Mac
mongod

# Windows
"C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"
```

**Start Redis:**
```bash
# Linux/Mac
redis-server

# Windows
redis-server.exe
```

**Start Backend:**
```bash
cd backend
npm run dev
```

**Start Frontend:**
```bash
cd frontend
npm start
```

The application should now be running:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

### Option 2: Docker Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/VidConnect.git
cd VidConnect
```

#### 2. Configure Environment

Copy the example environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit the `.env` files with your configuration.

#### 3. Build and Run with Docker Compose

```bash
docker-compose up --build
```

This will start all services:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017
- Redis: localhost:6379

To run in detached mode:
```bash
docker-compose up -d
```

To stop all services:
```bash
docker-compose down
```

To view logs:
```bash
docker-compose logs -f
```

---

## ⚙️ Configuration

### Database Setup

#### MongoDB Initialization

```bash
# Connect to MongoDB
mongosh

# Create database
use vidconnect

# Create initial admin user
db.users.insertOne({
  username: "admin",
  email: "admin@vidconnect.app",
  role: "admin",
  createdAt: new Date()
})
```

#### Redis Configuration

Edit `redis.conf` for production settings:
```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard → Settings → Upload
3. Create an upload preset with:
   - Folder: `vidconnect/profiles`
   - Format: mp4
   - Max file size: 50MB
   - Resource type: video

### Email Configuration

Configure SendGrid:
1. Create account at [SendGrid](https://sendgrid.com/)
2. Create API key with full access
3. Verify sender identity
4. Add API key to `.env`

---

## 🎨 Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18.2.0 |
| TypeScript | Type Safety | 5.0.0 |
| Redux Toolkit | State Management | 1.9.5 |
| React Router | Routing | 6.11.0 |
| TailwindCSS | Styling | 3.3.0 |
| Framer Motion | Animations | 10.12.0 |
| Socket.io Client | Real-time | 4.6.0 |
| React Query | Data Fetching | 4.29.0 |
| Axios | HTTP Client | 1.4.0 |
| React Hook Form | Forms | 7.43.0 |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 18.16.0 |
| Express | Web Framework | 4.18.2 |
| MongoDB | Database | 6.0.0 |
| Mongoose | ODM | 7.2.0 |
| Redis | Caching | 7.0.0 |
| Socket.io | WebSockets | 4.6.0 |
| JWT | Authentication | 9.0.0 |
| Bcrypt | Password Hashing | 5.1.0 |
| Multer | File Upload | 1.4.5 |
| Nodemailer | Email | 6.9.0 |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container |
| Kubernetes | Orchestration |
| GitHub Actions | CI/CD |
| Jest | Testing |
| ESLint | Linting |
| Prettier | Formatting |
| Husky | Git Hooks |

---

## 📱 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Profile Endpoints

#### Upload Video Profile
```http
POST /api/v1/profiles/video
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "video": [video file],
  "description": "Hey! I'm John...",
  "interests": ["coding", "hiking", "photography"]
}
```

#### Get Matches
```http
GET /api/v1/matches?limit=10&page=1
Authorization: Bearer {token}
```

### Community Endpoints

#### Create Community
```http
POST /api/v1/communities
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Tech Enthusiasts",
  "description": "A community for tech lovers",
  "interests": ["technology", "programming"],
  "isPrivate": false
}
```

For complete API documentation, visit the [API Docs](http://localhost:5000/api-docs) when running locally, or view the [Postman Collection](./docs/VidConnect_API.postman_collection.json).

---

## 🧪 Testing

### Run All Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Run Specific Test Suites
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

### Testing Tools
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Supertest**: API endpoint testing
- **Cypress**: End-to-end testing

---

## 🚢 Deployment

### Deploy to Heroku

#### Backend
```bash
cd backend
heroku create vidconnect-api
heroku addons:create heroku-redis:hobby-dev
heroku addons:create mongolab:sandbox
git push heroku main
```

#### Frontend
```bash
cd frontend
npm run build
# Deploy build folder to Netlify or Vercel
```

### Deploy to AWS

#### Using EC2
1. Launch EC2 instance (Ubuntu 22.04)
2. Install dependencies
3. Clone repository
4. Set up PM2 process manager
5. Configure Nginx as reverse proxy
6. Set up SSL with Let's Encrypt

#### Using ECS (Recommended)
```bash
# Build and push Docker images
docker build -t vidconnect-backend ./backend
docker build -t vidconnect-frontend ./frontend

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin
docker push your-ecr-repo/vidconnect-backend
docker push your-ecr-repo/vidconnect-frontend

# Deploy to ECS
aws ecs update-service --cluster vidconnect --service backend --force-new-deployment
```

### Deploy to DigitalOcean

1. Create Droplet
2. Set up Docker
3. Use Docker Compose for deployment
4. Configure firewall and security

Detailed deployment guides available in [docs/deployment](./docs/deployment/).

---

## 🤝 Contributing

We love contributions! VidConnect is an open-source project, and we welcome all types of contributions.

### How to Contribute

1. **Fork the Repository**
   ```bash
   # Click the Fork button on GitHub
   git clone https://github.com/YOUR_USERNAME/VidConnect.git
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Your Changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation

4. **Commit Your Changes**
   ```bash
   git commit -m "Add: amazing feature"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues
   - Wait for review

### Contribution Guidelines

- Follow the [Code of Conduct](./CODE_OF_CONDUCT.md)
- Write clear commit messages
- Add tests for new features
- Update documentation
- Keep PRs focused and small
- Be respectful and constructive

### Development Workflow

```bash
# Install dependencies
npm install

# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
npm test

# Commit with conventional commits
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

---

## 🗺️ Roadmap

### Phase 1: MVP (Completed ✅)
- [x] User authentication and profiles
- [x] Video upload and storage
- [x] Basic matching algorithm
- [x] Real-time messaging
- [x] Community creation

### Phase 2: Enhancement (In Progress 🚧)
- [x] AI-powered personality analysis
- [x] Advanced matching algorithm
- [ ] Mobile apps (iOS & Android)
- [ ] Video reactions and interactions
- [ ] Community events and challenges

### Phase 3: Scale (Q3 2026)
- [ ] AI video recommendations
- [ ] Live video streaming
- [ ] Virtual event spaces
- [ ] Integration with calendar apps
- [ ] Advanced analytics dashboard

### Phase 4: Monetization (Q4 2026)
- [ ] Premium subscription tiers
- [ ] Virtual gifts and rewards
- [ ] Business accounts
- [ ] Sponsored communities
- [ ] Advertising platform

### Future Ideas 💡
- AR filters for video recording
- Voice-only connection option
- Group video calls
- Integration with social platforms
- VidConnect for businesses

See the [open issues](https://github.com/yourusername/VidConnect/issues) for a full list of proposed features and known issues.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 VidConnect

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Acknowledgments

### Special Thanks

- **Open Source Community** for amazing tools and libraries
- **Early Beta Testers** for invaluable feedback
- **Contributors** who helped shape VidConnect

### Built With

- [React](https://reactjs.org/) - UI Framework
- [Node.js](https://nodejs.org/) - Runtime Environment
- [MongoDB](https://www.mongodb.com/) - Database
- [Cloudinary](https://cloudinary.com/) - Media Management
- [TailwindCSS](https://tailwindcss.com/) - CSS Framework

### Inspiration

- The need for authentic online connections
- Video-first approach of modern social apps
- Community-driven platforms

---

## 📧 Contact

### Project Maintainers

- **Lead Developer**: Your Name - [@yourtwitter](https://twitter.com/yourtwitter)
- **Email**: dev@vidconnect.app

### Links

- 🌐 **Website**: [https://vidconnect.app](https://vidconnect.app)
- 📖 **Documentation**: [https://docs.vidconnect.app](https://docs.vidconnect.app)
- 💬 **Discord**: [Join our community](https://discord.gg/vidconnect)
- 🐦 **Twitter**: [@vidconnect](https://twitter.com/vidconnect)
- 📺 **YouTube**: [VidConnect Channel](https://youtube.com/vidconnect)

### Support

- 📧 Email: support@vidconnect.app
- 💬 Discord: [Community Server](https://discord.gg/vidconnect)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/VidConnect/issues)

---

## 📊 Project Statistics

![GitHub stars](https://img.shields.io/github/stars/yourusername/VidConnect?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/VidConnect?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/VidConnect?style=social)
![GitHub contributors](https://img.shields.io/github/contributors/yourusername/VidConnect)
![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/VidConnect)
![GitHub issues](https://img.shields.io/github/issues/yourusername/VidConnect)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/VidConnect)

---

<div align="center">

### ⭐ Star us on GitHub — it motivates us a lot!

Made with ❤️ by the VidConnect Team

**[🚀 Get Started](#-getting-started)** • **[📖 Documentation](https://docs.vidconnect.app)** • **[💬 Community](https://discord.gg/vidconnect)**

</div>
