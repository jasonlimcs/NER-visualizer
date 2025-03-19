from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import spacy
import fitz

nlp = spacy.load("en_core_web_md")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

def extract_relation_type(doc, ent1, ent2):
    # Find the shortest path between the two entities
    path = []
    current = ent1.root
    while current != ent2.root:
        path.append(current.dep_)
        current = current.head
        if current == current.head:  # Reached root
            break
    
    # Map dependency patterns to relationship types
    relation_patterns = {
        'nsubj': 'subject of',
        'dobj': 'object of',
        'pobj': 'object of preposition',
        'compound': 'part of',
        'poss': 'possesses',
        'attr': 'is',
        'prep': 'located in',
        'agent': 'agent of',
        'pcomp': 'complement of',
        'acomp': 'attribute of',
        'dative': 'recipient of',
        'appos': 'same as',
        'relcl': 'related to',
        'det': 'determiner of',
        'amod': 'modifies',
        'advmod': 'modifies',
        'neg': 'negation of',
        'aux': 'auxiliary of',
        'mark': 'marker of',
        'case': 'case of',
        'cc': 'coordinated with',
        'conj': 'conjoined with',
        'expl': 'expletive of',
        'intj': 'interjection',
        'meta': 'meta information',
        'nummod': 'number modifier of',
        'oprd': 'object predicate of',
        'parataxis': 'paratactic relation with',
        'punct': 'punctuation',
        'quantmod': 'quantifier modifier of',
        'xcomp': 'clausal complement of'
    }
    
    # Determine relationship type based on path
    if not path:
        return "related to"
    
    # Look for specific patterns in the path
    for dep in path:
        if dep in relation_patterns:
            return relation_patterns[dep]
    
    return "related to"

@app.post("/api/ner")
async def extract_entities(text: str = Body(..., embed=True)):
    try:
        doc = nlp(text)
        entities = [
            {"text": ent.text, "label": ent.label_, "start": ent.start_char, "end": ent.end_char}
            for ent in doc.ents
        ]
        relations = []
        
        for sent in doc.sents:
            sent_ents = [ent for ent in sent.ents]
            
            for i in range(len(sent_ents)):
                for j in range(i+1, len(sent_ents)):
                    # Extract relationship type
                    relation_type = extract_relation_type(doc, sent_ents[i], sent_ents[j])
                    
                    # Calculate a simple confidence score based on sentence length and entity distance
                    sent_length = len(sent.text.split())
                    ent_distance = abs(i - j)
                    confidence = max(0.1, 1.0 - (ent_distance / sent_length))
                    
                    relations.append({
                        "source": sent_ents[i].text,
                        "target": sent_ents[j].text,
                        "type": relation_type,
                        "confidence": round(confidence, 2),
                        "context": sent.text
                    })
        
        return {"entities": entities, "relations": relations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()

    if file.content_type == "application/pdf":
        pdf_document = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            text += page.get_text()
        return {"text": text}
    else:
        return {"text": content.decode("utf-8")}