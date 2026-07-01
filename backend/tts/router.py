import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import base64

# Import from the main server module or define dependencies locally
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import get_current_user, require_credits, deduct_credits, log_activity, db, new_id

from .providers import provider_manager

tts_router = APIRouter(prefix="/tts", tags=["TTS"])

class TTSGenerateIn(BaseModel):
    text: str
    voice: str
    language: str
    provider: str = "gemini"
    options: dict = {}

def now_utc() -> datetime: 
    return datetime.now(timezone.utc)

@tts_router.post("/generate")
async def generate_tts(body: TTSGenerateIn, user=Depends(get_current_user)):
    await require_credits(user, 2)
    
    provider = provider_manager.get_provider(body.provider)
    
    try:
        audio_bytes = await provider.generate_audio(
            text=body.text[:1000], # limit text length for safety
            voice=body.voice,
            language=body.language,
            options=body.options
        )
        
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="Failed to generate audio")
            
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        mime = "audio/mpeg" # GTTS returns mp3
        data_uri = f"data:{mime};base64,{audio_b64}"
        
        rec = {
            "id": new_id("tts"),
            "user_id": user["user_id"],
            "text": body.text[:500], # store preview
            "voice": body.voice,
            "language": body.language,
            "provider": provider.name,
            "audio_data": data_uri,
            "mime": mime,
            "size_bytes": len(audio_bytes),
            "created_at": now_utc().isoformat(),
        }
        
        await db.tts_history.insert_one(rec.copy())
        await deduct_credits(user["user_id"], 2)
        await log_activity(user["user_id"], "tts", f"Generated speech ({body.language})")
        
        return {
            "id": rec["id"],
            "audio_data": data_uri,
            "mime": mime,
            "size_bytes": rec["size_bytes"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@tts_router.get("/history")
async def get_tts_history(user=Depends(get_current_user)):
    history = await db.tts_history.find(
        {"user_id": user["user_id"]}, 
        {"_id": 0, "user_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    return history

@tts_router.delete("/history/{item_id}")
async def delete_tts_history(item_id: str, user=Depends(get_current_user)):
    result = await db.tts_history.delete_one({"id": item_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True}
