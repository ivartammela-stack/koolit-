import React, { useEffect, useMemo, useState, useCallback, createContext, useContext } from "react";

/**
 * Emotsioonid – Minimal SPA Frontend
 * Stack: Vite + React + Tailwind (no external UI kit)
 * .env: VITE_API_URL (e.g. http://localhost:8000)
 *
 * Endpoints used:
 *  - POST   /auth/token                         (Django session auth)
 *  - GET    /students                           (teacher sees only their class)
 *  - GET    /emotions/by-student/{student_id}   (list history)
 *  - POST   /emotions                           (create new emotion entry)
 */

// ---------- Helpers
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": body instanceof FormData ? undefined : "application/json",
      ...headers,
    },
    credentials: 'include',  // Important for session cookies
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });
  if (!res.ok) {
    let detail = "";
    try { const data = await res.json(); detail = data?.detail || JSON.stringify(data); } catch {}
    throw new Error(`${res.status} ${res.statusText}${detail ? ` – ${detail}` : ""}`);
  }
  // some endpoints return no content
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

// ---------- Auth context
const AuthCtx = createContext(null);
function useAuth(){
  const ctx = useContext(AuthCtx);
  if(!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
function AuthProvider({ children }){
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const signIn = useCallback(async (username, password) => {
    // Django expects regular form-encoded or JSON body
    const data = await apiFetch("/auth/token", { 
      method: "POST", 
      body: { username, password }
    });
    setIsAuthenticated(true);
    setUser(data.user || { username });
    return data;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ isAuthenticated, user, setUser, signIn, signOut }), [isAuthenticated, user, signIn, signOut]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// ---------- UI Primitives
function Card({ className = "", children }){
  return (
    <div className={`rounded-2xl shadow-sm border border-slate-200 bg-white ${className}`}>{children}</div>
  );
}
function Button({ children, className = "", ...rest }){
  return (
    <button
      className={`px-4 py-2 rounded-xl border border-slate-300 hover:shadow-sm active:scale-[0.99] transition ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
function Input({ className = "", ...rest }){
  return (
    <input
      className={`w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 ${className}`}
      {...rest}
    />
  );
}
function Textarea({ className = "", ...rest }){
  return (
    <textarea
      className={`w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 ${className}`}
      {...rest}
    />
  );
}
function Badge({ children }){
  return <span className="text-xs px-2 py-1 rounded-full bg-slate-100 border border-slate-200">{children}</span>;
}

// ---------- Pages
function LoginPage(){
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e){
    e.preventDefault();
    setLoading(true);
    setError("");
    try{
      await signIn(username, password);
    }catch(err){
      setError(err.message || "Sisselogimine ebaõnnestus");
    }finally{ setLoading(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold mb-2">Emotsioonid</h1>
        <p className="text-slate-600 mb-6">Logi sisse, et näha oma klassi õpilasi ja lisada emotsioone.</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-slate-700">Kasutajanimi</label>
            <Input value={username} onChange={e=>setUsername(e.target.value)} autoFocus placeholder="teacher01" />
          </div>
          <div>
            <label className="text-sm text-slate-700">Parool</label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button disabled={loading} className="w-full bg-slate-900 text-white border-slate-900">
            {loading ? "Sisselogimine..." : "Logi sisse"}
          </Button>
        </form>
        <p className="mt-4 text-xs text-slate-500">API: {API_URL || "(määramata – seadista VITE_API_URL)"}</p>
      </Card>
    </div>
  );
}

function Dashboard(){
  const { signOut } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try{
      const data = await apiFetch("/students/");
      setStudents(Array.isArray(data) ? data : data?.results || []);
    }catch(err){
      setError(err.message);
      if(String(err.message).includes("401") || String(err.message).includes("403")) signOut();
    }finally{ setLoading(false); }
  }, [signOut]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between">
        <h1 className="text-lg md:text-xl font-semibold">Emotsioonid – Töölaud</h1>
        <div className="flex items-center gap-2">
          <Button onClick={loadStudents}>Värskenda</Button>
          <Button onClick={signOut} className="bg-white">Logi välja</Button>
        </div>
      </header>

      <main className="p-4 md:p-8">
        {loading && <div className="text-slate-600">Laen õpilasi…</div>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => (
            <Card key={s.id} className={`p-4 ${selected?.id===s.id ? "ring-2 ring-slate-400" : ""}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium">{s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`}</h3>
                  <div className="text-slate-600 text-sm">Klass: {s.class_label || "-"}</div>
                </div>
                <Badge>ID: {s.id}</Badge>
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={() => setSelected(s)} className="bg-slate-900 text-white border-slate-900">Lisa emotsioon</Button>
                <EmotionHistoryButton student={s} />
              </div>
            </Card>
          ))}
        </div>
      </main>

      {selected && <EmotionModal student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function EmotionHistoryButton({ student }){
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Ajalugu</Button>
      {open && <HistoryModal student={student} onClose={() => setOpen(false)} />}
    </>
  );
}

function Modal({ title, children, onClose }){
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg p-4" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button onClick={onClose}>Sulge</Button>
        </div>
        {children}
      </Card>
    </div>
  );
}

function EmotionModal({ student, onClose }){
  const [emotion, setEmotion] = useState(""); // e.g. happy/sad/angry/...
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function save(){
    setSaving(true); setError(""); setOk(false);
    try{
      await apiFetch("/emotions/", { method: "POST", body: {
        student_id: student.id,
        emotion,
        note
      }});
      setOk(true);
      setEmotion(""); setNote("");
    }catch(err){ setError(err.message); }
    finally{ setSaving(false); }
  }

  const disabled = !emotion.trim();

  return (
    <Modal title={`Lisa emotsioon – ${student.full_name || student.first_name || "Õpilane"}`} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-slate-700">Emotsioon</label>
          <Input placeholder="nt. rõõmus, kurb, ärev" value={emotion} onChange={e=>setEmotion(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-700">Märkus (valikuline)</label>
          <Textarea rows={4} placeholder="Lühike kirjeldus või kontekst" value={note} onChange={e=>setNote(e.target.value)} />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {ok && <div className="text-emerald-700 text-sm">Salvestatud!</div>}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Katkesta</Button>
          <Button onClick={save} disabled={saving || disabled} className={`bg-slate-900 text-white border-slate-900 ${disabled?"opacity-60 cursor-not-allowed":""}`}>
            {saving?"Salvestan…":"Salvesta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function HistoryModal({ student, onClose }){
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try{
        const data = await apiFetch(`/emotions/by-student/${student.id}/`);
        setItems(Array.isArray(data) ? data : data?.results || []);
      }catch(err){ setError(err.message); }
      finally{ setLoading(false); }
    })();
  }, [student.id]);

  return (
    <Modal title={`Emotsioonide ajalugu – ${student.full_name || student.first_name || "Õpilane"}`} onClose={onClose}>
      {loading && <div className="text-slate-600">Laen…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
          {items?.length ? items.map((it) => (
            <Card key={it.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{it.emotion}</div>
                <div className="text-xs text-slate-500">{formatDateTime(it.created_at)}</div>
              </div>
              {it.note && <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{it.note}</div>}
            </Card>
          )) : <div className="text-slate-600">Ajalugu puudub.</div>}
        </div>
      )}
    </Modal>
  );
}

function formatDateTime(dt){
  if(!dt) return "";
  try{
    const d = new Date(dt);
    return d.toLocaleString();
  }catch{ return String(dt); }
}

// ---------- Root
export default function App(){
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate(){
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}
