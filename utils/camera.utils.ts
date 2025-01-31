// camera.utils.ts
import { Camera, FlashMode } from "expo-camera";
import { CameraType } from "expo-camera/build/Camera.types";
import { PermissionResponse } from "expo-modules-core";

export const requestCameraPermission =
  async (): Promise<PermissionResponse> => {
    return await Camera.requestCameraPermissionsAsync();
  };

export const checkCameraPermission = async (): Promise<PermissionResponse> => {
  return await Camera.getCameraPermissionsAsync();
};

export const getAvailableCameraTypes = async (): Promise<CameraType[]> => {
  return ["front", "back"];
};

export const isFlashSupported = async (): Promise<boolean> => {
  const cameraTypes = await getAvailableCameraTypes();
  return cameraTypes.includes("back") || cameraTypes.includes("front");
};

export const flashModeToLabel = (mode: FlashMode): string => {
  switch (mode) {
    case "off":
      return "Off";
    case "on":
      return "On";
    case "auto":
      return "Auto";
    default:
      return "Unknown";
  }
};

export const toggleCameraType = (current: CameraType): CameraType => {
  return current === "front" ? "front" : "back";
};
