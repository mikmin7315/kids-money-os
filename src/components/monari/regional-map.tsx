"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { formatWon } from "@/lib/format";

type RegionStats = { avgAllowance: number; avgSavingsRate: number; sampleSize: number };
type MapMode = "allowance" | "spending" | "savings";

type Props = {
  regionalData: Record<string, RegionStats>;
  userRegion?: string | null;
  userDong?: string | null;
};

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

const MODE_CONFIG: Record<MapMode, { label: string; getValue: (s: RegionStats) => number; format: (v: number) => string; colorFrom: [number,number,number]; colorTo: [number,number,number] }> = {
  allowance: {
    label: "용돈",
    getValue: (s) => s.avgAllowance,
    format: (v) => formatWon(v),
    colorFrom: [199, 210, 254],
    colorTo:   [67,  56,  202],
  },
  spending: {
    label: "지출",
    getValue: (s) => Math.round(s.avgAllowance * (1 - s.avgSavingsRate)),
    format: (v) => formatWon(v),
    colorFrom: [254, 202, 202],
    colorTo:   [185,  28,  28],
  },
  savings: {
    label: "저축률",
    getValue: (s) => s.avgSavingsRate,
    format: (v) => `${Math.round(v * 100)}%`,
    colorFrom: [167, 243, 208],
    colorTo:   [4,  120,  87],
  },
};

function lerpColor(t: number, from: [number,number,number], to: [number,number,number]): string {
  const r = Math.round(from[0] + t * (to[0] - from[0]));
  const g = Math.round(from[1] + t * (to[1] - from[1]));
  const b = Math.round(from[2] + t * (to[2] - from[2]));
  return `rgb(${r},${g},${b})`;
}

export function RegionalMap({ regionalData, userRegion, userDong }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const locationMarkerRef = useRef<unknown>(null);
  const geoLayerRef = useRef<unknown>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mode, setMode] = useState<MapMode>("allowance");

  // Refs for values read inside Leaflet event handler closures (avoids stale captures)
  const modeRef = useRef<MapMode>(mode);
  const regionalDataRef = useRef(regionalData);
  const userDongRef = useRef(userDong);
  const userRegionRef = useRef(userRegion);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { regionalDataRef.current = regionalData; }, [regionalData]);
  useEffect(() => { userDongRef.current = userDong; }, [userDong]);
  useEffect(() => { userRegionRef.current = userRegion; }, [userRegion]);

  // 모드 바뀌면 레이어 스타일 갱신
  useEffect(() => {
    if (!geoLayerRef.current) return;
    const layer = geoLayerRef.current as { setStyle: (fn: (f: unknown) => unknown) => void };
    const cfg = MODE_CONFIG[mode];
    const values = Object.values(regionalData).map(s => cfg.getValue(s)).filter(v => v > 0);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;

    layer.setStyle((feature: unknown) => {
      const f = feature as { properties?: { code?: string | number; name?: string } };
      const code = (f?.properties?.code ?? "").toString();
      const dongName = (f?.properties?.name ?? "") as string;
      const province = PROVINCE_CODE[code.substring(0, 2)] ?? null;
      const stats = province ? (regionalData[province] ?? null) : null;
      const isMyDong = !!(userDong && dongName === userDong && province === userRegion);
      const hasData = stats !== null && cfg.getValue(stats) > 0;
      const t = hasData ? (cfg.getValue(stats!) - min) / Math.max(max - min, 1) : 0;

      return {
        fillColor: isMyDong ? "#fef3c7" : (hasData ? lerpColor(t, cfg.colorFrom, cfg.colorTo) : "#e2e8f0"),
        fillOpacity: isMyDong ? 0.85 : (hasData ? 0.65 : 0.25),
        color: isMyDong ? "#f59e0b" : "#ffffff",
        weight: isMyDong ? 3 : 0.6,
      };
    });
  }, [mode, regionalData, userRegion, userDong]);

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

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-submunicipalities-2018-topo.json"
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const topo = await res.json();
        if (destroyed) return;

        const { feature } = await import("topojson-client");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const geojson = feature(topo as any, (topo as any).objects.skorea_submunicipalities_2018_geo);

        // Read current mode from ref — avoids stale closure if user switched mode during fetch
        const cfg = MODE_CONFIG[modeRef.current];
        const values = Object.values(regionalDataRef.current).map(s => cfg.getValue(s)).filter(v => v > 0);
        const min = values.length ? Math.min(...values) : 0;
        const max = values.length ? Math.max(...values) : 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const geoLayer = L.geoJSON(geojson as any, {
          style: (feature) => {
            const code = (feature?.properties?.code ?? "").toString();
            const dongName: string = feature?.properties?.name ?? "";
            const province = PROVINCE_CODE[code.substring(0, 2)] ?? null;
            const stats = province ? (regionalDataRef.current[province] ?? null) : null;
            const isMyDong = !!(userDongRef.current && dongName === userDongRef.current && province === userRegionRef.current);
            const hasData = stats !== null && cfg.getValue(stats) > 0;
            const t = hasData ? (cfg.getValue(stats!) - min) / Math.max(max - min, 1) : 0;

            return {
              fillColor: isMyDong ? "#fef3c7" : (hasData ? lerpColor(t, cfg.colorFrom, cfg.colorTo) : "#e2e8f0"),
              fillOpacity: isMyDong ? 0.85 : (hasData ? 0.65 : 0.25),
              color: isMyDong ? "#f59e0b" : "#ffffff",
              weight: isMyDong ? 3 : 0.6,
            };
          },
          onEachFeature: (feature, layer) => {
            const code = (feature?.properties?.code ?? "").toString();
            const name: string = feature?.properties?.name ?? "";
            const province = PROVINCE_CODE[code.substring(0, 2)] ?? null;

            layer.on("mouseover", () => {
              // Read all mutable values from refs — not stale mount-time closures
              const currentDong = userDongRef.current;
              const currentRegion = userRegionRef.current;
              const currentData = regionalDataRef.current;
              const isMyDong = !!(currentDong && name === currentDong && province === currentRegion);
              const stats = province ? (currentData[province] ?? null) : null;
              const activeCfg = MODE_CONFIG[modeRef.current];
              const hasData = stats !== null && activeCfg.getValue(stats) > 0;

              const html = [
                `<div style="font-family:inherit;min-width:130px;padding:2px 0">`,
                province ? `<p style="font-size:11px;color:#94a3b8;margin:0 0 2px">${province}</p>` : "",
                `<p style="font-size:13px;font-weight:900;margin:0 0 5px;color:#0f172a">${name}</p>`,
                hasData
                  ? `<p style="font-size:12px;color:#4338ca;font-weight:700;margin:0">${activeCfg.label} 평균 ${activeCfg.format(activeCfg.getValue(stats!))}</p>
                     <p style="font-size:11px;color:#64748b;margin:2px 0 0">표본 ${stats!.sampleSize}명</p>`
                  : `<p style="font-size:11px;color:#94a3b8;margin:0">데이터 수집 중</p>`,
                isMyDong ? `<p style="font-size:11px;color:#f59e0b;font-weight:700;margin:4px 0 0">📍 우리 동네</p>` : "",
                `</div>`,
              ].join("");

              layer.bindPopup(html, { closeButton: false, offset: [0, -2] }).openPopup();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (layer as any).setStyle({ fillOpacity: 0.95, weight: 2.5, color: "#6366f1" });
            });

            layer.on("mouseout", () => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (layer as any).closePopup();
              const currentDong = userDongRef.current;
              const currentRegion = userRegionRef.current;
              const currentData = regionalDataRef.current;
              const isMyDong = !!(currentDong && name === currentDong && province === currentRegion);
              const stats = province ? (currentData[province] ?? null) : null;
              const activeCfg = MODE_CONFIG[modeRef.current];
              const hasData = stats !== null && activeCfg.getValue(stats) > 0;
              const vals = Object.values(currentData).map(s => activeCfg.getValue(s)).filter(v => v > 0);
              const mn = vals.length ? Math.min(...vals) : 0;
              const mx = vals.length ? Math.max(...vals) : 1;
              const t = hasData ? (activeCfg.getValue(stats!) - mn) / Math.max(mx - mn, 1) : 0;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (layer as any).setStyle({
                fillColor: isMyDong ? "#fef3c7" : (hasData ? lerpColor(t, activeCfg.colorFrom, activeCfg.colorTo) : "#e2e8f0"),
                fillOpacity: isMyDong ? 0.85 : (hasData ? 0.65 : 0.25),
                weight: isMyDong ? 3 : 0.6,
                color: isMyDong ? "#f59e0b" : "#ffffff",
              });
            });
          },
        }).addTo(map);

        geoLayerRef.current = geoLayer;
      } catch (err) {
        if (!destroyed) {
          console.error("[RegionalMap] 지도 로드 실패:", err);
          setMapError(true);
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
        geoLayerRef.current = null;
        locationMarkerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // 지도는 최초 1회만 초기화

  const goToMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocError(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const L = await import("leaflet");
        const map = mapRef.current as L.Map | null;
        if (!map) { setLocating(false); return; }

        if (locationMarkerRef.current) {
          (locationMarkerRef.current as L.Layer).remove();
        }

        const icon = L.divIcon({
          html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.35)"></div>`,
          className: "",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup("현재 내 위치", { closeButton: false }).openPopup();
        locationMarkerRef.current = marker;

        map.setView([lat, lng], 13, { animate: true });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocError(true);
        setTimeout(() => setLocError(false), 3000);
      },
      { timeout: 8000 }
    );
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* 모드 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, paddingLeft: 2 }}>
        {(["allowance", "spending", "savings"] as MapMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: mode === m ? "var(--monari-hero)" : "var(--monari-surface-soft)",
              color: mode === m ? "#ffffff" : "var(--monari-ink-soft)",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {MODE_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* 지도 */}
      <div style={{ position: "relative", height: 380, borderRadius: 20, overflow: "hidden" }}>
        <div ref={containerRef} style={{ height: "100%", width: "100%" }} />

        {/* 지도 로드 실패 */}
        {mapError && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--monari-surface-soft)", borderRadius: 20,
            flexDirection: "column", gap: 8,
          }}>
            <span style={{ fontSize: 28 }}>🗺️</span>
            <p style={{ fontSize: 13, color: "var(--monari-ink-muted)", margin: 0 }}>지도를 불러오지 못했어요</p>
            <p style={{ fontSize: 11, color: "var(--monari-ink-muted)", margin: 0 }}>잠시 후 새로고침해 주세요</p>
          </div>
        )}

        {/* 현위치 버튼 */}
        <button
          onClick={goToMyLocation}
          disabled={locating}
          title="현재 위치로 이동"
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 1000,
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "none",
            background: locError ? "#ef4444" : "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            cursor: locating ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
        >
          {locating ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
              </path>
            </svg>
          ) : locError ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <circle cx="12" cy="12" r="8" strokeOpacity="0.3"/>
            </svg>
          )}
        </button>
      </div>

      {/* 범례 */}
      {(userDong || userRegion) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, paddingLeft: 2 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: "#fef3c7", border: "2px solid #f59e0b", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "var(--monari-ink-muted)", fontWeight: 600 }}>
            {userDong ? `우리 동네 (${userDong})` : `우리 시/도 (${userRegion})`}
          </span>
        </div>
      )}
    </div>
  );
}
