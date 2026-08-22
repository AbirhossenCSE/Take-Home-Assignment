# Real-Time CyberChat Application

A modern, high-performance web chat application featuring direct and group messaging, WebSocket real-time synchronization via Socket.io, defensive data handling, auto-scroll management, responsive mobile slide-overs, and client-side self-destructing (ephemeral) messages.

---

## 🛠 Tech Stack

- **[Next.js 14 (App Router)](https://nextjs.org/)** — Full-stack React framework providing hybrid rendering, static optimization, and intuitive file-system routing.
- **[TypeScript](https://www.typescriptlang.org/)** — End-to-end type safety for API requests, socket payloads, and component props.
- **[Tailwind CSS](https://tailwindcss.com/)** — Custom utility-first styling, HSL color palettes, glassmorphism blur effects, and keyframe micro-animations.
- **[Socket.io-Client](https://socket.io/)** — Real-time bidirectional WebSocket events with token-based handshake authentication and automatic fallback transport.
- **[Zustand](https://github.com/pmndrs/zustand)** — Lightweight, persistent session state management for user authentication (`auth-storage`).
- **[Axios](https://axios-http.com/)** — HTTP client with request interceptors for automated JWT authorization header injection.
- **[date-fns](https://date-fns.org/)** — Formatting timestamps and grouping chat history into calendar date headers ("Today", "Yesterday", full date).

---

## 🚀 Setup & Run Instructions

### 1. Prerequisites
Ensure you have **Node.js 18.x** or higher installed.

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/AbirhossenCSE/Take-Home-Assignment.git
cd Take-Home-Assignment
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Verify or update the environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://frontend-task-chatapp.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://frontend-task-chatapp.onrender.com
```

### 4. Development Server
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
To create an optimized production build:
```bash
npm run build
npm run start
```

---

## ✨ Features Implemented

### 🔑 Authentication & Session Management
- **Login / Auto-Registration**: Login with Name and Phone number via `POST /auth/login`.
- **Persistent State**: Token and currentUser persisted in `localStorage` via Zustand middleware (`auth-storage`).
- **Auth Guard**: Unauthenticated users visiting `/chat` are automatically redirected to `/login`.

### 💬 Direct & Group Conversations
- **Direct Messaging**: Search users by name/phone handle and initiate direct conversations.
- **Group Channels**: Create groups with custom channel names and multi-member selection.
- **Group Administration**:
  - Rename group.
  - Add new members via debounced user search.
  - Remove members (admin or self-leave).
  - Promote members to admin.

### ⚡ Real-Time WebSocket Synchronization (Socket.io)
- **Handshake Authentication**: Passes JWT token during handshake auth (`{ auth: { token } }`).
- **Live Event Handlers**:
  - `message:send`: Client emits message with ack callback for immediate server confirmation.
  - `message:new`: Appends incoming messages to active conversation and moves updated conversations to the top of the sidebar.
  - `conversation:updated`: Reflects group metadata changes dynamically.
- **Offline Fallback & Reconnection**: Displays a visual `"Reconnecting..."` / offline status banner if socket connection drops, falling back to REST `POST /messages`.

### 📜 Message History & Auto-Scroll Logic
- **History Fetching**: Retrieves history via `GET /conversations/{id}/messages`.
- **Date Separators**: Automatically inserts date headers ("Today", "Yesterday", or "August 20, 2026") when calendar day changes.
- **Smart Auto-Scroll**:
  - Scrolls to bottom automatically on initial conversation load.
  - Auto-scrolls on new messages if the user is near the bottom or sent the message.
  - Displays a floating **"New message ↓"** button if the user is scrolled up reading past history.

### 🛡️ Defensive Data Normalization & UI States
- **Crash-Proof Helpers**: Utility functions (`getConversationName`, `getInitial`, `getSafeName`) gracefully handle incomplete/unpopulated API objects without runtime exceptions.
- **UI States**: Skeleton loading bubbles, empty chat states, and error retry handlers.
- **Responsive Mobile Layout**: Mobile viewports (<768px) toggle between sidebar and chat panel with a mobile back button (`←`).

### 🔥 Standout Bonus Feature: Self-Destruct (Ephemeral) Messages
- **Selectable Timers**: Choose self-destruct duration (**10s**, **30s**, **1 min**, **5 min**) via input timer selector popover.
- **Live Countdown Indicator**: Renders an active countdown pill (`⏱ 0:08`) inside the message bubble.
- **Zero-Trace Purge**: When the timer hits `0:00`, the bubble smoothly fades out and is purged from memory state.

### 🌐 Cyber-Glass Landing Page (`/`)
- Interactive Showcase landing page (`/app/page.tsx`) in Midnight Cyber-Glass style featuring an interactive live sandbox chat simulator and real-time socket monitor.

---

## 🔗 Live Demo Links

- **Chat Application Demo**: [https://cyber-chat-jade.vercel.app/login](https://cyber-chat-jade.vercel.app/login)
- **Landing Page Demo**: [https://cyber-chat-jade.vercel.app/](https://cyber-chat-jade.vercel.app/)

---

## 🧠 Thought Process

### Part 1: Architecture & Library Choices
*[Placeholder: Describe your architectural decisions, trade-offs between WebSockets vs REST fallbacks, state management choices with Zustand, and code organization.]*

### Part 2: Design Reasoning
*[Placeholder: Explain your visual design decisions, choice of HSL dark color palette, micro-animations, and mobile responsive layout strategy.]*

### How AI Tools Were Used
*[Placeholder: Detail how AI tools (e.g. planning mode, architectural design, rapid prototyping, and bug diagnosis) were leveraged throughout development.]*

### What You'd Improve with More Time
*[Placeholder: Mention potential future improvements such as database-backed self-destruct persistence, media/file uploads, global message search, or typing indicators.]*

---

## ⚠️ Issues Encountered

*[Placeholder: Add any notes regarding backend API response shapes, socket event behaviors, or unpopulated fields observed during integration.]*
