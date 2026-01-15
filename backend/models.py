from sqlalchemy import Column, Integer, String, DateTime
from database import Base
import datetime

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_role = Column(String)
    company_name = Column(String)
    
    # Status: 'Applied', 'Shortlisted', 'Interview', 'Rejected', 'Offer'
    status = Column(String, default="Applied") 
    
    # Store the Job Description text to analyze gaps later
    job_description = Column(String) 
    
    # Link to the user's resume file (we will store the file path)
    resume_path = Column(String)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)