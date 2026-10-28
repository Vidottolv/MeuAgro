import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import release from '../../native/android/release.json';
export async function getReleaseInfo() {
  if (Capacitor.isNativePlatform()) {
    const info = await App.getInfo();
    return { version: info.version, build: info.build, channel: release.channel, native: true };
  }
  return {
    version: release.versionName,
    build: String(release.versionCode),
    channel: release.channel,
    native: false,
  };
}
