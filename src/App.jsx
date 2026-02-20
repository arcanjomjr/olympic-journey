import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";

// ─── Firebase ────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyBFpRNhk0klzDKMBBvjtIMgKtxo4B34ijc",
  authDomain: "olympic-journey.firebaseapp.com",
  projectId: "olympic-journey",
  storageBucket: "olympic-journey.firebasestorage.app",
  messagingSenderId: "35516591680",
  appId: "1:35516591680:web:a8e0e7dc959d0d1d0ff9a5",
  measurementId: "G-7CWE8M4Z2E",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// ─── Data ───────────────────────────────────────────────────────────────────

const COMPETITIONS = [
  { id: "imo", name: "IMO", fullName: "International Mathematical Olympiad", flag: "🌍" },
  { id: "conesul", name: "Cone Sul", fullName: "Olimpíada de Matemática do Cone Sul", flag: "🇸🇦" },
  { id: "obn", name: "OBMEP", fullName: "Olimpíada Brasileira de Matemática", flag: "🇧🇷" },
  { id: "cno", name: "China MO", fullName: "Chinese Mathematical Olympiad", flag: "🇨🇳" },
  { id: "usamo", name: "USAMO", fullName: "United States of America MO", flag: "🇺🇸" },
  { id: "putnam", name: "Putnam", fullName: "William Lowell Putnam Competition", flag: "🎓" },
  { id: "balkan", name: "Balkan MO", fullName: "Balkan Mathematical Olympiad", flag: "🏛️" },
  { id: "ibero", name: "Ibero MO", fullName: "Iberoamerican Mathematical Olympiad", flag: "🌎" },
];

const YEARS = Array.from({ length: 30 }, (_, i) => 2024 - i);

const PROBLEMS_COUNT = {
  imo: 6, conesul: 6, obn: 6, cno: 6, usamo: 6, putnam: 12, balkan: 4, ibero: 6,
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #12121a;
    --surface2: #1a1a28;
    --border: #2a2a40;
    --accent: #f0c040;
    --accent2: #6060f0;
    --text: #e8e8f0;
    --muted: #6868a0;
    --success: #40d080;
    --danger: #f04060;
    --radius: 12px;
  }

  body { background: var(--bg); color: var(--text); font-family: 'JetBrains Mono', monospace; min-height: 100vh; }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  .header {
    background: linear-gradient(135deg, #0a0a0f 0%, #12121a 100%);
    border-bottom: 1px solid var(--border);
    padding: 0 2rem;
    display: flex; align-items: center; justify-content: space-between;
    height: 64px; position: sticky; top: 0; z-index: 100;
  }
  .logo { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 900; color: var(--accent); letter-spacing: -0.5px; }
  .header-right { display: flex; align-items: center; gap: 1rem; }
  .user-chip {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 999px; padding: 5px 14px 5px 5px;
    font-size: 0.78rem; color: var(--accent); cursor: pointer; transition: all 0.2s;
  }
  .user-chip:hover { border-color: var(--accent); }
  .user-avatar { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; }
  .nav-btn {
    background: none; border: 1px solid var(--border); color: var(--muted);
    border-radius: 8px; padding: 6px 14px; font-size: 0.78rem; cursor: pointer;
    font-family: 'JetBrains Mono', monospace; transition: all 0.2s;
  }
  .nav-btn:hover { color: var(--text); border-color: var(--text); }
  .nav-btn.active { color: var(--accent); border-color: var(--accent); }

  .content { flex: 1; padding: 2rem; max-width: 1200px; margin: 0 auto; width: 100%; }

  .auth-wrap {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg);
    background-image: radial-gradient(ellipse at 20% 50%, rgba(96,96,240,0.08) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(240,192,64,0.06) 0%, transparent 50%);
  }
  .auth-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 3rem; width: 400px;
    box-shadow: 0 40px 80px rgba(0,0,0,0.5); text-align: center;
  }
  .auth-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 900; margin-bottom: 0.4rem; color: var(--accent); }
  .auth-sub { color: var(--muted); font-size: 0.82rem; margin-bottom: 2.5rem; line-height: 1.6; }
  .btn-google {
    width: 100%; padding: 14px; background: #fff; color: #1a1a1a;
    border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600;
    cursor: pointer; font-family: 'JetBrains Mono', monospace; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  }
  .btn-google:hover { background: #f5f5f5; transform: translateY(-1px); }
  .google-icon { width: 20px; height: 20px; }

  .loading-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 2rem; color: var(--muted); font-size: 0.78rem; }
  .breadcrumb-item { cursor: pointer; transition: color 0.2s; }
  .breadcrumb-item:hover { color: var(--accent); }
  .breadcrumb-sep { color: var(--border); }
  .breadcrumb-current { color: var(--text); }

  .section-header { margin-bottom: 1.5rem; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 700; }
  .section-sub { color: var(--muted); font-size: 0.78rem; margin-top: 4px; }

  .comp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
  .comp-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 1.5rem; cursor: pointer;
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .comp-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--accent2) 0%, transparent 100%);
    opacity: 0; transition: opacity 0.2s;
  }
  .comp-card:hover { border-color: var(--accent2); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(96,96,240,0.15); }
  .comp-card:hover::before { opacity: 0.05; }
  .comp-flag { font-size: 2rem; margin-bottom: 0.8rem; }
  .comp-name { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; }
  .comp-full { color: var(--muted); font-size: 0.72rem; margin-top: 4px; }
  .comp-progress { margin-top: 1rem; }
  .progress-bar { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-top: 6px; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent2), var(--accent)); border-radius: 2px; transition: width 0.5s; }
  .progress-label { font-size: 0.7rem; color: var(--muted); display: flex; justify-content: space-between; }

  .year-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
  .year-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 1.2rem 1rem; cursor: pointer;
    transition: all 0.2s; text-align: center;
  }
  .year-card:hover { border-color: var(--accent); transform: translateY(-2px); }
  .year-num { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; }
  .year-done { font-size: 0.7rem; color: var(--muted); margin-top: 4px; }
  .year-dots { display: flex; justify-content: center; gap: 4px; margin-top: 8px; flex-wrap: wrap; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); transition: all 0.2s; }
  .dot.done { background: var(--success); box-shadow: 0 0 6px rgba(64,208,128,0.5); }
  .dot.has-solution { outline: 2px solid var(--accent); outline-offset: 1px; }

  .problem-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 1rem; }
  .problem-card {
    background: var(--surface); border: 2px solid var(--border);
    border-radius: var(--radius); padding: 1.5rem; cursor: pointer;
    transition: all 0.25s; text-align: center; position: relative;
  }
  .problem-card.done { border-color: var(--success); background: linear-gradient(135deg, rgba(64,208,128,0.08), var(--surface)); }
  .problem-card:not(.done):hover { border-color: var(--accent2); transform: scale(1.03); }
  .problem-card.done:hover { transform: scale(1.03); }
  .problem-num { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 900; }
  .problem-label { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .problem-check { font-size: 1.5rem; margin-top: 0.5rem; }
  .solution-badge {
    position: absolute; top: 10px; right: 10px;
    background: rgba(240,192,64,0.15); border: 1px solid rgba(240,192,64,0.4);
    color: var(--accent); border-radius: 6px;
    font-size: 0.62rem; padding: 2px 7px; font-weight: 700; letter-spacing: 0.5px;
  }

  .leaderboard { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .lb-header { padding: 1.2rem 1.5rem; border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 50px 1fr 100px; gap: 1rem; font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
  .lb-row { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 50px 1fr 100px; gap: 1rem; align-items: center; transition: background 0.2s; }
  .lb-row:hover { background: var(--surface2); }
  .lb-row:last-child { border-bottom: none; }
  .lb-rank { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; color: var(--muted); }
  .lb-rank.gold { color: #f0c040; }
  .lb-rank.silver { color: #c0c0d0; }
  .lb-rank.bronze { color: #c08040; }
  .lb-name { font-weight: 500; display: flex; align-items: center; gap: 10px; }
  .lb-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
  .lb-score { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--accent); text-align: right; }
  .lb-me { background: rgba(96,96,240,0.06); }

  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; }
  .stat-value { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 900; color: var(--accent); }
  .stat-label { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

  .toast {
    position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
    background: var(--success); color: #000; border-radius: 10px;
    padding: 12px 20px; font-size: 0.82rem; font-weight: 600;
    animation: slideUp 0.3s ease; box-shadow: 0 8px 32px rgba(64,208,128,0.3);
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } }

  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 500;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px); animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } }
  .modal {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; width: 500px; max-width: calc(100vw - 2rem);
    max-height: 90vh; overflow-y: auto;
    box-shadow: 0 40px 80px rgba(0,0,0,0.6); animation: popIn 0.2s ease;
  }
  @keyframes popIn { from { transform: scale(0.95); opacity: 0; } }
  .modal-header {
    padding: 1.8rem 2rem 1.2rem; border-bottom: 1px solid var(--border);
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; }
  .modal-sub { color: var(--muted); font-size: 0.75rem; margin-top: 4px; }
  .modal-close {
    background: none; border: 1px solid var(--border); color: var(--muted);
    width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 1rem;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;
  }
  .modal-close:hover { border-color: var(--text); color: var(--text); }
  .modal-body { padding: 1.5rem 2rem 2rem; }

  .solve-toggle {
    display: flex; align-items: center; gap: 1rem; padding: 1rem 1.2rem;
    background: var(--surface2); border-radius: 12px; cursor: pointer;
    border: 2px solid var(--border); transition: all 0.2s; margin-bottom: 1.5rem; user-select: none;
  }
  .solve-toggle.done { border-color: var(--success); background: rgba(64,208,128,0.07); }
  .solve-toggle:hover { border-color: var(--accent2); }
  .solve-toggle.done:hover { border-color: var(--success); filter: brightness(1.05); }
  .toggle-circle {
    width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.9rem; transition: all 0.2s;
  }
  .solve-toggle.done .toggle-circle { border-color: var(--success); background: var(--success); color: #000; }
  .toggle-text { flex: 1; }
  .toggle-label { font-size: 0.9rem; font-weight: 500; }
  .toggle-hint { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }

  .solution-divider {
    font-size: 0.72rem; color: var(--muted); text-transform: uppercase;
    letter-spacing: 1px; margin-bottom: 1rem;
    display: flex; align-items: center; gap: 12px;
  }
  .solution-divider::before, .solution-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .sol-label { font-size: 0.75rem; color: var(--muted); margin-bottom: 8px; }
  .sol-input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); border-radius: 8px; padding: 10px 14px; font-size: 0.85rem;
    font-family: 'JetBrains Mono', monospace; outline: none; transition: border-color 0.2s; margin-bottom: 0.8rem;
  }
  .sol-input:focus { border-color: var(--accent2); }

  .link-preview {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    background: var(--surface2); border: 1px solid var(--border); border-radius: 10px;
    margin-bottom: 0.8rem; font-size: 0.78rem;
  }
  .link-preview a { color: var(--accent2); text-decoration: none; word-break: break-all; flex: 1; }
  .link-preview a:hover { text-decoration: underline; }

  .btn-remove {
    background: rgba(240,64,96,0.12); border: 1px solid rgba(240,64,96,0.3);
    color: var(--danger); border-radius: 6px; padding: 3px 10px; cursor: pointer;
    font-size: 0.72rem; font-family: 'JetBrains Mono', monospace; transition: all 0.2s; white-space: nowrap;
  }
  .btn-remove:hover { background: rgba(240,64,96,0.22); }

  .modal-actions { display: flex; gap: 0.8rem; margin-top: 1.4rem; }
  .btn-save {
    flex: 1; padding: 10px; background: var(--accent2); color: #fff;
    border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
    cursor: pointer; font-family: 'JetBrains Mono', monospace; transition: all 0.2s;
  }
  .btn-save:hover { background: #7575ff; }
  .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-ghost {
    padding: 10px 16px; background: none; color: var(--muted);
    border: 1px solid var(--border); border-radius: 8px; font-size: 0.85rem;
    cursor: pointer; font-family: 'JetBrains Mono', monospace; transition: all 0.2s;
  }
  .btn-ghost:hover { color: var(--text); border-color: var(--text); }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState("tracker");
  const [solved, setSolved] = useState({});
  const [solutions, setSolutions] = useState({});
  const [nav, setNav] = useState({ comp: null, year: null });
  const [toast, setToast] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [modalProblem, setModalProblem] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserData(firebaseUser.uid);
        await loadLeaderboard();
      } else {
        setUser(null); setSolved({}); setSolutions({});
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  async function loadUserData(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      setSolved(data.solved || {});
      setSolutions(data.solutions || {});
    }
  }

  async function loadLeaderboard() {
    const snap = await getDocs(collection(db, "users"));
    const users = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    setAllUsers(users.sort((a, b) => (b.total || 0) - (a.total || 0)));
  }

  function showToast(msg) {
    setToast(msg); setTimeout(() => setToast(null), 2200);
  }

  async function handleGoogleLogin() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          displayName: u.displayName, photoURL: u.photoURL,
          email: u.email, total: 0, solved: {}, solutions: {}, joined: Date.now(),
        });
      }
    } catch (e) { console.error(e); }
  }

  async function handleLogout() {
    await signOut(auth); setNav({ comp: null, year: null }); setView("tracker");
  }

  async function saveProblem({ compId, year, num, isDone, link }) {
    const key = `${compId}-${year}-${num}`;
    const prevDone = !!solved[key];
    const newSolved = { ...solved, [key]: isDone };
    const newSolutions = { ...solutions };

    if (link) newSolutions[key] = { type: "link", data: link };
    else delete newSolutions[key];

    const total = Object.values(newSolved).filter(Boolean).length;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { solved: newSolved, solutions: newSolutions, total });

    setSolved(newSolved); setSolutions(newSolutions);
    if (isDone && !prevDone) showToast(`✓ Problem ${num} marked as solved!`);
    else if (!isDone && prevDone) showToast(`Problem ${num} unmarked.`);
    else if (link) showToast("🔗 Solution link saved!");
    else showToast("Saved.");

    await loadLeaderboard();
    setModalProblem(null);
  }

  function getSolvedCount(compId, year) {
    const n = PROBLEMS_COUNT[compId] || 6;
    return Array.from({ length: n }, (_, i) => i + 1).filter(n => solved[`${compId}-${year}-${n}`]).length;
  }

  function getCompTotal(compId) {
    return Object.keys(solved).filter(k => k.startsWith(compId) && solved[k]).length;
  }

  if (authLoading) return (
    <><style>{css}</style><div className="loading-wrap"><div className="spinner" /></div></>
  );

  if (!user) return <AuthScreen onGoogleLogin={handleGoogleLogin} />;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="header">
          <div className="logo">Olympic Journey</div>
          <div className="header-right">
            <button className={`nav-btn ${view === "tracker" ? "active" : ""}`} onClick={() => setView("tracker")}>Problems</button>
            <button className={`nav-btn ${view === "leaderboard" ? "active" : ""}`} onClick={() => { setView("leaderboard"); loadLeaderboard(); }}>Leaderboard</button>
            <button className={`nav-btn ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}>Profile</button>
            <div className="user-chip" onClick={handleLogout}>
              {user.photoURL && <img className="user-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
              {user.displayName?.split(" ")[0]} · logout
            </div>
          </div>
        </header>
        <div className="content">
          {view === "tracker" && (
            <TrackerView nav={nav} setNav={setNav} solved={solved} solutions={solutions}
              onOpenProblem={setModalProblem} getSolvedCount={getSolvedCount} getCompTotal={getCompTotal} />
          )}
          {view === "leaderboard" && <LeaderboardView users={allUsers} me={user.uid} />}
          {view === "profile" && <ProfileView user={user} solved={solved} solutions={solutions} />}
        </div>
      </div>
      {modalProblem && (
        <ProblemModal
          {...modalProblem}
          isDone={!!solved[`${modalProblem.compId}-${modalProblem.year}-${modalProblem.num}`]}
          existingLink={solutions[`${modalProblem.compId}-${modalProblem.year}-${modalProblem.num}`]?.data || ""}
          onSave={saveProblem}
          onClose={() => setModalProblem(null)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function AuthScreen({ onGoogleLogin }) {
  return (
    <><style>{css}</style>
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Olympic Journey</div>
        <div className="auth-sub">Track your olympiad problem solving journey.<br />Sign in to get started.</div>
        <button className="btn-google" onClick={onGoogleLogin}>
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div></>
  );
}

// ─── Problem Modal ────────────────────────────────────────────────────────────

function ProblemModal({ compId, year, num, isDone: initDone, existingLink, onSave, onClose }) {
  const comp = COMPETITIONS.find(c => c.id === compId);
  const [isDone, setIsDone] = useState(initDone);
  const [linkVal, setLinkVal] = useState(existingLink || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({ compId, year, num, isDone, link: linkVal.trim() || null });
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">{comp.flag} {comp.name} — Problem {num}</div>
            <div className="modal-sub">{year} · {comp.fullName}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className={`solve-toggle ${isDone ? "done" : ""}`} onClick={() => setIsDone(d => !d)}>
            <div className="toggle-circle">{isDone ? "✓" : ""}</div>
            <div className="toggle-text">
              <div className="toggle-label">{isDone ? "Marked as solved" : "Mark as solved"}</div>
              <div className="toggle-hint">{isDone ? "Click to unmark" : "Click to mark this problem as done"}</div>
            </div>
          </div>

          <div className="solution-divider">Solution link (optional)</div>
          <div className="sol-label">Paste a link to your solution (AoPS, Google Drive, Overleaf, etc.)</div>
          <input
            className="sol-input"
            placeholder="https://artofproblemsolving.com/..."
            value={linkVal}
            onChange={e => setLinkVal(e.target.value)}
          />
          {linkVal.trim() && (
            <div className="link-preview">
              <span>🔗</span>
              <a href={linkVal} target="_blank" rel="noopener noreferrer">{linkVal}</a>
              <button className="btn-remove" onClick={() => setLinkVal("")}>Remove</button>
            </div>
          )}

          <div className="modal-actions">
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tracker ─────────────────────────────────────────────────────────────────

function TrackerView({ nav, setNav, solved, solutions, onOpenProblem, getSolvedCount, getCompTotal }) {
  if (nav.comp && nav.year) {
    const comp = COMPETITIONS.find(c => c.id === nav.comp);
    const n = PROBLEMS_COUNT[nav.comp] || 6;
    return (
      <div>
        <Breadcrumb items={[
          { label: "Competitions", onClick: () => setNav({ comp: null, year: null }) },
          { label: comp.name, onClick: () => setNav({ comp: nav.comp, year: null }) },
          { label: nav.year, current: true },
        ]} />
        <div className="section-header">
          <div className="section-title">{comp.flag} {comp.name} — {nav.year}</div>
          <div className="section-sub">{getSolvedCount(nav.comp, nav.year)} / {n} problems solved · click a problem to open</div>
        </div>
        <div className="problem-grid">
          {Array.from({ length: n }, (_, i) => i + 1).map(num => {
            const key = `${nav.comp}-${nav.year}-${num}`;
            const done = !!solved[key]; const hasSol = !!solutions[key];
            return (
              <div key={num} className={`problem-card ${done ? "done" : ""}`} onClick={() => onOpenProblem({ compId: nav.comp, year: nav.year, num })}>
                {hasSol && <div className="solution-badge">🔗 solution</div>}
                <div className="problem-num" style={{ color: done ? "var(--success)" : "var(--text)" }}>{num}</div>
                <div className="problem-label">Problem</div>
                <div className="problem-check">{done ? "✓" : "○"}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (nav.comp) {
    const comp = COMPETITIONS.find(c => c.id === nav.comp);
    const n = PROBLEMS_COUNT[nav.comp] || 6;
    return (
      <div>
        <Breadcrumb items={[
          { label: "Competitions", onClick: () => setNav({ comp: null, year: null }) },
          { label: comp.name, current: true },
        ]} />
        <div className="section-header">
          <div className="section-title">{comp.flag} {comp.fullName}</div>
          <div className="section-sub">Select a year</div>
        </div>
        <div className="year-grid">
          {YEARS.map(year => {
            const done = getSolvedCount(nav.comp, year);
            return (
              <div key={year} className="year-card" onClick={() => setNav({ ...nav, year })}>
                <div className="year-num">{year}</div>
                <div className="year-done">{done}/{n} solved</div>
                <div className="year-dots">
                  {Array.from({ length: n }, (_, i) => i + 1).map(num => {
                    const key = `${nav.comp}-${year}-${num}`;
                    return <div key={num} className={`dot ${solved[key] ? "done" : ""} ${solutions[key] ? "has-solution" : ""}`} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const totalSolved = Object.values(solved).filter(Boolean).length;
  return (
    <div>
      <div className="section-header">
        <div className="section-title">Competitions</div>
        <div className="section-sub">{totalSolved} problems solved across all olympiads</div>
      </div>
      <div className="comp-grid">
        {COMPETITIONS.map(comp => {
          const done = getCompTotal(comp.id);
          const total = (PROBLEMS_COUNT[comp.id] || 6) * YEARS.length;
          const pct = Math.round(done / total * 100);
          return (
            <div key={comp.id} className="comp-card" onClick={() => setNav({ comp: comp.id, year: null })}>
              <div className="comp-flag">{comp.flag}</div>
              <div className="comp-name">{comp.name}</div>
              <div className="comp-full">{comp.fullName}</div>
              <div className="comp-progress">
                <div className="progress-label"><span>{done} solved</span><span>{pct}%</span></div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

function LeaderboardView({ users, me }) {
  const rankStyle = (i) => i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
  const medal = (i) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
  return (
    <div>
      <div className="section-header">
        <div className="section-title">Leaderboard</div>
        <div className="section-sub">{users.length} registered solvers</div>
      </div>
      <div className="leaderboard">
        <div className="lb-header"><span>Rank</span><span>Solver</span><span style={{ textAlign: "right" }}>Total</span></div>
        {users.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>No solvers yet. Be the first!</div>}
        {users.map((u, i) => (
          <div key={u.uid} className={`lb-row ${u.uid === me ? "lb-me" : ""}`}>
            <div className={`lb-rank ${rankStyle(i)}`}>{medal(i) || `#${i + 1}`}</div>
            <div className="lb-name">
              {u.photoURL && <img className="lb-avatar" src={u.photoURL} alt="" referrerPolicy="no-referrer" />}
              {u.displayName}
              {u.uid === me && <span style={{ color: "var(--accent2)", fontSize: "0.7rem" }}>← you</span>}
            </div>
            <div className="lb-score">{u.total || 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────────────────────

function ProfileView({ user, solved, solutions }) {
  const total = Object.values(solved).filter(Boolean).length;
  const solCount = Object.keys(solutions).length;
  const compStats = COMPETITIONS.map(c => ({
    ...c, done: Object.keys(solved).filter(k => k.startsWith(c.id) && solved[k]).length
  })).sort((a, b) => b.done - a.done);
  const years = [...new Set(Object.keys(solved).filter(k => solved[k]).map(k => k.split("-")[1]))].length;

  return (
    <div>
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.3rem" }}>
          {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 48, height: 48, borderRadius: "50%" }} />}
          <div className="section-title">{user.displayName}</div>
        </div>
        <div className="section-sub">{user.email}</div>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{total}</div><div className="stat-label">Problems Solved</div></div>
        <div className="stat-card"><div className="stat-value">{solCount}</div><div className="stat-label">Solutions Linked</div></div>
        <div className="stat-card"><div className="stat-value">{compStats.filter(c => c.done > 0).length}</div><div className="stat-label">Competitions</div></div>
        <div className="stat-card"><div className="stat-value">{years}</div><div className="stat-label">Years Covered</div></div>
      </div>
      <div className="section-title" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>By Competition</div>
      <div className="leaderboard">
        {compStats.map(c => {
          const t = (PROBLEMS_COUNT[c.id] || 6) * YEARS.length;
          const pct = Math.round(c.done / t * 100);
          return (
            <div key={c.id} className="lb-row">
              <div style={{ fontSize: "1.5rem" }}>{c.flag}</div>
              <div>
                <div style={{ fontWeight: 500 }}>{c.name}</div>
                <div className="progress-bar" style={{ width: 200, marginTop: 6 }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="lb-score">{c.done}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ items }) {
  return (
    <div className="breadcrumb">
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {i > 0 && <span className="breadcrumb-sep">/</span>}
          {item.current
            ? <span className="breadcrumb-current">{item.label}</span>
            : <span className="breadcrumb-item" onClick={item.onClick}>{item.label}</span>}
        </span>
      ))}
    </div>
  );
}
