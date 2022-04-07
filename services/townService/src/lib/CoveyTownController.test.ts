import { nanoid } from 'nanoid';
import { mock, mockDeep, mockReset } from 'jest-mock-extended';
import { Socket } from 'socket.io';
import TwilioVideo from './TwilioVideo';
import Player from '../types/Player';
import CoveyTownController from './CoveyTownController';
import CoveyTownListener from '../types/CoveyTownListener';
import { UserLocation } from '../CoveyTypes';
import PlayerSession from '../types/PlayerSession';
import { townSubscriptionHandler } from '../requestHandlers/CoveyTownRequestHandlers';
import CoveyTownsStore from './CoveyTownsStore';
import * as TestUtils from '../client/TestUtils';
import Chat, { CHAT_RADIUS } from '../types/Chat';

const mockTwilioVideo = mockDeep<TwilioVideo>();
jest.spyOn(TwilioVideo, 'getInstance').mockReturnValue(mockTwilioVideo);

function generateTestLocation(): UserLocation {
  return {
    rotation: 'back',
    moving: Math.random() < 0.5,
    x: Math.floor(Math.random() * 100),
    y: Math.floor(Math.random() * 100),
  };
}

describe('CoveyTownController', () => {
  beforeEach(() => {
    mockTwilioVideo.getTokenForTown.mockClear();
  });
  it('constructor should set the friendlyName property', () => { 
    const townName = `FriendlyNameTest-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    expect(townController.friendlyName)
      .toBe(townName);
  });
  describe('addPlayer', () => { 
    it('should use the coveyTownID and player ID properties when requesting a video token',
      async () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const newPlayerSession = await townController.addPlayer(new Player(nanoid()));
        expect(mockTwilioVideo.getTokenForTown).toBeCalledTimes(1);
        expect(mockTwilioVideo.getTokenForTown).toBeCalledWith(townController.coveyTownID, newPlayerSession.player.id);
      });
  });
  describe('town listeners and events', () => {
    let testingTown: CoveyTownController;
    const mockListeners = [mock<CoveyTownListener>(),
      mock<CoveyTownListener>(),
      mock<CoveyTownListener>()];
    beforeEach(() => {
      const townName = `town listeners and events tests ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
      mockListeners.forEach(mockReset);
    });
    it('should notify added listeners of player movement when updatePlayerLocation is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const newLocation = generateTestLocation();
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.updatePlayerLocation(player, newLocation);
      mockListeners.forEach(listener => expect(listener.onPlayerMoved).toBeCalledWith(player));
    });
    it('should notify added listeners of player disconnections when destroySession is called', async () => {
      const player = new Player('test player');
      const session = await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.destroySession(session);
      mockListeners.forEach(listener => expect(listener.onPlayerDisconnected).toBeCalledWith(player));
    });
    it('should notify added listeners of new players when addPlayer is called', async () => {
      mockListeners.forEach(listener => testingTown.addTownListener(listener));

      const player = new Player('test player');
      await testingTown.addPlayer(player);
      mockListeners.forEach(listener => expect(listener.onPlayerJoined).toBeCalledWith(player));

    });
    it('should notify added listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.disconnectAllPlayers();
      mockListeners.forEach(listener => expect(listener.onTownDestroyed).toBeCalled());

    });
    it('should not notify removed listeners of player movement when updatePlayerLocation is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const newLocation = generateTestLocation();
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.updatePlayerLocation(player, newLocation);
      expect(listenerRemoved.onPlayerMoved).not.toBeCalled();
    });
    it('should not notify removed listeners of player disconnections when destroySession is called', async () => {
      const player = new Player('test player');
      const session = await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.destroySession(session);
      expect(listenerRemoved.onPlayerDisconnected).not.toBeCalled();

    });
    it('should not notify removed listeners of new players when addPlayer is called', async () => {
      const player = new Player('test player');

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      const session = await testingTown.addPlayer(player);
      testingTown.destroySession(session);
      expect(listenerRemoved.onPlayerJoined).not.toBeCalled();
    });

    it('should not notify removed listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.disconnectAllPlayers();
      expect(listenerRemoved.onTownDestroyed).not.toBeCalled();

    });
  });
  describe('townSubscriptionHandler', () => {
    const mockSocket = mock<Socket>();
    let testingTown: CoveyTownController;
    let player: Player;
    let session: PlayerSession;
    beforeEach(async () => {
      const townName = `connectPlayerSocket tests ${nanoid()}`;
      testingTown = CoveyTownsStore.getInstance().createTown(townName, false);
      mockReset(mockSocket);
      player = new Player('test player');
      session = await testingTown.addPlayer(player);
    });
    it('should reject connections with invalid town IDs by calling disconnect', async () => {
      TestUtils.setSessionTokenAndTownID(nanoid(), session.sessionToken, mockSocket);
      townSubscriptionHandler(mockSocket);
      expect(mockSocket.disconnect).toBeCalledWith(true);
    });
    it('should reject connections with invalid session tokens by calling disconnect', async () => {
      TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, nanoid(), mockSocket);
      townSubscriptionHandler(mockSocket);
      expect(mockSocket.disconnect).toBeCalledWith(true);
    });
    describe('with a valid session token', () => {
      it('should add a town listener, which should emit "newPlayer" to the socket when a player joins', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        await testingTown.addPlayer(player);
        expect(mockSocket.emit).toBeCalledWith('newPlayer', player);
      });
      it('should add a town listener, which should emit "playerMoved" to the socket when a player moves', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.updatePlayerLocation(player, generateTestLocation());
        expect(mockSocket.emit).toBeCalledWith('playerMoved', player);

      });
      it('should add a town listener, which should emit "playerDisconnect" to the socket when a player disconnects', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.destroySession(session);
        expect(mockSocket.emit).toBeCalledWith('playerDisconnect', player);
      });
      it('should add a town listener, which should emit "townClosing" to the socket and disconnect it when disconnectAllPlayers is called', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.disconnectAllPlayers();
        expect(mockSocket.emit).toBeCalledWith('townClosing');
        expect(mockSocket.disconnect).toBeCalledWith(true);
      });
      describe('when a socket disconnect event is fired', () => {
        it('should remove the town listener for that socket, and stop sending events to it', async () => {
          TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
          townSubscriptionHandler(mockSocket);

          // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
          if (disconnectHandler && disconnectHandler[1]) {
            disconnectHandler[1]();
            const newPlayer = new Player('should not be notified');
            await testingTown.addPlayer(newPlayer);
            expect(mockSocket.emit).not.toHaveBeenCalledWith('newPlayer', newPlayer);
          } else {
            fail('No disconnect handler registered');
          }
        });
        it('should destroy the session corresponding to that socket', async () => {
          TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
          townSubscriptionHandler(mockSocket);

          // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
          if (disconnectHandler && disconnectHandler[1]) {
            disconnectHandler[1]();
            mockReset(mockSocket);
            TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
            townSubscriptionHandler(mockSocket);
            expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
          } else {
            fail('No disconnect handler registered');
          }

        });
      });
      it('should forward playerMovement events from the socket to subscribed listeners', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        // find the 'playerMovement' event handler for the socket, which should have been registered after the socket was connected
        const playerMovementHandler = mockSocket.on.mock.calls.find(call => call[0] === 'playerMovement');
        if (playerMovementHandler && playerMovementHandler[1]) {
          const newLocation = generateTestLocation();
          player.location = newLocation;
          playerMovementHandler[1](newLocation);
          expect(mockListener.onPlayerMoved).toHaveBeenCalledWith(player);
        } else {
          fail('No playerMovement handler registered');
        }
      });
    });
  });
  describe('addConversationArea', () => {
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `addConversationArea test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should add the conversation area to the list of conversation areas', ()=>{
      const newConversationArea = TestUtils.createConversationForTesting();
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);
      const areas = testingTown.conversationAreas;
      expect(areas.length).toEqual(1);
      expect(areas[0].label).toEqual(newConversationArea.label);
      expect(areas[0].topic).toEqual(newConversationArea.topic);
      expect(areas[0].boundingBox).toEqual(newConversationArea.boundingBox);
    });
  });
  describe('updatePlayerLocation', () =>{
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `updatePlayerLocation test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should respect the conversation area reported by the player userLocation.conversationLabel, and not override it based on the player\'s x,y location', async ()=>{
      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: newConversationArea.label };
      testingTown.updatePlayerLocation(player, newLocation);
      expect(player.activeConversationArea?.label).toEqual(newConversationArea.label);
      expect(player.activeConversationArea?.topic).toEqual(newConversationArea.topic);
      expect(player.activeConversationArea?.boundingBox).toEqual(newConversationArea.boundingBox);

      const areas = testingTown.conversationAreas;
      expect(areas[0].occupantsByID.length).toBe(1);
      expect(areas[0].occupantsByID[0]).toBe(player.id);

    }); 
    it('should emit an onConversationUpdated event when a conversation area gets a new occupant', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
      const newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: newConversationArea.label };
      testingTown.updatePlayerLocation(player, newLocation);
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(1);
    });
    it('player cannot be added to chat when conversation area is defined', async () =>{
      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);
  
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
  
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);
  
      const location:UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: newConversationArea.label };
      const location2:UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: newConversationArea.label };
  
      testingTown.updatePlayerLocation(player, location);
      testingTown.updatePlayerLocation(player2, location2);
      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();
    });
    it('chat is created when second player walks up to first player', async () =>{
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
  
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);
  
      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();
  
      const locationOutOfChat:UserLocation = { moving: false, rotation: 'front', x: 600, y: 600, conversationLabel: undefined };
      const locationInChat:UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
      const locationInChat2:UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };
 
      testingTown.updatePlayerLocation(player, locationInChat);
      testingTown.updatePlayerLocation(player2, locationOutOfChat);
      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();
      testingTown.updatePlayerLocation(player2, locationInChat2);
      expect(player.activeChat).toBeDefined();
      expect(player2.activeChat).toBeDefined();
      expect(player.activeChat).toBe(player2.activeChat); 
    });
    it('should not change anything if a player moves within their current chat\'s radius', async () =>{
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
  
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);
  
      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();
  
      const locationInChat:UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
      const locationInChat2:UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };
      const locationInChat3:UserLocation = { moving: false, rotation: 'front', x: 9, y: 9, conversationLabel: undefined };
 
      testingTown.updatePlayerLocation(player, locationInChat);
      testingTown.updatePlayerLocation(player2, locationInChat2);
      expect(player.activeChat).toBeDefined();
      expect(player2.activeChat).toBeDefined();
      expect(player.activeChat).toBe(player2.activeChat); 

      testingTown.updatePlayerLocation(player, locationInChat3);
      expect(player.activeChat).toBeDefined();
      expect(player2.activeChat).toBeDefined();
      expect(player.activeChat).toBe(player2.activeChat); 
    });
    it('should destroy the chat when only one player is left and update the players\' active chats and the town\'s list of chats', async () =>{
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
  
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);
  
      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();
  
      const locationOutOfChat:UserLocation = { moving: false, rotation: 'front', x: 600, y: 600, conversationLabel: undefined };
  
      const locationInChat:UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
      const locationInChat2:UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };
  
      testingTown.updatePlayerLocation(player, locationInChat);
      testingTown.updatePlayerLocation(player2, locationInChat2);
      expect(player.activeChat).toBeDefined();
      expect(player2.activeChat).toBeDefined();
      testingTown.updatePlayerLocation(player, locationOutOfChat);
      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();

      expect(testingTown.chats.length).toBe(0);
    });  
    it('should not destroy the chat when a player leaves if there are at least two other players left and update the chat\'s list of occupants and the players\' active chats', async () =>{
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
  
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);

      const player3 = new Player(nanoid());
      await testingTown.addPlayer(player3);
  
      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();
      expect(player3.activeChat).toBeUndefined();
  
      const locationOutOfChat:UserLocation = { moving: false, rotation: 'front', x: 600, y: 600, conversationLabel: undefined };
  
      const locationInChat:UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
      const locationInChat2:UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };
      const locationInChat3:UserLocation = { moving: false, rotation: 'front', x: 9, y: 9, conversationLabel: undefined };
  
      testingTown.updatePlayerLocation(player, locationInChat);
      testingTown.updatePlayerLocation(player2, locationInChat2);
      testingTown.updatePlayerLocation(player3, locationInChat3);
      expect(player.activeChat).toBeDefined();
      expect(player2.activeChat).toBeDefined();
      expect(player3.activeChat).toBeDefined();
      expect(player2.activeChat?.occupantsByID.length).toBe(3);
      expect(player2.activeChat?.occupantsByID[0]).toBe(player.id);
      testingTown.updatePlayerLocation(player, locationOutOfChat);
      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeDefined();
      expect(player3.activeChat).toBeDefined();
      expect(player2.activeChat?.occupantsByID.length).toBe(2);
      expect(player2.activeChat?.occupantsByID[0]).toBe(player2.id);
    });
    it('should update everything accordingly when one player moves from one chat into another player\'s chat radius', async () =>{
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
  
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);

      const player3 = new Player(nanoid());
      await testingTown.addPlayer(player3);

      const player4 = new Player(nanoid());
      await testingTown.addPlayer(player4);

      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();
      expect(player3.activeChat).toBeUndefined();
      expect(player4.activeChat).toBeUndefined();
  
      const locationOutOfFirstChat1:UserLocation = { moving: false, rotation: 'front', x: 600, y: 600, conversationLabel: undefined };
      const locationOutOfFirstChat2:UserLocation = { moving: false, rotation: 'front', x: 599, y: 599, conversationLabel: undefined };
  
      const locationInFirstChat:UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
      const locationInFirstChat2:UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };
      const locationInFirstChat3:UserLocation = { moving: false, rotation: 'front', x: 9, y: 9, conversationLabel: undefined };
  
      testingTown.updatePlayerLocation(player, locationInFirstChat);
      testingTown.updatePlayerLocation(player2, locationInFirstChat2);
      testingTown.updatePlayerLocation(player3, locationInFirstChat3);
      testingTown.updatePlayerLocation(player4, locationOutOfFirstChat1);
      expect(player.activeChat).toBeDefined();
      expect(player2.activeChat).toBeDefined();
      expect(player3.activeChat).toBeDefined();
      expect(player4.activeChat).toBeUndefined();
      expect(player2.activeChat?.occupantsByID.length).toBe(3);
      expect(player2.activeChat?.occupantsByID[0]).toBe(player.id);
      testingTown.updatePlayerLocation(player, locationOutOfFirstChat2);
      expect(player.activeChat).toBe(player4.activeChat);
      expect(player2.activeChat).toBeDefined();
      expect(player3.activeChat).toBeDefined();
      expect(player2.activeChat?.occupantsByID.length).toBe(2);
      expect(player2.activeChat?.occupantsByID[0]).toBe(player2.id);
      expect(player4.activeChat?.occupantsByID.length).toBe(2);
      expect(player4.activeChat?.occupantsByID[0]).toBe(player.id);
    });
    it('should update everything accordingly when one player moves from one chat to another existing chat', async () =>{
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
  
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);

      const player3 = new Player(nanoid());
      await testingTown.addPlayer(player3);

      const player4 = new Player(nanoid());
      await testingTown.addPlayer(player4);

      const player5 = new Player(nanoid());
      await testingTown.addPlayer(player5);
  
      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();
      expect(player3.activeChat).toBeUndefined();
      expect(player4.activeChat).toBeUndefined();
      expect(player5.activeChat).toBeUndefined();
  
      const locationInSecondChat1:UserLocation = { moving: false, rotation: 'front', x: 600, y: 600, conversationLabel: undefined };
      const locationInSecondChat2:UserLocation = { moving: false, rotation: 'front', x: 599, y: 599, conversationLabel: undefined };
      const locationInSecondChat3:UserLocation = { moving: false, rotation: 'front', x: 601, y: 601, conversationLabel: undefined };
  
      const locationInFirstChat1:UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
      const locationInFirstChat2:UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };
      const locationInFirstChat3:UserLocation = { moving: false, rotation: 'front', x: 9, y: 9, conversationLabel: undefined };
  
      testingTown.updatePlayerLocation(player, locationInFirstChat1);
      testingTown.updatePlayerLocation(player2, locationInFirstChat2);
      testingTown.updatePlayerLocation(player3, locationInFirstChat3);
      testingTown.updatePlayerLocation(player4, locationInSecondChat1);
      testingTown.updatePlayerLocation(player5, locationInSecondChat2);
      expect(player.activeChat).toBeDefined();
      expect(player2.activeChat).toBeDefined();
      expect(player3.activeChat).toBeDefined();
      expect(player4.activeChat).toBeDefined();
      expect(player5.activeChat).toBeDefined();
      expect(player2.activeChat?.occupantsByID.length).toBe(3);
      expect(player2.activeChat?.occupantsByID[0]).toBe(player.id);
      expect(player4.activeChat?.occupantsByID.length).toBe(2);
      expect(player.activeChat).not.toBe(player4.activeChat);
      testingTown.updatePlayerLocation(player, locationInSecondChat3);
      expect(player2.activeChat?.occupantsByID.length).toBe(2);
      expect(player2.activeChat?.occupantsByID[0]).toBe(player2.id);
      expect(player4.activeChat?.occupantsByID.length).toBe(3);
      expect(player.activeChat).toBe(player4.activeChat);
    });
  });
  describe('addChat', () => {
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `updatePlayerLocation test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should return false if there are no players within a chat radius of the anchor player', async () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(anchorPlayer);
      await testingTown.addPlayer(player2);
      expect(testingTown.players.length).toBe(2);

      let newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
      anchorPlayer.location = newLocation;

      newLocation = { moving: false, rotation: 'front', x: 25 + (2 * CHAT_RADIUS), y: 25 + (2 * CHAT_RADIUS), conversationLabel: undefined };
      player2.location = newLocation;

      const result = testingTown.addChat(anchorPlayer);
      expect(result).toBe(false);
    });
    it('should return true if there are two players within a chat radius', async () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(anchorPlayer);
      await testingTown.addPlayer(player2);
      expect(testingTown.players.length).toBe(2);

      let newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
      anchorPlayer.location = newLocation;

      newLocation = { moving: false, rotation: 'front', x: 23, y: 23, conversationLabel: undefined };
      player2.location = newLocation;

      const result = testingTown.addChat(anchorPlayer);
      expect(result).toBe(true);
    });
    it('should add the new chat to the town\'s list of chats', async () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(anchorPlayer);
      await testingTown.addPlayer(player2);

      let newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
      anchorPlayer.location = newLocation;

      newLocation = { moving: false, rotation: 'front', x: 23, y: 23, conversationLabel: undefined };
      player2.location = newLocation;

      testingTown.addChat(anchorPlayer);
      expect(testingTown.chats.length).toBe(1);
    });
    it('should update the chat\'s list of occupants', async () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(anchorPlayer);
      await testingTown.addPlayer(player2);

      let newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
      anchorPlayer.location = newLocation;

      newLocation = { moving: false, rotation: 'front', x: 23, y: 23, conversationLabel: undefined };
      player2.location = newLocation;

      testingTown.addChat(anchorPlayer);
      const occupants = testingTown.chats[0].occupantsByID;
      expect(occupants.length).toBe(2);
      expect(occupants[0]).toBe(anchorPlayer.id);
      expect(occupants[1]).toBe(player2.id);
    });
    it('should update the active chat area of the players when a new chat is created', async () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(anchorPlayer);
      await testingTown.addPlayer(player2);

      let newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
      anchorPlayer.location = newLocation;

      newLocation = { moving: false, rotation: 'front', x: 23, y: 23, conversationLabel: undefined };
      player2.location = newLocation;

      testingTown.addChat(anchorPlayer);
      expect(testingTown.players[0].activeChat).not.toBe(undefined);
      expect(testingTown.players[0].activeChat).toBe(testingTown.chats[0]);
      expect(testingTown.players[1].activeChat).not.toBe(undefined);
      expect(testingTown.players[1].activeChat).toBe(testingTown.chats[0]);
    });
    it('should only add the players that are in the anchor player\'s chat radius to the new chat', async () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      const player3 = new Player(nanoid());
      const player4 = new Player(nanoid());
      const player5 = new Player(nanoid());
      await testingTown.addPlayer(anchorPlayer);
      await testingTown.addPlayer(player2);
      await testingTown.addPlayer(player3);
      await testingTown.addPlayer(player4);
      await testingTown.addPlayer(player5);
      expect(testingTown.players.length).toBe(5);

      expect(anchorPlayer.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();
      expect(player3.activeChat).toBeUndefined();
      expect(player4.activeChat).toBeUndefined();
      expect(player5.activeChat).toBeUndefined();

      const anchorPlayerLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
      anchorPlayer.location = anchorPlayerLocation;

      const locationWithinRadius1 : UserLocation = { moving: false, rotation: 'front', x: 23, y: 23, conversationLabel: undefined };
      player2.location = locationWithinRadius1;
      const locationOutsideRadius1 : UserLocation = { moving: false, rotation: 'front', x: 600, y: 600, conversationLabel: undefined };
      player3.location = locationOutsideRadius1;
      const locationWithinRadius2 : UserLocation = { moving: false, rotation: 'front', x: 27, y: 27, conversationLabel: undefined };
      player4.location = locationWithinRadius2;
      const locationOutsideRadius2 : UserLocation = { moving: false, rotation: 'front', x: 25 - (2 * CHAT_RADIUS), y: 25 - (2 * CHAT_RADIUS), conversationLabel: undefined };
      player5.location = locationOutsideRadius2;

      const result = testingTown.addChat(anchorPlayer);
      expect(result).toBe(true);

      const occupants = testingTown.chats[0].occupantsByID;
      expect(occupants.length).toBe(3);
      expect(occupants[0]).toBe(anchorPlayer.id);
      expect(occupants[1]).toBe(player2.id);
      expect(occupants[2]).toBe(player4.id);

      expect(anchorPlayer.activeChat).toBeDefined();
      expect(player2.activeChat).toBeDefined();
      expect(player3.activeChat).toBeUndefined();
      expect(player4.activeChat).toBeDefined();
      expect(player5.activeChat).toBeUndefined();
    });

  });
  describe('isWithin tests', () => {
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `updatePlayerLocation test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('returns true if players location is within conversation area', async () => {
    const conversationArea = TestUtils.createConversationForTesting();
    conversationArea.boundingBox = {x: 5, y: 5, width: 5, height: 5}
    const player = new Player(nanoid());
    await testingTown.addPlayer(player);

    let locationInArea:UserLocation = { moving: false, rotation: 'front', x: 5, y: 5, conversationLabel: conversationArea.label };
    player.location = locationInArea
    expect(player.isWithin(conversationArea)).toBe(true)

    let locationInArea2:UserLocation = { moving: false, rotation: 'front', x: 7, y: 5, conversationLabel: conversationArea.label };
    player.location = locationInArea2
    expect(player.isWithin(conversationArea)).toBe(true)
    });
    it('returns false if players location not is within conversation area', async () => {
        const conversationArea = TestUtils.createConversationForTesting();
        conversationArea.boundingBox = {x: 5, y: 5, width: 5, height: 5}
        const player = new Player(nanoid());
        await testingTown.addPlayer(player);
    
        let locationNotInArea:UserLocation = { moving: false, rotation: 'front', x: 5, y: 10, conversationLabel: conversationArea.label };
        player.location = locationNotInArea
        expect(player.isWithin(conversationArea)).toBe(false)
    
        let locationNotInArea2:UserLocation = { moving: false, rotation: 'front', x: 10, y: 5, conversationLabel: conversationArea.label };
        player.location = locationNotInArea2
        expect(player.isWithin(conversationArea)).toBe(false)

        let locationNotInArea3:UserLocation = { moving: false, rotation: 'front', x: 5, y: 20, conversationLabel: conversationArea.label };
        player.location = locationNotInArea3
        expect(player.isWithin(conversationArea)).toBe(false)

        let locationNotInArea4:UserLocation = { moving: false, rotation: 'front', x: 20, y: 5, conversationLabel: conversationArea.label };
        player.location = locationNotInArea4
        expect(player.isWithin(conversationArea)).toBe(false)

        let locationNotInArea5:UserLocation = { moving: false, rotation: 'front', x: 30, y: 30, conversationLabel: conversationArea.label };
        player.location = locationNotInArea5
        expect(player.isWithin(conversationArea)).toBe(false)
    
        });
  });
  describe('isAround tests', () => {
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `updatePlayerLocation test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should return false if there are no players within a chat radius of the anchor player', async () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(anchorPlayer);
      await testingTown.addPlayer(player2);
      expect(testingTown.players.length).toBe(2);

      // case where player distances are equal to radius
      let equalRadiusLocation:UserLocation = {moving: false, rotation: 'front', x: 25+(CHAT_RADIUS**2)/2, y: 25+(CHAT_RADIUS**2)/2, conversationLabel: undefined}
      let equalRadiusLocation2:UserLocation ={moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined}
      anchorPlayer.location = equalRadiusLocation
      player2.location = equalRadiusLocation2
      expect(anchorPlayer.isAround(player2)).toBe(false)

      // case where obviously outside radius
      let anchorPlayerLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
      anchorPlayer.location = anchorPlayerLocation
      let player2location:UserLocation = { moving: false, rotation: 'front', x:  (CHAT_RADIUS**2), y:  (CHAT_RADIUS**2), conversationLabel: undefined };
      player2.location = player2location
      expect(anchorPlayer.isAround(player2)).toBe(false)
    });
    it('should return true if there are players within a chat radius of the anchor player', async () => {
        const anchorPlayer = new Player(nanoid());
        const player2 = new Player(nanoid());
        await testingTown.addPlayer(anchorPlayer);
        await testingTown.addPlayer(player2);
        expect(testingTown.players.length).toBe(2);
    
        // case where obviously inside radius
        let anchorPlayerLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
        anchorPlayer.location = anchorPlayerLocation
        let player2location:UserLocation = { moving: false, rotation: 'front', x:  26, y:  26, conversationLabel: undefined };
        player2.location = player2location
        expect(anchorPlayer.isAround(player2)).toBe(true)

        // works with three players in town 
        const player3 = new Player(nanoid());
        await testingTown.addPlayer(player3);
        expect(testingTown.players.length).toBe(3);
        let player3location:UserLocation = { moving: false, rotation: 'front', x:  24, y:  24, conversationLabel: undefined };
        player3.location = player3location 
        expect(anchorPlayer.isAround(player3)).toBe(true)
        expect(player2.isAround(player3)).toBe(true)
        expect(player3.isAround(player2)).toBe(true)
        expect(player3.isAround(anchorPlayer)).toBe(true)

        // need other case where coordinates are function of radius
      });
  });
  describe('isWithinChat tests', () => {
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `updatePlayerLocation test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should return false if players location is not in chat', async () => {
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);
      expect(testingTown.players.length).toBe(2);

      const locationInChat:UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
      const locationInChat2:UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };
 
      testingTown.updatePlayerLocation(player, locationInChat);
      testingTown.updatePlayerLocation(player2, locationInChat2);
      const chat : Chat =  player2.activeChat === undefined ? new Chat(player2) : player2.activeChat

      const player3 = new Player(nanoid());
      await testingTown.addPlayer(player3);
      const locationOutOfChat:UserLocation = { moving: false, rotation: 'front', x: CHAT_RADIUS*20, y: CHAT_RADIUS*20, conversationLabel: undefined };

      testingTown.updatePlayerLocation(player3, locationOutOfChat);
      expect(player3.isWithinChat(chat)).toBe(false)
    });
    it('should return true if players location is in chat', async () => {
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);
      expect(testingTown.players.length).toBe(2);

      const locationInChat:UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
      const locationInChat2:UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };
 
      testingTown.updatePlayerLocation(player, locationInChat);
      testingTown.updatePlayerLocation(player2, locationInChat2);
      const chat : Chat =  player2.activeChat === undefined ? new Chat(player2) : player2.activeChat

      expect(player2.isWithinChat(chat)).toBe(true)
    });
  });
});
