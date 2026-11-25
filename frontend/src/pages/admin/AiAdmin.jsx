// PestKill AI inside the staff console: field assistant (technicians, managers, owner) and business
// insights (owner, managers with reports access). Read-only suggestions; staff make every decision.
import { useEffect, useState } from 'react';
import { Wrench, BarChart3, MessageSquareText } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import AiChat from '../../components/ai/AiChat';
import { useLoad, State } from './shared';

const MODES = [
  { key: 'field', label: 'Field assistant', icon: Wrench, note: 'Checklists, visit reports from your notes, documents. Uses only your assigned jobs.' },
  { key: 'insights', label: 'Business insights', icon: BarChart3, note: 'Leads to follow up, workload, complaints, stock and payments. Read-only.' },
  { key: 'assistant', label: 'General', icon: MessageSquareText, note: 'Same assistant customers use.' },
];

const Overview = () => {
  const { data, error, loading } = useLoad('/ai/admin/overview');
  return (
    <State loading={loading && !data} error={error}>
      {data && (
        <section className="panel ai-overview">
          <h3>PestKill AI: last 30 days</h3>
          <p className="adm-muted">Provider: {data.config.provider} · Model: {data.config.model} · {data.config.configured ? 'API key set on the server' : 'Not configured: add ANTHROPIC_API_KEY on the server to switch AI answers on'}</p>
          <div className="ai-kpis">
            <div><strong>{data.totals.calls}</strong><span>Requests</span></div>
            <div><strong>{data.totals.errors}</strong><span>Failed</span></div>
            <div><strong>{(data.totals.input_tokens + data.totals.output_tokens).toLocaleString('en-IN')}</strong><span>Tokens</span></div>
            <div><strong>{data.totals.avg_latency ? `${(data.totals.avg_latency / 1000).toFixed(1)} s` : '—'}</strong><span>Avg. response</span></div>
          </div>
          {data.byMode.length > 0 && <p className="adm-muted">By tool: {data.byMode.map((m) => `${m.mode} ${m.n}`).join(' · ')}</p>}
          {data.errors.length > 0 && <p className="adm-muted">Errors: {data.errors.map((e) => `${e.error} (${e.n})`).join(' · ')}</p>}
          <h4>Recent feedback</h4>
          {data.feedback.length === 0 ? <p className="adm-muted">No feedback yet.</p> : (
            <ul className="ai-fb">{data.feedback.map((f, i) => (
              <li key={i} className={f.rating > 0 ? 'up' : 'down'}><strong>{f.rating > 0 ? 'Helpful' : 'Not helpful'}</strong> · Q: {f.question?.slice(0, 140)}<small>A: {f.answer?.slice(0, 220)}…</small>{f.note && <small>Note: {f.note}</small>}</li>
            ))}</ul>
          )}
        </section>
      )}
    </State>
  );
};

const AiAdmin = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState('field');
  useEffect(() => { api('/ai/status').then(setStatus).catch(() => setStatus({ configured: false, modes: [] })); }, []);
  const allowed = MODES.filter((m) => status?.modes?.includes(m.key));
  const current = allowed.find((m) => m.key === mode) || allowed[0];
  return (
    <div className="ai-admin">
      {!status?.configured && status && <p className="adm-state">AI answers are off until <code>ANTHROPIC_API_KEY</code> is set on the server. Verified knowledge search still works below.</p>}
      <div className="toolbar">
        {allowed.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" className={`btn btn-sm ${current?.key === key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode(key)}><Icon size={14} /> {label}</button>
        ))}
        {current && <span className="toolbar-count">{current.note}</span>}
      </div>
      {current && <AiChat key={current.key} mode={current.key} status={status} compact />}
      {user?.role === 'owner' && <Overview />}
    </div>
  );
};

export default AiAdmin;
