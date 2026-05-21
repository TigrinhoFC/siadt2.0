"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';


// Corrigindo o ícone padrão do Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface AreaMonitorada {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  status: 'Normal' | 'Alerta' | 'Crítico';
  raio: number; // metros
}

export default function MapaMonitoramento() {
  // Coordenadas centrais de Manaus
  const centroManaus: [number, number] = [-3.1190, -60.0217];

  const [areas, setAreas] = useState<AreaMonitorada[]>([
    // Exemplos localizados em Manaus
    { id: '1', nome: 'Zona de Risco - Encosta Leste', lat: -3.1342842, lng: -59.9793014, status: 'Normal', raio: 500 },
   
  ]);

  const getCorStatus = (status: string) => {
    switch (status) {
      case 'Crítico': return '#ef4444'; // Vermelho
      case 'Alerta': return '#f97316';  // Laranja
      default: return '#22c55e';       // Verde
    }
  };

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <MapContainer 
        center={centroManaus} 
        zoom={12} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
      >
        {/* Camada de mapa escuro (CartoDB Dark Matter) */}
        <TileLayer
       
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {areas.map((area) => (
          <React.Fragment key={area.id}>
            {/* Marcador Visual */}
            <Marker position={[area.lat, area.lng]} icon={icon}>
              <Popup className="custom-popup">
                <div className="p-2">
                  <h3 className="font-bold text-slate-900">{area.nome}</h3>
                  <p className="text-xs text-slate-600">Status: {area.status}</p>
                </div>
              </Popup>
            </Marker>

            {/* Círculo de abrangência */}
            <Circle 
              center={[area.lat, area.lng]}
              radius={area.raio}
              pathOptions={{ 
                fillColor: getCorStatus(area.status), 
                color: getCorStatus(area.status),
                fillOpacity: 0.2,
                weight: 2
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}