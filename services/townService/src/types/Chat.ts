import { nanoid } from 'nanoid';
import { ChatLocation } from '../CoveyTypes';
import Player from './Player';

/**
 * Each chat that connected to a town is represented by a Chat object
 */
 export default class Chat {
    /**  * */
    public location: ChatLocation;
  
    /** The unique identifier for this chat * */
    private readonly _id: string;
  
    constructor(anchorPlayer: Player) {
      this.location = {
        x: anchorPlayer.location.x,
        y: anchorPlayer.location.y,
        radius: 5
      };
      this._id = nanoid();
    }


    
 }