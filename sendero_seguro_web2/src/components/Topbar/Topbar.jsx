import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Menu } from 'lucide-react'
import './Topbar.css'

const Topbar = ({
  showSearch = false,
  searchValue = '',
  onSearchChange,
  showFilters = false,
  filterValue = '',
  onFilterChange,
  showMenuToggle = false,
  onMenuToggle,
}) => {
  const usuario = useMemo(() => {
    const saved = localStorage.getItem('sendero_user')
    return saved ? JSON.parse(saved) : {}
  }, [])

  const inicial = (
    usuario?.nombre?.[0] ||
    usuario?.nombreCompleto?.[0] ||
    usuario?.correo?.[0] ||
    'U'
  ).toUpperCase()
  const navigate = useNavigate()

  return (
    <header className="topbar">
      <div className="topbar-left">
        {showMenuToggle && (
          <button className="mobile-menu-toggle" onClick={onMenuToggle} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
        )}

        {showSearch && (
          <div className="search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar reportes..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        )}

        {showFilters && (
          <select
            className="filter-select"
            value={filterValue}
            onChange={(e) => onFilterChange?.(e.target.value)}
          >
            <option value="">Todas las categorias</option>
            <option value="robo">Robo</option>
            <option value="acoso">Acoso</option>
            <option value="persona_sospechosa">Persona sospechosa</option>
            <option value="infraestructura">Infraestructura</option>
            <option value="emergencia_medica">Emergencia medica</option>
            <option value="violencia_agresion">Violencia o agresion</option>
            <option value="accidente">Accidente</option>
            <option value="objeto_sospechoso">Objeto sospechoso</option>
            <option value="riesgo_ambiental">Riesgo ambiental</option>
            <option value="transporte_movilidad">Transporte o movilidad</option>
            <option value="seguridad_preventiva">Seguridad preventiva</option>
            <option value="otro">Otro</option>
          </select>
        )}
      </div>

      <div className="topbar-actions">
        <div className="feed-avatar" onClick={() => navigate('/perfil')} title="Mi Perfil">{inicial}</div>
      </div>
    </header>
  )
}

export default Topbar
