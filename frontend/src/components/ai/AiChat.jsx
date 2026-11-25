// PestKill AI conversation interface, used on /pestkill-ai and inside the staff console.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, ImagePlus, X, ThumbsUp, ThumbsDown, Sparkles, Search as SearchIcon, AlertTriangle, RotateCcw } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { shrinkPhoto } from './photo';
import './AiChat.css';

const KEY_STORE = 'pk_ai_keys';
const readKeys = () => { try { return JSON.parse(sessionStorage.getItem(KEY_STORE) || '{}'); } catch { return {}; } };
const saveKey = (id, key) => { try { sessionStorage.setItem(KEY_STORE, JSON.stringify({ ...readKeys(), [id]: key })); } catch { /* storage unavailable */ } };

export const SUGGESTIONS = {
  assistant: {
    en: ['How much does termite treatment cost for a 1,200 sq.ft. house?', 'Do you serve my city? How does a visit get scheduled?', 'How do I become a verified PCO buyer?', 'What is your product replacement policy?'],
    hi: ['1200 sq.ft. घर में दीमक के इलाज का खर्च कितना है?', 'क्या आप मेरे शहर में सर्विस देते हैं?', 'PCO वेरिफिकेशन कैसे होता है?', 'कॉकरोच से छुटकारा कैसे पाएं?'],
  },
  identify: { en: ['What pest is this?', 'Are these termites or ants?'], hi: ['यह कौन सा कीड़ा है?', 'क्या यह दीमक है?'] },
  field: { en: ['Make an inspection checklist for a post-construction termite job', 'Turn my notes into a customer-friendly visit report', 'Which documents do we have for Premise SC?'], hi: ['दीमक निरीक्षण की चेकलिस्ट बनाओ', 'मेरे नोट्स से रिपोर्ट बनाओ'] },
  insights: { en: ['Which leads need a follow-up today?', 'Summarise workload and pending complaints', 'What needs my attention this week?'], hi: ['आज किन लीड्स को फॉलो-अप करना है?', 'इस हफ्ते किस पर ध्यान देना है?'] },
};

/** Renders the assistant's plain-text answer: paragraphs, bullets, **bold**, links and [S1] source refs. */
const Inline = ({ text, sources }) => {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\[S\d+\]|\[[^\]]+\]\((?:\/[^)\s]*|https:\/\/[^)\s]+)\)|(?:^|\s)\/(?:[a-z0-9-]+\/?)+[a-z0-9-]*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) parts.push(<strong key={m.index}>{t.slice(2, -2)}</strong>);
    else if (/^\[S\d+\]$/.test(t)) {
      const s = sources?.find((x) => `[${x.ref}]` === t);
      parts.push(s ? <a key={m.index} className="ai-ref" href={s.url} title={s.title} target={s.url.startsWith('/api/') ? '_blank' : undefined} rel="noopener noreferrer">{t.slice(1, -1)}</a> : <sup key={m.index}>{t.slice(1, -1)}</sup>);
    } else if (t.startsWith('[')) {
      const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t);
      parts.push(href.startsWith('/') ? <Link key={m.index} to={href}>{label}</Link> : <a key={m.index} href={href} target="_blank" rel="noopener noreferrer nofollow">{label}</a>);
    } else {
      const lead = t.match(/^\s*/)[0];
      const path = t.trim();
      parts.push(lead, <Link key={m.index} to={path}>{path}</Link>);
    }
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

export const AiText = ({ text, sources }) => {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (bullet) {
      if (!list) { list = []; blocks.push({ type: 'ul', items: list, key: i }); }
      list.push(bullet[1]);
      return;
    }
    list = null;
    if (!line.trim()) return;
    const h = /^#{1,4}\s+(.*)$/.exec(line);
    blocks.push(h ? { type: 'h', text: h[1], key: i } : { type: 'p', text: line, key: i });
  });
  return blocks.map((b) => (b.type === 'ul'
    ? <ul key={b.key}>{b.items.map((t, j) => <li key={j}><Inline text={t} sources={sources} /></li>)}</ul>
    : b.type === 'h' ? <h4 key={b.key}><Inline text={b.text} sources={sources} /></h4> : <p key={b.key}><Inline text={b.text} sources={sources} /></p>));
};

const Feedback = ({ id, convoId }) => {
  const [state, setState] = useState(null);
  const send = async (helpful) => {
    setState(helpful ? 'up' : 'down');
    try {
      const key = readKeys()[convoId];
      await api(`/ai/messages/${id}/feedback`, { method: 'POST', body: { helpful }, headers: key ? { 'x-ai-key': key } : undefined });
    } catch { /* feedback is best-effort */ }
  };
  return (
    <span className="ai-feedback" aria-label="Was this helpful?">
      <button type="button" aria-pressed={state === 'up'} className={state === 'up' ? 'on' : ''} onClick={() => send(true)} aria-label="Helpful"><ThumbsUp size={14} /></button>
      <button type="button" aria-pressed={state === 'down'} className={state === 'down' ? 'on' : ''} onClick={() => send(false)} aria-label="Not helpful"><ThumbsDown size={14} /></button>
    </span>
  );
};

/**
 * mode: assistant | identify | diagnose | quote | field | insights
 * prefill: { text, extra } – a message to send immediately (diagnosis and quote forms)
 */
const AiChat = ({ mode = 'assistant', lang = 'en', page, productSlug, status, prefill, onPrefillSent, compact = false }) => {
  const { user } = useAuth();
  const [convoId, setConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const threadRef = useRef(null);
  const offline = status && !status.configured;

  useEffect(() => { setConvoId(null); setMessages([]); setError(null); }, [mode]);
  // Keep the newest message in view inside the thread only (never scroll the page itself).
  useEffect(() => { const t = threadRef.current; if (t && (messages.length || busy)) t.scrollTop = t.scrollHeight; }, [messages, busy]);
  useEffect(() => { if (user) api('/ai/conversations').then(setHistory).catch(() => {}); }, [user, convoId]);

  const open = async (id) => {
    try {
      const c = await api(`/ai/conversations/${id}`);
      setConvoId(c.id);
      setMessages(c.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, sources: m.sources, hadImage: m.had_image })));
    } catch (e) { setError(e.message); }
  };

  const ask = async (text, extra = {}) => {
    if (busy) return;
    const q = (text ?? input).trim();
    if (!q && !photo) return;
    setError(null);
    setMessages((m) => [...m, { role: 'user', content: q || '(photo for identification)', photo: photo?.preview }]);
    setInput('');
    const image = photo?.dataUrl;
    setPhoto(null);
    if (offline) {
      // No AI provider: show matching verified knowledge instead of an invented answer.
      try {
        const results = await api(`/ai/search?q=${encodeURIComponent(q || 'pest identification')}`);
        setMessages((m) => [...m, { role: 'search', results }]);
      } catch (e) { setError(e.message); }
      return;
    }
    setBusy(true);
    try {
      const key = convoId ? readKeys()[convoId] : null;
      const r = await api('/ai/chat', { method: 'POST', body: { mode, message: q, image, lang, page, productSlug, conversationId: convoId, ...extra }, headers: key ? { 'x-ai-key': key } : undefined });
      if (r.conversationKey) saveKey(r.conversationId, r.conversationKey);
      setConvoId(r.conversationId);
      setMessages((m) => [...m, { ...r.message }]);
    } catch (e) {
      setError(e);
    }
    setBusy(false);
  };

  useEffect(() => {
    if (prefill) { ask(prefill.text, prefill.extra); onPrefillSent?.(); }
  }, [prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = async (file) => {
    if (!file) return;
    try { setPhoto(await shrinkPhoto(file)); } catch (e) { setError(e); }
  };

  const suggestions = useMemo(() => (SUGGESTIONS[mode]?.[lang] || SUGGESTIONS[mode]?.en || []), [mode, lang]);
  const needsPhoto = mode === 'identify';

  return (
    <div className={`ai-chat ${compact ? 'is-compact' : ''}`}>
      {user && history.length > 0 && !compact && (
        <aside className="ai-history" aria-label="Your conversations">
          <h4>Your conversations</h4>
          <button type="button" className="ai-new" onClick={() => { setConvoId(null); setMessages([]); }}><RotateCcw size={13} /> New conversation</button>
          <ul>{history.slice(0, 12).map((c) => <li key={c.id}><button type="button" className={c.id === convoId ? 'on' : ''} onClick={() => open(c.id)}>{c.title}</button></li>)}</ul>
        </aside>
      )}
      <div className="ai-main">
        <div className="ai-thread" aria-live="polite" ref={threadRef}>
          {messages.length === 0 && (
            <div className="ai-empty">
              <span className="ai-orb" aria-hidden="true"><Sparkles size={20} /></span>
              <p>{needsPhoto ? 'Add a clear, close photo of the pest, droppings or damage.' : offline ? 'PestKill AI answers are switched off right now. You can still search our verified knowledge.' : 'Ask about pests, treatments, prices, bookings or products.'}</p>
              {!needsPhoto && <div className="ai-suggest">{suggestions.map((s) => <button type="button" key={s} onClick={() => ask(s)}>{s}</button>)}</div>}
            </div>
          )}
          {messages.map((m, i) => (
            m.role === 'user' ? (
              <div key={i} className="ai-msg user">
                {m.photo && <img src={m.photo} alt="Your photo" />}
                {m.hadImage ? <small>Photo attached</small> : null}
                <p>{m.content}</p>
              </div>
            ) : m.role === 'search' ? (
              <div key={i} className="ai-msg assistant search">
                <span className="ai-label"><SearchIcon size={13} /> Verified knowledge search (AI answers are off)</span>
                {m.results.length ? <ul className="ai-results">{m.results.map((r) => (
                  <li key={r.id}><a href={r.url} target={r.url.startsWith('/api/') ? '_blank' : undefined} rel="noopener noreferrer">{r.title}</a><small>{r.kind.replace('-', ' ')}</small><p>{r.snippet}…</p></li>
                ))}</ul> : <p>Nothing in our verified knowledge matches that. Please call or WhatsApp us on +91 6375338302.</p>}
              </div>
            ) : (
              <div key={i} className="ai-msg assistant">
                <span className="ai-label"><Sparkles size={13} /> PestKill AI</span>
                <div className="ai-body"><AiText text={m.content} sources={m.sources} /></div>
                {m.truncated && <p className="ai-warn">The answer was cut short. Ask me to continue.</p>}
                {m.sources?.length > 0 && (
                  <div className="ai-sources">{m.sources.map((s) => <a key={s.ref} href={s.url} target={s.url.startsWith('/api/') ? '_blank' : undefined} rel="noopener noreferrer"><b>{s.ref}</b> {s.title}</a>)}</div>
                )}
                <div className="ai-msg-foot">
                  <small>AI answer. It can be wrong. Product labels and our team have the final word.</small>
                  {m.id && <Feedback id={m.id} convoId={convoId} />}
                </div>
              </div>
            )
          ))}
          {busy && <div className="ai-msg assistant typing" aria-label="PestKill AI is thinking"><span /><span /><span /></div>}
        </div>

        {error && (
          <div className="ai-error" role="alert">
            <AlertTriangle size={16} /> <span>{typeof error === 'string' ? error : error.message}</span>
            {error.status === 401 && <Link to="/login">Sign in</Link>}
          </div>
        )}

        <form className="ai-composer" onSubmit={(e) => { e.preventDefault(); ask(); }}>
          {photo && (
            <span className="ai-photo-chip"><img src={photo.preview} alt="Selected photo" /><button type="button" aria-label="Remove photo" onClick={() => setPhoto(null)}><X size={12} /></button></span>
          )}
          <label className="ai-attach" title="Add a photo">
            <ImagePlus size={18} /><span className="sr-only">Add a photo</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />
          </label>
          <textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)} maxLength={4000}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
            placeholder={lang === 'hi' ? 'अपना सवाल लिखें…' : needsPhoto ? 'Add a photo, and any details (where you saw it, size)…' : 'Ask PestKill AI…'} aria-label="Your question" />
          <button type="submit" className="ai-send" disabled={busy || (!input.trim() && !photo) || (needsPhoto && !photo && !offline)} aria-label="Send"><Send size={17} /></button>
        </form>
      </div>
    </div>
  );
};

export default AiChat;
