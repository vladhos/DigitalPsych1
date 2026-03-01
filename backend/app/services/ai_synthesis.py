import openai
import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class AISynthesisService:
    """
    Optional Layer 2 augmentation.
    Translates deterministic rule hits into a coherent clinical summary narrative.
    Strictly prompted NOT to diagnose or hallucinate outside the deterministic bounds.
    """
    
    SYSTEM_PROMPT = """
    Na základe týchto matematických dát [Data z 1. vrstvy] vytvor odborný súhrn pre klinického pracovníka. 
    Nepridávaj vlastné diagnózy, drž sa len faktov z Rule Enginu.
    """
    
    @staticmethod
    async def generate_narrative(deterministic_hits: Dict[str, Any], feature_vectors: Dict[str, float]) -> Optional[str]:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY is not set. Using Fallback Mock Generator for AI Synthesis.")
            return AISynthesisService._generate_mock_narrative(deterministic_hits, feature_vectors)
            
        try:
            client = openai.AsyncClient(api_key=api_key)
            
            prompt_data = f"Feature Scores: {feature_vectors}\nDeterministic Findings: {deterministic_hits}"
            
            response = await client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": AISynthesisService.SYSTEM_PROMPT},
                    {"role": "user", "content": f"Please synthesize these findings:\n{prompt_data}"}
                ],
                temperature=0.2, # Extremely low temperature for deterministic consistency
                max_tokens=500
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"AI Synthesis failed: {str(e)}. Falling back to Mock Generator.")
            return AISynthesisService._generate_mock_narrative(deterministic_hits, feature_vectors)

    @staticmethod
    def _generate_mock_narrative(deterministic_hits: Dict[str, Any], feature_vectors: Dict[str, float]) -> str:
        """
        Mockový generátor, ktorý vytvorí štruktúrovaný text na letný beh bez LLM.
        Stavia na reálnych analyzovaných dátach, pre zabezpečenie demonštrácie funkcií portálu.
        """
        if not deterministic_hits:
            return "Based on the provided rule engine data, no clinically significant flags or symptoms were detected in the current assessment."
            
        narrative_parts = ["**[MOCK AI NARRATIVE]**\nBased on the analysis from Layer 1 Deterministic Engine:\n"]
        
        # Ošetrime výpis podľa max severity
        max_severity = deterministic_hits.get("max_severity", 0)
        
        if max_severity >= 3:
            narrative_parts.append("The client presentation indicates **severe clinical risk** requiring immediate attention.")
        elif max_severity == 2:
            narrative_parts.append("The client presentation indicates **moderate to severe symptoms** warranting robust interventions.")
        elif max_severity == 1:
            narrative_parts.append("The client demonstrates **mild symptom elevation**.")
            
        hits = deterministic_hits.get("hits", [])
        if hits:
            narrative_parts.append("\n\n**Specific Rule Hits:**")
            for flag in hits:
                narrative_parts.append(f"\n- **{flag}**")
            
        return "".join(narrative_parts)
