import { nanoid } from 'nanoid';
import { ChatLocation, ChatMessage } from '../CoveyTypes';
import Player from './Player';

export const CHAT_RADIUS = 80;

/**
 * Each chat that connected to a town is represented by a Chat object
 */
 export default class Chat {
    /**  * */
    public location: ChatLocation;
  
    /** The unique identifier for this chat * */
    public readonly _id: string;

    public occupantsByID: string[];

    public chatMessages: ChatMessage[];
  
    constructor(anchorPlayer: Player) {
      this.location = {
        x: anchorPlayer.location.x,
        y: anchorPlayer.location.y,
        radius: CHAT_RADIUS,
      };
      this._id = nanoid();
      this.occupantsByID = [anchorPlayer.id];
      anchorPlayer.activeChatID = this._id;
      this.chatMessages = [];
    }

    /**
     * Appends a new message to this chat's stored lists of messages 
     * 
     * @param message new message 
     */
    addChatMessage(message: ChatMessage): void {
      this.chatMessages.push(message);
    }





 }