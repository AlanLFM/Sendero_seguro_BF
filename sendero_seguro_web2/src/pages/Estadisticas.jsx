import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Download, BarChart3 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { api } from '../lib/api'
import Topbar from '../components/Topbar/Topbar'
import './Estadisticas.css'

const CATEGORY_COLORS = {
  robo: '#c9141e',
  acoso: '#8b6b4a',
  persona_sospechosa: '#d45d00',
  infraestructura: '#2b7a4b',
  emergencia_medica: '#c9141e',
  violencia_agresion: '#a0101a',
  accidente: '#6b6b6b',
  objeto_sospechoso: '#d45d00',
  riesgo_ambiental: '#3a9e5c',
  transporte_movilidad: '#4a7ab5',
  seguridad_preventiva: '#2b7a4b',
  otro: '#9a9a9a',
}

const CATEGORY_LABELS = {
  robo: 'Robo',
  acoso: 'Acoso',
  persona_sospechosa: 'Persona sospechosa',
  infraestructura: 'Infraestructura',
  emergencia_medica: 'Emergencia medica',
  violencia_agresion: 'Violencia o agresion',
  accidente: 'Accidente',
  objeto_sospechoso: 'Objeto sospechoso',
  riesgo_ambiental: 'Riesgo ambiental',
  transporte_movilidad: 'Transporte o movilidad',
  seguridad_preventiva: 'Seguridad preventiva',
  otro: 'Otro',
}

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  verificado: 'Verificado',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
}

const Estadisticas = () => {
  const { isMobile, setNavOpen } = useOutletContext()
  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalReports, setTotalReports] = useState(0)
  const [dailyData, setDailyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [areaData, setAreaData] = useState([])
  const [csvFilter, setCsvFilter] = useState('todos')

  const GENERAL_LOCATIONS = ['ESCOM IPN', 'ESCOM', 'Sin ubicacion']

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.get('/reports?limit=1000&estado=pendiente')
        const reports = data.reports || []
        setReportes(reports)
        setTotalReports(data.pagination?.total || reports.length)

        const dailyMap = {}
        reports.forEach((r) => {
          const date = new Date(r.createdAt).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
          })
          dailyMap[date] = (dailyMap[date] || 0) + 1
        })
        setDailyData(
          Object.entries(dailyMap)
            .sort((a, b) => {
              const dateA = new Date(a[0])
              const dateB = new Date(b[0])
              return dateA - dateB
            })
            .map(([date, count]) => ({ date, count }))
        )

        const catMap = {}
        reports.forEach((r) => {
          const cat = r.categoria || 'otro'
          catMap[cat] = (catMap[cat] || 0) + 1
        })
        setCategoryData(
          Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({
              name: CATEGORY_LABELS[name] || name,
              value,
              color: CATEGORY_COLORS[name] || '#9a9a9a',
            }))
        )

        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const areaMap = {}
        reports.forEach((r) => {
          const reportDate = new Date(r.createdAt)
          if (reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear) {
            const location = r.ubicacionTexto || ''
            const isGeneral = GENERAL_LOCATIONS.some((g) => location.includes(g))
            const isCoordinate = /^-?\d+\.\d+/.test(location)
            if (!isGeneral && !isCoordinate && location.trim()) {
              areaMap[location] = (areaMap[location] || 0) + 1
            }
          }
        })
        setAreaData(
          Object.entries(areaMap)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }))
        )
      } catch (err) {
        console.error('[ESTADISTICAS] Error al cargar datos:', err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const exportarCSV = () => {
    const now = new Date()
    const todayStr = now.toLocaleDateString('es-MX')
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let filtered = reportes
    if (csvFilter === 'hoy') {
      filtered = reportes.filter((r) => new Date(r.createdAt).toLocaleDateString('es-MX') === todayStr)
    } else if (csvFilter === 'mes') {
      filtered = reportes.filter((r) => {
        const d = new Date(r.createdAt)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
    } else if (csvFilter === 'año') {
      filtered = reportes.filter((r) => new Date(r.createdAt).getFullYear() === currentYear)
    }

    const headers = ['ID', 'Categoria', 'Ubicacion', 'Descripcion', 'Fecha/Hora', 'Estado']
    const rows = filtered.map((r) => {
      const fecha = new Date(r.createdAt).toLocaleString('es-MX')
      const estado = ESTADO_LABELS[r.estado] || r.estado
      return [
        r.id,
        CATEGORY_LABELS[r.categoria] || r.categoria,
        r.ubicacionTexto || 'Sin ubicacion',
        r.descripcion || 'Sin descripcion',
        fecha,
        estado,
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const filterSuffix = csvFilter === 'todos' ? '' : `_${csvFilter}`
    link.download = `reportes${filterSuffix}_${now.toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <main className="stats-page">
        <Topbar
          showMenuToggle={isMobile}
          onMenuToggle={() => setNavOpen((prev) => !prev)}
        />
        <div className="stats-loading">Cargando estadisticas...</div>
      </main>
    )
  }

  return (
    <main className="stats-page">
      <Topbar
        showMenuToggle={isMobile}
        onMenuToggle={() => setNavOpen((prev) => !prev)}
      />

      <section className="stats-content">
        <div className="stats-header">
          <div>
            <h1>
              <BarChart3 size={28} />
              Estadisticas de Seguridad
            </h1>
            <p>Panel de analisis y supervision de reportes comunitarios.</p>
          </div>
          <div className="csv-export-widget">
            <div className="time-filter-segmented">
              <button className={`segment-btn ${csvFilter === 'hoy' ? 'active' : ''}`} onClick={() => setCsvFilter('hoy')}>Hoy</button>
              <button className={`segment-btn ${csvFilter === 'mes' ? 'active' : ''}`} onClick={() => setCsvFilter('mes')}>Mes</button>
              <button className={`segment-btn ${csvFilter === 'año' ? 'active' : ''}`} onClick={() => setCsvFilter('año')}>Año</button>
              <button className={`segment-btn ${csvFilter === 'todos' ? 'active' : ''}`} onClick={() => setCsvFilter('todos')}>Todos</button>
            </div>
            <button className="csv-export-btn" onClick={exportarCSV}>
              <Download size={16} />
              Descargar CSV
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <article className="stats-card total-card">
            <div className="card-header">
              <h2>Total de Reportes</h2>
              <span className="total-badge">{totalReports}</span>
            </div>
            <div className="chart-container">
              <h3>Reportes por dia</h3>
              {dailyData.length === 0 ? (
                <p className="chart-empty">Sin datos suficientes</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#c9141e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="stats-card category-card">
            <div className="card-header">
              <h2>Tipos de Reporte</h2>
            </div>
            <div className="chart-container">
              {categoryData.length === 0 ? (
                <p className="chart-empty">Sin datos suficientes</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconSize={10}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>
        </div>

        <article className="stats-card area-card">
          <div className="card-header">
            <h2>Reportes por Area Especifica</h2>
          </div>
          <div className="chart-container">
            {areaData.length === 0 ? (
              <p className="chart-empty">Sin reportes de areas especificas este mes</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0b4c8c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>
    </main>
  )
}

export default Estadisticas
