// CameraComponent.tsx
import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import { Camera, CameraView } from "expo-camera";
import useCamera from "../hooks/useCamera";

const CameraComponent = () => {
  const {
    hasPermission,
    cameraRef,
    cameraType,
    flashMode,
    flashLabel,
    zoom,
    isRecording,
    photo,
    video,
    supportedFlash,
    availableCameraTypes,
    toggleCamera,
    cycleFlashMode,
    adjustZoom,
    takePhoto,
    startRecording,
    stopRecording,
    handleCameraReady,
  } = useCamera();

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        zoom={zoom}
        onCameraReady={handleCameraReady}
      >
        <View style={styles.controls}>
          {/* Camera Type Toggle */}
          {availableCameraTypes.length > 1 && (
            <TouchableOpacity style={styles.button} onPress={toggleCamera}>
              <Text style={styles.text}>Flip</Text>
            </TouchableOpacity>
          )}

          {/* Flash Control */}
          {supportedFlash && (
            <TouchableOpacity style={styles.button} onPress={cycleFlashMode}>
              <Text style={styles.text}>Flash: {flashLabel}</Text>
            </TouchableOpacity>
          )}

          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => adjustZoom(-0.1)}
            >
              <Text style={styles.text}>- Zoom</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => adjustZoom(0.1)}
            >
              <Text style={styles.text}>+ Zoom</Text>
            </TouchableOpacity>
          </View>

          {/* Capture Controls */}
          <View style={styles.captureRow}>
            <TouchableOpacity
              style={[styles.captureButton, isRecording && styles.recording]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.text}>{isRecording ? "Stop" : "Record"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <Text style={styles.text}>Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {/* Preview Section */}
      <View style={styles.previewContainer}>
        {photo && <Image source={{ uri: photo }} style={styles.preview} />}
        {video && <Text style={styles.text}>Video recorded: {video}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  controls: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    padding: 20,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  text: {
    color: "white",
  },
  zoomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  captureRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  captureButton: {
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 20,
    borderRadius: 50,
  },
  recording: {
    backgroundColor: "rgba(255,0,0,0.5)",
  },
  previewContainer: {
    height: 100,
    flexDirection: "row",
    padding: 10,
  },
  preview: {
    width: 250,
    height: 100,
    margin: 1,
  },
});

export default CameraComponent;
