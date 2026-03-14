import { useTheme } from "../../context/ThemeContext";
import Avatar from "../ui/Avatar";
import type { DMConversation, OnlineUser } from "../../types";

interface Props {
  conversation: DMConversation;
  onlineUsers: OnlineUser[];
}

const STATUS_COLORS = { online: "#4ade80", away: "#facc15", dnd: "#f87171" };
const STATUS_LABELS = { online: "ONLINE", away: "AWAY", dnd: "DO NOT DISTURB" };

export default function DMHeader({ conversation, onlineUsers }: Props) {
  const { theme } = useTheme();
  const userStatus = onlineUsers.find(u => u.id === conversation.other_user_id);
  const displayName = conversation.nickname || conversation.username;
  const dotColor = userStatus ? STATUS_COLORS[userStatus.status ?? "online"] : theme.border;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.6rem 1rem", borderBottom: `1px solid ${theme.border}`,
      background: theme.surface, flexShrink: 0,
    }}>
      <div style={{ position: "relative" }}>
        <Avatar username={displayName} avatar={conversation.avatar} size={28} />
        <div style={{
          position: "absolute", bottom: -1, right: -1,
          width: "8px", height: "8px", borderRadius: "50%",
          background: dotColor,
          boxShadow: userStatus ? `0 0 5px ${dotColor}` : "none",
          border: `1px solid ${theme.surface}`,
        }} />
      </div>

      <div>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: "0.95rem", color: theme.primary, letterSpacing: "0.04em",
        }}>
          {displayName}
        </span>
        {conversation.nickname && (
          <span style={{ fontSize: "0.65rem", color: theme.textDim, fontFamily: "'Share Tech Mono', monospace", marginLeft: "6px" }}>
            @{conversation.username}
          </span>
        )}
      </div>

      <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
        <span style={{ fontSize: "0.6rem", fontFamily: "'Share Tech Mono', monospace", color: userStatus ? dotColor : theme.textDim, opacity: 0.8 }}>
          {userStatus ? `● ${STATUS_LABELS[userStatus.status ?? "online"]}` : "○ OFFLINE"}
        </span>
        {userStatus?.statusText && (
          <span style={{ fontSize: "0.58rem", fontFamily: "'Share Tech Mono', monospace", color: theme.textDim, opacity: 0.6 }}>
            {userStatus.statusText}
          </span>
        )}
      </div>
    </div>
  );
}