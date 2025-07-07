export interface NotificationProvider<T = any> {
  send(payload: T): Promise<any>;
}
