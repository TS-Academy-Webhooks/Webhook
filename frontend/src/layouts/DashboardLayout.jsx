import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./DashboardLayout.css";

function initials(name = "User") {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function readTheme() {
    try {
        return localStorage.getItem("webhook-theme") === "dark";
    } catch {
        return false;
    }
}

function writeTheme(isDark) {
    try {
        localStorage.setItem("webhook-theme", isDark ? "dark" : "light");
    } catch {
        // The current theme remains available until the page is closed.
    }
}

function setThemeColor(isDark) {
    const tag = document.querySelector('meta[name="theme-color"]');
    if (tag) tag.content = isDark ? "#141820" : "#f8faff";
}

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const menuButtonRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setDark(readTheme());
        document.documentElement.classList.toggle("dark", readTheme());
        setThemeColor(readTheme());
        const onThemeChange = (event) => {
            const next = Boolean(event.detail);
            setDark(next);
            document.documentElement.classList.toggle("dark", next);
            setThemeColor(next);
        };
        window.addEventListener("webhook-theme-change", onThemeChange);
        return () => window.removeEventListener("webhook-theme-change", onThemeChange);
    }, []);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 760px)");
        const syncViewport = () => {
            setIsMobile(media.matches);
            if (!media.matches) setSidebarOpen(false);
        };
        syncViewport();
        media.addEventListener?.("change", syncViewport);
        return () => media.removeEventListener?.("change", syncViewport);
    }, []);

    useEffect(() => setSidebarOpen(false), [location.pathname]);

    useEffect(() => {
        if (!sidebarOpen || !isMobile) return undefined;

        const sidebar = document.getElementById("app-sidebar");
        const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const previousFocus = document.activeElement;
        const focusable = Array.from(sidebar?.querySelectorAll(focusableSelector) ?? []);
        focusable[0]?.focus();

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                event.preventDefault();
                setSidebarOpen(false);
                menuButtonRef.current?.focus();
                return;
            }
            if (event.key !== "Tab" || focusable.length === 0) return;
            if (event.shiftKey && document.activeElement === focusable[0]) {
                event.preventDefault();
                focusable.at(-1)?.focus();
            } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
                event.preventDefault();
                focusable[0]?.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
        };
    }, [isMobile, sidebarOpen]);

    const titleParts = location.pathname.split("/").filter(Boolean);
    const title = titleParts.length
        ? titleParts.at(-1).replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
        : "Dashboard";
    const isAdmin = user?.role === "admin";

    function toggleTheme() {
        setDark((current) => {
            const next = !current;
            document.documentElement.classList.toggle("dark", next);
            setThemeColor(next);
            writeTheme(next);
            return next;
        });
    }

    function signOut() {
        void logout();
        navigate("/login", { replace: true });
    }

    const navClass = ({ isActive }) =>
        `app-sidebar__link${isActive ? " app-sidebar__link--active" : ""}`;

    return (
        <div className={`dashboard-shell ${dark ? "dashboard-shell--dark" : ""}`}>
            <a className="dashboard-skip-link" href="#main-content">Skip to main content</a>
            {isMobile && sidebarOpen && (
                <button
                    className="dashboard-shell__scrim"
                    aria-label="Close navigation"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <aside
                id="app-sidebar"
                className={`app-sidebar ${sidebarOpen ? "app-sidebar--open" : ""}`}
                aria-label="Workspace navigation"
                aria-hidden={isMobile && !sidebarOpen}
                inert={isMobile && !sidebarOpen}
                role={isMobile && sidebarOpen ? "dialog" : undefined}
                aria-modal={isMobile && sidebarOpen ? "true" : undefined}
            >
                <NavLink className="app-sidebar__brand" to="/dashboard">
                    <span className="app-sidebar__brand-mark" aria-hidden="true">W</span>
                    <span><strong>Waybridge</strong><small>Logistics workspace</small></span>
                </NavLink>

                <div className="app-sidebar__section-label">Workspace</div>
                <nav className="app-sidebar__nav" aria-label="Primary navigation">
                    <NavLink to="/dashboard" end className={navClass}>
                        <span className="app-sidebar__glyph" aria-hidden="true">⌂</span><span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/shipments" className={navClass}>
                        <span className="app-sidebar__glyph" aria-hidden="true">□</span><span>Shipments</span>
                    </NavLink>
                    <NavLink to="/webhooks" className={navClass}>
                        <span className="app-sidebar__glyph" aria-hidden="true">⌁</span><span>Webhooks</span>
                    </NavLink>
                    {isAdmin && (
                        <NavLink to="/events" className={navClass}>
                            <span className="app-sidebar__glyph" aria-hidden="true">◷</span><span>Events</span>
                        </NavLink>
                    )}
                    <NavLink to="/deliveries" className={navClass}>
                        <span className="app-sidebar__glyph" aria-hidden="true">↗</span><span>Deliveries</span>
                    </NavLink>
                </nav>

                <div className="app-sidebar__section-label app-sidebar__section-label--tools">Tools &amp; account</div>
                <nav className="app-sidebar__nav" aria-label="Tools and account navigation">
                    <NavLink to="/tools/demo-receiver" className={navClass}>
                        <span className="app-sidebar__glyph" aria-hidden="true">◎</span><span>Demo receiver</span>
                    </NavLink>
                    <NavLink to="/settings" end className={navClass}>
                        <span className="app-sidebar__glyph" aria-hidden="true">⚙</span><span>Settings</span>
                    </NavLink>
                </nav>

                <div className="app-sidebar__user">
                    <span className="app-sidebar__avatar" aria-hidden="true">{initials(user?.name)}</span>
                    <span className="app-sidebar__user-copy">
                        <strong>{user?.name || "Account"}</strong>
                        <small>{user?.email || "Signed in"}</small>
                    </span>
                    <span className="app-sidebar__role">{user?.role || "customer"}</span>
                </div>
            </aside>

            <div className="dashboard-shell__main">
                <header className="dashboard-topbar">
                    <div className="dashboard-topbar__leading">
                        <button
                            ref={menuButtonRef}
                            type="button"
                            className="dashboard-topbar__menu"
                            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
                            aria-expanded={sidebarOpen}
                            aria-controls="app-sidebar"
                            onClick={() => setSidebarOpen((open) => !open)}
                        >
                            {sidebarOpen ? "×" : "☰"}
                        </button>
                        <span className="dashboard-topbar__separator" aria-hidden="true" />
                        <span className="dashboard-topbar__breadcrumb">
                            Workspace <span aria-hidden="true">/</span> {title}
                        </span>
                    </div>
                    <div className="dashboard-topbar__actions">
                        <button
                            type="button"
                            className="dashboard-topbar__icon"
                            onClick={toggleTheme}
                            aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
                            title="Toggle appearance"
                        >
                            <span aria-hidden="true">{dark ? "☼" : "◐"}</span>
                        </button>
                        <button type="button" className="dashboard-topbar__logout" onClick={signOut}>Log out</button>
                    </div>
                </header>
                <main className="dashboard-layout__content" id="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
