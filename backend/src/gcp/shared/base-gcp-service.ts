import { GoogleAuth } from 'google-auth-library';

export abstract class BaseGcpService {
  protected abstract scopes: string[];

  protected async getAccessToken(): Promise<string> {
    const auth = new GoogleAuth({ scopes: this.scopes });
    const authClient = await auth.getClient();
    const { token } = await authClient.getAccessToken();
    if (!token) {
      throw new Error('failed to get access token');
    }
    return token;
  }
}
