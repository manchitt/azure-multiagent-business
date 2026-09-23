from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class QueryRequest(BaseModel):
    query: str = Field(..., description="User's business inquiry or strategic prompt")
    preset_id: Optional[str] = Field(None, description="Preset scenario ID if selected")
    document_ids: Optional[List[str]] = Field(default_factory=list, description="IDs of documents selected for grounding")
    focus_areas: Optional[List[str]] = Field(default_factory=list, description="Specific business angles: competitors, financials, roadmap")


class A2AMessage(BaseModel):
    id: str
    timestamp: str
    sender_id: str
    sender_name: str
    recipient_id: str
    recipient_name: str
    action_type: str  # DELEGATE, SEARCH, GROUND_RETRIEVAL, ANALYZE, STRATEGIZE, SYNTHESIZE
    summary: str
    content: str
    tokens_used: int = 0
    latency_ms: int = 0
    tools_invoked: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AgentSpec(BaseModel):
    id: str
    name: str
    role: str
    icon: str
    color: str
    description: str
    model: str = "GPT-4.1-mini"
    system_prompt: str
    tools: List[str]
    temperature: float = 0.2
    status: str = "Ready"


class GroundingDocument(BaseModel):
    id: str
    name: str
    size_kb: int
    category: str
    summary: str
    vector_indexed: bool = True
    chunks_count: int = 12


class TelemetryStats(BaseModel):
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    estimated_cost_usd: float
    total_latency_ms: int
    a2a_handoff_count: int
    grounding_citations_count: int
    model_name: str = "GPT-4.1-mini"


class BusinessReport(BaseModel):
    report_id: str
    timestamp: str
    query: str
    executive_summary: str
    research_findings: Dict[str, Any]
    analyst_breakdown: Dict[str, Any]
    strategic_roadmap: Dict[str, Any]
    citations: List[Dict[str, str]]
    telemetry: TelemetryStats
    a2a_trace: List[A2AMessage]
