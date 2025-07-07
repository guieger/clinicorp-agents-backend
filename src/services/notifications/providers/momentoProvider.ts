import { NotificationProvider } from "./notificationProvider";
import { NotificationPayload } from "../types";
import { MomentoPayload } from "../types/momentoPayload";
import {
  TopicClient,
  TopicPublishResponse,
  TopicConfigurations,
  CredentialProvider
} from "@gomomento/sdk";

export class MomentoProvider implements NotificationProvider<MomentoPayload> {
  private momentoTopic: TopicClient;
  private channel = "agent_connected_users";

  constructor() {
    this.momentoTopic = new TopicClient({
      configuration: TopicConfigurations.Default.latest(),
      credentialProvider: CredentialProvider.fromEnvironmentVariable(
        "CLINICORP_SOLUTION_MOMENTO_API_KEY_PUB"
      )
    });
  }

  private getByteSize(obj: any): number {
    const str = JSON.stringify(obj);
    const encoder = new TextEncoder();
    return encoder.encode(str).length;
  }

  async send(payload: NotificationPayload) {
    const messagePayload = {
      evt: payload.evt,
      key: payload.key,
      ...(payload.obj && { obj: payload.obj }),
      ...(payload.signal && { signal: payload.signal }),
    };

    const sizeInBytes = this.getByteSize(messagePayload);

    if (sizeInBytes > 64 * 1024) {
      throw new Error("🚨 Mensagem excede o limite de 64KB.");
    }

    const response = await this.momentoTopic.publish(
      process.env.MOMENTO_TOPIC!,
      this.channel,
      JSON.stringify(messagePayload)
    );

    if (response.type === TopicPublishResponse.Success) {
      console.log("✅ Mensagem publicada via Momento.");
      return response;
    } else {
      throw new Error("❌ Erro ao publicar no tópico Momento.");
    }
  }
}
