export function ensureGoogleMaps(apiKey) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Tarayıcı ortamı gerekiyor."));
  }

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }

  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API anahtarı bulunamadı."));
  }

  const existing = document.querySelector("script[data-google-maps-loader]");
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () =>
        window.google ? resolve(window.google) : reject(new Error("Google Maps yüklenemedi"))
      );
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

export async function geocodeAddress(query, apiKey) {
  if (!query?.trim()) return null;

  const google = await ensureGoogleMaps(apiKey);
  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        resolve({ latitude: location.lat(), longitude: location.lng() });
      } else {
        reject(new Error(`Adres doğrulanamadı: ${status}`));
      }
    });
  });
}