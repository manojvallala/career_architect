from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base
import datetime

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    job_role = Column(String)
    match_score = Column(Integer)  # e.g., 85
    missing_skills = Column(Text)  # Stores the skills text
    ai_response = Column(Text)     # Stores the full report
    created_at = Column(DateTime, default=datetime.datetime.utcnow)