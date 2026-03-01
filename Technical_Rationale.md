# DigitalPsych: Technical Rationale

This document outlines the core architectural decisions made for the **DigitalPsych** platform and asserts why they fulfill the requirements of scalability, explainability, and safety in a psychological clinical setting.

## 1. Safety and Ethics First: The Two-Layer Synthesis Model
The most significant architectural decision is the strict separation between deterministic scoring and AI augmentation. 
* **Layer 1 (The Rule Engine):** Psychological screening is built on rigorously validated models (e.g., PHQ-9, GAD-7). Our custom AST-based `rule_engine.py` securely evaluates client feature vectors against hardcoded Boolean logic defined in `Rulepack` schemas. This guarantees that clinical flags are **100% deterministic** and immune to hallucination.
* **Layer 2 (AI Augmentation):** The `ai_synthesis.py` service only functions as an *interpreter* of Layer 1. By feeding purely mathematical vectors and explicit Boolean hits to an LLM enclosed by an aggressively constrained system prompt (Temperature 0.2), we ensure the AI acts as a sophisticated text-summarizer, not a diagnostician. 

## 2. Explainability
Clinical software must provide an audit trail for every conclusion.
* Our `Result` model maps 1:1 with `FeatureVector` and `Synthesis` models.
* When a clinician views a client's profile, the **Deterministic Flags** are explicitly rendered mapping to the precise metric that triggered them (e.g., "Somatic symptom elevation (Score > 15)"). 
* We rely on `AuditLog` models mapped via `organization_id` and `user_id` to strictly trace any systemic changes to rulepacks or manual overrides by a clinician, fulfilling B2B medical compliance foundations.

## 3. Scalability and Extensibility
Rather than hardcoding assessments into the codebase, we abstracted them into `AssessmentTemplate` and `AssessmentVersion` entities holding declarative JSON/YAML schemas.
* **Agility:** A clinical team can deploy a new 50-question survey with complex reverse-scored items strictly through a database insert, without touching Python code.
* **API-First FastAPI:** FastAPI leverages Pydantic for profound input validation and asynchronous endpoints, making it highly concurrent and perfectly suited for microservice architecture if the user base grows.
* **Dockerized Environments:** Providing `docker-compose` encapsulating Postgres, React/TypeScript, and Python immediately removes "works on my machine" friction, allowing horizontal scaling across orchestration layers (like Kubernetes).

## 4. Professional B2B Aesthetic
The frontend purposefully avoids consumer "app" aesthetics. Utilizing Vite, React, TailwindCSS, and `lucide-react`, the dashboard is muted, densely informational, and relies on strict visual hierarchy (slate-gray foundations with high-contrast semantic alerts like Rose and Emerald for severity signaling). The integration of `recharts` supplies seamless, recognizable longitudinal data plotting vital for session-to-session progression tracking.

## Conclusion
DigitalPsych establishes a framework that treats clinical evaluation with the necessary rigor via strict deterministic rule engines while offering optional modern affordances through securely sandboxed AI integration.
