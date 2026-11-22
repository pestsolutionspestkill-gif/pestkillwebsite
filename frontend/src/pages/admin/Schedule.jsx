import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, User, Clock } from 'lucide-react';
import { useLoad, State, Badge, parseDate } from './shared';

// Local calendar date (YYYY-MM-DD). toISOString() would use UTC and shift IST days back by one.
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };

const Schedule = ({ onOpen }) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);
  // Visits are stored in UTC; fetch a day either side and bucket by local day below.
  const { data, error, loading } = useLoad(`/admin/schedule?from=${iso(addDays(days[0], -1))}&to=${iso(addDays(days[6], 1))}`);
  const shift = (n) => { const d = new Date(weekStart); d.setDate(d.getDate() + n * 7); setWeekStart(d); };

  const byDay = useMemo(() => {
    const m = Object.fromEntries(days.map((d) => [iso(d), []]));
    (data || []).forEach((j) => {
      const key = j.scheduled_at ? iso(parseDate(j.scheduled_at)) : j.preferred_date;
      if (m[key]) m[key].push(j);
    });
    return m;
  }, [data, days]);

  const today = iso(new Date());
  return (
    <>
      <div className="toolbar">
        <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous week"><ChevronLeft size={18} /></button>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => setWeekStart(startOfWeek(new Date()))}>This week</button>
        <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next week"><ChevronRight size={18} /></button>
        <strong className="toolbar-title">
          {days[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {days[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </strong>
      </div>
      <State loading={loading && !data} error={error}>
        <div className="week">
          {days.map((d) => {
            const key = iso(d);
            const jobs = byDay[key] || [];
            return (
              <div key={key} className={`week-day ${key === today ? 'today' : ''}`}>
                <header><span>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span><strong>{d.getDate()}</strong></header>
                {jobs.length === 0 ? <p className="week-empty">No jobs</p> : jobs.map((j) => (
                  <button key={j.id} type="button" className={`week-job ${j.scheduled_at ? 'fixed' : 'requested'}`} onClick={() => onOpen?.(j)}>
                    <span className="week-time"><Clock size={12} /> {j.scheduled_at ? parseDate(j.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : (j.preferred_slot?.split(' ')[0] || 'Requested')}</span>
                    <strong>{j.service || 'Inspection'}</strong>
                    <span><User size={12} /> {j.name}</span>
                    {j.city && <span><MapPin size={12} /> {j.city}</span>}
                    <span className="week-tech">{j.technician_name ? `Tech: ${j.technician_name}` : 'No technician'}</span>
                    <Badge value={j.status} />
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        <p className="adm-muted legend-note"><span className="dot fixed" /> Scheduled visit <span className="dot requested" /> Customer's preferred date, not yet scheduled</p>
      </State>
    </>
  );
};

export default Schedule;
