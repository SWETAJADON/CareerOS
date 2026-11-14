import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


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

  if (loading) return <div className="grid min-h-[55vh] place-items-center text-[13px] text-[#7c879b]">Loading your applications...</div>;

  return <main className="min-h-screen bg-[#f6f7fb] px-[clamp(13px,3.4vw,52px)] py-5 pb-14 text-[#172033] sm:py-9">
    <header className="mx-auto mb-[27px] flex max-w-[1500px] flex-col items-start justify-between gap-5 min-[601px]:flex-row min-[601px]:items-center">
      <div><div className="mb-[9px] text-[10px] font-extrabold tracking-[1.5px] text-[#6558e8]">CAREEROS / CAREER MANAGEMENT</div><h1 className="text-[27px] font-extrabold tracking-[-1px] text-[#151d31] sm:text-[35px]">Job Tracker</h1>
        <p className="mt-2 max-w-[650px] text-xs leading-relaxed text-[#8490a3]">Keep every opportunity organized, from your first application to your final offer.</p></div>
      <div className="flex w-full shrink-0 gap-[9px] min-[601px]:w-auto">
        <button className="inline-flex min-h-[41px] items-center justify-center gap-[7px] rounded-[9px] border border-[#e0e4ec] bg-white px-4 text-[11px] font-bold text-[#4d5870] transition hover:border-[#c8c2ff] hover:bg-[#faf9ff] max-[600px]:flex-1" onClick={() => navigate("/dashboard")}>← Dashboard</button>
        <button className="inline-flex min-h-[41px] items-center justify-center gap-[7px] rounded-[9px] border border-[#6558e8] bg-[#6558e8] px-4 text-[11px] font-bold text-white shadow-[0_5px_13px_rgba(101,88,232,0.17)] transition hover:-translate-y-px hover:bg-[#5144d6] disabled:cursor-wait disabled:opacity-60 min-[601px]:w-auto max-[600px]:flex-1" onClick={startAdd}>＋ Add application</button>
      </div>
    </header>

    {message && <div className="mx-auto mb-[17px] flex max-w-[1500px] items-center justify-between rounded-[9px] border border-[#dcd8ff] bg-[#f2f0ff] px-[15px] py-3 text-xs font-semibold text-[#5144bd]" role="status">{message}<button className="ml-3 border-0 bg-transparent text-xl text-[#5144bd]" onClick={() => setMessage("")}>×</button></div>}

    <section className="mx-auto mb-[22px] grid max-w-[1500px] grid-cols-2 gap-[9px] min-[901px]:grid-cols-4 min-[901px]:gap-[14px]">
      <article className="flex items-center gap-2.5 rounded-[13px] border border-[#e8eaf1] bg-white p-3 shadow-[0_7px_22px_rgba(24,34,58,0.035)] min-[601px]:gap-[13px] min-[601px]:p-[18px]"><span className="grid h-[35px] w-[35px] flex-none place-items-center rounded-[11px] bg-[#f0efff] text-lg font-extrabold text-[#6558e8] min-[601px]:h-[42px] min-[601px]:w-[42px]">▤</span><div><small className="block text-[10px] text-[#7d879a]">Total applications</small><strong className="my-1 block text-[21px] font-extrabold text-[#202941] min-[601px]:text-[25px]">{stats.total}</strong><em className="block text-[9px] not-italic text-[#a0a7b5]">All tracked opportunities</em></div></article>
      <article className="flex items-center gap-2.5 rounded-[13px] border border-[#e8eaf1] bg-white p-3 shadow-[0_7px_22px_rgba(24,34,58,0.035)] min-[601px]:gap-[13px] min-[601px]:p-[18px]"><span className="grid h-[35px] w-[35px] flex-none place-items-center rounded-[11px] bg-[#edf5ff] text-lg font-extrabold text-[#3979d8] min-[601px]:h-[42px] min-[601px]:w-[42px]">➤</span><div><small className="block text-[10px] text-[#7d879a]">Applied</small><strong className="my-1 block text-[21px] font-extrabold text-[#202941] min-[601px]:text-[25px]">{stats.applied}</strong><em className="block text-[9px] not-italic text-[#a0a7b5]">Waiting for a response</em></div></article>
      <article className="flex items-center gap-2.5 rounded-[13px] border border-[#e8eaf1] bg-white p-3 shadow-[0_7px_22px_rgba(24,34,58,0.035)] min-[601px]:gap-[13px] min-[601px]:p-[18px]"><span className="grid h-[35px] w-[35px] flex-none place-items-center rounded-[11px] bg-[#fff5e7] text-lg font-extrabold text-[#c98424] min-[601px]:h-[42px] min-[601px]:w-[42px]">▣</span><div><small className="block text-[10px] text-[#7d879a]">Interviews</small><strong className="my-1 block text-[21px] font-extrabold text-[#202941] min-[601px]:text-[25px]">{stats.interviews}</strong><em className="block text-[9px] not-italic text-[#a0a7b5]">Interview stage</em></div></article>
      <article className="flex items-center gap-2.5 rounded-[13px] border border-[#e8eaf1] bg-white p-3 shadow-[0_7px_22px_rgba(24,34,58,0.035)] min-[601px]:gap-[13px] min-[601px]:p-[18px]"><span className="grid h-[35px] w-[35px] flex-none place-items-center rounded-[11px] bg-[#eaf8f1] text-lg font-extrabold text-[#16845d] min-[601px]:h-[42px] min-[601px]:w-[42px]">✓</span><div><small className="block text-[10px] text-[#7d879a]">Offers</small><strong className="my-1 block text-[21px] font-extrabold text-[#202941] min-[601px]:text-[25px]">{stats.offers}</strong><em className="block text-[9px] not-italic text-[#a0a7b5]">Offers received</em></div></article>
    </section>

    <section className="mx-auto max-w-[1500px] rounded-[15px] border border-[#e7eaf1] bg-white p-[15px] shadow-[0_9px_28px_rgba(24,34,58,0.04)] sm:p-[23px]">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-[17px] font-extrabold text-[#202941]">Your applications</h2><p className="mt-2 text-xs leading-relaxed text-[#8490a3]">Review and update the progress of your job search.</p></div><span className="rounded-full bg-[#f3f2ff] px-2.5 py-1.5 text-[10px] font-bold text-[#6256d9]">{visible.length} records</span></div>
      <div className="my-5 flex flex-col gap-2.5 min-[601px]:flex-row">
        <input className="min-h-[41px] min-w-0 flex-1 rounded-[9px] border border-[#e3e6ee] px-3 text-[11px] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" value={search} onChange={e => setSearch(e.target.value)} placeholder="⌕  Search company, role or location..." aria-label="Search applications"/>
        <select className="min-h-[40px] rounded-[9px] border border-[#e3e6ee] bg-white px-[11px] text-[10px] text-[#58647a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter by status">
          <option value="All">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {visible.length === 0 ? <div className="px-4 py-12 text-center"><div className="mx-auto mb-[13px] grid h-[50px] w-[50px] place-items-center rounded-[14px] bg-[#f1efff] text-[22px] text-[#6558e8]">▤</div>
        <h3 className="text-[15px] font-extrabold text-[#28324a]">{items.length ? "No matching applications" : "Start tracking your applications"}</h3>
        <p className="mx-auto my-2 max-w-[390px] text-[11px] leading-relaxed text-[#8993a5]">{items.length ? "Try another search term or change the status filter." : "Add the jobs you have applied for and keep your search organized in one place."}</p>
        {!items.length && <button className="inline-flex min-h-[41px] items-center justify-center gap-[7px] rounded-[9px] border border-[#6558e8] bg-[#6558e8] px-4 text-[11px] font-bold text-white shadow-[0_5px_13px_rgba(101,88,232,0.17)] transition hover:-translate-y-px hover:bg-[#5144d6] disabled:cursor-wait disabled:opacity-60 min-[601px]:w-auto max-[600px]:flex-1" onClick={startAdd}>＋ Add your first application</button>}
      </div> : <div className="w-full overflow-x-auto"><table className="w-full border-collapse whitespace-nowrap">
        <thead><tr><th className="border-b border-[#edf0f5] bg-[#fafbfe] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-[0.6px] text-[#8993a5]">Company & role</th><th className="border-b border-[#edf0f5] bg-[#fafbfe] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-[0.6px] text-[#8993a5]">Location</th><th className="border-b border-[#edf0f5] bg-[#fafbfe] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-[0.6px] text-[#8993a5]">Applied on</th><th className="border-b border-[#edf0f5] bg-[#fafbfe] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-[0.6px] text-[#8993a5]">Status</th><th className="border-b border-[#edf0f5] bg-[#fafbfe] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-[0.6px] text-[#8993a5]">Update status</th><th className="border-b border-[#edf0f5] bg-[#fafbfe] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-[0.6px] text-[#8993a5]">Actions</th></tr></thead>
        <tbody>{visible.map(x => <tr key={x._id}>
          <td className="border-b border-[#f0f2f6] px-3 py-[13px] text-[10px] text-[#657087]"><div className="flex min-w-[180px] items-center gap-2.5"><b className="grid h-[35px] w-[35px] flex-none place-items-center rounded-[10px] border border-[#e5e2ff] bg-[#f1efff] text-[13px] font-extrabold text-[#5d51d4]">{(x.companyName || "C").charAt(0).toUpperCase()}</b><div><strong className="block text-[11px] text-[#29334a]">{x.companyName}</strong><span className="mt-[3px] block text-[10px] text-[#6f7a8e]">{x.jobTitle}</span><small className="mt-[3px] block text-[9px] text-[#a0a7b5]">{x.jobType}</small></div></div></td>
          <td className="border-b border-[#f0f2f6] px-3 py-[13px] text-[10px] text-[#657087]">{x.location || "—"}</td><td className="border-b border-[#f0f2f6] px-3 py-[13px] text-[10px] text-[#657087]">{dateText(x.applicationDate)}</td>
          <td className="border-b border-[#f0f2f6] px-3 py-[13px] text-[10px] text-[#657087]"><span className={`inline-flex rounded-full px-[9px] py-[5px] text-[9px] font-extrabold ${({"Applied":"bg-[#edf4ff] text-[#3975cb]","Shortlisted":"bg-[#f2efff] text-[#6654d6]","Interview":"bg-[#fff5e7] text-[#b8791d]","Offered":"bg-[#eaf8f1] text-[#16845d]","Rejected":"bg-[#fff0f2] text-[#cf4b60]","Withdrawn":"bg-[#f0f1f4] text-[#737d8e]"})[x.status] || "bg-slate-100 text-slate-600"}`}>{x.status}</span></td>
          <td className="border-b border-[#f0f2f6] px-3 py-[13px] text-[10px] text-[#657087]"><select className="min-h-[30px] max-w-[125px] rounded-[9px] border border-[#e3e6ee] bg-white px-1.5 text-[9px] text-[#58647a]" value={x.status} onChange={e => changeStatus(x, e.target.value)} aria-label={`Update ${x.companyName} status`}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td>
          <td className="border-b border-[#f0f2f6] px-3 py-[13px] text-[10px] text-[#657087]"><div className="flex gap-[5px]">{x.jobLink && <a className="grid h-[29px] w-[29px] place-items-center rounded-lg border border-[#e8eaf1] bg-white text-[13px] text-[#647087] no-underline hover:border-[#c9c4ff] hover:bg-[#f7f6ff] hover:text-[#5c50d4]" href={x.jobLink} target="_blank" rel="noreferrer" title="Open job link">↗</a>}<button className="grid h-[29px] w-[29px] place-items-center rounded-lg border border-[#e8eaf1] bg-white text-[13px] text-[#647087] hover:border-[#c9c4ff] hover:bg-[#f7f6ff] hover:text-[#5c50d4]" onClick={() => startEdit(x)} title="Edit">✎</button><button className="grid h-[29px] w-[29px] place-items-center rounded-lg border border-[#e8eaf1] bg-white text-[13px] text-[#647087] hover:border-[#ffd9df] hover:bg-[#fff2f4] hover:text-[#cf4b60]" onClick={() => remove(x._id)} title="Delete">⌫</button></div></td>
        </tr>)}</tbody>
      </table></div>}
    </section>

    {modal && <div className="fixed inset-0 z-[1000] grid place-items-center overflow-auto bg-[#12182b]/55 p-[18px] backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}>
      <section className="max-h-[92vh] w-full max-w-[720px] overflow-auto rounded-[17px] border border-white/70 bg-white p-[18px] shadow-[0_25px_80px_rgba(12,18,38,0.25)] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="jt-modal-title">
        <div className="mb-5 flex justify-between gap-[15px]"><div><div className="mb-[9px] text-[10px] font-extrabold tracking-[1.5px] text-[#6558e8]">CAREEROS / APPLICATION DETAILS</div>
          <h2 className="text-xl font-extrabold text-[#202941]" id="jt-modal-title">{editId ? "Edit application" : "Add new application"}</h2><p className="mt-1.5 text-[11px] text-[#8490a3]">Enter the details of this opportunity.</p></div>
          <button className="h-8 w-8 flex-none rounded-lg border border-[#e7eaf1] bg-white text-xl text-[#69748a] hover:bg-slate-50" type="button" onClick={() => setModal(false)}>×</button></div>
        <form onSubmit={submit}><div className="grid grid-cols-1 gap-[13px] min-[601px]:grid-cols-2">
          <label className="block min-w-0 text-[10px] font-bold text-[#4d5870]">Company name *<input className="mt-[7px] block min-h-[39px] w-full rounded-lg border border-[#e1e5ed] bg-white px-2.5 py-[9px] text-[11px] text-[#29334a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" name="companyName" value={form.companyName} onChange={change} required maxLength="120" placeholder="e.g. TCS"/></label>
          <label className="block min-w-0 text-[10px] font-bold text-[#4d5870]">Job title *<input className="mt-[7px] block min-h-[39px] w-full rounded-lg border border-[#e1e5ed] bg-white px-2.5 py-[9px] text-[11px] text-[#29334a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" name="jobTitle" value={form.jobTitle} onChange={change} required maxLength="120" placeholder="e.g. Software Developer"/></label>
          <label className="block min-w-0 text-[10px] font-bold text-[#4d5870]">Job type<select className="mt-[7px] block min-h-[39px] w-full rounded-lg border border-[#e1e5ed] bg-white px-2.5 py-[9px] text-[11px] text-[#29334a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" name="jobType" value={form.jobType} onChange={change}>{["Full Time","Part Time","Internship","Remote","Contract"].map(s => <option key={s}>{s}</option>)}</select></label>
          <label className="block min-w-0 text-[10px] font-bold text-[#4d5870]">Location<input className="mt-[7px] block min-h-[39px] w-full rounded-lg border border-[#e1e5ed] bg-white px-2.5 py-[9px] text-[11px] text-[#29334a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" name="location" value={form.location} onChange={change} placeholder="e.g. Ahmedabad / Remote"/></label>
          <label className="block min-w-0 text-[10px] font-bold text-[#4d5870]">Salary / stipend<input className="mt-[7px] block min-h-[39px] w-full rounded-lg border border-[#e1e5ed] bg-white px-2.5 py-[9px] text-[11px] text-[#29334a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" name="salary" value={form.salary} onChange={change} placeholder="e.g. 15000 per month"/></label>
          <label className="block min-w-0 text-[10px] font-bold text-[#4d5870]">Application date<input className="mt-[7px] block min-h-[39px] w-full rounded-lg border border-[#e1e5ed] bg-white px-2.5 py-[9px] text-[11px] text-[#29334a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" type="date" name="applicationDate" value={form.applicationDate} onChange={change}/></label>
          <label className="block min-w-0 text-[10px] font-bold text-[#4d5870]">Status<select className="mt-[7px] block min-h-[39px] w-full rounded-lg border border-[#e1e5ed] bg-white px-2.5 py-[9px] text-[11px] text-[#29334a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" name="status" value={form.status} onChange={change}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
          <label className="block min-w-0 text-[10px] font-bold text-[#4d5870]">Interview date<input className="mt-[7px] block min-h-[39px] w-full rounded-lg border border-[#e1e5ed] bg-white px-2.5 py-[9px] text-[11px] text-[#29334a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" type="date" name="interviewDate" value={form.interviewDate || ""} onChange={change}/></label>
          <label className="col-span-1 block min-w-0 text-[10px] font-bold text-[#4d5870] min-[601px]:col-span-2">Job posting URL<input className="mt-[7px] block min-h-[39px] w-full rounded-lg border border-[#e1e5ed] bg-white px-2.5 py-[9px] text-[11px] text-[#29334a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" type="url" name="jobLink" value={form.jobLink} onChange={change} placeholder="https://company.com/careers"/></label>
          <label className="col-span-1 block min-w-0 text-[10px] font-bold text-[#4d5870] min-[601px]:col-span-2">Job description<textarea className="mt-[7px] block min-h-[39px] w-full rounded-lg border border-[#e1e5ed] bg-white px-2.5 py-[9px] text-[11px] text-[#29334a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" name="jobDescription" rows="3" value={form.jobDescription} onChange={change} placeholder="Paste a short job description (optional)"/></label>
          <label className="col-span-1 block min-w-0 text-[10px] font-bold text-[#4d5870] min-[601px]:col-span-2">Notes<textarea className="mt-[7px] block min-h-[39px] w-full rounded-lg border border-[#e1e5ed] bg-white px-2.5 py-[9px] text-[11px] text-[#29334a] outline-none focus:border-[#9389f2] focus:ring-[3px] focus:ring-[#6558e8]/10" name="notes" rows="3" value={form.notes} onChange={change} placeholder="Recruiter contact, follow-up reminders, interview notes..."/></label>
        </div><div className="mt-[18px] flex flex-col-reverse justify-end gap-[9px] border-t border-[#edf0f5] pt-[18px] min-[601px]:flex-row"><button type="button" className="inline-flex min-h-[41px] items-center justify-center gap-[7px] rounded-[9px] border border-[#e0e4ec] bg-white px-4 text-[11px] font-bold text-[#4d5870] transition hover:border-[#c8c2ff] hover:bg-[#faf9ff] max-[600px]:flex-1" onClick={() => setModal(false)}>Cancel</button>
          <button className="inline-flex min-h-[41px] items-center justify-center gap-[7px] rounded-[9px] border border-[#6558e8] bg-[#6558e8] px-4 text-[11px] font-bold text-white shadow-[0_5px_13px_rgba(101,88,232,0.17)] transition hover:-translate-y-px hover:bg-[#5144d6] disabled:cursor-wait disabled:opacity-60 min-[601px]:w-auto max-[600px]:flex-1" type="submit" disabled={busy}>{busy ? "Saving..." : editId ? "Save changes" : "Add application"}</button></div></form>
      </section>
    </div>}
  </main>;
}
