import { nanoid } from 'nanoid';

export const CHAT_RADIUS = 80;

export type ChatListener = {
  onChatChange?: (newChat: Chat | undefined) => void;
  onMessagesChange?: (newMessages: ChatMessage[]) => void;
};

export default class Chat {
    public location: ChatLocation;
  
    public readonly _id: string;
  
    public occupantsByID: string[];

    public messages: ChatMessage[];

    private _listeners: ChatListener[] = [];
  
    constructor(id: string, occupantsByID: string[], location: ChatLocation, messages: ChatMessage[]) {
        this._id = id;
        this.occupantsByID = occupantsByID;
        this.location = location;
        this.messages = messages;
    }

    static fromServerChat(chatFromServer: ServerChat): Chat {
      return new Chat(chatFromServer._id, chatFromServer._occupantsByID, chatFromServer.location, chatFromServer.messages);
    }

    addListener(listener: ChatListener) {
      this._listeners.push(listener);
    }
  
    removeListener(listener: ChatListener) {
      this._listeners = this._listeners.filter(eachListener => eachListener !== listener);
    }
  }
  export type ServerChat = { _id: string, _occupantsByID: string[], location: ChatLocation, messages: ChatMessage[] };
  
  export type ChatLocation = {
    x: number;
    y: number;
    radius: number;
  };
 
  export type ChatMessage = {
    author: string;
    sid: string;
    body: string;
    dateCreated: Date;
    privateMessage: boolean;
    privateMessageRecipientId: string|undefined;
  };
  