import React, { useEffect, useMemo, useState, useCallback, createContext, useContext } from "react";
import FuturisticLogin from "./components/NeonAuthKit";

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
  try { const data = await res.json(); detail = data?.detail || JSON.stringify(data); } catch { /* ignore parse errors */ }
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
function Card({ className = "", children, ...rest }){
  return (
    <div className={`rounded-2xl shadow-sm border border-slate-200 bg-white ${className}`} {...rest}>
      {children}
    </div>
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
  // Neon login: call signIn when form submits
  // Note: NeonAuthKit uses "email" field, but we pass it as username to backend
  return <FuturisticLogin onSignIn={async ({ email, password }) => {
    // Backend expects "username", not "email"
    await signIn(email, password);
  }} />;
}

function Dashboard(){
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  if(isAdmin) return <AdminDashboard />;
  return <TeacherDashboard />;
}

function TeacherDashboard(){
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

function AdminDashboard(){
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("schools");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 md:px-8 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg md:text-xl font-semibold">Admin Halduspaneel</h1>
          <Button onClick={signOut} className="bg-white">Logi välja</Button>
        </div>
        <nav className="flex gap-2 overflow-x-auto">
          <TabButton active={activeTab==="schools"} onClick={()=>setActiveTab("schools")}>Koolid</TabButton>
          <TabButton active={activeTab==="students"} onClick={()=>setActiveTab("students")}>Õpilased</TabButton>
          <TabButton active={activeTab==="users"} onClick={()=>setActiveTab("users")}>Kasutajad</TabButton>
          <TabButton active={activeTab==="emotions"} onClick={()=>setActiveTab("emotions")}>Emotsioonid</TabButton>
        </nav>
      </header>

      <main className="p-4 md:p-8">
        {activeTab==="schools" && <SchoolsAdmin />}
        {activeTab==="students" && <StudentsAdmin />}
        {activeTab==="users" && <UsersAdmin />}
        {activeTab==="emotions" && <EmotionsAdmin />}
      </main>
    </div>
  );
}

function TabButton({active, onClick, children}){
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
        active 
          ? "bg-slate-900 text-white" 
          : "bg-white border border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
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

// ========== ADMIN COMPONENTS ==========

function SchoolsAdmin(){
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  const loadSchools = useCallback(async () => {
    setLoading(true); setError("");
    try{
      const data = await apiFetch("/schools/");
      setSchools(Array.isArray(data) ? data : data?.results || []);
    }catch(err){ setError(err.message); }
    finally{ setLoading(false); }
  }, []);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  async function deleteSchool(id){
    if(!confirm("Kas oled kindel?")) return;
    try{
      await apiFetch(`/schools/${id}/`, {method:"DELETE"});
      loadSchools();
    }catch(err){ alert(err.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Koolid</h2>
        <Button onClick={()=>setEditing({})} className="bg-slate-900 text-white border-slate-900">+ Lisa kool</Button>
      </div>

      {loading && <div className="text-slate-600">Laen…</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="grid gap-3">
        {schools.map(s=>(
          <Card key={s.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg">{s.name}</h3>
                <div className="text-sm text-slate-500">ID: {s.id}</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={()=>setEditing(s)}>Muuda</Button>
                <Button onClick={()=>deleteSchool(s.id)} className="border-red-300 text-red-700">Kustuta</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editing && <SchoolEditModal school={editing} onClose={()=>{setEditing(null); loadSchools();}} />}
    </div>
  );
}

function SchoolEditModal({school, onClose}){
  const [name, setName] = useState(school.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(){
    setSaving(true); setError("");
    try{
      const method = school.id ? "PUT" : "POST";
      const url = school.id ? `/schools/${school.id}/` : "/schools/";
      await apiFetch(url, {method, body:{name}});
      onClose();
    }catch(err){ setError(err.message); }
    finally{ setSaving(false); }
  }

  return (
    <Modal title={school.id ? "Muuda kooli" : "Lisa kool"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-slate-700">Kooli nimi</label>
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="nt. Tallinna Kesklinna Gümnaasium" />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Tühista</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-slate-900 text-white border-slate-900">
            {saving?"Salvestan…":"Salvesta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function StudentsAdmin(){
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try{
      const [stData, scData] = await Promise.all([
        apiFetch("/students/"),
        apiFetch("/schools/")
      ]);
      setStudents(Array.isArray(stData) ? stData : stData?.results || []);
      setSchools(Array.isArray(scData) ? scData : scData?.results || []);
    }catch(err){ setError(err.message); }
    finally{ setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function deleteStudent(id){
    if(!confirm("Kas oled kindel?")) return;
    try{
      await apiFetch(`/students/${id}/`, {method:"DELETE"});
      loadData();
    }catch(err){ alert(err.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Õpilased</h2>
        <Button onClick={()=>setEditing({})} className="bg-slate-900 text-white border-slate-900">+ Lisa õpilane</Button>
      </div>

      {loading && <div className="text-slate-600">Laen…</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="grid gap-3">
        {students.map(s=>(
          <Card key={s.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg">{s.full_name || `${s.first_name} ${s.last_name}`}</h3>
                <div className="text-sm text-slate-600">Klass: {s.class_label}</div>
                <div className="text-xs text-slate-500">Kool ID: {s.school || "-"}</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={()=>setEditing(s)}>Muuda</Button>
                <Button onClick={()=>deleteStudent(s.id)} className="border-red-300 text-red-700">Kustuta</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editing && <StudentEditModal student={editing} schools={schools} onClose={()=>{setEditing(null); loadData();}} />}
    </div>
  );
}

function StudentEditModal({student, schools, onClose}){
  const [firstName, setFirstName] = useState(student.first_name || "");
  const [lastName, setLastName] = useState(student.last_name || "");
  const [classLabel, setClassLabel] = useState(student.class_label || "");
  const [school, setSchool] = useState(student.school || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(){
    setSaving(true); setError("");
    try{
      const method = student.id ? "PUT" : "POST";
      const url = student.id ? `/students/${student.id}/` : "/students/";
      await apiFetch(url, {method, body:{
        first_name: firstName,
        last_name: lastName,
        class_label: classLabel,
        school: school || null
      }});
      onClose();
    }catch(err){ setError(err.message); }
    finally{ setSaving(false); }
  }

  const disabled = !firstName.trim() || !lastName.trim() || !classLabel.trim();

  return (
    <Modal title={student.id ? "Muuda õpilast" : "Lisa õpilane"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-slate-700">Eesnimi</label>
          <Input value={firstName} onChange={e=>setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-700">Perekonnanimi</label>
          <Input value={lastName} onChange={e=>setLastName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-700">Klass</label>
          <Input value={classLabel} onChange={e=>setClassLabel(e.target.value)} placeholder="nt. 9A" />
        </div>
        <div>
          <label className="text-sm text-slate-700">Kool (valikuline)</label>
          <select 
            value={school} 
            onChange={e=>setSchool(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Vali kool...</option>
            {schools.map(sc=><option key={sc.id} value={sc.id}>{sc.name}</option>)}
          </select>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Tühista</Button>
          <Button onClick={save} disabled={saving || disabled} className="bg-slate-900 text-white border-slate-900">
            {saving?"Salvestan…":"Salvesta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function UsersAdmin(){
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true); setError("");
    try{
      const data = await apiFetch("/users/");
      setUsers(Array.isArray(data) ? data : data?.results || []);
    }catch(err){ setError(err.message); }
    finally{ setLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function deleteUser(id){
    if(!confirm("Kas oled kindel?")) return;
    try{
      await apiFetch(`/users/${id}/`, {method:"DELETE"});
      loadUsers();
    }catch(err){ alert(err.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Kasutajad (Õpetajad & Adminid)</h2>
        <Button onClick={()=>setEditing({})} className="bg-slate-900 text-white border-slate-900">+ Lisa kasutaja</Button>
      </div>

      {loading && <div className="text-slate-600">Laen…</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="grid gap-3">
        {users.map(u=>(
          <Card key={u.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg">{u.username}</h3>
                <div className="text-sm text-slate-600">
                  {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : ""}
                  {(u.first_name || u.last_name) && " • "}
                  {u.email}
                </div>
                <div className="flex gap-2 mt-1">
                  <Badge>{u.role === 'admin' ? 'Admin' : 'Õpetaja'}</Badge>
                  {u.class_label && <Badge>Klass: {u.class_label}</Badge>}
                  {!u.is_active && <Badge>Mitteaktiivne</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={()=>setEditing(u)}>Muuda</Button>
                <Button onClick={()=>deleteUser(u.id)} className="border-red-300 text-red-700">Kustuta</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editing && <UserEditModal user={editing} onClose={()=>{setEditing(null); loadUsers();}} />}
    </div>
  );
}

function UserEditModal({user, onClose}){
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [role, setRole] = useState(user.role || "teacher");
  const [classLabel, setClassLabel] = useState(user.class_label || "");
  const [isActive, setIsActive] = useState(user.is_active !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(){
    setSaving(true); setError("");
    try{
      const method = user.id ? "PUT" : "POST";
      const url = user.id ? `/users/${user.id}/` : "/users/";
      const body = {
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        class_label: classLabel || null,
        is_active: isActive
      };
      if(password.trim()) body.password = password;
      else if(!user.id) {
        setError("Parool on kohustuslik uue kasutaja loomisel");
        setSaving(false);
        return;
      }
      
      await apiFetch(url, {method, body});
      onClose();
    }catch(err){ setError(err.message); }
    finally{ setSaving(false); }
  }

  const disabled = !username.trim() || !email.trim();

  return (
    <Modal title={user.id ? "Muuda kasutajat" : "Lisa kasutaja"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-slate-700">Kasutajanimi *</label>
          <Input value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-700">E-post *</label>
          <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-700">Parool {user.id ? "(jäta tühjaks, kui ei muuda)" : "*"}</label>
          <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={user.id ? "Jäta tühjaks..." : "Sisesta parool"} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-700">Eesnimi</label>
            <Input value={firstName} onChange={e=>setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-700">Perekonnanimi</label>
            <Input value={lastName} onChange={e=>setLastName(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-700">Roll *</label>
          <select 
            value={role} 
            onChange={e=>setRole(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="teacher">Õpetaja</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {role === 'teacher' && (
          <div>
            <label className="text-sm text-slate-700">Klass (õpetajale)</label>
            <Input value={classLabel} onChange={e=>setClassLabel(e.target.value)} placeholder="nt. 9A" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="is-active" 
            checked={isActive} 
            onChange={e=>setIsActive(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="is-active" className="text-sm text-slate-700">Kasutaja on aktiivne</label>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Tühista</Button>
          <Button onClick={save} disabled={saving || disabled} className="bg-slate-900 text-white border-slate-900">
            {saving?"Salvestan…":"Salvesta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EmotionsAdmin(){
  const [emotions, setEmotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmotions = useCallback(async () => {
    setLoading(true); setError("");
    try{
      const data = await apiFetch("/emotions/");
      setEmotions(Array.isArray(data) ? data : data?.results || []);
    }catch(err){ setError(err.message); }
    finally{ setLoading(false); }
  }, []);

  useEffect(() => { loadEmotions(); }, [loadEmotions]);

  async function deleteEmotion(id){
    if(!confirm("Kas oled kindel?")) return;
    try{
      await apiFetch(`/emotions/${id}/`, {method:"DELETE"});
      loadEmotions();
    }catch(err){ alert(err.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Kõik emotsioonide kirjed</h2>
        <Button onClick={loadEmotions}>Värskenda</Button>
      </div>

      {loading && <div className="text-slate-600">Laen…</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="grid gap-3">
        {emotions.map(e=>(
          <Card key={e.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge>{e.emotion}</Badge>
                  <span className="text-xs text-slate-500">{formatDateTime(e.created_at)}</span>
                </div>
                <div className="text-sm text-slate-600">Õpilane ID: {e.student_id}</div>
                {e.note && <div className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{e.note}</div>}
                <div className="text-xs text-slate-500 mt-1">Lisas: {e.created_by_username}</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={()=>deleteEmotion(e.id)} className="border-red-300 text-red-700">Kustuta</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
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
