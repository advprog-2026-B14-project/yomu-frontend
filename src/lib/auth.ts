function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    let decoded: string;
    if (typeof atob === "function") {
      decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    } else if (typeof Buffer !== "undefined") {
      decoded = Buffer.from(
        payload.replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf-8");
    } else {
      return null;
    }
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  username?: string;
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined")
    return null;
  return localStorage.getItem("token");
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined")
    return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp * 1000 > Date.now();
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
