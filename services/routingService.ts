/**
 * Google Directions wrapper for Rava navigation.
 * Prefer Maps JS DirectionsService when available; fall back to REST Directions API.
 */

export type RouteMode = 'walking' | 'driving' | 'transit';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface RouteResult {
  mode: RouteMode;
  distanceText: string;
  durationText: string;
  distanceMeters: number;
  durationSeconds: number;
  path: LatLngLiteral[];
  summary?: string;
}

declare const google: any;

const MODE_MAP: Record<RouteMode, string> = {
  walking: 'WALKING',
  driving: 'DRIVING',
  transit: 'TRANSIT',
};

function directionsStatusMessage(status: string): string {
  switch (status) {
    case 'REQUEST_DENIED':
      return 'مسیریابی در دسترس نیست. کلید نقشه دمو است — Billing/API باید در Google Cloud فعال شود.';
    case 'OVER_QUERY_LIMIT':
      return 'محدودیت درخواست مسیریابی. کمی بعد دوباره تلاش کن.';
    case 'ZERO_RESULTS':
      return 'مسیری بین مبدا و مقصد پیدا نشد.';
    case 'NOT_FOUND':
      return 'مبدا یا مقصد پیدا نشد.';
    case 'INVALID_REQUEST':
      return 'درخواست مسیریابی نامعتبر است.';
    default:
      return `مسیریابی ناموفق بود (${status}).`;
  }
}

class RoutingServiceImpl {
  private lastRenderer: any = null;

  async calculateRoute(
    origin: LatLngLiteral,
    destination: LatLngLiteral,
    mode: RouteMode = 'walking',
  ): Promise<RouteResult> {
    if (typeof google !== 'undefined' && google.maps?.DirectionsService) {
      return this.viaMapsJs(origin, destination, mode);
    }
    return this.viaRest(origin, destination, mode);
  }

  private viaMapsJs(
    origin: LatLngLiteral,
    destination: LatLngLiteral,
    mode: RouteMode,
  ): Promise<RouteResult> {
    return new Promise((resolve, reject) => {
      const service = new google.maps.DirectionsService();
      service.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode[MODE_MAP[mode]],
          provideRouteAlternatives: false,
        },
        (result: any, status: string) => {
          if (status !== 'OK' || !result?.routes?.[0]) {
            reject(new Error(directionsStatusMessage(status)));
            return;
          }
          resolve(this.normalizeJsResult(result, mode));
        },
      );
    });
  }

  private normalizeJsResult(result: any, mode: RouteMode): RouteResult {
    const route = result.routes[0];
    const leg = route.legs[0];
    const path: LatLngLiteral[] = [];

    if (route.overview_path) {
      for (const p of route.overview_path) {
        path.push({ lat: p.lat(), lng: p.lng() });
      }
    } else {
      for (const step of leg.steps || []) {
        for (const p of step.path || []) {
          path.push({ lat: p.lat(), lng: p.lng() });
        }
      }
    }

    return {
      mode,
      distanceText: leg.distance?.text || '—',
      durationText: leg.duration?.text || '—',
      distanceMeters: leg.distance?.value || 0,
      durationSeconds: leg.duration?.value || 0,
      path,
      summary: route.summary,
    };
  }

  private async viaRest(
    origin: LatLngLiteral,
    destination: LatLngLiteral,
    mode: RouteMode,
  ): Promise<RouteResult> {
    // Client key from config if present — same Maps key usually enables Directions.
    const key =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) ||
      '';

    if (!key) {
      throw new Error('Directions API در دسترس نیست (کلید یا Maps JS لازم است).');
    }

    const url =
      `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}` +
      `&mode=${mode}&language=fa&key=${key}`;

    // Note: browser CORS often blocks this; Maps JS path is preferred.
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.routes?.[0]) {
      throw new Error(directionsStatusMessage(data.status || 'UNKNOWN'));
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    const path = this.decodePolyline(route.overview_polyline?.points || '');

    return {
      mode,
      distanceText: leg.distance?.text || '—',
      durationText: leg.duration?.text || '—',
      distanceMeters: leg.distance?.value || 0,
      durationSeconds: leg.duration?.value || 0,
      path,
      summary: route.summary,
    };
  }

  /** Encoded polyline decoder (Google algorithm). */
  decodePolyline(encoded: string): LatLngLiteral[] {
    const coordinates: LatLngLiteral[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let b: number;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return coordinates;
  }

  clear() {
    if (this.lastRenderer) {
      try {
        this.lastRenderer.setMap(null);
      } catch {
        /* noop */
      }
      this.lastRenderer = null;
    }
  }
}

export const routingService = new RoutingServiceImpl();
