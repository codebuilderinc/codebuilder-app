import { useState, useEffect } from "react";
import * as Cellular from "expo-cellular";
import {
  allowsVoipAsync,
  getCarrierNameAsync,
  getCellularGenerationAsync,
  getIsoCountryCodeAsync,
  getMobileCountryCodeAsync,
  getMobileNetworkCodeAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
} from "@/utils/cellular.utils";

export type CellularInfo = {
  allowsVoip: boolean | null;
  carrier: string | null;
  cellularGeneration: Cellular.CellularGeneration;
  isoCountryCode: string | null;
  mobileCountryCode: string | null;
  mobileNetworkCode: string | null;
  permission: any | null;
};

export function useCeullar() {
  const [cellularInfo, setCellularInfo] = useState<CellularInfo>({
    allowsVoip: null,
    carrier: null,
    cellularGeneration: Cellular.CellularGeneration.UNKNOWN,
    isoCountryCode: null,
    mobileCountryCode: null,
    mobileNetworkCode: null,
    permission: null,
  });

  const loadCellularInfo = async () => {
    try {
      const [
        allowsVoip,
        carrier,
        cellularGeneration,
        isoCountryCode,
        mobileCountryCode,
        mobileNetworkCode,
        permission,
      ] = await Promise.all([
        allowsVoipAsync(),
        getCarrierNameAsync(),
        getCellularGenerationAsync(),
        getIsoCountryCodeAsync(),
        getMobileCountryCodeAsync(),
        getMobileNetworkCodeAsync(),
        getPermissionsAsync(),
      ]);
      setCellularInfo({
        allowsVoip,
        carrier,
        cellularGeneration,
        isoCountryCode,
        mobileCountryCode,
        mobileNetworkCode,
        permission,
      });
    } catch (error) {
      console.error("Error loading cellular info:", error);
    }
  };

  useEffect(() => {
    loadCellularInfo();
  }, []);

  const refreshCellularInfo = () => {
    loadCellularInfo();
  };

  return { cellularInfo, refreshCellularInfo, requestPermissionsAsync };
}
