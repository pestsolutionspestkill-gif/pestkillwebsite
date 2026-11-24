import { useEffect, useState } from 'react';
import { Camera, Trash2, Images } from 'lucide-react';
import { api } from '../../lib/api';
import { resizeImage } from './Shop';

// Before/after proof photos for a job. The customer sees them in "Service proof" on their dashboard.
const JobPhotos = ({ jobId, notify }) => {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (open && photos === null) api(`/jobs/${jobId}/photos`).then(setPhotos).catch((e) => { notify(e.message, 'error'); setPhotos([]); });
  }, [open, photos, jobId, notify]);

  const upload = async (kind, files) => {
    const list = [...(files || [])].slice(0, 4);
    if (!list.length) return;
    setBusy(kind);
    try {
      for (const file of list) {
        const dataUrl = await resizeImage(file);
        const p = await api(`/jobs/${jobId}/photos`, { method: 'POST', body: { kind, dataUrl } });
        setPhotos((rows) => [...(rows || []), p]);
      }
      notify(`${kind === 'before' ? 'Before' : 'After'} photo saved`);
    } catch (e) { notify(e.message, 'error'); }
    setBusy('');
  };
  const remove = async (p) => {
    try { await api(`/jobs/${jobId}/photos/${p.id}`, { method: 'DELETE' }); setPhotos((rows) => rows.filter((x) => x.id !== p.id)); } catch (e) { notify(e.message, 'error'); }
  };

  if (!open) return <button type="button" className="btn btn-sm btn-outline job-photo-toggle" onClick={() => setOpen(true)}><Images size={14} /> Proof photos</button>;
  return (
    <div className="job-photos">
      <p className="adm-muted">Photos are shown to the customer as proof of service. Take one before and one after treating.</p>
      {['before', 'after'].map((kind) => (
        <div key={kind} className="job-photo-row">
          <strong>{kind === 'before' ? 'Before' : 'After'}</strong>
          <div className="job-photo-list">
            {(photos || []).filter((p) => p.kind === kind).map((p) => (
              <span key={p.id} className="job-photo"><img src={p.url} alt={`${kind} treatment`} /><button type="button" onClick={() => remove(p)} aria-label="Remove photo"><Trash2 size={12} /></button></span>
            ))}
            <label className={`job-photo-add ${busy === kind ? 'busy' : ''}`}>
              <Camera size={18} /><span>{busy === kind ? 'Saving…' : 'Add'}</span>
              <input type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => upload(kind, e.target.files)} disabled={Boolean(busy)} />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobPhotos;
