'use client'

import { useState, useEffect } from 'react';

const ENTITY_TYPES = [
  { label: 'PERSON', description: 'People'},
  { label: 'ORG', description: 'Organizations'},
  { label: 'GPE', description: 'Countries/Cities'},
  { label: 'DATE', description: 'Dates'},
  { label: 'MONEY', description: 'Monetary Values'},
  { label: 'EVENT', description: 'Event'},
  { label: 'NORP', description: 'Nationalities or religious or political groups'},
  { label: 'FAC', description: 'Buildings, airports, highways, bridges, etc.'},
  { label: 'LOC', description: 'Locations'},
  { label: 'PRODUCT', description: 'Products'},
  { label: 'WORK_OF_ART', description: 'Titles of books, songs, etc.'},
  { label: 'LAW', description: 'Law documents'},
  { label: 'LANGUAGE', description: 'Languages'},
  { label: 'TIME', description: 'Times'},
  { label: 'PERCENT', description: 'Percentage'},
  { label: 'QUANTITY', description: 'Measurements'},
  { label: 'ORDINAL', description: 'Ordinal values'},
  { label: 'CARDINAL', description: 'Cardinal values'},
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
        `<span class="entity ${label.toLowerCase()}" title="${label}">${entityText} <strong>${label}</strong></span>` +
        highlightedText.slice(end);
    });
    return { __html: highlightedText };
  };

  // Debounce text input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      analyzeText();
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [text]);

  return (
    <div className="container">
      <h1>Named Entity Visualizer</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your text here..."
        rows="6"
      />
      {/* <button onClick={analyzeText}>Analyze</button> */}
      
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