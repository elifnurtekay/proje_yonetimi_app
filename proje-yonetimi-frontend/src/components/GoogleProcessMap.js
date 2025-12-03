import React, { useEffect, useMemo, useRef, useState } from "react";
import { summarizeLocation } from "../utils/location";
import "./GoogleProcessMap.css";

const DEFAULT_CENTER = { lat: 39.925533, lng: 32.866287 };

function ensureGoogleMaps(apiKey) {
  if (typeof window === "undefined") return Promise.reject(new Error("Tarayıcı ortamı gerekiyor."));
  if (window.google && window.google.maps) return Promise.resolve(window.google);
  if (!apiKey) return Promise.reject(new Error("Google Maps API anahtarı bulunamadı."));

  const existing = document.querySelector("script[data-google-maps-loader]");
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => (window.google ? resolve(window.google) : reject(new Error("Google Maps yüklenemedi"))));
      existing.addEventListener("error", () => reject(new Error("Google Maps yüklenemedi")));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "true";
    script.onload = () => (window.google ? resolve(window.google) : reject(new Error("Google Maps yüklenemedi")));
    script.onerror = () => reject(new Error("Google Maps yüklenemedi"));
    document.head.appendChild(script);
  });
}

function buildProcessCard(process) {
  const wrapper = document.createElement("div");
  wrapper.className = "map-process-card";

  const title = document.createElement("div");
  title.className = "map-process-title";
  title.textContent = process.name || "Süreç";
  wrapper.appendChild(title);

  const location = document.createElement("div");
  location.className = "map-process-location";
  location.textContent = summarizeLocation(process) || "Lokasyon bilgisi yok";
  wrapper.appendChild(location);

  const status = document.createElement("div");
  status.className = "map-process-status";
  const progress = Math.max(0, Math.min(100, Number(process.effective_progress ?? process.progress ?? 0)));
  status.textContent = `${process.status || "Aktif"} • %${progress}`;
  wrapper.appendChild(status);

  const bar = document.createElement("div");
  bar.className = "map-process-progress";
  const fill = document.createElement("div");
  fill.className = "map-process-progress-fill";
  fill.style.width = `${progress}%`;
  bar.appendChild(fill);
  wrapper.appendChild(bar);

  return wrapper;
}

function createOverlay(google, map, process) {
  const { latitude, longitude } = process || {};
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  class ProcessOverlay extends google.maps.OverlayView {
    constructor(position, element) {
      super();
      this.position = position;
      this.element = element;
    }

    onAdd() {
      const panes = this.getPanes();
      panes.floatPane.appendChild(this.element);
    }

    draw() {
      const projection = this.getProjection();
      const point = projection.fromLatLngToDivPixel(this.position);
      if (!point) return;
      this.element.style.transform = `translate(${point.x - 140}px, ${point.y - 160}px)`;
    }

    onRemove() {
      if (this.element?.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  const position = new google.maps.LatLng(lat, lng);
  const element = buildProcessCard(process);
  const overlay = new ProcessOverlay(position, element);
  overlay.setMap(map);
  return overlay;
}

export default function GoogleProcessMap({ processes = [] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const googleRef = useRef(null);
  const overlaysRef = useRef([]);
  const [error, setError] = useState("");

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const validProcesses = useMemo(
    () => (processes || []).filter((p) => p.latitude && p.longitude),
    [processes]
  );

  useEffect(() => {
    if (!containerRef.current || googleRef.current || !apiKey) return;

    ensureGoogleMaps(apiKey)
      .then((google) => {
        googleRef.current = google;
        const first = validProcesses[0];
        const center = first
          ? { lat: Number(first.latitude), lng: Number(first.longitude) }
          : DEFAULT_CENTER;
        const map = new google.maps.Map(containerRef.current, {
          center,
          zoom: first ? 12 : 5,
          disableDefaultUI: true,
          mapTypeId: "roadmap",
          styles: [
            { elementType: "geometry", stylers: [{ color: "#f5f3ff" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "road", stylers: [{ color: "#d3c4ff" }] },
            { featureType: "water", stylers: [{ color: "#c7d2fe" }] },
          ],
        });
        mapRef.current = map;
      })
      .catch((err) => {
        setError(err.message || "Google Haritalar yüklenirken hata oluştu.");
      });
  }, [apiKey, validProcesses]);

  useEffect(() => {
    if (!mapRef.current || !googleRef.current) return;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    const bounds = new googleRef.current.maps.LatLngBounds();

    validProcesses.forEach((process) => {
      const overlay = createOverlay(googleRef.current, mapRef.current, process);
      if (overlay) {
        overlaysRef.current.push(overlay);
        bounds.extend(new googleRef.current.maps.LatLng(Number(process.latitude), Number(process.longitude)));
      }
    });

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 80);
      if (mapRef.current.getZoom() > 16) {
        mapRef.current.setZoom(16);
      }
    } else {
      mapRef.current.setCenter(DEFAULT_CENTER);
      mapRef.current.setZoom(5);
    }
  }, [validProcesses]);

  return (
    <div className="google-map-wrapper">
      {!apiKey && (
        <div className="map-warning">
          Google Haritalar anahtarı bulunamadı. Lütfen `.env` dosyanıza
          <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> değerini ekleyin.
        </div>
      )}
      {error && <div className="map-warning">{error}</div>}
      <div ref={containerRef} className="google-map-canvas" role="presentation" />
    </div>
  );
}
