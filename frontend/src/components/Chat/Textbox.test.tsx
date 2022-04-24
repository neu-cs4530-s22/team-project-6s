import React from "react";
import { RenderResult, render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import '@testing-library/jest-dom'

import Textbox from "./Textbox";

describe("ChatConversation", () => {
  let renderedComponent: RenderResult;

  beforeEach(() => {
    renderedComponent = render(<Textbox />);
  });

  it("Message box is displayed", async () => {
    const box = await renderedComponent.findByTestId("message-box");
    expect(box).toBeInTheDocument();
  });

  it("Send button is displayed", async () => {
    const button = await renderedComponent.findByTestId("send-button");
    expect(button).toBeInTheDocument();
  });
});