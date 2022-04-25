import { nanoid } from 'nanoid';
import Player from './Player';
import CoveyTownController from '../lib/CoveyTownController';
import { UserLocation } from '../CoveyTypes';

describe('addChatMessage tests', () => {
  let testingTown: CoveyTownController;
  beforeEach(() => {
    const townName = `addChatMessage test town ${nanoid()}`;
    testingTown = new CoveyTownController(townName, false);
  });
  it('adds a given public chat message to the chat\'s current list of chat messages', async () => {
    const player = new Player(nanoid());
    await testingTown.addPlayer(player);

    const player2 = new Player(nanoid());
    await testingTown.addPlayer(player2);
    expect(testingTown.players.length).toBe(2);

    const locationInChat: UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
    const locationInChat2: UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };

    testingTown.updatePlayerLocation(player, locationInChat);
    testingTown.updatePlayerLocation(player2, locationInChat2);
    const chat = testingTown.chats[0];
    const { chatMessages } = chat;

    expect(chatMessages.length).toBe(0);

    const message = {
      author: 'test',
      sid: chat._id,
      body: 'test',
      dateCreated: new Date(),
      privateMessage: false,
      privateMessageRecipientId: undefined,
    };
    chat.addChatMessage(message);

    expect(chatMessages.length).toBe(1);
    expect(chatMessages[0]).toBe(message);
  });
  it('adds a given private chat message to the chat\'s current list of chat messages', async () => {
    const player = new Player(nanoid());
    await testingTown.addPlayer(player);

    const player2 = new Player(nanoid());
    await testingTown.addPlayer(player2);
    expect(testingTown.players.length).toBe(2);

    const locationInChat: UserLocation = { moving: false, rotation: 'front', x: 10, y: 10, conversationLabel: undefined };
    const locationInChat2: UserLocation = { moving: false, rotation: 'front', x: 11, y: 11, conversationLabel: undefined };

    testingTown.updatePlayerLocation(player, locationInChat);
    testingTown.updatePlayerLocation(player2, locationInChat2);
    const chat = testingTown.chats[0];
    const { chatMessages } = chat;

    expect(chatMessages.length).toBe(0);

    const message = {
      author: 'test',
      sid: chat._id,
      body: 'test',
      dateCreated: new Date(),
      privateMessage: true,
      privateMessageRecipientId: player2.id,
    };
    chat.addChatMessage(message);

    expect(chatMessages.length).toBe(1);
    expect(chatMessages[0]).toBe(message);
  });
});