import React from "react";
import { RenderResult, render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import '@testing-library/jest-dom'

import ChatConversation from "./ChatConversation";

describe("ChatConversation", () => {
  let renderedComponent: RenderResult;

  beforeEach(() => {
    renderedComponent = render(<ChatConversation />);
  });

  it("Chat container is displayed", async () => {
    const container = await renderedComponent.findByTestId("container");
    expect(container).toBeInTheDocument();
  });
});