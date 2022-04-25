import { Menu, MenuButton, MenuDivider, MenuItemOption, MenuList, MenuOptionGroup } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Player from '../../classes/Player';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import useNearbyPlayers from '../../hooks/useNearbyPlayers';
import usePlayersInTown from '../../hooks/usePlayersInTown';
import { useAppSelector } from '../../redux/reduxHooks'
import { setRecipient } from '../../redux/slice'

export default function SenderDropdown(): JSX.Element {
  const { myPlayerID } = useCoveyAppState();
  const players = usePlayersInTown();
  const myPlayer = players.find((player) => player.id === myPlayerID);
  const dispatch = useDispatch()
  
  const occupantsAsPlayers = useNearbyPlayers()
  const occupantsAsPlayersMinusMe = occupantsAsPlayers?.filter((player) => player !== myPlayer)
  const [recipientName, setRecipientName] = useState('Everyone')
  const [recipient, setRecipientID] = useState('Everyone')


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
  }, [nearbyPlayers]);

  /*
  function privateFunctionality(player : Player | undefined) {
    setRecipientName(player ? player.userName : 'Everyone')
    setRecipientID(player ? player.id : 'Everyone')
    if (curChat?.messages) {
      for (let i = 0; i < curChat?.messages.length; i += 1) {
        if(recipientID !== 'Everyone') {
          curChat.messages[i].privateMessage = true
          curChat.messages[i].privateMessageRecipientId = recipientID
          console.log(`${curChat.messages[i].privateMessage} and id is ${curChat.messages[i].privateMessageRecipientId}`)
        }
        else
        curChat.messages[i].privateMessage = false
        curChat.messages[i].privateMessageRecipientId = recipientID
        console.log(`${curChat.messages[i].privateMessage} and id is ${curChat.messages[i].privateMessageRecipientId}`)

        
    }

    }

    
  }
 */


  function privateFunctionality(player: Player | undefined) {
    setRecipientName(player ? player.userName : 'Everyone')
    setRecipientID(player ? player.id : 'Everyone')
    dispatch(setRecipient(player ? player.id : 'Everyone'));
    // setRecipientState(player ? player.id : 'Everyone')

    // privateRecipientId = recipientID
    // console.log(`recip id is  ${recipientID}`)
    // console.log(privateRecipientId)




  }



  return (
    <Menu size="sm" closeOnSelect>
      <MenuButton /* isDisabled={!inChat} */>
        {`Send to: ${recipientName}`}
      </MenuButton>
      <MenuList data-testid="recipient-dropdown" minWidth='240px'>
        <MenuOptionGroup defaultValue='Everyone' type='radio' >
          <MenuItemOption data-testid="default-option" value='Everyone' onClick={() => privateFunctionality(undefined)} isDisabled={!inChat}> Everyone </MenuItemOption>
          <MenuDivider />
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




