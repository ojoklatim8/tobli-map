import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';

// Custom Marker Icon
const createCustomIcon = (isSelected) => L.divIcon({
  className: 'custom-icon',
  html: `
    <div class="relative flex items-center justify-center">
      ${isSelected ? '<div class="absolute w-8 h-8 bg-white/20 rounded-full animate-ping-glow"></div>' : ''}
      <div class="w-2.5 h-2.5 bg-white rounded-full border-2 border-black shadow-[0_0_15px_rgba(255,255,255,0.5)] ${isSelected ? 'scale-125 transition-transform' : ''}"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function MapController({ center, zoom, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { animate: true, duration: 1.1, padding: [50, 50] });
    } else if (center) {
      map.flyTo(center, zoom, { animate: true, duration: 1.1 });
    }
  }, [center, zoom, bounds, map]);

  // if the user somehow moves the map (drag, zoom, etc.), immediately snap back
  useEffect(() => {
    const handleMoveEnd = () => {
      if (bounds) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (center) {
        map.setView(center, zoom);
      }
    };
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [center, zoom, bounds, map]);

  // disable all interactive behaviours so the pin always stays centred
  useEffect(() => {
    map.dragging.disable();
    map.touchZoom.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
  }, [map]);

  return null;
}

export default function MapDirectory() {
  const { userLocation, setUserLocation, selectedBusiness, setSelectedBusiness, searchResults, setCurrentIndex } = useStore();
  // mapConfig will be initialized when we receive the user's coordinates
  const hasGeo = "geolocation" in navigator;
  const [mapConfig, setMapConfig] = useState(null);
  const [locReady, setLocReady] = useState(!hasGeo); // ready immediately if no geolocation

  // try to acquire the device position immediately, then keep watching it
  useEffect(() => {
    if (!hasGeo) {
      // no geolocation – already set locReady during init
      return;
    }

    const fillLocation = (loc) => {
      setUserLocation(loc);
      // set the map centre and zoom once we have coords
      setMapConfig({ center: [loc.lat, loc.lng], zoom: 18 });
      setLocReady(true);
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fillLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        // permission denied or other error
        setLocReady(true);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        fillLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        // ignore watch errors
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [hasGeo, setUserLocation]);

  // derive effective map config from userLocation (replaces the old sync-setState effect)
  const effectiveMapConfig = useMemo(() => {
    if (userLocation) {
      return { center: [userLocation.lat, userLocation.lng], zoom: 18 };
    }
    return mapConfig;
  }, [userLocation, mapConfig]);


  // derive unique businesses from search results
  const businesses = useMemo(() => {
    const seen = new Map();
    searchResults.forEach((r) => {
      if (!seen.has(r.business_id)) {
        seen.set(r.business_id, r);
      }
    });
    return Array.from(seen.values());
  }, [searchResults]);


  // Calculate bounds if a business is selected (must be before any early returns – hooks rules)
  const activeBounds = useMemo(() => {
    if (selectedBusiness?.lat && selectedBusiness?.lng && userLocation) {
      return L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [selectedBusiness.lat, selectedBusiness.lng]
      ).pad(0.2);
    }
    return null;
  }, [selectedBusiness, userLocation]);

  if (!locReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#080A0F] text-white">
        Requesting location permission…
      </div>
    );
  }

  // Use a default fallback location for development
  const finalMapConfig = effectiveMapConfig || { center: [0.3476, 32.5825], zoom: 13 }; // Kampala, Uganda

  return (
    <div className="h-screen w-full bg-[#080A0F]">
      <MapContainer 
        center={finalMapConfig.center} 
        zoom={finalMapConfig.zoom} 
        className="h-full w-full"
        zoomControl={false}
      >
        <MapController center={finalMapConfig.center} zoom={finalMapConfig.zoom} bounds={activeBounds} />
        
        {/* CartoDB Dark Matter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        {/* CartoDB Labels Only */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          zIndex={10}
        />

        {/* User Pulse */}
        {userLocation && (
          <CircleMarker 
            center={[userLocation.lat, userLocation.lng]}
            radius={6}
            pathOptions={{ color: 'white', fillColor: 'white', fillOpacity: 0.8 }}
            className="animate-pulse-white"
          />
        )}

        {/* Business Pins */}
        {businesses.map((b) => (
          <Marker
            key={b.business_id}
            position={[b.lat, b.lng]}
            icon={createCustomIcon(selectedBusiness?.business_id === b.business_id)}
            eventHandlers={{
              click: () => {
                // pick the first result for this business and update index
                const idx = searchResults.findIndex(r => r.business_id === b.business_id);
                if (idx !== -1) {
                  setSelectedBusiness(searchResults[idx]);
                  setCurrentIndex(idx);
                }
              },
            }}
          />
        ))}

        {/* Dynamic routing line */}
        {selectedBusiness?.lat && selectedBusiness?.lng && userLocation && (
          <Polyline 
            positions={[
              [userLocation.lat, userLocation.lng],
              [selectedBusiness.lat, selectedBusiness.lng]
            ]}
            pathOptions={{ color: '#6366f1', weight: 4, dashArray: '8, 8' }}
            className="animate-pulse"
          />
        )}
      </MapContainer>
    </div>
  );
}
