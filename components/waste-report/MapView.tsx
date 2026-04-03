"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { createRoot } from "react-dom/client";
import { WardChartPopup } from "./WardChartPopup";
import type { UrbanArea, WasteReport, EnvAlert } from "@/types/waste-report";

// Fix Leaflet's default icon path resolving issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ---------------------------------------------------------------------------
// Nominatim boundary cache — 2 tầng:
//   1. localStorage  → tồn tại qua reload, đóng/mở tab
//   2. _memCache     → Map in-memory, truy cập O(1) trong session
//
// ⚠ Bump CACHE_VERSION để invalidate cache cũ khi cần
// ---------------------------------------------------------------------------
const CACHE_VERSION = "v2";                              // v1 → v2: xoá null poisoned entries
const LS_PREFIX = `nominatim_boundary_${CACHE_VERSION}_`;
const LS_OLD_PREFIXES = ["nominatim_boundary_v1_"];       // các version cũ cần dọn
const _memCache = new Map<string, GeoJSON.GeoJsonObject | null>();

// Dọn dẹp các key thuộc version cũ (chạy 1 lần khi module load)
if (typeof window !== "undefined") {
  try {
    const oldKeys = Object.keys(localStorage).filter((k) =>
      LS_OLD_PREFIXES.some((prefix) => k.startsWith(prefix))
    );
    oldKeys.forEach((k) => localStorage.removeItem(k));
    if (oldKeys.length > 0) {
      console.info(`[boundary-cache] Cleaned ${oldKeys.length} stale keys from old versions`);
    }
  } catch { /* ignore */ }
}

/** Đọc từ localStorage → geo object hoặc undefined nếu chưa có */
function lsGet(ward: string): GeoJSON.GeoJsonObject | null | undefined {
  try {
    const raw = localStorage.getItem(LS_PREFIX + ward);
    if (raw === null) return undefined;          // chưa có trong LS
    const parsed = JSON.parse(raw);
    // Paranoia check: nếu parse ra null thì coi như chưa có (không trust)
    // Chỉ trust null nếu đây là v2+ (proxy hoạt động)
    return parsed as GeoJSON.GeoJsonObject | null;
  } catch {
    return undefined;
  }
}

/** Ghi vào localStorage */
function lsSet(ward: string, geo: GeoJSON.GeoJsonObject | null): void {
  try {
    localStorage.setItem(LS_PREFIX + ward, JSON.stringify(geo));
  } catch { /* quota exceeded — ignore */ }
}

/** Xoá toàn bộ cache boundary (dùng khi cần refresh) */
export function clearBoundaryCache(): void {
  _memCache.clear();
  Object.keys(localStorage)
    .filter((k) => k.startsWith(LS_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}

async function fetchWardBoundary(
  ward: string
): Promise<{ ward: string; geo: GeoJSON.GeoJsonObject | null }> {
  // 1️⃣ In-memory cache
  if (_memCache.has(ward)) return { ward, geo: _memCache.get(ward)! };

  // 2️⃣ localStorage cache
  const cached = lsGet(ward);
  if (cached !== undefined) {
    _memCache.set(ward, cached);          // warm in-memory
    return { ward, geo: cached };
  }

  // 3️⃣ Gọi qua Next.js proxy (tránh CORS với Nominatim)
  try {
    const q = `${ward}, Đà Nẵng, Việt Nam`;
    const res = await fetch(`/api/nominatim?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error(`Proxy error ${res.status}`);
    const data = await res.json();
    const geo: GeoJSON.GeoJsonObject | null =
      Array.isArray(data) && data.length > 0 && data[0].geojson
        ? data[0].geojson
        : null;

    _memCache.set(ward, geo);
    lsSet(ward, geo);                     // persist vào localStorage
    return { ward, geo };
  } catch {
    _memCache.set(ward, null);
    lsSet(ward, null);
    return { ward, geo: null };
  }
}

// Danh sách phường cần vẽ boundary
const WARD_NAMES = [
  "An Hải", "An Khê", "An Thắng", "Avyương", "Bà Nà", "Bàn Thạch",
  "Bến Giằng", "Bến Hiên", "Cẩm Lệ", "Chiên Đàn", "Duy Nghĩa", "Duy Xuyên",
  "Đại Lộc", "Đắc Pring", "Điện Bàn", "Điện Bàn Bắc", "Điện Bàn Đông",
  "Điện Bàn Tây", "Đồng Dương", "Đông Giang", "Đức Phú", "Gò Nổi", "Hà Nha",
  "Hải Châu", "Hải Vân", "Hiệp Đức", "Hòa Cường", "Hòa Khánh", "Hòa Tiến",
  "Hòa Vang", "Hòa Xuân", "Hoàng Sa", "Hội An", "Hội An Đông", "Hội An Tây",
  "Hùng Sơn", "Hương Trà", "Khâm Đức", "La Dêeê", "La Êeê", "Lãnh Ngọc",
  "Liên Chiểu", "Nam Giang", "Nam Phước", "Nam Trà My", "Ngũ Hành Sơn",
  "Nông Sơn", "Núi Thành", "Phú Ninh", "Phú Thuận", "Phước Chánh",
  "Phước Hiệp", "Phước Năng", "Phước Thành", "Phước Trà", "Quảng Phú",
  "Quế Phước", "Quế Sơn", "Quế Sơn Trung", "Sông Kôn", "Sông Vàng",
  "Sơn Cẩm Hà", "Sơn Trà", "Tam Anh", "Tam Hải", "Tam Kỳ", "Tam Mỹ",
  "Tam Xuân", "Tân Hiệp", "Tây Giang", "Tây Hồ", "Thạnh Bình", "Thanh Khê",
  "Thạnh Mỹ", "Thăng An", "Thăng Bình", "Thăng Điền", "Thăng Phú",
  "Thăng Trường", "Thu Bồn", "Thượng Đức", "Tiên Phước", "Trà Đốc",
  "Trà Giáp", "Trà Leng", "Trà Liên", "Trà Linh", "Trà My", "Trà Tân",
  "Trà Tập", "Trà Vân", "Việt An", "Vu Gia", "Xuân Phú",
];

const BOUNDARY_DEFAULT: L.PathOptions = {
  color: "#3b82f6", weight: 1.5,
  fillColor: "#3b82f6", fillOpacity: 0.08, opacity: 0.7,
};
const BOUNDARY_HOVER: L.PathOptions = {
  color: "#1d4ed8", weight: 2.5,
  fillColor: "#1d4ed8", fillOpacity: 0.22, opacity: 1,
};

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
  normal: { color: "#10b981", border: "#059669", label: "Bình thường", pulse: false },
  warning: { color: "#f59e0b", border: "#d97706", label: "Cảnh báo", pulse: false },
  critical: { color: "#ef4444", border: "#b91c1c", label: "Nguy hiểm", pulse: true },
};

// Ward-level status → badge color (derived from UrbanArea.status)
const WARD_STATUS_CFG: Record<string, { color: string; border: string; label: string }> = {
  red: { color: "#ef4444", border: "#b91c1c", label: "Nguy hiểm" },
  yellow: { color: "#f59e0b", border: "#d97706", label: "Cảnh báo" },
  green: { color: "#10b981", border: "#059669", label: "Bình thường" },
};

const REPORT_COLORS: Record<string, { bg: string; border: string; pulse: boolean }> = {
  pending: { bg: "#ef4444", border: "#b91c1c", pulse: true },
  assigned: { bg: "#3b82f6", border: "#1d4ed8", pulse: false },
  done: { bg: "#10b981", border: "#059669", pulse: false },
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
  // Layer for ward boundary polygons from Nominatim (level 1)
  const boundaryLayerRef = useRef<L.LayerGroup | null>(null);
  // Layer for env-alert detail markers (level 2)
  const alertLayerRef = useRef<L.LayerGroup | null>(null);
  // Layer for report pins (always on top)
  const reportLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [boundaryLoading, setBoundaryLoading] = useState(false);
  const [boundaryLoaded, setBoundaryLoaded] = useState(0);

  const [popupWardData, setPopupWardData] = useState<{ wardName: string; reports: WasteReport[], allReports?: WasteReport[] } | null>(null);

  // Ref luôn trỏ vào reports mới nhất — dùng trong popup click handler
  const reportsRef = useRef<typeof reports>(reports);
  useEffect(() => { reportsRef.current = reports; }, [reports]);

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

    wardLayerRef.current = L.layerGroup().addTo(map);
    boundaryLayerRef.current = L.layerGroup().addTo(map); // polygons dưới ward markers
    alertLayerRef.current = L.layerGroup().addTo(map);
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

  // ── BOUNDARY: fetch + draw 1 lần khi map sẵn sàng ─────────────────────────
  // Không phụ thuộc vào reports — popup sẽ đọc từ reportsRef tại thời điểm click
  const drawWardBoundaries = useCallback(async () => {
    if (!boundaryLayerRef.current) return;
    boundaryLayerRef.current.clearLayers();
    setBoundaryLoading(true);
    let loaded = 0;
    const BATCH = 8;

    for (let i = 0; i < WARD_NAMES.length; i += BATCH) {
      if (!boundaryLayerRef.current) break;

      const batch = WARD_NAMES.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(fetchWardBoundary));

      results.forEach(({ ward, geo }) => {
        if (!geo || !boundaryLayerRef.current) return;

        // Style mặc định xanh — sẽ cập nhật màu khi reports có dữ liệu
        const defaultStyle: L.PathOptions = {
          color: "#3b82f6", weight: 1.8,
          fillColor: "#3b82f6", fillOpacity: 0.08, opacity: 0.8,
        };
        const hoverBaseStyle: L.PathOptions = {
          color: "#1d4ed8", weight: 2.8,
          fillColor: "#1d4ed8", fillOpacity: 0.22, opacity: 1,
        };

        const geoLayer = L.geoJSON(geo, {
          style: () => ({ ...defaultStyle }),
          onEachFeature: (_feat, featureLayer) => {
            if (!(featureLayer instanceof L.Path)) return;

            featureLayer.on({
              mouseover: () => {
                // Tính màu dynamic từ reports hiện tại
                const snap = reportsRef.current;
                const wPending = snap.filter(
                  (r) => r.wardName.toLowerCase().includes(ward.toLowerCase()) ||
                    ward.toLowerCase().includes(r.wardName.toLowerCase())
                ).filter(r => r.status === "pending").length;
                const wTotal = snap.filter(
                  (r) => r.wardName.toLowerCase().includes(ward.toLowerCase()) ||
                    ward.toLowerCase().includes(r.wardName.toLowerCase())
                ).length;
                const hColor = wPending > 3 ? "#ef4444"
                  : wPending > 0 ? "#f59e0b"
                    : wTotal > 0 ? "#10b981"
                      : "#1d4ed8";
                featureLayer.setStyle({ ...hoverBaseStyle, color: hColor, fillColor: hColor });
              },
              mouseout: () => {
                featureLayer.setStyle({ ...defaultStyle });
              },
              click: (e: L.LeafletMouseEvent) => {
                // Zoom vào polygon
                const bounds = (featureLayer as unknown as L.Polygon).getBounds?.();
                if (bounds) {
                  mapRef.current?.flyToBounds(bounds.pad(0.08), {
                    duration: 0.6, maxZoom: 15,
                  });
                }

                // Lọc danh sách reports thuộc phường hiện tại
                const snap = reportsRef.current;
                const wardReports = snap.filter(
                  (r) => r.wardName.toLowerCase().includes(ward.toLowerCase()) ||
                    ward.toLowerCase().includes(r.wardName.toLowerCase())
                );

                // Hiện Popup bự ở giữa màn hình (React state)
                setPopupWardData({ wardName: ward, reports: wardReports, allReports: snap });
              },
            });

            featureLayer.bindTooltip(ward, {
              sticky: true, direction: "top", offset: [0, -4],
              className: "monitoring-leaflet-tooltip",
            });
          },
        });

        boundaryLayerRef.current!.addLayer(geoLayer);
        loaded++;
        setBoundaryLoaded(loaded);
      });

      if (i + BATCH < WARD_NAMES.length) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    setBoundaryLoading(false);
  }, []); // deps rỗng — chỉ chạy 1 lần khi mount

  // ── Draw report pins ─────────────────────────────────────────────────────
  const drawReportPins = useCallback(
    (wardName: string | null) => {
      if (!reportLayerRef.current) return;
      reportLayerRef.current.clearLayers();

      // Level 1 và 2 đều hiển thị toàn bộ báo cáo
      const filtered = reports;

      filtered.forEach((report) => {
        // Bỏ qua report có tọa độ (0,0) — dữ liệu không hợp lệ
        if (report.lat === 0 && report.lng === 0) return;

        const icon = buildReportIcon(report.status);
        const marker = L.marker([report.lat, report.lng], {
          icon,
          zIndexOffset: 500,
        }).addTo(reportLayerRef.current!);

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
      // ── Level 1: boundary polygons + report pins ──
      wardLayerRef.current?.clearLayers();
      alertLayerRef.current?.clearLayers();
      drawReportPins(null);
      // Boundary layer luôn được hiện ở level 1
      if (boundaryLayerRef.current && !mapRef.current?.hasLayer(boundaryLayerRef.current)) {
        mapRef.current?.addLayer(boundaryLayerRef.current);
      }
      mapRef.current?.flyTo([16.065, 108.220], 10, { duration: 0.6 });
    } else {
      // ── Level 2: ward detail — ẩn boundary để gọn bản đồ ──
      wardLayerRef.current?.clearLayers();
      if (boundaryLayerRef.current) {
        mapRef.current?.removeLayer(boundaryLayerRef.current);
      }
      drawAlertDetail(selectedWardName);
      drawReportPins(selectedWardName);

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
    drawAlertDetail,
    drawReportPins,
  ]);

  // ── Fetch boundaries 1 lần ngay khi map sẵn sàng ────────────────────────────
  useEffect(() => {
    if (!mapLoaded) return;
    drawWardBoundaries();
  }, [mapLoaded, drawWardBoundaries]);

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
  const normalCount = visibleAlerts.filter((a) => a.level === "normal").length;
  const warningCount = visibleAlerts.filter((a) => a.level === "warning").length;
  const criticalCount = visibleAlerts.filter((a) => a.level === "critical").length;
  const pendingCount = reports.filter((r) => !selectedWardName || r.wardName === selectedWardName).filter(r => r.status === "pending").length;
  const assignedCount = reports.filter((r) => !selectedWardName || r.wardName === selectedWardName).filter(r => r.status === "assigned").length;
  const doneCount = reports.filter((r) => !selectedWardName || r.wardName === selectedWardName).filter(r => r.status === "done").length;

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

      {/* Boundary loading badge — non-blocking, góc dưới trái */}
      {mapLoaded && !selectedWardName && boundaryLoading && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm border border-blue-100 shadow-sm rounded-xl px-3 py-2 text-xs flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-700">Đang tải ranh giới phường…</p>
            <div className="mt-1 w-28 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${(boundaryLoaded / WARD_NAMES.length) * 100}%` }}
              />
            </div>
            <p className="text-gray-400 mt-0.5">{boundaryLoaded} / {WARD_NAMES.length}</p>
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
            Click vào phường để xem biểu đồ thống kê báo cáo của các phường
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
                { color: ALERT_CFG.normal.color, label: `Bình thường (${normalCount})` },
                { color: ALERT_CFG.warning.color, label: `Cảnh báo (${warningCount})` },
                { color: ALERT_CFG.critical.color, label: `Nguy hiểm (${criticalCount})` },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-gray-500 whitespace-nowrap">{item.label}</span>
                </div>
              ))}
            </>
          ) : (
            // Level 1 legend: boundary color meaning
            <>
              {[
                { color: "#ef4444", label: "Nhiều báo cáo chờ" },
                { color: "#f59e0b", label: "Có báo cáo chờ" },
                { color: "#10b981", label: "Đã xử lý xong" },
                { color: "#3b82f6", label: "Không có báo cáo" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm border-2 border-white shadow-sm flex-shrink-0" style={{ background: item.color }} />
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
        </div>
      )}

      {/* React Modal (thay vì Leaflet Popup) cho thống kê Phường */}
      {popupWardData && (
        <div className="absolute inset-0 z-[2000] bg-white/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full h-full p-6 flex flex-col">
            <WardChartPopup 
              wardName={popupWardData.wardName} 
              reports={popupWardData.reports} 
              allReports={popupWardData.allReports}
              onClose={() => setPopupWardData(null)}
            />
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
