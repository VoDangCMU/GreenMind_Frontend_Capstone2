import { apiGet } from "@/lib/auth";
import type { AreaStatus, Household, HouseholdMember, HouseholdProfile } from "@/types/monitoring";
import type { AxiosRequestConfig } from "axios";

const HOUSEHOLDS_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://vodang-api.gauas.com";

// API payload types from /households/get-all-households
export interface ApiHouseholdMember {
    id: string;
    username: string;
    email: string;
    phoneNumber: string | null;
    fullName: string;
    gender: string;
    location: string;
    region: string;
    role: string;
    roleId: string | null;
    householdId: string;
    dateOfBirth: string;
    segmentId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ApiHousehold {
    id: string;
    address: string;
    urbanAreaId: string | number | null;
    lat?: string | number | null;
    lng?: string | number | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    createdAt: string;
    updatedAt: string;
    members?: ApiHouseholdMember[];
}

export interface ApiHouseholdDetectionItem {
    area: number;
    name: string;
    quantity: number;
}

export interface ApiHouseholdDetectionRecord {
    id: string;
    imageUrl: string;
    items: ApiHouseholdDetectionItem[];
    pollution: Record<string, number> | null;
    impact: Record<string, number> | null;
    totalObjects: number;
    aiAnalysis: string;
    householdId: string;
    detectType: string;
    createdAt: string;
    updatedAt: string;
    detectedBy: Record<string, any>;
    household: Record<string, any>;
}

export type ApiGetAllHouseholdsResponse = ApiHousehold[] | { data: ApiHousehold[] };

type ApiHouseholdListEnvelope = {
    data?: ApiHousehold[] | { data?: ApiHousehold[] };
    total?: number;
    page?: number;
    limit?: number;
};

function toFiniteNumber(value: unknown): number | null {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "string") {
        const normalized = value.trim();
        if (!normalized) return null;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function extractLatLng(apiHousehold: ApiHousehold): { lat: number; lng: number } {
    const lat = toFiniteNumber(apiHousehold.lat ?? apiHousehold.latitude) ?? 0;
    const lng = toFiniteNumber(apiHousehold.lng ?? apiHousehold.longitude) ?? 0;
    return { lat, lng };
}

function hashStringToNumber(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) & 0x7fffffff;
    }
    return Math.abs(hash) || 1;
}

function mapApiHouseholdToProfile(apiHousehold: ApiHousehold): HouseholdProfile {
    const numericId = hashStringToNumber(apiHousehold.id);
    const members: HouseholdMember[] = (apiHousehold.members ?? []).map((m) => ({
        name: m.fullName || m.username || "Thành viên",
        wasteKg: 0,
        role: m.role || "user",
    }));

    const { lat, lng } = extractLatLng(apiHousehold);

    const familySize = Math.max(1, members.length);
    const waste = 0;
    const reportCount = members.length;
    const status: AreaStatus = reportCount >= 3 ? "red" : reportCount >= 2 ? "yellow" : "green";

    const mappedHousehold: Household = {
        id: numericId,
        externalId: apiHousehold.id,
        wardId: typeof apiHousehold.urbanAreaId === "number" ? apiHousehold.urbanAreaId : 0,
        name: apiHousehold.address || "Hộ gia đình",
        address: apiHousehold.address || "Chưa rõ",
        lat,
        lng,
        waste,
        status,
        reportCount,
    };

    return {
        ...mappedHousehold,
        familySize,
        members,
        wasteHistory: [],
        imageHistory: [],
    };
}

export function getHouseholdProfilesFromApi(apiHouseholds: ApiHousehold[]): HouseholdProfile[] {
    return apiHouseholds.map(mapApiHouseholdToProfile);
}

export async function getAllHouseholds(config?: AxiosRequestConfig): Promise<ApiGetAllHouseholdsResponse | ApiHouseholdListEnvelope> {
    return apiGet("/households/get-all-households", {
        baseURL: HOUSEHOLDS_API_BASE_URL,
        ...config,
    });
}

export async function getHouseholdDetectionHistoryByHousehold(householdId: string): Promise<ApiHouseholdDetectionRecord[]> {
    const response = await apiGet(`/households/get-detect-by-household/${encodeURIComponent(householdId)}`, {
        baseURL: HOUSEHOLDS_API_BASE_URL,
    });

    if (Array.isArray(response)) {
        return response as ApiHouseholdDetectionRecord[];
    }

    if (response && typeof response === "object") {
        const data = (response as any).data;
        if (Array.isArray(data)) {
            return data as ApiHouseholdDetectionRecord[];
        }
        if (Array.isArray(data?.data)) {
            return data.data as ApiHouseholdDetectionRecord[];
        }
    }

    return [];
}

export function mapHouseholdDetectionRecordsToImageHistory(records: ApiHouseholdDetectionRecord[]) {
    return records
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((record) => ({
            id: record.id,
            uploadedAt: record.createdAt,
            imageUrl: record.imageUrl,
            label: record.detectType || "Lịch sử phát hiện",
            sender: record.detectedBy?.fullName || record.detectedBy?.username || record.detectedBy?.email || undefined,
            caption: record.detectType === "predict_pollutant_impact"
                ? "Dự đoán tác động ô nhiễm"
                : record.detectType === "detect_trash"
                    ? "Phát hiện rác thải"
                    : "Ảnh phát hiện",
            items: record.items,
            total_objects: record.totalObjects,
            pollution: record.pollution ?? undefined,
        } as import("@/types/monitoring").HouseholdImageHistory));
}

function resolveHouseholdPayload(response: ApiGetAllHouseholdsResponse | ApiHouseholdListEnvelope): {
    items: ApiHousehold[];
    total?: number;
    page?: number;
    limit?: number;
} {
    if (Array.isArray(response)) {
        return { items: response };
    }

    const envelope = response as ApiHouseholdListEnvelope;
    const direct = (response as { data?: unknown })?.data;
    if (Array.isArray(direct)) {
        return { items: direct, total: envelope.total, page: envelope.page, limit: envelope.limit };
    }

    if (direct && typeof direct === "object" && Array.isArray((direct as any).data)) {
        return { items: (direct as any).data, total: envelope.total, page: envelope.page, limit: envelope.limit };
    }

    return { items: [], total: envelope.total, page: envelope.page, limit: envelope.limit };
}

export async function getAllHouseholdProfiles(): Promise<HouseholdProfile[]> {
    const PREFERRED_LIMIT = 5000;
    const MAX_PAGES = 200;

    const fetchAllPaged = async (limit: number): Promise<ApiHousehold[]> => {
        const seen = new Set<string>();
        const merged: ApiHousehold[] = [];

        const addUnique = (items: ApiHousehold[]) => {
            for (const item of items) {
                if (!item?.id) continue;
                if (seen.has(item.id)) continue;
                seen.add(item.id);
                merged.push(item);
            }
        };

        let total: number | undefined;
        let effectiveLimit = limit;

        for (let page = 1; page <= MAX_PAGES; page += 1) {
            const resp = await getAllHouseholds({ params: { page, limit: effectiveLimit } });
            const payload = resolveHouseholdPayload(resp);
            if (typeof payload.limit === "number" && payload.limit > 0) {
                effectiveLimit = payload.limit;
            }
            if (typeof payload.total === "number") {
                total = payload.total;
            }

            const before = merged.length;
            addUnique(payload.items);

            if (!payload.items.length) break;
            if (merged.length === before) break; // page ignored / no new data

            if (typeof total === "number" && merged.length >= total) break;
            if (payload.items.length < effectiveLimit) break; // last page
        }

        return merged;
    };

    // Best effort: try paged fetch with large limit first.
    try {
        const merged = await fetchAllPaged(PREFERRED_LIMIT);
        if (merged.length) return getHouseholdProfilesFromApi(merged);
    } catch {
        // ignore and fallback
    }

    // Fallback: call without params (some endpoints truly return all without pagination).
    const fallback = resolveHouseholdPayload(await getAllHouseholds());
    if (fallback.items.length) return getHouseholdProfilesFromApi(fallback.items);

    return [];
}
