import { customAlphabet, nanoid } from 'nanoid';
import { BoundingBox, ServerConversationArea } from '../client/TownsServiceClient';
import { ChatMessage, UserLocation } from '../CoveyTypes';
import Chat from '../types/Chat';
import CoveyTownListener from '../types/CoveyTownListener';
import Player from '../types/Player';
import PlayerSession from '../types/PlayerSession';
import IVideoClient from './IVideoClient';
import TwilioVideo from './TwilioVideo';

const friendlyNanoID = customAlphabet('1234567890ABCDEF', 8);

/**
 * The CoveyTownController implements the logic for each town: managing the various events that
 * can occur (e.g. joining a town, moving, leaving a town)
 */
export default class CoveyTownController {
  get capacity(): number {
    return this._capacity;
  }

  set isPubliclyListed(value: boolean) {
    this._isPubliclyListed = value;
  }

  get isPubliclyListed(): boolean {
    return this._isPubliclyListed;
  }

  get townUpdatePassword(): string {
    return this._townUpdatePassword;
  }

  get players(): Player[] {
    return this._players;
  }

  get occupancy(): number {
    return this._listeners.length;
  }

  get friendlyName(): string {
    return this._friendlyName;
  }

  set friendlyName(value: string) {
    this._friendlyName = value;
  }

  get coveyTownID(): string {
    return this._coveyTownID;
  }

  get conversationAreas(): ServerConversationArea[] {
    return this._conversationAreas;
  }

  get chats(): Chat[] {
    return this._chats;
  }

  /** The list of players currently in the town * */
  private _players: Player[] = [];

  /** The list of valid sessions for this town * */
  private _sessions: PlayerSession[] = [];

  /** The videoClient that this CoveyTown will use to provision video resources * */
  private _videoClient: IVideoClient = TwilioVideo.getInstance();

  /** The list of CoveyTownListeners that are subscribed to events in this town * */
  private _listeners: CoveyTownListener[] = [];

  /** The list of currently active ConversationAreas in this town */
  private _conversationAreas: ServerConversationArea[] = [];

  /** The list of currently active chats in this town */
  private _chats: Chat[] = [];

  private readonly _coveyTownID: string;

  private _friendlyName: string;

  private readonly _townUpdatePassword: string;

  private _isPubliclyListed: boolean;

  private _capacity: number;

  constructor(friendlyName: string, isPubliclyListed: boolean) {
    this._coveyTownID = process.env.DEMO_TOWN_ID === friendlyName ? friendlyName : friendlyNanoID();
    this._capacity = 50;
    this._townUpdatePassword = nanoid(24);
    this._isPubliclyListed = isPubliclyListed;
    this._friendlyName = friendlyName;
  }

  /**
   * Adds a player to this Covey Town, provisioning the necessary credentials for the
   * player, and returning them
   *
   * @param newPlayer The new player to add to the town
   */
  async addPlayer(newPlayer: Player): Promise<PlayerSession> {
    const theSession = new PlayerSession(newPlayer);

    this._sessions.push(theSession);
    this._players.push(newPlayer);

    // Create a video token for this user to join this town
    theSession.videoToken = await this._videoClient.getTokenForTown(
      this._coveyTownID,
      newPlayer.id,
    );

    // Notify other players that this player has joined
    this._listeners.forEach(listener => listener.onPlayerJoined(newPlayer));

    return theSession;
  }

  /**
   * Destroys all data related to a player in this town.
   *
   * @param session PlayerSession to destroy
   */
  destroySession(session: PlayerSession): void {
    this._players = this._players.filter(p => p.id !== session.player.id);
    this._sessions = this._sessions.filter(s => s.sessionToken !== session.sessionToken);
    this._listeners.forEach(listener => listener.onPlayerDisconnected(session.player));
    const conversation = session.player.activeConversationArea;
    if (conversation) {
      this.removePlayerFromConversationArea(session.player, conversation);
    }
  }

  /**
   * Updates the location of a player within the town
   * 
   * If the player has changed conversation areas, this method also updates the
   * corresponding ConversationArea objects tracked by the town controller, and dispatches
   * any onConversationUpdated events as appropriate
   * 
   * @param player Player to update location for
   * @param location New location for this player
   */
  updatePlayerLocation(player: Player, location: UserLocation): void {
    const conversation = this.conversationAreas.find(conv => conv.label === location.conversationLabel);
    const prevConversation = player.activeConversationArea;

    player.location = location;
    player.activeConversationArea = conversation;

    if (conversation !== prevConversation) {
      if (prevConversation) {
        this.removePlayerFromConversationArea(player, prevConversation);
      }
      if (conversation) {
        conversation.occupantsByID.push(player.id);
        this._listeners.forEach(listener => listener.onConversationAreaUpdated(conversation));
      }
    }

    // see if player is within chatting distance of another
    if (!player.activeConversationArea) {
      const activeChat = this.chats.find((c) => c._id === player.activeChatID);
      // check if player has moved outside of chat 
      if (activeChat && !player.isWithinChat(activeChat.location)) {
        this.removePlayerFromChat(player, activeChat);
      }
      // check if player's new location is within an existing chat & add them
      for (let i = 0; i < this.chats.length; i += 1) {
        if (player.isWithinChat(this.chats[i].location)) {
          if (activeChat !== this.chats[i]) {
            player.activeChatID = this.chats[i]._id;
            this.chats[i].occupantsByID.push(player.id);
            this._listeners.forEach(listener => listener.onPlayerActiveChatUpdated(player));
            this._listeners.forEach(listener => listener.onChatUpdated(this.chats[i]));
          }
          break;
        }
      }

      if (!player.activeChatID) {
        this.addChat(player);
      }
    }

    this._listeners.forEach(listener => listener.onPlayerMoved(player));
  }

  /**
   * Removes a player from a conversation area, updating the conversation area's occupants list, 
   * and emitting the appropriate message (area updated or area destroyed)
   * 
   * Does not update the player's activeConversationArea property.
   * 
   * @param player Player to remove from conversation area
   * @param conversation Conversation area to remove player from
   */
  removePlayerFromConversationArea(player: Player, conversation: ServerConversationArea): void {
    conversation.occupantsByID.splice(conversation.occupantsByID.findIndex(p => p === player.id), 1);
    if (conversation.occupantsByID.length === 0) {
      this._conversationAreas.splice(this._conversationAreas.findIndex(conv => conv === conversation), 1);
      this._listeners.forEach(listener => listener.onConversationAreaDestroyed(conversation));
    } else {
      this._listeners.forEach(listener => listener.onConversationAreaUpdated(conversation));
    }
  }


  /**
   * Removes a player from a chat, updating the chats's occupants list, 
   * 
   * Updates the player's activeChat property.
   * 
   * @param player Player to remove from chat
   * @param chat Chat to remove player from
   */
  removePlayerFromChat(player: Player, chat: Chat): void {
    chat.occupantsByID.splice(chat.occupantsByID.findIndex(p => p === player.id), 1);

    // destroy chat if there is only one player left in it
    if (chat.occupantsByID.length === 1) {
      this._chats.splice(this._chats.findIndex(ch => ch === chat), 1);
      this._players.forEach(p => { if (p.activeChatID === chat._id) { p.activeChatID = undefined; } });
      this._listeners.forEach(listener => listener.onChatDestroyed(chat));
    }
    player.activeChatID = undefined;
    this._listeners.forEach(listener => listener.onPlayerActiveChatUpdated(player));
  }

  /**
   * Creates a new conversation area in this town if there is not currently an active
   * conversation with the same label.
   *
   * Adds any players who are in the region defined by the conversation area to it.
   *
   * Notifies any CoveyTownListeners that the conversation has been updated
   *
   * @param _conversationArea Information describing the conversation area to create. Ignores any
   *  occupantsById that are set on the conversation area that is passed to this method.
   *
   * @returns true if the conversation is successfully created, or false if not
   */
  addConversationArea(_conversationArea: ServerConversationArea): boolean {
    if (this._conversationAreas.find(
      eachExistingConversation => eachExistingConversation.label === _conversationArea.label,
    ))
      return false;
    if (_conversationArea.topic === '') {
      return false;
    }
    if (this._conversationAreas.find(eachExistingConversation =>
      CoveyTownController.boxesOverlap(eachExistingConversation.boundingBox, _conversationArea.boundingBox)) !== undefined) {
      return false;
    }
    const newArea: ServerConversationArea = Object.assign(_conversationArea);
    this._conversationAreas.push(newArea);
    const playersInThisConversation = this.players.filter(player => player.isWithin(newArea));
    playersInThisConversation.forEach(player => { player.activeConversationArea = newArea; });
    newArea.occupantsByID = playersInThisConversation.map(player => player.id);
    this._listeners.forEach(listener => listener.onConversationAreaUpdated(newArea));
    return true;
  }

  /**
   * Creates a new chat conversation in this town if there are two or more players that are close to each other
   * 
   * Adds any players who are in the region defined by the chat conversation to it.
   * 
   * Notifies any CoveyTownListeners that a chat conversation has been created
   * @param _anchorPlayer Information describing the player that moved and could become an anchor player.
   * @returns true if the chat conversation is successfully created, or false if not
   */
  addChat(_anchorPlayer: Player): boolean {
    // make sure they're not already in a chat convo
    let playersAroundAnchorPlayer = this.players.filter(player => player.isAround(_anchorPlayer) && player !== _anchorPlayer);
    playersAroundAnchorPlayer = playersAroundAnchorPlayer.filter((player) => player.activeChatID === undefined);

    if (playersAroundAnchorPlayer.length === 0) {
      return false;
    }
    {
      const newChat: Chat = new Chat(_anchorPlayer);
      // if its active chat is not defined, set it to the new chat 
      playersAroundAnchorPlayer.forEach(player => { player.activeChatID = newChat._id; });
      playersAroundAnchorPlayer.forEach(player => this._listeners.forEach(listener => listener.onPlayerActiveChatUpdated(player)));
      playersAroundAnchorPlayer.map((player) => newChat.occupantsByID.push(player.id));
      this._chats.push(newChat);

      this._listeners.forEach(listener => listener.onPlayerActiveChatUpdated(_anchorPlayer));
      this._listeners.forEach(listener => listener.onChatUpdated(newChat));
    }
    
    return true;
  }

  /**
   * Takes input from the frontend and turns it into ChatMessage and adds it to corresponding chat
   * @param chatID the chat that recieved a new message
   * @param sendingPlayerID the player who sent the chat
   * @param body the content of the chat
   * @param dateCreated when the chat was sent
   * @param privateMessage if the chat was a private message
   * @param privateMessageRecipientId who the private message was sent to
   * @returns true if the chat message was successfully added to the chat's list of messages, or false if not
   */
  updateChatMessageListFromUserInput(chatID: string, sendingPlayerID: string, body: string | File, dateCreated: Date,
    privateMessage: boolean, privateMessageRecipientId: string | undefined): boolean {

    const chat = this._chats.find((c) => c._id === chatID);

    if (!chat) {
      return false;
    }
    const message = {
      author: sendingPlayerID,
      sid: chat._id,
      body,
      dateCreated,
      privateMessage,
      privateMessageRecipientId,
    };

    chat.addChatMessage(message);
    this._listeners.forEach(listener => listener.onChatMessage(message));
    this._listeners.forEach(listener => listener.onChatUpdated(chat));

    return true;
  }

  /**
   * Detects whether two bounding boxes overlap and share any points
   * 
   * @param box1 
   * @param box2 
   * @returns true if the boxes overlap, otherwise false
   */
  static boxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
    // Helper function to extract the top left (x1,y1) and bottom right corner (x2,y2) of each bounding box
    const toRectPoints = (box: BoundingBox) => ({ x1: box.x - box.width / 2, x2: box.x + box.width / 2, y1: box.y - box.height / 2, y2: box.y + box.height / 2 });
    const rect1 = toRectPoints(box1);
    const rect2 = toRectPoints(box2);
    const noOverlap = rect1.x1 >= rect2.x2 || rect2.x1 >= rect1.x2 || rect1.y1 >= rect2.y2 || rect2.y1 >= rect1.y2;
    return !noOverlap;
  }

  /**
   * Subscribe to events from this town. Callers should make sure to
   * unsubscribe when they no longer want those events by calling removeTownListener
   *
   * @param listener New listener
   */
  addTownListener(listener: CoveyTownListener): void {
    this._listeners.push(listener);
  }

  /**
   * Unsubscribe from events in this town.
   *
   * @param listener The listener to unsubscribe, must be a listener that was registered
   * with addTownListener, or otherwise will be a no-op
   */
  removeTownListener(listener: CoveyTownListener): void {
    this._listeners = this._listeners.filter(v => v !== listener);
  }

  /**
   * Sends an onChatMessage event to any listeners with the given message.
   *
   * @param message the message that was sent
   */
  onChatMessage(message: ChatMessage): void {
    this._listeners.forEach(listener => listener.onChatMessage(message));
  }

  /**
   * Fetch a player's session based on the provided session token. Returns undefined if the
   * session token is not valid.
   *
   * @param token
   */
  getSessionByToken(token: string): PlayerSession | undefined {
    return this._sessions.find(p => p.sessionToken === token);
  }

  disconnectAllPlayers(): void {
    this._listeners.forEach(listener => listener.onTownDestroyed());
  }

}
