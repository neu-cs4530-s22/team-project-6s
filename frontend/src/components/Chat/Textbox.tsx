import React, { useState, useRef, useEffect } from 'react';
import { Input, Button } from '@chakra-ui/react';
import ChatIcon from '../VideoCall/VideoFrontend/icons/ChatIcon';
import usePlayersInTown from '../../hooks/usePlayersInTown';
import useNearbyPlayers from '../../hooks/useNearbyPlayers';

export default function Textbox(): JSX.Element {
    const [message, setMessage] = useState('');
    const [inChat, setInChat] = useState(false);

    const sendMessage = async () => {
      // connect to backend
      setMessage("");
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
        <div style={{overflow: 'hidden'}}><Button data-testid="send-button" style={{float: 'left'}} size='lg' onClick={async () => { await sendMessage() }}><ChatIcon /></Button></div>
      </div>
      </>
    );
  }