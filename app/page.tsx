"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface DemoMessage {
  id: string;
  sender: string;
  isMe: boolean;
  text: string;
  time: string;
  ephemeralDuration?: number;
  expiresAt?: number;
  secondsLeft?: number;
  isFadingOut?: boolean;
}

export default function Home() {
  // Sandbox Demo State
  const [inputText, setInputText] = useState('Confidential project update: deploy key #9284');
  const [selectedTimer, setSelectedTimer] = useState<number>(5);
  const [demoMessages, setDemoMessages] = useState<DemoMessage[]>([
    {
      id: 'demo-1',
      sender: 'Alex',
      isMe: false,
      text: 'Welcome to the CyberChat sandbox! Try sending a self-destruct message below.',
      time: 'Just now',
    },
  ]);
  const [systemLogs, setSystemLogs] = useState<string[]>([
    'Connected to websocket wss://frontend-task-chatapp.onrender.com',
    'Handshake authenticated via JWT Bearer',
  ]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setSystemLogs((prev) => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSendDemoMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const id = `demo-msg-${Date.now()}`;
    const now = Date.now();
    const expiresAt = selectedTimer > 0 ? now + selectedTimer * 1000 : undefined;

    const newMsg: DemoMessage = {
      id,
      sender: 'You',
      isMe: true,
      text: inputText.trim(),
      time: 'Just now',
      ephemeralDuration: selectedTimer > 0 ? selectedTimer : undefined,
      expiresAt,
      secondsLeft: selectedTimer > 0 ? selectedTimer : undefined,
    };

    setDemoMessages((prev) => [...prev, newMsg]);
    addLog(`Event "message:send" emitted (ephemeral: ${selectedTimer > 0 ? `${selectedTimer}s` : 'Off'})`);
    setInputText('');
  };

  // Timer tick for demo messages
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoMessages((prevMsgs) =>
        prevMsgs
          .map((msg) => {
            if (!msg.expiresAt) return msg;
            const left = Math.max(0, Math.ceil((msg.expiresAt - Date.now()) / 1000));

            if (left <= 0 && !msg.isFadingOut) {
              addLog(`[VAPORIZED] Message #${msg.id.slice(-4)} self-destructed cleanly from DOM`);
              return { ...msg, secondsLeft: 0, isFadingOut: true };
            }

            return { ...msg, secondsLeft: left };
          })
          .filter((msg) => !msg.isFadingOut || (msg.expiresAt && Date.now() - msg.expiresAt < 400))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [systemLogs]);

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Dynamic Cyber Grid Background Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Radial Glow Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-amber-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* NAVIGATION BAR */}
      <header className="relative z-20 border-b border-slate-800/80 bg-[#070A12]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-wider text-white font-mono">
                CYBER<span className="text-cyan-400">CHAT</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                v2.0
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition">
              Features
            </a>
            <a href="#demo" className="hover:text-cyan-400 transition">
              Interactive Demo
            </a>
            <a href="#architecture" className="hover:text-cyan-400 transition">
              Architecture
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>SERVER ONLINE</span>
            </div>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span>Launch App</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* HERO SECTION */}
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>REAL-TIME SOCKET.IO + CLIENT-SIDE EPHEMERAL ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-6">
            Instant Communication.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400 bg-clip-text text-transparent">
              Zero Permanent Traces.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
            Experience sub-50ms real-time messaging with instant WebSocket synchronization, group chat
            controls, and self-destructing ephemeral messages that vaporize cleanly from memory.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 bg-[length:200%_auto] animate-gradient text-white font-bold text-base shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_45px_rgba(6,182,212,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-3"
            >
              <span>Get Started Now</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-semibold text-base transition flex items-center justify-center gap-2 backdrop-blur-md"
            >
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Try Interactive Sandbox</span>
            </a>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-800/80 text-left">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
              <div className="text-2xl font-extrabold font-mono text-cyan-400">&lt;50ms</div>
              <div className="text-xs text-slate-400 mt-1">Socket Sync Latency</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
              <div className="text-2xl font-extrabold font-mono text-amber-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Self-Destruct Reliability</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
              <div className="text-2xl font-extrabold font-mono text-blue-400">JWT Auth</div>
              <div className="text-xs text-slate-400 mt-1">Handshake Protection</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
              <div className="text-2xl font-extrabold font-mono text-emerald-400">Responsive</div>
              <div className="text-xs text-slate-400 mt-1">Mobile & Desktop Sync</div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE DEMO SANDBOX */}
        <section id="demo" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
              INTERACTIVE <span className="text-cyan-400">LIVE SANDBOX</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto">
              Test self-destruct messages directly below. Watch the timer tick down and vaporize the message bubble in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] relative">
            {/* Left: Chat Sandbox Window (8 cols) */}
            <div className="lg:col-span-8 flex flex-col h-[480px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
              {/* Header */}
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">#sandbox-active-session</span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  REALTIME SIMULATOR
                </span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {demoMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col transition-all duration-300 ${
                      msg.isFadingOut ? 'opacity-0 scale-95 -translate-y-2' : 'animate-fade-in'
                    } ${msg.isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.isMe
                          ? 'bg-blue-600 text-white rounded-br-xs shadow-md'
                          : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
                      }`}
                    >
                      <p>{msg.text}</p>

                      <div
                        className={`flex items-center justify-end gap-2 mt-1.5 text-[10px] ${
                          msg.isMe ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.secondsLeft !== undefined && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <svg
                              className="w-2.5 h-2.5 text-amber-400 animate-spin"
                              style={{ animationDuration: '3s' }}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>0:0{msg.secondsLeft}</span>
                          </span>
                        )}
                        <span>{msg.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sandbox Input Area */}
              <form onSubmit={handleSendDemoMessage} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
                {/* Timer Duration Picker */}
                <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                  <span className="text-[10px] font-mono text-slate-400 px-2">TIMER:</span>
                  {[5, 10, 30].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setSelectedTimer(t)}
                      className={`px-2 py-1 text-xs font-mono rounded-lg transition ${
                        selectedTimer === t
                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a self-destructing test message..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />

                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition flex items-center gap-1"
                >
                  <span>Send</span>
                  <svg className="w-3.5 h-3.5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Right: Live Event Monitor Terminal (4 cols) */}
            <div className="lg:col-span-4 flex flex-col h-[480px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <span className="text-cyan-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  LIVE EVENT MONITOR
                </span>
                <span className="text-slate-500 text-[10px]">SOCKET.IO ENGINE</span>
              </div>
              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-slate-300 bg-slate-950/90">
                {systemLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed break-words">
                    <span className="text-cyan-500">&gt;</span>{' '}
                    <span
                      className={
                        log.includes('VAPORIZED')
                          ? 'text-amber-400 font-semibold'
                          : log.includes('emitted')
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }
                    >
                      {log}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
              <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
                <span>STATUS: CONNECTED</span>
                <span className="text-emerald-400 font-bold">100% HEALTHY</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
              ENGINEERED FOR <span className="text-cyan-400">SPEED & PRIVACY</span>
            </h2>
            <p className="text-slate-400 text-base mt-3 max-w-2xl mx-auto">
              Built with precision architectural components to deliver real-time responsiveness and client-side ephemeral security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] group backdrop-blur-xl">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Socket.io Sync</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Instant bi-directional socket events (`message:send`, `message:new`, `conversation:updated`) with automatic fallback to REST API endpoints during network transitions.
              </p>
              <ul className="text-xs font-mono text-cyan-400 space-y-1.5">
                <li>✓ Handshake JWT Authentication</li>
                <li>✓ Automatic Reconnection Recovery</li>
                <li>✓ Active Typing & Status Indicators</li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] group backdrop-blur-xl relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Self-Destruct Ephemeral Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Selectable self-destruct timers (10s, 30s, 1m, 5m). Messages count down visually inside the bubble and disintegrate completely from memory when the timer hits zero.
              </p>
              <ul className="text-xs font-mono text-amber-400 space-y-1.5">
                <li>✓ Live Visual Countdown Ring</li>
                <li>✓ Smooth Particle Fade-Out</li>
                <li>✓ Client-Side Zero-Trace Purge</li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] group backdrop-blur-xl">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Group Chat & Admin Controls</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Create custom group channels, search users by handle or phone, manage group names, promote admins, add or remove participants effortlessly.
              </p>
              <ul className="text-xs font-mono text-blue-400 space-y-1.5">
                <li>✓ Granular Admin Privileges</li>
                <li>✓ Instant Group Info Sync</li>
                <li>✓ Mobile Slide-Over Views</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE TECH SPECS */}
        <section id="architecture" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest">ARCHITECTURE & TECH STACK</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 leading-tight">
                Designed for Reliability & Modern Web Standards
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mt-4">
                Built on Next.js 14 App Router, TypeScript, Zustand session state, and Axios request interceptors for token auto-injection.
              </p>

              <div className="mt-8 space-y-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Defensive Data Normalization</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      Guaranteed crash-proof name extraction (`getConversationName`, `getInitial`) across direct and group chat formats.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Optimistic Reconciliation</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      Messages render instantly in the UI with temporary IDs and seamlessly reconcile when real server acknowledgments arrive.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300 shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-slate-500">
                  <span>{'// SYSTEM LOG SNAPSHOT'}</span>
                  <span>PROTOCOL: WSS / HTTPS</span>
                </div>
                <pre className="pt-4 overflow-x-auto leading-relaxed text-slate-300">
                  <code className="text-cyan-400">{`[Socket] Connect -> https://frontend-task-chatapp.onrender.com
[Auth] Handshake token: Bearer eyJhbGciOiJIUzI1Ni...
[Socket] Event "message:send" emitted (id: temp-178291)
[UI] Optimistic message rendered in DOM
[Socket] Event "message:new" received -> Reconciling temp-178291
[Ephemeral] Message timer set -> 5 seconds
[Ephemeral] Countdown tick: 5s .. 4s .. 3s .. 2s .. 1s .. 0s
[DOM] Message purged cleanly from memory state.`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA SECTION */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-b from-cyan-950/40 to-slate-900/80 border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.15)] relative overflow-hidden backdrop-blur-2xl">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Ready to Start Chatting?
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Experience instant Socket.io sync, group messaging, and self-destruct ephemeral messages right now.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-base shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.7)] hover:scale-105 transition-all gap-2"
            >
              <span>Launch Application Now</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#05070E] py-8 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 CYBERCHAT PLATFORM. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-cyan-400 transition">
              Login
            </Link>
            <Link href="/chat" className="hover:text-cyan-400 transition">
              Chat App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
