
import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Trip, UserRole } from '../types';
import { Truck, Navigation, MapPin, Maximize } from 'lucide-react';

// Fix for default Leaflet icons in ESM/React environment
const truckIcon = L.divIcon({
  html: `<div class="bg-blue-600 p-2 rounded-full shadow-lg border-2 border-white text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const userIcon = L.divIcon({
  html: `<div class="bg-rose-500 p-2 rounded-full shadow-lg border-2 border-white text-white animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Componente para manejar el redimensionamiento del mapa
const MapResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    // Si el mapa ya no es válido, salir
    if (!map) return;

    const timer = setTimeout(() => {
      if (map && map.getContainer()) {
        map.invalidateSize();
      }
    }, 400); 
    
    const handleResize = () => {
      if (map && map.getContainer()) {
        map.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [map]);
  return null;
};

interface MapViewProps {
  trips: Trip[];
  userRole: UserRole;
  currentUserCoords?: { lat: number; lng: number };
}

const FleetControls = ({ trips, currentUserCoords }: { trips: Trip[], currentUserCoords?: {lat: number, lng: number} }) => {
  const map = useMap();

  const fitFleet = useCallback(() => {
    if (!map) return;
    const coords: L.LatLngExpression[] = [];
    
    if (currentUserCoords) {
      coords.push([currentUserCoords.lat, currentUserCoords.lng]);
    }

    trips.filter(t => t.status === 'in_progress').forEach(trip => {
      if (trip.origin === 'Monterrey') coords.push([25.6866, -100.3161]);
      else if (trip.origin === 'México DF') coords.push([19.4326, -99.1332]);
      else coords.push([20.6597, -103.3496]);
    });

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords as L.LatLngTuple[]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [map, trips, currentUserCoords]);

  const activeInRoute = trips.filter(t => t.status === 'in_progress').length;

  return (
    <div className="absolute top-4 left-4 z-[1000] pointer-events-none w-[calc(100%-2rem)] max-w-[280px]">
      <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
            <MapPin size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Geo-Flota TBS</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <Navigation size={10} className="text-emerald-500 animate-pulse" /> {activeInRoute} unidades activas
            </p>
          </div>
        </div>
        <button 
          onClick={fitFleet}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          <Maximize size={12} />
          Enfocar Mi Flota
        </button>
      </div>
    </div>
  );
};

const MapView: React.FC<MapViewProps> = ({ trips, userRole, currentUserCoords }) => {
  const [mapCenter] = useState<L.LatLngExpression>([23.6345, -102.5528]); 
  const isAdmin = userRole === UserRole.ADMIN;

  const getTripCoords = (trip: Trip): L.LatLngExpression => {
    if (trip.origin === 'Monterrey') return [25.6866, -100.3161];
    if (trip.origin === 'México DF') return [19.4326, -99.1332];
    return [20.6597, -103.3496]; 
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={mapCenter} 
        zoom={5} 
        scrollWheelZoom={false}
        className="h-full w-full rounded-3xl"
      >
        <MapResizeHandler />
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FleetControls trips={trips} currentUserCoords={currentUserCoords} />

        {currentUserCoords && (
          <Marker position={[currentUserCoords.lat, currentUserCoords.lng]} icon={userIcon}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-xs uppercase text-blue-600">Mi Ubicación</p>
              </div>
            </Popup>
          </Marker>
        )}

        {isAdmin && trips.filter(t => t.status === 'in_progress').map(trip => (
          <Marker key={trip.id} position={getTripCoords(trip)} icon={truckIcon}>
            <Popup>
              <div className="p-2 space-y-1">
                <p className="font-black text-xs text-slate-900">{trip.project}</p>
                <p className="text-[10px] text-slate-500 uppercase">{trip.operatorName}</p>
                <div className="pt-2 border-t border-slate-100 mt-1">
                  <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                    Unidad: {trip.vehicleId}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
