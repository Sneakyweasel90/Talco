import { useTheme, themes } from "../../context/ThemeContext";
import styles from "./ThemePicker.module.css";

export default function ThemePicker({ onClose }: { onClose: () => void }) {
  const { themeName, setTheme } = useTheme();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <span className={styles.title}>THEMES</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.grid}>
          {Object.entries(themes).map(([key, t]) => {
            const isActive = key === themeName;
            return (
              <div
                key={key}
                className={styles.themeCard}
                onClick={() => setTheme(key)}
                style={{
                  border: `1px solid ${isActive ? t.primary : "rgba(255,255,255,0.08)"}`,
                  background: t.background,
                  boxShadow: isActive ? `0 0 12px ${t.primaryGlow}` : "none",
                }}
              >
                <div className={styles.preview}>
                  <div className={styles.previewSidebar} style={{ background: t.surface2 }} />
                  <div className={styles.previewMain} style={{ background: t.background }}>
                    <div className={styles.previewMsg} style={{ background: t.primaryGlow, borderColor: t.primary }} />
                    <div className={styles.previewMsgShort} style={{ background: t.primaryGlow, borderColor: t.primary }} />
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.cardName} style={{ color: isActive ? t.primary : "rgba(255,255,255,0.5)" }}>
                    {isActive ? "▶ " : ""}{t.name}
                  </span>
                  <div
                    className={styles.cardDot}
                    style={{ background: t.primary, boxShadow: `0 0 6px ${t.primary}` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}