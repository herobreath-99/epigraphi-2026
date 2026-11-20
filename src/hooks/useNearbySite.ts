import { useState, useEffect, useCallback, useRef } from "react";
import { findNearbySite, type Site, type Landmark, distanceM } from "@/data/sites";

interface NearbySiteState {
  site: Site | null;
  distance: number | null;
  nearestLandmark: Landmark | null;
  landmarkDistance: number | null;
  userLat: number | null;
  userLng: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useNearbySite(enabled = true): NearbySiteState {
  const [site, setSite] = useState<Site | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [nearestLandmark, setNearestLandmark] = useState<Landmark | null>(null);
  const [landmarkDistance, setLandmarkDistance] = useState<number | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const updatePosition = useCallback((lat: number, lng: number) => {
    setUserLat(lat);
    setUserLng(lng);
    const result = findNearbySite(lat, lng);
    if (result) {
      setSite(result.site);
      setDistance(Math.round(result.distance));
      // Find nearest landmark
      if (result.site.landmarks.length > 0) {
        let bestLm: Landmark | null = null;
        let bestDist = Infinity;
        for (const lm of result.site.landmarks) {
          const d = distanceM(lat, lng, lm.lat, lm.lng);
          if (d < bestDist) { bestLm = lm; bestDist = d; }
        }
        setNearestLandmark(bestLm);
        setLandmarkDistance(bestLm ? Math.round(bestDist) : null);
      } else {
        setNearestLandmark(null);
        setLandmarkDistance(null);
      }
    } else {
      setSite(null);
      setDistance(null);
      setNearestLandmark(null);
      setLandmarkDistance(null);
    }
    setLoading(false);
  }, []);

  const startWatch = useCallback(() => {
    if (!enabled || !navigator.geolocation) {
      setLoading(false);
      setError("Geolocation not available");
      return;
    }
    setLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => updatePosition(pos.coords.latitude, pos.coords.longitude),
      (err) => { setError(err.message); setLoading(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, [enabled, updatePosition]);

  useEffect(() => {
    startWatch();
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [startWatch]);

  const refresh = useCallback(() => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    startWatch();
  }, [startWatch]);

  return { site, distance, nearestLandmark, landmarkDistance, userLat, userLng, loading, error, refresh };
}
