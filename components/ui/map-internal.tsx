'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

import { MapMarker } from './leaflet-map';

// Default map center (e.g., center of a generic city or GPS based)
const DEFAULT_CENTER: [number, number] = [40.7128, -74.0060];

// Custom icon using divIcon to avoid default Leaflet image path issues in Webpack/Next.js
const createCategoryIcon = (category: string, severity: number) => {
  const icons: Record<string, string> = {
    pothole: '🕳️',
    streetlight: '💡',
    graffiti: '🎨',
    debris: '🗑️',
    other: '📍',
  };
  
  const iconChar = icons[category] || '📍';
  // Scale size maybe by severity
  const size = 30 + (severity * 2);
  
  return L.divIcon({
    className: 'custom-leaflet-icon bg-transparent border-0',
    html: `<div style="font-size: ${size}px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${iconChar}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const createPinIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `<div style="font-size: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); transform: translate(-50%, -100%); position:absolute;">🎯</div>`,
    iconSize: [0, 0], // The div inside handles the visual size
    iconAnchor: [0, 0],
  });
};

// Component to handle map clicks for selecting a location
function LocationSelector({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapInternalProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  clickMarker?: [number, number] | null;
}

export default function MapInternal({
  markers = [],
  center = DEFAULT_CENTER,
  zoom = 13,
  onLocationSelect,
  clickMarker
}: MapInternalProps) {
  
  // Need to fix global leaflet icon paths if using default markers, 
  // but we are using custom divIcons for everything so it's fine.

  // Prevent SSR undefined errors during hydration
  if (typeof window === "undefined") return null;
  if (!markers) return null;

  return (
    <MapContainer
      key={markers.length || 'empty-map'}
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {onLocationSelect && <LocationSelector onSelect={onLocationSelect} />}

      {/* Render existing issue markers */}
      {markers.map((marker) => (
        <Marker 
          key={marker.id} 
          position={[marker.lat, marker.lng]}
          icon={createCategoryIcon(marker.category, marker.severity)}
        >
          {marker.popupContent && (
            <Popup>
              {marker.popupContent}
            </Popup>
          )}
        </Marker>
      ))}

      {/* Render the clickable pin if user is reporting an issue */}
      {clickMarker && (
        <Marker
          position={clickMarker}
          icon={createPinIcon()}
        />
      )}
    </MapContainer>
  );
}
