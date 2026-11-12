import type { CloudStatus, PatronGateway, PatronLoginResult } from '../ports';
import { Store } from '../store';

export interface PatronState {
  /** 'checking' while the server verifies a stored session. */
  status: 'checking' | 'signed-in' | 'signed-out';
  cloudStatus: CloudStatus;
}

/** Admin (patron) session, always confirmed by the server. */
export class PatronStore extends Store<PatronState> {
  constructor(
    private readonly gateway: PatronGateway,
    /** Called once the admin can write to the database (e.g. seeds an empty catalog) */
    private readonly onCloudConnected: () => Promise<void> = async () => {}
  ) {
    super({ status: gateway.hasStoredSession() ? 'checking' : 'signed-out', cloudStatus: 'local-only' });
  }

  /** Verifies a session stored by a previous visit. */
  async restoreSession(): Promise<void> {
    if (!this.gateway.hasStoredSession()) {
      this.setState({ status: 'signed-out' });
      return;
    }
    const valid = await this.gateway.verifySession();
    this.setState({ status: valid ? 'signed-in' : 'signed-out' });
    if (valid) this.signedIn(await this.gateway.connectCloud());
  }

  /** Checks the credentials with the server; signs in on success. */
  async login(username: string, password: string): Promise<PatronLoginResult> {
    const result = await this.gateway.login(username, password);
    if (result.ok) this.signedIn(result.cloud);
    return result;
  }

  /** The login succeeded (credentials checked by the server). */
  signedIn(cloudStatus: CloudStatus): void {
    this.setState({ status: 'signed-in', cloudStatus });
    if (cloudStatus === 'connected') this.onCloudConnected().catch(() => {});
  }

  async logout(): Promise<void> {
    this.setState({ status: 'signed-out', cloudStatus: 'local-only' });
    await this.gateway.logout().catch(() => {});
  }
}
