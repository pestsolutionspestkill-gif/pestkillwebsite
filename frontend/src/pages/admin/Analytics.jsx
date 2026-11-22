import { useState } from 'react';
import { DailyBars, RankBars } from './Charts';
import { useLoad, State, inr, label } from './shared';

const RANGES = [7, 30, 90, 365];

const Analytics = () => {
  const [days, setDays] = useState(30);
  const { data, error, loading } = useLoad(`/admin/analytics?days=${days}`);

  return (
    <>
      <div className="toolbar">
        <div className="seg" role="tablist" aria-label="Date range">
          {RANGES.map((d) => (
            <button key={d} type="button" className={d === days ? 'active' : ''} onClick={() => setDays(d)}>
              {d === 365 ? '1 year' : `${d} days`}
            </button>
          ))}
        </div>
        {data?.scoped && <span className="toolbar-count">Showing bookings assigned to you</span>}
      </div>

      <State loading={loading && !data} error={error}>
        {data && (
          <div className="analytics">
            <div className="kpi-grid">
              <div className="kpi"><span>Requests</span><strong>{data.totals.total}</strong><small>{data.totals.bookings || 0} online bookings</small></div>
              <div className="kpi"><span>Completed</span><strong>{data.totals.completed || 0}</strong><small>{data.totals.conversion}% of requests</small></div>
              <div className="kpi"><span>Awaiting contact</span><strong>{data.totals.pending || 0}</strong><small>New or contacted</small></div>
              {data.finance
                ? <div className="kpi dark"><span>Collected</span><strong>{inr(data.finance.collected)}</strong><small>{inr(data.finance.outstanding)} outstanding</small></div>
                : <div className="kpi"><span>Cancelled</span><strong>{data.totals.cancelled || 0}</strong><small>In this period</small></div>}
            </div>

            <section className="panel"><DailyBars data={data.series} valueKey="leads" title="Requests per day" /></section>
            {data.finance && (
              <section className="panel"><DailyBars data={data.finance.series} valueKey="value" title="Invoiced per day" format={inr} color="#0B8A5F" /></section>
            )}

            <div className="adm-grid-3">
              <section className="panel"><RankBars title="By service" rows={data.byService} /></section>
              <section className="panel"><RankBars title="By city" rows={data.byCity} /></section>
              <section className="panel"><RankBars title="By source" rows={data.bySource.map((r) => ({ ...r, label: label(r.label) }))} /></section>
            </div>

            {data.workload && (
              <section className="panel">
                <header className="panel-head"><h3>Team workload</h3><small>Open jobs now · completed in this period</small></header>
                <div className="table-wrap flat">
                  <table className="adm-table static">
                    <thead><tr><th>Name</th><th>Role</th><th>Open</th><th>Completed</th></tr></thead>
                    <tbody>{data.workload.map((w) => (
                      <tr key={w.id}><td><strong>{w.name}</strong></td><td><span className={`role role-${w.role}`}>{label(w.role)}</span></td><td>{w.open}</td><td>{w.done}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </State>
    </>
  );
};

export default Analytics;
