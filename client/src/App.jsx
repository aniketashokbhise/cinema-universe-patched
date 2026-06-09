import { useState, useEffect, useContext, createContext, useCallback, useRef } from "react";

/* ─── API ─────────────────────────────────────────────────────────────── */
const API = "/api";

const api = async (path, opts = {}) => {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

/* ─── Cache Clear on App Load ────────────────────────────────────────── */
async function clearOutdatedCache() {
  try {
    // Server-side cache clear
    await fetch(`${API}/cache/clear`, { method: "POST" });
    // Client-side: clear old localStorage cache entries
    const cacheKeys = Object.keys(localStorage).filter(k => k.startsWith("cache_"));
    const maxAge = 1000 * 60 * 60 * 6; // 6 hours
    cacheKeys.forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        if (item?.timestamp && Date.now() - item.timestamp > maxAge) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    // Silently fail — cache clearing is non-critical
  }
}

/* ─── Auth Context ───────────────────────────────────────────────────── */
const AuthCtx = createContext(null);
function useAuth() { return useContext(AuthCtx); }

function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem("adminUser")); } catch { return null; }
  });
  const login = async (email, password) => {
    const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminUser", JSON.stringify(data.admin));
    setAdmin(data.admin);
  };
  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setAdmin(null);
  };
  return <AuthCtx.Provider value={{ admin, login, logout }}>{children}</AuthCtx.Provider>;
}

/* ─── Constants ──────────────────────────────────────────────────────── */
const GENRES = ["Action","Adventure","Comedy","Crime","Drama","Horror","Romance","Sci-Fi","Thriller","Animation","Fantasy","Mystery","Documentary"];
const CATEGORIES = ["Blockbuster","Classic","Cult","Award Winner","Mind-Bending","World Cinema","Space","Superhero","Bollywood"];
const LANGUAGES = ["English","Marathi","Hindi","Korean","Spanish","French","Japanese","Italian","German","Tamil","Telugu"];

const ENQUIRY_CATEGORIES = [
  { value: "movie",          label: "🎬 Movie Related" },
  { value: "web_series",     label: "📺 Web Series Related" },
  { value: "download_link",  label: "⬇ Download Link Issue" },
  { value: "website_issue",  label: "🌐 Website Issue" },
  { value: "other",          label: "💬 Other" },
];

const ENQUIRY_STATUS_META = {
  open:        { label: "Open",        color: "#f59e0b" },
  in_progress: { label: "In Progress", color: "#3b82f6" },
  resolved:    { label: "Resolved",    color: "#22c55e" },
  closed:      { label: "Closed",      color: "#6b7280" },
};

function enquiryCategoryLabel(val) {
  return ENQUIRY_CATEGORIES.find(c => c.value === val)?.label || val;
}

/* ─── Design Tokens ──────────────────────────────────────────────────── */
const DARK = {
  red: "#e50914", redDim: "#e5091422", redBorder: "#e5091444",
  bg: "#080808", surface: "#111111", surfaceHigh: "#181818",
  border: "#1e1e1e", borderMid: "#2a2a2a",
  textPrimary: "#ffffff", textSecondary: "#999999", textMuted: "#555555",
  green: "#22c55e", blue: "#3b82f6", gold: "#f5c518",
  navBg: "#080808ee", heroBg: "linear-gradient(160deg,#1a0000 0%,#0d0d0d 55%,#080808 100%)",
  isDark: true,
};
const LIGHT = {
  red: "#c8000e", redDim: "#c8000e18", redBorder: "#c8000e40",
  bg: "#f4f4f5", surface: "#ffffff", surfaceHigh: "#f0f0f2",
  border: "#e2e2e6", borderMid: "#d0d0d6",
  textPrimary: "#0f0f10", textSecondary: "#555560", textMuted: "#9999a8",
  green: "#16a34a", blue: "#2563eb", gold: "#b45309",
  navBg: "#ffffffee", heroBg: "linear-gradient(160deg,#fff0f0 0%,#fafafa 55%,#f4f4f5 100%)",
  isDark: false,
};

/* ─── Theme Context ──────────────────────────────────────────────────── */
const ThemeCtx = createContext({ C: DARK, dark: true, toggleTheme: () => {} });
function useTheme() { return useContext(ThemeCtx); }

function makeThemeProvider(storageKey) {
  return function ThemeProvider({ children }) {
    const [dark, setDark] = useState(() => {
      const stored = localStorage.getItem(storageKey);
      return stored ? stored === "dark" : true;
    });
    const toggleTheme = () => setDark(d => {
      localStorage.setItem(storageKey, !d ? "dark" : "light");
      return !d;
    });
    const C = dark ? DARK : LIGHT;
    return <ThemeCtx.Provider value={{ C, dark, toggleTheme }}>{children}</ThemeCtx.Provider>;
  };
}

const UserThemeProvider  = makeThemeProvider("cinemaTheme_user");
const AdminThemeProvider = makeThemeProvider("cinemaTheme_admin");

// Fallback for components that haven't migrated to useTheme() yet
const C = DARK;

const font = {
  display: "'Bebas Neue', sans-serif",
  body: "'DM Sans', sans-serif",
};

/* ─── Shared UI Components ───────────────────────────────────────────── */

const Badge = ({ children, color, small }) => {
  const { C: C_ } = useTheme();
  const _C = C_;
  color = color || _C.red;
  return (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 3, padding: small ? "1px 6px" : "2px 8px",
    fontSize: small ? 10 : 11, fontWeight: 600, letterSpacing: 0.3,
    whiteSpace: "nowrap",
  }}>{children}</span>
  );
};

const Btn = ({ children, onClick, variant = "primary", small, disabled, style: sx = {} }) => {
  const { C } = useTheme();
  const base = {
    border: "none", borderRadius: 6, cursor: disabled ? "default" : "pointer",
    fontFamily: font.body, fontWeight: 600, fontSize: small ? 12 : 14,
    padding: small ? "5px 12px" : "10px 22px",
    transition: "all 0.15s", opacity: disabled ? 0.5 : 1, ...sx,
  };
  const variants = {
    primary: { background: C.red, color: "#fff" },
    ghost:   { background: "transparent", color: C.textSecondary, border: `1px solid ${C.borderMid}` },
    danger:  { background: C.redDim, color: C.red, border: `1px solid ${C.redBorder}` },
    success: { background: "#22c55e22", color: C.green, border: "1px solid #22c55e44" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
};

const StarRating = ({ rating }) => {
  const { C } = useTheme();
  const stars = Math.round(rating / 2);
  return (
    <span style={{ color: C.gold, fontSize: 13 }}>
      {"★".repeat(stars)}{"☆".repeat(5 - stars)}
      <span style={{ color: C.textMuted, marginLeft: 5, fontSize: 12 }}>{rating?.toFixed(1)}</span>
    </span>
  );
};

const Modal = ({ onClose, children, maxWidth = 660 }) => {
  const { C } = useTheme();
  return (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0, background: "#000000dd", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", overflowY: "auto",
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: C.surface, borderRadius: 16, border: `1px solid ${C.borderMid}`,
        maxWidth, width: "100%", position: "relative",
        maxHeight: "calc(100vh - 32px)", overflowY: "auto",
        animation: "slideUp 0.2s ease",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 12, right: 12, background: C.surfaceHigh,
          border: `1px solid ${C.border}`, color: C.textSecondary, borderRadius: "50%",
          width: 30, height: 30, cursor: "pointer", fontSize: 16, zIndex: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >✕</button>
      {children}
    </div>
    <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
  </div>
);
}

/* ─── Movie Card ─────────────────────────────────────────────────────── */
const MovieCard = ({ movie, onClick }) => {
  const { C } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(movie)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.surface, borderRadius: 10, overflow: "hidden",
        cursor: "pointer", border: `1px solid ${hovered ? C.red : C.border}`,
        transform: hovered ? "translateY(-5px)" : "none",
        transition: "all 0.22s ease", position: "relative",
        boxShadow: hovered ? `0 12px 40px ${C.red}22` : "none",
      }}
    >
      {/* Poster */}
      <div style={{ height: 230, background: C.surfaceHigh, overflow: "hidden", position: "relative" }}>
        {movie.poster ? (
          <img
            src={movie.poster} alt={movie.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s", transform: hovered ? "scale(1.04)" : "scale(1)" }}
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, color: C.textMuted }}>🎬</div>
        )}
        {/* Rating badge */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "#000000cc", backdropFilter: "blur(4px)",
          borderRadius: 4, padding: "2px 7px", fontSize: 12, color: C.gold, fontWeight: 700,
        }}>★ {movie.rating?.toFixed(1)}</div>
        {/* Download badge */}
        {movie.downloadable && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            background: "#22c55ecc", backdropFilter: "blur(4px)",
            borderRadius: 4, padding: "2px 7px", fontSize: 10, color: "#fff", fontWeight: 700,
          }}>⬇ DL</div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: "12px 14px 14px" }}>
        <h3 style={{
          margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: C.textPrimary,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{movie.title}</h3>
        <p style={{ margin: "0 0 8px", fontSize: 11, color: C.textMuted }}>
          {movie.year} · {movie.director?.split(" ").slice(-1)[0]}
        </p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {movie.genre?.slice(0, 2).map(g => <Badge key={g} small>{g}</Badge>)}
        </div>
      </div>
    </div>
  );
};

/* ─── Movie Detail Modal ─────────────────────────────────────────────── */
function MovieDetailModal({ movie, onClose }) {
  const { C } = useTheme();

  // Collect available quality links (new multi-quality system)
  const qualityLinks = [
    { key: "p720",  label: "720p",  sub: "HD",  color: C.textPrimary, url: movie.downloadLinks?.p720  },
    { key: "p1080", label: "1080p", sub: "FHD", color: C.blue,        url: movie.downloadLinks?.p1080 },
    { key: "p4k",   label: "4K",    sub: "UHD", color: C.gold,        url: movie.downloadLinks?.p4k   },
  ].filter(q => q.url && q.url.trim() !== "");

  // Fallback to legacy single URL
  const hasLinks = qualityLinks.length > 0 || !!movie.downloadUrl;

  return (
    <Modal onClose={onClose}>
      <div>
        {movie.poster && (
          <div style={{ height: 300, overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
            <img src={movie.poster} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ margin: 0, fontFamily: font.display, fontSize: 28, letterSpacing: 1, color: C.textPrimary, flex: 1 }}>{movie.title}</h2>
            <span style={{ color: C.textMuted, fontSize: 13, paddingTop: 6 }}>{movie.duration} min</span>
          </div>
          <p style={{ color: C.textMuted, margin: "0 0 10px", fontSize: 13 }}>
            {movie.year} · {movie.director} · {movie.language}
          </p>
          <StarRating rating={movie.rating} />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", margin: "12px 0" }}>
            {movie.genre?.map(g => <Badge key={g}>{g}</Badge>)}
          </div>
          <p style={{ color: "#ccc", lineHeight: 1.65, margin: "0 0 18px", fontSize: 14 }}>{movie.description}</p>
          {movie.cast?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>Cast</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {movie.cast.map(c => <Badge key={c} color={C.blue}>{c}</Badge>)}
              </div>
            </div>
          )}
          {/* Stats row */}
          <div style={{ display: "flex", gap: 20, padding: "14px 18px", background: C.surfaceHigh, borderRadius: 8, marginBottom: 18, flexWrap: "wrap" }}>
            <div><p style={{ margin: 0, color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Views</p><p style={{ margin: 0, color: C.textPrimary, fontWeight: 700, fontSize: 16 }}>{movie.views?.toLocaleString()}</p></div>
            <div><p style={{ margin: 0, color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Rating</p><p style={{ margin: 0, color: C.gold, fontWeight: 700, fontSize: 16 }}>{movie.rating}/10</p></div>
            <div><p style={{ margin: 0, color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Language</p><p style={{ margin: 0, color: C.textPrimary, fontWeight: 700, fontSize: 16 }}>{movie.language}</p></div>
          </div>
          {/* Download section */}
          {movie.downloadable && hasLinks ? (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
              <p style={{ margin: 0, padding: "10px 14px", background: C.surfaceHigh, color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
                ⬇ Download — Choose Quality
              </p>
              {qualityLinks.length > 0
                ? qualityLinks.map(q => (
                    <a
                      key={q.key}
                      href={q.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
                        padding: "14px", borderTop: `1px solid ${C.border}`,
                        background: C.surface, textDecoration: "none", cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                      onMouseLeave={e => e.currentTarget.style.background = C.surface}
                    >
                      <span style={{ color: q.color, fontWeight: 800, fontSize: 18, fontFamily: font.display, letterSpacing: 1 }}>{q.label}</span>
                      <span style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{q.sub}</span>
                    </a>
                  ))
                : (
                    <a
                      href={movie.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "13px", background: C.surface, textDecoration: "none",
                        color: C.green, fontWeight: 700, fontSize: 15, fontFamily: font.body,
                        borderTop: `1px solid ${C.border}`,
                      }}
                    >
                      ⬇ Download Movie
                    </a>
                  )
              }
            </div>
          ) : (
            <div style={{
              width: "100%", background: C.surfaceHigh, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "13px", textAlign: "center",
              color: C.textMuted, fontSize: 13, boxSizing: "border-box",
            }}>
              Download not available for this title
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────── */
function Footer() {
  const { C } = useTheme();
  return (
    <footer style={{
      width: "100%",
      borderTop: `1px solid ${C.borderMid}`,
      background: C.surface,
      padding: "18px 16px",
      textAlign: "center",
      color: C.textSecondary,
      fontSize: 13,
      fontFamily: "'DM Sans', sans-serif",
      letterSpacing: 0.3,
      lineHeight: 1.6,
    }}>
      © 2026 Cinema Universe&nbsp;&nbsp;|&nbsp;&nbsp;All Rights Reserved&nbsp;&nbsp;|&nbsp;&nbsp;Designed &amp; Developed by{" "}
      <span style={{ color: C.textPrimary, fontWeight: 600 }}>Aniket Bhise</span>
    </footer>
  );
}

/* ─── User View ──────────────────────────────────────────────────────── */
function UserView() {
  const { C, dark, toggleTheme } = useTheme();
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [inputVal, setInputVal] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [liveViews, setLiveViews] = useState(null);
  const { setView } = useOuterView();

  // Real-time total visitor counter — fetch on mount then poll every 10s
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const res = await fetch(`${API}/visits/total`);
        const data = await res.json();
        setLiveViews(data.totalVisits);
      } catch {}
    };
    fetchVisits();
    const interval = setInterval(fetchVisits, 10000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, sort });
      if (search) params.set("search", search);
      if (genre) params.set("genre", genre);
      const data = await api(`/movies?${params}`);
      setMovies(data.movies);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [search, genre, page, sort]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = e => { e.preventDefault(); setSearch(inputVal); setPage(1); };

  /* Click-outside for mobile menu */
  const menuRef = useRef();
  useEffect(() => {
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        background: C.navBg, backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(16px, 4vw, 40px)", height: 60,
      }}>
        <div style={{ fontFamily: font.display, fontSize: 24, color: C.textPrimary, letterSpacing: 3 }}>
          <span style={{ color: C.red }}>CINEMA</span> UNIVERSE
        </div>
        {/* Nav right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Dark / Light toggle */}
          <button
            onClick={toggleTheme}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              background: C.surfaceHigh, border: `1px solid ${C.borderMid}`,
              borderRadius: 20, padding: "6px 13px", cursor: "pointer",
              fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center", gap: 6,
              color: C.textSecondary, fontFamily: font.body, fontSize: 12, fontWeight: 600,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.textSecondary; }}
          >
            {dark ? "☀ Light" : "🌙 Dark"}
          </button>
          {/* Admin button */}
          <button
            onClick={() => setView("adminLogin")}
            style={{
              background: "transparent", border: `1px solid ${C.borderMid}`,
              borderRadius: 6, padding: "7px 16px", color: C.textSecondary,
              cursor: "pointer", fontSize: 13, fontFamily: font.body, fontWeight: 600,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.textSecondary; }}
          >
            Admin →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{
        background: C.heroBg,
        padding: "clamp(40px,8vw,90px) clamp(16px,4vw,40px) clamp(30px,6vw,60px)",
        textAlign: "center", borderBottom: `1px solid ${C.border}`,
        position: "relative", overflow: "hidden",
      }}>
        {/* decorative grain overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", pointerEvents: "none", opacity: 0.5 }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
          <p style={{ fontSize: "clamp(11px,1.5vw,13px)", letterSpacing: 5, color: C.red, fontWeight: 700, marginBottom: 14, textTransform: "uppercase" }}>🎬 Your Cinema Destination</p>
          <h1 style={{
            fontFamily: font.display, fontSize: "clamp(48px,10vw,96px)",
            lineHeight: 0.95, margin: "0 0 18px", letterSpacing: 2, color: C.textPrimary,
          }}>
            Discover <span style={{ color: C.red }}>Cinema</span>
          </h1>
          <p style={{ color: C.textSecondary, margin: "0 0 36px", fontSize: "clamp(14px,2vw,17px)", fontStyle: "italic" }}>
            Search thousands of films. Find your next obsession.
          </p>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, maxWidth: 560, margin: "0 auto", flexWrap: "wrap" }}>
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Search movies, directors, actors..."
              style={{
                flex: 1, minWidth: 200, background: C.surfaceHigh, border: `1px solid ${C.borderMid}`,
                borderRadius: 8, padding: "13px 18px", color: C.textPrimary, fontSize: 15,
                outline: "none", fontFamily: font.body,
              }}
            />
            <button
              type="submit"
              style={{
                background: C.red, border: "none", borderRadius: 8, padding: "13px 22px",
                color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 15, fontFamily: font.body,
              }}
            >Search</button>
          </form>
          {/* Live views counter + request button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 8, padding: "8px 16px" }}>
              <span style={{ fontSize: 16 }}>👁</span>
              <div>
                <span style={{ color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, display: "block" }}>Total Visitors</span>
                <span style={{ color: C.textPrimary, fontWeight: 700, fontSize: 18, fontFamily: font.display, letterSpacing: 1 }}>
                  {liveViews !== null ? liveViews.toLocaleString() : "—"}
                </span>
              </div>
              {/* pulsing live dot */}
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, display: "inline-block", animation: "livePulse 2s ease-in-out infinite" }} />
            </div>
            <button
              onClick={() => setRequestOpen(true)}
              style={{
                background: "transparent", border: `1px solid ${C.borderMid}`, borderRadius: 8,
                padding: "8px 18px", color: C.textSecondary, cursor: "pointer",
                fontFamily: font.body, fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.textSecondary; }}
            >
              🎬 Request a Movie
            </button>
            <button
              onClick={() => setEnquiryOpen(true)}
              style={{
                background: "transparent", border: `1px solid ${C.borderMid}`, borderRadius: 8,
                padding: "8px 18px", color: C.textSecondary, cursor: "pointer",
                fontFamily: font.body, fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.textSecondary; }}
            >
              📩 Contact / Enquiry
            </button>
          </div>
          <style>{`@keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }`}</style>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "18px clamp(16px,4vw,32px) 0" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={genre} onChange={e => { setGenre(e.target.value); setPage(1); }}
            style={{ background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "9px 12px", color: C.textPrimary, cursor: "pointer", fontFamily: font.body, fontSize: 13 }}
          >
            <option value="">All Genres</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select
            value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
            style={{ background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "9px 12px", color: C.textPrimary, cursor: "pointer", fontFamily: font.body, fontSize: 13 }}
          >
            <option value="-createdAt">Newest First</option>
            <option value="-rating">Top Rated</option>
            <option value="-views">Most Viewed</option>
            <option value="title">A–Z</option>
            <option value="-year">Latest Year</option>
          </select>
          {(search || genre) && (
            <button
              onClick={() => { setSearch(""); setInputVal(""); setGenre(""); setPage(1); }}
              style={{ background: "transparent", border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "9px 14px", color: C.textSecondary, cursor: "pointer", fontFamily: font.body, fontSize: 13 }}
            >✕ Clear</button>
          )}
          <span style={{ marginLeft: "auto", color: C.textMuted, fontSize: 12 }}>{total} movies</span>
        </div>
      </div>

      {/* ── GRID ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px clamp(16px,4vw,32px) 40px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.textMuted }}>
            <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
            <p>Loading movies...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : movies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.textMuted }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🎭</div>
            <p style={{ fontSize: 16 }}>No movies found. Try a different search.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(clamp(140px, 18vw, 190px), 1fr))",
            gap: "clamp(12px, 2vw, 20px)",
            marginBottom: 32,
          }}>
            {movies.map(m => <MovieCard key={m._id} movie={m} onClick={async (mv) => {
              try { const detail = await api(`/movies/${mv._id}`); setSelected(detail); }
              catch { setSelected(mv); }
            }} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "20px 0" }}>
            <button
              disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "9px 18px", color: page === 1 ? C.textMuted : C.textPrimary, cursor: page === 1 ? "default" : "pointer", fontFamily: font.body }}
            >← Prev</button>
            <span style={{ padding: "9px 16px", color: C.textSecondary, fontSize: 13 }}>Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              style={{ background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "9px 18px", color: page === totalPages ? C.textMuted : C.textPrimary, cursor: page === totalPages ? "default" : "pointer", fontFamily: font.body }}
            >Next →</button>
          </div>
        )}
      </div>

      {selected && <MovieDetailModal movie={selected} onClose={() => setSelected(null)} />}
      {requestOpen && <MovieRequestModal onClose={() => setRequestOpen(false)} />}
      {enquiryOpen && <EnquiryModal onClose={() => setEnquiryOpen(false)} />}
    </div>
  );
}


/* ─── Movie Request Modal ────────────────────────────────────────────── */
function MovieRequestModal({ onClose }) {
  const { C } = useTheme();
  const [form, setForm] = useState({ title: "", year: "", director: "", language: "English", description: "", requestedBy: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, year: form.year ? parseInt(form.year) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit");
      setSuccess(true);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const inp = { background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "9px 12px", color: C.textPrimary, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: font.body };
  const lbl = { display: "block", color: C.textSecondary, fontSize: 10, marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 };

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <div style={{ padding: "28px 28px 32px" }}>
        <h3 style={{ color: C.textPrimary, margin: "0 0 6px", fontFamily: font.display, fontSize: 26, letterSpacing: 1 }}>Request a Movie</h3>
        <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 24px" }}>Can't find a movie? Let us know and we'll try to add it.</p>
        {success ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: C.green, fontWeight: 600, fontSize: 16, margin: "0 0 6px" }}>Request Submitted!</p>
            <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 20px" }}>Our admin will review and upload the movie if available.</p>
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={lbl}>Movie Title *</label>
                <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Oppenheimer" required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>Year (optional)</label>
                  <input style={inp} type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2023" min={1900} max={2030} />
                </div>
                <div>
                  <label style={lbl}>Language</label>
                  <select style={{ ...inp, cursor: "pointer" }} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Director (optional)</label>
                <input style={inp} value={form.director} onChange={e => setForm(f => ({ ...f, director: e.target.value }))} placeholder="e.g. Christopher Nolan" />
              </div>
              <div>
                <label style={lbl}>Your Name (optional)</label>
                <input style={inp} value={form.requestedBy} onChange={e => setForm(f => ({ ...f, requestedBy: e.target.value }))} placeholder="Anonymous" />
              </div>
              <div>
                <label style={lbl}>Additional Info (optional)</label>
                <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Any details to help us find the right movie…" />
              </div>
            </div>
            {error && <p style={{ color: C.red, fontSize: 13, margin: "12px 0 0" }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn disabled={loading}>{loading ? "Submitting…" : "Submit Request"}</Btn>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}


/* ─── Enquiry Modal (User-facing) ───────────────────────────────────── */
function EnquiryModal({ onClose }) {
  const { C } = useTheme();
  const [form, setForm] = useState({ name: "", email: "", category: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setSuccess(true);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const inp = {
    background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6,
    padding: "9px 12px", color: C.textPrimary, fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: font.body,
  };
  const lbl = { display: "block", color: C.textSecondary, fontSize: 10, marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 };

  return (
    <Modal onClose={onClose} maxWidth={500}>
      <div style={{ padding: "28px 28px 32px" }}>
        <h3 style={{ color: C.textPrimary, margin: "0 0 4px", fontFamily: font.display, fontSize: 26, letterSpacing: 1 }}>
          Contact / Enquiry
        </h3>
        <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 24px" }}>
          Have a question about a movie, web series, download link, or the website? We're here to help.
        </p>
        {success ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: C.green, fontWeight: 600, fontSize: 16, margin: "0 0 6px" }}>Enquiry Submitted!</p>
            <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 20px" }}>Our team will review your message and get back to you soon.</p>
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>Your Name *</label>
                  <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full Name" required />
                </div>
                <div>
                  <label style={lbl}>Email *</label>
                  <input style={inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label style={lbl}>Category *</label>
                <select style={{ ...inp, cursor: "pointer" }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                  <option value="">Select a category…</option>
                  {ENQUIRY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Subject *</label>
                <input style={inp} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief summary of your enquiry" required />
              </div>
              <div>
                <label style={lbl}>Message *</label>
                <textarea style={{ ...inp, minHeight: 90, resize: "vertical" }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe your question or issue in detail…" required />
              </div>
            </div>
            {error && <p style={{ color: C.red, fontSize: 13, margin: "12px 0 0" }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn disabled={loading}>{loading ? "Submitting…" : "Send Enquiry"}</Btn>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

/* ─── Outer View Context (for nested nav) ───────────────────────────── */
const OuterViewCtx = createContext({});
function useOuterView() { return useContext(OuterViewCtx); }

/* ─── Admin Login ────────────────────────────────────────────────────── */
function AdminLogin({ onBack }) {
  const { C } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await login(email, password); }
    catch (err) { setError(err.message); }
    setLoading(false);
  };

  const inp = {
    width: "100%", background: C.surfaceHigh, border: `1px solid ${C.borderMid}`,
    borderRadius: 8, padding: "11px 14px", color: C.textPrimary, fontSize: 14,
    boxSizing: "border-box", outline: "none", fontFamily: font.body,
  };
  const lbl = { display: "block", color: C.textSecondary, fontSize: 11, marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderMid}`, borderRadius: 16, padding: "clamp(28px,6vw,48px)", width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>🎬</div>
          <h2 style={{ color: C.textPrimary, margin: "0 0 4px", fontFamily: font.display, fontSize: 30, letterSpacing: 2 }}>Admin Portal</h2>
          <p style={{ color: C.textMuted, margin: 0, fontSize: 13 }}>Cinema Universe Management</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={inp} />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={lbl}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required style={inp} />
          </div>
          {error && <p style={{ color: C.red, fontSize: 13, margin: "0 0 14px", textAlign: "center" }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: "100%", background: C.red, border: "none", borderRadius: 8, padding: 13, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: font.body }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <button onClick={onBack} style={{ width: "100%", background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", marginTop: 16, fontSize: 13, fontFamily: font.body }}>
          ← Back to Movies
        </button>
        <p style={{ color: C.textMuted, fontSize: 11, textAlign: "center", marginTop: 14 }}></p>
      </div>
    </div>
  );
}

/* ─── Movie Form Modal ───────────────────────────────────────────────── */
const EMPTY_FORM = {
  title: "", description: "", genre: [], categories: [],
  year: new Date().getFullYear(), director: "", cast: "",
  rating: 7, poster: "", language: "English", duration: "",
  downloadable: false, downloadUrl: "", downloadLinks: { p720: "", p1080: "", p4k: "" },
};

function MovieFormModal({ movie, onClose, onSave }) {
  const { C } = useTheme();
  const [form, setForm] = useState(movie ? {
    ...movie,
    cast: Array.isArray(movie.cast) ? movie.cast.join(", ") : (movie.cast || ""),
    genre: movie.genre || [],
    categories: movie.categories || [],
    downloadLinks: movie.downloadLinks || { p720: "", p1080: "", p4k: "" },
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleArr = (field, val) =>
    setForm(f => ({ ...f, [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val] }));

  const handleSubmit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const payload = { ...form, cast: form.cast.split(",").map(s => s.trim()).filter(Boolean) };
      if (movie?._id) await api(`/movies/${movie._id}`, { method: "PUT", body: JSON.stringify(payload) });
      else await api("/movies", { method: "POST", body: JSON.stringify(payload) });
      onSave();
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const inp = { background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "9px 12px", color: C.textPrimary, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: font.body };
  const lbl = { display: "block", color: C.textSecondary, fontSize: 10, marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 };

  const ChipBtn = ({ label, active, onClick }) => (
    <button
      type="button" onClick={onClick}
      style={{
        background: active ? C.red : C.surfaceHigh, border: `1px solid ${active ? C.red : C.borderMid}`,
        borderRadius: 4, padding: "4px 10px", color: "#fff", cursor: "pointer", fontSize: 11, fontFamily: font.body,
      }}
    >{label}</button>
  );

  return (
    <Modal onClose={onClose} maxWidth={700}>
      <div style={{ padding: "28px 28px 32px" }}>
        <h3 style={{ color: C.textPrimary, margin: "0 0 24px", fontFamily: font.display, fontSize: 24, letterSpacing: 1 }}>
          {movie ? "Edit Movie" : "Add New Movie"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Title *</label>
              <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div>
              <label style={lbl}>Year *</label>
              <input style={inp} type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: +e.target.value }))} required min={1900} max={2030} />
            </div>
            <div>
              <label style={lbl}>Rating (0–10)</label>
              <input style={inp} type="number" step="0.1" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: +e.target.value }))} min={0} max={10} />
            </div>
            <div>
              <label style={lbl}>Director *</label>
              <input style={inp} value={form.director} onChange={e => setForm(f => ({ ...f, director: e.target.value }))} required />
            </div>
            <div>
              <label style={lbl}>Duration (min)</label>
              <input style={inp} type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Language</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Cast (comma separated)</label>
              <input style={inp} value={form.cast} onChange={e => setForm(f => ({ ...f, cast: e.target.value }))} placeholder="Actor 1, Actor 2…" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Poster URL</label>
              <input style={inp} value={form.poster} onChange={e => setForm(f => ({ ...f, poster: e.target.value }))} placeholder="https://…" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Description *</label>
              <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            </div>

            {/* Download Permission */}
            <div style={{ gridColumn: "1/-1", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: form.downloadable ? 12 : 0 }}>
                <div>
                  <p style={{ margin: 0, color: C.textPrimary, fontSize: 13, fontWeight: 600 }}>⬇ Allow Download</p>
                  <p style={{ margin: "2px 0 0", color: C.textMuted, fontSize: 11 }}>Users can download this movie from the website</p>
                </div>
                {/* Toggle switch */}
                <div
                  onClick={() => setForm(f => ({ ...f, downloadable: !f.downloadable }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                    background: form.downloadable ? C.green : C.borderMid,
                    position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: "absolute", top: 3, left: form.downloadable ? 23 : 3,
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    transition: "left 0.2s",
                  }} />
                </div>
              </div>
              {form.downloadable && (
                <div>
                  <p style={{ margin: "0 0 10px", color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Download Links by Quality</p>
                  {[
                    { key: "p720",  label: "720p HD",  color: C.textPrimary },
                    { key: "p1080", label: "1080p FHD", color: C.blue },
                    { key: "p4k",   label: "4K UHD",    color: C.gold },
                  ].map(({ key, label, color }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ width: 72, fontSize: 12, fontWeight: 700, color, fontFamily: font.body, flexShrink: 0 }}>{label}</span>
                      <input
                        style={{ ...inp, margin: 0, flex: 1 }}
                        value={form.downloadLinks?.[key] || ""}
                        onChange={e => setForm(f => ({ ...f, downloadLinks: { ...f.downloadLinks, [key]: e.target.value } }))}
                        placeholder="https://… (leave blank if unavailable)"
                      />
                    </div>
                  ))}
                  <p style={{ margin: "6px 0 0", color: C.textMuted, fontSize: 11 }}>Add at least one link. Empty fields will be hidden from users.</p>
                </div>
              )}
            </div>

            {/* Genres */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Genres</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {GENRES.map(g => <ChipBtn key={g} label={g} active={form.genre.includes(g)} onClick={() => toggleArr("genre", g)} />)}
              </div>
            </div>

            {/* Categories */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Categories</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {CATEGORIES.map(c => <ChipBtn key={c} label={c} active={form.categories.includes(c)} onClick={() => toggleArr("categories", c)} />)}
              </div>
            </div>
          </div>

          {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 14 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn onClick={() => {}} disabled={loading}>
              {loading ? "Saving…" : movie ? "Save Changes" : "Add Movie"}
            </Btn>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, color }) => {
  const { C } = useTheme();
  color = color || C.red;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: "0 0 8px", color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
          <p style={{ margin: 0, color: C.textPrimary, fontSize: 26, fontWeight: 800, fontFamily: font.display, letterSpacing: 1 }}>{value}</p>
        </div>
        <div style={{ background: color + "22", borderRadius: 10, padding: 10, fontSize: 20 }}>{icon}</div>
      </div>
    </div>
  );
};

/* ─── Admin Dashboard ────────────────────────────────────────────────── */
function AdminDashboard() {
  const { C, dark, toggleTheme } = useTheme();
  const { admin, logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [movies, setMovies] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [togglingDownload, setTogglingDownload] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [liveVisits, setLiveVisits] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsTotal, setRequestsTotal] = useState(0);
  const [requestsFilter, setRequestsFilter] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesTotal, setEnquiriesTotal] = useState(0);
  const [enquiriesFilter, setEnquiriesFilter] = useState("");
  const [enquiryCatFilter, setEnquiryCatFilter] = useState("");
  const [enquiryStats, setEnquiryStats] = useState(null);
  const [viewingEnquiry, setViewingEnquiry] = useState(null);

  const loadRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (requestsFilter) params.set("status", requestsFilter);
      const data = await api(`/requests?${params}`);
      setRequests(data.requests); setRequestsTotal(data.total);
    } catch (e) { console.error(e); }
  }, [requestsFilter]);

  const loadEnquiries = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (enquiriesFilter) params.set("status", enquiriesFilter);
      if (enquiryCatFilter) params.set("category", enquiryCatFilter);
      const data = await api(`/enquiries?${params}`);
      setEnquiries(data.enquiries); setEnquiriesTotal(data.total);
    } catch (e) { console.error(e); }
  }, [enquiriesFilter, enquiryCatFilter]);

  const loadEnquiryStats = useCallback(async () => {
    try { const data = await api("/enquiries/stats"); setEnquiryStats(data); } catch (e) {}
  }, []);

  const loadMovies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set("search", search);
      const data = await api(`/movies/admin/all?${params}`);
      setMovies(data.movies); setTotal(data.total); setTotalPages(data.totalPages);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, search]);

  const loadStats = useCallback(async () => {
    try { const data = await api("/movies/admin/stats"); setStats(data); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadStats(); loadEnquiryStats(); }, [loadStats, loadEnquiryStats]);
  useEffect(() => { if (tab === "movies") loadMovies(); }, [tab, loadMovies]);
  useEffect(() => { if (tab === "requests") loadRequests(); }, [tab, loadRequests]);
  useEffect(() => { if (tab === "enquiries") { loadEnquiries(); loadEnquiryStats(); } }, [tab, loadEnquiries, loadEnquiryStats]);

  // Real-time visitor counter for admin dashboard — polls every 10s
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const res = await fetch(`${API}/visits/total`);
        const data = await res.json();
        setLiveVisits(data.totalVisits);
      } catch {}
    };
    fetchVisits();
    const interval = setInterval(fetchVisits, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async id => {
    if (!confirm("Delete this movie permanently?")) return;
    setDeleting(id);
    try { await api(`/movies/${id}`, { method: "DELETE" }); loadMovies(); loadStats(); }
    catch (e) { alert(e.message); }
    setDeleting(null);
  };

  const handleToggleStatus = async id => {
    try { await api(`/movies/${id}/status`, { method: "PATCH" }); loadMovies(); }
    catch (e) { alert(e.message); }
  };

  const handleToggleDownload = async id => {
    setTogglingDownload(id);
    try { await api(`/movies/${id}/download`, { method: "PATCH" }); loadMovies(); loadStats(); }
    catch (e) { alert(e.message); }
    setTogglingDownload(null);
  };

  const tabStyle = active => ({
    background: "transparent", border: "none", cursor: "pointer",
    padding: "0 18px", height: "100%", color: active ? C.textPrimary : C.textMuted,
    fontWeight: active ? 600 : 400, fontSize: 13,
    borderBottom: active ? `2px solid ${C.red}` : "2px solid transparent",
    transition: "all 0.15s", fontFamily: font.body,
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* Header */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 8,
        padding: "0 clamp(16px,3vw,32px)", height: 60, position: "sticky", top: 0, zIndex: 200,
      }}>
        <div style={{ fontFamily: font.display, fontSize: 20, color: C.textPrimary, letterSpacing: 2, flexShrink: 0 }}>
          <span style={{ color: C.red }}>CINEMA</span> ADMIN
        </div>
        {/* Tabs – hidden on very small screens */}
        <div style={{ display: "flex", height: "100%", flex: 1, gap: 4, marginLeft: 16,overflowX: "auto"}}>
          {[["overview","📊 Overview"],["movies","🎬 Movies"],["requests","📥 Requests"],["enquiries","📩 Enquiries"]].map(([t,label]) => (
            <button key={t} style={tabStyle(tab === t)} onClick={() => { setTab(t); setMobileMenu(false); }}>
              {label}{t === "requests" && requestsTotal > 0 && <span style={{ marginLeft: 6, background: C.red, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700, verticalAlign: "middle" }}>{requestsTotal}</span>}{t === "enquiries" && enquiriesTotal > 0 && <span style={{ marginLeft: 6, background: "#3b82f6", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700, verticalAlign: "middle" }}>{enquiriesTotal}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ color: C.textMuted, fontSize: 12, display: "none" }} className="hide-sm">👤 {admin?.username}</span>
          <button
            onClick={toggleTheme}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              background: C.surfaceHigh, border: `1px solid ${C.borderMid}`,
              borderRadius: 20, padding: "4px 11px", cursor: "pointer",
              color: C.textSecondary, fontFamily: font.body, fontSize: 12, fontWeight: 600,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.textSecondary; }}
          >
            {dark ? "☀ Light" : "🌙 Dark"}
          </button>
          <Btn variant="ghost" small onClick={logout}>Logout</Btn>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px clamp(16px,3vw,32px)" }}>
        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div>
            <h2 style={{ margin: "0 0 22px", fontFamily: font.display, fontSize: 28, letterSpacing: 1 }}>Dashboard Overview</h2>
            {stats ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
                  <StatCard label="Total Movies" value={stats.total} icon="🎬" />
                  <StatCard label="Active" value={stats.active} icon="✅" color={C.green} />
                  <StatCard label="Archived" value={stats.archived} icon="📦" color="#888" />
                  <StatCard label="Downloadable" value={stats.downloadable ?? "—"} icon="⬇" color={C.blue} />
                  <StatCard label="Total Visitors" value={liveVisits !== null ? liveVisits.toLocaleString() : (stats.totalViews?.toLocaleString() ?? "—")} icon="👁" color={C.blue} />
                  <StatCard label="Open Enquiries" value={enquiryStats ? enquiryStats.open : "—"} icon="📩" color="#f59e0b" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                  {/* Top Movies */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
                    <h3 style={{ margin: "0 0 16px", color: C.textPrimary, fontSize: 15, fontWeight: 700 }}>Top Movies by Views</h3>
                    {stats.topMovies?.map((m, i) => (
                      <div key={m._id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: C.red, fontFamily: font.display, fontSize: 18, width: 24 }}>#{i + 1}</span>
                        {m.poster && <img src={m.poster} style={{ width: 34, height: 46, objectFit: "cover", borderRadius: 4 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{m.views?.toLocaleString()} views · ★ {m.rating}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Genre Distribution */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
                    <h3 style={{ margin: "0 0 16px", color: C.textPrimary, fontSize: 15, fontWeight: 700 }}>Genre Distribution</h3>
                    {stats.genreStats?.map(g => {
                      const pct = Math.round((g.count / stats.total) * 100);
                      return (
                        <div key={g._id} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "#ccc" }}>{g._id}</span>
                            <span style={{ fontSize: 11, color: C.textMuted }}>{g.count} ({pct}%)</span>
                          </div>
                          <div style={{ background: C.surfaceHigh, borderRadius: 4, height: 5 }}>
                            <div style={{ background: C.red, width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : <p style={{ color: C.textMuted }}>Loading stats…</p>}
          </div>
        )}

        {/* ── MOVIES TAB ── */}
        {tab === "movies" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ margin: 0, fontFamily: font.display, fontSize: 28, letterSpacing: 1 }}>Manage Movies <span style={{ color: C.textMuted, fontFamily: font.body, fontSize: 14, fontWeight: 400 }}>({total})</span></h2>
              <Btn onClick={() => setAdding(true)}>+ Add Movie</Btn>
            </div>
            <div style={{ marginBottom: 14 }}>
              <input
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by title or director…"
                style={{ background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "9px 14px", color: C.textPrimary, fontSize: 13, outline: "none", width: "clamp(200px,40%,340px)", fontFamily: font.body }}
              />
            </div>

            {/* Responsive table wrapper */}
            {loading ? (
              <p style={{ color: C.textMuted, textAlign: "center", padding: 48 }}>Loading…</p>
            ) : (
              <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: C.surfaceHigh }}>
                      {["Poster","Title","Year","Rating","Views","Download","Status","Actions"].map(h => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movies.map(m => (
                      <tr
                        key={m._id}
                        style={{ borderTop: `1px solid ${C.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "10px 14px" }}>
                          {m.poster
                            ? <img src={m.poster} style={{ width: 30, height: 40, objectFit: "cover", borderRadius: 3 }} />
                            : <span style={{ fontSize: 22 }}>🎬</span>}
                        </td>
                        <td style={{ padding: "10px 14px", maxWidth: 160 }}>
                          <div style={{ fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                          <div style={{ color: C.textMuted, fontSize: 10, marginTop: 2 }}>{m.director}</div>
                        </td>
                        <td style={{ padding: "10px 14px", color: C.textSecondary }}>{m.year}</td>
                        <td style={{ padding: "10px 14px", color: C.gold, fontWeight: 700 }}>★ {m.rating?.toFixed(1)}</td>
                        <td style={{ padding: "10px 14px", color: C.textSecondary }}>{m.views?.toLocaleString()}</td>
                        {/* Download toggle */}
                        <td style={{ padding: "10px 14px" }}>
                          <div
                            onClick={() => handleToggleDownload(m._id)}
                            style={{
                              width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                              background: m.downloadable ? C.green : C.borderMid,
                              position: "relative", transition: "background 0.2s",
                              opacity: togglingDownload === m._id ? 0.5 : 1,
                            }}
                          >
                            <div style={{
                              position: "absolute", top: 3, left: m.downloadable ? 20 : 3,
                              width: 16, height: 16, borderRadius: "50%", background: "#fff",
                              transition: "left 0.2s",
                            }} />
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{
                            background: m.status === "active" ? "#22c55e22" : "#88888822",
                            color: m.status === "active" ? C.green : "#888",
                            border: `1px solid ${m.status === "active" ? "#22c55e44" : "#44444444"}`,
                            borderRadius: 3, padding: "2px 8px", fontSize: 10, fontWeight: 600,
                          }}>{m.status}</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            <Btn small variant="ghost" onClick={() => setEditing(m)}>Edit</Btn>
                            <Btn small variant="ghost" onClick={() => handleToggleStatus(m._id)}>
                              {m.status === "active" ? "Archive" : "Activate"}
                            </Btn>
                            <Btn small variant="danger" onClick={() => handleDelete(m._id)} disabled={deleting === m._id}>
                              {deleting === m._id ? "…" : "Delete"}
                            </Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 18 }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "8px 16px", color: page === 1 ? C.textMuted : C.textPrimary, cursor: page === 1 ? "default" : "pointer", fontFamily: font.body, fontSize: 13 }}>← Prev</button>
                <span style={{ padding: "8px 14px", color: C.textSecondary, fontSize: 12 }}>Page {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "8px 16px", color: page === totalPages ? C.textMuted : C.textPrimary, cursor: page === totalPages ? "default" : "pointer", fontFamily: font.body, fontSize: 13 }}>Next →</button>
              </div>
            )}
          </div>
        )}

        {/* ── REQUESTS TAB ── */}
        {tab === "requests" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ margin: 0, fontFamily: font.display, fontSize: 28, letterSpacing: 1 }}>Movie Requests <span style={{ color: C.textMuted, fontFamily: font.body, fontSize: 14, fontWeight: 400 }}>({requestsTotal})</span></h2>
              <div style={{ display: "flex", gap: 8 }}>
                {["","pending","fulfilled","rejected"].map(s => (
                  <button key={s} onClick={() => { setRequestsFilter(s); setTimeout(loadRequests, 0); }}
                    style={{ background: requestsFilter === s ? C.red : C.surfaceHigh, border: `1px solid ${requestsFilter === s ? C.red : C.borderMid}`, borderRadius: 6, padding: "6px 14px", color: requestsFilter === s ? "#fff" : C.textSecondary, cursor: "pointer", fontSize: 12, fontFamily: font.body, fontWeight: 600, textTransform: "capitalize" }}>
                    {s || "All"}
                  </button>
                ))}
                <Btn small onClick={loadRequests}>↻ Refresh</Btn>
              </div>
            </div>
            {requests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📥</div>
                <p style={{ fontSize: 15 }}>No movie requests yet.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {requests.map(r => (
                  <div key={r._id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: C.textPrimary, fontSize: 15 }}>{r.title}</span>
                        {r.year && <Badge color={C.blue} small>{r.year}</Badge>}
                        {r.language && <Badge small>{r.language}</Badge>}
                        <Badge small color={r.status === "fulfilled" ? C.green : r.status === "rejected" ? C.red : C.gold}>
                          {r.status}
                        </Badge>
                      </div>
                      {r.director && <p style={{ margin: "0 0 3px", color: C.textMuted, fontSize: 12 }}>Director: {r.director}</p>}
                      {r.description && <p style={{ margin: "0 0 3px", color: C.textSecondary, fontSize: 12, fontStyle: "italic" }}>{r.description}</p>}
                      <p style={{ margin: "4px 0 0", color: C.textMuted, fontSize: 11 }}>
                        Requested by: {r.requestedBy || "Anonymous"} · {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                      {r.adminNote && <p style={{ margin: "6px 0 0", color: C.textSecondary, fontSize: 12, background: C.surfaceHigh, borderRadius: 4, padding: "4px 8px", display: "inline-block" }}>Note: {r.adminNote}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                      {r.status !== "fulfilled" && <Btn small variant="success" onClick={async () => { try { await api(`/requests/${r._id}`, { method: "PATCH", body: JSON.stringify({ status: "fulfilled" }) }); loadRequests(); } catch(e) { alert(e.message); } }}>✓ Fulfilled</Btn>}
                      {r.status !== "rejected" && <Btn small variant="ghost" onClick={async () => { try { await api(`/requests/${r._id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected" }) }); loadRequests(); } catch(e) { alert(e.message); } }}>✗ Reject</Btn>}
                      {r.status === "pending" && <Btn small variant="ghost" onClick={async () => { const note = prompt("Add admin note (optional):"); if(note !== null) { try { await api(`/requests/${r._id}`, { method: "PATCH", body: JSON.stringify({ status: "pending", adminNote: note }) }); loadRequests(); } catch(e) { alert(e.message); } } }}>📝 Note</Btn>}
                      <Btn small variant="danger" onClick={async () => { if(!confirm("Delete this request?")) return; try { await api(`/requests/${r._id}`, { method: "DELETE" }); loadRequests(); } catch(e) { alert(e.message); } }}>Del</Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>


        {/* ── ENQUIRIES TAB ── */}
        {tab === "enquiries" && (
          <div>
            {/* Stats row */}
            {enquiryStats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 22 }}>
                {[
                  { label: "Total",       value: enquiryStats.total,       color: C.red },
                  { label: "Open",        value: enquiryStats.open,        color: "#f59e0b" },
                  { label: "In Progress", value: enquiryStats.in_progress, color: C.blue },
                  { label: "Resolved",    value: enquiryStats.resolved,    color: C.green },
                  { label: "Closed",      value: enquiryStats.closed,      color: "#6b7280" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px" }}>
                    <p style={{ margin: "0 0 4px", color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</p>
                    <p style={{ margin: 0, color: s.color, fontSize: 24, fontWeight: 800, fontFamily: font.display }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ margin: 0, fontFamily: font.display, fontSize: 28, letterSpacing: 1 }}>
                User Enquiries <span style={{ color: C.textMuted, fontFamily: font.body, fontSize: 14, fontWeight: 400 }}>({enquiriesTotal})</span>
              </h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {/* Status filter */}
                <select
                  value={enquiriesFilter}
                  onChange={e => setEnquiriesFilter(e.target.value)}
                  style={{ background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "6px 10px", color: C.textPrimary, fontSize: 12, fontFamily: font.body, cursor: "pointer" }}
                >
                  <option value="">All Status</option>
                  {Object.entries(ENQUIRY_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                {/* Category filter */}
                <select
                  value={enquiryCatFilter}
                  onChange={e => setEnquiryCatFilter(e.target.value)}
                  style={{ background: C.surfaceHigh, border: `1px solid ${C.borderMid}`, borderRadius: 6, padding: "6px 10px", color: C.textPrimary, fontSize: 12, fontFamily: font.body, cursor: "pointer" }}
                >
                  <option value="">All Categories</option>
                  {ENQUIRY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <Btn small onClick={() => { loadEnquiries(); loadEnquiryStats(); }}>↻ Refresh</Btn>
              </div>
            </div>

            {enquiries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📩</div>
                <p style={{ fontSize: 15 }}>No enquiries found.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {enquiries.map(eq => {
                  const sm = ENQUIRY_STATUS_META[eq.status] || { label: eq.status, color: C.textMuted };
                  return (
                    <div key={eq._id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, color: C.textPrimary, fontSize: 14 }}>{eq.subject}</span>
                            <Badge small color={sm.color}>{sm.label}</Badge>
                            <Badge small color={C.blue}>{enquiryCategoryLabel(eq.category)}</Badge>
                          </div>
                          <p style={{ margin: "0 0 2px", color: C.textSecondary, fontSize: 12 }}>
                            <span style={{ fontWeight: 600 }}>{eq.name}</span>
                            &nbsp;·&nbsp;
                            <a href={`mailto:${eq.email}`} style={{ color: C.blue, textDecoration: "none" }}>{eq.email}</a>
                          </p>
                          <p style={{ margin: "4px 0", color: C.textSecondary, fontSize: 12, fontStyle: "italic", lineHeight: 1.5, maxHeight: 48, overflow: "hidden", textOverflow: "ellipsis" }}>{eq.message}</p>
                          {eq.adminReply && (
                            <div style={{ marginTop: 8, background: C.surfaceHigh, borderLeft: `3px solid ${C.green}`, borderRadius: "0 6px 6px 0", padding: "6px 10px" }}>
                              <p style={{ margin: "0 0 2px", color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Admin Reply</p>
                              <p style={{ margin: 0, color: C.textSecondary, fontSize: 12 }}>{eq.adminReply}</p>
                            </div>
                          )}
                          <p style={{ margin: "6px 0 0", color: C.textMuted, fontSize: 11 }}>
                            Received: {new Date(eq.createdAt).toLocaleString()}
                            {eq.repliedAt && ` · Replied: ${new Date(eq.repliedAt).toLocaleString()}`}
                          </p>
                        </div>
                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", alignItems: "flex-start" }}>
                          <Btn small onClick={() => setViewingEnquiry(eq)}>View & Reply</Btn>
                          {eq.status === "open" && (
                            <Btn small variant="ghost" onClick={async () => {
                              try { const updated = await api(`/enquiries/${eq._id}`, { method: "PATCH", body: JSON.stringify({ status: "in_progress" }) }); setEnquiries(prev => prev.map(x => x._id === eq._id ? updated : x)); loadEnquiryStats(); } catch(e) { alert(e.message); }
                            }}>In Progress</Btn>
                          )}
                          {eq.status !== "resolved" && (
                            <Btn small variant="success" onClick={async () => {
                              try { const updated = await api(`/enquiries/${eq._id}`, { method: "PATCH", body: JSON.stringify({ status: "resolved" }) }); setEnquiries(prev => prev.map(x => x._id === eq._id ? updated : x)); loadEnquiryStats(); } catch(e) { alert(e.message); }
                            }}>✓ Resolve</Btn>
                          )}
                          {eq.status !== "closed" && (
                            <Btn small variant="ghost" onClick={async () => {
                              try { const updated = await api(`/enquiries/${eq._id}`, { method: "PATCH", body: JSON.stringify({ status: "closed" }) }); setEnquiries(prev => prev.map(x => x._id === eq._id ? updated : x)); loadEnquiryStats(); } catch(e) { alert(e.message); }
                            }}>Close</Btn>
                          )}
                          <Btn small variant="danger" onClick={async () => {
                            if (!confirm("Delete this enquiry?")) return;
                            try { await api(`/enquiries/${eq._id}`, { method: "DELETE" }); loadEnquiries(); loadEnquiryStats(); } catch(e) { alert(e.message); }
                          }}>Del</Btn>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      {editing && <MovieFormModal movie={editing} onClose={() => setEditing(null)} onSave={() => { setEditing(null); loadMovies(); loadStats(); }} />}
      {adding && <MovieFormModal onClose={() => setAdding(false)} onSave={() => { setAdding(false); loadMovies(); loadStats(); }} />}
      {viewingEnquiry && (
        <EnquiryDetailModal
          enquiry={viewingEnquiry}
          onClose={() => setViewingEnquiry(null)}
          onUpdate={updated => { setEnquiries(prev => prev.map(x => x._id === updated._id ? updated : x)); loadEnquiryStats(); }}
        />
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 480px) {
          .hide-sm { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── App Root ───────────────────────────────────────────────────────── */
export default function App() {
  const [view, setView] = useState("user");

  // Clear outdated cache on app load
  useEffect(() => { clearOutdatedCache(); }, []);

  // Track website visit — once per browser session (not per React render)
  useEffect(() => {
    if (!sessionStorage.getItem("visitTracked")) {
      fetch(`${API}/visits/track`, { method: "POST" })
        .then(() => sessionStorage.setItem("visitTracked", "1"))
        .catch(() => {});
    }
  }, []);

  return (
    <AuthProvider>
      <OuterViewCtx.Provider value={{ view, setView }}>
        <AppContent />
      </OuterViewCtx.Provider>
    </AuthProvider>
  );
}

function AppContent() {
  const { admin } = useAuth();
  const { view, setView } = useOuterView();

  if (admin) return (
    <AdminThemeProvider>
      <AdminDashboard />
    </AdminThemeProvider>
  );
  if (view === "adminLogin") return (
    <AdminThemeProvider>
      <AdminLogin onBack={() => setView("user")} />
    </AdminThemeProvider>
  );
  return (
    <UserThemeProvider>
      <UserView />
      <Footer />
    </UserThemeProvider>
  );
}
