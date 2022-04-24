import React from "react";
import { RenderResult } from "@testing-library/react";
import { ChakraProvider } from '@chakra-ui/react'
import "@testing-library/jest-dom/extend-expect";
import '@testing-library/jest-dom'
import { render, fireEvent } from '@testing-library/react'
import { nanoid } from 'nanoid';
import TownsServiceClient from '../../classes/TownsServiceClient';
import CoveyAppContext from '../../contexts/CoveyAppContext';
import ChatWindow from "./ChatWindow";
import ChatConversation from "./ChatConversation";
import Textbox from "./Textbox";
import  userEvent from "@testing-library/user-event";
import { useAppSelector } from '../../redux/reduxHooks'
import { useSelector } from "react-redux";
import * as reactRedux from 'react-redux'
import { useDispatch } from 'react-redux';

const useDispatchMock = jest.fn();

const mockUseAppSelector = jest.fn();

jest.mock('../../redux/reduxHooks', () => {
    const selctors = jest.requireActual("../../redux/reduxHooks");
    return {
        ...selctors, 
        useAppSelector: () => (mockUseAppSelector)
    };
});

jest.mock('react-redux', () => {
    const selctors = jest.requireActual("react-redux");
    return {
        ...selctors, 
        useDispatch:  () => (useDispatchMock)
    };
});

const mockUseCoveyAppState = jest.fn(() => (Promise.resolve()));
const mockToast = jest.fn();
const mockUseDisclosure = {isOpen: true, onOpen: jest.fn(), onClose: jest.fn()};

jest.mock('../../classes/TownsServiceClient');
jest.mock('../../hooks/useCoveyAppState', () => ({
  __esModule: true, // this property makes it work
  default: () => (mockUseCoveyAppState)
}));
jest.mock("@chakra-ui/react", () => {
  const ui = jest.requireActual("@chakra-ui/react");
  return {
    ...ui,
    useToast: ()=>(mockToast),
    useDisclosure: ()=>(mockUseDisclosure),
  };
})
// @ts-ignore
mockUseCoveyAppState.apiClient = new TownsServiceClient();

function wrappedTownChatWindow() {
  return <ChakraProvider><CoveyAppContext.Provider value={{
    myPlayerID: '',
    currentTownID: '',
    currentTownFriendlyName: '',
    currentTownIsPubliclyListed: false,
    sessionToken: '',
    userName: '',
    socket: null,
    emitMovement: () => {
    },
    apiClient: new TownsServiceClient(),
  }}>
    <ChatWindow/></CoveyAppContext.Provider></ChakraProvider>;
}

describe("ChatWindow", () => {
  let renderedComponent: RenderResult;

  beforeEach(() => {

    mockUseAppSelector.mockImplementation((callback) => {
      return callback(mockUseCoveyAppState);
    });


    useDispatchMock.mockImplementation(() => {
        return useDispatchMock;
    })
  });
  afterEach(() => {
    mockUseAppSelector.mockClear();
  });

  describe("Displays title correctly", () => {
    it("Heading is defined", async () => {
      // @ts-ignore
        mockUseCoveyAppState.currentTownID = nanoid();
        
        // @ts-ignore
        mockUseCoveyAppState.currentTownFriendlyName = true;
        
        // @ts-ignore
        mockUseCoveyAppState.currentTownIsPubliclyListed = nanoid();
        
        renderedComponent = render(wrappedTownChatWindow());
        const heading = await renderedComponent.findByTestId("heading");
        expect(heading).toHaveTextContent(
            "Chat with others!"
        );

      renderedComponent.unmount();
    });

    it("Tooltip is defined", async () => {
        // @ts-ignore
        mockUseCoveyAppState.currentTownID = nanoid();
        // @ts-ignore
        mockUseCoveyAppState.currentTownFriendlyName = true;
        // @ts-ignore
        mockUseCoveyAppState.currentTownIsPubliclyListed = nanoid();
        
        renderedComponent = render(wrappedTownChatWindow());

        const tooltip = (await (await renderedComponent.findByTestId("heading")).childNodes[1])

        if (tooltip) {
            fireEvent.mouseOver(tooltip);
        }
        
        expect(tooltip).toBeDefined;

        expect(
            await renderedComponent.findByText("Go near another player to start a chat")
          ).toBeInTheDocument();

      renderedComponent.unmount();
    });
  });

//   it("ChatConversation component is called", async () => {
//      // @ts-ignore
//      mockUseCoveyAppState.currentTownID = nanoid();
//      // @ts-ignore
//      mockUseCoveyAppState.currentTownFriendlyName = true;
//      // @ts-ignore
//      mockUseCoveyAppState.currentTownIsPubliclyListed = nanoid();
     
//      renderedComponent = render(wrappedTownChatWindow());

//      const chatConversation = await renderedComponent.findByTestId("chatconversation");
     
//     expect(renderedComponent).toBeInTheDocument();

//     renderedComponent.unmount();
//   });

//   it("TextBox component is called", async () => {
//      // @ts-ignore
//      mockUseCoveyAppState.currentTownID = nanoid();
//      // @ts-ignore
//      mockUseCoveyAppState.currentTownFriendlyName = true;
//      // @ts-ignore
//      mockUseCoveyAppState.currentTownIsPubliclyListed = nanoid();
     
//      renderedComponent = render(wrappedTownChatWindow());

//     const chatConversation = await renderedComponent.findByTestId("textbox");
//     expect(chatConversation).toBeInTheDocument();

//     renderedComponent.unmount();
//   });
});