import { WasteReport, CampaignRegion } from "@/types/waste-report";


export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}


export function clusterReports(reports: WasteReport[], radiusInMeters: number = 500): CampaignRegion[] {
  const unassigned = [...reports];
  const regions: CampaignRegion[] = [];
  let regionCounter = 1;

  while (unassigned.length > 0) {
    
    const centerReport = unassigned.shift()!;
    const currentRegionReports = [centerReport];

    
    for (let i = unassigned.length - 1; i >= 0; i--) {
      const otherReport = unassigned[i];
      const distance = calculateHaversineDistance(
        centerReport.lat,
        centerReport.lng,
        otherReport.lat,
        otherReport.lng
      );

      if (distance <= radiusInMeters) {
        currentRegionReports.push(otherReport);
        
        unassigned.splice(i, 1);
      }
    }

    
    regions.push({
      id: `region-${regionCounter}`,
      name: `Region ${String.fromCharCode(64 + regionCounter)}`, 
      center: {
        lat: centerReport.lat,
        lng: centerReport.lng
      },
      reports: currentRegionReports
    });

    regionCounter++;
  }

  
  regions.sort((a, b) => b.reports.length - a.reports.length);

  return regions;
}
