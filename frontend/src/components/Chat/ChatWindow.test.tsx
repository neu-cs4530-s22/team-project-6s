import React from "react";
import { RenderResult, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";
import '@testing-library/jest-dom'

import ChatWindow from "./ChatWindow";
import ChatConversation from "./ChatConversation";
import Textbox from "./Textbox";

describe("ChatWindow", () => {
  let renderedComponent: RenderResult;

  beforeEach(() => {
    renderedComponent = render(<ChatWindow />);
  });

  describe("Displays title correctly", () => {
    it("Heading is defined", async () => {
      const heading = await renderedComponent.findByTestId("heading");
      expect(heading).toHaveTextContent(
        "Chat with others!"
      );
    });

    it("Tooltip is defined", async () => {
      const tooltip = await renderedComponent.findByTestId("tooltip")
      userEvent.hover(tooltip);
      expect(tooltip).toBeDefined();
    });
  });

  it("ChatConversation component is called", async () => {
    renderedComponent = render(<ChatConversation />);
    expect(renderedComponent).toBeInTheDocument();
  });

  it("TextBox component is called", async () => {
    renderedComponent = render(<Textbox />);
    expect(renderedComponent).toBeInTheDocument();
  });
});