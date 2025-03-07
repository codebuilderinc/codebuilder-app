import * as Battery from "expo-battery";
import { Platform, Alert } from "react-native";
import { NativeModules } from "react-native";
const { BatteryOptimizationHelper } = NativeModules;

export const getBatteryLevel = async (): Promise<number> => {
  const batteryLevel = await Battery.getBatteryLevelAsync();
  return batteryLevel;
};

export const isBatteryCharging = async (): Promise<boolean> => {
  const batteryState = await Battery.getBatteryStateAsync();
  return batteryState === Battery.BatteryState.CHARGING;
};

export const getBatteryState = async (): Promise<Battery.BatteryState> => {
  const batteryState = await Battery.getBatteryStateAsync();
  return batteryState;
};

export const getPowerState = async (): Promise<Battery.PowerState> => {
  const powerState = await Battery.getPowerStateAsync();
  return powerState;
};

export const isLowPowerModeEnabled = async (): Promise<boolean> => {
  const lowPowerMode = await Battery.isLowPowerModeEnabledAsync();
  return lowPowerMode;
};

export const startBatteryLevelListener = (
  callback: (batteryLevel: number) => void
): Battery.Subscription => {
  return Battery.addBatteryLevelListener((event) => {
    callback(event.batteryLevel);
  });
};

export const startBatteryStateListener = (
  callback: (batteryState: Battery.BatteryState) => void
): Battery.Subscription => {
  return Battery.addBatteryStateListener((event) => {
    callback(event.batteryState);
  });
};

export const startPowerModeListener = (
  callback: (lowPowerMode: boolean) => void
): Battery.Subscription => {
  return Battery.addLowPowerModeListener((event) => {
    callback(event.lowPowerMode);
  });
};

export const removeBatteryListener = (
  subscription: Battery.Subscription
): void => {
  subscription.remove();
};

/**
 * Opens the Battery Optimization settings screen
 * where the user can disable battery restrictions for the app.
 */
export const openBatteryOptimizationSettings = () => {
  if (Platform.OS === "android" && BatteryOptimizationHelper) {
    console.log(
      "Opening battery optimization settings...",
      Platform.OS,
      BatteryOptimizationHelper
    );
    BatteryOptimizationHelper.autoHighlightApp();
  } else {
    console.log(
      "Battery optimization settings are only available on Android.",
      Platform.OS,
      BatteryOptimizationHelper
    );
  }
};
