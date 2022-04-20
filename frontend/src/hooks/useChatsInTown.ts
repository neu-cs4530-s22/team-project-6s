import assert from 'assert';
import { useContext } from 'react';
import Chat from '../classes/Chat';
import ChatsInTownContext from '../contexts/ChatsInTownContext';

/**
 * This hook provides access to the list of all chat objects in the town.
 * 
 * Components that use this hook will be re-rendered each time that the list of chats in the town
 * changes.
 * 
 */
export default function useChatsInTown(): Chat[] {
  const ctx = useContext(ChatsInTownContext);
  assert(ctx, 'ChatsInTownContext context should be defined.');
  return ctx;
}
