import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  ShieldCheck,
  MapPin,
  ThumbsUp,
  Share2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../lib/api";
import Topbar from "../components/Topbar/Topbar";
import "./Feed.css";

const PAGE_SIZE = 5;

const categoryStyles = {
  robo: "danger",
  acoso: "neutral",
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
  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const FeedComunitario = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertsToday, setAlertsToday] = useState(0);
  const [safePercent, setSafePercent] = useState(88);
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const navigate = useNavigate();
  const { isMobile, setNavOpen } = useOutletContext();

  const fetchPage = async (targetPage) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: targetPage,
        limit: PAGE_SIZE,
        estado: "pendiente",
      });

      const data = await api.get(`/reports?${params}`);

      setReportes(data.reports);
      setHasMore(data.pagination.hasMore);
      setPage(targetPage);
    } catch (err) {
      console.error("[FEED] Error al cargar reportes:", err.message);
      setError("No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await api.get("/reports?page=1&limit=100&estado=pendiente");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todays = data.reports.filter(
          (r) => new Date(r.createdAt) >= today
        );
        const total = todays.length;
        setAlertsToday(total);
        setSafePercent(Math.max(0, 100 - total * 5));
      } catch (err) {
        console.error("[FEED] Error al cargar resumen:", err.message);
        setAlertsToday(0);
        setSafePercent(88);
      }
    };

    loadSummary();
  }, []);

  const filteredReports = useMemo(() => {
    return reportes.filter((report) => {
      const matchesSearch = report.titulo
        ?.toLowerCase()
        .includes(searchValue.toLowerCase());
      const matchesCategory = filterValue ? report.categoria === filterValue : true;
      return matchesSearch && matchesCategory;
    });
  }, [reportes, searchValue, filterValue]);

  const campusStatus = useMemo(() => {
    if (alertsToday <= 2) {
      return {
        title: "Circulacion Normal",
        description: "Sin incidentes criticos reportados en las ultimas horas.",
      };
    }
    if (alertsToday <= 5) {
      return {
        title: "Precaucion",
        description: "Se detectaron reportes recientes. Mantente alerta.",
      };
    }
    return {
      title: "Alerta Activa",
      description: "Alta actividad de reportes. Evita zonas de riesgo.",
    };
  }, [alertsToday]);

  const handleNext = async () => {
    if (!hasMore || loading) return;
    await fetchPage(page + 1);
  };

  const handlePrev = async () => {
    if (page === 1 || loading) return;
    await fetchPage(page - 1);
  };

  return (
    <main className="feed-main">
      <Topbar
        showMenuToggle={isMobile}
        onMenuToggle={() => setNavOpen((prev) => !prev)}
        showSearch
        showFilters
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
      />

      <section className="feed-content">
        <div className="feed-heading">
          <div>
            <h1>Feed Comunitario</h1>
            <p>
              Mantente informado sobre los ultimos reportes de seguridad
              compartidos por la comunidad estudiantil de ESCOM.
            </p>
          </div>

          <div className="feed-actions">
            <button className="new-report-btn" onClick={() => navigate("/redactar-reporte")}>
              <Plus size={16} />
              <span className="btn-text">Nuevo Reporte</span>
            </button>
          </div>
        </div>

        <div className="summary-grid">
          <article className="summary-card alert">
            <span>ALERTAS HOY</span>
            <div>
              <strong>{String(alertsToday).padStart(2, "0")}</strong>
              <small>Pendientes</small>
            </div>
          </article>

          <article className="summary-card safe">
            <span>ZONAS SEGURAS</span>
            <div>
              <strong>{safePercent}%</strong>
              <small>Capacidad</small>
            </div>
          </article>

          <article className="campus-card">
            <div>
              <span>ESTADO DEL CAMPUS</span>
              <h2>{campusStatus.title}</h2>
              <p>{campusStatus.description}</p>
            </div>

            <ShieldCheck size={82} />
          </article>
        </div>

        {error && <div className="feed-error">{error}</div>}
        {loading && <div className="feed-loading">Cargando reportes...</div>}

        {!loading && filteredReports.length === 0 && (
          <div className="feed-empty">No hay reportes pendientes.</div>
        )}

        <div className="reports-list">
          {filteredReports.map((report) => (
            <article className="community-report" key={report.id}>
              <div className="report-main-info">
                <div className="report-meta">
                  <span
                    className={`report-category ${categoryStyles[report.categoria] || "neutral"}`}
                  >
                    {(report.categoria || "otro").replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="report-author">
                    Por: {report.esAnonimo ? "An\u00f3nimo" : (report.autorNombre || "Usuario")}
                  </span>
                  <small>{formatTimeAgo(report.createdAt)}</small>
                </div>

                <h2>{report.titulo}</h2>
                {report.descripcion && <p>{report.descripcion}</p>}
              </div>

              <aside className={`report-location-panel ${categoryStyles[report.categoria] || "neutral"}`}>
                <span>UBICACION</span>

                <div className="location-name">
                  <MapPin size={12} />
                  <strong>{report.ubicacionTexto}</strong>
                </div>

                {report.evidenciaUrl && (
                  <div className="report-thumb">
                    <img src={report.evidenciaUrl} alt="Evidencia" />
                  </div>
                )}

                <div className="report-buttons">
                  <button>
                    <ThumbsUp size={13} />
                    Util ({report.utiles || 0})
                  </button>

                  <button className="share-btn">
                    <Share2 size={14} />
                  </button>

                  <button className="detail-btn" onClick={() => setSelectedReport(report)}>
                    <Eye size={13} />
                    <span className="detail-btn-text">Ver a detalle</span>
                  </button>
                </div>
              </aside>
            </article>
          ))}
        </div>

        <div className="pagination">
          <button className="page-control" onClick={handlePrev} disabled={page === 1 || loading}>
            <ChevronLeft size={16} />
          </button>

          <button className="page-number active">{page}</button>

          <button className="page-control" onClick={handleNext} disabled={!hasMore || loading}>
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {selectedReport && (
        <div className="report-modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedReport(null)}>
              <X size={20} />
            </button>

            <div className="modal-header">
              <span
                className={`report-category ${categoryStyles[selectedReport.categoria] || "neutral"}`}
              >
                {(selectedReport.categoria || "otro").replace(/_/g, " ").toUpperCase()}
              </span>
              <span className="modal-date">{formatTimeAgo(selectedReport.createdAt)}</span>
            </div>

            <h2>{selectedReport.titulo}</h2>

            <div className="modal-meta">
              <span className="report-author">
                Por: {selectedReport.esAnonimo ? "An\u00f3nimo" : (selectedReport.autorNombre || "Usuario")}
              </span>
              <span className="modal-location">
                <MapPin size={12} />
                {selectedReport.ubicacionTexto}
              </span>
            </div>

            {selectedReport.descripcion && (
              <div className="modal-description">
                <h3>Descripcion</h3>
                <p>{selectedReport.descripcion}</p>
              </div>
            )}

            {selectedReport.evidenciaUrl && (
              <div className="modal-image">
                <img src={selectedReport.evidenciaUrl} alt="Evidencia" />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default FeedComunitario;
