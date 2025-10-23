import React, { useState } from "react";
import { useAuth } from "../auth";

export default function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const { signIn } = useAuth();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await signIn(username, password);
      onSuccess();
    } catch (e:any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-semibold mb-4">Logi sisse</h1>
        <label className="block mb-2">
          <span className="text-sm">Kasutajanimi</span>
          <input className="mt-1 w-full border rounded p-2" value={username} onChange={e=>setU(e.target.value)} />
        </label>
        <label className="block mb-4">
          <span className="text-sm">Parool</span>
          <input type="password" className="mt-1 w-full border rounded p-2" value={password} onChange={e=>setP(e.target.value)} />
        </label>
        {err && <div className="text-red-600 text-sm mb-3">{err}</div>}
        <button disabled={loading} className="w-full py-2 rounded bg-black text-white">
          {loading ? "Sisselogimine..." : "Logi sisse"}
        </button>
      </form>
    </div>
  );
}
