"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import type { UrbanArea } from "@/types/monitoring";
import type { Household } from "@/types/monitoring";
import { HOUSEHOLDS } from "@/data/wardData";

interface MapViewProps {
  areas: UrbanArea[];
  selectedAreaId: number | null;
  highlightAreaName: string | null;
  onAreaSelect: (area: UrbanArea) => void;
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------
const WARD_FILL: Record<string, string> = {
  red:    "#ef4444",
  yellow: "#f59e0b",
  green:  "#10b981",
};

const HOUSEHOLD_FILL: Record<string, string> = {
  red:    "#ef4444",
  yellow: "#f59e0b",
  green:  "#10b981",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function MapView({
  areas,
  selectedAreaId,
  highlightAreaName,
  onAreaSelect,
  loading,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const wardLayerRef    = useRef<L.LayerGroup | null>(null);
  const householdLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapLoaded,   setMapLoaded]   = useState(false);
  const [viewLevel,   setViewLevel]   = useState<"ward" | "household">("ward");
  const [activeWardId, setActiveWardId] = useState<number | null>(null);

  // -------------------------------------------------------------------------
  // Init map once
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center:           [16.065, 108.225],
      zoom:             13,
      zoomControl:      false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.control.zoom({ position: "topleft" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

    wardLayerRef.current      = L.layerGroup().addTo(map);
    householdLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;
    setMapLoaded(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Draw WARD LEVEL view
  // -------------------------------------------------------------------------
  const drawWardView = useCallback(() => {
    const map = mapRef.current;
    if (!map || !wardLayerRef.current || !householdLayerRef.current || areas.length === 0) return;

    wardLayerRef.current.clearLayers();
    householdLayerRef.current.clearLayers();

    areas.forEach((ward) => {
      const fillColor = WARD_FILL[ward.status] ?? "#6b7280";

      // --- Heatmap glow circle (radius proportional to waste) ---
      const glowRadius = 250 + (ward.totalWaste / 5000) * 600;
      L.circle([ward.lat, ward.lng], {
        radius:      glowRadius,
        fillColor,
        fillOpacity: 0.18,
        stroke:      false,
        interactive: false,
        pane:        "overlayPane",
      }).addTo(wardLayerRef.current!);

      // --- Ward polygon ---
      if (ward.bounds && ward.bounds.length >= 3) {
        const latlngs = ward.bounds.map(([lat, lng]) => [lat, lng] as [number, number]);
        const poly = L.polygon(latlngs, {
          color:       fillColor,
          weight:      2.5,
          opacity:     0.9,
          fillColor,
          fillOpacity: 0.28,
        }).addTo(wardLayerRef.current!);

        poly.on("click", () => {
          handleWardClick(ward);
        });

        poly.on("mouseover", () => {
          poly.setStyle({ fillOpacity: 0.45, weight: 3.5 });
        });
        poly.on("mouseout", () => {
          poly.setStyle({ fillOpacity: 0.28, weight: 2.5 });
        });

        poly.bindTooltip(`
          <div style="padding:4px 6px;font-family:system-ui;min-width:140px;">
            <strong style="display:block;margin-bottom:3px;font-size:13px;">${ward.name}</strong>
            <span style="font-size:11px;color:#555;">🗑️ ${ward.totalWaste.toLocaleString()} kg/tháng</span><br/>
            <span style="font-size:11px;color:#555;">🏠 ${HOUSEHOLDS.filter(h => h.wardId === ward.id).length} hộ dân</span><br/>
            <span style="font-size:11px;color:#555;">📋 ${ward.reports} báo cáo</span>
          </div>
        `, { direction: "top", offset: [0, -4], className: "monitoring-leaflet-tooltip" });
      }

      // --- Center label pin ---
      const wasteLabel = ward.totalWaste >= 1000
        ? `${(ward.totalWaste / 1000).toFixed(1)}t`
        : `${ward.totalWaste}kg`;

      const labelIcon = L.divIcon({
        className: "ward-label-icon",
        iconSize:  [140, 52],
        iconAnchor:[70, 26],
        html: `
          <div style="
            display:flex;flex-direction:column;align-items:center;
            pointer-events:none;
          ">
            <div style="
              background:white;
              border:2px solid ${fillColor};
              border-radius:10px;
              padding:4px 10px;
              box-shadow:0 2px 10px rgba(0,0,0,0.18);
              text-align:center;
              cursor:pointer;
              pointer-events:auto;
            ">
              <span style="font-size:11px;font-weight:700;color:#222;display:block;white-space:nowrap;">
                ${ward.name.replace("Phường ", "")}
              </span>
              <span style="font-size:10px;font-weight:600;color:${fillColor};">
                ${wasteLabel}
              </span>
            </div>
          </div>
        `,
      });

      L.marker([ward.lat, ward.lng], { icon: labelIcon, interactive: true, zIndexOffset: 100 })
        .addTo(wardLayerRef.current!)
        .on("click", () => handleWardClick(ward));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas]);

  // -------------------------------------------------------------------------
  // Draw HOUSEHOLD LEVEL view
  // -------------------------------------------------------------------------
  const drawHouseholdView = useCallback((wardId: number) => {
    const map = mapRef.current;
    if (!map || !wardLayerRef.current || !householdLayerRef.current) return;

    wardLayerRef.current.clearLayers();
    householdLayerRef.current.clearLayers();

    const ward = areas.find(a => a.id === wardId);
    if (!ward) return;

    const households = HOUSEHOLDS.filter(h => h.wardId === wardId);

    // Draw a faded ward polygon as background reference
    if (ward.bounds && ward.bounds.length >= 3) {
      const latlngs = ward.bounds.map(([lat, lng]) => [lat, lng] as [number, number]);
      L.polygon(latlngs, {
        color:       WARD_FILL[ward.status],
        weight:      2,
        opacity:     0.4,
        fillColor:   WARD_FILL[ward.status],
        fillOpacity: 0.06,
        interactive: false,
      }).addTo(householdLayerRef.current!);
    }

    // Draw ward name label
    const wardLabelIcon = L.divIcon({
      className: "ward-banner-icon",
      iconSize:  [200, 28],
      iconAnchor:[100, 14],
      html: `
        <div style="
          background:${WARD_FILL[ward.status]};
          color:white;border-radius:20px;padding:4px 14px;
          font-size:12px;font-weight:700;text-align:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.2);
          white-space:nowrap;pointer-events:none;
        ">${ward.name}</div>
      `,
    });
    L.marker([ward.lat, ward.lng], { icon: wardLabelIcon, interactive: false, zIndexOffset: 500 })
      .addTo(householdLayerRef.current!);

    // Draw household markers
    households.forEach((hh) => {
      const color  = HOUSEHOLD_FILL[hh.status] ?? "#6b7280";
      const radius = 60 + (hh.waste / 600) * 120; // 60–180m

      // Glow effect
      L.circle([hh.lat, hh.lng], {
        radius:      radius * 2.2,
        fillColor:   color,
        fillOpacity: 0.1,
        stroke:      false,
        interactive: false,
      }).addTo(householdLayerRef.current!);

      // Main circle
      const circle = L.circle([hh.lat, hh.lng], {
        radius,
        fillColor:   color,
        fillOpacity: 0.75,
        color:       "white",
        weight:      2,
      }).addTo(householdLayerRef.current!);

      const statusLabel = hh.status === "red" ? "⚠️ Cao" : hh.status === "yellow" ? "〰️ Trung bình" : "✅ Thấp";
      circle.bindTooltip(`
        <div style="padding:5px 8px;font-family:system-ui;min-width:160px;">
          <strong style="display:block;font-size:13px;margin-bottom:3px;">${hh.name}</strong>
          <span style="font-size:11px;color:#444;">🗑️ Rác: <b>${hh.waste} kg/tháng</b></span><br/>
          <span style="font-size:11px;color:${color};">${statusLabel}</span>
        </div>
      `, { direction: "top", offset: [0, -4], className: "monitoring-leaflet-tooltip" });
    });

    // Fly to ward
    if (ward.bounds && ward.bounds.length >= 3) {
      const latLngs = ward.bounds.map(([lat, lng]) => L.latLng(lat, lng));
      const bounds  = L.latLngBounds(latLngs);
      map.flyToBounds(bounds.pad(0.2), { duration: 0.8, maxZoom: 16 });
    } else {
      map.flyTo([ward.lat, ward.lng], 16, { duration: 0.8 });
    }
  }, [areas]);

  // -------------------------------------------------------------------------
  // Handle ward click → switch to household level
  // -------------------------------------------------------------------------
  const handleWardClick = useCallback((ward: UrbanArea) => {
    setViewLevel("household");
    setActiveWardId(ward.id);
    onAreaSelect(ward);
  }, [onAreaSelect]);

  // -------------------------------------------------------------------------
  // Back to ward view
  // -------------------------------------------------------------------------
  const handleBackToWardView = useCallback(() => {
    setViewLevel("ward");
    setActiveWardId(null);
    const map = mapRef.current;
    if (map) map.flyTo([16.065, 108.225], 13, { duration: 0.8 });
  }, []);

  // -------------------------------------------------------------------------
  // Redraw when view level or areas change
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mapLoaded || areas.length === 0) return;
    if (viewLevel === "ward") {
      drawWardView();
    } else if (viewLevel === "household" && activeWardId !== null) {
      drawHouseholdView(activeWardId);
    }
  }, [mapLoaded, viewLevel, activeWardId, areas, drawWardView, drawHouseholdView]);

  // -------------------------------------------------------------------------
  // Handle highlightAreaName (from report list click)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!highlightAreaName || !mapLoaded) return;
    const area = areas.find((a) => a.name === highlightAreaName);
    if (!area) return;
    setViewLevel("household");
    setActiveWardId(area.id);
  }, [highlightAreaName, areas, mapLoaded]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Loading overlay */}
      {(loading || !mapLoaded) && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Đang tải bản đồ…</p>
          </div>
        </div>
      )}

      {/* Back button (household view) */}
      {mapLoaded && viewLevel === "household" && (
        <button
          onClick={handleBackToWardView}
          className="absolute top-4 left-14 z-[1000] flex items-center gap-1.5 bg-white border border-gray-200 shadow-md rounded-full px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 2L4 7l5 5" />
          </svg>
          Xem toàn khu vực
        </button>
      )}

      {/* Breadcrumb chip */}
      {mapLoaded && viewLevel === "household" && activeWardId !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <span className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-md rounded-full px-4 py-1.5 text-xs font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            {areas.find(a => a.id === activeWardId)?.name} — Từng hộ dân
          </span>
        </div>
      )}

      {/* Legend */}
      {mapLoaded && (
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm p-3 text-xs space-y-2 z-[1000]">
          <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
            {viewLevel === "ward" ? "Mức độ rác phường" : "Mức độ rác hộ dân"}
          </p>
          {[
            { color: "#ef4444", label: viewLevel === "ward" ? "Cao (>3000 kg)" : "Cao (>300 kg/tháng)" },
            { color: "#f59e0b", label: viewLevel === "ward" ? "Trung bình (1500–3000 kg)" : "TB (100–300 kg/tháng)" },
            { color: "#10b981", label: viewLevel === "ward" ? "Thấp (<1500 kg)" : "Thấp (<100 kg/tháng)" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                style={{ background: item.color }}
              />
              <span className="text-gray-500 whitespace-nowrap">{item.label}</span>
            </div>
          ))}
          {viewLevel === "ward" && (
            <p className="text-gray-400 text-[10px] pt-1 border-t border-gray-100">
              Click vào phường để xem hộ dân
            </p>
          )}
        </div>
      )}

      <style>{`
        .monitoring-leaflet-tooltip {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
          padding: 6px 10px !important;
          font-weight: 500 !important;
        }
        .monitoring-leaflet-tooltip::before {
          display: none !important;
        }
        .ward-label-icon, .ward-banner-icon {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
