"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { formatWon } from "@/lib/format";

type RegionStats = { avgAllowance: number; sampleSize: number };

type Props = {
  regionalData: Record<string, RegionStats>;
  userRegion?: string | null;
};

// 행정구역 코드 앞 2자리 → 시/도 매핑
const PROVINCE_CODE: Record<string, string> = {
  "11": "서울특별시",
  "21": "부산광역시",
  "22": "대구광역시",
  "23": "인천광역시",
  "24": "광주광역시",
  "25": "대전광역시",
  "26": "울산광역시",
  "29": "세종특별자치시",
  "31": "경기도",
  "32": "강원도",
  "33": "충청북도",
  "34": "충청남도",
  "35": "전라북도",
  "36": "전라남도",
  "37": "경상북도",
  "38": "경상남도",
  "39": "제주특별자치도",
};

function allowanceColor(t: number): string {
  const r = Math.round(99 + t * (79 - 99));
  const g = Math.round(102 + t * (70 - 102));
  const b = Math.round(241 + t * (209 - 241));
  return `rgb(${r},${g},${b})`;
}

export function RegionalMap({ regionalData, userRegion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let destroyed = false;

    import("leaflet").then(async (L) => {
      if (destroyed || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [36.0, 127.8],
        zoom: 7,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // 한글 지명 표시 타일 (OpenStreetMap)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const amounts = Object.values(regionalData)
        .map((v) => v.avgAllowance)
        .filter((v) => v > 0);
      const min = amounts.length > 0 ? Math.min(...amounts) : 0;
      const max = amounts.length > 0 ? Math.max(...amounts) : 1;

      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json"
        );
        const geojson = await res.json();
        if (destroyed) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        L.geoJSON(geojson as any, {
          style: (feature) => {
            const code: string = (feature?.properties?.code ?? "").toString();
            const province = PROVINCE_CODE[code.substring(0, 2)] ?? null;
            const stats = province ? (regionalData[province] ?? null) : null;
            const isMyRegion = province === userRegion;
            const hasData = stats !== null && stats.avgAllowance > 0;
            const t = hasData ? (stats!.avgAllowance - min) / Math.max(max - min, 1) : 0;

            return {
              fillColor: isMyRegion ? "#f59e0b" : hasData ? allowanceColor(t) : "#e2e8f0",
              fillOpacity: hasData || isMyRegion ? 0.65 : 0.25,
              color: "#ffffff",
              weight: 0.6,
            };
          },
          onEachFeature: (feature, layer) => {
            const code: string = (feature?.properties?.code ?? "").toString();
            const name: string = feature?.properties?.name ?? "";
            const province = PROVINCE_CODE[code.substring(0, 2)] ?? null;
            const stats = province ? (regionalData[province] ?? null) : null;
            const isMyRegion = province === userRegion;
            const hasData = stats !== null && stats.avgAllowance > 0;

            const html = [
              `<div style="font-family:inherit;min-width:130px;padding:2px 0">`,
              province ? `<p style="font-size:11px;color:#94a3b8;margin:0 0 2px">${province}</p>` : "",
              `<p style="font-size:13px;font-weight:900;margin:0 0 5px;color:#0f172a">${name}</p>`,
              hasData
                ? `<p style="font-size:12px;color:#4338ca;font-weight:700;margin:0">지역 평균 ${formatWon(stats!.avgAllowance)}</p>
                   <p style="font-size:11px;color:#64748b;margin:2px 0 0">표본 ${stats!.sampleSize}명</p>`
                : `<p style="font-size:11px;color:#94a3b8;margin:0">데이터 수집 중</p>`,
              isMyRegion ? `<p style="font-size:11px;color:#f59e0b;font-weight:700;margin:4px 0 0">📍 우리 지역</p>` : "",
              `</div>`,
            ].join("");

            layer.bindPopup(html, { closeButton: false, offset: [0, -2] });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            layer.on("mouseover", (e: any) => {
              e.target.setStyle({ fillOpacity: 0.9, weight: 1.5, color: "#6366f1" });
              (layer as L.Layer).openPopup();
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            layer.on("mouseout", (e: any) => {
              e.target.setStyle({
                fillOpacity: hasData || isMyRegion ? 0.65 : 0.25,
                weight: 0.6,
                color: "#ffffff",
              });
              (layer as L.Layer).closePopup();
            });
          },
        }).addTo(map);
      } catch {
        // GeoJSON 로드 실패 시 아무것도 표시 안 함
      }

      mapRef.current = map;
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
      }
    };
  }, [regionalData, userRegion]);

  return (
    <div
      ref={containerRef}
      style={{ height: 380, borderRadius: 20, overflow: "hidden" }}
    />
  );
}
