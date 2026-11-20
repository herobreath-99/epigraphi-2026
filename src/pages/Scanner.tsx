import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { enhanceImage, enhancementSteps, type EnhanceResult } from "@/lib/imageEnhancer";
import { useNearbySite } from "@/hooks/useNearbySite";

import ScannerHeader from "@/components/scanner/ScannerHeader";
import ScanningFrame from "@/components/scanner/ScanningFrame";
import DetectionOverlay from "@/components/scanner/DetectionOverlay";
import EnhancementOverlay from "@/components/scanner/EnhancementOverlay";
import ComparisonSlider from "@/components/scanner/ComparisonSlider";
import BottomControls from "@/components/scanner/BottomControls";
import AnalyzingOverlay from "@/components/scanner/AnalyzingOverlay";
import SiteContextOverlay from "@/components/scanner/SiteContextOverlay";

const Scanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const initialMode = (location.state as { mode?: string } | null)?.mode === "upload" ? "upload" : "camera";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [mode, setMode] = useState<"camera" | "upload">(initialMode);
  const [flashOn, setFlashOn] = useState(false);

  const [enhancing, setEnhancing] = useState(false);
  const [enhanceStep, setEnhanceStep] = useState(0);
  const [enhanceLabel, setEnhanceLabel] = useState("");
  const [enhanceResult, setEnhanceResult] = useState<EnhanceResult | null>(null);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showSiteContext, setShowSiteContext] = useState(true);

  const { site: nearbySite, distance: siteDistance, nearestLandmark, landmarkDistance } = useNearbySite(mode === "camera");

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } });
      if (videoRef.current) { videoRef.current.srcObject = mediaStream; await videoRef.current.play(); }
      setStream(mediaStream);
      setCameraActive(true);
    } catch {
      toast.error(t("scanner", "cameraError"));
      setMode("upload");
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    if (stream) { stream.getTracks().forEach((tr) => tr.stop()); setStream(null); setCameraActive(false); }
    setFlashOn(false);
  }, [stream]);

  useEffect(() => {
    if (mode === "camera") startCamera();
    return () => { stream?.getTracks().forEach((tr) => tr.stop()); };
  }, [mode]);

  const toggleFlash = useCallback(async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    try {
      const capabilities = videoTrack.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
      if (!capabilities?.torch) {
        toast.error("Flash not supported on this device");
        return;
      }
      const newFlash = !flashOn;
      await videoTrack.applyConstraints({ advanced: [{ torch: newFlash } as MediaTrackConstraintSet] });
      setFlashOn(newFlash);
    } catch {
      toast.error("Flash not available");
    }
  }, [stream, flashOn]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    runEnhancement(dataUrl);
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const dataUrl = ev.target?.result as string; setCapturedImage(dataUrl); runEnhancement(dataUrl); };
    reader.readAsDataURL(file);
  };

  const runEnhancement = async (dataUrl: string) => {
    const autoEnhance = localStorage.getItem("autoEnhance") !== "false";
    if (!autoEnhance) return;
    setEnhancing(true); setEnhanceStep(0); setEnhanceLabel(enhancementSteps[0]?.label ?? ""); setEnhanceResult(null);
    try {
      const result = await enhanceImage(dataUrl, (step, label) => { setEnhanceStep(step); setEnhanceLabel(label); });
      setEnhanceResult(result); setCapturedImage(result.enhancedDataUrl);
      setAiEnhancing(true); setEnhanceLabel(t("scanner", "aiEnhancingLabel"));
      const base64 = result.enhancedDataUrl.split(",")[1];
      const { data, error } = await supabase.functions.invoke("enhance-image", { body: { imageBase64: base64 } });
      if (!error && data?.enhancedImageUrl) {
        const aiResult: EnhanceResult = { originalDataUrl: dataUrl, enhancedDataUrl: data.enhancedImageUrl };
        setEnhanceResult(aiResult); setCapturedImage(data.enhancedImageUrl);
        toast.success(t("scanner", "aiEnhanced"));
      }
    } catch {
      toast.error(t("scanner", "enhanceFailed"));
    } finally { setEnhancing(false); setAiEnhancing(false); }
  };

  const retake = () => { setCapturedImage(null); setEnhanceResult(null); setRotation(0); if (mode === "camera") startCamera(); };

  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const hashImage = async (dataUrl: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(dataUrl.substring(0, 10000));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    setAnalyzing(true);
    try {
      const imageToSend = enhanceResult?.enhancedDataUrl ?? capturedImage;
      const base64 = imageToSend.split(",")[1];
      const imageHash = await hashImage(capturedImage);
      const { data, error } = await supabase.functions.invoke("analyze-inscription", { body: { imageBase64: base64, imageHash } });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setAnalyzing(false); return; }
      const analysis = data.analysis;
      if (data?.cached) {
        toast.success(t("scanner", "cachedResult") ?? "تم استرجاع نتيجة محفوظة");
      }
      if (user && analysis && !data?.cached) {
        await supabase.from("scans").insert({ user_id: user.id, title: analysis.fragmentId ?? "Scan", script_type: analysis.scriptType ?? null, fragment_id: imageHash, region: analysis.region ?? null, site: analysis.site ?? null, image_url: capturedImage, analysis, confidence: analysis.diplomatic?.confidence ?? null });
      }
      navigate("/results", { state: { analysis, imageUrl: capturedImage } });
    } catch {
      toast.error(t("scanner", "analyzeFailed"));
    } finally { setAnalyzing(false); }
  };

  const enhanceProgress = enhancing ? Math.round((enhanceStep / enhancementSteps.length) * 100) : 100;
  const status = enhancing ? "enhancing" : analyzing ? "analyzing" : "idle";

  return (
    <div className="relative flex h-screen w-full flex-col bg-background overflow-hidden">
      <ScannerHeader mode={mode} status={status} onClose={() => { stopCamera(); navigate("/dashboard"); }} onToggleMode={() => { const next = mode === "camera" ? "upload" : "camera"; if (next === "upload") stopCamera(); setMode(next); setCapturedImage(null); setEnhanceResult(null); }} />

      <div className="relative flex-1">
        {mode === "camera" && !capturedImage && <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />}
        {mode === "upload" && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <div className="w-24 h-24 rounded-2xl bg-card/60 border border-border/30 flex items-center justify-center"><ImagePlus className="w-10 h-10 text-muted-foreground" /></div>
            <p className="text-muted-foreground text-sm font-arabic">{t("scanner", "selectImage")}</p>
            <button onClick={() => fileInputRef.current?.click()} className="gold-gradient text-primary-foreground px-8 py-3 rounded-xl font-bold font-arabic text-sm" style={{ boxShadow: "0 0 20px hsl(var(--gold) / 0.2)" }}>{t("scanner", "selectImageBtn")}</button>
          </div>
        )}
        {capturedImage && !enhancing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background" style={{ transform: `rotate(${rotation}deg)`, transition: "transform 0.3s ease" }}>
            {enhanceResult ? <ComparisonSlider originalUrl={enhanceResult.originalDataUrl} enhancedUrl={enhanceResult.enhancedDataUrl} /> : <img src={capturedImage} alt="Preview" className="w-full h-full object-contain" />}
          </div>
        )}
        {mode === "camera" && !capturedImage && cameraActive && <ScanningFrame />}
        {mode === "camera" && !capturedImage && cameraActive && <DetectionOverlay />}
        {enhancing && <EnhancementOverlay enhanceStep={enhanceStep} enhanceLabel={enhanceLabel} enhanceProgress={enhanceProgress} aiEnhancing={aiEnhancing} />}
        {analyzing && <AnalyzingOverlay />}
        {nearbySite && showSiteContext && !capturedImage && !enhancing && !analyzing && (
          <SiteContextOverlay
            site={nearbySite}
            distance={siteDistance!}
            nearestLandmark={nearestLandmark}
            landmarkDistance={landmarkDistance}
            onDismiss={() => setShowSiteContext(false)}
          />
        )}
      </div>

      <BottomControls mode={mode} capturedImage={capturedImage} enhancing={enhancing} analyzing={analyzing} cameraActive={cameraActive} flashOn={flashOn} onCapture={capturePhoto} onRetake={retake} onAnalyze={analyzeImage} onUpload={() => fileInputRef.current?.click()} onRotate={handleRotate} onToggleFlash={toggleFlash} onToggleMode={(m) => { if (m === "upload") stopCamera(); setMode(m); setCapturedImage(null); setEnhanceResult(null); setRotation(0); }} />

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
    </div>
  );
};

export default Scanner;
