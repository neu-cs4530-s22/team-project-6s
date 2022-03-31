import React, { useState, useEffect } from 'react';
import { Input, Button } from '@chakra-ui/react';
import ChatIcon from '../VideoCall/VideoFrontend/icons/ChatIcon';


export default function Textbox(): JSX.Element {
    const [message, setMessage] = useState('');

    return (
      <>
      <Input placeholder='Message' size='lg' value={message} onChange={(e) => {setMessage(e.target.value)}}/>
      <Button style={{alignSelf: 'flex-end'}} size='lg'><ChatIcon /></Button>
      </>
    );
  }