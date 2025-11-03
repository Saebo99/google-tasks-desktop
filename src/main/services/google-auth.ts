import { BrowserWindow } from 'electron';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { AddressInfo } from 'node:net';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { URL } from 'node:url';
import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import type { AuthState, AuthProfile } from '@common/types/google';

const SCOPES = [
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

interface StoredCredentials extends Credentials {
  scope?: string;
}

export class GoogleAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tokenPath: string;
  private credentials: StoredCredentials | null = null;
  private profile: AuthProfile | undefined;

  constructor(userDataPath: string) {
    this.clientId = process.env.GOOGLE_CLIENT_ID ?? '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
    this.tokenPath = join(userDataPath, 'google-oauth.json');
  }

  async initialize(): Promise<void> {
    await this.loadPersistedCredentials();
    if (this.credentials) {
      await this.refreshProfile().catch(() => {
        this.credentials = null;
        this.profile = undefined;
      });
    }
  }

  getAuthState(): AuthState {
    return {
      isAuthenticated: Boolean(this.credentials),
      profile: this.profile
    };
  }

  async signIn(): Promise<AuthState> {
    this.ensureClientConfig();

    const tokens = await this.performAuthFlow();
    this.credentials = tokens;
    await this.saveCredentials(tokens);
    await this.refreshProfile();

    return this.getAuthState();
  }

  async signOut(): Promise<void> {
    this.credentials = null;
    this.profile = undefined;
    await this.deleteCredentials();
  }

  getAuthenticatedClient() {
    if (!this.credentials) {
      throw new Error('Not signed in with Google yet.');
    }

    const client = new google.auth.OAuth2(this.clientId, this.clientSecret);
    client.setCredentials(this.credentials);

    client.on('tokens', (tokens) => {
      this.credentials = {
        ...this.credentials,
        ...tokens
      };
      void this.saveCredentials(this.credentials).catch((error) => {
        console.error('Failed to persist refreshed Google credentials:', error);
      });
    });

    return client;
  }

  private ensureClientConfig() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'Missing Google OAuth configuration. Populate GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file.'
      );
    }
  }

  private async performAuthFlow(): Promise<StoredCredentials> {
    const codeVerifier = randomBytes(32).toString('hex');

    const server = createServer();

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });

    const address = server.address() as AddressInfo;
    const redirectUri = `http://127.0.0.1:${address.port}/oauth2callback`;

    const oauth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret, redirectUri);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      code_challenge: codeVerifier,
      code_challenge_method: 'plain'
    });

    const authWindow = new BrowserWindow({
      width: 520,
      height: 720,
      resizable: true,
      title: 'Sign in with Google',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    });

    const codePromise = new Promise<string>((resolve, reject) => {
      const onClosed = () => {
        server.close();
        reject(new Error('Google sign-in was cancelled.'));
      };

      authWindow.on('closed', onClosed);

      server.on('request', (req, res) => {
        const requestUrl = req.url ? new URL(req.url, redirectUri) : null;

        if (requestUrl && requestUrl.pathname === '/oauth2callback') {
          const code = requestUrl.searchParams.get('code');
          const error = requestUrl.searchParams.get('error');

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(
            '<h2>Authentication complete.</h2><p>You can close this window and return to Google Tasks Desktop.</p>'
          );

          if (error) {
            server.close();
            reject(new Error(`Google sign-in failed: ${error}`));
          } else if (code) {
            resolve(code);
          } else {
            server.close();
            reject(new Error('Google sign-in failed. Missing authorization code.'));
          }

          authWindow.removeListener('closed', onClosed);
          setImmediate(() => {
            if (!authWindow.isDestroyed()) {
              authWindow.close();
            }
          });
        }
      });
    });

    await authWindow.loadURL(authUrl);
    authWindow.show();

    const authorizationCode = await codePromise;

    const { tokens } = await oauth2Client.getToken({
      code: authorizationCode,
      codeVerifier
    });

    server.close();
    if (!authWindow.isDestroyed()) {
      authWindow.close();
    }

    if (!tokens.refresh_token) {
      throw new Error(
        'Google did not return a refresh token. Ensure that the OAuth consent screen is configured for desktop access.'
      );
    }

    return tokens;
  }

  private async refreshProfile(): Promise<void> {
    const client = this.getAuthenticatedClient();
    const oauth2 = google.oauth2({
      version: 'v2',
      auth: client
    });

    const response = await oauth2.userinfo.get();
    if (response.data.email) {
      this.profile = {
        email: response.data.email,
        name: response.data.name ?? response.data.email,
        picture: response.data.picture ?? undefined
      };
    }
  }

  private async loadPersistedCredentials() {
    try {
      const file = await fs.readFile(this.tokenPath, 'utf-8');
      this.credentials = JSON.parse(file) as StoredCredentials;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async saveCredentials(tokens: StoredCredentials) {
    await fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2), 'utf-8');
  }

  private async deleteCredentials() {
    try {
      await fs.unlink(this.tokenPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
