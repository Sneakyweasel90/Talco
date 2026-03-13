// ── Admin panel ───────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { AdminUser, UserRole } from "../../types";
import axios from "axios";
import Avatar from "../ui/Avatar";
import config from "../../config";
import InvitePanel from "./InvitePanel";

export default function AdminPanel({ token, currentUserId }: { token: string; currentUserId: number }) {
  const { theme } = useTheme();
  const [adminTab, setAdminTab] = useState<"users" | "invites">("users");
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [ownerId, setOwnerId]   = useState<number | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [customNames, setCustomNames] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${config.HTTP}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data.users);
      setOwnerId(data.ownerId);
      const names: Record<number, string> = {};
      for (const u of data.users) {
        if (u.role === "custom") names[u.id] = u.custom_role_name || "";
      }
      setCustomNames(names);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setRole = async (userId: number, role: UserRole) => {
    try {
      await axios.patch(
        `${config.HTTP}/api/admin/users/${userId}/role`,
        { role, customRoleName: customNames[userId] || "Member" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role, custom_role_name: role === "custom" ? (customNames[userId] || "Member") : null } : u));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) alert(err.response?.data?.error || "Failed");
    }
  };

  const saveCustomName = async (userId: number) => {
    try {
      await axios.patch(
        `${config.HTTP}/api/admin/users/${userId}/role`,
        { role: "custom", customRoleName: customNames[userId] || "Member" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, custom_role_name: customNames[userId] || "Member" } : u));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) alert(err.response?.data?.error || "Failed");
    }
  };

  const kick = async (userId: number, username: string) => {
    if (!window.confirm(`Kick ${username}? They will be logged out immediately.`)) return;
    try {
      await axios.post(`${config.HTTP}/api/admin/users/${userId}/kick`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`${username} has been kicked.`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) alert(err.response?.data?.error || "Failed");
    }
  };

  const ban = async (userId: number, username: string, isBanned: boolean) => {
    const action = isBanned ? "unban" : "ban";
    if (!isBanned && !window.confirm(`Ban ${username}? They will be logged out and blocked from logging in.`)) return;
    try {
      await axios.post(`${config.HTTP}/api/admin/users/${userId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned_at: isBanned ? null : new Date().toISOString() } : u));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) alert(err.response?.data?.error || "Failed");
    }
  };

  const roleColor = (role: UserRole) =>
    role === "admin" ? theme.error : role === "custom" ? theme.primary : theme.textDim;

  return (
    <div>
      {/* Sub-tab bar */}
      <div style={{ display: "flex", gap: "0", marginBottom: "1rem", borderBottom: `1px solid ${theme.border}` }}>
        {(["users", "invites"] as const).map(t => (
          <button
            key={t}
            onClick={() => setAdminTab(t)}
            style={{
              background: "none", border: "none",
              borderBottom: `2px solid ${adminTab === t ? theme.primary : "transparent"}`,
              color: adminTab === t ? theme.primary : theme.textDim,
              fontSize: "0.6rem", fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: "0.1em", padding: "0.4rem 0.75rem",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {t === "users" ? "USERS" : "INVITE CODES"}
          </button>
        ))}
      </div>

      {/* Users sub-tab */}
      {adminTab === "users" && (
        <>
          {loading && <div style={{ color: theme.textDim, fontSize: "0.75rem", padding: "1rem", textAlign: "center" }}>LOADING USERS...</div>}
          {error && <div style={{ color: theme.error, fontSize: "0.75rem", padding: "1rem" }}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {users.map(u => {
              const isSelf     = u.id === currentUserId;
              const isOwner    = u.id === ownerId;
              const isAdmin    = u.role === "admin";
              const isProtected = isOwner || (isAdmin && currentUserId !== ownerId);
              const isBanned   = !!u.banned_at;
              return (
                <div key={u.id} style={{
                  border: `1px solid ${isBanned ? theme.error : theme.border}`,
                  borderRadius: "3px", padding: "8px 10px",
                  background: isBanned ? `${theme.error}11` : theme.background,
                  opacity: isBanned ? 0.7 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: isProtected || isSelf ? 0 : "6px" }}>
                    <Avatar username={u.nickname || u.username} avatar={u.avatar} size={24} />
                    <span style={{ fontSize: "0.8rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: theme.text, flex: 1 }}>
                      {u.nickname || u.username}
                      {u.nickname && <span style={{ fontSize: "0.65rem", color: theme.textDim, fontWeight: 400 }}> @{u.username}</span>}
                      {isSelf && <span style={{ fontSize: "0.6rem", color: theme.textDim, fontWeight: 400 }}> (you)</span>}
                    </span>
                    <span style={{ fontSize: "0.6rem", fontFamily: "'Share Tech Mono', monospace", color: roleColor(u.role as UserRole) }}>
                      {u.role === "custom" ? u.custom_role_name : u.role}
                    </span>
                  </div>

                  {isProtected && !isSelf && (
                    <div style={{ fontSize: "0.6rem", color: theme.textDim, fontFamily: "'Share Tech Mono', monospace", marginTop: "4px", opacity: 0.6 }}>
                      {isOwner ? "server owner — cannot be modified" : "admin — only owner can modify"}
                    </div>
                  )}

                  {!isSelf && !isProtected && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                      <select
                        value={u.role}
                        onChange={e => setRole(u.id, e.target.value as UserRole)}
                        style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, fontSize: "0.65rem", fontFamily: "'Share Tech Mono', monospace", padding: "2px 4px", borderRadius: "2px", cursor: "pointer" }}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="custom">custom</option>
                      </select>

                      {u.role === "custom" && (
                        <>
                          <input
                            value={customNames[u.id] ?? u.custom_role_name ?? ""}
                            onChange={e => setCustomNames(prev => ({ ...prev, [u.id]: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && saveCustomName(u.id)}
                            placeholder="role name"
                            style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, fontSize: "0.65rem", fontFamily: "'Share Tech Mono', monospace", padding: "2px 6px", borderRadius: "2px", width: "90px", outline: "none" }}
                          />
                          <button onClick={() => saveCustomName(u.id)} style={{ ...btnStyle, color: theme.primary, borderColor: theme.primaryDim }}>
                            SAVE
                          </button>
                        </>
                      )}

                      <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
                        <button onClick={() => kick(u.id, u.username)} style={{ ...btnStyle, color: theme.textDim, borderColor: theme.border }}>
                          KICK
                        </button>
                        <button
                          onClick={() => ban(u.id, u.username, isBanned)}
                          style={{ ...btnStyle, color: isBanned ? "#4ade80" : theme.error, borderColor: isBanned ? "#4ade80" : theme.error }}
                        >
                          {isBanned ? "UNBAN" : "BAN"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Invites sub-tab */}
      {adminTab === "invites" && <InvitePanel token={token} />}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid",
  cursor: "pointer",
  fontSize: "0.6rem",
  padding: "2px 7px",
  borderRadius: "2px",
  fontFamily: "'Share Tech Mono', monospace",
  letterSpacing: "0.08em",
  transition: "all 0.15s",
};