'use client'

import { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [entities, setEntities] = useState([]);

  return (
    <div className="container">
      <h1>Named Entity Visualizer</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your text here..."
        rows="6"
      />
      <button>Analyze</button>
      
      <h2>Results:</h2>
      <div 
        className="highlighted-text"
      />

      
    </div>
  );
}