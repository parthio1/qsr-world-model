
import time
import functools
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable, InternalServerError
from src.utils.logger import setup_logger

logger = setup_logger(__name__)

def retry_llm_call(max_retries=2, initial_delay=2.0, backoff_factor=2.0):
    """
    Decorator to retry LLM calls on 429 Resource Exhausted or 503 Service Unavailable.
    Uses exponential backoff.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            delay = initial_delay
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    error_str = str(e).lower()
                    if "429" in error_str or "resource exhausted" in error_str or "quota" in error_str or "too many requests" in error_str:
                        logger.warning(f"Rate limit (429) hit on attempt {attempt+1}/{max_retries}. Retrying in {delay:.1f}s...")
                        time.sleep(delay)
                        delay *= backoff_factor
                        # Cap delay at 60s
                        delay = min(delay, 60.0)
                    elif "503" in error_str or "service unavailable" in error_str:
                        logger.warning(f"Service unavailable (503) on attempt {attempt+1}/{max_retries}. Retrying in {delay:.1f}s...")
                        time.sleep(delay)
                        delay *= backoff_factor
                    else:
                        raise e
            
            logger.error(f"Failed after {max_retries} retries.")
            raise Exception(f"Failed after {max_retries} retries due to rate limits or service errors.")
        return wrapper
    return decorator
