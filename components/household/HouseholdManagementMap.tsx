"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { HouseholdProfile } from "@/types/monitoring";

interface HouseholdManagementMapProps {
    households: Array<HouseholdProfile & { greenScore?: number; lat: number | string; lng: number | string; id: string | number }>;
    selectedHouseholdId: string | number | null;
    onHouseholdSelect: (household: HouseholdProfile & { greenScore?: number }) => void;
    loading: boolean;
}

const DEFAULT_MAP_CENTER: [number, number] = [16.065, 108.225];

function parseNumber(value: number | string): number {
    return typeof value === "string" ? Number(value) : value;
}

function getGreenScoreColor(score?: number | string | null): string {
    if (score != null && !Number.isNaN(Number(score))) {
        const numericScore = Number(score);
        if (numericScore < 40) return "#ef4444";
        if (numericScore < 70) return "#f59e0b";
        return "#10b981";
    }

    return "#6b7280";
}

function getScoreLabel(score?: number | string | null): string {
    if (score != null && !Number.isNaN(Number(score))) {
        return String(Math.round(Number(score)));
    }
    return "N/A";
}

function buildScoreMarkerIcon(
    score?: number | string | null,
    isSelected: boolean = false
): L.DivIcon {
    const color = getGreenScoreColor(score);
    const label = getScoreLabel(score);
    const displayScore = label !== "N/A" ? label : "?";

    // Kích thước cố định nhỏ gọn để hiển thị số
    const size = isSelected ? 30 : 22;
    const fontSize = isSelected ? 11 : 9;

    return L.divIcon({
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border: ${isSelected ? "2.5px" : "1.5px"} solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px ${color}50, 0 1px 2px rgba(0,0,0,0.15);
                font-family: 'Segoe UI', system-ui, sans-serif;
                font-size: ${fontSize}px;
                font-weight: ${isSelected ? "700" : "600"};
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                cursor: pointer;
                user-select: none;
            ">${displayScore}</div>
        `,
    });
}

function isValidLatLng(lat: number, lng: number): boolean {
    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180 &&
        !(lat === 0 && lng === 0)
    );
}

function jitterAroundCenter(seed: number): { lat: number; lng: number } {

    const baseLat = DEFAULT_MAP_CENTER[0];
    const baseLng = DEFAULT_MAP_CENTER[1];

    const a = (seed % 360) * (Math.PI / 180);
    const r = 0.002 + ((seed % 97) / 97) * 0.01;

    return {
        lat: baseLat + Math.sin(a) * r,
        lng: baseLng + Math.cos(a) * r,
    };
}

function spreadOffset(index: number): { dLat: number; dLng: number } {
    if (index <= 0) return { dLat: 0, dLng: 0 };

    // Golden-angle spiral to avoid overlap. Step ~35–200m depending on index.
    const goldenAngle = 137.5 * (Math.PI / 180);
    const angle = index * goldenAngle;
    const radius = 0.0005 * Math.sqrt(index); // degrees - increased spacing

    return {
        dLat: Math.sin(angle) * radius,
        dLng: Math.cos(angle) * radius,
    };
}

export function HouseholdManagementMap({ households, selectedHouseholdId, onHouseholdSelect, loading }: HouseholdManagementMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerLayerRef = useRef<L.LayerGroup | null>(null);
    const hasFitBoundsRef = useRef(false);
    const lastFittedCountRef = useRef(0);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [16.065, 108.225],
            zoom: 13,
            zoomControl: false,
            attributionControl: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        L.control.zoom({ position: "topleft" }).addTo(map);
        L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

        markerLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!mapRef.current || !markerLayerRef.current) return;

        markerLayerRef.current.clearLayers();

        const boundsAll = L.latLngBounds([]);
        const boundsReal = L.latLngBounds([]);
        let hasAnyMarker = false;
        let hasAnyRealMarker = false;

        const indexByKey = new Map<string, number>();

        households.forEach((household) => {
            const lat = parseNumber(household.lat);
            const lng = parseNumber(household.lng);
            const isReal = isValidLatLng(lat, lng);
            const basePoint = isReal ? { lat, lng } : jitterAroundCenter(household.id);
            const key = `${basePoint.lat.toFixed(5)}:${basePoint.lng.toFixed(5)}`;
            const idx = indexByKey.get(key) ?? 0;
            indexByKey.set(key, idx + 1);
            const offset = spreadOffset(idx);
            const point = { lat: basePoint.lat + offset.dLat, lng: basePoint.lng + offset.dLng };

            hasAnyMarker = true;
            boundsAll.extend([point.lat, point.lng]);
            if (isReal) {
                hasAnyRealMarker = true;
                boundsReal.extend([point.lat, point.lng]);
            }

            const isSelected = selectedHouseholdId != null && String(household.id) === String(selectedHouseholdId);

            const icon = buildScoreMarkerIcon(household.greenScore, isSelected);
            const marker = L.marker([point.lat, point.lng], {
                icon,
                zIndexOffset: isSelected ? 1000 : 100,
            }).addTo(markerLayerRef.current!);

            marker.bindTooltip(`
                <div style="font-family: system-ui; font-size: 12px; min-width: 170px; line-height: 1.4;">
                    <strong>${household.name}</strong><br/>
                    ${household.address}<br/>
                    ${isReal ? "" : "<em style=\"color:#64748b\">Thiếu tọa độ — hiển thị tạm gần trung tâm</em><br/>"}
                    <strong>Green Score:</strong> ${household.greenScore ?? "Không có điểm"}<br/>
                    <strong>Detect:</strong> ${household.reportCount} lần<br/>
                    <strong>Ảnh up:</strong> ${household.imageHistory?.length ?? 0} lần
                </div>
            `, { direction: "top", offset: [0, -8], className: "monitoring-leaflet-tooltip" });

            marker.on("click", () => onHouseholdSelect(household));

            if (isSelected) {
                marker.openTooltip();
                mapRef.current!.flyTo([point.lat, point.lng], 15, { duration: 0.8 });
            }
        });

        if (hasAnyMarker && selectedHouseholdId == null) {
            // Always prefer fitting to ALL markers so none are off-screen.
            // Refit when count increases (e.g. when data arrives paged/async).
            if (!hasFitBoundsRef.current || households.length > lastFittedCountRef.current) {
                mapRef.current.fitBounds(boundsAll, { padding: [28, 28], maxZoom: 15 });
                hasFitBoundsRef.current = true;
                lastFittedCountRef.current = households.length;
            }
        }
    }, [households, selectedHouseholdId, onHouseholdSelect]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gray-100 shadow-lg">
            <div ref={mapContainerRef} className="w-full h-full" />

            <div className="absolute top-3 left-3 z-20 rounded-xl border border-white/40 bg-white/80 backdrop-blur px-3 py-2 text-xs text-slate-700 shadow-sm">
                <div className="font-semibold text-sm">Household Map</div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                        <span className="inline-block w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">85</span>
                        <span>Score ≥ 70</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="inline-block w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">55</span>
                        <span>40–69</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="inline-block w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">30</span>
                        <span>{"< 40"}</span>
                    </span>
                </div>
            </div>

            {(loading || !mapRef.current) && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Đang tải bản đồ...</p>
                    </div>
                </div>
            )}

            <style>{`
                .monitoring-leaflet-tooltip {
                    background: white !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 10px !important;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15) !important;
                    padding: 6px 9px !important;
                    font-weight: 500 !important;
                    color: #1f2937;
                }
                .monitoring-leaflet-tooltip::before {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
