import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  MapPin,
  Wifi,
  Layers,
  ShieldCheck,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Topbar from "../Topbar/Topbar";
import DashboardMap from "./GoogleMap";
import { api } from "../../lib/api";
import "./Inicio.css";

const CATEGORY_COLORS = {
  robo: "danger",
  acoso: "danger",
  persona_sospechosa: "danger",
  infraestructura: "safe",
  emergencia_medica: "danger",
  violencia_agresion: "danger",
  accidente: "neutral",
  objeto_sospechoso: "danger",
  riesgo_ambiental: "safe",
  transporte_movilidad: "neutral",
  seguridad_preventiva: "safe",
  otro: "neutral",
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
};

const Inicio = () => {
  const outletContext = useOutletContext();
  const isMobile = outletContext?.isMobile || false;
  const navOpen = outletContext?.navOpen || false;
  const setNavOpen = outletContext?.setNavOpen || (() => {});
  const [sosLoading, setSosLoading] = useState(false);
  const [sosError, setSosError] = useState("");
  const [sosSuccess, setSosSuccess] = useState("");
  const [mapRefresh, setMapRefresh] = useState(0);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return !window.matchMedia("(max-width: 520px)").matches;
    }
    return true;
  });
  const mediaRef = useRef(null);

  const loadDashboardData = useCallback(async () => {
    try {
      const [reportsRes, alertsRes] = await Promise.all([
        api.get("/reports?page=1&limit=5&estado=pendiente"),
        api.get("/alerts?estado=activa"),
      ]);
      setReports(reportsRes.reports || []);
      setAlerts(alertsRes.alerts || []);
    } catch (err) {
      console.error("[DASHBOARD] Error al cargar datos:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (mapRefresh > 0) {
      loadDashboardData();
    }
  }, [mapRefresh, loadDashboardData]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 520px)");
    mediaRef.current = mq;
    const handler = (e) => setSidebarOpen(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const usuario = useMemo(() => {
    const saved = localStorage.getItem("sendero_user");
    return saved ? JSON.parse(saved) : {};
  }, []);

  const activeAlerts = alerts.length;
  const pendingReports = reports.length;
  const campusPercent = Math.max(0, 100 - activeAlerts * 8 - pendingReports * 3);

  const campusStatus = useMemo(() => {
    if (activeAlerts === 0 && pendingReports <= 2) {
      return { label: "SEGURO", color: "#89ef91", textColor: "#14691b" };
    }
    if (activeAlerts <= 2 && pendingReports <= 5) {
      return { label: "PRECAUCION", color: "#fde68a", textColor: "#92400e" };
    }
    return { label: "ALERTA", color: "#fca5a5", textColor: "#991b1b" };
  }, [activeAlerts, pendingReports]);

  const handleSOS = async () => {
    setSosLoading(true);
    setSosError("");
    setSosSuccess("");

    try {
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocalizacion no disponible"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await api.post("/alerts", {
        titulo: `SOS de ${usuario.nombre || usuario.boleta || "usuario"}`,
        latitud: pos.coords.latitude,
        longitud: pos.coords.longitude,
      });

      console.log("[SOS] Alerta creada exitosamente, refrescando mapa...");
      setMapRefresh((prev) => prev + 1);
      setSosSuccess("Alerta enviada.");
      setTimeout(() => setSosSuccess(""), 4000);
    } catch (err) {
      console.error("[SOS] Error al enviar alerta:", err.message);
      setSosError(err.message || "No se pudo enviar la alerta.");
    } finally {
      setSosLoading(false);
    }
  };

  return (
    <main className="main-content">
      <Topbar
        showMenuToggle={isMobile}
        onMenuToggle={() => setNavOpen((prev) => !prev)}
      />

      <section className="dashboard-banner">
        <div className="banner-left">
          <div className="banner-pill">VIGILANCIA EN TIEMPO REAL</div>
          <h2>Campus Zacatenco · ESCOM</h2>
          <p>Alertas activas y reportes pendientes supervisados en todo momento.</p>
        </div>
        <div className="banner-right">
          <div className="status-dot" />
          <span>Estado: {loading ? "Cargando..." : `${activeAlerts} alerta${activeAlerts !== 1 ? "s" : ""}, ${pendingReports} reporte${pendingReports !== 1 ? "s" : ""}`}</span>
        </div>
      </section>

      <section className="map-area">
        <div className="map-container">
          <DashboardMap refreshTrigger={mapRefresh} />

          <button
            className={`sos-float-btn ${sosLoading ? "loading" : ""} ${sosSuccess ? "success" : ""} ${sosError ? "error" : ""}`}
            onClick={handleSOS}
            disabled={sosLoading}
          >
            <div className="sos-float-icon">
              {sosLoading ? (
                <span className="sos-spinner" />
              ) : (
                <>
                  <Wifi size={16} />
                  <MapPin size={13} fill="white" />
                </>
              )}
            </div>
            <span className="sos-float-label">SOS</span>
          </button>
        </div>

        <aside className="map-sidebar">
          <button
            className="map-sidebar-mobile-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-expanded={sidebarOpen}
          >
            <span>
              {sidebarOpen ? "Ocultar panel" : "Mostrar panel"}
            </span>
            <span className="map-sidebar-mobile-toggle-summary">
              {activeAlerts} alerta{activeAlerts !== 1 ? "s" : ""} · {pendingReports} reporte{pendingReports !== 1 ? "s" : ""}
            </span>
            {sidebarOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <div className={`map-sidebar-content ${sidebarOpen ? "open" : "collapsed"}`}>
            <article className="sidebar-card status-card">
            <div className="sidebar-header">
              <h3>Estado del Campus</h3>
              <div
                className="safe-pill-small"
                style={{ background: campusStatus.color, color: campusStatus.textColor }}
              >
                {campusStatus.label}
              </div>
            </div>
            <div className="sidebar-stat">
              <strong>{loading ? "..." : `${campusPercent}%`}</strong>
              <span>Zonas vigiladas</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${campusPercent}%`, background: campusStatus.color }}
              />
            </div>
          </article>

          <article className="sidebar-card reports-card">
            <h3>Reportes Pendientes ({pendingReports})</h3>
            {loading && <span className="sidebar-loading">Cargando...</span>}
            {!loading && reports.length === 0 && (
              <span className="sidebar-empty">Sin reportes pendientes</span>
            )}
            {!loading && reports.slice(0, 4).map((report) => (
              <div className="sidebar-report-item" key={report.id}>
                <div className={`sidebar-report-icon ${CATEGORY_COLORS[report.categoria] || "neutral"}`}>
                  <EyeOff size={14} />
                </div>
                <div className="sidebar-report-text">
                  <strong>{report.titulo}</strong>
                  <span>{formatTimeAgo(report.createdAt)}</span>
                </div>
              </div>
            ))}
          </article>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Inicio;
