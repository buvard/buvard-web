import { divIcon } from 'leaflet'

// Icone marker custom : pastille bordeaux pin-style, CSS pur sans asset PNG.
// Partage entre TastingsMap (markers de tastings) et PlacePicker (marker de
// selection de lieu).
export const buvardMarkerIcon = divIcon({
  className: 'buvard-marker',
  html: `
    <div style="position: relative; width: 32px; height: 32px;">
      <div style="
        position: absolute;
        inset: 0;
        background: oklch(0.6 0.18 20);
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px -4px rgba(139, 38, 53, 0.6);
      "></div>
      <div style="
        position: absolute;
        inset: 6px;
        background: white;
        border-radius: 50%;
        transform: rotate(0deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
})
