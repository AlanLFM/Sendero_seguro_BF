import { useNavigate } from "react-router-dom";
import {
  Map,
  MessageSquare,
  FileText,
  BarChart3,
  User,
  LogOut,
  Cross,
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = ({ onLogout, isMobile, open, onClose }) => {
  const navigate = useNavigate();
  const cls = isMobile ? `sidebar${open ? " is-open" : ""}` : "sidebar";

  const go = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <aside className={cls}>
      <div>
        <div className="sidebar-brand">
          <h1>Sendero<br />Seguro</h1>
        </div>

        <p className="brand-subtitle">PROTECCIÓN ACADÉMICA</p>

        <nav className="sidebar-menu">
          <div className="sidebar-link" onClick={() => go("/dashboard")}>
            <Map size={17} />
            <span>Inicio/Mapa de Calor</span>
          </div>

          <div className="sidebar-link" onClick={() => go("/feed")}>
            <MessageSquare size={17} />
            <span>Feed Comunitario</span>
          </div>

          <div className="sidebar-link" onClick={() => go("/redactar-reporte")}>
            <FileText size={17} />
            <span>Redactar Reporte</span>
          </div>

          <div className="sidebar-link" onClick={() => go("/estadisticas")}>
            <BarChart3 size={17} />
            <span>Estadísticas (Admin)</span>
          </div>

          <div className="sidebar-link" onClick={() => go("/perfil")}>
            <User size={17} />
            <span>Mi Perfil</span>
          </div>

          <div className="sidebar-link" onClick={onLogout}>
            <LogOut size={17} />
            <span>Cerrar Sesión</span>
          </div>
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="sos-button">
          <Cross size={15} />
          EMERGENCIA SOS
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
