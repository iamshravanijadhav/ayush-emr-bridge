
import { useEffect, useState, createContext, useContext } from 'react';
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
  useParams
} from 'react-router-dom';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  Activity,
  Users,
  LayoutDashboard,
  Search,
  LogOut,
  ShieldCheck,
  Plus,
  ArrowLeft,
  RefreshCw,
  Leaf,
  Stethoscope,
  ClipboardList,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { auth, firebaseConfigured } from './firebase';
import { api } from './api';

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!firebaseConfigured);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, next => {
      setUser(next);
      setReady(true);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

function Protected({ children }) {
  const { user, ready } = useAuth();

  if (!ready) return <div className="center-screen">Checking session…</div>;
  if (!firebaseConfigured) return <SetupNotice />;

  return user ? children : <Navigate to="/login" replace />;
}

function SetupNotice() {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <Brand />
        <h1>Firebase setup required</h1>
        <p className="muted">
          Copy frontend/.env.example to frontend/.env, add your Firebase
          web-app values, and restart Vite.
        </p>
        <p className="muted">
          This app does not bypass authentication with a fake demo login.
        </p>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><Activity size={23} /></div>
      <div>
        <strong>AYUSH EMR Bridge</strong>
        <span>Healthcare interoperability workspace</span>
      </div>
    </div>
  );
}

function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <Brand />
        <div className="login-intro">
          <span className="eyebrow">SECURE DEMO ACCESS</span>
          <h1>Sign in to your workspace</h1>
          <p className="muted">
            Explore fictional patient histories across healthcare systems.
          </p>
        </div>

        <form onSubmit={submit} className="form-stack">
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <ErrorBox message={error} />
          <button className="btn primary full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in securely'}
          </button>
        </form>

        <div className="security-note">
          <ShieldCheck size={17} />
          <span>Protected by Firebase Authentication.</span>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await signOut(auth);
    navigate('/login');
  }

  const links = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/mappings', label: 'Terminology mapping', icon: Search },
    { to: '/reviews', label: 'Mapping review', icon: ClipboardList }
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <Brand />
        <div className="side-label">WORKSPACE</div>
        <nav>
          {links.map(link => (
            <NavLink
              key={link.to}
              end={link.end}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="prototype-label">
            <span className="status-dot" />
            <div>
              <b>Demo environment</b>
              <small>Fictional records only</small>
            </div>
          </div>
          <button className="nav-link logout" onClick={logout}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(v => !v)}
          >
            ☰
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span> <b>AYUSH EMR Bridge</b>
          </div>
          <div className="user-chip">
            <div className="avatar">{(user?.email?.[0] || 'U').toUpperCase()}</div>
            <span>{user?.email}</span>
          </div>
        </header>

        <div className="page-content">
          <div className="demo-banner">
            <AlertTriangle size={16} />
            <span>
              Prototype only · Fictional sample records · Not for clinical decisions
            </span>
          </div>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/mappings" element={<Mappings />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Loading({ label = 'Loading data…' }) {
  return (
    <div className="loading">
      <RefreshCw size={18} className="spin" />
      {label}
    </div>
  );
}

function ErrorBox({ message }) {
  return message ? <div className="alert error">{message}</div> : null;
}

function Stat({ label, value, icon: Icon, note }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <div className="stat-icon"><Icon size={19} /></div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      setStats((await api('/api/dashboard')).data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHeader
        eyebrow="OVERVIEW"
        title="Your unified care workspace"
        description="A single view across separate Modern Medicine and AYUSH encounter records."
        action={
          <button className="btn secondary" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
        }
      />
      <ErrorBox message={error} />

      {!stats ? <Loading /> : (
        <div className="stats-grid">
          <Stat label="Demo patients" value={stats.patients} icon={Users} note="Fictional patient profiles" />
          <Stat label="Modern Medicine visits" value={stats.modernMedicineEncounters} icon={Stethoscope} note="Original records preserved" />
          <Stat label="AYUSH visits" value={stats.ayushEncounters} icon={Leaf} note="Original records preserved" />
          <Stat label="Review queue" value={stats.reviewsRequired} icon={ClipboardList} note="Requires authorized review" />
        </div>
      )}

      <div className="section-heading">
        <div>
          <h2>How the bridge works</h2>
          <p className="muted">Existing systems remain separate; the bridge creates a unified view.</p>
        </div>
      </div>

      <div className="workflow-grid">
        <WorkflowStep n="01" title="Capture records" body="Register a fictional patient and add encounters from either system." />
        <WorkflowStep n="02" title="Preserve source" body="Keep original terminology and source-system information visible." />
        <WorkflowStep n="03" title="Review mappings" body="Show candidate relationships, evidence and uncertainty." />
        <WorkflowStep n="04" title="Create report" body="Summarize visits, review status and information not supplied." />
      </div>

      <div className="notice-card">
        <ShieldCheck size={20} />
        <div>
          <b>Interoperability without silent clinical assumptions</b>
          <p>Demo mappings are synthetic and unverified. A reviewer decision does not establish clinical equivalence.</p>
        </div>
      </div>
    </>
  );
}

function WorkflowStep({ n, title, body }) {
  return (
    <div className="workflow-card">
      <span>{n}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function Patients() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load(query = q) {
    setLoading(true);
    setError('');
    try {
      setRows((await api(`/api/patients?q=${encodeURIComponent(query)}`)).data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(''); }, []);

  async function create(payload) {
    const result = await api('/api/patients', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setShowForm(false);
    await load('');
    return result.warning;
  }

  async function deletePatient(patient) {
    const confirmed = window.confirm(
      `Delete demo patient "${patient.displayName}" and all linked demo records? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError('');
      await api(`/api/patients/${patient.id}`, {
        method: 'DELETE'
      });
      await load('');
    } catch (e) {
      setError(e.message);
    }
  }


  return (
    <>
      <PageHeader
        eyebrow="PATIENT DIRECTORY"
        title="Patients"
        description="Search and open fictional patient records."
        action={
          <button className="btn primary" onClick={() => setShowForm(v => !v)}>
            <Plus size={17} /> Register patient
          </button>
        }
      />

      {showForm && <PatientForm onCancel={() => setShowForm(false)} onSave={create} />}

      <div className="panel">
        <div className="search-row">
          <div className="searchbox">
            <Search size={18} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="Search by patient name or internal ID"
            />
          </div>
          <button className="btn secondary" onClick={() => load()}>Search</button>
        </div>

        <ErrorBox message={error} />

        {loading ? <Loading /> : rows.length === 0 ? (
          <div className="empty">
            <Users size={28} />
            <b>No patients found</b>
            <span>Register a fictional patient or change the search term.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Internal ID</th>
                  <th>Record type</th>
                  <th>Profile</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(p => (
                  <tr key={p.id}>
                    <td><b>{p.displayName}</b><small>Fictional demo record</small></td>
                    <td><code>{p.patientCode}</code></td>
                    <td><span className="pill neutral">Unified history</span></td>
                    <td>{p.birthYear || '—'} · {p.sex || '—'}</td>

                    <td>
                      <div className="form-actions">
                        <NavLink className="text-link" to={`/patients/${p.id}`}>
                          Open record →
                        </NavLink>
                        <button
                          className="btn secondary"
                          onClick={() => deletePatient(p)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function PatientForm({ onCancel, onSave }) {
  const [displayName, setName] = useState('');
  const [birthYear, setBirth] = useState('');
  const [sex, setSex] = useState('not_recorded');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const warning = await onSave({
        displayName,
        birthYear: birthYear ? Number(birthYear) : undefined,
        sex
      });
      if (warning) setError(warning);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel form-panel">
      <div className="section-heading">
        <h2>Register fictional patient</h2>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
      <form className="form-grid" onSubmit={submit}>
        <label>
          Display name
          <input value={displayName} onChange={e => setName(e.target.value)} required minLength="2" maxLength="100" placeholder="e.g. Patient Demo" />
        </label>
        <label>
          Birth year (optional)
          <input type="number" min="1900" max={new Date().getFullYear()} value={birthYear} onChange={e => setBirth(e.target.value)} />
        </label>
        <label>
          Sex / gender field
          <select value={sex} onChange={e => setSex(e.target.value)}>
            <option value="not_recorded">Not recorded</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>
        <div className="form-actions">
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save patient'}</button>
        </div>
      </form>
      <ErrorBox message={error} />
    </div>
  );
}

function PatientDetail() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      setError('');
      setRecord((await api(`/api/patients/${id}/history`)).data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function saveEncounter(payload) {
    await api(`/api/patients/${id}/encounters`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setShowForm(false);
    await load();
  }

  if (error && !record) {
    return (
      <>
        <button className="btn ghost" onClick={() => window.history.back()}>
          <ArrowLeft size={16} /> Back
        </button>
        <ErrorBox message={error} />
      </>
    );
  }

  if (!record) return <Loading />;

  const encounters = record.encounters || [];

  return (
    <>
      <button className="btn ghost back-btn" onClick={() => window.history.back()}>
        <ArrowLeft size={16} /> Back to patients
      </button>

      <PageHeader
        eyebrow="PATIENT RECORD"
        title={record.patient.displayName}
        description={`${record.patient.patientCode} · Fictional demo record`}
        action={
          <button className="btn primary" onClick={() => setShowForm(v => !v)}>
            <Plus size={17} /> Add encounter
          </button>
        }
      />

      <ErrorBox message={error} />

      <div className="patient-summary">
        <div><span>Internal patient ID</span><b>{record.patient.patientCode}</b></div>
        <div><span>Birth year</span><b>{record.patient.birthYear || 'Not recorded'}</b></div>
        <div><span>Profile</span><b>{record.patient.sex || 'Not recorded'}</b></div>
        <div><span>Total encounters</span><b>{encounters.length}</b></div>
      </div>

      {showForm && <EncounterForm onCancel={() => setShowForm(false)} onSave={saveEncounter} />}

      <div className="section-heading">
        <div>
          <h2>Unified history</h2>
          <p className="muted">Newest encounters first. Original records remain distinct.</p>
        </div>
      </div>

      {encounters.length === 0 ? (
        <div className="empty panel">No encounters yet. Add a Modern Medicine or AYUSH encounter.</div>
      ) : (
        <div className="timeline">
          {encounters.map(e => {
            const candidate = e.mappingReview?.candidate;
            const reviewStatus = e.mappingReview?.reviewStatus;
            const isAyush = e.system === 'AYUSH';

            return (
              <article className="timeline-card" key={e.id}>
                <div className={`system-icon ${isAyush ? 'ayush' : ''}`}>
                  {isAyush ? <Leaf size={19} /> : <Stethoscope size={19} />}
                </div>

                <div className="timeline-main">
                  <div className="timeline-top">
                    <span className={`pill ${isAyush ? 'green' : 'blue'}`}>
                      {isAyush ? `AYUSH · ${e.ayushDiscipline || 'Discipline not specified'}` : 'Modern Medicine'}
                    </span>
                    <time>{e.encounterDate}</time>
                  </div>

                  <h3>{e.diagnosisTerm}</h3>
                  <p className="muted">
                    Original terminology: {e.terminologySystem}
                    {e.diagnosisCode ? ` · Code: ${e.diagnosisCode}` : ''}
                  </p>

                  {e.medicines?.length > 0 && (
                    <p className="record-line"><b>Medicines / preparations:</b> {e.medicines.join(', ')}</p>
                  )}

                  {e.notes && <p className="record-line"><b>Notes:</b> {e.notes}</p>}

                  <section className="report-section">
                    <h4><FileText size={16} /> Original record</h4>
                    <p className="record-line"><b>Source system:</b> {isAyush ? `AYUSH · ${e.ayushDiscipline || 'Not specified'}` : 'Modern Medicine'}</p>
                    <p className="record-line"><b>Original diagnosis:</b> {e.diagnosisTerm}</p>
                    <p className="muted small">The original terminology and source record are preserved.</p>
                  </section>

                  <section className="report-section">
                    <h4>Potential terminology relationship</h4>

                    {candidate ? (
                      <>
                        <div className="mapping-columns">
                          <div>
                            <small>Source · {candidate.sourceSystem || 'Not specified'}</small>
                            <b>{candidate.sourceTerm || 'Not supplied'}</b>
                          </div>
                          <div className="mapping-arrow">↔</div>
                          <div>
                            <small>Target · {candidate.targetSystem || 'Not specified'}</small>
                            <b>{candidate.targetTerm || 'No candidate target'}</b>
                          </div>
                        </div>
                        <p className="record-line"><b>Dataset version:</b> {candidate.datasetVersion || 'Not supplied'}</p>
                        <p className="record-line"><b>Verification:</b> {candidate.verificationStatus || 'Unverified'}</p>
                        <p className="record-line"><b>Clinical equivalence:</b> Not established</p>
                      </>
                    ) : (
                      <p className="muted">
                        No candidate is attached to this encounter yet. Search the terminology dataset to inspect available proposals.
                      </p>
                    )}

                    <p className="muted small">
                      Demo dataset only. A candidate relationship is not a confirmed clinical equivalence.
                    </p>
                  </section>

                  <section className="report-section">
                    <h4>Review outcome</h4>
                    <p>
                      <b>Status:</b>{' '}
                      {reviewStatus === 'APPROVED_FOR_DEMO_REVIEW'
                        ? 'Approved for demo review'
                        : reviewStatus === 'REJECTED'
                          ? 'Proposal rejected'
                          : 'Review pending'}
                    </p>

                    {e.mappingReview?.currentDecision && (
                      <p className="record-line">
                        <b>Reviewer decision:</b> {e.mappingReview.currentDecision}
                      </p>
                    )}

                    {e.mappingReview?.reviewerNotes && (
                      <p className="record-line">
                        <b>Reviewer note:</b> {e.mappingReview.reviewerNotes}
                      </p>
                    )}

                    <p className="muted small">
                      The review decision is traceable but does not independently verify clinical equivalence.
                    </p>
                  </section>

                  <section className="report-section">
                    <h4>Information requiring reconciliation</h4>

                    {isAyush ? (
                      <p className="record-line">
                        <b>AYUSH details:</b> Assessment, formulation details and follow-up plan were not supplied in this fictional demo record.
                      </p>
                    ) : (
                      <p className="record-line">
                        <b>Investigations:</b> Blood glucose and HbA1c results were not supplied in this fictional demo record.
                      </p>
                    )}

                    {(!e.medicines || e.medicines.length === 0) && (
                      <p className="record-line">
                        <b>Medicines:</b> No medicine or preparation details supplied.
                      </p>
                    )}
                  </section>

                  <div className="mapping-row">
                    <span className={`pill ${e.mapping?.mapping_status === 'DEMO_UNVERIFIED' ? 'amber' : e.mapping?.mapping_status === 'NO_MAPPING' ? 'neutral' : 'blue'}`}>
                      {e.mapping?.mapping_status || 'NOT_MAPPED'}
                    </span>
                    <span className="muted small">
                      Original mapping snapshot: {e.mapping?.dataset_version || 'n/a'}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function EncounterForm({ onCancel, onSave }) {
  const [system, setSystem] = useState('MODERN_MEDICINE');
  const [discipline, setDiscipline] = useState('Ayurveda');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [diagnosis, setDiagnosis] = useState('');
  const [code, setCode] = useState('');
  const [terminology, setTerminology] = useState('DEMO_MODERN_MEDICINE');
  const [medicines, setMedicines] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await onSave({
        system,
        ayushDiscipline: system === 'AYUSH' ? discipline : undefined,
        encounterDate: date,
        diagnosisTerm: diagnosis,
        diagnosisCode: code,
        terminologySystem: terminology,
        medicines: medicines.split(',').map(s => s.trim()).filter(Boolean),
        notes
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel form-panel">
      <div className="section-heading">
        <h2>Add encounter</h2>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>

      <form className="form-grid" onSubmit={submit}>
        <label>
          Healthcare system
          <select
            value={system}
            onChange={e => {
              setSystem(e.target.value);
              setTerminology(e.target.value === 'AYUSH' ? 'DEMO_AYUSH' : 'DEMO_MODERN_MEDICINE');
            }}
          >
            <option value="MODERN_MEDICINE">Modern Medicine</option>
            <option value="AYUSH">AYUSH</option>
          </select>
        </label>

        {system === 'AYUSH' && (
          <label>
            AYUSH discipline
            <select value={discipline} onChange={e => setDiscipline(e.target.value)}>
              {['Ayurveda', 'Yoga', 'Unani', 'Siddha', 'Homeopathy', 'Other'].map(x => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        )}

        <label>
          Encounter date
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </label>

        <label>
          Original diagnosis / term
          <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required minLength="2" maxLength="200" placeholder="Use a fictional demo term" />
        </label>

        <label>
          Original code (optional)
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Leave blank if not verified" />
        </label>

        <label>
          Terminology system
          <input value={terminology} onChange={e => setTerminology(e.target.value)} required />
        </label>

        <label>
          Medicines / preparations (comma separated)
          <input value={medicines} onChange={e => setMedicines(e.target.value)} placeholder="Fictional medicine A, fictional medicine B" />
        </label>

        <label className="span-two">
          Notes
          <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength="2000" placeholder="Fictional notes only" />
        </label>

        <div className="form-actions">
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save encounter'}</button>
        </div>
      </form>

      <ErrorBox message={error} />
      <p className="muted small">Use fictional data only. Codes are preserved as supplied and are not automatically verified.</p>
    </div>
  );
}

function Mappings() {
  const [q, setQ] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function search(e) {
    e?.preventDefault();
    setError('');
    try {
      setResult(await api(`/api/mappings/search?q=${encodeURIComponent(q)}`));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { search(); }, []);

  return (
    <>
      <PageHeader
        eyebrow="TERMINOLOGY SERVICES"
        title="Terminology mapping"
        description="Search the loaded dataset. Search results are not proof of clinical equivalence."
      />

      <div className="panel">
        <form className="search-row" onSubmit={search}>
          <div className="searchbox">
            <Search size={18} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search a demo term or code" />
          </div>
          <button className="btn primary">Search</button>
        </form>

        <ErrorBox message={error} />

        {result && (
          <>
            <div className="dataset-warning">
              <AlertTriangle size={18} />
              <div>
                <b>{result.metadata?.datasetType || 'Dataset status unknown'}</b>
                <p>
                  {result.metadata?.notice || 'Verify source and license before use.'}
                  {' '}Dataset version: {result.metadata?.version}
                </p>
              </div>
            </div>

            {result.data.length === 0 ? (
              <div className="empty">
                <Search size={25} />
                <b>No mapping result</b>
                <span>Nothing in the loaded dataset matched this query.</span>
              </div>
            ) : (
              <div className="mapping-list">
                {result.data.map(m => (
                  <div className="mapping-card" key={m.mapping_id}>
                    <div className="mapping-head">
                      <span className="pill amber">{m.mapping_status}</span>
                      <code>{m.mapping_id}</code>
                    </div>

                    <div className="mapping-columns">
                      <div>
                        <small>Source · {m.source_system}</small>
                        <h3>{m.source_term}</h3>
                        <code>{m.source_code || 'No code'}</code>
                      </div>
                      <div className="mapping-arrow">→</div>
                      <div>
                        <small>Target · {m.target_system}</small>
                        <h3>{m.target_term || 'No target mapping'}</h3>
                        <code>{m.target_code || 'No target code'}</code>
                      </div>
                    </div>

                    <p className="muted small">Verification: {m.verification_status} · Relation: {m.mapping_relation}</p>
                    <p className="record-line">{m.reviewer_notes || m.notes || 'No evidence or reviewer notes supplied.'}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Reviews() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setRows((await api('/api/mappings/reviews')).data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function decide(id, decision) {
    const reviewerNotes = window.prompt(
      'Add a review note. Do not claim clinical equivalence without evidence:'
    );

    if (reviewerNotes === null) return;

    try {
      await api(`/api/mappings/reviews/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, reviewerNotes })
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="QUALITY WORKFLOW"
        title="Mapping review"
        description="Review candidate relationships and record an auditable decision."
        action={
          <button className="btn secondary" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
        }
      />

      <ErrorBox message={error} />

      {loading ? <Loading /> : rows.length === 0 ? (
        <div className="empty panel">
          <ClipboardList size={28} />
          <b>No review items</b>
          <span>Add a fictional encounter to create a review item.</span>
        </div>
      ) : (
        <div className="review-list">
          {rows.map(r => (
            <div className="panel review-card" key={r.id}>
              <div>
                <span className={`pill ${r.currentDecision ? 'amber' : 'neutral'}`}>
                  {r.currentDecision || 'PENDING'}
                </span>

                <h3>

                  {r.candidate?.sourceTerm ||
                    r.sourceTerm ||
                    r.source_term ||
                    'Unlabelled source term'}
                  {' → '}
                  {r.candidate?.targetTerm ||
                    r.targetTerm ||
                    r.target_term ||
                    'No candidate target attached'}

                </h3>

                <p className="muted small">
                  Source system: {r.sourceSystem || 'Not specified'}
                </p>
                <p className="muted small">
                  Target system: {r.candidate?.targetSystem || r.targetSystem || 'Not specified'}
                </p>
                <p className="muted small">
                  Evidence: {r.evidenceReference || r.evidence_reference || 'No evidence supplied'}
                </p>
                <p className="muted small">
                  Mapping status: {r.candidate?.mappingStatus || r.mappingStatus || 'Not supplied'} · Verification: {r.candidate?.verificationStatus || r.verificationStatus || 'Unverified'}
                </p>
                <p className="muted small">
                  Dataset version: {r.candidate?.datasetVersion || r.datasetVersion || 'Original encounter snapshot; version may be unavailable'}
                </p>
              </div>

              <div className="review-actions">
                <button className="btn secondary" onClick={() => decide(r.id, 'reject')}>Reject</button>
                <button className="btn primary" onClick={() => decide(r.id, 'approve')}>Record approval</button>
              </div>

              {r.currentDecision && (
                <p className="muted small">
                  Latest decision: {r.currentDecision}
                </p>
              )}

              <p className="muted small">
                A reviewer decision does not establish clinical equivalence.
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<Protected><Shell /></Protected>} />
      </Routes>
    </AuthProvider>
  );
}
