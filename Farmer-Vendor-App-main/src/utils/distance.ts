interface Coordinates {
  latitude: number;
  longitude: number;
}

export const calculateDistance = (coords1: Coordinates, coords2: Coordinates): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  
  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance; // Returns distance in kilometers
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
