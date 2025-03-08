'use client'

import { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [entities, setEntities] = useState([]);

  const analyzeText = async () => {
    const response = await fetch('http://localhost:8000/api/ner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    setEntities(data.entities);
  };

  return (
    <div className="container">
      <h1>Named Entity Visualizer</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your text here..."
        rows="6"
      />
      <button onClick={analyzeText}>Analyze</button>
      
      <h2>Results:</h2>
      <div 
        className="highlighted-text"
      />

      
    </div>
  );
}