"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { formatWon } from "@/lib/format";

type RegionStats = { avgAllowance: number; sampleSize: number };

type Props = {
  regionalData: Record<string, RegionStats>;
  userRegion?: string | null;
};

const REGION_COORDS: Record<string, [number, number]> = {
  "서울특별시": [37.5665, 126.9780],
  "경기도": [37.4138, 127.5183],
  "인천광역시": [37.4563, 126.7052],
  "강원도": [37.8228, 128.1555],
  "충청북도": [36.6357, 127.4912],
  "충청남도": [36.5184, 126.8000],
  "세종특별자치시": [36.4800, 127.2890],
  "대전광역시": [36.3504, 127.3845],
  "경상북도": [36.4919, 128.8889],
  "대구광역시": [35.8714, 128.6014],
  "울산광역시": [35.5384, 129.3114],
  "경상남도": [35.4606, 128.2132],
  "부산광역시": [35.1796, 129.0756],
  "전라북도": [35.7175, 127.1530],
  "광주광역시": [35.1595, 126.8526],
  "전라남도": [34.8679, 126.9910],
  "제주특별자치도": [33.4996, 126.5312],
};

function allowanceColor(amount: number, min: number, max: number): string {
  if (max === min) return "#6366f1";
  const t = (amount - min) / (max - min);
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

    import("leaflet").then((L) => {
      if (destroyed || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [36.5, 127.9],
        zoom: 7,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: "© OpenStreetMap © CartoDB",
          maxZoom: 18,
          subdomains: "abcd",
        }
      ).addTo(map);

      const amounts = Object.values(regionalData)
        .map((v) => v.avgAllowance)
        .filter((v) => v > 0);
      const min = amounts.length > 0 ? Math.min(...amounts) : 0;
      const max = amounts.length > 0 ? Math.max(...amounts) : 1;

      for (const [region, coords] of Object.entries(REGION_COORDS)) {
        const stats = regionalData[region];
        const hasData = !!stats && stats.avgAllowance > 0;
        const isMyRegion = region === userRegion;

        const baseR = 18000;
        const extraR = hasData
          ? ((stats.avgAllowance - min) / Math.max(max - min, 1)) * 20000
          : 0;
        const radius = isMyRegion ? baseR + extraR + 4000 : baseR + extraR;

        const fillColor = isMyRegion
          ? "#f59e0b"
          : hasData
          ? allowanceColor(stats.avgAllowance, min, max)
          : "#cbd5e1";

        const circle = L.circle(coords, {
          color: "white",
          weight: isMyRegion ? 3 : 1.5,
          fillColor,
          fillOpacity: hasData || isMyRegion ? 0.88 : 0.35,
          radius,
        }).addTo(map);

        const popupHtml = [
          `<div style="font-family:inherit;min-width:120px">`,
          `<p style="font-size:13px;font-weight:900;margin:0 0 4px">${region}</p>`,
          hasData
            ? `<p style="font-size:12px;color:#4338ca;font-weight:700;margin:0">평균 ${formatWon(stats.avgAllowance)}</p>
               <p style="font-size:11px;color:#64748b;margin:2px 0 0">표본 ${stats.sampleSize}명</p>`
            : `<p style="font-size:11px;color:#94a3b8;margin:0">데이터 수집 중</p>`,
          isMyRegion ? `<p style="font-size:11px;color:#f59e0b;font-weight:700;margin:4px 0 0">📍 우리 지역</p>` : "",
          `</div>`,
        ].join("");

        circle.bindPopup(popupHtml, { closeButton: false, offset: [0, -4] });
        circle.on("mouseover", () => circle.openPopup());
        circle.on("mouseout", () => circle.closePopup());

        if (hasData) {
          const label = Math.round(stats.avgAllowance / 1000) + "k";
          L.marker(coords, {
            icon: L.divIcon({
              className: "",
              html: `<div style="font-size:${isMyRegion ? 12 : 11}px;font-weight:900;color:white;text-shadow:0 1px 3px rgba(0,0,0,0.6);pointer-events:none;white-space:nowrap;transform:translate(-50%,-50%)">${label}</div>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
            interactive: false,
          }).addTo(map);
        }
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
