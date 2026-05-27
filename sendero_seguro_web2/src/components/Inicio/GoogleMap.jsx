import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";
import { api } from "../../lib/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyAbRsKXES6eeulnFgLRIxfoh2bUUkxVTo0";

const ESCOM_CENTER = { lat: 19.5065, lng: -99.1442 };

const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
};

const CATEGORY_COLORS = {
  robo: "#ef4444",
  acoso: "#f97316",
  persona_sospechosa: "#dc2626",
  infraestructura: "#22c55e",
  emergencia_medica: "#ef4444",
  violencia_agresion: "#dc2626",
  accidente: "#eab308",
  objeto_sospechoso: "#dc2626",
  riesgo_ambiental: "#22c55e",
  transporte_movilidad: "#eab308",
  seguridad_preventiva: "#3b82f6",
  otro: "#6b7280",
};

function createMarkerIcon(color, circlePath) {
  return {
    path: circlePath,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 10,
    anchor: { x: 0, y: 0 },
  };
}

const DashboardMap = ({ refreshTrigger }) => {
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [circlePath, setCirclePath] = useState(null);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const loadData = useCallback(async () => {
    if (!mapLoaded) return;
    try {
      const [reportsRes, alertsRes] = await Promise.all([
        api.get("/reports?page=1&limit=50"),
        api.get("/alerts?estado=activa"),
      ]);
      console.log("[MAP] Datos cargados - alerts:", alertsRes.alerts?.length, "reports:", reportsRes.reports?.length);
      setReports(reportsRes.reports || []);
      setAlerts(alertsRes.alerts || []);
    } catch (err) {
      console.error("[MAP] Error al cargar datos del mapa:", err.message);
    }
  }, [mapLoaded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!mapLoaded) return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [mapLoaded, loadData]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("[MAP] Refresh triggered, reloading data...");
      loadData();
    }
  }, [refreshTrigger, loadData]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("[MAP] No se pudo obtener ubicacion:", err.message);
        }
      );
    }
  }, []);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    const path = window.google.maps.SymbolPath.CIRCLE;
    console.log("[MAP] SymbolPath.CIRCLE =", path);
    setCirclePath(path);
    setMapLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#e5e7eb",
        borderRadius: 14,
        fontSize: 13,
        color: "#6b7280",
      }}>
        Cargando mapa...
      </div>
    );
  }

  const markers = [];

  if (circlePath !== null) {
    alerts.forEach((alert) => {
      const lat = parseFloat(alert.latitud);
      const lng = parseFloat(alert.longitud);
      if (!isNaN(lat) && !isNaN(lng)) {
        markers.push({
          id: `alert-${alert.id}`,
          lat,
          lng,
          type: "alert",
          icon: createMarkerIcon("#dc2626", circlePath),
          data: alert,
        });
      }
    });

    reports.forEach((report) => {
      const lat = parseFloat(report.latitud);
      const lng = parseFloat(report.longitud);
      if (!isNaN(lat) && !isNaN(lng)) {
        const color = CATEGORY_COLORS[report.categoria] || "#6b7280";
        markers.push({
          id: `report-${report.id}`,
          lat,
          lng,
          type: "report",
          icon: createMarkerIcon(color, circlePath),
          data: report,
        });
      }
    });

    if (userLocation) {
      markers.push({
        id: "user-location",
        lat: userLocation.lat,
        lng: userLocation.lng,
        type: "user",
        icon: createMarkerIcon("#3b82f6", circlePath),
        data: { titulo: "Tu ubicacion" },
      });
    }

    console.log("[MAP] Total markers:", markers.length, "- alerts:", alerts.filter(a => !isNaN(parseFloat(a.latitud)) && !isNaN(parseFloat(a.longitud))).length, "- reports:", reports.filter(r => !isNaN(parseFloat(r.latitud)) && !isNaN(parseFloat(r.longitud))).length);
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%", borderRadius: 14 }}
      center={ESCOM_CENTER}
      zoom={15}
      options={MAP_OPTIONS}
      onLoad={onLoad}
    >
      {markers.map((marker) => (
        <MarkerF
          key={marker.id}
          position={{ lat: marker.lat, lng: marker.lng }}
          icon={marker.icon}
          onClick={() => setSelectedMarker(marker)}
        />
      ))}

      {selectedMarker && (
        <InfoWindowF
          position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div style={{ maxWidth: 220, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            {selectedMarker.type === "alert" && (
              <div style={{ color: "#dc2626", fontWeight: 800, fontSize: 11, marginBottom: 4 }}>
                ALERTA DE EMERGENCIA
              </div>
            )}
            {selectedMarker.type === "user" && (
              <div style={{ color: "#3b82f6", fontWeight: 800, fontSize: 11, marginBottom: 4 }}>
                TU UBICACION
              </div>
            )}
            {selectedMarker.type === "report" && (
              <div style={{
                color: CATEGORY_COLORS[selectedMarker.data.categoria] || "#6b7280",
                fontWeight: 800,
                fontSize: 10,
                marginBottom: 4,
                textTransform: "uppercase",
              }}>
                {(selectedMarker.data.categoria || "otro").replace(/_/g, " ")}
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
              {selectedMarker.data.titulo}
            </div>
            {selectedMarker.data.descripcion && (
              <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}>
                {selectedMarker.data.descripcion.substring(0, 120)}
                {selectedMarker.data.descripcion.length > 120 ? "..." : ""}
              </div>
            )}
            {selectedMarker.data.ubicacionTexto && (
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                {selectedMarker.data.ubicacionTexto}
              </div>
            )}
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
};

export default DashboardMap;
