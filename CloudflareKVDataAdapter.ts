import { KVNamespace, KVNamespaceGetOptions } from "@cloudflare/workers-types";
import { AdapterResponse, IDataAdapter } from "statsig-node";

type GetOptions = {
  cacheTtl?: number;
};

export class CloudflareKVDataAdapter {
  private configSpecsKey: string;
  private kvNamespace: KVNamespace;
  private supportConfigSpecPolling: boolean = false;

  public constructor(kvNamespace: KVNamespace, key: string) {
    this.kvNamespace = kvNamespace;
    this.configSpecsKey = key;
  }

  public async get(
    key: string,
    options?: GetOptions
  ): Promise<AdapterResponse> {
    if (!this.isConfgSpecKey(key)) {
      return {
        error: new Error(`Cloudflare KV Adapter Only Supports Config Specs`),
      };
    }

    const data = await this.kvNamespace.get(this.configSpecsKey, {
      ...options,
    });
    if (data === undefined) {
      return { error: new Error(`key (${key}) does not exist`) };
    }
    return { result: data ?? undefined };
  }

  public async set(
    key: string,
    value: string,
    time?: number | undefined
  ): Promise<void> {
    // no-op. Statsig's Edge Config integration keeps config specs synced through Statsig's service
  }

  public async initialize(): Promise<void> {
    const data = await this.kvNamespace.get(this.configSpecsKey);

    if (data) {
      this.supportConfigSpecPolling = true;
    }
  }

  public async shutdown(): Promise<void> {}

  public supportsPollingUpdatesFor(key: string): boolean {
    if (this.isConfgSpecKey(key)) {
      return this.supportConfigSpecPolling;
    }
    return false;
  }

  private isConfgSpecKey(key: string): boolean {
    const v2CacheKeyPattern =
      /^statsig\|\/v[12]\/download_config_specs\|.+\|.+/;
    return key === "statsig.cache" || v2CacheKeyPattern.test(key);
  }
}
