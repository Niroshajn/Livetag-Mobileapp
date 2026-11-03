export interface PlaylistItem {
  id: string;
  pluginId: string;
  pluginName?: string;
  startTime: string;
  endTime: string;
  priority: number;
  refreshSeconds: number;
  isEnabled: boolean;
  data?: {
    name?: string;
  };
}

export interface PlaylistItemApi
  extends Omit<PlaylistItem, "refreshSeconds"> {
  refreshSeconds: string | number;
}