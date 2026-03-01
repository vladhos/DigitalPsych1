import logging
import ast
import operator
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Very strict operator whitelist for safe eval
OPERATORS = {
    ast.And: operator.and_, ast.Or: operator.or_,
    ast.Gt: operator.gt, ast.Lt: operator.lt,
    ast.GtE: operator.ge, ast.LtE: operator.le,
    ast.Eq: operator.eq, ast.NotEq: operator.ne
}

class SafeEvaluator(ast.NodeVisitor):
    def __init__(self, context: Dict[str, float]):
        self.context = context

    def visit_Compare(self, node):
        left = self.visit(node.left)
        right = self.visit(node.comparators[0])
        op = type(node.ops[0])
        if op in OPERATORS:
            return OPERATORS[op](left, right)
        raise ValueError(f"Operator {op} not allowed")

    def visit_BoolOp(self, node):
        # We only handle And/Or for simplicity
        if isinstance(node.op, ast.And):
            return all(self.visit(val) for val in node.values)
        if isinstance(node.op, ast.Or):
            return any(self.visit(val) for val in node.values)
        raise ValueError(f"Boolean Operator {type(node.op)} not allowed")

    def visit_Name(self, node):
        if node.id in self.context:
            return self.context[node.id]
        raise ValueError(f"Variable {node.id} not found in scope")

    def visit_Constant(self, node):
        return node.value

def evaluate_condition_safely(expression: str, context: Dict[str, float]) -> bool:
    """ Evaluate strings like 'Depression_Scale > 20 and Anxiety_Scale > 15' securely. """
    try:
        tree = ast.parse(expression, mode='eval')
        evaluator = SafeEvaluator(context)
        return bool(evaluator.visit(tree.body))
    except Exception as e:
        logger.error(f"Rule evaluation failed for expression '{expression}': {str(e)}")
        return False

class RuleEngine:
    """
    Deterministic Synthesis Layer 1.
    Processes feature vectors through predefined clinical rulepacks.
    """
    
    @staticmethod
    def evaluate_rules(feature_vectors: List[Dict[str, Any]], rules: List[Any]) -> Dict[str, Any]:
        # Build evaluation context (variable scope)
        # e.g., {'Depression_Scale': 25.0, 'Anxiety_Scale': 12.0}
        context = {fv['feature_name'].replace(" ", "_"): fv['raw_score'] for fv in feature_vectors}
        
        hits = []
        max_severity = 0
        recommendations = []
        
        for rule in rules:
            if evaluate_condition_safely(rule.condition_expression, context):
                hits.append(rule.hit_flag)
                if rule.severity > max_severity:
                    max_severity = rule.severity
                if rule.recommendation:
                    recommendations.append(rule.recommendation)
                    
        return {
            "hits": hits,
            "max_severity": max_severity,
            "recommendations": list(set(recommendations)),
            "summary": f"Detected {len(hits)} DB clinical flags. Max severity: {max_severity}."
        }
        
    @staticmethod
    def evaluate_schema_interpretations(feature_vectors: List[Dict[str, Any]], interpretations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluates clinical thresholds from the imported JSON schema.
        Assumes the thresholds apply to 'Total Score' or the highest dimension if 'Total Score' is missing.
        """
        hits = []
        recommendations = []
        
        # Find the target score to evaluate against
        target_score = 0.0
        for fv in feature_vectors:
            if fv["feature_name"] == "Total Score":
                target_score = fv["raw_score"]
                break
        else:
            if feature_vectors:
                # Fallback: sum all raw scores
                target_score = sum(fv["raw_score"] for fv in feature_vectors)
                
        for interp in interpretations:
            min_s = interp.get("min_score", 0)
            max_s = interp.get("max_score", float('inf'))
            if min_s <= target_score <= max_s:
                if interp.get("flag"):
                    hits.append(interp["flag"])
                if interp.get("recommendation"):
                    recommendations.append(interp["recommendation"])
                    
        return {
            "hits": hits,
            "max_severity": 3 if hits else 0, # Defaulting to severity 3 for schema triggers
            "recommendations": list(set(recommendations)),
            "summary": f"Schema triggered {len(hits)} clinical flags based on score {target_score}."
        }
