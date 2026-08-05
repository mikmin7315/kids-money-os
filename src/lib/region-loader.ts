export type RegionEntry = { code: string; name: string };

const SIDO_CODE: Record<string, string> = {
  "서울특별시": "11", "부산광역시": "21", "대구광역시": "22",
  "인천광역시": "23", "광주광역시": "24", "대전광역시": "25",
  "울산광역시": "26", "세종특별자치시": "29", "경기도": "31",
  "강원도": "32", "충청북도": "33", "충청남도": "34",
  "전라북도": "35", "전라남도": "36", "경상북도": "37",
  "경상남도": "38", "제주특별자치도": "39",
};

const MUNI_URL =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo.json";
const SUBMUNI_URL =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-submunicipalities-2018-topo.json";

// Promise locks prevent duplicate concurrent fetches of the same large TopoJSON
let muniCachePromise: Promise<RegionEntry[]> | null = null;
let submuniCachePromise: Promise<RegionEntry[]> | null = null;

async function fetchMunicipalities(): Promise<RegionEntry[]> {
  const [res, { feature }] = await Promise.all([fetch(MUNI_URL), import("topojson-client")]);
  if (!res.ok) throw new Error(`municipalities fetch failed: HTTP ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topo = (await res.json()) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geo = feature(topo, topo.objects.skorea_municipalities_2018_geo) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return geo.features.map((f: any) => ({
    code: (f.properties?.code ?? "").toString(),
    name: (f.properties?.name ?? "") as string,
  }));
}

async function fetchSubMunicipalities(): Promise<RegionEntry[]> {
  const [res, { feature }] = await Promise.all([fetch(SUBMUNI_URL), import("topojson-client")]);
  if (!res.ok) throw new Error(`submunicipalities fetch failed: HTTP ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topo = (await res.json()) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geo = feature(topo, topo.objects.skorea_submunicipalities_2018_geo) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return geo.features.map((f: any) => ({
    code: (f.properties?.code ?? "").toString(),
    name: (f.properties?.name ?? "") as string,
  }));
}

function loadMunicipalities(): Promise<RegionEntry[]> {
  if (!muniCachePromise) muniCachePromise = fetchMunicipalities();
  return muniCachePromise;
}

function loadSubMunicipalities(): Promise<RegionEntry[]> {
  if (!submuniCachePromise) submuniCachePromise = fetchSubMunicipalities();
  return submuniCachePromise;
}

export async function getSigungusForSido(sido: string): Promise<RegionEntry[]> {
  const code = SIDO_CODE[sido];
  if (!code) return [];
  const entries = await loadMunicipalities();
  return entries
    .filter((e) => e.code.startsWith(code))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export async function getDongsForSigungu(sigungCode: string): Promise<string[]> {
  const entries = await loadSubMunicipalities();
  return entries
    .filter((e) => e.code.startsWith(sigungCode))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, "ko"));
}
