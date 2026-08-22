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
I went with Zustand for state management mainly because it's lightweight and needed almost zero setup, persisting the auth token and user info to localStorage took just one line with its middleware, which would've been more boilerplate with Redux or even Context.

For real-time messaging, Socket.io was the obvious pick since it's basically the standard for this kind of thing and handles reconnects and fallbacks for you. The one trade-off I actually had to think about was whether to send messages purely through the socket or also keep the old REST endpoint as a backup. Socket-only would've been simpler, but if the connection drops for a second, the message just disappears. So I kept both, it added some extra care around not duplicating messages (between the optimistic bubble, the socket ack, and the REST response), but it made the whole thing feel a lot more solid.

### Part 2: Design Reasoning
I picked the Midnight Cyber-Glass direction for the landing page because it just looked more premium and fit a chat app better than a generic dark theme, the frosted glass cards and cyan/amber accents gave it a "modern, a bit techy" feel without going overboard.

The interactive sandbox in the hero was something I specifically wanted because it lets someone actually try the self-destruct timer before even logging in, instead of just reading a bullet point about it. Felt like a better way to "show, don't tell" for Part 2.

### How AI Tools Were Used
I used Claude for planning and Claude Code for the actual implementation, going through it in phases, setup, API types, auth, conversations, groups, the chat panel + real-time, the bonus feature, then the landing page and deployment. I gave fairly detailed prompts for each phase instead of one big "build the whole app" prompt, since that gave more control over what got built and made it easier to test as I went.

I didn't just accept everything as-is though. The API docs only specified requests, not responses, so I tested every endpoint myself in Swagger and fed the real response shapes back in, skipping that step actually caused a crash early on (`conversations.map is not a function`) because the AI had guessed the shape wrong. I also ran into the Next.js `.next` cache getting corrupted twice after big changes (`Cannot find module './948.js'`), that wasn't a code bug, I had to recognize it as a cache issue and fix it myself by clearing `.next` and restarting. For the bonus feature, the AI proposed a "scheduled + self-destruct" combo, but I scoped it down to just self-destruct because scheduling would need real backend persistence, shipping the scheduling part would've meant a feature that quietly breaks on refresh, which didn't seem worth it. Deployment issues (Vercel's lowercase-only project naming, and a deployment protection setting that was blocking the public URL) I also debugged and fixed myself outside of the AI.

### What You'd Improve With More Time
If I had more time, I'd make the self-destruct feature actually persist on the backend instead of just being a client-side visual effect. I'd also add typing indicators, read receipts, and image/file attachments, plus message search and unread badges in the sidebar, none of that felt essential for this assignment but they're the obvious next things a real chat app would need.

---

## ⚠️ Issues Encountered
The API spec only documented requests, not responses, no response bodies or status codes were given. So for every endpoint, I had to call it through Swagger's "Try it out" first, look at what actually came back, and build the TypeScript types from that instead of a spec. That was expected going in, but it meant a couple of early bugs came from me guessing a response shape wrong before I'd actually tested it, nothing broken on the backend side, just something I had to work through myself.
