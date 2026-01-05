"""Configuration settings for QSR World Model"""

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    """Application settings"""
    
    # Google API Configuration
    google_api_key: str
    google_project_id: Optional[str] = None
    google_location: str = "us-central1"
    google_genai_use_vertexai: bool = False
    use_experimental: bool = False
    
    # Model Configuration
    gemini_model: str = "gemini-3-flash-preview"
    temperature: float = 0.5
    max_output_tokens: int = 8192
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8081
    api_reload: bool = True
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/qsr_world_model.log"
    
    # Storage
    data_dir: str = "./data"
    results_dir: str = "./data/results"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings()

# Create directories if they don't exist
os.makedirs(settings.data_dir, exist_ok=True)
os.makedirs(settings.results_dir, exist_ok=True)
os.makedirs("logs", exist_ok=True)
