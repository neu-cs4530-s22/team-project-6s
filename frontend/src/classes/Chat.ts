import { nanoid } from 'nanoid';

export const CHAT_RADIUS = 80;

export default class Chat {
    public location: ChatLocation;
  
    public readonly _id: string;
  
    public occupantsByID: string[]
  
    constructor(id: string, occupantsByID: string[], location: ChatLocation) {
        this._id = id;
        this.occupantsByID = occupantsByID;
        this.location = location;
    }
  
    static fromServerChat(chatFromServer: ServerChat): Chat {
      return new Chat(chatFromServer._id, chatFromServer._occupantsByID, chatFromServer.location);
    }
  }
  export type ServerChat = { _id: string, _occupantsByID: string[], location: ChatLocation };
  
  export type ChatLocation = {
    x: number;
    y: number;
    radius: number;
  };
  