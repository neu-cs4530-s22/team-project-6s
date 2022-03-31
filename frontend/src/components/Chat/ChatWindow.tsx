import React from 'react';
import { Heading, StackDivider, VStack, Tooltip } from '@chakra-ui/react';
import ChatConversation from './ChatConversation';
import Textbox from './Textbox';

export default function ChatWindow(): JSX.Element {
    return (
      <VStack align="left"
        spacing={2}
        border='2px'
        padding={2}
        marginRight={2}
        borderColor='gray.500'
        height='100%'
        divider={<StackDivider borderColor='gray.200' />}
        borderRadius='4px'>
          <Heading fontSize='xl' as='h1'>
            Chat with others!
            <Tooltip label="Go near another player to start a chat">?</Tooltip>
          </Heading>
        <ChatConversation />
        <Textbox />
      </VStack>
    );
  }