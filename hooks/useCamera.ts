// useCamera.ts
import { useState, useRef, useEffect } from "react";
import { CameraView, CameraType, FlashMode } from "expo-camera";
import {
  requestCameraPermission,
  checkCameraPermission,
  getAvailableCameraTypes,
  isFlashSupported,
  toggleCameraType,
  flashModeToLabel,
} from "../utils/camera.utils";

type CameraState = {
  hasPermission: boolean | null;
  cameraType: CameraType;
  flashMode: FlashMode;
  zoom: number;
  isRecording: boolean;
  isCameraReady: boolean;
  supportedFlash: boolean;
  availableCameraTypes: CameraType[];
  photo?: string;
  video?: string;
};

const useCamera = () => {
  const cameraRef = useRef<CameraView | null>(null);
  const [state, setState] = useState<CameraState>({
    hasPermission: null,
    // Use string literals instead of enum values
    cameraType: "front" as CameraType, // Instead of CameraType.back
    flashMode: "off", // Instead of FlashMode.off
    zoom: 0,
    isRecording: false,
    isCameraReady: false,
    supportedFlash: false,
    availableCameraTypes: [],
  });

  useEffect(() => {
    initializeCamera();
  }, []);

  const initializeCamera = async () => {
    const { status } = await requestCameraPermission();
    const cameraTypes = await getAvailableCameraTypes();
    const flashSupported = await isFlashSupported();

    setState((prev) => ({
      ...prev,
      hasPermission: status === "granted",
      availableCameraTypes: cameraTypes,
      supportedFlash: flashSupported,
    }));
  };

  const toggleCamera = () => {
    setState((prev) => ({
      ...prev,
      cameraType: toggleCameraType(prev.cameraType),
    }));
  };

  const cycleFlashMode = () => {
    setState((prev) => {
      const modes: FlashMode[] = ["off", "on", "auto"];
      const currentIndex = modes.indexOf(prev.flashMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { ...prev, flashMode: modes[nextIndex] };
    });
  };

  const adjustZoom = (value: number) => {
    setState((prev) => ({
      ...prev,
      zoom: Math.min(Math.max(prev.zoom + value, 0), 1),
    }));
  };

  const takePhoto = async () => {
    if (!cameraRef.current || !state.isCameraReady) return;

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.7,
      skipProcessing: true,
    });

    setState((prev) => ({ ...prev, photo: photo.uri }));
  };

  const startRecording = async () => {
    if (!cameraRef.current || state.isRecording) return;

    setState((prev) => ({ ...prev, isRecording: true }));

    const video = await cameraRef.current.recordAsync({
      //quality: "720p",
      maxDuration: 300,
     // mute: false,
    });

    setState((prev) => ({
      ...prev,
      isRecording: false,
      video: video?.uri,
    }));
  };

  const stopRecording = () => {
    if (!cameraRef.current || !state.isRecording) return;
    cameraRef.current.stopRecording();
  };

  const handleCameraReady = () => {
    setState((prev) => ({ ...prev, isCameraReady: true }));
  };

  return {
    ...state,
    cameraRef,
    flashLabel: flashModeToLabel(state.flashMode),
    toggleCamera,
    cycleFlashMode,
    adjustZoom,
    takePhoto,
    startRecording,
    stopRecording,
    handleCameraReady,
  };
};

export default useCamera;
