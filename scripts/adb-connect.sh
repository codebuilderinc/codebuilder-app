#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# 📟 ADB + Expo Device Manager (WSL Safe)
# by digitalnomad91
# ─────────────────────────────────────────────

# 🖍️ Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[1;34m'
CYAN='\033[1;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

divider() { echo -e "${BLUE}────────────────────────────────────────────${RESET}"; }
log()     { echo -e "${CYAN}ℹ️  $1${RESET}"; }
warn()    { echo -e "${YELLOW}⚠️  $1${RESET}"; }
success() { echo -e "${GREEN}✅ $1${RESET}"; }
error()   { echo -e "${RED}❌ $1${RESET}" >&2; }

ADB_BIN="${ADB_BIN:-adb}"
EMULATOR_BIN="${EMULATOR_BIN:-emulator}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    error "Missing required command: $1"
    exit 1
  }
}

require_cmd "$ADB_BIN"

list_all_devices() {
  "$ADB_BIN" devices -l | tr -d '\r' | awk 'NR>1 && NF'
}

normalize_state() {
  echo -n "$1" | tr -d '\r\n'
}

device_state_for_serial() {
  local serial="$1"
  "$ADB_BIN" devices | awk -v s="$serial" '$1==s {print $2}' | tr -d '\r\n'
}

get_avd_name_for_emulator_serial() {
  local serial="$1"
  # Output is typically:
  #   <AVD_NAME>
  #   OK
  # We only want the first non-empty line.
  "$ADB_BIN" -s "$serial" emu avd name 2>/dev/null | tr -d '\r' | awk 'NF{print; exit}'
}

list_avds() {
  if command -v "$EMULATOR_BIN" >/dev/null 2>&1; then
    "$EMULATOR_BIN" -list-avds 2>/dev/null || true
  fi
}

is_expo_device_supported() {
  npx expo run:android --help 2>/dev/null | grep -q -- '--device'
}

divider
echo -e "${BOLD}📟 ADB + Expo Device Manager (WSL Safe)${RESET}"
divider

# 🔌 Start ADB server if not running
log "Checking ADB server..."
if "$ADB_BIN" start-server >/dev/null 2>&1; then
  success "ADB server ready."
else
  warn "ADB server check failed; attempting to continue."
fi

divider
log "Detecting connected devices..."

ALL_SERIALS=()
ALL_NAMES=()
ALL_STATES=()
ALL_DEVICES_RAW=()

for _ in {1..5}; do
  sleep 0.5
  mapfile -t ALL_DEVICES_RAW < <(list_all_devices)
  (( ${#ALL_DEVICES_RAW[@]} > 0 )) && break
done

for line in "${ALL_DEVICES_RAW[@]}"; do
  serial=$(echo "$line" | awk '{print $1}')
  state=$(echo "$line" | awk '{print $2}')
  description=$(echo "$line" | cut -d' ' -f3-)

  # skip any unexpected blank lines
  [[ -z "${serial:-}" ]] && continue

  name="$serial"
  if [[ "$serial" =~ ^emulator- ]]; then
    avd_name="$(get_avd_name_for_emulator_serial "$serial" || true)"
    [[ -n "${avd_name:-}" ]] && name="$avd_name"
  else
    model=$(echo "$description" | sed -n 's/.*model:\([^ ]*\).*/\1/p')
    [[ -n "$model" ]] && name="$model"
  fi

  ALL_SERIALS+=("$serial")
  ALL_NAMES+=("$name")
  ALL_STATES+=("$state")
done

# Expo CLI currently probes all emulator serials (even offline) via `adb -s emulator-XXXX emu avd name`.
# If an emulator is stuck in `offline`, that probe fails and aborts the run.
# Workaround: best-effort kill offline emulator entries so they don't break device discovery.
OFFLINE_EMULATORS=()
for i in "${!ALL_SERIALS[@]}"; do
  serial="${ALL_SERIALS[$i]}"
  state="${ALL_STATES[$i]:-}"
  if [[ "$serial" =~ ^emulator- ]] && [[ "$state" == "offline" ]]; then
    OFFLINE_EMULATORS+=("$serial")
  fi
done

if (( ${#OFFLINE_EMULATORS[@]} > 0 )); then
  warn "Found offline emulator(s) that can break Expo: ${OFFLINE_EMULATORS[*]}"
  warn "Attempting to remove them from adb (best effort)..."
  for serial in "${OFFLINE_EMULATORS[@]}"; do
    ("$ADB_BIN" -s "$serial" emu kill >/dev/null 2>&1 || true)
  done

  warn "Restarting adb server to clear stale devices..."
  ("$ADB_BIN" kill-server >/dev/null 2>&1 || true)
  ("$ADB_BIN" start-server >/dev/null 2>&1 || true)

  # Re-enumerate devices after cleanup so later logic doesn't see the stale offline entries.
  ALL_SERIALS=()
  ALL_NAMES=()
  ALL_STATES=()
  ALL_DEVICES_RAW=()

  for _ in {1..5}; do
    sleep 0.5
    mapfile -t ALL_DEVICES_RAW < <(list_all_devices)
    (( ${#ALL_DEVICES_RAW[@]} > 0 )) && break
  done

  for line in "${ALL_DEVICES_RAW[@]}"; do
    serial=$(echo "$line" | awk '{print $1}')
    state=$(echo "$line" | awk '{print $2}')
    description=$(echo "$line" | cut -d' ' -f3-)

    [[ -z "${serial:-}" ]] && continue

    name="$serial"
    if [[ "$serial" =~ ^emulator- ]]; then
      avd_name="$(get_avd_name_for_emulator_serial "$serial" || true)"
      [[ -n "${avd_name:-}" ]] && name="$avd_name"
    else
      model=$(echo "$description" | sed -n 's/.*model:\([^ ]*\).*/\1/p')
      [[ -n "$model" ]] && name="$model"
    fi

    ALL_SERIALS+=("$serial")
    ALL_NAMES+=("$name")
    ALL_STATES+=("$state")
  done
fi

divider
log "Devices detected (any state):"
if (( ${#ALL_SERIALS[@]} > 0 )); then
  for i in "${!ALL_SERIALS[@]}"; do
    serial="${ALL_SERIALS[$i]}"
    state="${ALL_STATES[$i]:-unknown}"
    name="${ALL_NAMES[$i]:-$serial}"
    prefix="📱"
    [[ "$serial" =~ ^emulator- ]] && prefix="🖥️ "
    if [[ "$state" == "device" ]]; then
      echo -e "  $prefix ${GREEN}${serial}${RESET} (${BOLD}${name}${RESET}, ${state})"
    else
      echo -e "  $prefix ${YELLOW}${serial}${RESET} (${BOLD}${name}${RESET}, ${state})"
    fi
  done
else
  warn "No devices detected."
fi

# Optional: start an AVD (always offer)
AVD_LIST=()
mapfile -t AVD_LIST < <(list_avds)

if (( ${#ALL_SERIALS[@]} == 0 )) && (( ${#AVD_LIST[@]} == 0 )); then
  error "No devices/emulators found."
  exit 1
fi

divider
log "Select a device to launch Expo:"
for i in "${!ALL_SERIALS[@]}"; do
  serial="${ALL_SERIALS[$i]}"
  name="${ALL_NAMES[$i]}"
  st="${ALL_STATES[$i]:-unknown}"
  prefix="📱"
  [[ "$serial" =~ ^emulator- ]] && prefix="🖥️ "
  if [[ "$st" == "device" ]]; then
    echo -e "   $((i + 1))) $prefix ${serial} (${name})"
  else
    echo -e "   $((i + 1))) $prefix ${serial} (${name}) ${YELLOW}[${st}]${RESET}"
  fi
done

if (( ${#AVD_LIST[@]} > 0 )); then
  echo -e "   $(( ${#ALL_SERIALS[@]} + 1 ))) 🧩 Start an AVD..."
fi

MAX_CHOICE=${#ALL_SERIALS[@]}
(( ${#AVD_LIST[@]} > 0 )) && MAX_CHOICE=$((MAX_CHOICE + 1))

read -rp "🚀 Enter choice [1-${MAX_CHOICE}]: " CHOICE
((CHOICE >= 1 && CHOICE <= MAX_CHOICE)) || {
  error "Invalid choice. Exiting."
  exit 1
}

if (( ${#AVD_LIST[@]} > 0 )) && (( CHOICE == MAX_CHOICE )) && (( ${#ALL_SERIALS[@]} < MAX_CHOICE )); then
  divider
  log "Available AVDs (can be started):"
  for i in "${!AVD_LIST[@]}"; do
    echo -e "   $((i + 1))) 🧩 ${AVD_LIST[$i]}"
  done
  read -rp "🧩 Enter AVD number to start: " AVD_CHOICE
  ((AVD_CHOICE >= 1 && AVD_CHOICE <= ${#AVD_LIST[@]})) || {
    error "Invalid AVD choice. Exiting."
    exit 1
  }
  require_cmd "$EMULATOR_BIN"
  AVD_NAME="${AVD_LIST[$((AVD_CHOICE - 1))]}"
  log "Starting AVD: ${AVD_NAME}"
  #nohup emulator -avd "${AVD_NAME}" -no-snapshot -no-boot-anim -no-audio -no-metrics
  nohup "${EMULATOR_BIN}" -avd "${AVD_NAME}" -no-snapshot -no-boot-anim -no-audio -no-metrics >/tmp/avd-start.log 2>&1 &
  echo "EMULATOR_BIN: ${EMULATOR_BIN}"
  echo "AVD_NAME: ${AVD_NAME}"


  log "Waiting for emulator to show up in adb..."
  for _ in {1..60}; do
    sleep 1
    if "$ADB_BIN" devices | awk 'NR>1 {print $1, $2}' | grep -q '^emulator-.* device$'; then
      break
    fi
  done

  # Pick the emulator that corresponds to the AVD we just started.
  SELECTED_SERIAL=""
  for _ in {1..60}; do
    mapfile -t ALL_DEVICES_RAW < <(list_all_devices)
    for line in "${ALL_DEVICES_RAW[@]}"; do
      serial=$(echo "$line" | awk '{print $1}')
      st=$(echo "$line" | awk '{print $2}')
      if [[ "$serial" =~ ^emulator- ]] && [[ "$st" == "device" ]]; then
        running_avd="$(get_avd_name_for_emulator_serial "$serial" || true)"
        if [[ "$running_avd" == "$AVD_NAME" ]]; then
          SELECTED_SERIAL="$serial"
          break
        fi
      fi
    done
    [[ -n "$SELECTED_SERIAL" ]] && break
    sleep 1
  done

  if [[ -z "$SELECTED_SERIAL" ]]; then
    error "Started AVD '${AVD_NAME}', but could not find its running emulator via adb."
    warn "Check: $ADB_BIN devices -l"
    exit 1
  fi

  SELECTED_NAME="$AVD_NAME"
else
  SELECTED_SERIAL="${ALL_SERIALS[$((CHOICE - 1))]}"
  SELECTED_NAME="${ALL_NAMES[$((CHOICE - 1))]}"
fi

divider
echo -e "🎯 Selected: ${GREEN}${SELECTED_SERIAL}${RESET} (${BOLD}${SELECTED_NAME}${RESET})"

# ⏳ Wait for device to be online
divider
echo -e "⏳ Waiting for ${SELECTED_SERIAL} to be online..."
"$ADB_BIN" -s "$SELECTED_SERIAL" wait-for-device

STATE=$("$ADB_BIN" -s "$SELECTED_SERIAL" get-state 2>/dev/null | tr -d '\r\n' || true)
if [[ "$STATE" != "device" ]]; then
  error "Selected target is not ready (state: ${STATE:-unknown})."
  warn "If this is USB: unlock phone and accept USB debugging prompt."
  exit 1
fi

# 🚀 Launch Expo
divider
echo -e "📲 Launching ${BOLD}Expo${RESET} on ${GREEN}${SELECTED_NAME}${RESET}…"

# Force Android tooling to the chosen serial.
export ANDROID_SERIAL="${SELECTED_SERIAL}"

# Expo chooses by "device name"; for USB we pass the model, for emulators the serial.
EXPO_DEVICE_ARG="${SELECTED_NAME}"
if [[ "$SELECTED_SERIAL" =~ ^emulator- ]]; then
  AVD_NAME="$(get_avd_name_for_emulator_serial "$SELECTED_SERIAL" || true)"
  if [[ -n "${AVD_NAME:-}" ]]; then
    EXPO_DEVICE_ARG="$AVD_NAME"
  else
    error "Could not resolve AVD name for ${SELECTED_SERIAL}."
    warn "Try: $ADB_BIN -s ${SELECTED_SERIAL} emu avd name"
    exit 1
  fi
fi

npx expo run:android --device "$EXPO_DEVICE_ARG"
