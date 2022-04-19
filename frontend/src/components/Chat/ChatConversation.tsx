import React, { useState, useEffect } from 'react';
import { Box, Stack } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import usePlayersInTown from '../../hooks/usePlayersInTown';
import useChatsInTown from '../../hooks/useChatsInTown';
import { ChatMessage } from '../../classes/Chat';

type SentMessageProps = {
    message: ChatMessage
}
function SentMessage({message}: SentMessageProps): JSX.Element {
    const date = message.dateCreated;
    return (
        <Box textAlign="right">
            <Box>
                <p>Me &emsp; <i>{(date instanceof Date) ? date.toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' }) : new Date(date).toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' })}</i></p>
            </Box>
            <Box as="button" borderRadius='md' bg='#63B3ED' px={4} h={10} color='white' style={{overflow: "auto"}}>
                {message.body}
            </Box>
        </Box>
    );
}

type ReceivedMessageProps = {
    message: ChatMessage,
    author: string | undefined
}
function ReceivedMessage({message, author}: ReceivedMessageProps): JSX.Element {
    const players = usePlayersInTown();
    const authorPlayer = players.find((player) => player.id === author);
    const date = message.dateCreated;
    return (
        <Box textAlign="left">
            <Box>
                <p>{authorPlayer?.userName || 'Sender'} &emsp; <i>{(date instanceof Date) ? date.toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' }) : new Date(date).toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric' })}</i></p>
            </Box>
            <Box as="button" borderRadius='md' bg='#EDF2F7' px={4} h={10} color='black' style={{overflow: "auto"}}>
                {message.body}
            </Box>
        </Box>
    );
}

export default function ChatConversation(): JSX.Element {
    const {myPlayerID} = useCoveyAppState();
    const players = usePlayersInTown();
    const myPlayer = players.find((player) => player.id === myPlayerID);
    const chats = useChatsInTown();
    const chat = chats.find((c) => c._id === myPlayer?._activeChatID);

    return (
      <div data-testid="container" style={{overflow: "scroll", flex: "auto"}}>
          <Stack>
          {console.log(chat)}
          {chat && chat.messages ? chat.messages.map((message) => 
          message.author === myPlayer?.id ? <SentMessage key={`by ${message.author} with messageID ${nanoid()}`} message={message}/> 
          : <ReceivedMessage key={`by ${message.author} with messageID ${nanoid()}`} message={message} author={message.author}/>) : <></>}
          </Stack>
      </div>
    );
  }