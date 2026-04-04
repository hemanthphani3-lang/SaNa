import requests
from bs4 import BeautifulSoup
import logging
import socket

logger = logging.getLogger("Groot.InternetService")

class InternetService:
    @staticmethod
    def is_online(host="8.8.8.8", port=53, timeout=3):
        """Checks if the device has an active internet connection by pinging Google DNS."""
        try:
            socket.setdefaulttimeout(timeout)
            socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect((host, port))
            return True
        except socket.error:
            return False

    @staticmethod
    def search_live_info(query: str):
        """Scrapes DuckDuckGo HTML with robust browser-mimicking headers."""
        if not InternetService.is_online():
            return None

        # DuckDuckGo HTML version (Resilient to JS blocking)
        url = "https://html.duckduckgo.com/html/"
        params = {"q": query}
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://duckduckgo.com/",
            "Upgrade-Insecure-Requests": "1"
        }

        try:
            logger.info(f"🌍 Triggering Hybrid Search: {query}")
            # Use a session to persist cookies if needed
            with requests.Session() as session:
                response = session.get(url, params=params, headers=headers, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'lxml')
                # Targeted search result extraction
                results = soup.select(".result")
                
                snippets = []
                for res in results[:3]:
                    t_link = res.select_one(".result__a")
                    s_body = res.select_one(".result__snippet")
                    
                    if t_link and s_body:
                        # Return clean text snippets for AI context
                        snippets.append(f"Result: {t_link.get_text()} | Description: {s_body.get_text()}")
                
                if not snippets:
                    logger.warning("Hybrid Search returned zero results (Blocked or empty).")
                    return None
                    
                return "\n\n".join(snippets)
                
        except Exception as e:
            logger.error(f"Hybrid Search Unsuccessful: {str(e)}")
            return None
