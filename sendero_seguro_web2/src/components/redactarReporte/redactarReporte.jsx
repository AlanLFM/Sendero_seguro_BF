import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Eye,
  Info,
  Lightbulb,
  MapPin,
  Camera,
} from "lucide-react";
import { api } from "../../lib/api";
import Topbar from "../Topbar/Topbar";
import "./RedactarReporte.css";

const RedactarReporte = () => {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [privacidad, setPrivacidad] = useState("publico");
  const [ubicacionTexto, setUbicacionTexto] = useState("ESCOM IPN");
  const [latitud, setLatitud] = useState(null);
  const [longitud, setLongitud] = useState(null);
  const [ubicacionEditable, setUbicacionEditable] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("loading");
  const [esAreaEscom, setEsAreaEscom] = useState(false);
  const [areaEspecificaEscom, setAreaEspecificaEscom] = useState("");
  const [evidencia, setEvidencia] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const { isMobile, setNavOpen } = useOutletContext();

  const usuario = useMemo(() => {
    const saved = localStorage.getItem("sendero_user");
    return saved ? JSON.parse(saved) : {};
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUbicacionEditable(true);
      setGpsStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(pos.coords.latitude);
        setLongitud(pos.coords.longitude);
        setUbicacionEditable(false);
        setGpsStatus("ok");
      },
      () => {
        setUbicacionEditable(true);
        setGpsStatus("error");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!evidencia) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(evidencia);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [evidencia]);

  const validate = () => {
    const next = {};
    if (!titulo.trim()) next.titulo = "El titulo es requerido";
    if (!categoria) next.categoria = "Selecciona una categoria";
    if (!descripcion.trim()) next.descripcion = "La descripcion es requerida";
    if (esAreaEscom && !areaEspecificaEscom) next.areaEspecificaEscom = "Selecciona un area especifica";
    if (!ubicacionTexto.trim()) next.ubicacionTexto = "La ubicacion es requerida";
    if (!privacidad) next.privacidad = "Selecciona la privacidad";
    if (!esAreaEscom && (latitud == null || longitud == null)) {
      next.ubicacion = "No se pudo obtener la ubicacion. Usa el boton de ESCOM o habilita el GPS.";
    }
    return next;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setEvidencia(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, evidencia: "Solo se permiten imagenes" }));
      setEvidencia(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, evidencia: "Maximo 5MB" }));
      setEvidencia(null);
      return;
    }

    setErrors((prev) => ({ ...prev, evidencia: "" }));
    setEvidencia(file);
  };

  const handleUseEscomLocation = () => {
    setLatitud(19.5065);
    setLongitud(-99.1442);
    setUbicacionTexto("ESCOM IPN");
    setUbicacionEditable(false);
    setGpsStatus("ok");
    setErrors((prev) => ({ ...prev, ubicacion: "" }));
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "preset_usuarios");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dhfvslorz/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("cloudinary");
    }

    const data = await response.json();
    return data.secure_url || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      let evidenciaUrl = "";
      if (evidencia) {
        evidenciaUrl = await uploadToCloudinary(evidencia);
      }

      await api.post("/reports", {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria,
        latitud: esAreaEscom ? 19.5065 : latitud,
        longitud: esAreaEscom ? -99.1442 : longitud,
        ubicacionTexto: esAreaEscom ? (areaEspecificaEscom || "ESCOM IPN") : ubicacionTexto.trim(),
        esAnonimo: privacidad === "anonimo",
        evidenciaUrl: evidenciaUrl || null,
      });

      setTitulo("");
      setCategoria("");
      setDescripcion("");
      setPrivacidad("publico");
      setUbicacionTexto("ESCOM IPN");
      setEsAreaEscom(false);
      setAreaEspecificaEscom("");
      setEvidencia(null);
      setSuccess("Reporte enviado correctamente.");
    } catch (err) {
      setErrors({ form: err.message || "No se pudo enviar el reporte. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitulo("");
    setCategoria("");
    setDescripcion("");
    setPrivacidad("publico");
    setUbicacionTexto("ESCOM IPN");
    setEsAreaEscom(false);
    setAreaEspecificaEscom("");
    setEvidencia(null);
    setErrors({});
    setSuccess("");
  };

  return (
    <main className="report-main">
      <Topbar
        showMenuToggle={isMobile}
        onMenuToggle={() => setNavOpen((prev) => !prev)}
      />
      <div className="report-content">
        <section className="report-header">
          <div>
            <p className="section-label">SEGURIDAD / COMUNIDAD</p>
            <h1>Redactar Reporte</h1>
            <p className="header-description">
              Tu reporte ayuda a construir un entorno mas seguro para todos. La
              informacion proporcionada sera validada por el comite de vigilancia.
            </p>
          </div>
        </section>

        <section className="report-layout">
          <form className="report-form-card" onSubmit={handleSubmit}>
            {errors.form && <div className="field-error">{errors.form}</div>}
            {success && <div className="field-success">{success}</div>}
            <div className="form-group">
              <label>Titulo del Incidente</label>
              <input
                type="text"
                placeholder="Ej: Luminaria fundida en estacionamiento sur"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className={errors.titulo ? "input-error" : ""}
              />
              {errors.titulo && <span className="field-error">{errors.titulo}</span>}
            </div>

            <div className="form-group">
              <label>Tipo de incidente</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className={errors.categoria ? "input-error" : ""}
              >
                <option value="">Selecciona una categoria</option>
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
              {errors.categoria && <span className="field-error">{errors.categoria}</span>}
            </div>

            <div className="form-group">
              <label>Descripcion del incidente</label>
              <textarea
                placeholder="Describe los hechos de la manera mas detallada posible..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className={errors.descripcion ? "input-error" : ""}
              />
              {errors.descripcion && <span className="field-error">{errors.descripcion}</span>}
            </div>

            <div className="form-group">
              <label>Ubicacion</label>
              <input
                type="text"
                value={ubicacionTexto}
                onChange={(e) => setUbicacionTexto(e.target.value)}
                disabled={!ubicacionEditable}
                className={errors.ubicacionTexto || errors.ubicacion ? "input-error" : ""}
              />
              {!esAreaEscom && gpsStatus === "loading" && (
                <span className="field-hint">Obteniendo ubicacion por GPS...</span>
              )}
              {!esAreaEscom && gpsStatus === "ok" && (
                <span className="field-hint">Ubicacion obtenida por GPS.</span>
              )}
              {!esAreaEscom && gpsStatus === "error" && (
                <button type="button" className="gps-fallback-btn" onClick={handleUseEscomLocation}>
                  Usar ubicacion ESCOM
                </button>
              )}
              {!esAreaEscom && errors.ubicacion && <span className="field-error">{errors.ubicacion}</span>}
              {errors.ubicacionTexto && <span className="field-error">{errors.ubicacionTexto}</span>}

              <div className="escom-area-toggle">
                <label className="toggle-checkbox-label">
                  <input
                    type="checkbox"
                    checked={esAreaEscom}
                    onChange={(e) => {
                      setEsAreaEscom(e.target.checked);
                      if (!e.target.checked) setAreaEspecificaEscom("");
                    }}
                  />
                  <span>¿El incidente fue en un area especifica de la ESCOM?</span>
                </label>
              </div>

              {esAreaEscom && (
                <div className="form-group escom-area-select">
                  <label>Selecciona el area especifica</label>
                  <select
                    value={areaEspecificaEscom}
                    onChange={(e) => setAreaEspecificaEscom(e.target.value)}
                    className={errors.areaEspecificaEscom ? "input-error" : ""}
                  >
                    <option value="">Selecciona un area...</option>
                    <option value="Baños IA">Baños IA</option>
                    <option value="Baños ISC">Baños ISC</option>
                    <option value="Baños auditorio">Baños auditorio</option>
                    <option value="Cafeteria IA">Cafeteria IA</option>
                    <option value="Cafeteria gobierno">Cafeteria gobierno</option>
                    <option value="Canchas IA">Canchas IA</option>
                    <option value="Canchas gobierno">Canchas gobierno</option>
                    <option value="Estacionamiento">Estacionamiento</option>
                    <option value="Laboratorios">Laboratorios</option>
                    <option value="Pastos">Pastos</option>
                    <option value="Otro">Otro</option>
                  </select>
                  {errors.areaEspecificaEscom && <span className="field-error">{errors.areaEspecificaEscom}</span>}
                </div>
              )}
            </div>

            <div className={`upload-box ${errors.evidencia ? "input-error" : ""}`}>
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="upload-icon">
                  <Camera size={22} />
                </div>
                <strong>{evidencia ? evidencia.name : "Adjuntar imagen/evidencia"}</strong>
                <span>PNG, JPG hasta 5MB</span>
              </label>
              {previewUrl && (
                <div className="upload-preview">
                  <img src={previewUrl} alt="Vista previa" />
                </div>
              )}
              {errors.evidencia && <span className="field-error">{errors.evidencia}</span>}
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                Cancelar
              </button>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Reporte Oficial"}
              </button>
            </div>
          </form>

          <aside className="report-side">
            <div className="privacy-card">
              <div className="card-title">
                <Eye size={18} />
                <h2>Privacidad del Reporte</h2>
              </div>

              <label className={`privacy-option ${privacidad === "publico" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="privacy"
                  value="publico"
                  checked={privacidad === "publico"}
                  onChange={(e) => setPrivacidad(e.target.value)}
                />
                <div>
                  <strong>Publicar con mi nombre</strong>
                  <span>Visible para la comunidad ESCOM</span>
                </div>
              </label>

              <label className={`privacy-option ${privacidad === "anonimo" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="privacy"
                  value="anonimo"
                  checked={privacidad === "anonimo"}
                  onChange={(e) => setPrivacidad(e.target.value)}
                />
                <div>
                  <strong>Publicar de forma Anonima</strong>
                  <span>Tu identidad sera cifrada por el sistema</span>
                </div>
              </label>
              {errors.privacidad && <span className="field-error">{errors.privacidad}</span>}

              <div className="privacy-warning">
                <Info size={14} />
                <p>
                  El anonimato protege tu identidad pero permite que las
                  autoridades te contacten por canal privado si requieren mas
                  detalles.
                </p>
              </div>
            </div>

            <div className="tips-card">
              <div className="tips-title">
                <Lightbulb size={17} />
                <h2>Consejos de Seguridad</h2>
              </div>

              <ul>
                <li>Procura indicar puntos de referencia conocidos.</li>
                <li>Si hay un herido, utiliza el boton de EMERGENCIA SOS inmediatamente.</li>
                <li>Evita incluir datos personales de terceros sin su consentimiento.</li>
              </ul>
            </div>

            <div className="location-card">

              <div>
                <strong>GEOLOCALIZACION</strong>
                <span>ESCOM IPN, Ciudad de Mexico</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default RedactarReporte;
