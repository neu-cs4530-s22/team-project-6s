import React, { useState, useEffect } from 'react';
import { Box, Stack } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import usePlayersInTown from '../../hooks/usePlayersInTown';
import useChatsInTown from '../../hooks/useChatsInTown';
import { ChatMessage } from '../../classes/Chat';
import useNearbyPlayers from '../../hooks/useNearbyPlayers';

function displayMessage(messageBody: string, messageType: string): JSX.Element {
    const potential = localStorage.getItem(messageBody);
    if (potential !== null) {
        return (
            <img
                src={JSON.parse(potential).file}
                alt="message"
                style={{float: messageType === 'sent' ? 'right' : 'left'}}
                /* flosat={messageType === 'sent' ? 'right' : 'left'} */
            />
        );
    }
    return(
        messageType === 'sent' ? 
        <Box as="button" textAlign="right" borderRadius='md' bg='#63B3ED' px={4} h={10} color='white' style={{ overflow: "auto" }}>
            {messageBody}
        </Box>
        :
        <Box as="button" textAlign="left" borderRadius='md' bg='#EDF2F7' px={4} h={10} color='black' style={{ overflow: "auto" }}>
            {messageBody}
        </Box>
    );
}

type SentMessageProps = {
    message: ChatMessage
}
function SentMessage({ message }: SentMessageProps): JSX.Element {
    const date = message.dateCreated;
    const recipientId = message.privateMessageRecipientId;
    const recipient = usePlayersInTown().find((player) => player.id === recipientId)?.userName;

    return (
        <Box textAlign="right">
            <Box>
                {message.privateMessage ?
                    <p>Me<span style={{ color: 'red' }}> to {recipient}</span> &emsp; <i>{(date instanceof Date) ? date.toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' }) : new Date(date).toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' })}</i></p>
                    :
                    <p>Me &emsp; <i>{(date instanceof Date) ? date.toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' }) : new Date(date).toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' })}</i></p>
                }
            </Box>
            {displayMessage(message.body, 'sent')}
        </Box>
    );
}

type ReceivedMessageProps = {
    message: ChatMessage,
    author: string | undefined,
    currentPlayerId: string,
}
function ReceivedMessage({ message, author, currentPlayerId }: ReceivedMessageProps): JSX.Element {
    const players = usePlayersInTown();
    const authorPlayer = players.find((player) => player.id === author);
    const date = message.dateCreated;
    const recipientId = message.privateMessageRecipientId;
  
    if (message.privateMessage) {
        return (
            recipientId === currentPlayerId ? 
            <Box textAlign="left">
                <Box>
                    {message.privateMessage ?
                        <p>{authorPlayer?.userName || 'Sender'}<span style={{ color: 'red' }}> to Me</span> &emsp; <i>{(date instanceof Date) ? date.toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' }) : new Date(date).toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' })}</i></p>
                        :
                        <></>
                    }
                </Box>
                {displayMessage(message.body, 'received')}
            </Box>
                : <></>
        )
    }
    return (
        <Box textAlign="left">
            <Box>
                <p>{authorPlayer?.userName || 'Sender'} &emsp; <i>{(date instanceof Date) ? date.toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' }) : new Date(date).toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' })}</i></p>
            </Box>
            {displayMessage(message.body, 'received')}
        </Box>
    );
}

export default function ChatConversation(): JSX.Element {
    const { myPlayerID } = useCoveyAppState();
    const players = usePlayersInTown();
    const myPlayer = players.find((player) => player.id === myPlayerID);
    const chats = useChatsInTown();
    const chat = chats.find((c) => c._id === myPlayer?._activeChatID);
    const [inChat, setInChat] = useState(false);

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

    return (
      <div data-testid="container" style={{overflow: "scroll", flex: "auto"}}>
          <Stack>
          {chats && chat && chat.chatMessages && inChat ? chat.chatMessages.map((message) => 
          message.author === myPlayer?.id ? <SentMessage key={`by ${message.author} with messageID ${nanoid()}`} message={message} /> 
          : <ReceivedMessage key={`by ${message.author} with messageID ${nanoid()}`} message={message} author={message.author} currentPlayerId={myPlayerID}/>) : <></>}
          </Stack>
      </div>
    );
}