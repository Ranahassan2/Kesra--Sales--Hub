declare module "whatsapp-web.js" {
  import { EventEmitter } from "events";

  export interface ClientId {
    _serialized: string;
    server: string;
    user: string;
  }

  export interface Message {
    id: { _serialized: string };
    body: string;
    fromMe: boolean;
    from: string;
    to: string;
    timestamp: number;
    type: string;
    author?: string;
    hasMedia: boolean;
    getChat(): Promise<Chat>;
    reply(content: string): Promise<Message>;
  }

  export interface Chat {
    id: { _serialized: string };
    name: string;
    isGroup: boolean;
    isReadOnly: boolean;
    unreadCount: number;
    timestamp: number;
    lastMessage?: Message;
    fetchMessages(options: { limit: number }): Promise<Message[]>;
    sendMessage(content: string): Promise<Message>;
    sendSeen(): Promise<void>;
  }

  export interface Contact {
    id: { _serialized: string };
    name: string;
    pushname: string;
    number: string;
    isMe: boolean;
    isUser: boolean;
    isGroup: boolean;
    isWAContact: boolean;
    isMyContact: boolean;
  }

  export interface ClientInfo {
    wid: { _serialized: string };
    pushname: string;
    platform: string;
  }

  export interface LocalAuthOptions {
    clientId?: string;
    dataPath?: string;
  }

  export class LocalAuth {
    constructor(options?: LocalAuthOptions);
  }

  export interface ClientOptions {
    authStrategy?: LocalAuth;
    puppeteer?: Record<string, unknown>;
    webVersionCache?: Record<string, unknown>;
    restartOnAuthFail?: boolean;
  }

  export class Client extends EventEmitter {
    constructor(options?: ClientOptions);
    info: ClientInfo;

    initialize(): Promise<void>;
    destroy(): Promise<void>;
    logout(): Promise<void>;

    getChats(): Promise<Chat[]>;
    getChatById(chatId: string): Promise<Chat>;
    getContacts(): Promise<Contact[]>;
    getContactById(contactId: string): Promise<Contact>;

    sendMessage(chatId: string, content: string): Promise<Message>;

    on(event: "qr", listener: (qr: string) => void): this;
    on(event: "ready", listener: () => void): this;
    on(event: "authenticated", listener: () => void): this;
    on(event: "auth_failure", listener: (message: string) => void): this;
    on(event: "disconnected", listener: (reason: string) => void): this;
    on(event: "message", listener: (message: Message) => void): this;
    on(event: "message_create", listener: (message: Message) => void): this;
    on(event: "message_revoke_everyone", listener: (after: Message, before: Message | null) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }
}
