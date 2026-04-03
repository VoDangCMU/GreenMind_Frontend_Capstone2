"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { HouseholdProfile } from "@/types/monitoring";

interface HouseholdManagementMapProps {
    households: HouseholdProfile[];
    selectedHouseholdId: number | null;
    onHouseholdSelect: (household: HouseholdProfile) => void;
    loading: boolean;
}

const STATUS_COLOR: Record<string, string> = {
    red: "#ef4444",
    yellow: "#f59e0b",
    green: "#10b981",
};

export function HouseholdManagementMap({ households, selectedHouseholdId, onHouseholdSelect, loading }: HouseholdManagementMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerLayerRef = useRef<L.LayerGroup | null>(null);

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

        households.forEach((household) => {
            const color = STATUS_COLOR[household.status] ?? "#6b7280";

            const marker = L.circleMarker([household.lat, household.lng], {
                radius: household.id === selectedHouseholdId ? 10 : 7,
                color,
                fillColor: color,
                fillOpacity: household.id === selectedHouseholdId ? 1 : 0.75,
                weight: household.id === selectedHouseholdId ? 3 : 1.5,
            }).addTo(markerLayerRef.current!);

            marker.bindTooltip(`
                <div style="font-family: system-ui; font-size: 12px; min-width: 170px; line-height: 1.4;">
                    <strong>${household.name}</strong><br/>
                    ${household.address}<br/>
                    <strong>Detect:</strong> ${household.reportCount} lần<br/>
                    <strong>Ảnh up:</strong> ${household.imageHistory?.length ?? 0} lần
                </div>
            `, { direction: "top", offset: [0, -8], className: "monitoring-leaflet-tooltip" });

            marker.on("click", () => onHouseholdSelect(household));

            if (household.id === selectedHouseholdId) {
                marker.openTooltip();
                mapRef.current!.flyTo([household.lat, household.lng], 15, { duration: 0.8 });
            }
        });
    }, [households, selectedHouseholdId, onHouseholdSelect]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gray-100 shadow-lg">
            <div ref={mapContainerRef} className="w-full h-full" />

            <div className="absolute top-3 left-3 z-20 rounded-xl border border-white/40 bg-white/80 backdrop-blur px-3 py-2 text-xs text-slate-700 shadow-sm">
                <div className="font-semibold text-sm">Household Map</div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Green</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                    <span>Yellow</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                    <span>Red</span>
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
