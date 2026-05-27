import React, { useMemo, useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api';

// Es vital cargar la librería de visualización para el mapa de calor
const libraries = ['visualization'];

const containerStyle = {
  width: '100%',
  height: '100vh'
};

// Coordenadas exactas del área de ESCOM / Zacatenco
const center = {
  lat: 19.5045,
  lng: -99.1469
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
  ]
};

function MapaSenderoSeguro() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAbRsKXES6eeulnFgLRIxfoh2bUUkxVTo0", // Reemplaza con tu llave activada
    libraries: libraries,
    version: "weekly" // Usa la versión semanal para tener lo último de Google
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback(mapInstance) {
    setMap(null);
  }, []);

  // Datos del mapa de calor: Puntos críticos reportados cerca del plantel
  const heatmapData = useMemo(() => {
    if (!isLoaded || !window.google) return [];
    return [
      new window.google.maps.LatLng(19.5030, -99.1460),
      new window.google.maps.LatLng(19.5035, -99.1465),
      new window.google.maps.LatLng(19.5040, -99.1470),
      new window.google.maps.LatLng(19.5050, -99.1475),
    ];
  }, [isLoaded]);

  if (!isLoaded) return <div>Cargando Google Maps Platform...</div>;

  return (
    <div style={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={16}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        <HeatmapLayer
          data={heatmapData}
          options={{
            radius: 30,
            opacity: 0.8,
            gradient: [
              'rgba(0, 255, 255, 0)',
              'rgba(178, 34, 34, 0.5)',
              'rgba(122, 26, 26, 1)' // Tonos guinda institucionales
            ]
          }}
        />
      </GoogleMap>

      {/* Overlay de Emergencia (Glassmorphism) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '30px',
        background: 'rgba(122, 26, 26, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        zIndex: 1
      }}>
        <h2 style={{ margin: 0 }}>🚨 EMITIR ALERTA DE AUXILIO</h2>
        <p>Se enviará tu ubicación a Seguridad Institucional</p>
      </div>
    </div>
  );
}

export default React.memo(MapaSenderoSeguro);