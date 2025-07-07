import { NotificationProvider } from "../providers/notificationProvider";
import { MomentoProvider } from "../providers/momentoProvider";

import { NotificationPayload } from "../types";

type Providers = 'momento';

export class NotificationCore {
  private provider: NotificationProvider;

  constructor(providerName: Providers) {
    this.provider = this.resolveProvider(providerName);
  }

  private resolveProvider(providerName: Providers): NotificationProvider {
    switch (providerName) {
      case 'momento':
        return new MomentoProvider();
      default:
        throw new Error(`Provedor não suportado: ${providerName}`);
    }
  }

  async sendNotification(payload: NotificationPayload) {
    return await this.provider.send(payload);
  }

  switchProvider(providerName: Providers) {
    this.provider = this.resolveProvider(providerName);
    console.log(`🔄 Provedor alterado para: ${providerName}`);
  }
}
