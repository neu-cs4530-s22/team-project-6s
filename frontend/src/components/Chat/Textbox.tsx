import React, { useState, useEffect } from 'react';
import { Input, Button, useToast } from '@chakra-ui/react';
import ChatIcon from '../VideoCall/VideoFrontend/icons/ChatIcon';
import usePlayersInTown from '../../hooks/usePlayersInTown';
import useNearbyPlayers from '../../hooks/useNearbyPlayers';
import useCoveyAppState from '../../hooks/useCoveyAppState';


export default function Textbox(): JSX.Element {
    const [message, setMessage] = useState('');
    const [inChat, setInChat] = useState(false);
    const {apiClient, sessionToken, currentTownID, myPlayerID} = useCoveyAppState();
    const toast = useToast();
    const players = usePlayersInTown();
    const myPlayer = players.find((player) => player.id === myPlayerID);


    const sendMessage = async (messageBody: string, date: Date, privateMessage : boolean, privateMessageRecipientId?: string) => {
      try {
        await apiClient.updateChat({
          coveyTownID: currentTownID,
          chatID: myPlayer?._activeChatID,
          sessionToken,
          sendingPlayerID: myPlayerID,
          body: messageBody,
          dateCreated: date,
          privateMessage ,
          privateMessageRecipientId,
        });
        toast({
          title: 'Message sent!',
          status: 'success',
        });
      } catch (err) {
        toast({
          title: 'Unable to send chat message',
          description: err.toString(),
          status: 'error',
        });
        console.log(`hello ${myPlayer?._activeChatID}`);
      }
    }

    const nearbyPlayers = useNearbyPlayers();

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

    return (
      <>
      <div>
        <div style={{float: 'left'}}>
          <Input data-testid="message-box" isDisabled={!inChat} placeholder='Message' size='lg' value={message} onChange={(e) => {setMessage(e.target.value)}}/>
        </div>
        <div style={{overflow: 'hidden'}}><Button data-testid="send-button" style={{float: 'left'}} size='lg' onClick={async () => { await sendMessage(message, new Date(), false, undefined) }}><ChatIcon /></Button></div>
      </div>
      </>
    );
  }