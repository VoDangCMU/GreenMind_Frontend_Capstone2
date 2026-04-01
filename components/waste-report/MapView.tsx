"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import type { UrbanArea, WasteReport, EnvAlert } from "@/types/waste-report";

interface MapViewProps {
  areas: UrbanArea[];
  reports: WasteReport[];
  envAlerts: EnvAlert[];
  selectedWardName: string | null;
  selectedAreaId: number | null;
  highlightAreaName: string | null;
  onAreaSelect: (area: UrbanArea) => void;
  onReportSelect?: (report: WasteReport) => void;
  onClearSelection?: () => void;
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Alert level config
// ---------------------------------------------------------------------------
const ALERT_CFG: Record<
  string,
  { color: string; border: string; label: string; pulse: boolean }
> = {
  normal:   { color: "#10b981", border: "#059669", label: "Bình thường", pulse: false },
  warning:  { color: "#f59e0b", border: "#d97706", label: "Cảnh báo",    pulse: false },
  critical: { color: "#ef4444", border: "#b91c1c", label: "Nguy hiểm",   pulse: true  },
};

// Ward-level status → badge color (derived from UrbanArea.status)
const WARD_STATUS_CFG: Record<string, { color: string; border: string; label: string }> = {
  red:    { color: "#ef4444", border: "#b91c1c", label: "Nguy hiểm"  },
  yellow: { color: "#f59e0b", border: "#d97706", label: "Cảnh báo"   },
  green:  { color: "#10b981", border: "#059669", label: "Bình thường" },
};

const REPORT_COLORS: Record<string, { bg: string; border: string; pulse: boolean }> = {
  pending:  { bg: "#ef4444", border: "#b91c1c", pulse: true  },
  assigned: { bg: "#3b82f6", border: "#1d4ed8", pulse: false },
  done:     { bg: "#10b981", border: "#059669", pulse: false },
};

const WASTE_TYPE_LABEL: Record<string, string> = {
  plastic: "Nhựa", organic: "Hữu cơ", mixed: "Hỗn hợp", hazardous: "Nguy hại",
};

// ---------------------------------------------------------------------------
// Build ward-level marker (label pin with ward name)
// ---------------------------------------------------------------------------
function buildWardMarkerIcon(ward: UrbanArea, pendingCount: number): L.DivIcon {
  const cfg = WARD_STATUS_CFG[ward.status] ?? WARD_STATUS_CFG.green;
  const shortName = ward.name.replace(/^Phường /, "");

  return L.divIcon({
    className: "",
    iconSize: [140, 48],
    iconAnchor: [70, 48],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;">
        <!-- label card -->
        <div style="
          position:relative;
          background:white;
          border:2.5px solid ${cfg.color};
          border-radius:12px;
          padding:5px 12px;
          box-shadow:0 3px 12px rgba(0,0,0,0.15);
          text-align:center;
          transition:transform 0.15s;
        ">
          <span style="font-size:12px;font-weight:700;color:#1f2937;display:block;white-space:nowrap;">
            ${shortName}
          </span>
          <span style="font-size:10px;font-weight:600;color:${cfg.color};">
            ${cfg.label}
          </span>
          ${pendingCount > 0 ? `
            <span style="
              position:absolute;top:-7px;right:-7px;
              background:#ef4444;color:white;
              font-size:9px;font-weight:700;
              padding:1px 5px;border-radius:99px;
              border:2px solid white;
              white-space:nowrap;
            ">${pendingCount} báo cáo</span>
          ` : ""}
        </div>
        <!-- tail -->
        <div style="
          width:0;height:0;
          border-left:7px solid transparent;
          border-right:7px solid transparent;
          border-top:8px solid ${cfg.color};
          margin-top:-1px;
        "></div>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Build env alert detail marker (teardrop)
// ---------------------------------------------------------------------------
function buildAlertIcon(level: string): L.DivIcon {
  const cfg = ALERT_CFG[level] ?? ALERT_CFG.normal;
  const pulseStyle = cfg.pulse
    ? `animation:alert-pin-pulse 1.4s ease-in-out infinite;`
    : "";

  return L.divIcon({
    className: "",
    iconSize: [24, 30],
    iconAnchor: [12, 30],
    popupAnchor: [0, -32],
    html: `
      <div style="position:relative;width:24px;height:30px;${pulseStyle}">
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:8px;height:3px;background:rgba(0,0,0,0.15);border-radius:50%;"></div>
        <div style="
          position:absolute;top:0;left:0;
          width:24px;height:24px;
          background:${cfg.color};
          border:2.5px solid ${cfg.border};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 3px 8px rgba(0,0,0,0.25);
        "></div>
        <div style="
          position:absolute;top:5px;left:5px;
          width:10px;height:10px;
          background:white;border-radius:50%;opacity:0.75;
        "></div>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Build report pin icon
// ---------------------------------------------------------------------------
function buildReportIcon(status: string): L.DivIcon {
  const cfg = REPORT_COLORS[status] ?? REPORT_COLORS.pending;
  const pulseStyle = cfg.pulse ? `animation:alert-pin-pulse 1.4s ease-in-out infinite;` : "";
  return L.divIcon({
    className: "",
    iconSize: [22, 28],
    iconAnchor: [11, 28],
    popupAnchor: [0, -30],
    html: `
      <div style="position:relative;width:22px;height:28px;${pulseStyle}">
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:7px;height:3px;background:rgba(0,0,0,0.15);border-radius:50%;"></div>
        <div style="position:absolute;top:0;left:0;width:22px;height:22px;background:${cfg.bg};border:2px solid ${cfg.border};border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.22);"></div>
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
  envAlerts,
  selectedWardName,
  highlightAreaName,
  onAreaSelect,
  onReportSelect,
  onClearSelection,
  loading,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // Layer for ward-overview markers (level 1)
  const wardLayerRef = useRef<L.LayerGroup | null>(null);
  // Layer for env-alert detail markers (level 2)
  const alertLayerRef = useRef<L.LayerGroup | null>(null);
  // Layer for report pins (always on top)
  const reportLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  // ── Inject keyframe once ────────────────────────────────────────────────
  useEffect(() => {
    const id = "alert-pin-style";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = `
        @keyframes alert-pin-pulse {
          0%,100% { transform: scale(1) translateY(0); }
          50%      { transform: scale(1.2) translateY(-3px); }
        }
      `;
      document.head.appendChild(s);
    }
  }, []);

  // ── Init map once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [16.065, 108.220],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.control.zoom({ position: "topleft" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

    wardLayerRef.current   = L.layerGroup().addTo(map);
    alertLayerRef.current  = L.layerGroup().addTo(map);
    reportLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;
    setMapLoaded(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── LEVEL 1: Draw one marker per ward ───────────────────────────────────
  const drawWardOverview = useCallback(() => {
    if (!wardLayerRef.current) return;
    wardLayerRef.current.clearLayers();

    areas.forEach((ward) => {
      const pendingCount = reports.filter(
        (r) => r.wardName === ward.name && r.status === "pending"
      ).length;
      const icon = buildWardMarkerIcon(ward, pendingCount);

      L.marker([ward.lat, ward.lng], { icon, zIndexOffset: 100 })
        .addTo(wardLayerRef.current!)
        .on("click", () => onAreaSelect(ward));
    });
  }, [areas, reports, onAreaSelect]);

  // ── LEVEL 2: Draw env-alert detail markers for one ward ─────────────────
  const drawAlertDetail = useCallback(
    (wardName: string) => {
      if (!alertLayerRef.current) return;
      alertLayerRef.current.clearLayers();

      const filtered = envAlerts.filter((a) => a.wardName === wardName);

      filtered.forEach((alert) => {
        const cfg = ALERT_CFG[alert.level] ?? ALERT_CFG.normal;
        const icon = buildAlertIcon(alert.level);

        const marker = L.marker([alert.lat, alert.lng], {
          icon,
          zIndexOffset: 300,
        }).addTo(alertLayerRef.current!);

        marker.bindPopup(
          `<div style="font-family:system-ui;min-width:200px;max-width:240px;padding:2px 0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:13px;font-weight:700;color:#111;">${alert.wardName}</span>
              <span style="
                font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;
                background:${cfg.color}22;color:${cfg.color};border:1px solid ${cfg.color}44;
              ">${cfg.label}</span>
            </div>
            ${alert.description ? `<p style="font-size:11px;color:#555;margin:0 0 6px;">${alert.description}</p>` : ""}
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${cfg.color};display:inline-block;flex-shrink:0;"></span>
              <span style="font-size:10px;color:#aaa;">${alert.lat.toFixed(4)}, ${alert.lng.toFixed(4)}</span>
            </div>
          </div>`,
          { maxWidth: 260, className: "monitoring-leaflet-popup" }
        );
      });
    },
    [envAlerts]
  );

  // ── Draw report pins ─────────────────────────────────────────────────────
  const drawReportPins = useCallback(
    (wardName: string | null) => {
      if (!reportLayerRef.current) return;
      reportLayerRef.current.clearLayers();

      // Level 1: hiện tất cả | Level 2: lọc theo phường
      const filtered = wardName
        ? reports.filter((r) => r.wardName === wardName)
        : reports;

      filtered.forEach((report) => {
        // Bỏ qua report có tọa độ (0,0) — dữ liệu không hợp lệ
        if (report.lat === 0 && report.lng === 0) return;

        const icon = buildReportIcon(report.status);
        const marker = L.marker([report.lat, report.lng], {
          icon,
          zIndexOffset: 500,
        }).addTo(reportLayerRef.current!);

        const statusLabel =
          report.status === "pending"  ? "Chờ xử lý" :
          report.status === "assigned" ? "Đang thu gom" : "Hoàn thành";
        const statusColor =
          report.status === "pending"  ? "#ef4444" :
          report.status === "assigned" ? "#3b82f6" : "#10b981";
        const wasteLabel = WASTE_TYPE_LABEL[report.wasteType] ?? report.wasteType;

        marker.bindPopup(
          `<div style="font-family:system-ui;min-width:220px;max-width:270px;">
            <!-- Header: code + status badge -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:13px;font-weight:700;color:#111;">${report.code || report.id.slice(0, 8).toUpperCase()}</span>
              <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;">${statusLabel}</span>
            </div>
            <!-- Ward -->
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;">
              <span style="font-size:11px;color:#6b7280;">📍</span>
              <span style="font-size:11px;font-weight:600;color:#374151;">${report.wardName}</span>
            </div>
            <!-- Waste type -->
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:8px;">
              <span style="font-size:11px;color:#6b7280;">♻️</span>
              <span style="font-size:11px;color:#374151;">Loại rác: <strong>${wasteLabel}</strong></span>
            </div>
            <!-- Extra info -->
            <div style="font-size:10px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:6px;">
              ${report.wasteKg} kg &nbsp;·&nbsp; ${report.description}
            </div>
          </div>`,
          { maxWidth: 290, className: "monitoring-leaflet-popup" }
        );

        marker.on("click", () => {
          if (onReportSelect) onReportSelect(report);
        });
      });
    },
    [reports, onReportSelect]
  );

  // ── Main render logic: switch between level 1 and level 2 ───────────────
  useEffect(() => {
    if (!mapLoaded) return;

    if (!selectedWardName) {
      // ── Level 1: ward overview + ALL report pins ──
      if (areas.length > 0) drawWardOverview();
      alertLayerRef.current?.clearLayers();
      drawReportPins(null); // hiện tất cả markers từ API
      mapRef.current?.flyTo([16.065, 108.220], 13, { duration: 0.6 });
    } else {
      // ── Level 2: ward detail ──
      wardLayerRef.current?.clearLayers();
      drawAlertDetail(selectedWardName);
      drawReportPins(selectedWardName);

      // Fly to the selected ward
      const ward = areas.find((a) => a.name === selectedWardName);
      if (ward) {
        if (ward.bounds && ward.bounds.length >= 3) {
          const bounds = L.latLngBounds(ward.bounds.map(([lat, lng]) => L.latLng(lat, lng)));
          mapRef.current?.flyToBounds(bounds.pad(0.35), { duration: 0.8, maxZoom: 16 });
        } else {
          mapRef.current?.flyTo([ward.lat, ward.lng], 15, { duration: 0.8 });
        }
      }
    }
  }, [
    mapLoaded,
    selectedWardName,
    areas,
    reports,
    envAlerts,
    drawWardOverview,
    drawAlertDetail,
    drawReportPins,
  ]);

  // ── Highlight from ReportList click ────────────────────────────────────
  useEffect(() => {
    if (!highlightAreaName || !mapLoaded) return;
    const ward = areas.find((a) => a.name === highlightAreaName);
    if (!ward) return;
    if (ward.bounds && ward.bounds.length >= 3) {
      const bounds = L.latLngBounds(ward.bounds.map(([lat, lng]) => L.latLng(lat, lng)));
      mapRef.current?.flyToBounds(bounds.pad(0.35), { duration: 0.8, maxZoom: 16 });
    } else {
      mapRef.current?.flyTo([ward.lat, ward.lng], 15, { duration: 0.8 });
    }
  }, [highlightAreaName, areas, mapLoaded]);

  // ── Legend counts ───────────────────────────────────────────────────────
  const visibleAlerts = selectedWardName
    ? envAlerts.filter((a) => a.wardName === selectedWardName)
    : envAlerts;
  const normalCount   = visibleAlerts.filter((a) => a.level === "normal").length;
  const warningCount  = visibleAlerts.filter((a) => a.level === "warning").length;
  const criticalCount = visibleAlerts.filter((a) => a.level === "critical").length;
  const pendingCount  = reports.filter((r) => !selectedWardName || r.wardName === selectedWardName).filter(r => r.status === "pending").length;
  const assignedCount = reports.filter((r) => !selectedWardName || r.wardName === selectedWardName).filter(r => r.status === "assigned").length;
  const doneCount     = reports.filter((r) => !selectedWardName || r.wardName === selectedWardName).filter(r => r.status === "done").length;

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

      {/* Level indicator + Back button (Level 2) */}
      {mapLoaded && selectedWardName && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
          <button
            onClick={() => onClearSelection?.()}
            className="bg-white/95 border border-gray-200 shadow-md rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5"
            style={{ pointerEvents: "auto" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M8 2L3 6l5 4" />
            </svg>
            Tổng quan
          </button>
          <span className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-md rounded-full px-4 py-1.5 text-xs font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            {selectedWardName}
            <span className="text-gray-400">— {visibleAlerts.length} điểm</span>
          </span>
        </div>
      )}

      {/* Hint (Level 1) */}
      {mapLoaded && !selectedWardName && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <span className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow rounded-full px-4 py-1.5 text-xs text-gray-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Click vào phường để xem chi tiết cảnh báo
          </span>
        </div>
      )}

      {/* Legend */}
      {mapLoaded && (
        <div className="absolute bottom-4 right-4 bg-white/92 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm p-3 text-xs space-y-2 z-[1000] min-w-[175px]">
          <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
            {selectedWardName ? "Cảnh báo môi trường" : "Mức độ phường"}
          </p>

          {selectedWardName ? (
            // Level 2 legend: env alert levels
            <>
              {[
                { color: ALERT_CFG.normal.color,   label: `Bình thường (${normalCount})`  },
                { color: ALERT_CFG.warning.color,  label: `Cảnh báo (${warningCount})`    },
                { color: ALERT_CFG.critical.color, label: `Nguy hiểm (${criticalCount})`  },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-gray-500 whitespace-nowrap">{item.label}</span>
                </div>
              ))}
            </>
          ) : (
            // Level 1 legend: ward status
            <>
              {[
                { color: "#ef4444", label: "Nguy hiểm"   },
                { color: "#f59e0b", label: "Cảnh báo"     },
                { color: "#10b981", label: "Bình thường"  },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-gray-500 whitespace-nowrap">{item.label}</span>
                </div>
              ))}
            </>
          )}

          {/* Report pins */}
          <div className="border-t border-gray-100 pt-2 mt-1 space-y-1.5">
            <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
              Báo cáo rác
            </p>
            {[
              { color: "#ef4444", label: `Chờ xử lý (${pendingCount})`    },
              { color: "#3b82f6", label: `Đang thu gom (${assignedCount})` },
              { color: "#10b981", label: `Hoàn thành (${doneCount})`       },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-gray-500 whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </div>
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
      `}</style>
    </div>
  );
}
