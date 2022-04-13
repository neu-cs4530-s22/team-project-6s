import React, { useState, useEffect } from 'react';
import { Box, Stack } from '@chakra-ui/react';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import usePlayersInTown from '../../hooks/usePlayersInTown';
import useChatsInTown from '../../hooks/useChatsInTown';
import { ChatListener, ChatMessage } from '../../classes/Chat';

type MessageProps = {
    message: string
}
function SentMessage({message}: MessageProps): JSX.Element {
    return (
        <Box textAlign="right">
            <Box>
                <p>Me &emsp; <i>12:39PM</i></p>
            </Box>
            <Box as="button" borderRadius='md' bg='#63B3ED' px={4} h={10} color='white' style={{overflow: "auto"}}>
                {message}
            </Box>
        </Box>
    );
}

function ReceivedMessage({message}: MessageProps): JSX.Element {
    return (
        <Box textAlign="left">
            <Box>
                <p>Sender &emsp; <i>12:39PM</i></p>
            </Box>
            <Box as="button" borderRadius='md' bg='#EDF2F7' px={4} h={10} color='black' style={{overflow: "auto"}}>
                {message}
            </Box>
        </Box>
    );
}

export default function ChatConversation(): JSX.Element {
    const {myPlayerID} = useCoveyAppState();
    const players = usePlayersInTown();
    const myPlayer = players.find((player) => player.id === myPlayerID);
    const initChats = useChatsInTown();
    const initChat = initChats.find((chat) => chat._id === myPlayer?._activeChatID);
    const [chat, setChat] = useState(initChat);
    const [messages, setMessages] = useState(initChat?.messages);

     useEffect(() => {
         // every time chat changes, update the messages
        function handleMessagesChange(newMessages: ChatMessage[]) {
            setMessages(newMessages);
        }
        
        const listener : ChatListener = {onMessagesChange: (newMessages: ChatMessage[]) => {
            handleMessagesChange(newMessages);
        }}
        chat?.addListener(listener);
        // remove listener on unmount
        return function cleanup() {
            chat?.removeListener(listener)
        };
      }, [chat]);

    return (
      <div data-testid="container" style={{overflow: "scroll", flex: "auto"}}>
          {console.log(useChatsInTown())}
          <Stack>
          {chat && messages ? messages.map((message) => 
          /* {if (message.author) {
              <SentMessage message={message.body} />;
          } else {
              <ReceivedMessage message={message.body} />;
          }}) */ <SentMessage key={message.sid} message={message.body} />) : <></>}
          </Stack>
      </div>
    );
  }