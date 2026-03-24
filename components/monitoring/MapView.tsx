"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import type { UrbanArea, WasteReport } from "@/types/monitoring";
import type { Household } from "@/types/monitoring";
import { HOUSEHOLDS } from "@/data/wardData";

interface MapViewProps {
  areas: UrbanArea[];
  reports: WasteReport[];
  selectedAreaId: number | null;
  highlightAreaName: string | null;
  onAreaSelect: (area: UrbanArea) => void;
  onReportSelect?: (report: WasteReport) => void;
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

const REPORT_COLORS: Record<string, { bg: string; border: string; pulse: boolean }> = {
  pending:  { bg: "#ef4444", border: "#b91c1c", pulse: true  },
  assigned: { bg: "#3b82f6", border: "#1d4ed8", pulse: false },
  done:     { bg: "#10b981", border: "#059669", pulse: false },
};

const WASTE_TYPE_LABEL: Record<string, string> = {
  plastic:   "Nhựa",
  organic:   "Hữu cơ",
  mixed:     "Hỗn hợp",
  hazardous: "Nguy hại",
};

// ---------------------------------------------------------------------------
// Build SVG report pin icon
// ---------------------------------------------------------------------------
function buildReportIcon(status: string): L.DivIcon {
  const cfg     = REPORT_COLORS[status] ?? REPORT_COLORS.pending;
  const pulseStyle = cfg.pulse
    ? `animation:report-pin-pulse 1.4s ease-in-out infinite;`
    : "";

  return L.divIcon({
    className: "",
    iconSize:  [28, 34],
    iconAnchor:[14, 34],
    popupAnchor:[0, -36],
    html: `
      <div style="
        position:relative;
        width:28px;height:34px;
        display:flex;align-items:center;justify-content:center;
        ${pulseStyle}
      ">
        <!-- Drop shadow -->
        <div style="
          position:absolute;bottom:0;left:50%;transform:translateX(-50%);
          width:10px;height:4px;
          background:rgba(0,0,0,0.15);border-radius:50%;
        "></div>
        <!-- Pin body -->
        <div style="
          position:absolute;top:0;left:0;
          width:28px;height:28px;
          background:${cfg.bg};
          border:2px solid ${cfg.border};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 6px rgba(0,0,0,0.22);
        "></div>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function MapView({
  areas,
  reports,
  selectedAreaId,
  highlightAreaName,
  onAreaSelect,
  onReportSelect,
  loading,
}: MapViewProps) {
  const mapContainerRef   = useRef<HTMLDivElement>(null);
  const mapRef            = useRef<L.Map | null>(null);
  const wardLayerRef      = useRef<L.LayerGroup | null>(null);
  const householdLayerRef = useRef<L.LayerGroup | null>(null);
  const reportLayerRef    = useRef<L.LayerGroup | null>(null);
  const [mapLoaded,    setMapLoaded]    = useState(false);
  const [viewLevel,    setViewLevel]    = useState<"ward" | "household">("ward");
  const [activeWardId, setActiveWardId] = useState<number | null>(null);

  // ─── Inject keyframe animation once ──────────────────────────────────────
  useEffect(() => {
    const id = "report-pin-style";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        @keyframes report-pin-pulse {
          0%,100% { transform: scale(1) translateY(0); }
          50%      { transform: scale(1.18) translateY(-3px); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ─── Init map once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center:             [16.065, 108.225],
      zoom:               13,
      zoomControl:        false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.control.zoom({ position: "topleft" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

    wardLayerRef.current      = L.layerGroup().addTo(map);
    householdLayerRef.current = L.layerGroup().addTo(map);
    reportLayerRef.current    = L.layerGroup().addTo(map);

    mapRef.current = map;
    setMapLoaded(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─── Draw report pins (always visible on top) ────────────────────────────
  const drawReportPins = useCallback(
    (wardIdFilter: number | null) => {
      if (!reportLayerRef.current) return;
      reportLayerRef.current.clearLayers();

      const filtered = wardIdFilter
        ? reports.filter((r) => r.wardId === wardIdFilter)
        : reports;

      filtered.forEach((report) => {
        const icon   = buildReportIcon(report.status);
        const marker = L.marker([report.lat, report.lng], {
          icon,
          zIndexOffset: 300,
        }).addTo(reportLayerRef.current!);

        // Popup content
        const cfg          = REPORT_COLORS[report.status];
        const statusLabel  = report.status === "pending" ? "Chờ xử lý" : report.status === "assigned" ? "Đang thu gom" : "Hoàn thành";
        const statusColor  = report.status === "pending" ? "#ef4444" : report.status === "assigned" ? "#3b82f6" : "#10b981";
        const reportTime   = new Date(report.reportedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

        let timelineHtml = `
          <div style="margin-top:8px;border-top:1px solid #f0f0f0;padding-top:8px;">
            <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;">
              <div style="width:8px;height:8px;border-radius:50%;background:#6366f1;margin-top:3px;flex-shrink:0;"></div>
              <div style="font-size:11px;color:#555;">
                <b>${report.householdName}</b> báo cáo lúc <b>${reportTime}</b>
              </div>
            </div>
        `;
        if (report.assignedTo) {
          timelineHtml += `
            <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;">
              <div style="width:8px;height:8px;border-radius:50%;background:#3b82f6;margin-top:3px;flex-shrink:0;"></div>
              <div style="font-size:11px;color:#555;">
                Giao cho <b>${report.assignedTo}</b>
              </div>
            </div>
          `;
        }
        if (report.resolvedAt) {
          const doneTime = new Date(report.resolvedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
          timelineHtml += `
            <div style="display:flex;align-items:flex-start;gap:8px;">
              <div style="width:8px;height:8px;border-radius:50%;background:#10b981;margin-top:3px;flex-shrink:0;"></div>
              <div style="font-size:11px;color:#10b981;font-weight:600;">Hoàn thành lúc ${doneTime}</div>
            </div>
          `;
        }
        timelineHtml += `</div>`;

        marker.bindPopup(`
          <div style="font-family:system-ui;min-width:220px;max-width:260px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:13px;font-weight:700;color:#111;">${report.wardName}</span>
              <span style="
                font-size:10px;font-weight:700;
                padding:2px 8px;border-radius:99px;
                background:${cfg.bg}22;color:${statusColor};
              ">${statusLabel}</span>
            </div>
            <p style="font-size:11px;color:#444;margin:0 0 4px;">${report.description}</p>
            <div style="font-size:10px;color:#888;margin-bottom:4px;">
              ${report.wasteKg} kg &nbsp;|&nbsp; ${WASTE_TYPE_LABEL[report.wasteType] ?? "Hỗn hợp"}
            </div>
            ${timelineHtml}
          </div>
        `, { maxWidth: 280, className: "monitoring-leaflet-popup" });

        marker.on("click", () => {
          if (onReportSelect) onReportSelect(report);
        });
      });
    },
    [reports, onReportSelect]
  );

  // ─── Draw WARD LEVEL ─────────────────────────────────────────────────────
  const drawWardView = useCallback(() => {
    const map = mapRef.current;
    if (!map || !wardLayerRef.current || !householdLayerRef.current || areas.length === 0) return;

    wardLayerRef.current.clearLayers();
    householdLayerRef.current.clearLayers();

    areas.forEach((ward) => {
      const fillColor = WARD_FILL[ward.status] ?? "#6b7280";

      // Glow circle
      const glowRadius = 250 + (ward.totalWaste / 5000) * 600;
      L.circle([ward.lat, ward.lng], {
        radius:      glowRadius,
        fillColor,
        fillOpacity: 0.17,
        stroke:      false,
        interactive: false,
        pane:        "overlayPane",
      }).addTo(wardLayerRef.current!);

      // Ward polygon
      if (ward.bounds && ward.bounds.length >= 3) {
        const latlngs = ward.bounds.map(([lat, lng]) => [lat, lng] as [number, number]);
        const poly = L.polygon(latlngs, {
          color:       fillColor,
          weight:      2.5,
          opacity:     0.9,
          fillColor,
          fillOpacity: 0.26,
        }).addTo(wardLayerRef.current!);

        poly.on("click", () => handleWardClick(ward));
        poly.on("mouseover", () => poly.setStyle({ fillOpacity: 0.44, weight: 3.5 }));
        poly.on("mouseout",  () => poly.setStyle({ fillOpacity: 0.26, weight: 2.5 }));

        const pendingCount = reports.filter(r => r.wardId === ward.id && r.status === "pending").length;
        const pendingBadge = pendingCount > 0
          ? `<span style="display:inline-block;background:#ef4444;color:white;font-size:10px;font-weight:700;padding:0 5px;border-radius:99px;margin-left:4px;">${pendingCount} chờ</span>`
          : "";

        poly.bindTooltip(`
          <div style="padding:4px 6px;font-family:system-ui;min-width:160px;">
            <strong style="display:block;margin-bottom:3px;font-size:13px;">${ward.name}${pendingBadge}</strong>
            <span style="font-size:11px;color:#555;">Dân số: ${ward.population.toLocaleString()}</span><br/>
            <span style="font-size:11px;color:#555;">Rác: ${ward.totalWaste.toLocaleString()} kg/tháng</span><br/>
            <span style="font-size:11px;color:#555;">Hộ dân: ${HOUSEHOLDS.filter(h => h.wardId === ward.id).length}</span><br/>
            <span style="font-size:11px;color:#555;">Báo cáo chờ: ${ward.reports}</span>
          </div>
        `, { direction: "top", offset: [0, -4], className: "monitoring-leaflet-tooltip" });
      }

      // Label pin
      const wasteLabel = ward.totalWaste >= 1000
        ? `${(ward.totalWaste / 1000).toFixed(1)}t`
        : `${ward.totalWaste}kg`;
      const pendingCt = reports.filter(r => r.wardId === ward.id && r.status === "pending").length;

      const labelIcon = L.divIcon({
        className: "ward-label-icon",
        iconSize:  [148, 52],
        iconAnchor:[74, 26],
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;">
            <div style="
              background:white;border:2px solid ${fillColor};border-radius:10px;
              padding:4px 10px;box-shadow:0 2px 10px rgba(0,0,0,0.18);
              text-align:center;cursor:pointer;pointer-events:auto;position:relative;
            ">
              <span style="font-size:11px;font-weight:700;color:#222;display:block;white-space:nowrap;">
                ${ward.name.replace("Phường ", "")}
              </span>
              <span style="font-size:10px;font-weight:600;color:${fillColor};">
                ${wasteLabel}
              </span>
              ${pendingCt > 0 ? `<span style="position:absolute;top:-6px;right:-6px;background:#ef4444;color:white;font-size:9px;font-weight:700;padding:1px 5px;border-radius:99px;border:1.5px solid white;">${pendingCt}</span>` : ""}
            </div>
          </div>
        `,
      });

      L.marker([ward.lat, ward.lng], { icon: labelIcon, interactive: true, zIndexOffset: 100 })
        .addTo(wardLayerRef.current!)
        .on("click", () => handleWardClick(ward));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, reports]);

  // ─── Draw HOUSEHOLD LEVEL ────────────────────────────────────────────────
  const drawHouseholdView = useCallback((wardId: number) => {
    const map = mapRef.current;
    if (!map || !wardLayerRef.current || !householdLayerRef.current) return;

    wardLayerRef.current.clearLayers();
    householdLayerRef.current.clearLayers();

    const ward = areas.find(a => a.id === wardId);
    if (!ward) return;

    const households = HOUSEHOLDS.filter(h => h.wardId === wardId);

    // Faded polygon background
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

    // Ward banner
    const wardLabelIcon = L.divIcon({
      className: "ward-banner-icon",
      iconSize:  [220, 28],
      iconAnchor:[110, 14],
      html: `
        <div style="
          background:${WARD_FILL[ward.status]};
          color:white;border-radius:20px;padding:4px 14px;
          font-size:12px;font-weight:700;text-align:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.2);
          white-space:nowrap;pointer-events:none;
        ">${ward.name} — ${ward.population.toLocaleString()} dân</div>
      `,
    });
    L.marker([ward.lat, ward.lng], { icon: wardLabelIcon, interactive: false, zIndexOffset: 500 })
      .addTo(householdLayerRef.current!);

    // Household markers
    households.forEach((hh) => {
      const color  = WARD_FILL[hh.status] ?? "#6b7280";
      const radius = 60 + (hh.waste / 600) * 120;

      L.circle([hh.lat, hh.lng], {
        radius: radius * 2.2, fillColor: color, fillOpacity: 0.1, stroke: false, interactive: false,
      }).addTo(householdLayerRef.current!);

      const circle = L.circle([hh.lat, hh.lng], {
        radius, fillColor: color, fillOpacity: 0.75, color: "white", weight: 2,
      }).addTo(householdLayerRef.current!);

      const statusLabel = hh.status === "red" ? "Cao" : hh.status === "yellow" ? "Trung bình" : "Thấp";
      circle.bindTooltip(`
        <div style="padding:5px 8px;font-family:system-ui;min-width:180px;">
          <strong style="display:block;font-size:13px;margin-bottom:2px;">${hh.name}</strong>
          <span style="font-size:10px;color:#777;">${hh.address}</span><br/>
          <span style="font-size:11px;color:#444;margin-top:3px;display:block;">Rác: ${hh.waste} kg/tháng &nbsp;|&nbsp; <span style="color:${color}">${statusLabel}</span></span>
          ${hh.reportCount > 0 ? `<span style="font-size:10px;color:#ef4444;">${hh.reportCount} báo cáo</span>` : ""}
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

  // ─── Ward click ──────────────────────────────────────────────────────────
  const handleWardClick = useCallback((ward: UrbanArea) => {
    setViewLevel("household");
    setActiveWardId(ward.id);
    onAreaSelect(ward);
  }, [onAreaSelect]);

  // ─── Back to ward view ───────────────────────────────────────────────────
  const handleBackToWardView = useCallback(() => {
    setViewLevel("ward");
    setActiveWardId(null);
    const map = mapRef.current;
    if (map) map.flyTo([16.065, 108.225], 13, { duration: 0.8 });
  }, []);

  // ─── Redraw when data changes ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || areas.length === 0) return;
    if (viewLevel === "ward") {
      drawWardView();
      drawReportPins(null);
    } else if (viewLevel === "household" && activeWardId !== null) {
      drawHouseholdView(activeWardId);
      drawReportPins(activeWardId);
    }
  }, [mapLoaded, viewLevel, activeWardId, areas, reports, drawWardView, drawHouseholdView, drawReportPins]);

  // ─── Highlight from report list click ────────────────────────────────────
  useEffect(() => {
    if (!highlightAreaName || !mapLoaded) return;
    const area = areas.find((a) => a.name === highlightAreaName);
    if (!area) return;
    setViewLevel("household");
    setActiveWardId(area.id);
  }, [highlightAreaName, areas, mapLoaded]);

  // ─── Summary for legend ────────────────────────────────────────────────
  const pendingCount  = reports.filter(r => r.status === "pending").length;
  const assignedCount = reports.filter(r => r.status === "assigned").length;
  const doneCount     = reports.filter(r => r.status === "done").length;

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

      {/* Back button */}
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

      {/* Breadcrumb */}
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
              <span className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ background: item.color }} />
              <span className="text-gray-500 whitespace-nowrap">{item.label}</span>
            </div>
          ))}

          {/* Report pin legend */}
          <div className="border-t border-gray-100 pt-2 mt-1 space-y-1.5">
            <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Báo cáo rác ({reports.length})</p>
            {[
              { color: "#ef4444", label: `Chờ xử lý (${pendingCount})` },
              { color: "#3b82f6", label: `Đang thu gom (${assignedCount})` },
              { color: "#10b981", label: `Hoàn thành (${doneCount})` },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-gray-500 whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </div>

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
        .monitoring-leaflet-tooltip::before { display: none !important; }
        .monitoring-leaflet-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
          padding: 4px !important;
        }
        .monitoring-leaflet-popup .leaflet-popup-tip { opacity: 0.4; }
        .ward-label-icon, .ward-banner-icon { background: none !important; border: none !important; }
      `}</style>
    </div>
  );
}
