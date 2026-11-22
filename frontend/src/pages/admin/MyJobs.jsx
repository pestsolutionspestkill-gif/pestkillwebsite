import { useState } from 'react';
import { Phone, MapPin, Clock, Navigation, CheckCircle, Play } from 'lucide-react';
import { api } from '../../lib/api';
import { useLoad, State, Badge, fmtDate } from './shared';

const JobCard = ({ job, onSaved, notify }) => {
  const [notes, setNotes] = useState(job.completion_notes || '');
  const [chem, setChem] = useState(job.chemicals_used || '');
  const [busy, setBusy] = useState(false);
  const done = job.status === 'completed';

  const save = async (body, msg) => {
    setBusy(true);
    try { onSaved(await api(`/jobs/${job.id}`, { method: 'PATCH', body })); notify(msg); } catch (e) { notify(e.message, 'error'); }
    setBusy(false);
  };
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([job.address, job.city].filter(Boolean).join(', '))}`;

  return (
    <article className={`job-card ${done ? 'done' : ''}`}>
      <header>
        <div>
          <span className="mono">{job.ref}</span>
          <h3>{job.service || 'Inspection'}</h3>
          <p className="job-when"><Clock size={14} /> {job.scheduled_at ? fmtDate(job.scheduled_at) : `${job.preferred_date || ''} ${job.preferred_slot || ''}`}</p>
        </div>
        <Badge value={job.status} />
      </header>
      <dl className="job-facts">
        <div><dt>Customer</dt><dd>{job.name}</dd></div>
        <div><dt>Property</dt><dd>{job.property || '—'}</dd></div>
        <div><dt>Address</dt><dd>{[job.address, job.city].filter(Boolean).join(', ') || '—'}</dd></div>
        {job.message && <div><dt>Customer note</dt><dd className="pre">{job.message}</dd></div>}
        {job.internal_notes && <div><dt>Office note</dt><dd className="pre">{job.internal_notes}</dd></div>}
      </dl>
      <div className="job-actions">
        <a className="btn btn-sm btn-navy" href={`tel:${job.phone}`}><Phone size={14} /> Call</a>
        <a className="btn btn-sm btn-outline" href={maps} target="_blank" rel="noopener noreferrer"><Navigation size={14} /> Directions</a>
        {job.status === 'scheduled' && <button type="button" className="btn btn-sm btn-outline" disabled={busy} onClick={() => save({ status: 'in_progress' }, 'Job started')}><Play size={14} /> Start job</button>}
      </div>
      {!done ? (
        <div className="job-report">
          <label>Visit report<textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Areas treated, infestation level, advice given…" /></label>
          <label>Chemicals used<input value={chem} onChange={(e) => setChem(e.target.value)} placeholder="e.g. Fipronil 0.05% gel" /></label>
          <div className="job-report-actions">
            <button type="button" className="btn btn-sm btn-outline" disabled={busy} onClick={() => save({ completionNotes: notes, chemicalsUsed: chem }, 'Report saved')}>Save report</button>
            <button type="button" className="btn btn-sm btn-primary" disabled={busy || !notes.trim()} onClick={() => save({ status: 'completed', completionNotes: notes, chemicalsUsed: chem }, 'Job completed')}><CheckCircle size={14} /> Mark completed</button>
          </div>
        </div>
      ) : (
        <p className="job-done-note"><CheckCircle size={15} /> Completed {fmtDate(job.completed_at)} · {job.chemicals_used || 'no chemicals noted'}</p>
      )}
      <a className="job-map-link" href={maps} target="_blank" rel="noopener noreferrer"><MapPin size={13} /> Open in Google Maps</a>
    </article>
  );
};

const MyJobs = ({ notify }) => {
  const { data, setData, error, loading } = useLoad('/jobs/mine');
  const update = (job) => setData((rows) => rows.map((r) => (r.id === job.id ? job : r)));
  const open = (data || []).filter((j) => j.status !== 'completed');
  const done = (data || []).filter((j) => j.status === 'completed');
  return (
    <State loading={loading} error={error} empty={data?.length === 0 && 'No jobs assigned to you right now.'}>
      {open.length > 0 && <h3 className="group-title">Upcoming & in progress · {open.length}</h3>}
      <div className="job-grid">{open.map((j) => <JobCard key={j.id} job={j} onSaved={update} notify={notify} />)}</div>
      {done.length > 0 && <h3 className="group-title">Completed in the last 14 days · {done.length}</h3>}
      <div className="job-grid">{done.map((j) => <JobCard key={j.id} job={j} onSaved={update} notify={notify} />)}</div>
    </State>
  );
};

export default MyJobs;
