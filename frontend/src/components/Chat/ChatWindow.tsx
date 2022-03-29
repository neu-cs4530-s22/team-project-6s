import { Heading, StackDivider, VStack } from '@chakra-ui/react';
import React from 'react';
import Textbox from './Textbox';

export default function ChatWindow(): JSX.Element {
    return (
      <VStack align="left"
        spacing={2}
        border='2px'
        padding={2}
        marginLeft={2}
        borderColor='gray.500'
        height='100%'
        divider={<StackDivider borderColor='gray.200' />}
        borderRadius='4px'>
          <Heading fontSize='xl' as='h1'>Chat with other players!</Heading>
        {/* <ChatConversation /> */}
        <Textbox />
      </VStack>
    );
  }