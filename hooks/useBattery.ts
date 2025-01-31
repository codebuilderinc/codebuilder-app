import { useEffect, useState } from "react";
import * as Battery from "expo-battery";
import {
  getBatteryLevel,
  isBatteryCharging,
  getBatteryState,
  getPowerState,
  isLowPowerModeEnabled,
  startBatteryLevelListener,
  startBatteryStateListener,
  startPowerModeListener,
  removeBatteryListener,
  openBatteryOptimizationSettings,
} from "../utils/battery.utils";

export const useBattery = () => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const [batteryState, setBatteryState] = useState<Battery.BatteryState | null>(
    null
  );
  const [powerState, setPowerState] = useState<Battery.PowerState | null>(null);
  const [lowPowerMode, setLowPowerMode] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchBatteryInfo = async () => {
      const level = await getBatteryLevel();
      const charging = await isBatteryCharging();
      const state = await getBatteryState();
      const power = await getPowerState();
      const lowPower = await isLowPowerModeEnabled();

      setBatteryLevel(level);
      setIsCharging(charging);
      setBatteryState(state);
      setPowerState(power);
      setLowPowerMode(lowPower);
    };

    fetchBatteryInfo();

    const batteryLevelSubscription = startBatteryLevelListener((level) => {
      setBatteryLevel(level);
    });

    const batteryStateSubscription = startBatteryStateListener((state) => {
      setBatteryState(state);
      setIsCharging(state === Battery.BatteryState.CHARGING);
    });

    const powerModeSubscription = startPowerModeListener((lowPower) => {
      setLowPowerMode(lowPower);
    });

    return () => {
      removeBatteryListener(batteryLevelSubscription);
      removeBatteryListener(batteryStateSubscription);
      removeBatteryListener(powerModeSubscription);
    };
  }, []);

  return {
    batteryLevel,
    isCharging,
    batteryState,
    powerState,
    lowPowerMode,
    openBatteryOptimizationSettings, // ✅ Expose this function so components can call it
  };
};
