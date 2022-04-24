import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './store'

// Define a type for the slice state
interface RecipientState {
  recipient: string
}

// Define the initial state using that type
const initialState: RecipientState = {
  recipient: 'Everyone',
}

export const recipientSlice = createSlice({
  name: 'recipient',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setRecipient: (state, action: PayloadAction<string>) => {
      state.recipient = action.payload;
    },
  },
})

export const { setRecipient } = recipientSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectRecipient = (state: RootState) => state.recipient;

export default recipientSlice.reducer;