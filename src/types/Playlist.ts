export interface PlaylistItem {
  id: string;
  pluginId: string;
  pluginName?: string;
  startTime: string;
  endTime: string;
  priority: number;
  refreshSeconds: string | number;
  isEnabled: boolean;
  data?: {
    name?: string;
    [key: string]: any;
  };
  config?: Record<string, any>;
}
export interface PlaylistItemApi
  extends Omit<PlaylistItem, "refreshSeconds"> {
  refreshSeconds: string | number;
}