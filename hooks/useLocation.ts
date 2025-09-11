import { useEffect, useState } from "react";
import { useSession } from '@/providers/SessionProvider';
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

      if (!fcmToken) {
        console.log(
          "fetchLocation invoked without an FCM token; aborting location save step."
        );
      }

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
          await saveLocation(currentLocation, geoAddress, fcmToken); // Pass fcmToken (may be null; saveLocation will re-check)
        } else {
          console.log("Geo address unavailable; skipping saveLocation.");
        }
      }
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred while fetching the location.");
    } finally {
      setLoading(false);
    }
  };

  const { waitForFcmToken } = useSession();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = fcmToken || (await waitForFcmToken());
      if (!cancelled && token) {
        fetchLocation();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fcmToken, waitForFcmToken]);

  return { location, address, error, loading, fetchLocation };
};
