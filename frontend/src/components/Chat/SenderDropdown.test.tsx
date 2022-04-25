import React from "react";
import { RenderResult , render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import '@testing-library/jest-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid';
import SenderDropdown from "./SenderDropdown";
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
    const reducer = {};
  return <Provider store={configureStore({reducer})}><ChakraProvider><CoveyAppContext.Provider value={{
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
    <SenderDropdown/></CoveyAppContext.Provider></ChakraProvider></Provider>;
}

describe("SenderDropdown", () => {
  let renderedComponent: RenderResult;

  beforeEach(() => {

    mockUseAppSelector.mockImplementation((callback) => callback(mockUseCoveyAppState));
    mockUseAppSelector.mockImplementation((callback) => callback(mockUseCoveyAppState));

  });

  it("Menu is displayed", async () => {
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

    const dropdown = await renderedComponent.findByTestId("recipient-dropdown");
    expect(dropdown).toBeInTheDocument();
  });

    it("Default option, Everyone, is displayed", async () => {
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

      const everyone = await renderedComponent.findByTestId("default-option");
      expect(everyone).toBeInTheDocument();
    });
});