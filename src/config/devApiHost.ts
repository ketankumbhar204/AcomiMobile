/**
 * PC LAN IP for physical Android over Wi‑Fi (same network as the dev machine).
 * Run `ipconfig` on Windows to find your IPv4 address.
 *
 * Not needed when using USB + `adb reverse tcp:8080 tcp:8080` (localhost is used instead).
 */
export const ANDROID_PHYSICAL_LAN_HOST = '192.168.1.108';
