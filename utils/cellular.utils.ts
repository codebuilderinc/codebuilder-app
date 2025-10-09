import * as Cellular from "expo-cellular";

/**
 * Returns whether the carrier allows VoIP calls.
 */
export const allowsVoipAsync = async (): Promise<boolean | null> => {
  return await Cellular.allowsVoipAsync();
};

/**
 * Returns the carrier name.
 */
export const getCarrierNameAsync = async (): Promise<string | null> => {
  return await Cellular.getCarrierNameAsync();
};

/**
 * Returns the current cellular generation (e.g. CELLULAR_3G, CELLULAR_4G, etc.).
 */
export const getCellularGenerationAsync =
  async (): Promise<Cellular.CellularGeneration> => {
    return await Cellular.getCellularGenerationAsync();
  };

/**
 * Returns the ISO country code of the carrier.
 */
export const getIsoCountryCodeAsync = async (): Promise<string | null> => {
  return await Cellular.getIsoCountryCodeAsync();
};

/**
 * Returns the mobile country code (MCC).
 */
export const getMobileCountryCodeAsync = async (): Promise<string | null> => {
  return await Cellular.getMobileCountryCodeAsync();
};

/**
 * Returns the mobile network code (MNC).
 */
export const getMobileNetworkCodeAsync = async (): Promise<string | null> => {
  return await Cellular.getMobileNetworkCodeAsync();
};

/**
 * Gets the current permission response for accessing cellular information.
 */
export const getPermissionsAsync = async (): Promise<any> => {
  return await Cellular.getPermissionsAsync();
};

/**
 * Requests permission for accessing cellular information.
 */
export const requestPermissionsAsync = async (): Promise<any> => {
  return await Cellular.requestPermissionsAsync();
};
