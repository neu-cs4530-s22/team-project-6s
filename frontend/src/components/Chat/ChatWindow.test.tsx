import React from "react";
import { RenderResult , render } from "@testing-library/react";
import { ChakraProvider } from '@chakra-ui/react'
import "@testing-library/jest-dom/extend-expect";
import '@testing-library/jest-dom'
import { nanoid } from 'nanoid';
import TownsServiceClient from '../../classes/TownsServiceClient';
import CoveyAppContext from '../../contexts/CoveyAppContext';
import ChatWindow from "./ChatWindow";

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
    <ChatWindow/></CoveyAppContext.Provider></ChakraProvider>;
}

describe("ChatWindow", () => {
  let renderedComponent: RenderResult;

  beforeEach(() => {

    mockUseAppSelector.mockImplementation((callback) => callback(mockUseCoveyAppState));
    mockUseAppSelector.mockImplementation((callback) => callback(mockUseCoveyAppState));


    useDispatchMock.mockImplementation(() => useDispatchMock)
  });
  afterEach(() => {
    mockUseAppSelector.mockClear();
  });

  describe("Displays title correctly", () => {
    it("Heading is defined", async () => {
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
        const heading = await renderedComponent.findByTestId("heading");
        expect(heading).toHaveTextContent(
            "Chat with others!"
        );

      renderedComponent.unmount();
    });
  });
});