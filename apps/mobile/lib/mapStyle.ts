/**
 * Google Maps custom style that hides all default POIs
 * (restaurants, shops, etc.) so only OctanoRD gas station
 * markers are visible on the map.
 */
export const MAP_STYLE = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.government',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
]
