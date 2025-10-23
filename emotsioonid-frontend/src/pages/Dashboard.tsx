import React, { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { getStudents } from "../api";

export default function Dashboard() {
  const { token, signOut } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!token) return;
    getStudents(token)
      .then((r) => { if (active) setRows(r); })
      .catch((e) => setErr(e.message || "Load error"));
    return () => { active = false; };
  }, [token]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Minu klassi õpilased</h1>
        <button onClick={signOut} className="px-3 py-1 rounded border">Logi välja</button>
      </div>
      {err && <div className="text-red-600 mb-3">{err}</div>}
      <div className="grid gap-3">
        {rows.map((s) => (
          <div key={s.id} className="p-4 rounded-2xl shadow">
            <div className="font-medium">{s.first_name} {s.last_name}</div>
            <div className="text-sm text-gray-600">Klass: {s.class_label} • ID: {s.id}</div>
          </div>
        ))}
        {rows.length === 0 && !err && <div className="text-gray-600">Selles vaates pole veel õpilasi.</div>}
      </div>
    </div>
  );
}
