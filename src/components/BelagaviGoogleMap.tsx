"use client";

import React, { useState, useMemo } from "react";
import {
  MapPin,
  Globe2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Building2,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Coffee,
  GraduationCap,
  HeartPulse,
  HardHat,
  Eye,
  Crosshair,
  Filter,
  Compass,
  Navigation as NavigationIcon,
} from "lucide-react";
import {
  BELAGAVI_LOCATION,
  BELAGAVI_SECTORS,
  BELAGAVI_AREAS,
  BelagaviCompetitor,
  BelagaviArea,
  filterBelagaviCompetitors,
} from "@/lib/belagavi-data";

interface BelagaviGoogleMapProps {
  activeSector?: "food" | "education" | "healthcare" | "construction";
  initialArea?: string;
  onSectorChange?: (sector: "food" | "education" | "healthcare" | "construction") => void;
  onAreaChange?: (area: string) => void;
  onSelectCompetitor?: (competitor: BelagaviCompetitor) => void;
  compact?: boolean;
  mapOnly?: boolean;
}

export const BelagaviGoogleMap: React.FC<BelagaviGoogleMapProps> = ({
  activeSector = "food",
  initialArea = "all",
  onSectorChange,
  onAreaChange,
  onSelectCompetitor,
  compact = false,
  mapOnly = false,
}) => {
  const [selectedSector, setSelectedSector] = useState<
    "food" | "education" | "healthcare" | "construction"
  >(activeSector);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(initialArea);
  const [customAreaQuery, setCustomAreaQuery] = useState<string>("");
  const [mapType, setMapType] = useState<"m" | "k" | "p">("m"); // m = roadmap, k = satellite, p = terrain
  const [zoomLevel, setZoomLevel] = useState<number>(14);

  // Sync active sector if external prop changes
  React.useEffect(() => {
    if (activeSector && activeSector !== selectedSector) {
      setSelectedSector(activeSector);
    }
  }, [activeSector]);

  // Compute filtered competitors based on sector and area
  const currentAreaTerm = customAreaQuery.trim() || selectedAreaId;
  const { competitors, isExactAreaMatch } = useMemo(() => {
    return filterBelagaviCompetitors(selectedSector, currentAreaTerm);
  }, [selectedSector, currentAreaTerm]);

  const inAreaCompetitors = useMemo(
    () => competitors.filter((c) => c.isDirectAreaMatch),
    [competitors]
  );
  const nearbyCompetitors = useMemo(
    () => competitors.filter((c) => !c.isDirectAreaMatch),
    [competitors]
  );

  const [activeCompetitor, setActiveCompetitor] = useState<BelagaviCompetitor | null>(
    competitors[0] || null
  );

  // Keep activeCompetitor synced when sector/area changes
  React.useEffect(() => {
    setActiveCompetitor(competitors[0] || null);
  }, [selectedSector, currentAreaTerm, competitors]);

  const currentSectorData = BELAGAVI_SECTORS[selectedSector] || BELAGAVI_SECTORS.food;

  const handleSectorClick = (sectorKey: "food" | "education" | "healthcare" | "construction") => {
    setSelectedSector(sectorKey);
    setZoomLevel(14);
    if (onSectorChange) onSectorChange(sectorKey);
  };

  const handleAreaSelect = (area: BelagaviArea) => {
    setSelectedAreaId(area.id);
    setCustomAreaQuery("");
    setZoomLevel(15);
    if (onAreaChange) onAreaChange(area.name);
  };

  const handleCustomAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAreaQuery.trim()) return;
    setZoomLevel(15);
    if (onAreaChange) onAreaChange(customAreaQuery.trim());
  };

  const handleCompetitorClick = (comp: BelagaviCompetitor) => {
    setActiveCompetitor(comp);
    setZoomLevel(16);
    if (onSelectCompetitor) onSelectCompetitor(comp);
  };

  // Resolve current active area display name
  const activeAreaObj = BELAGAVI_AREAS.find((a) => a.id === selectedAreaId);
  const activeAreaTitle = customAreaQuery.trim()
    ? customAreaQuery.trim()
    : activeAreaObj?.name || "All Belagavi";

  // Google Map Query calculation (100% Free Google Maps Embed without API key)
  const mapQuery = useMemo(() => {
    if (mapOnly) {
      if (customAreaQuery.trim()) {
        return `${customAreaQuery.trim()}, Belagavi, Karnataka`;
      }
      if (activeAreaObj && activeAreaObj.id !== "all") {
        return `${activeAreaObj.name}, Belagavi, Karnataka`;
      }
      return `${initialArea || "Belagavi"}, Belagavi, Karnataka, India`;
    }
    if (activeCompetitor) {
      return `${activeCompetitor.name}, ${activeCompetitor.locality}, Belagavi, Karnataka`;
    }
    if (customAreaQuery.trim()) {
      return `${customAreaQuery.trim()}, Belagavi, Karnataka`;
    }
    if (activeAreaObj && activeAreaObj.id !== "all") {
      return `${activeAreaObj.name}, Belagavi, Karnataka`;
    }
    return `Belagavi, Karnataka, India`;
  }, [mapOnly, activeCompetitor, customAreaQuery, activeAreaObj, initialArea]);

  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    mapQuery
  )}&t=${mapType}&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;

  const directGoogleMapsUrl = activeCompetitor && !mapOnly
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${activeCompetitor.name} ${activeCompetitor.locality} Belagavi`
      )}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${activeAreaTitle} Belagavi Karnataka`
      )}`;

  const renderMapCompetitorCard = (comp: BelagaviCompetitor, isNearby: boolean) => {
    const isSelected = activeCompetitor?.id === comp.id;
    return (
      <div
        key={comp.id}
        onClick={() => handleCompetitorClick(comp)}
        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
          isSelected
            ? isNearby
              ? "bg-white border-amber-500 shadow-md ring-2 ring-amber-500/10"
              : "bg-white border-blue-600 shadow-md ring-2 ring-blue-600/10"
            : isNearby
            ? "bg-white/90 border-amber-200/80 hover:bg-white hover:border-amber-300 shadow-xs"
            : "bg-white/90 border-slate-200 hover:bg-white hover:border-slate-300 shadow-xs"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                  isNearby
                    ? "bg-amber-100 text-amber-900 border border-amber-200"
                    : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                }`}
              >
                {isNearby ? `🚗 NEARBY (${comp.distanceKm ? `~${comp.distanceKm} km` : comp.locality})` : "📍 SAME AREA"}
              </span>
              <h4 className="text-xs font-bold text-slate-900">{comp.name}</h4>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  comp.type === "Direct"
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : "bg-slate-100 text-slate-800 border border-slate-200"
                }`}
              >
                {comp.type}
              </span>
            </div>
            <p className="text-[11px] text-blue-700 font-semibold flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-rose-600 flex-shrink-0" />
              <span className="truncate">{comp.locality}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCompetitorClick(comp);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition ${
              isSelected
                ? isNearby
                  ? "bg-amber-600 text-white"
                  : "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>Focus</span>
          </button>
        </div>

        {/* Expanded SWOT Details when selected */}
        {isSelected && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-[11px] animate-in fade-in duration-200">
            {isNearby ? (
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block font-mono">
                  ⚡ Nearby Catchment Threat to {activeAreaTitle}
                </span>
                <p className="text-amber-950 font-medium text-[11px] mt-0.5">
                  {comp.nearbyAreaImpactNote ||
                    `Destination establishment in ${comp.locality}. Pulls customer traffic and online delivery orders from neighboring areas.`}
                </p>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block font-mono">
                  🎯 In-Area Direct Catchment
                </span>
                <p className="text-emerald-950 font-medium text-[11px] mt-0.5">
                  {comp.nearbyAreaImpactNote ||
                    `Directly shares the local customer base and street footfall in ${comp.locality}.`}
                </p>
              </div>
            )}

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-600 uppercase block font-mono">
                📍 Exact Address
              </span>
              <p className="text-slate-800 mt-0.5 font-medium">{comp.address}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">
                💪 Their Locality Strength
              </span>
              <p className="text-slate-700 mt-0.5">{comp.strengths}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-rose-600 uppercase block font-mono flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                Competitor Vulnerability in {activeAreaTitle}
              </span>
              <p className="text-slate-700 mt-0.5">{comp.weaknesses}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block font-mono flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                Your Startup Moat Over {comp.brand}
              </span>
              <p className="text-emerald-950 font-semibold mt-0.5">{comp.ourDifferentiation}</p>
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
              <span>Scale: {comp.fundingOrScale}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  comp.name + " " + comp.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Open in Google Maps <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden space-y-0 transition-all">
      {/* Top Banner: mapOnly Mode vs Full Mode */}
      {mapOnly ? (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-4 sm:p-5 text-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[11px] font-semibold">
                <Globe2 className="w-3 h-3 text-blue-300" />
                <span>Belagavi, Karnataka</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Google Map: {activeAreaTitle}</span>
              </h3>
            </div>

            {/* Quick Locality Search & View Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <form onSubmit={handleCustomAreaSubmit} className="flex items-center gap-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search street/area in Belagavi..."
                    value={customAreaQuery}
                    onChange={(e) => setCustomAreaQuery(e.target.value)}
                    className="pl-7 pr-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-blue-200/50 focus:outline-none focus:bg-white/20 focus:border-cyan-400 w-52"
                  />
                </div>
                {customAreaQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAreaQuery("");
                      setSelectedAreaId("all");
                    }}
                    className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] text-slate-300"
                  >
                    Clear
                  </button>
                )}
              </form>

              <div className="flex rounded-lg border border-white/20 p-0.5 bg-white/10 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMapType("m")}
                  className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                    mapType === "m" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-blue-100 hover:text-white"
                  }`}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("k")}
                  className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                    mapType === "k" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-blue-100 hover:text-white"
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("p")}
                  className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                    mapType === "p" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-blue-100 hover:text-white"
                  }`}
                >
                  Terrain
                </button>
              </div>
            </div>
          </div>

          {/* Quick Area Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
            <span className="text-[10px] text-blue-200 uppercase font-mono font-bold flex-shrink-0">
              Quick Area:
            </span>
            {BELAGAVI_AREAS.map((area) => {
              const isSelected = selectedAreaId === area.id && !customAreaQuery.trim();
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleAreaSelect(area)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition cursor-pointer border flex-shrink-0 ${
                    isSelected
                      ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-bold"
                      : "bg-white/10 text-blue-100 border-white/15 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {area.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 sm:p-6 text-white space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
                <Globe2 className="w-3.5 h-3.5 text-blue-300" />
                <span>Target Territory: Belagavi (Belgaum), Karnataka</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Google Maps Locality &amp; Competitor Radar</span>
              </h3>
              <p className="text-xs text-blue-200/80 max-w-2xl">
                Select or type any locality in Belagavi to discover immediate direct &amp; indirect rivals in that neighborhood.
              </p>
            </div>

            {/* Quick Belagavi Stats */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-left">
                <span className="block text-[10px] text-blue-200 uppercase font-mono">Ecosystem</span>
                <span className="text-sm font-bold text-emerald-300">
                  {BELAGAVI_LOCATION.ecosystemScore}/100
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-left">
                <span className="block text-[10px] text-blue-200 uppercase font-mono">Active Area</span>
                <span className="text-xs font-bold text-amber-300 truncate max-w-[120px] block">
                  {activeAreaTitle}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Sector Selection Tabs */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-cyan-400" />
              <span>Step 1: Select 1 of the 4 Sectors</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Sector 1: Food & Beverages */}
              <button
                type="button"
                onClick={() => handleSectorClick("food")}
                className={`px-3 py-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                  selectedSector === "food"
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/25"
                    : "bg-white/10 border-white/15 text-white hover:bg-white/15"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl ${
                    selectedSector === "food" ? "bg-slate-950 text-amber-400" : "bg-white/10 text-amber-300"
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Food &amp; Beverage</div>
                  <div className="text-[10px] opacity-80 truncate">QSR &amp; Agri-Sweets</div>
                </div>
              </button>

              {/* Sector 2: Education */}
              <button
                type="button"
                onClick={() => handleSectorClick("education")}
                className={`px-3 py-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                  selectedSector === "education"
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/25"
                    : "bg-white/10 border-white/15 text-white hover:bg-white/15"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl ${
                    selectedSector === "education" ? "bg-slate-950 text-cyan-400" : "bg-white/10 text-cyan-300"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Education</div>
                  <div className="text-[10px] opacity-80 truncate">VTU &amp; EdTech Labs</div>
                </div>
              </button>

              {/* Sector 3: Healthcare */}
              <button
                type="button"
                onClick={() => handleSectorClick("healthcare")}
                className={`px-3 py-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                  selectedSector === "healthcare"
                    ? "bg-rose-500 text-white border-rose-400 font-bold shadow-lg shadow-rose-500/25"
                    : "bg-white/10 border-white/15 text-white hover:bg-white/15"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl ${
                    selectedSector === "healthcare" ? "bg-slate-950 text-rose-400" : "bg-white/10 text-rose-300"
                  }`}
                >
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Healthcare</div>
                  <div className="text-[10px] opacity-80 truncate">KLE &amp; Clinic Hubs</div>
                </div>
              </button>

              {/* Sector 4: Construction */}
              <button
                type="button"
                onClick={() => handleSectorClick("construction")}
                className={`px-3 py-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                  selectedSector === "construction"
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-lg shadow-emerald-500/25"
                    : "bg-white/10 border-white/15 text-white hover:bg-white/15"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl ${
                    selectedSector === "construction" ? "bg-slate-950 text-emerald-400" : "bg-white/10 text-emerald-300"
                  }`}
                >
                  <HardHat className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Construction</div>
                  <div className="text-[10px] opacity-80 truncate">Precast &amp; Udyambag</div>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Locality / Area Selector Bar & Search Input */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Step 2: Choose or Type Particular Area in Belagavi</span>
              </span>

              {/* Custom Locality Search Form */}
              <form onSubmit={handleCustomAreaSubmit} className="flex items-center gap-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Type area (e.g. Tilakwadi, Angol, Udyambag)..."
                    value={customAreaQuery}
                    onChange={(e) => setCustomAreaQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-blue-200/50 focus:outline-none focus:bg-white/20 focus:border-cyan-400 w-64 shadow-inner"
                  />
                </div>
                {customAreaQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAreaQuery("");
                      setSelectedAreaId("all");
                    }}
                    className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-medium text-slate-300"
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>

            {/* Quick Locality Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {BELAGAVI_AREAS.map((area) => {
                const isSelected = selectedAreaId === area.id && !customAreaQuery.trim();
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => handleAreaSelect(area)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition cursor-pointer border flex-shrink-0 ${
                      isSelected
                        ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-bold"
                        : "bg-white/10 text-blue-100 border-white/15 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {area.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Google Map Embed */}
      <div className={mapOnly ? "w-full" : "grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-slate-200"}>
        {/* Left Side: Competitor Explorer & SWOT Matrix (ONLY rendered when !mapOnly) */}
        {!mapOnly && (
          <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-4 max-h-[620px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {competitors.length} Rivals Analyzed
                </span>
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                  isExactAreaMatch
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {selectedAreaId !== "all" && nearbyCompetitors.length > 0
                  ? `${inAreaCompetitors.length} in Area · ${nearbyCompetitors.length} Nearby`
                  : isExactAreaMatch
                  ? "Direct Locality Match"
                  : "Nearest Area Hubs"}
              </span>
            </div>

            {/* List of Competitors: Grouped Differently (Same Area vs. Nearby Areas) */}
            {selectedAreaId !== "all" && nearbyCompetitors.length > 0 ? (
              <div className="space-y-4">
                {/* 1. In-Area Group */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      In-Area Rivals ({inAreaCompetitors.length})
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                      Primary Catchment
                    </span>
                  </div>
                  <div className="space-y-2">
                    {inAreaCompetitors.map((comp) => renderMapCompetitorCard(comp, false))}
                  </div>
                </div>

                {/* 2. Nearby Areas Group */}
                <div className="space-y-2 pt-3 border-t-2 border-dashed border-slate-200">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-amber-600" />
                      Nearby Corridors ({nearbyCompetitors.length})
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                      Spillover Threat
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 px-1">
                    Established destination rivals in nearby Belagavi corridors that draw customer footfall and online orders.
                  </p>
                  <div className="space-y-2">
                    {nearbyCompetitors.map((comp) => renderMapCompetitorCard(comp, true))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {competitors.map((comp) => renderMapCompetitorCard(comp, false))}
              </div>
            )}
          </div>
        )}

        {/* Right Side / Full Width: Free Google Maps Iframe Container */}
        <div className={mapOnly ? "w-full flex flex-col bg-slate-100 relative min-h-[420px] sm:min-h-[480px]" : "lg:col-span-7 flex flex-col bg-slate-100 relative min-h-[420px] sm:min-h-[520px]"}>
          {/* Map Controls Header */}
          <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span className="truncate max-w-[200px] sm:max-w-xs font-bold text-slate-900">
                  {mapOnly ? `${activeAreaTitle}, Belagavi` : activeCompetitor ? activeCompetitor.name : `${activeAreaTitle}, Belagavi`}
                </span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-mono font-semibold border border-blue-200">
                {mapOnly ? activeAreaTitle : activeCompetitor?.locality || activeAreaTitle}
              </span>
            </div>

            {/* Map Mode Buttons & Google Maps External Launcher */}
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMapType("m")}
                  className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                    mapType === "m" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Roadmap
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("k")}
                  className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                    mapType === "k" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("p")}
                  className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                    mapType === "p" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Terrain
                </button>
              </div>

              <a
                href={directGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition"
              >
                <span>Live Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Free Google Maps Iframe */}
          <div className="relative w-full flex-1 min-h-[380px]">
            <iframe
              title={`Google Map - ${mapQuery}`}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: compact ? "340px" : "500px" }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={embedUrl}
              className="w-full h-full"
            />

            {/* Floating Info Pill Over Map */}
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto pointer-events-none">
              <div className="bg-slate-950/85 backdrop-blur-md text-white p-3 rounded-2xl border border-white/10 shadow-xl max-w-sm pointer-events-auto">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Belagavi Locality Active
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">15.8497° N, 74.4977° E</span>
                </div>
                <p className="text-xs font-bold text-slate-100 mt-1">
                  {mapOnly
                    ? `${activeAreaTitle}, Belagavi`
                    : activeCompetitor
                    ? `${activeCompetitor.name} (${activeCompetitor.locality})`
                    : `${activeAreaTitle}, Belagavi`}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {mapOnly
                    ? `Belagavi District, Karnataka`
                    : activeCompetitor
                    ? activeCompetitor.address
                    : `Belagavi District, Karnataka`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
