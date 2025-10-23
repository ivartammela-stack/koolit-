const API_URL = import.meta.env.VITE_API_URL as string;

export async function login(username: string, password: string) {
  const body = new URLSearchParams({ username, password });
  const res = await fetch(`${API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json() as Promise<{ access_token: string; token_type: string }>;
}

export async function getStudents(token: string) {
  const res = await fetch(`${API_URL}/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Students failed: ${res.status}`);
  return res.json();
}
