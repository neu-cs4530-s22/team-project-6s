import { nanoid } from 'nanoid';
import { ChatLocation, ChatMessage } from '../CoveyTypes';
import Player from './Player';

export const CHAT_RADIUS = 80;

/**
 * Each chat that is connected to a town is represented by a Chat object. Represents a spatial chat
 * created when two players are close to each other.
 */
export default class Chat {
  /** The location of this chat on the map, including the chat radius * */
  public location: ChatLocation;
  
  /** The unique identifier for this chat * */
  public readonly _id: string;

  /** The players in this chat, identified by ID */
  public occupantsByID: string[];

  /** The chat messages that are currently stored in this chat */
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
     * @param message new message to be added to this chat
     */
  addChatMessage(message: ChatMessage): void {
    this.chatMessages.push(message);
  }
}