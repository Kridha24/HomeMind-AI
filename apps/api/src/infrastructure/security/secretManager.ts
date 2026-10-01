export interface SecretManagerProvider {
  getSecret(secretName: string): Promise<string | undefined>;
}

export class EnvSecretProvider implements SecretManagerProvider {
  async getSecret(secretName: string): Promise<string | undefined> {
    return process.env[secretName];
  }
}

/**
 * Cloud-neutral Secret Manager abstraction.
 * Easily wraps AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, or HashiCorp Vault.
 */
export class SecretManagerService {
  private static instance: SecretManagerService;
  private provider: SecretManagerProvider;
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();

  private constructor() {
    this.provider = new EnvSecretProvider();
  }

  public static getInstance(): SecretManagerService {
    if (!SecretManagerService.instance) {
      SecretManagerService.instance = new SecretManagerService();
    }
    return SecretManagerService.instance;
  }

  public setProvider(provider: SecretManagerProvider): void {
    this.provider = provider;
    this.cache.clear();
  }

  public async getSecret(secretName: string, ttlSeconds = 300): Promise<string | undefined> {
    const cached = this.cache.get(secretName);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    const value = await this.provider.getSecret(secretName);
    if (value !== undefined) {
      this.cache.set(secretName, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
    return value;
  }
}

export const secretManager = SecretManagerService.getInstance();
