import React from "react";
import { RenderResult , render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import '@testing-library/jest-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { nanoid } from 'nanoid';
import Textbox from "./Textbox";
import TownsServiceClient from '../../classes/TownsServiceClient';
import CoveyAppContext from '../../contexts/CoveyAppContext';

const mockUseAppSelector = jest.fn();

jest.mock('../../redux/reduxHooks', () => {
    const selctors = jest.requireActual("../../redux/reduxHooks");
    return {
        ...selctors, 
        useAppSelector: () => (mockUseAppSelector)
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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
    <Textbox/></CoveyAppContext.Provider></ChakraProvider>;
}

describe("ChatConversation", () => {
  let renderedComponent: RenderResult;

  beforeEach(() => {

    mockUseAppSelector.mockImplementation((callback) => callback(mockUseCoveyAppState));
    mockUseAppSelector.mockImplementation((callback) => callback(mockUseCoveyAppState));

  });

  it("Message box is displayed", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    mockUseCoveyAppState.currentTownID = nanoid();
      
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    mockUseCoveyAppState.currentTownFriendlyName = true;
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    mockUseCoveyAppState.currentTownIsPubliclyListed = nanoid();
    
    renderedComponent = render(wrappedTownChatWindow());

    const box = await renderedComponent.findByTestId("message-box");
    expect(box).toBeInTheDocument();
  });

    it("Send button is displayed", async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      mockUseCoveyAppState.currentTownID = nanoid();
      
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      mockUseCoveyAppState.currentTownFriendlyName = true;
      
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      mockUseCoveyAppState.currentTownIsPubliclyListed = nanoid();
      
      renderedComponent = render(wrappedTownChatWindow());

      const button = await renderedComponent.findByTestId("send-button");
      expect(button).toBeInTheDocument();
    });
});