import React from 'react';
import Chat from '../classes/Chat';

const Context = React.createContext<Chat[]>([]);

export default Context;
