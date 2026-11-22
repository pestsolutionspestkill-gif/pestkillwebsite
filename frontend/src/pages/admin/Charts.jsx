import { useMemo, useRef, useState } from 'react';

const niceMax = (v) => {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v / 4));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => v <= s * 4) || pow * 10;
  return step * 4;
};
const dayLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/**
 * Single-series column chart over days. Hover shows a tooltip; a table view
 * is always one click away (accessibility + exact values).
 */
export const DailyBars = ({ data, valueKey, title, format = (v) => v.toLocaleString('en-IN'), color = '#0E9F6E' }) => {
  const [hover, setHover] = useState(null);
  const [table, setTable] = useState(false);
  const ref = useRef(null);
  const W = 720; const H = 220; const padL = 36; const padB = 24; const padT = 8;
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d[valueKey]))), [data, valueKey]);
  const plotW = W - padL; const plotH = H - padB - padT;
  const slot = plotW / data.length;
  const barW = Math.max(3, Math.min(22, slot - 2));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const labelEvery = Math.ceil(data.length / 8);
  const total = data.reduce((s, d) => s + d[valueKey], 0);

  return (
    <figure className="chart">
      <figcaption className="chart-head">
        <span className="chart-title">{title}</span>
        <span className="chart-total">{format(total)} total</span>
        <button type="button" className="chart-toggle" onClick={() => setTable(!table)}>{table ? 'Show chart' : 'Show table'}</button>
      </figcaption>
      {table ? (
        <div className="chart-table" data-lenis-prevent>
          <table><thead><tr><th>Date</th><th>{title}</th></tr></thead>
            <tbody>{[...data].reverse().map((d) => <tr key={d.date}><td>{dayLabel(d.date)}</td><td>{format(d[valueKey])}</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="chart-plot" ref={ref} onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${format(total)} over ${data.length} days`}>
            {ticks.map((t) => {
              const y = padT + plotH - (t / max) * plotH;
              return (
                <g key={t}>
                  <line x1={padL} x2={W} y1={y} y2={y} stroke="#E8E8ED" strokeWidth="1" />
                  <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#8E8E93">{t.toLocaleString('en-IN')}</text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const v = d[valueKey];
              const h = v > 0 ? Math.max(2, (v / max) * plotH) : 0;
              const x = padL + i * slot + (slot - barW) / 2;
              const y = padT + plotH - h;
              const r = Math.min(4, barW / 2, h);
              return (
                <g key={d.date}>
                  {h > 0 && (
                    <path
                      d={`M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${y + h} Z`}
                      fill={color}
                      opacity={hover === null || hover === i ? 1 : 0.35}
                    />
                  )}
                  <rect x={padL + i * slot} y={padT} width={slot} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} />
                  {i % labelEvery === 0 && <text x={padL + i * slot + slot / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#8E8E93">{dayLabel(d.date)}</text>}
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div className="chart-tip" style={{ left: `${((padL + hover * slot + slot / 2) / W) * 100}%` }}>
              <span>{dayLabel(data[hover].date)}</span>
              <strong>{format(data[hover][valueKey])}</strong>
            </div>
          )}
        </div>
      )}
    </figure>
  );
};

/** Ranked horizontal bars — magnitude by category, single hue, value as text. */
export const RankBars = ({ title, rows, color = '#0E9F6E' }) => {
  const max = Math.max(1, ...rows.map((r) => r.n));
  const total = rows.reduce((s, r) => s + r.n, 0);
  return (
    <figure className="chart">
      <figcaption className="chart-head"><span className="chart-title">{title}</span></figcaption>
      {rows.length === 0 ? <p className="adm-muted">No data in this period.</p> : (
        <ul className="rank-list">
          {rows.map((r) => (
            <li key={r.label} title={`${r.label}: ${r.n} (${Math.round((r.n / total) * 100)}%)`}>
              <div className="rank-row"><span>{r.label}</span><strong>{r.n}</strong></div>
              <div className="rank-track"><span style={{ width: `${(r.n / max) * 100}%`, background: color }} /></div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
};
