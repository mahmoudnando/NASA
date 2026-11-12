import * as signalR from '@microsoft/signalr';
import { HealthAlert } from '../types/telemetry';

type AlertCallback = (alert: HealthAlert) => void;
type ChatCallback = (msg: any) => void;

/**
 * Real-time hubs bound to ONE authenticated session.
 * `connect()` always tears down any previous connection first, so the server
 * re-evaluates the new token and places the socket in the correct groups
 * (`monitors` or `astronaut-{id}`). `disconnect()` must be called on logout.
 */
class SignalRService {
  private alertsHub: signalR.HubConnection | null = null;
  private chatHub: signalR.HubConnection | null = null;
  private alertListeners: AlertCallback[] = [];
  private chatListeners: ChatCallback[] = [];
  private readListeners: ChatCallback[] = [];

  private build(url: string, getToken: () => string) {
    return new signalR.HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: getToken,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }

  public async connect(tokenOrGetter?: string | (() => string)) {
    await this.disconnect();

    const getToken = () => {
      if (typeof tokenOrGetter === 'function') {
        return tokenOrGetter() || '';
      }
      if (typeof tokenOrGetter === 'string' && tokenOrGetter) {
        return tokenOrGetter;
      }
      return localStorage.getItem('nasa_access_token') || '';
    };

    this.alertsHub = this.build('/hubs/alerts', getToken);
    const notifyAlert = (alert: HealthAlert) => this.alertListeners.forEach((cb) => cb(alert));
    this.alertsHub.on('AlertCreated', notifyAlert);
    this.alertsHub.on('AlertAcknowledged', notifyAlert);
    this.alertsHub.on('AlertResolved', notifyAlert);

    this.chatHub = this.build('/hubs/chat', getToken);
    this.chatHub.on('ReceiveMessage', (msg) => this.chatListeners.forEach((cb) => cb(msg)));
    this.chatHub.on('MessageRead', (msg) => this.readListeners.forEach((cb) => cb(msg)));

    await Promise.all([
      this.alertsHub.start().catch(() => undefined),
      this.chatHub.start().catch(() => undefined),
    ]);
  }

  public async initConnection(tokenOrGetter?: string | (() => string)) {
    return this.connect(tokenOrGetter);
  }

  public async disconnect() {
    const hubs = [this.alertsHub, this.chatHub];
    this.alertsHub = null;
    this.chatHub = null;
    await Promise.all(hubs.map((h) => h?.stop().catch(() => undefined)));
  }

  public onAlertReceived(callback: AlertCallback) {
    this.alertListeners.push(callback);
    return () => {
      this.alertListeners = this.alertListeners.filter((cb) => cb !== callback);
    };
  }

  public onChatReceived(callback: ChatCallback) {
    this.chatListeners.push(callback);
    return () => {
      this.chatListeners = this.chatListeners.filter((cb) => cb !== callback);
    };
  }

  public onChatRead(callback: ChatCallback) {
    this.readListeners.push(callback);
    return () => {
      this.readListeners = this.readListeners.filter((cb) => cb !== callback);
    };
  }

  public isConnected(): boolean {
    return this.chatHub?.state === signalR.HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();
