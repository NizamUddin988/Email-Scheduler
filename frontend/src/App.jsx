import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate, Link } from "react-router-dom";
import api from "./api";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("email_scheduler_user") || "null");
  } catch {
    return null;
  }
}

function Protected({ children }) {
  return localStorage.getItem("email_scheduler_token")
    ? children
    : <Navigate to="/login" replace />;
}

function Layout({ children, user, onLogout }) {
  const location = window.location.pathname;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ES</div>
          <div>
            <strong>Email Scheduler</strong>
            <span>Reliable delivery</span>
          </div>
        </div>

        <nav>
          <Link className={location === "/" ? "active" : ""} to="/">Dashboard</Link>
          <Link className={location === "/compose" ? "active" : ""} to="/compose">Compose</Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button className="ghost-btn" onClick={onLogout}>Sign out</button>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}

function Auth({ mode = "login", onAuth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const register = mode === "register";

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = register ? "/auth/register" : "/auth/login";
      const { data } = await api.post(url, form);
      localStorage.setItem("email_scheduler_token", data.token);
      localStorage.setItem("email_scheduler_user", JSON.stringify(data.user));
      onAuth(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand centered">
          <div className="brand-mark">ES</div>
          <div>
            <strong>Email Scheduler</strong>
            <span>Assessment build</span>
          </div>
        </div>

        <h1>{register ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">{register ? "Start scheduling reliable emails." : "Sign in to your scheduler dashboard."}</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit}>
          {register && (
            <label>
              Full name
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your name" />
            </label>
          )}
          <label>
            Email
            <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input required type="password" minLength="8" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Minimum 8 characters" />
          </label>
          <button className="primary-btn full" disabled={loading}>{loading ? "Please wait..." : register ? "Create account" : "Sign in"}</button>
        </form>

        <p className="switch-auth">
          {register ? "Already have an account?" : "New here?"}{" "}
          <Link to={register ? "/login" : "/register"}>{register ? "Sign in" : "Create account"}</Link>
        </p>
      </div>
    </div>
  );
}

function Dashboard() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/emails");
      setEmails(data.emails);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load emails");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: emails.length,
    scheduled: emails.filter(e => e.status === "SCHEDULED").length,
    sent: emails.filter(e => e.status === "SENT").length,
    failed: emails.filter(e => e.status === "FAILED").length
  }), [emails]);

  async function cancel(id) {
    if (!confirm("Cancel this scheduled email?")) return;
    try {
      await api.delete(`/emails/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to cancel");
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <span className="eyebrow">Workspace</span>
          <h1>Dashboard</h1>
        </div>
        <div className="top-actions">
          <button className="secondary-btn" onClick={load}>Refresh</button>
          <Link className="primary-btn" to="/compose">+ Schedule email</Link>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      <section className="stats">
        <Stat label="Total" value={stats.total} />
        <Stat label="Scheduled" value={stats.scheduled} />
        <Stat label="Sent" value={stats.sent} />
        <Stat label="Failed" value={stats.failed} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Email activity</h2>
            <p className="muted">Track scheduled and completed deliveries.</p>
          </div>
          <span className="pill">BullMQ powered</span>
        </div>

        {loading ? <div className="empty">Loading...</div> : emails.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">✉</div>
            <h3>No emails yet</h3>
            <p>Create your first scheduled email to see it here.</p>
            <Link className="primary-btn" to="/compose">Compose email</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {emails.map(email => (
                  <tr key={email._id}>
                    <td>{email.to}</td>
                    <td className="subject">{email.subject}</td>
                    <td>{new Date(email.scheduledAt).toLocaleString()}</td>
                    <td><Status status={email.status} /></td>
                    <td>
                      {email.status === "SCHEDULED" && (
                        <button className="table-btn" onClick={() => cancel(email._id)}>Cancel</button>
                      )}
                      {email.previewUrl && (
                        <a className="table-btn" href={email.previewUrl} target="_blank" rel="noreferrer">Preview</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}

function Status({ status }) {
  return <span className={`status ${status.toLowerCase()}`}>{status}</span>;
}

function Compose() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    to: "",
    subject: "",
    body: "",
    scheduledAt: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function minDateTime() {
    const d = new Date(Date.now() + 60000);
    d.setSeconds(0, 0);
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await api.post("/emails/schedule", {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString()
      });
      setMessage("Email scheduled successfully.");
      setTimeout(() => navigate("/"), 700);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to schedule email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <span className="eyebrow">Create</span>
          <h1>Schedule an email</h1>
        </div>
        <Link className="secondary-btn" to="/">Back to dashboard</Link>
      </header>

      <section className="panel compose-panel">
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Recipient
              <input type="email" required value={form.to} onChange={e => setForm({...form, to: e.target.value})} placeholder="recipient@example.com" />
            </label>

            <label>
              Schedule time
              <input type="datetime-local" required min={minDateTime()} value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} />
            </label>
          </div>

          <label>
            Subject
            <input required maxLength="200" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Your email subject" />
          </label>

          <label>
            Message
            <textarea required rows="12" value={form.body} onChange={e => setForm({...form, body: e.target.value})} placeholder="Write your message..." />
          </label>

          <div className="compose-footer">
            <span className="muted">Delivery is processed by a BullMQ worker.</span>
            <button className="primary-btn" disabled={loading}>{loading ? "Scheduling..." : "Schedule email"}</button>
          </div>
        </form>
      </section>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());

  function logout() {
    localStorage.removeItem("email_scheduler_token");
    localStorage.removeItem("email_scheduler_user");
    setUser(null);
  }

  return (
    <Routes>
      <Route path="/login" element={<Auth mode="login" onAuth={setUser} />} />
      <Route path="/register" element={<Auth mode="register" onAuth={setUser} />} />
      <Route path="/" element={
        <Protected>
          <Layout user={user} onLogout={logout}><Dashboard /></Layout>
        </Protected>
      } />
      <Route path="/compose" element={
        <Protected>
          <Layout user={user} onLogout={logout}><Compose /></Layout>
        </Protected>
      } />
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}
