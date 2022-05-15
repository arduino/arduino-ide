import { injectable } from 'inversify';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import {
  AuthenticationService,
  AuthenticationServiceClient,
  AuthenticationSession,
} from '../../common/protocol/authentication-service';
import { ArduinoAuthenticationProvider } from './arduino-auth-provider';
import { AuthOptions } from './types';

@injectable()
export class AuthenticationServiceImpl
  implements AuthenticationService, BackendApplicationContribution
{
  protected readonly delegate = new ArduinoAuthenticationProvider();
  protected readonly clients: AuthenticationServiceClient[] = [];
  protected readonly toDispose = new DisposableCollection();

  async onStart(): Promise<void> {
    this.toDispose.pushAll([
      this.delegate,
      this.delegate.onDidChangeSessions(({ added, removed, changed }) => {
        added?.forEach((session) =>
          this.clients.forEach((client) =>
            client.notifySessionDidChange(session)
          )
        );
        changed?.forEach((session) =>
          this.clients.forEach((client) =>
            client.notifySessionDidChange(session)
          )
        );
        removed?.forEach(() =>
          this.clients.forEach((client) => client.notifySessionDidChange())
        );
      }),
      Disposable.create(() =>
        this.clients.forEach((client) => this.disposeClient(client))
      ),
    ]);
    // await this.delegate.init();
  }

  setOptions(authOptions: AuthOptions) {
    this.delegate.setOptions(authOptions);
  }

  async login(): Promise<AuthenticationSession> {
    return this.delegate.createSession();
  }

  async logout(): Promise<void> {
    this.delegate.logout();
  }

  async session(): Promise<AuthenticationSession | undefined> {
    const sessions = await this.delegate.getSessions();
    return sessions[0];
  }

  dispose(): void {
    this.toDispose.dispose();
  }

  setClient(client: AuthenticationServiceClient | undefined): void {
    if (client) {
      this.clients.push(client);
    }
  }

  disposeClient(client: AuthenticationServiceClient) {
    const index = this.clients.indexOf(client);
    if (index === -1) {
      console.warn(
        'Could not dispose authentications service client. It was not registered. Skipping.'
      );
      return;
    }
    this.clients.splice(index, 1);
  }
}
