'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Leaflet's CSS is required for the map to render correctly
import 'leaflet/dist/leaflet.css';

// Dynamic import for the actual map component to disable SSR
// Next.js tries to render on the server, but Leaflet needs `window`
const DynamicMap = dynamic(() => import('./map-internal'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/20 animate-pulse flex items-center justify-center rounded-lg border border-border">
      <span className="text-muted-foreground text-sm">Loading map...</span>
    </div>
  ),
});

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  category: string;
  severity: number;
  popupContent?: React.ReactNode;
};

interface LeafletMapProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  clickMarker?: [number, number] | null;
}

export function LeafletMap(props: LeafletMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`w-full overflow-hidden rounded-lg z-0 ${props.className || 'h-96'}`}>
      <DynamicMap {...props} />
    </div>
  );
}
