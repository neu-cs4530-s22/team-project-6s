import React from 'react';
import { Heading, StackDivider, VStack, Tooltip } from '@chakra-ui/react';
import ChatConversation from './ChatConversation';
import Textbox from './Textbox';
import SenderDropdown from './SenderDropdown';

export default function ChatWindow(): JSX.Element {
    return (
      <VStack align="left"
        spacing={2}
        border='2px'
        padding={2}
        marginRight={2}
        borderColor='gray.500'
        height='770px'
        divider={<StackDivider borderColor='gray.200' />}
        borderRadius='4px'>
        <Heading data-testid="heading" fontSize='xl' as='h1'>
          <Tooltip data-testid="tooltip" label="Go near another player to start a chat. Go near a group of players to join one.">Chat with others!</Tooltip>
        </Heading>
        <SenderDropdown />
        <ChatConversation />
        <Textbox />
      </VStack>
    );
  }
