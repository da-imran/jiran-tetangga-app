import { useState, useMemo, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { AppHeader } from "@/components/header";
import {
  AlertTriangle,
  Droplets,
  Lightbulb,
  ShieldAlert,
  Car,
  MapPin,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type IncidentType = "pothole" | "flood" | "streetlight" | "crime" | "traffic";

interface Incident {
  id: string;
  type: IncidentType;
  title: string;
  description: string;
  lat: number;
  lng: number;
  severity: "low" | "medium" | "high";
  reported: string;
  reports: number;
}

const TYPE_CONFIG: Record<
  IncidentType,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
    markerColor: string;
    heatColor: string;
  }
> = {
  pothole: {
    label: "Pothole",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    icon: <AlertTriangle className="h-4 w-4" />,
    markerColor: "#ea580c",
    heatColor: "#ea580c20",
  },
  flood: {
    label: "Flood",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: <Droplets className="h-4 w-4" />,
    markerColor: "#2563eb",
    heatColor: "#2563eb20",
  },
  streetlight: {
    label: "Streetlight",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    icon: <Lightbulb className="h-4 w-4" />,
    markerColor: "#ca8a04",
    heatColor: "#ca8a0420",
  },
  crime: {
    label: "Crime Alert",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: <ShieldAlert className="h-4 w-4" />,
    markerColor: "#dc2626",
    heatColor: "#dc262630",
  },
  traffic: {
    label: "Traffic",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: <Car className="h-4 w-4" />,
    markerColor: "#9333ea",
    heatColor: "#9333ea20",
  },
};

const SEVERITY_RADIUS: Record<string, number> = {
  low: 120,
  medium: 220,
  high: 380,
};

function createDivIcon(type: IncidentType, severity: string) {
  const color = TYPE_CONFIG[type].markerColor;
  const size = severity === "high" ? 36 : severity === "medium" ? 30 : 26;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.5}px;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

function FitBounds({ incidents }: { incidents: Incident[] }) {
  const map = useMap();
  useEffect(() => {
    if (incidents.length > 0) {
      const bounds = L.latLngBounds(incidents.map((i) => [i.lat, i.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, incidents]);
  return null;
}

const FILTERS: Array<{
  value: IncidentType | "all";
  label: string;
  icon?: React.ReactNode;
}> = [
  { value: "all", label: "All" },
  {
    value: "pothole",
    label: "Potholes",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  {
    value: "flood",
    label: "Floods",
    icon: <Droplets className="h-3.5 w-3.5" />,
  },
  {
    value: "streetlight",
    label: "Streetlights",
    icon: <Lightbulb className="h-3.5 w-3.5" />,
  },
  {
    value: "crime",
    label: "Crime",
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  { value: "traffic", label: "Traffic", icon: <Car className="h-3.5 w-3.5" /> },
];

export default function MapPage() {
  const [activeFilter, setActiveFilter] = useState<IncidentType | "all">("all");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get('/incidents');
      const formattedIncidents: Incident[] = (result.data || []).map((item: any) => ({
        id: item._id,
        type: (item.type || "pothole") as IncidentType,
        title: item.title || "",
        description: item.description || "",
        lat: item.lat || 0,
        lng: item.lng || 0,
        severity: (item.severity || "medium") as "low" | "medium" | "high",
        reported: item.reported || "Just now",
        reports: item.reports || 0,
      }));
      setIncidents(formattedIncidents);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const filtered = useMemo(
    () =>
      activeFilter === "all"
        ? incidents
        : incidents.filter((i) => i.type === activeFilter),
    [activeFilter, incidents]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: incidents.length };
    for (const t of Object.keys(TYPE_CONFIG))
      c[t] = incidents.filter((i) => i.type === t).length;
    return c;
  }, [incidents]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />

      <div className="container px-4 py-4 md:px-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Incident Map
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live community-reported incidents. Click a pin for details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors border",
                activeFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              )}
            >
              {f.icon}
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  activeFilter === f.value
                    ? "bg-primary-foreground/20"
                    : "bg-muted",
                )}
              >
                {counts[f.value]}
              </span>
            </button>
          ))}
          <button
            onClick={() => setShowHeatmap((h) => !h)}
            className={cn(
              "ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border",
              showHeatmap
                ? "bg-muted border-border text-foreground"
                : "bg-card border-border text-muted-foreground",
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            {showHeatmap ? "Heatmap On" : "Heatmap Off"}
          </button>
        </div>
      </div>

      <div className="w-full px-4 pb-2 md:px-6">
        <MapContainer
          center={[3.107, 101.631]}
          zoom={14}
          style={{ width: "100%", height: "60vh", minHeight: "300px", borderRadius: "0.75rem", overflow: "hidden" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {showHeatmap &&
            filtered.map((incident) => (
              <Circle
                key={`heat-${incident.id}`}
                center={[incident.lat, incident.lng]}
                radius={SEVERITY_RADIUS[incident.severity]}
                pathOptions={{
                  color: TYPE_CONFIG[incident.type].markerColor,
                  fillColor: TYPE_CONFIG[incident.type].markerColor,
                  fillOpacity:
                    incident.severity === "high"
                      ? 0.18
                      : incident.severity === "medium"
                        ? 0.12
                        : 0.07,
                  weight: 0,
                }}
              />
            ))}

          {filtered.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.lat, incident.lng]}
              icon={createDivIcon(incident.type, incident.severity)}
            >
              <Popup maxWidth={260} className="custom-popup">
                <div className="space-y-2 py-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                        TYPE_CONFIG[incident.type].bgColor,
                        TYPE_CONFIG[incident.type].color,
                      )}
                    >
                      {TYPE_CONFIG[incident.type].label}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        incident.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : incident.severity === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700",
                      )}
                    >
                      {incident.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-semibold text-sm leading-tight">
                    {incident.title}
                  </p>
                  <p className="text-xs text-gray-600 leading-snug">
                    {incident.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t">
                    <span>{incident.reported}</span>
                    <span>
                      {incident.reports} report
                      {incident.reports !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          <FitBounds incidents={filtered} />
        </MapContainer>
      </div>

      <div className="container px-4 py-3 md:px-6">
        <div className="flex flex-wrap gap-3">
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
            <div
              key={type}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <div
                className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: cfg.markerColor }}
              />
              {cfg.label}
            </div>
          ))}
          <span className="ml-auto text-xs text-muted-foreground italic">
            Showing {filtered.length} incidents
          </span>
        </div>
      </div>
    </div>
  );
}