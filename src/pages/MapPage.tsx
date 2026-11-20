import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BottomNav from "@/components/BottomNav";
import { Loader2, LocateFixed, Search, Layers, Navigation, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { sites, findCoordsForScan, distanceM } from "@/data/sites";

interface Scan {
  id: string;
  title: string | null;
  site: string | null;
  region: string | null;
  script_type: string | null;
  confidence: number | null;
  image_url: string | null;
  analysis: { fragmentId?: string; site?: string; region?: string; [key: string]: unknown } | null;
  created_at: string;
}

interface SelectedScan {
  scan: Scan;
  coords: [number, number];
  distance: number | null;
}

const MapPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const userPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [selectedScan, setSelectedScan] = useState<SelectedScan | null>(null);

  // Fetch scans
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase.from("scans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setScans((data as Scan[]) ?? []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([35.5, 4.5], 6);
    mapInstanceRef.current = map;

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale({ position: "bottomleft", imperial: false, maxWidth: 150 }).addTo(map);

    const darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: '&copy; <a href="https://carto.com/">CARTO</a>' });
    const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: '&copy; Esri' });
    darkLayer.addTo(map);

    const baseLayers: Record<string, L.TileLayer> = {};
    baseLayers["🗺️ Dark"] = darkLayer;
    baseLayers["🛰️ Satellite"] = satelliteLayer;
    L.control.layers(baseLayers, {}, { position: "topright", collapsed: true }).addTo(map);

    // Site markers
    const goldIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;border-radius:50%;background:hsl(43,88%,63%);border:2px solid hsl(43,60%,75%);box-shadow:0 0 12px hsl(43,88%,63%,0.5);"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -10],
    });

    const getDesc = (s: typeof sites[0]) => lang === "fr" ? s.descFr : lang === "en" ? s.descEn : s.desc;

    sites.forEach((site) => {
      L.marker([site.lat, site.lng], { icon: goldIcon }).addTo(map).bindPopup(`
        <div style="direction:${lang === "ar" ? "rtl" : "ltr"};font-family:sans-serif;min-width:180px;background:#0d1117;color:#e6edf3;padding:8px;border-radius:8px">
          <p style="font-weight:bold;font-size:13px;margin:0 0 4px;color:hsl(43,88%,63%)">${lang === "ar" ? site.name : site.nameEn}</p>
          <p style="font-size:11px;color:#8b949e;margin:0 0 6px">${getDesc(site)}</p>
          <div style="display:flex;gap:4px;font-size:10px">
            <span style="background:hsl(43,88%,63%,0.15);color:hsl(43,88%,63%);padding:2px 6px;border-radius:4px">${site.type}</span>
            <span style="background:hsl(43,88%,63%,0.15);color:hsl(43,88%,63%);padding:2px 6px;border-radius:4px">${site.count}+ inscriptions</span>
          </div>
        </div>
      `);
    });

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [lang]);

  // Scan markers with image popup + distance
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || scans.length === 0) return;

    const scanIcon = L.divIcon({
      className: "",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:hsl(38,72%,50%);border:2px solid hsl(38,50%,65%);box-shadow:0 0 16px hsl(38,72%,50%,0.6);cursor:pointer;"><div style="width:8px;height:8px;border-radius:50%;background:white;margin:4px auto;"></div></div>`,
      iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -14],
    });

    const scanMarkers: L.Marker[] = [];
    scans.forEach((scan) => {
      const coords = findCoordsForScan(scan);
      if (!coords) return;
      const marker = L.marker(coords, { icon: scanIcon }).addTo(map);
      marker.on("click", () => {
        const userPos = userPosRef.current;
        const dist = userPos ? distanceM(userPos.lat, userPos.lng, coords[0], coords[1]) : null;
        setSelectedScan({ scan, coords, distance: dist });
        map.setView(coords, Math.max(map.getZoom(), 10));
      });
      scanMarkers.push(marker);
    });

    return () => { scanMarkers.forEach((m) => m.remove()); };
  }, [scans, lang]);

  // Draw route line when scan selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }
    if (!map || !selectedScan || !userPosRef.current) return;

    const from: [number, number] = [userPosRef.current.lat, userPosRef.current.lng];
    const to = selectedScan.coords;
    routeLineRef.current = L.polyline([from, to], {
      color: "hsl(43,88%,63%)",
      weight: 3,
      dashArray: "8 6",
      opacity: 0.8,
    }).addTo(map);

    map.fitBounds(L.latLngBounds(from, to).pad(0.3));
  }, [selectedScan]);

  const handleLocateMe = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        userPosRef.current = { lat: latitude, lng: longitude };
        if (userMarkerRef.current) userMarkerRef.current.remove();
        if (userCircleRef.current) userCircleRef.current.remove();

        const userIcon = L.divIcon({
          className: "",
          html: `<div style="width:16px;height:16px;border-radius:50%;background:hsl(210,100%,56%);border:3px solid #fff;box-shadow:0 0 12px hsl(210,100%,56%,0.6);"></div>`,
          iconSize: [16, 16], iconAnchor: [8, 8],
        });

        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon }).addTo(map)
          .bindPopup(`<div style="text-align:center;font-family:monospace;font-size:12px;font-weight:bold;color:hsl(210,100%,56%);background:#0d1117;padding:4px 8px;border-radius:6px">📍 ${lang === "ar" ? "موقعك" : "Your location"}</div>`).openPopup();

        userCircleRef.current = L.circle([latitude, longitude], { radius: accuracy, color: "hsl(210,100%,56%)", fillColor: "hsl(210,100%,56%)", fillOpacity: 0.08, weight: 1 }).addTo(map);

        map.setView([latitude, longitude], 13);

        // Update distance for selected scan
        if (selectedScan) {
          const dist = distanceM(latitude, longitude, selectedScan.coords[0], selectedScan.coords[1]);
          setSelectedScan((prev) => prev ? { ...prev, distance: dist } : null);
        }

        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [selectedScan, lang]);

  const formatDistance = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  const estimateTime = (m: number) => {
    const walkMin = Math.round(m / 80); // ~5km/h
    const driveMin = Math.round(m / 500); // ~30km/h
    return { walk: walkMin, drive: Math.max(1, driveMin) };
  };

  const openInGoogleMaps = (coords: [number, number]) => {
    const url = userPosRef.current
      ? `https://www.google.com/maps/dir/${userPosRef.current.lat},${userPosRef.current.lng}/${coords[0]},${coords[1]}`
      : `https://www.google.com/maps?q=${coords[0]},${coords[1]}`;
    window.open(url, "_blank");
  };

  const mappedScans = scans.filter((s) => findCoordsForScan(s) !== null);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-12 pb-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Layers className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-foreground tracking-wider">EPIGRAPHI Dz</h1>
        </div>
        {loading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
      </div>

      {/* Search */}
      <div className="px-6 mb-3">
        <div className="glass-card-cyan flex items-center gap-3 px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder={lang === "ar" ? "ابحث عن نقش أو موقع..." : "Search inscriptions or sites..."} className="bg-transparent text-foreground text-sm flex-1 outline-none placeholder:text-muted-foreground/50 font-mono" readOnly />
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1" style={{ height: "calc(100vh - 280px)" }}>
        <div ref={mapRef} className="absolute inset-0 z-0" />

        {/* Locate button */}
        <button onClick={handleLocateMe} disabled={locating} className="absolute bottom-4 right-3 z-[1000] w-11 h-11 flex items-center justify-center rounded-full bg-card/90 border border-primary/30 shadow-lg hover:scale-105 active:scale-95 transition-transform">
          {locating ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <LocateFixed className="w-5 h-5 text-primary" />}
        </button>

        {/* Selected scan card */}
        {selectedScan && (
          <div className="absolute bottom-16 left-3 right-3 z-[1000] glass-card-cyan p-0 overflow-hidden rounded-xl border border-primary/20" style={{ boxShadow: "0 8px 32px hsl(43 88% 63% / 0.15)" }}>
            <button onClick={() => { setSelectedScan(null); if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; } }} className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex gap-0">
              {/* Image */}
              {selectedScan.scan.image_url && (
                <div className="w-24 h-28 flex-shrink-0">
                  <img src={selectedScan.scan.image_url} alt="Inscription" className="w-full h-full object-cover" />
                </div>
              )}
              {/* Info */}
              <div className="flex-1 p-3 min-w-0">
                <p className="font-mono text-xs font-bold text-primary truncate">
                  {selectedScan.scan.analysis?.fragmentId ?? selectedScan.scan.title ?? t("common", "inscription")}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {selectedScan.scan.script_type ?? selectedScan.scan.site ?? ""}
                </p>

                {/* Distance */}
                {selectedScan.distance != null ? (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs font-bold text-foreground">📍 {formatDistance(selectedScan.distance)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      🚶 {estimateTime(selectedScan.distance).walk} min
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      🚗 {estimateTime(selectedScan.distance).drive} min
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {lang === "ar" ? "فعّل الموقع لحساب المسافة" : "Enable location for distance"}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => navigate("/results", { state: { analysis: selectedScan.scan.analysis, imageUrl: selectedScan.scan.image_url } })}
                    className="flex-1 text-[10px] font-bold font-mono bg-primary/15 text-primary py-1.5 rounded-lg text-center"
                  >
                    {t("map", "viewFullAnalysis")}
                  </button>
                  <button
                    onClick={() => openInGoogleMaps(selectedScan.coords)}
                    className="flex items-center gap-1 text-[10px] font-bold font-mono bg-primary text-primary-foreground py-1.5 px-3 rounded-lg"
                  >
                    <Navigation className="w-3 h-3" />
                    {lang === "ar" ? "اذهب" : "Navigate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /><span className="text-muted-foreground">Sites ({sites.length})</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" /><span className="text-muted-foreground">Scans ({mappedScans.length})</span></span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sites.slice(0, 6).map((site) => (
            <button key={site.nameEn} onClick={() => mapInstanceRef.current?.setView([site.lat, site.lng], 12)} className="flex-shrink-0 glass-card-cyan px-3 py-2 min-w-[120px]">
              <p className="font-mono text-xs font-bold text-primary truncate">{site.nameEn}</p>
              <p className="text-[10px] text-muted-foreground">{site.count}+ inscriptions</p>
            </button>
          ))}
        </div>
      </div>

      <BottomNav active="map" />
    </div>
  );
};

export default MapPage;
