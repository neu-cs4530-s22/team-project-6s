import React from "react";
import { RenderResult , render } from "@testing-library/react";
import { ChakraProvider } from '@chakra-ui/react'
import "@testing-library/jest-dom/extend-expect";
import '@testing-library/jest-dom'
import { nanoid } from 'nanoid';
import { TargetElement } from '@testing-library/user-event';
import ChatConversation from "./ChatConversation";
import TownsServiceClient from '../../classes/TownsServiceClient';
import CoveyAppContext from '../../contexts/CoveyAppContext';

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

function wrappedTown() {
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
    <ChatConversation/></CoveyAppContext.Provider></ChakraProvider>;
}

describe("ChatConversation", () => {
  let renderedComponent: RenderResult;

  it("Chat container is displayed", async () => {
      // @ts-ignore
    mockUseCoveyAppState.currentTownID = nanoid();
    // @ts-ignore
    mockUseCoveyAppState.currentTownFriendlyName = true;
    // @ts-ignore
    mockUseCoveyAppState.currentTownIsPubliclyListed = nanoid();
    renderedComponent = render(wrappedTown());

    const container = await renderedComponent.findByTestId("container");
    expect(container).toBeInTheDocument();

    renderedComponent.unmount();
    });
});