import { useEffect, useState } from "react";
import * as LocationLibrary from "expo-location";
import {
  requestLocationPermission,
  getCurrentLocation,
  reverseGeocode,
  saveLocation,
} from "../utils/location";

export const useLocation = () => {
  const [location, setLocation] =
    useState<LocationLibrary.LocationObject | null>(null);
  const [address, setAddress] =
    useState<LocationLibrary.LocationGeocodedAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLocation = async () => {
    try {
      setLoading(true);

      // Request location permissions
      console.log("Requesting location permissions...");
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError("Permission to access location was denied.");
        setLoading(false);
        return;
      }

      // Get the current location
      const currentLocation = await getCurrentLocation();
      console.log("Current location:", currentLocation);
      if (currentLocation) {
        const { latitude, longitude } = currentLocation.coords;

        setLocation(currentLocation);

        // Reverse geocode to get address
        const geoAddress = await reverseGeocode(latitude, longitude);
        console.log("Reverse geocoded address:", geoAddress);
        setAddress(geoAddress);

        // Save location and address to the backend API
        if (geoAddress) {
          await saveLocation(currentLocation, geoAddress);
        } else {
          console.warn("Reverse geocode returned null; skipping API call.");
        }
      } else {
        setError("Failed to fetch location.");
      }
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred while fetching the location.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation(); // Automatically fetch location on mount
  }, []);

  return { location, address, error, loading, fetchLocation };
};
