import { nanoid } from 'nanoid';
import Player from '../types/Player';
import CoveyTownController from './CoveyTownController';
import { UserLocation } from '../CoveyTypes';
import * as TestUtils from '../client/TestUtils';
import Chat, { CHAT_RADIUS } from '../types/Chat';

describe('isWithin tests', () => {
  let testingTown: CoveyTownController;
  beforeEach(() => {
    const townName = `isWithin test town ${nanoid()}`;
    testingTown = new CoveyTownController(townName, false);
  });
  it('returns true if player\'s location is within conversation area', async () => {
    const conversationArea = TestUtils.createConversationForTesting();
    conversationArea.boundingBox = { x: 5, y: 5, width: 5, height: 5 };
    const player = new Player(nanoid());
    await testingTown.addPlayer(player);

    const locationInArea: UserLocation = { moving: false, rotation: 'front', x: 5, y: 5, conversationLabel: conversationArea.label };
    player.location = locationInArea;
    expect(player.isWithin(conversationArea)).toBe(true);

    const locationInArea2: UserLocation = { moving: false, rotation: 'front', x: 7, y: 5, conversationLabel: conversationArea.label };
    player.location = locationInArea2;
    expect(player.isWithin(conversationArea)).toBe(true);
  });
  it('returns false if player\'s location not is within conversation area', async () => {
    const conversationArea = TestUtils.createConversationForTesting();
    conversationArea.boundingBox = { x: 5, y: 5, width: 5, height: 5 };
    const player = new Player(nanoid());
    await testingTown.addPlayer(player);

    const locationNotInArea: UserLocation = { moving: false, rotation: 'front', x: 5, y: 10, conversationLabel: conversationArea.label };
    player.location = locationNotInArea;
    expect(player.isWithin(conversationArea)).toBe(false);

    const locationNotInArea2: UserLocation = { moving: false, rotation: 'front', x: 10, y: 5, conversationLabel: conversationArea.label };
    player.location = locationNotInArea2;
    expect(player.isWithin(conversationArea)).toBe(false);

    const locationNotInArea3: UserLocation = { moving: false, rotation: 'front', x: 5, y: 20, conversationLabel: conversationArea.label };
    player.location = locationNotInArea3;
    expect(player.isWithin(conversationArea)).toBe(false);

    const locationNotInArea4: UserLocation = { moving: false, rotation: 'front', x: 20, y: 5, conversationLabel: conversationArea.label };
    player.location = locationNotInArea4;
    expect(player.isWithin(conversationArea)).toBe(false);

    const locationNotInArea5: UserLocation = { moving: false, rotation: 'front', x: 30, y: 30, conversationLabel: conversationArea.label };
    player.location = locationNotInArea5;
    expect(player.isWithin(conversationArea)).toBe(false);

  });
});
describe('isAround tests', () => {
  let testingTown: CoveyTownController;
  beforeEach(() => {
    const townName = `isAround test town ${nanoid()}`;
    testingTown = new CoveyTownController(townName, false);
  });
  it('should return false if there are no players within a chat radius of the anchor player', async () => {
    const anchorPlayer = new Player(nanoid());
    const player2 = new Player(nanoid());
    await testingTown.addPlayer(anchorPlayer);
    await testingTown.addPlayer(player2);
    expect(testingTown.players.length).toBe(2);

    // case where player distances are equal to radius
    const equalRadiusLocation: UserLocation = { moving: false, rotation: 'front', x: 25 + (CHAT_RADIUS ** 2) / 2, y: 25 + (CHAT_RADIUS ** 2) / 2, conversationLabel: undefined };
    const equalRadiusLocation2: UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
    anchorPlayer.location = equalRadiusLocation;
    player2.location = equalRadiusLocation2;
    expect(anchorPlayer.isAround(player2)).toBe(false);

    // case where obviously outside radius
    const anchorPlayerLocation: UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
    anchorPlayer.location = anchorPlayerLocation;
    const player2location: UserLocation = { moving: false, rotation: 'front', x: (CHAT_RADIUS ** 2), y: (CHAT_RADIUS ** 2), conversationLabel: undefined };
    player2.location = player2location;
    expect(anchorPlayer.isAround(player2)).toBe(false);
  });
  it('should return true if there are players within a chat radius of the anchor player', async () => {
    const anchorPlayer = new Player(nanoid());
    const player2 = new Player(nanoid());
    await testingTown.addPlayer(anchorPlayer);
    await testingTown.addPlayer(player2);
    expect(testingTown.players.length).toBe(2);

    // case where obviously inside radius
    const anchorPlayerLocation: UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: undefined };
    anchorPlayer.location = anchorPlayerLocation;
    const player2location: UserLocation = { moving: false, rotation: 'front', x: 26, y: 26, conversationLabel: undefined };
    player2.location = player2location;
    expect(anchorPlayer.isAround(player2)).toBe(true);

    // works with three players in town 
    const player3 = new Player(nanoid());
    await testingTown.addPlayer(player3);
    expect(testingTown.players.length).toBe(3);
    const player3location: UserLocation = { moving: false, rotation: 'front', x: 24, y: 24, conversationLabel: undefined };
    player3.location = player3location;
    expect(anchorPlayer.isAround(player3)).toBe(true);
    expect(player2.isAround(player3)).toBe(true);
    expect(player3.isAround(player2)).toBe(true);
    expect(player3.isAround(anchorPlayer)).toBe(true);

    // need other case where coordinates are function of radius
  });
});
describe('isWithinChat tests', () => {
  let testingTown: CoveyTownController;
  beforeEach(() => {
    const townName = `isWithinChat test town ${nanoid()}`;
    testingTown = new CoveyTownController(townName, false);
  });
  it('should return false if player\'s location is not in chat', async () => {
    const player = new Player(nanoid());
    await testingTown.addPlayer(player);

    const player2 = new Player(nanoid());
    await testingTown.addPlayer(player2);
    expect(testingTown.players.length).toBe(2);

    const locationInChat: UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
    const locationInChat2: UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };

    testingTown.updatePlayerLocation(player, locationInChat);
    testingTown.updatePlayerLocation(player2, locationInChat2);
    const activeChats = testingTown.chats;
    let chat;
    if (player2.activeChatID !== undefined) {
      chat = activeChats.find(c => c._id === player2.activeChatID);
    }
    if (chat === undefined) {
      chat = new Chat(player2);
    }

    const player3 = new Player(nanoid());
    await testingTown.addPlayer(player3);
    const locationOutOfChat: UserLocation = { moving: false, rotation: 'front', x: CHAT_RADIUS * 20, y: CHAT_RADIUS * 20, conversationLabel: undefined };

    testingTown.updatePlayerLocation(player3, locationOutOfChat);
    expect(player3.isWithinChat(chat.location)).toBe(false);
  });
  it('should return true if players location is in chat', async () => {
    const player = new Player(nanoid());
    await testingTown.addPlayer(player);

    const player2 = new Player(nanoid());
    await testingTown.addPlayer(player2);
    expect(testingTown.players.length).toBe(2);

    const locationInChat: UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
    const locationInChat2: UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };

    testingTown.updatePlayerLocation(player, locationInChat);
    testingTown.updatePlayerLocation(player2, locationInChat2);
    const activeChats = testingTown.chats;
    let chat;
    if (player2.activeChatID !== undefined) {
      chat = activeChats.find(c => c._id === player2.activeChatID);
    }
    if (chat === undefined) {
      chat = new Chat(player2);
    }

    expect(player2.isWithinChat(chat.location)).toBe(true);
  });
});
