import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ScoringEngine:
    """
    Deterministically scores raw responses against an Assessment Version schema.
    
    Expected schema format matching TemplateImportRequest:
    {
        "template_metadata": {...},
        "questions": [...],
        "scoring_logic": {
            "scale": "1-5",
            "reverse_items": ["q1", "q4"],
            "dimensions": {"Extraversion": ["1", "2"], "Total": ["1", "2", ...]},
            "interpretations": [...]
        }
    }
    """
    
    @staticmethod
    def process_responses(schema_def: Dict[str, Any], raw_answers: Dict[str, Any]) -> List[Dict[str, Any]]:
        scoring_logic = schema_def.get("scoring_logic", {})
        scale_info = scoring_logic.get("scale", "1-5")
        try:
            if isinstance(scale_info, dict):
                min_val = float(scale_info.get("min", 1))
                max_val = float(scale_info.get("max", 5))
            else:
                min_val, max_val = map(float, str(scale_info).split("-"))
        except (ValueError, AttributeError):
            min_val, max_val = 1.0, 5.0
            
        # CRITICAL: normalize all IDs to str to handle both integer and string IDs (BFI-2/BES have int IDs)
        reverse_items = set(str(rid) for rid in scoring_logic.get("reverse_items", []))
        raw_dimensions = scoring_logic.get("dimensions", {})
        dimensions = {
            dim_name: [str(qid) for qid in q_ids]
            for dim_name, q_ids in raw_dimensions.items()
        }
        
        # Calculate scores for each dimension
        features = {dim_name: 0.0 for dim_name in dimensions.keys()}
        
        # Note: If no dimensions are defined, we fallback to a "Total Score"
        if not dimensions:
             questions = schema_def.get("questions", [])
             all_q_ids = [str(q["id"]) for q in questions]
             dimensions = {"Total Score": all_q_ids}
             features = {"Total Score": 0.0}

        # First, process raw scores to actual scores (handling reverse)
        processed_scores = {}
        for q_id, raw_val_str in raw_answers.items():
            try:
                val = float(raw_val_str)
            except (ValueError, TypeError):
                continue
            
            q_id_str = str(q_id)
            if q_id_str in reverse_items:
                # Reverse scoring: (min + max) - val
                val = (min_val + max_val) - val
                
            processed_scores[q_id_str] = val
            
        # Distribute scores into dimensions
        for dim_name, q_ids in dimensions.items():
            for q_id in q_ids:
                if q_id in processed_scores:
                    features[dim_name] += processed_scores[q_id]
                
        # Format for FeatureVector models
        feature_vectors = []
        for dim_name, score in features.items():
            # Normalize score: (raw - min_possible) / (max_possible - min_possible)
            questions_in_dim = dimensions.get(dim_name, [])
            n_items = len(questions_in_dim)
            if n_items > 0:
                min_possible = min_val * n_items
                max_possible = max_val * n_items
                range_val = max_possible - min_possible
                normalized = (score - min_possible) / range_val if range_val > 0 else 0.0
            else:
                normalized = None
                
            feature_vectors.append({
                "feature_name": dim_name,
                "raw_score": score,
                "normalized_score": round(normalized, 4) if normalized is not None else None
            })
            
        return feature_vectors
