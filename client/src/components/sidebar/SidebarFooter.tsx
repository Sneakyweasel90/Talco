import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import Avatar from "../ui/Avatar";
import ThemePicker from "../overlays/ThemePicker";
import AccountSettings from "../overlays/AccountSettings";
import DMList from "../dm/DMList";
import type { OnlineUser, DMConversation, UserRole, UserStatus } from "../../types";

const STATUS_COLORS: Record<UserStatus, string> = { online: "#4ade80", away: "#facc15", dnd: "#f87171" };
const STATUS_LABELS: Record<UserStatus, string> = { online: "ONLINE", away: "AWAY", dnd: "DO NOT DISTURB" };

interface SidebarFooterProps {
  username: string;
  nickname: string | null;
  avatar: string | null;
  userId: number;
  token: string;
  role: string;
  customRoleName: string | null;
  onNicknameChange: (nickname: string | null) => void;
  onAvatarChange: (avatar: string | null) => void;
  onLogout: () => void;
  onlineUsers: OnlineUser[];
  dmConversations: DMConversation[];
  dmLoading: boolean;
  activeDMChannel: string | null;
  totalUnread: number;
  activeTab: "channels" | "dms";
  onTabChange: (tab: "channels" | "dms") => void;
  onSelectDM: (conv: DMConversation) => void;
  currentStatus: UserStatus;
  currentStatusText: string | null;
  onStatusChange: (status: UserStatus, statusText?: string | null) => void;
}

export default function SidebarFooter({
  username, nickname, avatar, userId, token, role, customRoleName,
  onNicknameChange, onAvatarChange, onLogout,
  onlineUsers, dmConversations, dmLoading, activeDMChannel, totalUnread,
  activeTab, onTabChange, onSelectDM,
  currentStatus, currentStatusText, onStatusChange,
}: SidebarFooterProps) {
  const { theme } = useTheme();
  const [showThemes, setShowThemes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const statusPickerRef = useRef<HTMLDivElement>(null);

  // Close status picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusPickerRef.current && !statusPickerRef.current.contains(e.target as Node)) {
        setShowStatusPicker(false);
      }
    };
    if (showStatusPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showStatusPicker]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* DM list */}
      {activeTab === "dms" && (
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <DMList
            conversations={dmConversations}
            activeDMChannel={activeDMChannel}
            onlineUsers={onlineUsers}
            onSelectDM={onSelectDM}
            loading={dmLoading}
          />
        </div>
      )}

      {activeTab === "channels" && <div style={{ flex: 1 }} />}

      {/* Tab switcher */}
      <div style={{ display: "flex", borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
        {(["channels", "dms"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              flex: 1, background: "none", border: "none",
              borderTop: `2px solid ${activeTab === tab ? theme.primary : "transparent"}`,
              color: activeTab === tab ? theme.primary : theme.textDim,
              fontSize: "0.6rem", fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: "0.1em", padding: "0.5rem 0.25rem",
              cursor: "pointer", transition: "all 0.15s", position: "relative",
            }}
          >
            {tab === "channels" ? "// CHANNELS" : "// DMs"}
            {tab === "dms" && totalUnread > 0 && (
              <span style={{
                position: "absolute", top: "4px", right: "8px",
                background: theme.primary, color: theme.background,
                borderRadius: "8px", padding: "0 4px",
                fontSize: "0.55rem", fontFamily: "'Share Tech Mono', monospace",
                fontWeight: 700, minWidth: "14px", textAlign: "center",
              }}>
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Theme row */}
      <div style={{
        padding: "0.35rem 0.75rem", borderTop: `1px solid ${theme.border}`,
        display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0,
      }}>
        <button
          onClick={() => setShowThemes(true)}
          style={{
            background: "none", border: `1px solid ${theme.border}`, cursor: "pointer",
            fontSize: "0.6rem", fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: "0.08em", padding: "3px 7px", borderRadius: "2px",
            transition: "all 0.15s", color: theme.textDim,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.primary; e.currentTarget.style.borderColor = theme.primaryDim; }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.textDim; e.currentTarget.style.borderColor = theme.border; }}
        >
          THEME
        </button>
      </div>

      {/* User bar */}
      <div style={{
        padding: "0.5rem 0.75rem", borderTop: `1px solid ${theme.border}`,
        display: "flex", alignItems: "center", gap: "0.5rem",
        flexShrink: 0, position: "relative",
      }}>
        {/* Status picker popup */}
        {showStatusPicker && (
          <div ref={statusPickerRef} style={{
            position: "absolute", bottom: "100%", left: 0, right: 0,
            background: theme.surface, border: `1px solid ${theme.primaryDim}`,
            borderRadius: "4px", padding: "0.5rem",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.5)", zIndex: 100,
          }}>
            <div style={{ fontSize: "0.58rem", fontFamily: "'Share Tech Mono', monospace", color: theme.textDim, letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
              // SET STATUS
            </div>
            {(["online", "away", "dnd"] as const).map(s => (
              <div
                key={s}
                onClick={() => { onStatusChange(s, currentStatusText); setShowStatusPicker(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "5px 6px", cursor: "pointer", borderRadius: "2px",
                  background: currentStatus === s ? theme.primaryGlow : "transparent",
                }}
                onMouseEnter={e => { if (currentStatus !== s) e.currentTarget.style.background = `${theme.primaryGlow}66`; }}
                onMouseLeave={e => { if (currentStatus !== s) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: STATUS_COLORS[s], flexShrink: 0 }} />
                <span style={{ fontSize: "0.7rem", fontFamily: "'Share Tech Mono', monospace", color: currentStatus === s ? theme.primary : theme.text }}>
                  {STATUS_LABELS[s]}
                </span>
              </div>
            ))}
            {/* Custom status text */}
            <div style={{ marginTop: "0.4rem", paddingTop: "0.4rem", borderTop: `1px solid ${theme.border}` }}>
              <input
                placeholder="Custom status..."
                value={currentStatusText ?? ""}
                maxLength={60}
                onChange={e => onStatusChange(currentStatus, e.target.value || null)}
                onClick={e => e.stopPropagation()}
                style={{
                  width: "100%", background: theme.primaryGlow,
                  border: `1px solid ${theme.border}`, borderRadius: "2px",
                  color: theme.primary, fontSize: "0.72rem", padding: "4px 6px",
                  fontFamily: "'Share Tech Mono', monospace", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}

        {/* Avatar with status dot */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, cursor: "pointer", minWidth: 0 }}
          onClick={() => setShowSettings(true)}
          title="Account settings"
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar username={nickname || username} avatar={avatar} size={28} />
            <div
              onClick={(e) => { e.stopPropagation(); setShowStatusPicker(s => !s); }}
              title="Set status"
              style={{
                position: "absolute", bottom: -1, right: -1,
                width: "9px", height: "9px", borderRadius: "50%",
                background: STATUS_COLORS[currentStatus],
                boxShadow: `0 0 5px ${STATUS_COLORS[currentStatus]}`,
                border: `1px solid ${theme.surface}`,
                cursor: "pointer",
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: "0.85rem", fontFamily: "'Share Tech Mono', monospace",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              color: theme.text,
            }}>
              {nickname || username}
            </div>
            {currentStatusText ? (
              <div style={{ fontSize: "0.58rem", color: STATUS_COLORS[currentStatus], fontFamily: "'Share Tech Mono', monospace", opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentStatusText}
              </div>
            ) : nickname ? (
              <div style={{ fontSize: "0.6rem", color: theme.textDim, fontFamily: "'Share Tech Mono', monospace", opacity: 0.6 }}>
                @{username}
              </div>
            ) : null}
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            background: "none", border: `1px solid ${theme.border}`, cursor: "pointer",
            fontSize: "0.6rem", fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: "0.1em", padding: "3px 6px", borderRadius: "2px",
            transition: "all 0.2s", flexShrink: 0, color: theme.textDim,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.error; e.currentTarget.style.borderColor = theme.error; }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.textDim; e.currentTarget.style.borderColor = theme.border; }}
        >
          EXIT
        </button>
      </div>

      {showThemes && <ThemePicker onClose={() => setShowThemes(false)} />}
      {showSettings && (
        <AccountSettings
          user={{ id: userId, username, nickname, avatar, token, role: role as UserRole, customRoleName }}
          onClose={() => setShowSettings(false)}
          onNicknameChange={onNicknameChange}
          onAvatarChange={onAvatarChange}
        />
      )}
    </div>
  );
}