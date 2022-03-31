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
import { CHAT_RADIUS } from '../types/Chat';

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
    });
    it('active chat property should be undefined when players have left chat radius', async () =>{
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
  
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);
  
      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();
  
      const locationOutOfChat:UserLocation = { moving: false, rotation: 'front', x: 600, y: 600, conversationLabel: undefined };
      const locationOutOfChat2:UserLocation = { moving: false, rotation: 'front', x: 1000, y: 1000, conversationLabel: undefined };
  
      const locationInChat:UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
      const locationInChat2:UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };
  
      testingTown.updatePlayerLocation(player, locationInChat);
      testingTown.updatePlayerLocation(player2, locationInChat2);
      expect(player.activeChat).toBeDefined();
      expect(player2.activeChat).toBeDefined();
       testingTown.updatePlayerLocation(player, locationOutOfChat);
      testingTown.updatePlayerLocation(player2, locationOutOfChat2);
      expect(player.activeChat).toBeUndefined();
      expect(player2.activeChat).toBeUndefined();
    });  
  });
  describe('addChat', () => {
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `updatePlayerLocation test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should return false if there are no players within a chat radius of the anchor player', () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      testingTown.addPlayer(anchorPlayer);
      testingTown.addPlayer(player2);
      expect(testingTown.players.length).toBe(2);

      let newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
      anchorPlayer.location = newLocation;

      newLocation = { moving: false, rotation: 'front', x: 25 + (2 * CHAT_RADIUS), y: 25 + (2 * CHAT_RADIUS), conversationLabel: undefined };
      player2.location = newLocation;

      const result = testingTown.addChat(anchorPlayer);
      expect(result).toBe(false);
    });
    it('should return true if there are two players within a chat radius', () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      testingTown.addPlayer(anchorPlayer);
      testingTown.addPlayer(player2);
      expect(testingTown.players.length).toBe(2);

      let newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
      anchorPlayer.location = newLocation;

      newLocation = { moving: false, rotation: 'front', x: 23, y: 23, conversationLabel: undefined };
      player2.location = newLocation;

      const result = testingTown.addChat(anchorPlayer);
      expect(result).toBe(true);
    });
    it('should add the new chat to the town\'s list of chats', () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      testingTown.addPlayer(anchorPlayer);
      testingTown.addPlayer(player2);

      let newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
      anchorPlayer.location = newLocation;

      newLocation = { moving: false, rotation: 'front', x: 23, y: 23, conversationLabel: undefined };
      player2.location = newLocation;

      testingTown.addChat(anchorPlayer);
      expect(testingTown.chats.length).toBe(1);
    });
    it('should update the chat\'s list of occupants', () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      testingTown.addPlayer(anchorPlayer);
      testingTown.addPlayer(player2);

      let newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
      anchorPlayer.location = newLocation;

      newLocation = { moving: false, rotation: 'front', x: 23, y: 23, conversationLabel: undefined };
      player2.location = newLocation;

      testingTown.addChat(anchorPlayer);
      expect(testingTown.chats[0].occupantsByID.length).toBe(2);
    });
    it('should update the active chat area of the players when a new chat is created', () => {
      const anchorPlayer = new Player(nanoid());
      const player2 = new Player(nanoid());
      testingTown.addPlayer(anchorPlayer);
      testingTown.addPlayer(player2);

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
  });
});
