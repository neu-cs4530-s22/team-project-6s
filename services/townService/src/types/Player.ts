import { nanoid } from 'nanoid';
import { ServerConversationArea } from '../client/TownsServiceClient';
import { UserLocation } from '../CoveyTypes';
import Chat, { CHAT_RADIUS } from './Chat';

/**
 * Each user who is connected to a town is represented by a Player object
 */
export default class Player {
  /** The current location of this user in the world map * */
  public location: UserLocation;

  /** The unique identifier for this player * */
  private readonly _id: string;

  /** The player's username, which is not guaranteed to be unique within the town * */
  private readonly _userName: string;

  /** The current ConversationArea that the player is in, or undefined if they are not located within one */
  private _activeConversationArea?: ServerConversationArea;

  /** The current Chat that the player is in, or undefined if they are not located within one */
  private _activeChat?: Chat;

  constructor(userName: string) {
    this.location = {
      x: 0,
      y: 0,
      moving: false,
      rotation: 'front',
    };
    this._userName = userName;
    this._id = nanoid();
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  get activeConversationArea(): ServerConversationArea | undefined {
    return this._activeConversationArea;
  }

  set activeConversationArea(conversationArea: ServerConversationArea | undefined) {
    this._activeConversationArea = conversationArea;
  }

  get activeChat(): Chat | undefined {
    return this._activeChat;
  }

  set activeChat(chat: Chat | undefined) {
    this._activeChat = chat;
  }

  /**
   * Checks to see if a player's location is within the specified conversation area
   * 
   * This method is resilient to floating point errors that could arise if any of the coordinates of
   * `this.location` are dramatically smaller than those of the conversation area's bounding box.
   * @param conversation 
   * @returns 
   */
  isWithin(conversation: ServerConversationArea) : boolean {
    return (
      this.location.x > conversation.boundingBox.x - conversation.boundingBox.width / 2 &&
      this.location.x < conversation.boundingBox.x + conversation.boundingBox.width / 2 &&
      this.location.y > conversation.boundingBox.y - conversation.boundingBox.height / 2 &&
      this.location.y < conversation.boundingBox.y + conversation.boundingBox.height / 2
    );
  }

  /**
   * Checks to see if a player's location is close to another player's
   * 
   * @param otherPlayer 
   * @returns true if close enough to another player to create a chat, false if not
   */
   isAround(anchorPlayer: Player) : boolean {
    const x = this.location.x - anchorPlayer.location.x
    const y = this.location.y - anchorPlayer.location.y
    return (
      Math.sqrt(x**2 - y**2) < CHAT_RADIUS
    );
  }

  /**
   * Checks to see if a player's location is within the specified chat
   * 
   * This method is resilient to floating point errors that could arise if any of the coordinates of
   * `this.location` are dramatically smaller than those of the conversation area's bounding box.
   * @param conversation 
   * @returns 
   */
   isWithinChat(chat: Chat) : boolean {
    return (
      this.location.x > chat.location.x - chat.location.radius  &&
      this.location.x < chat.location.x + chat.location.radius &&
      this.location.y > chat.location.y - chat.location.radius &&
      this.location.y < chat.location.y + chat.location.radius
    );
  }

}
