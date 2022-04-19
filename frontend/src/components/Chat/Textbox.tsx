import React, { useState, useEffect } from 'react';
import { Input, Button, useToast, VStack } from '@chakra-ui/react';
import ChatIcon from '../VideoCall/VideoFrontend/icons/ChatIcon';
import usePlayersInTown from '../../hooks/usePlayersInTown';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import useNearbyPlayers from '../../hooks/useNearbyPlayers';

export default function Textbox(): JSX.Element {
    const [message, setMessage] = useState<string | File>('');
    const [inChat, setInChat] = useState(false);
    const {apiClient, sessionToken, currentTownID, myPlayerID} = useCoveyAppState();
    const toast = useToast();
    const players = usePlayersInTown();
    const myPlayer = players.find((player) => player.id === myPlayerID);

    const sendMessage = async (messageBody: string | File, date: Date, privateMessage : boolean, privateMessageRecipientId?: string) => {
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
        setMessage('');
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

  function UploadFiles(): JSX.Element {
  
  return(
    <>
    <Button data-testid="upload-button" style={{float: 'left'}} size='lg' onChange={(e) => {setMessage(message)}}>
      Upload Files
      <Input
              type="file"
              height="100%"
              width="100%"
              position="absolute"
              top="0"
              left="0"
              opacity="0"
              aria-hidden="true"
              value={message}
            />
    </Button>
    </>
  )
}

    return (
      <>
      <VStack>
      <div>
        <div style={{float: 'left'}}>
          <Input data-testid="message-box" isDisabled={!inChat} placeholder='Message' size='lg' value={message} onChange={(e) => {setMessage(e.target.value)}} onKeyPress={async (e) => {if (e.key === "Enter") { await sendMessage(message, new Date(), false, undefined) }}}/>
        </div>
        <div style={{overflow: 'hidden'}}>
          <Button data-testid="send-button" style={{float: 'left'}} size='lg' onClick={async () => { await sendMessage(message, new Date(), false, undefined) }}><ChatIcon /></Button>
        </div>
      </div>
      <UploadFiles />
      </VStack>
      </>
    );
  }