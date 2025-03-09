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
                    relations.append({
                        "source": sent_ents[i].text,
                        "target": sent_ents[j].text,
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