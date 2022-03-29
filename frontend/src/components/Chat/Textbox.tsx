import React, { useState, useEffect } from 'react';

export default function Textbox(): JSX.Element {
    const [message, setMessage] = useState('');

    return (
        <form>
        <label>
          <textarea value={message} />
        </label>
        <input type="submit" value="💬" />
      </form>
    );
  }