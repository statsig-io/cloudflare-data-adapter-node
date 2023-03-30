import { KVNamespace } from '@cloudflare/workers-types';
import { AdapterResponse, IDataAdapter } from 'statsig-node';


export class CloudflareKVDataAdapter implements IDataAdapter {
  private configSpecsKey: string;
  private kvNamespace: KVNamespace;
  private supportConfigSpecPolling: boolean = false;

  public constructor(kvNamespace: KVNamespace, key: string) {
    this.kvNamespace = kvNamespace; 
    this.configSpecsKey = key;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async get(key: string): Promise<AdapterResponse> {
    if (key !== "statsig.cache") {
      return { error: new Error(`Cloudflare KV Adapter Only Supports Config Specs`) };
    }

    const data = await this.kvNamespace.get(this.configSpecsKey);
    if (data === undefined) {
      return { error: new Error(`key (${key}) does not exist`) };
    }
    return { result: JSON.stringify(data), };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async set(
    key: string,
    value: string,
    time?: number | undefined,
  ): Promise<void> {
    // no-op. Statsig's Edge Config integration keeps config specs synced through Statsig's service
  }

  public async initialize(): Promise<void> {
    const data = await this.kvNamespace.get(this.configSpecsKey);

    if (data) {
      this.supportConfigSpecPolling = true;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async shutdown(): Promise<void> {
    
  }

  public supportsPollingUpdatesFor(key: string): boolean {
    if (key === "statsig.cache") {
      return this.supportConfigSpecPolling;
    }
    return false;
  }
}
