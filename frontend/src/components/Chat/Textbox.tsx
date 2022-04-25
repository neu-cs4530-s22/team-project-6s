import React, { useState, useEffect } from 'react';
import { Input, Button, useToast, VStack } from '@chakra-ui/react';
import ChatIcon from '../VideoCall/VideoFrontend/icons/ChatIcon';
import usePlayersInTown from '../../hooks/usePlayersInTown';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import useNearbyPlayers from '../../hooks/useNearbyPlayers';
import { useAppSelector } from '../../redux/reduxHooks';
import useMaybeVideo from '../../hooks/useMaybeVideo';

export default function Textbox(): JSX.Element {
  const [message, setMessage] = useState<string>('');
  const [inChat, setInChat] = useState(false);
  const { apiClient, sessionToken, currentTownID, myPlayerID } = useCoveyAppState();
  const toast = useToast();
  const players = usePlayersInTown();
  const myPlayer = players.find((player) => player.id === myPlayerID);
  const recipient = useAppSelector((state) => state.recipient.recipient)
  const video = useMaybeVideo()
  const [focused, setFocused] = React.useState(false);
  const onFocus = () => setFocused(true);
  const onBlur = () => setFocused(false);

  const sendMessage = async (messageBody: string, date: Date, privateMessage: boolean, privateMessageRecipientId?: string) => {
    try {
      await apiClient.updateChat({
        coveyTownID: currentTownID,
        chatID: myPlayer?._activeChatID,
        sessionToken,
        sendingPlayerID: myPlayerID,
        body: messageBody,
        dateCreated: date,
        privateMessage,
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
  });

  useEffect(() => {
    if (focused) {
      video?.pauseGame();
    } else {
      video?.unPauseGame();
    }
  }, [focused, video]);

  function UploadFiles(): JSX.Element {

    return (
      <>
        <Button data-testid="upload-button" style={{ float: 'left' }} size='lg' isDisabled={!inChat}>
          Upload Image
          <Input
            type="file"
            accept="image/*"
            height="100%"
            width="100%"
            position="absolute"
            top="0"
            left="0"
            opacity="0"
            aria-hidden="true"
            onChange={(e) => {
              if (e.target !== null && e.target.files !== null) {
                const file = e.target.files[0];
                setMessage(file.name);
                const storeFile = {
                  file: URL.createObjectURL(file)
                };
                localStorage.setItem(file.name, JSON.stringify(storeFile));
              }
            }
          }
          />
        </Button>
      </>
    )
  }

  const configureMessage = async () => {
    if (recipient === 'Everyone') {
      await sendMessage(message, new Date(), false, undefined);
    }
    else {
      await sendMessage(message, new Date(), true, recipient);
    }
  }

  return (
    <>
      <VStack>
        <div>
          <div style={{ float: 'left' }}>
            <Input data-testid="message-box" isDisabled={!inChat} placeholder='Message' size='lg' value={message} onFocus={onFocus} onBlur={onBlur} onChange={(e) => { setMessage(e.target.value) }} onKeyPress={async (e) => { if (e.key === "Enter") { await configureMessage() } }} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <Button data-testid="send-button" isDisabled={!inChat} style={{ float: 'left' }} size='lg' onClick={async () => { await configureMessage() }}><ChatIcon /></Button>
          </div>
        </div>
        <UploadFiles />
      </VStack>
    </>
  );
}
