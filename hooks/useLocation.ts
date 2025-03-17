import { useEffect, useState } from "react";
import * as LocationLibrary from "expo-location";
import {
  requestLocationPermission,
  getCurrentLocation,
  reverseGeocode,
  saveLocation,
} from "../utils/location.utils";

export const useLocation = (fcmToken: string | null) => {
  // Accept fcmToken as parameter
  const [location, setLocation] =
    useState<LocationLibrary.LocationObject | null>(null);
  const [address, setAddress] =
    useState<LocationLibrary.LocationGeocodedAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLocation = async () => {
    try {
      setLoading(true);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError("Permission to access location was denied.");
        setLoading(false);
        return;
      }

      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        const { latitude, longitude } = currentLocation.coords;
        setLocation(currentLocation);

        const geoAddress = await reverseGeocode(latitude, longitude);
        setAddress(geoAddress);

        if (geoAddress) {
          await saveLocation(currentLocation, geoAddress, fcmToken); // Pass fcmToken
        }
      }
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred while fetching the location.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fcmToken) {
      fetchLocation();
    }
  }, [fcmToken]); // Trigger fetch when token changes

  return { location, address, error, loading, fetchLocation };
};
