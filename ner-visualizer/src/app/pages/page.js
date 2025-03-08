'use client'

import { useState } from 'react';

const ENTITY_TYPES = [
  { label: 'PERSON', description: 'People', color: '#ffcdd2' },
  { label: 'ORG', description: 'Organizations', color: '#c8e6c9' },
  { label: 'GPE', description: 'Countries/Cities', color: '#bbdefb' },
  { label: 'DATE', description: 'Dates', color: '#e1bee7' },
  { label: 'MONEY', description: 'Monetary Values', color: '#dcedc8' },
];

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

  const highlightEntities = () => {
    if (!text || !entities?.length) return { __html: text };

    let highlightedText = text;
    // Sort entities by start index in reverse to avoid overlapping issues
    const sortedEntities = [...entities].sort((a, b) => b.start - a.start);
    sortedEntities.forEach((ent) => {
      const { start, end, label } = ent;
      const entityText = highlightedText.slice(start, end);
      highlightedText = 
        highlightedText.slice(0, start) +
        `<span class="entity ${label.toLowerCase()}" title="${label}">${entityText}</span>` +
        highlightedText.slice(end);
    });
    return { __html: highlightedText };
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
        dangerouslySetInnerHTML={highlightEntities()} 
      />

      <div className="legend">
        <h3>Entity Legend:</h3>
        <div className="legend-items">
          {ENTITY_TYPES.map((entity)=> (
            <div key={entity.label} className="legend-item">
              <span>
                <strong className={`entity ${entity.label.toLowerCase()}`}>{entity.description}</strong> ({entity.label})
              </span>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
}