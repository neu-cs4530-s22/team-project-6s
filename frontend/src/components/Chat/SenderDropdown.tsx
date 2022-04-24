import {Menu, MenuButton, MenuDivider, MenuItemOption, MenuList, MenuOptionGroup } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Player from '../../classes/Player';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import useNearbyPlayers from '../../hooks/useNearbyPlayers';
import usePlayersInTown from '../../hooks/usePlayersInTown';
import { setRecipient } from '../../redux/slice'

  export default function SenderDropdown() : JSX.Element{
      const {myPlayerID} = useCoveyAppState();
      const players = usePlayersInTown();
      const myPlayer = players.find((player) => player.id === myPlayerID);
      const dispatch = useDispatch()
      const occupantsAsPlayers = useNearbyPlayers()
      const occupantsAsPlayersMinusMe = occupantsAsPlayers?.filter((player) => player !== myPlayer)
      const [recipientName, setRecipientName] = useState('Everyone')
      const nearbyPlayers = useNearbyPlayers();
      const [inChat, setInChat] = useState(false);

    function checkIfInChat() {
      if (nearbyPlayers.length > 0) {
        setInChat(true)
      } else {
        setInChat(false)
      }
    }

    useEffect(() => {
      checkIfInChat();
    });

    function privateFunctionality(player : Player | undefined) {
      setRecipientName(player ? player.userName : 'Everyone')
      dispatch(setRecipient(player ? player.id : 'Everyone'));
    }

    return (
        <Menu size="sm" closeOnSelect>
          <MenuButton /* isDisabled={!inChat} */>
            {`Send to: ${recipientName}`}
          </MenuButton>
          <MenuList minWidth='240px'>
            <MenuOptionGroup defaultValue='Everyone'type='radio' >
              <MenuItemOption value='Everyone' onClick={() => privateFunctionality(undefined)} isDisabled={!inChat}> Everyone </MenuItemOption>
              <MenuDivider/>
              {occupantsAsPlayersMinusMe?.map((player) => (
              <MenuItemOption key={nanoid()} isDisabled={!inChat} value={player?.id} onClick={() => privateFunctionality(player)}> 
                {player?.userName}
              </MenuItemOption>
            ))}
            </MenuOptionGroup>
          </MenuList>
        </Menu>
    )
  }

  


