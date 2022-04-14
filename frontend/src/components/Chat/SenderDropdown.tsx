import { Button, Menu, MenuButton, MenuGroup, MenuItem, MenuItemOption, MenuList, MenuOptionGroup } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import useChatsInTown from '../../hooks/useChatsInTown';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import useNearbyPlayers from '../../hooks/useNearbyPlayers';
import usePlayersInTown from '../../hooks/usePlayersInTown';

  export default function SenderDropdown(): JSX.Element {
      const {myPlayerID} = useCoveyAppState();
      const players = usePlayersInTown();
      const myPlayer = players.find((player) => player.id === myPlayerID);
      const initChats = useChatsInTown();
      const curChat = initChats.find((chat) => chat._id === myPlayer?._activeChatID);
      const occupantIDsInChat = curChat?.occupantsByID


      const occupantsAsPlayers = occupantIDsInChat?.map((id)=>
      players.find((player) => player.id === id))
      const [recipient, setRecipient] = useState('Everyone')

  
      
  
    return (
        <Menu size="sm" closeOnSelect>
          <MenuButton>
            {`Send to: ${recipient}`}
          </MenuButton>
          <MenuList minWidth='240px'>
            <MenuOptionGroup defaultValue='Everyone'type='radio'>
            <MenuItemOption value='Everyone' onClick={event => 
                   setRecipient(event.currentTarget.innerText)}> Everyone </MenuItemOption>
              {occupantsAsPlayers?.map((player) => (
                <MenuItemOption key={nanoid()} value={player?.id} onClick={() => setRecipient(player ? player.id : 'Everyone')}> 
                {player?.userName}
                </MenuItemOption>
            ))}
            </MenuOptionGroup>
          </MenuList>
        </Menu>
    )
  }