import { HOUSEHOLDS } from "@/data/wardData";
import type { Household, HouseholdProfile, HouseholdWasteHistory, HouseholdImageHistory, PollutionMetrics } from "@/types/monitoring";

const BASE_MONTHS = [
    "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
];

function makeRandomFromSeed(seed: number) {
    let value = (seed % 1000) / 1000;
    return () => {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    };
}

function buildPollution(random: () => number): PollutionMetrics {
    const ln2 = Math.log(2); // 0.693147...
    const mod = (n: number) => Math.round(n * 1_000_000) / 1_000_000;

    const co2 = mod(ln2 * (0.85 + random() * 0.35));
    const dioxin = mod((0.45 + random() * 0.25));
    const microplastic = mod(ln2 * (0.75 + random() * 0.5));
    const nonBiodegradable = mod(ln2 * (0.75 + random() * 0.5));

    return {
        Cd: 0,
        Hg: 0,
        Pb: 0,
        CH4: 0,
        CO2: co2,
        NOx: 0,
        SO2: 0,
        "PM2.5": 0,
        dioxin,
        nitrate: 0,
        styrene: 0,
        microplastic,
        toxic_chemicals: 0,
        chemical_residue: 0,
        non_biodegradable: nonBiodegradable,
    };
}

function buildWasteHistory(household: Household): HouseholdWasteHistory[] {
    const monthFactor = household.waste * 30;
    const random = makeRandomFromSeed(household.id);

    return BASE_MONTHS.map((month) => {
        const delta = (random() - 0.5) * 0.5; // +/-25%
        const totalWasteKg = Math.max(20, Math.round((monthFactor * (1 + delta)) * 10) / 10);

        const plasticRatio = 0.3 + (random() * 0.25);
        const organicRatio = 0.35 + (random() * 0.2);
        const mixedRatio = 0.2 + (random() * 0.15);
        const hazardousRatio = Math.max(0, 1 - (plasticRatio + organicRatio + mixedRatio));

        const pollution = buildPollution(random);

        return {
            month,
            totalWasteKg,
            plasticKg: Math.round(totalWasteKg * plasticRatio),
            organicKg: Math.round(totalWasteKg * organicRatio),
            mixedKg: Math.round(totalWasteKg * mixedRatio),
            hazardousKg: Math.round(totalWasteKg * hazardousRatio),
            pollution,
            pollutionCO2: pollution.CO2,
            pollutionDioxin: pollution.dioxin,
            pollutionMicroplastic: pollution.microplastic,
            pollutionNonBiodegradable: pollution.non_biodegradable,
        };
    });
}

function buildImageHistory(household: Household): HouseholdImageHistory[] {
    const baseUrl = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267";

    return [
        {
            id: household.id * 10 + 1,
            uploadedAt: "2026-03-01 09:15",
            imageUrl: `${baseUrl}?auto=format&fit=crop&w=800&q=80`,
            label: "Ảnh rác thải ngày 1",
            caption: "Rác thải trái cây, túi nylon",
            items: [
                { name: "Plastic film", quantity: 9, area: 147757 },
                { name: "Single-use carrier bag", quantity: 2, area: 18706 },
            ],
            total_objects: 11,
            pollution: {
                CO2: 0.6931471805569416,
                microplastic: 0.6931471805569416,
                dioxin: 0.5365526341607301,
                non_biodegradable: 0.6931471805569416,
                CH4: 0,
                "PM2.5": 0,
                NOx: 0,
                SO2: 0,
                Pb: 0,
                Hg: 0,
                Cd: 0,
                nitrate: 0,
                chemical_residue: 0,
                toxic_chemicals: 0,
                styrene: 0,
            },
        },
        {
            id: household.id * 10 + 2,
            uploadedAt: "2026-03-10 14:20",
            imageUrl: `${baseUrl}?auto=format&fit=crop&w=800&q=70`,
            label: "Ảnh rác thải ngày 10",
            caption: "Rác thải vỏ chai nước, giấy"
        },
        {
            id: household.id * 10 + 3,
            uploadedAt: "2026-03-20 18:05",
            imageUrl: `${baseUrl}?auto=format&fit=crop&w=800&q=60`,
            label: "Ảnh rác thải ngày 20",
            caption: "Rác thải general"
        },
    ];
}

function buildHouseholdMembers(household: Household, familySize: number) {
    const names = ["Anh", "Bình", "Châu", "Dũng", "Hạ", "Hùng", "Lan", "Linh", "Mai", "Phúc", "Quỳnh", "Thu", "Tiến", "Trang", "Vân"];
    return Array.from({ length: familySize }, (_, idx) => {
        const name = names[(household.id + idx) % names.length];
        const wasteKg = Math.max(0.5, Math.round((household.waste / familySize + (Math.random() - 0.5) * 0.5) * 10) / 10);
        return {
            name: `${name} ${idx + 1}`,
            wasteKg,
            role: idx === 0 ? "Chủ hộ" : "Thành viên",
        };
    });
}

export function getHouseholdProfiles(source?: Household[]): HouseholdProfile[] {
    const input = source ?? HOUSEHOLDS;

    return input.map((household) => {
        const familySize = 3 + (household.id % 4);
        return {
            ...household,
            familySize,
            members: buildHouseholdMembers(household, familySize),
            wasteHistory: buildWasteHistory(household),
            imageHistory: buildImageHistory(household),
        };
    });
}

export function findHouseholdProfileById(id: number, source?: HouseholdProfile[]): HouseholdProfile | undefined {
    const list = source ?? getHouseholdProfiles();
    return list.find((c) => c.id === id);
}
