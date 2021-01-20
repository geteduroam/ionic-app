declare module "@capacitor/core" {
  interface PluginRegistry {
    WifiEapConfigurator: WifiEapConfiguratorPlugin;
  }
}

export interface WifiEapConfiguratorPlugin {
  echo(options: { value: string }): Promise<{value: string}>;
}
