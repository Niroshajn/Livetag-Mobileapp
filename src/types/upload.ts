export const UploadType = {
  PROFILE_AVATAR: "profile-avatar",
  PLUGIN_LOGO: "plugin-logo",
  PLUGIN_PREVIEW: "plugin-preview",
  GENERIC_FILE: "generic-file",
  CONNECTOR_ITEMS: "connector-items",
  PLAYGROUND_CONNECTOR_INSTANCE: "playground-connector-instance",
  PLUGIN_CONNECTOR_INSTANCE : "plugin-connector-instance",
} as const;

export type UploadType = (typeof UploadType)[keyof typeof UploadType];
