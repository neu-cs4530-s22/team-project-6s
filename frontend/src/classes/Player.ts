export default class Player {
  
  public location: UserLocation;

  private readonly _id: string;

  private readonly _userName: string;

  public _activeChatID?: string;

  public sprite?: Phaser.GameObjects.Sprite;

  public label?: Phaser.GameObjects.Text;

  constructor(id: string, userName: string, location: UserLocation, activeChatID: string) {
    this._id = id;
    this._userName = userName;
    this.location = location;
    this._activeChatID = activeChatID;
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  static fromServerPlayer(playerFromServer: ServerPlayer): Player {
    return new Player(playerFromServer._id, playerFromServer._userName, playerFromServer.location, playerFromServer._activeChatID);
  }
}

export type ServerPlayer = { _id: string, _userName: string, location: UserLocation, _activeChatID: string };

export type Direction = 'front'|'back'|'left'|'right';

export type UserLocation = {
  x: number,
  y: number,
  rotation: Direction,
  moving: boolean,
  conversationLabel?: string
};
