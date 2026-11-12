import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./JobTracker.css";

const API = "http://localhost:5000/api/job-applications";
const statuses = ["Applied", "Shortlisted", "Interview", "Offered", "Rejected", "Withdrawn"];
const blank = () => ({
  companyName: "", jobTitle: "", jobType: "Full Time", location: "", salary: "",
  applicationDate: new Date().toISOString().slice(0, 10), status: "Applied",
  jobDescription: "", jobLink: "", notes: "", interviewDate: ""
});
const dateText = (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function JobTracker() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(blank());

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(API, { headers });
      setItems(data.applications || []);
    } catch (e) {
      setMessage(e.response?.data?.message || "Unable to load applications.");
      if (e.response?.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        navigate("/login");
      }
    } finally { setLoading(false); }
  }, [headers, navigate]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    load();
  }, [token, navigate, load]);

  const stats = useMemo(() => ({
    total: items.length,
    applied: items.filter(x => x.status === "Applied").length,
    interviews: items.filter(x => x.status === "Interview").length,
    offers: items.filter(x => x.status === "Offered").length
  }), [items]);

  const visible = useMemo(() => items.filter(x => {
    const q = search.trim().toLowerCase();
    const matches = !q || [x.companyName, x.jobTitle, x.location, x.jobType].some(v => (v || "").toLowerCase().includes(q));
    return matches && (filter === "All" || x.status === filter);
  }), [items, search, filter]);

  const startAdd = () => { setEditId(null); setForm(blank()); setModal(true); setMessage(""); };
  const startEdit = (x) => {
    setEditId(x._id);
    setForm({ ...blank(), ...x,
      applicationDate: x.applicationDate ? new Date(x.applicationDate).toISOString().slice(0, 10) : "",
      interviewDate: x.interviewDate ? new Date(x.interviewDate).toISOString().slice(0, 10) : ""
    });
    setModal(true); setMessage("");
  };
  const change = e => setForm(old => ({ ...old, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const payload = { ...form, interviewDate: form.interviewDate || null };
      if (editId) {
        await axios.put(`${API}/${editId}`, payload, { headers });
        setMessage("Application updated successfully.");
      } else {
        await axios.post(API, payload, { headers });
        setMessage("Application added successfully.");
      }
      setModal(false); setEditId(null); setForm(blank()); await load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to save application.");
    } finally { setBusy(false); }
  };

  const remove = async id => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await axios.delete(`${API}/${id}`, { headers });
      setItems(old => old.filter(x => x._id !== id));
      setMessage("Application deleted successfully.");
    } catch (e) { setMessage(e.response?.data?.message || "Unable to delete application."); }
  };

  const changeStatus = async (item, status) => {
    try {
      const { data } = await axios.put(`${API}/${item._id}`, { status }, { headers });
      setItems(old => old.map(x => x._id === item._id ? data.application : x));
      setMessage("Application status updated.");
    } catch (e) { setMessage(e.response?.data?.message || "Unable to update status."); }
  };

  if (loading) return <div className="jt-loading">Loading your applications...</div>;

  return <main className="job-tracker-page">
    <header className="jt-header">
      <div><div className="jt-eyebrow">CAREEROS / CAREER MANAGEMENT</div><h1>Job Tracker</h1>
        <p>Keep every opportunity organized, from your first application to your final offer.</p></div>
      <div className="jt-header-actions">
        <button className="jt-secondary" onClick={() => navigate("/dashboard")}>← Dashboard</button>
        <button className="jt-primary" onClick={startAdd}>＋ Add application</button>
      </div>
    </header>

    {message && <div className="jt-message" role="status">{message}<button onClick={() => setMessage("")}>×</button></div>}

    <section className="jt-stats">
      <article><span className="jt-stat-icon purple">▤</span><div><small>Total applications</small><strong>{stats.total}</strong><em>All tracked opportunities</em></div></article>
      <article><span className="jt-stat-icon blue">➤</span><div><small>Applied</small><strong>{stats.applied}</strong><em>Waiting for a response</em></div></article>
      <article><span className="jt-stat-icon amber">▣</span><div><small>Interviews</small><strong>{stats.interviews}</strong><em>Interview stage</em></div></article>
      <article><span className="jt-stat-icon green">✓</span><div><small>Offers</small><strong>{stats.offers}</strong><em>Offers received</em></div></article>
    </section>

    <section className="jt-panel">
      <div className="jt-panel-heading"><div><h2>Your applications</h2><p>Review and update the progress of your job search.</p></div><span>{visible.length} records</span></div>
      <div className="jt-toolbar">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="⌕  Search company, role or location..." aria-label="Search applications"/>
        <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter by status">
          <option value="All">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {visible.length === 0 ? <div className="jt-empty"><div>▤</div>
        <h3>{items.length ? "No matching applications" : "Start tracking your applications"}</h3>
        <p>{items.length ? "Try another search term or change the status filter." : "Add the jobs you have applied for and keep your search organized in one place."}</p>
        {!items.length && <button className="jt-primary" onClick={startAdd}>＋ Add your first application</button>}
      </div> : <div className="jt-table-scroll"><table className="jt-table">
        <thead><tr><th>Company & role</th><th>Location</th><th>Applied on</th><th>Status</th><th>Update status</th><th>Actions</th></tr></thead>
        <tbody>{visible.map(x => <tr key={x._id}>
          <td><div className="jt-company"><b>{(x.companyName || "C").charAt(0).toUpperCase()}</b><div><strong>{x.companyName}</strong><span>{x.jobTitle}</span><small>{x.jobType}</small></div></div></td>
          <td>{x.location || "—"}</td><td>{dateText(x.applicationDate)}</td>
          <td><span className={`jt-badge ${x.status.toLowerCase()}`}>{x.status}</span></td>
          <td><select className="jt-status-select" value={x.status} onChange={e => changeStatus(x, e.target.value)} aria-label={`Update ${x.companyName} status`}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td>
          <td><div className="jt-actions">{x.jobLink && <a href={x.jobLink} target="_blank" rel="noreferrer" title="Open job link">↗</a>}<button onClick={() => startEdit(x)} title="Edit">✎</button><button className="delete" onClick={() => remove(x._id)} title="Delete">⌫</button></div></td>
        </tr>)}</tbody>
      </table></div>}
    </section>

    {modal && <div className="jt-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}>
      <section className="jt-modal" role="dialog" aria-modal="true" aria-labelledby="jt-modal-title">
        <div className="jt-modal-head"><div><div className="jt-eyebrow">CAREEROS / APPLICATION DETAILS</div>
          <h2 id="jt-modal-title">{editId ? "Edit application" : "Add new application"}</h2><p>Enter the details of this opportunity.</p></div>
          <button className="jt-close" type="button" onClick={() => setModal(false)}>×</button></div>
        <form onSubmit={submit}><div className="jt-form-grid">
          <label>Company name *<input name="companyName" value={form.companyName} onChange={change} required maxLength="120" placeholder="e.g. TCS"/></label>
          <label>Job title *<input name="jobTitle" value={form.jobTitle} onChange={change} required maxLength="120" placeholder="e.g. Software Developer"/></label>
          <label>Job type<select name="jobType" value={form.jobType} onChange={change}>{["Full Time","Part Time","Internship","Remote","Contract"].map(s => <option key={s}>{s}</option>)}</select></label>
          <label>Location<input name="location" value={form.location} onChange={change} placeholder="e.g. Ahmedabad / Remote"/></label>
          <label>Salary / stipend<input name="salary" value={form.salary} onChange={change} placeholder="e.g. 15000 per month"/></label>
          <label>Application date<input type="date" name="applicationDate" value={form.applicationDate} onChange={change}/></label>
          <label>Status<select name="status" value={form.status} onChange={change}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
          <label>Interview date<input type="date" name="interviewDate" value={form.interviewDate || ""} onChange={change}/></label>
          <label className="full">Job posting URL<input type="url" name="jobLink" value={form.jobLink} onChange={change} placeholder="https://company.com/careers"/></label>
          <label className="full">Job description<textarea name="jobDescription" rows="3" value={form.jobDescription} onChange={change} placeholder="Paste a short job description (optional)"/></label>
          <label className="full">Notes<textarea name="notes" rows="3" value={form.notes} onChange={change} placeholder="Recruiter contact, follow-up reminders, interview notes..."/></label>
        </div><div className="jt-modal-actions"><button type="button" className="jt-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="jt-primary" type="submit" disabled={busy}>{busy ? "Saving..." : editId ? "Save changes" : "Add application"}</button></div></form>
      </section>
    </div>}
  </main>;
}
