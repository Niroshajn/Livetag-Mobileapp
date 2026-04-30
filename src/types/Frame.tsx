export interface Frame {
  id: string;
  name: string;
  friendlyId?: string;
  updatedAt?: string;
  status?: "online" | "offline";
  previewImageUrl?: string;
  playlistCount?: number;
  signalStrength?: number;
  timezone?: string;
  sleepConfig?: {
    sleepStart?: string;
    sleepEnd?: string;
  };
  isEnabled?: boolean;
  battery?: number;
  wifiSSID?: string;
  modelNo?: string;
  width?: number;
  height?: number;
}
