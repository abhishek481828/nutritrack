import { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../services/chatService';

/* ── Markdown-lite renderer: **bold** + line breaks ─────────────────── */
const BotText = ({ text }) => {
  const lines = text.split('\n');
  return (
    <span>
      {lines.map((line, li) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={li}>
            {parts.map((part, pi) =>
              pi % 2 === 1
                ? <strong key={pi} style={{ color: '#fff', fontWeight: 700 }}>{part}</strong>
                : <span key={pi}>{part}</span>
            )}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </span>
  );
};

/* ── Quick-suggestion chips shown on open ────────────────────────────── */
const SUGGESTIONS = [
  '🍗 Calories in chicken?',
  '💪 Best protein foods',
  '⚖️ Weight loss tips',
  '🍳 Breakfast ideas',
  '💧 How much water daily?',
];

/* ── Typing dots animation ───────────────────────────────────────────── */
const TypingDots = () => (
  <div className="chatbot-typing">
    <span /><span /><span />
  </div>
);

/* ════════════════════════════════════════════════════════════════════════
   CHATBOT WIDGET
   ════════════════════════════════════════════════════════════════════════ */
const Chatbot = () => {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hi! 👋 I\'m **NutriBot**, your personal nutrition assistant.\n\nAsk me about calories, macros, weight loss, meal ideas, and more!\n\nType **"help"** to see all topics.',
    },
  ]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  /* scroll to latest message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* focus input on open, clear unread */
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const addMsg = (role, text) =>
    setMessages(prev => [...prev, { role, text }]);

  const handleSend = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    addMsg('user', trimmed);
    setInput('');
    setLoading(true);

    try {
      const res = await sendMessage(trimmed);
      const reply = res.data?.reply || 'No response received.';
      addMsg('bot', reply);
      if (!open) setUnread(n => n + 1);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Sorry, I couldn\'t reach the server. Please try again.';
      addMsg('bot', `⚠️ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {/* ── Styles injected inline so they always apply ── */}
      <style>{`
        /* FAB trigger */
        .cb-fab {
          position: fixed;
          bottom: 1.75rem;
          right: 1.75rem;
          z-index: 1100;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 4px 24px rgba(16,185,129,0.45), 0 2px 8px rgba(0,0,0,0.35);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          outline: none;
          overflow: visible;
        }
        .cb-fab:hover { transform: scale(1.1); box-shadow: 0 6px 32px rgba(16,185,129,0.6); }
        .cb-fab--open { background: linear-gradient(135deg, #374151, #1f2937); font-size: 1.1rem; }

        /* Unread badge */
        .cb-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #f43f5e;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 800;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #0f172a;
          animation: cb-pop 0.2s ease;
        }

        /* Chat window */
        .cb-window {
          position: fixed;
          bottom: 5.5rem;
          right: 1.75rem;
          z-index: 1100;
          width: 370px;
          max-height: 580px;
          display: flex;
          flex-direction: column;
          background: #111827;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.08);
          overflow: hidden;
          animation: cb-rise 0.25s cubic-bezier(0.4,0,0.2,1);
        }

        @keyframes cb-rise {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cb-pop {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
        @keyframes cb-msg {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cb-dot {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }

        /* Header */
        .cb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9rem 1.1rem;
          background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.08));
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .cb-header-left { display: flex; align-items: center; gap: 0.7rem; }
        .cb-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg,#10b981,#06b6d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(16,185,129,0.4);
        }
        .cb-header-name {
          font-size: 0.9rem; font-weight: 700; color: #f1f5f9; letter-spacing: -0.01em;
        }
        .cb-header-status {
          display: flex; align-items: center; gap: 0.35rem;
          font-size: 0.7rem; color: #94a3b8; margin-top: 1px;
        }
        .cb-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px rgba(16,185,129,0.8);
          animation: cb-pulse 2s ease-in-out infinite;
        }
        @keyframes cb-pulse {
          0%, 100% { box-shadow: 0 0 4px rgba(16,185,129,0.5); }
          50%       { box-shadow: 0 0 10px rgba(16,185,129,0.9); }
        }
        .cb-close {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 0.75rem; color: #94a3b8;
          transition: background 0.15s, color 0.15s;
        }
        .cb-close:hover { background: rgba(244,63,94,0.15); color: #f43f5e; border-color: rgba(244,63,94,0.25); }

        /* Messages area */
        .cb-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .cb-messages::-webkit-scrollbar { width: 4px; }
        .cb-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        /* Bubble row */
        .cb-row { display: flex; align-items: flex-end; gap: 0.5rem; animation: cb-msg 0.2s ease; }
        .cb-row--user { flex-direction: row-reverse; }
        .cb-row--bot  { flex-direction: row; }

        /* Small avatar per bubble */
        .cb-row-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; flex-shrink: 0;
        }
        .cb-row-avatar--bot  { background: linear-gradient(135deg,#10b981,#06b6d4); }
        .cb-row-avatar--user { background: linear-gradient(135deg,#6366f1,#8b5cf6); }

        /* Bubble */
        .cb-bubble {
          max-width: 76%;
          padding: 0.65rem 0.9rem;
          border-radius: 16px;
          font-size: 0.83rem;
          line-height: 1.6;
          word-break: break-word;
        }
        .cb-bubble--bot {
          background: rgba(255,255,255,0.06);
          color: #e2e8f0;
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .cb-bubble--user {
          background: linear-gradient(135deg,#10b981,#059669);
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        /* Typing dots */
        .cb-typing {
          display: flex; gap: 4px; align-items: center;
          padding: 0.55rem 0.75rem;
        }
        .cb-typing span {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981; display: block;
        }
        .cb-typing span:nth-child(1) { animation: cb-dot 1.2s 0s   infinite; }
        .cb-typing span:nth-child(2) { animation: cb-dot 1.2s 0.2s infinite; }
        .cb-typing span:nth-child(3) { animation: cb-dot 1.2s 0.4s infinite; }

        /* Suggestions */
        .cb-suggestions {
          padding: 0 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          flex-shrink: 0;
        }
        .cb-suggestions-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
          font-weight: 700;
          margin-bottom: 0.1rem;
        }
        .cb-chip {
          background: rgba(16,185,129,0.06);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 20px;
          padding: 0.4rem 0.85rem;
          font-size: 0.78rem;
          color: #a7f3d0;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cb-chip:hover {
          background: rgba(16,185,129,0.14);
          border-color: rgba(16,185,129,0.4);
          transform: translateX(2px);
        }

        /* Input bar */
        .cb-input-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 0.9rem;
          border-top: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          flex-shrink: 0;
        }
        .cb-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0.55rem 0.85rem;
          font-size: 0.83rem;
          color: #f1f5f9;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .cb-input::placeholder { color: #475569; }
        .cb-input:focus {
          border-color: rgba(16,185,129,0.5);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .cb-input:disabled { opacity: 0.5; }
        .cb-send {
          width: 38px; height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg,#10b981,#059669);
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem;
          color: #fff;
          flex-shrink: 0;
          transition: opacity 0.15s, transform 0.15s;
          box-shadow: 0 2px 8px rgba(16,185,129,0.35);
        }
        .cb-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .cb-send:not(:disabled):hover { transform: scale(1.05); }
        .cb-send-spin {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 420px) {
          .cb-window { width: calc(100vw - 2rem); right: 1rem; bottom: 5rem; }
          .cb-fab    { right: 1rem; bottom: 1.25rem; }
        }
      `}</style>

      {/* ── FAB trigger ───────────────────────────────── */}
      <button
        id="chatbot-trigger"
        className={`cb-fab${open ? ' cb-fab--open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Close NutriBot' : 'Open NutriBot'}
      >
        {open ? '✕' : '🥗'}
        {!open && unread > 0 && (
          <span className="cb-badge">{unread}</span>
        )}
      </button>

      {/* ── Chat window ───────────────────────────────── */}
      {open && (
        <div className="cb-window" role="dialog" aria-label="NutriBot nutrition assistant">

          {/* Header */}
          <div className="cb-header">
            <div className="cb-header-left">
              <div className="cb-avatar">🤖</div>
              <div>
                <div className="cb-header-name">NutriBot</div>
                <div className="cb-header-status">
                  <span className="cb-status-dot" />
                  Nutrition assistant · Online
                </div>
              </div>
            </div>
            <button className="cb-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>

          {/* Messages */}
          <div className="cb-messages" id="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`cb-row cb-row--${m.role}`}>
                <div className={`cb-row-avatar cb-row-avatar--${m.role}`}>
                  {m.role === 'bot' ? '🤖' : '👤'}
                </div>
                <div className={`cb-bubble cb-bubble--${m.role}`}>
                  {m.role === 'bot' ? <BotText text={m.text} /> : m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="cb-row cb-row--bot">
                <div className="cb-row-avatar cb-row-avatar--bot">🤖</div>
                <div className="cb-bubble cb-bubble--bot">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions — only before first user message */}
          {messages.length === 1 && !loading && (
            <div className="cb-suggestions">
              <div className="cb-suggestions-label">Quick questions</div>
              {SUGGESTIONS.map(s => (
                <button key={s} className="cb-chip" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="cb-input-bar">
            <input
              ref={inputRef}
              id="chatbot-input"
              className="cb-input"
              type="text"
              placeholder="Ask a nutrition question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              maxLength={500}
              disabled={loading}
              autoComplete="off"
            />
            <button
              id="chatbot-send"
              className="cb-send"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              {loading ? <span className="cb-send-spin" /> : '➤'}
            </button>
          </div>

        </div>
      )}
    </>
  );
};

export default Chatbot;
