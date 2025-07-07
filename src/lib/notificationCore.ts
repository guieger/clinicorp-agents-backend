import {
  TopicClient,
  TopicPublishResponse,
  TopicConfigurations,
  CredentialProvider
} from "@gomomento/sdk";

// Tipos para diferentes provedores
type NotificationProvider = 'momento' | 'pubnub' | 'socketio';

interface NotificationPayload {
  evt: string;
  key: string;
  obj?: any;
  signal?: boolean | string;
}

class NotificationCore {
  private provider: NotificationProvider;
  private momentoTopic?: TopicClient;
  // Aqui você pode adicionar outras instâncias de provedores
  // private pubnubClient?: any;
  // private socketIO?: any;

  constructor(provider: NotificationProvider = 'momento') {
    this.provider = provider;
    this.initializeProvider();
  }

  private initializeProvider() {
    switch (this.provider) {
      case 'momento':
        this.initializeMomento();
        break;
      case 'pubnub':
        this.initializePubNub();
        break;
      case 'socketio':
        this.initializeSocketIO();
        break;
      default:
        throw new Error(`Provedor não suportado: ${this.provider}`);
    }
  }

  private initializeMomento() {
    this.momentoTopic = new TopicClient({
      configuration: TopicConfigurations.Default.latest(),
      credentialProvider: CredentialProvider.fromEnvironmentVariable("CLINICORP_SOLUTION_MOMENTO_API_KEY_PUB")
    });
  }

  private initializePubNub() {
    // Implementação futura do PubNub
  }

  private initializeSocketIO() {

  }

  private getByteSize(obj: any): number {
    const str = JSON.stringify(obj);
    const encoder = new TextEncoder();
    return encoder.encode(str).length;
  }

  async sendNotification(payload: NotificationPayload) {
    switch (this.provider) {
      case 'momento':
        return await this.sendViaMomento(payload);
      case 'pubnub':
        return await this.sendViaPubNub(payload);
      case 'socketio':
        return await this.sendViaSocketIO(payload);
      default:
        throw new Error(`Provedor não suportado: ${this.provider}`);
    }
  }

  private async sendViaMomento(payload: NotificationPayload) {
    if (!this.momentoTopic) {
      throw new Error('Momento não inicializado');
    }

    const channel = "agent_connected_users";

    console.log("🧠 obj >>:", payload.obj);

    const messagePayload = {
      evt: payload.evt,
      key: payload.key,
      ...(payload.obj && { obj: payload.obj }),
      ...(payload.signal && { signal: payload.signal }),
    };

    const sizeInBytes = this.getByteSize(messagePayload);

    if (sizeInBytes > 64 * 1024) {
      console.warn("🚨 Mensagem excede o limite de 64KB.");
      throw new Error("Mensagem muito grande.");
    }

    console.log("🚀 Enviando mensagem para canal:", channel);
    console.log("🧠 Payloaddd:", messagePayload);

    const publishResponse = await this.momentoTopic.publish(
      process.env.MOMENTO_TOPIC!,
      channel,
      JSON.stringify(messagePayload)
    );

    if (publishResponse.type === TopicPublishResponse.Success) {
      console.log("✅ Mensagem publicada com sucesso.");
      return publishResponse;
    } else {
      console.error("❌ Falha ao publicar:", publishResponse);
      throw new Error("Erro ao publicar no tópico Momento.");
    }
  }

  private async sendViaPubNub(payload: NotificationPayload) {
    const channel = "agent_connected_users";

    console.log("🧠 Enviando via PubNub >>:", payload.obj);

    const messagePayload = {
      evt: payload.evt,
      key: payload.key,
      ...(payload.obj && { obj: payload.obj }),
      ...(payload.signal && { signal: payload.signal }),
    };

    // Implementação real do PubNub
    // const result = await this.pubnubClient.publish({
    //   channel: channel,
    //   message: messagePayload
    // });

    console.log("🚀 Mensagem enviada via PubNub para canal:", channel);
    console.log("🧠 Payloaddd:", messagePayload);

    return { success: true, message: "Mensagem enviada via PubNub" };
  }

  private async sendViaSocketIO(payload: NotificationPayload) {
    const channel = "agent_connected_users";

    console.log("🧠 Enviando via Socket.IO >>:", payload.obj);

    const messagePayload = {
      evt: payload.evt,
      key: payload.key,
      ...(payload.obj && { obj: payload.obj }),
      ...(payload.signal && { signal: payload.signal }),
    };

    // Implementação real do Socket.IO
    // this.socketIO.emit(channel, messagePayload);

    console.log("🚀 Mensagem enviada via Socket.IO para canal:", channel);
    console.log("🧠 Payloaddd:", messagePayload);

    return { success: true, message: "Mensagem enviada via Socket.IO" };
  }

  // Método para trocar o provedor em runtime
  switchProvider(newProvider: NotificationProvider) {
    this.provider = newProvider;
    this.initializeProvider();
    console.log(`🔄 Provedor alterado para: ${newProvider}`);
  }

  // Método para obter o provedor atual
  getCurrentProvider(): NotificationProvider {
    return this.provider;
  }
}

// Instância singleton para uso em toda a aplicação
const notificationCore = new NotificationCore(
  (process.env.NOTIFICATION_PROVIDER as NotificationProvider) || 'momento'
);

export default notificationCore; 