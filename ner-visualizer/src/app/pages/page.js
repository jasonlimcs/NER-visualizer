'use client'

import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {CategoryScale} from 'chart.js';
import Chart from 'chart.js/auto';
import ForceGraph3D from 'react-force-graph-3d';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
Chart.register(CategoryScale);

const ENTITY_TYPES = [
  { label: 'PERSON', description: 'People', color: '#ffcdd2'},
  { label: 'ORG', description: 'Organizations', color: '#c8e6c9'},
  { label: 'GPE', description: 'Countries/Cities', color: '#bbdefb'},
  { label: 'DATE', description: 'Dates', color: '#e1bee7'},
  { label: 'MONEY', description: 'Monetary Values', color: '#eb346b'},
  { label: 'EVENT', description: 'Event', color: '#f2f246'},
  { label: 'NORP', description: 'Nationalities or religious or political groups', color: '#f3a505'},
  { label: 'FAC', description: 'Buildings, airports, highways, bridges, etc.', color: '#78858B'},
  { label: 'LOC', description: 'Locations', color: '#2271B3'},
  { label: 'PRODUCT', description: 'Products', color: '#F75E25'},
  { label: 'WORK_OF_ART', description: 'Titles of books, songs, etc.', color: '#924E7D'},
  { label: 'LAW', description: 'Law documents', color: '#A5A5A5'},
  { label: 'LANGUAGE', description: 'Languages', color: '#6C7059'},
  { label: 'TIME', description: 'Times', color: '#9B111E'},
  { label: 'PERCENT', description: 'Percentage', color: '#E1CC4F'},
  { label: 'QUANTITY', description: 'Measurements', color: '#8A6642'},
  { label: 'ORDINAL', description: 'Ordinal values', color: '#BEBD7F'},
  { label: 'CARDINAL', description: 'Cardinal values', color: '#015D52'},
];

export default function Home() {
  const [text, setText] = useState('');
  const [entities, setEntities] = useState([]);
  const [relations, setRelations] = useState([]);
  const [selectedRelationTypes, setSelectedRelationTypes] = useState([]);

  const analyzeText = async () => {
    const response = await fetch('http://localhost:8000/api/ner', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }), 
    });
    const data = await response.json();
    console.log(data)
    setEntities(data.entities);
    setRelations(data.relations);
  };

  const highlightEntities = () => {
    if (!text || !entities?.length) return { __html: text };

    let highlightedText = text;
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


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    setText(data.text);
  };

  const resetFile = () => {
    const file = document.querySelector('input[type="file"]');
    file.value = '';
    setText('');
  }

  const entityCounts = entities?.reduce((acc, ent) => {
    acc[ent.label] = (acc[ent.label] || 0) + 1;
    return acc;
  }, {}) || {};
  const sortedLabels = Object.keys(entityCounts).sort((a, b) => entityCounts[b] - entityCounts[a]);
  const sortedCounts = sortedLabels.map(label => entityCounts[label]);

  // Get unique relation types from the current relations
  const relationTypes = [...new Set(relations.map(rel => rel.type))].sort();

  function Graph({ entities, relations, selectedTypes }) {
    const nodes = [...new Set(entities.map(ent => ent.text))]
      .map(text => ({
        id: text,
        label: entities.find(e => e.text === text).label,
        val: 1,
        color: ENTITY_TYPES.find(e => e.label === entities.find(ent => ent.text === text).label)?.color || '#ccc'
      }));

    // Filter relations based on selected types
    const filteredLinks = relations
      .filter(rel => selectedTypes.length === 0 || selectedTypes.includes(rel.type))
      .map(rel => ({
        source: rel.source,
        target: rel.target,
        type: rel.type,
        confidence: rel.confidence,
        context: rel.context,
        width: rel.confidence * 2,
        color: `hsl(${rel.confidence * 120}, 70%, 50%)`
      }));

    return (
      <ForceGraph3D
        graphData={{ nodes, links: filteredLinks }}
        nodeLabel="id"
        nodeAutoColorBy="label"
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkWidth={link => link.confidence * 2}
        linkColor={link => link.color}
        linkLabel={link => `${link.type} (${(link.confidence * 100).toFixed(0)}% confidence)`}
        linkTooltip={link => `
          <div style="padding: 8px;">
            <strong>${link.source} -> ${link.target}</strong><br/>
            Type: ${link.type}<br/>
            Confidence: ${(link.confidence * 100).toFixed(0)}%<br/>
            Context: "${link.context}"
          </div>
        `}
        width={800}
        height={400}
        backgroundColor="#ffffff"
        nodeRelSize={6}
        linkOpacity={0.6}
        linkResolution={1}
        enableNodeDrag={true}
        enableNavigationControls={true}
        enablePointerInteraction={true}
        onEngineStop={() => {
          const camera = document.querySelector('canvas').__threeObj.camera;
          camera.position.set(400, 400, 400);
          camera.lookAt(0, 0, 0);
        }}
        extraRenderers={[
          new EffectComposer(
            new RenderPass(),
            new UnrealBloomPass({
              threshold: 0.5,
              strength: 0.5,
              radius: 0.4
            })
          )
        ]}
      />
    );
  }


  return (
    <div className="container">
      <h1>Named Entity Visualizer</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your text here..."
        rows="6"
      />

    <input className="button" type="file" onChange={handleFileUpload} />
    <button onClick={resetFile}>X</button>

      {/* <button onClick={analyzeText}>Analyze</button> */}
      
      <h2>Results:</h2>
      <div 
        className="highlighted-text"
        dangerouslySetInnerHTML={highlightEntities()} 
      />
      <div></div>

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

      

      <Bar data={{
        labels: sortedLabels,
        datasets: [{
          label: 'Entity Count',
          data: sortedCounts,
          backgroundColor: sortedLabels.map(label => 
            ENTITY_TYPES.find(e => e.label === label)?.color || '#ccc'
          )
        }]
      }} />

<div className="relation-filters">
        <h3>Filter Relationships:</h3>
        <div className="filter-options">
          <label>
            <input
              type="checkbox"
              checked={selectedRelationTypes.length === 0}
              onChange={() => setSelectedRelationTypes([])}
            />
            Show All
          </label>
          {relationTypes.map(type => (
            <label key={type}>
              <input
                type="checkbox"
                checked={selectedRelationTypes.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRelationTypes([...selectedRelationTypes, type]);
                  } else {
                    setSelectedRelationTypes(selectedRelationTypes.filter(t => t !== type));
                  }
                }}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <Graph entities={entities} relations={relations} selectedTypes={selectedRelationTypes} />

    </div>
  );
}