#!/usr/bin/env bash
set -euo pipefail
shopt -s lastpipe

# ────────────────────────────────────────────
# 🎨 Helper: Styling
# ────────────────────────────────────────────
info()    { printf "\033[1;34mℹ️  %s\033[0m\n" "$*"; }
success() { printf "\033[1;32m✅ %s\033[0m\n" "$*"; }
warn()    { printf "\033[1;33m⚠️  %s\033[0m\n" "$*"; }
error()   { printf "\033[1;31m❌ %s\033[0m\n" "$*"; }

section() {
  printf "\n\033[1;35m────────────────────────────────────────────\033[0m\n"
  printf "📟 \033[1;1mADB + Expo Device Manager (WSL Safe)\033[0m\n"
  printf "\033[1;35m────────────────────────────────────────────\033[0m\n"
}
divider() { printf "\033[1;35m────────────────────────────────────────────\033[0m\n"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { error "Missing required command: $1"; exit 1; }
}

# ────────────────────────────────────────────
# 🧠 Detect USB & emulator devices
# ────────────────────────────────────────────
USB_DEVICES=()
EMU_DEVICES=()
ALL_DEVICES=()

get_devices() {
  USB_DEVICES=()
  EMU_DEVICES=()

  # Drop the header line safely; do NOT let grep/sed failure trip set -e
  local adb_out
  adb_out="$(adb devices -l 2>/dev/null | sed '1d' || true)"

  while IFS= read -r line; do
    # Skip empty/whitespace-only lines
    [[ -z "${line//[[:space:]]/}" ]] && continue

    # serial + status are always first two fields
    local serial status rest model device_name entry
    serial="$(awk '{print $1}' <<<"$line" || true)"
    status="$(awk '{print $2}' <<<"$line" || true)"
    [[ -z "$serial" || -z "$status" ]] && continue

    # Everything after the 2nd field
    rest="$(cut -d' ' -f3- <<<"$line" 2>/dev/null || true)"

    # Extract model:XYZ if present (no grep -P dependency)
    model="$(sed -n 's/.*model:\([^[:space:]]*\).*/\1/p' <<<"$rest" | head -n1 || true)"

    device_name="${model:-$serial}"
    entry="$serial::$status::$device_name"

    if [[ "$serial" == emulator-* ]]; then
      EMU_DEVICES+=("$entry")
    else
      USB_DEVICES+=("$entry")
    fi
  done <<<"$adb_out"
}

# ────────────────────────────────────────────
# 🔐 Ensure ADB server is running
# ────────────────────────────────────────────
start_adb_if_needed() {
  section
  require_cmd adb
  require_cmd npx

  info "Checking ADB server..."
  # Starting the server is safe even if it is already running
  adb start-server >/dev/null 2>&1 || true
  success "ADB server is responsive."
}

# ────────────────────────────────────────────
# 📱 Device Selector Prompt
# ────────────────────────────────────────────
SELECTED_SERIAL=""
SELECTED_NAME=""
SELECTED_STATUS=""

prompt_device_choice() {
  divider
  info "Select a device to launch Expo:"

  local i serial status name icon
  for i in "${!ALL_DEVICES[@]}"; do
    IFS='::' read -r serial status name <<<"${ALL_DEVICES[$i]}"
    icon="📱"
    [[ "$serial" == emulator-* ]] && icon="🖥️"
    printf " %d) %s %s (%s) [%s]\n" "$((i + 1))" "$icon" "$serial" "$name" "$status"
  done

  local choice_raw choice_idx max="${#ALL_DEVICES[@]}"
  while true; do
    read -rp "🚀 Enter choice [1-${max}]: " choice_raw
    [[ "$choice_raw" =~ ^[0-9]+$ ]] || { warn "Enter a number from 1 to ${max}."; continue; }
    (( choice_raw >= 1 && choice_raw <= max )) || { warn "Out of range. Enter 1..${max}."; continue; }

    choice_idx=$((choice_raw - 1))
    IFS='::' read -r SELECTED_SERIAL SELECTED_STATUS SELECTED_NAME <<<"${ALL_DEVICES[$choice_idx]}"
    break
  done
}

# ────────────────────────────────────────────
# ⏳ Wait for device to be online (with timeout if available)
# ────────────────────────────────────────────
wait_for_selected_device() {
  divider
  info "Waiting for ${SELECTED_SERIAL} to be online..."

  if command -v timeout >/dev/null 2>&1; then
    # adb syntax: adb -s SERIAL wait-for-device
    timeout 90s adb -s "$SELECTED_SERIAL" wait-for-device || {
      error "Timed out waiting for ${SELECTED_SERIAL}."
      exit 1
    }
  else
    adb -s "$SELECTED_SERIAL" wait-for-device
  fi

  # Confirm state
  local state
  state="$(adb -s "$SELECTED_SERIAL" get-state 2>/dev/null || true)"
  if [[ "$state" != "device" ]]; then
    warn "Device state is '${state:-unknown}'. If this is 'unauthorized', accept the RSA prompt on the device."
  else
    success "${SELECTED_SERIAL} is online."
  fi
}

# ────────────────────────────────────────────
# 🚀 Launch Expo with selected device
# ────────────────────────────────────────────
launch_expo() {
  divider
  printf "🎯 Selected: \033[1m%s (%s)\033[0m [%s]\n" "$SELECTED_SERIAL" "$SELECTED_NAME" "$SELECTED_STATUS"

  # Optional cleanup: try to kill a known zombie emulator-5554 if present
  if adb devices 2>/dev/null | awk '{print $1,$2}' | grep -qE '^emulator-5554[[:space:]]+offline$' ; then
    warn "Attempting to kill zombie emulator: emulator-5554"
    adb -s emulator-5554 emu kill >/dev/null 2>&1 || true
  fi

  wait_for_selected_device

  divider
  info "Launching Expo on ${SELECTED_SERIAL}..."
  export EXPO_ANDROID_DEVICE_ID="$SELECTED_SERIAL"

  # Use expo run:android targeting the chosen device
  npx expo run:android --device "$SELECTED_SERIAL"
}

# ────────────────────────────────────────────
# 🧠 Main logic
# ────────────────────────────────────────────
start_adb_if_needed

divider
info "Detecting connected devices..."
get_devices

if [[ "${#USB_DEVICES[@]}" -eq 0 ]]; then
  warn "No USB devices found."
else
  info "USB Devices detected:"
  for dev in "${USB_DEVICES[@]}"; do
    IFS='::' read -r serial status name <<<"$dev"
    printf " 📱 %s [%s]\n" "$serial" "$status"
  done
fi

divider
if [[ "${#EMU_DEVICES[@]}" -eq 0 ]]; then
  warn "No emulators running."
else
  info "Available Android Virtual Devices:"
  for dev in "${EMU_DEVICES[@]}"; do
    IFS='::' read -r serial status name <<<"$dev"
    printf " 🖥️ %s [%s]\n" "$serial" "$status"
  done
fi

ALL_DEVICES=("${USB_DEVICES[@]}" "${EMU_DEVICES[@]}")

if [[ "${#ALL_DEVICES[@]}" -eq 0 ]]; then
  divider
  error "No available devices to select."
  exit 1
fi

prompt_device_choice
launch_expo