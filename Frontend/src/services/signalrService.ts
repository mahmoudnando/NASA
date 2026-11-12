import * as signalR from '@microsoft/signalr';
import { HealthAlert, ChatMessage } from '../types/telemetry';

type AlertCallback = (alert: HealthAlert) => void;
type ChatCallback = (msg: any) => void;

class SignalRService {
  private alertsHub: signalR.HubConnection | null = null;
  private chatHub: signalR.HubConnection | null = null;
  private alertListeners: AlertCallback[] = [];
  private chatListeners: ChatCallback[] = [];

  public async initConnection(token?: string) {
    const getToken = () => token || localStorage.getItem('nasa_access_token') || '';

    if (!this.alertsHub) {
      this.alertsHub = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/alerts', {
          accessTokenFactory: getToken,
          skipNegotiation: false,
          transport:
            signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      const notifyAlert = (alert: HealthAlert) => {
        this.alertListeners.forEach((cb) => cb(alert));
      };

      this.alertsHub.on('AlertCreated', notifyAlert);
      this.alertsHub.on('AlertAcknowledged', notifyAlert);
      this.alertsHub.on('AlertResolved', notifyAlert);
    }

    if (!this.chatHub) {
      this.chatHub = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/chat', {
          accessTokenFactory: getToken,
          skipNegotiation: false,
          transport:
            signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      const notifyChat = (msg: ChatMessage) => {
        this.chatListeners.forEach((cb) => cb(msg));
      };

      this.chatHub.on('ReceiveMessage', notifyChat);
      this.chatHub.on('MessageRead', notifyChat);
    }

    try {
      if (this.alertsHub.state === signalR.HubConnectionState.Disconnected) {
        await this.alertsHub.start();
      }
    } catch {
      // Offline fallback
    }

    try {
      if (this.chatHub.state === signalR.HubConnectionState.Disconnected) {
        await this.chatHub.start();
      }
    } catch {
      // Offline fallback
    }
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

  public isConnected(): boolean {
    return this.alertsHub?.state === signalR.HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();
