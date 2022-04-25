import { nanoid } from 'nanoid';
import { ServerConversationArea } from '../client/TownsServiceClient';
import { UserLocation, ChatLocation } from '../CoveyTypes';

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
  private _activeChatID?: string;

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

  get activeChatID(): string | undefined {
    return this._activeChatID;
  }

  set activeChatID(chat: string | undefined) {
    this._activeChatID = chat;
  }

  /**
   * Checks to see if a player's location is within the specified conversation area
   * 
   * This method is resilient to floating point errors that could arise if any of the coordinates of
   * `this.location` are dramatically smaller than those of the conversation area's bounding box.
   * @param conversation the given conversation area
   * @returns true if the player is in the conversation area, or false if not
   */
  isWithin(conversation: ServerConversationArea): boolean {
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
  isAround(anchorPlayer: Player): boolean {
    const x = this.location.x - anchorPlayer.location.x;
    const y = this.location.y - anchorPlayer.location.y;
    return (
      Math.sqrt(x ** 2 + y ** 2) < 80
    );
  }

  /**
   * Checks to see if a player's location is within the specified chat
   * 
   * This method is resilient to floating point errors that could arise if any of the coordinates of
   * `this.location` are dramatically smaller than those of the conversation area's bounding box.
   * @param chatLocation the location of the chat which we are checking against the player's location
   * @returns true if the player is within the chat, and false if not
   */
  isWithinChat(chatLocation: ChatLocation): boolean {
    return (
      this.location.x > chatLocation.x - chatLocation.radius &&
      this.location.x < chatLocation.x + chatLocation.radius &&
      this.location.y > chatLocation.y - chatLocation.radius &&
      this.location.y < chatLocation.y + chatLocation.radius
    );
  }

}
