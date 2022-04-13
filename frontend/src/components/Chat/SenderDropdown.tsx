import { Button, Menu, MenuButton, MenuGroup, MenuItem, MenuList } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import React from 'react';
import useNearbyPlayers from '../../hooks/useNearbyPlayers';

  export default function SenderDropdown(): JSX.Element {
      const playerList = ['user1', 'user2', 'user3']
    return (
        <Menu size="sm" closeOnSelect={false}>
        <MenuButton>
            Everyone
        </MenuButton>
        <MenuList>
        {playerList.map((player) => (
                        <MenuItem key={nanoid()} isFocusable={false}>{player}</MenuItem>
                    ))}        </MenuList>
    </Menu>
    )
  }