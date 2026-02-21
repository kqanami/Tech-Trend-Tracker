"""Machine Learning analyzer for sentiment and categorization — powered by OpenAI."""

import json
import logging
import re
import math
import statistics
from typing import Dict, List, Optional, Tuple
from textblob import TextBlob
from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared OpenAI client (lazy init)
# ---------------------------------------------------------------------------
_openai_client = None


def _get_openai_client():
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


class MLAnalyzer:
    """ML-based text analysis for articles and trends — OpenAI edition."""

    # Technology categories and keywords
    TECH_CATEGORIES = {
        'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'neural network',
                  'deep learning', 'nlp', 'computer vision', 'gpt', 'llm', 'transformer',
                  'diffusion', 'reinforcement learning', 'fine-tuning', 'rag', 'agent'],
        'Web Development': ['react', 'vue', 'angular', 'javascript', 'typescript', 'nextjs',
                           'nodejs', 'frontend', 'backend', 'fullstack', 'web', 'html', 'css',
                           'svelte', 'bun', 'deno', 'remix'],
        'DevOps': ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'github actions', 'terraform',
                  'ansible', 'cloud', 'aws', 'azure', 'gcp', 'deployment', 'gitops', 'platform engineering'],
        'Mobile': ['ios', 'android', 'flutter', 'react native', 'swift', 'kotlin',
                  'mobile app', 'app development', 'xcode'],
        'Data Science': ['data', 'analytics', 'visualization', 'pandas', 'numpy', 'jupyter',
                        'statistics', 'big data', 'etl', 'data engineering', 'spark', 'dbt'],
        'Blockchain': ['blockchain', 'crypto', 'bitcoin', 'ethereum', 'web3', 'nft',
                      'smart contract', 'defi', 'solidity'],
        'Security': ['security', 'cybersecurity', 'encryption', 'authentication',
                    'authorization', 'vulnerability', 'penetration testing', 'infosec',
                    'zero trust', 'soc', 'siem'],
        'Backend': ['database', 'api', 'rest', 'graphql', 'microservices', 'server',
                   'postgresql', 'mongodb', 'redis', 'kafka', 'grpc', 'event driven'],
        'Programming Languages': ['python', 'java', 'go', 'rust', 'c++', 'c#', 'ruby',
                                  'php', 'scala', 'elixir', 'zig', 'mojo'],
        'Quantum & Hardware': ['quantum', 'chip', 'semiconductor', 'gpu', 'tpu', 'fpga', 'silicon'],
    }

    # ---------------------------------------------------------------------------
    # Core NLP helpers (no API call required)
    # ---------------------------------------------------------------------------

    def analyze_sentiment(self, text: str) -> float:
        """Sentiment score from -1.0 (negative) to 1.0 (positive) via TextBlob."""
        try:
            if not text:
                return 0.0
            return round(TextBlob(text).sentiment.polarity, 3)
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return 0.0

    def categorize_text(self, text: str, title: str = "") -> str:
        """Keyword-based tech category classifier."""
        try:
            combined_text = f"{title} {title} {text}".lower()
            category_scores = {}
            for category, keywords in self.TECH_CATEGORIES.items():
                score = sum(combined_text.count(kw.lower()) for kw in keywords)
                if score > 0:
                    category_scores[category] = score
            if not category_scores:
                return 'General'
            return max(category_scores.items(), key=lambda x: x[1])[0]
        except Exception as e:
            logger.error(f"Categorization error: {e}")
            return 'General'

    def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """Extract top N keywords by frequency (stopword-filtered)."""
        try:
            if not text:
                return []
            STOP = {
                'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
                'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
                'its', 'their', 'they', 'we', 'our', 'new', 'use', 'using', 'used',
                'also', 'more', 'one', 'two', 'like', 'just', 'into',
            }
            words = re.findall(r'\b[a-z]{3,}\b', text.lower())
            freq: Dict[str, int] = {}
            for w in words:
                if w not in STOP:
                    freq[w] = freq.get(w, 0) + 1
            return [w for w, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:top_n]]
        except Exception as e:
            logger.error(f"Keyword extraction error: {e}")
            return []

    def predict_trend_score(self, mention_count: int, growth_rate: float,
                            sentiment: float = 0.0, time_decay: float = 1.0) -> float:
        """Trend score 0–100 using mentions, growth, sentiment, recency."""
        try:
            normalized_mentions = min(math.log10(mention_count + 1) / 3, 1.0) * 40
            growth_multiplier = 1.5 if growth_rate > 50 else 1.0
            normalized_growth = min(growth_rate / 100, 1.0) * 35 * growth_multiplier
            sentiment_multiplier = 1.2 if sentiment > 0 else 0.8
            normalized_sentiment = ((sentiment + 1) / 2) * 20 * sentiment_multiplier
            recency_bonus = time_decay * 5
            score = normalized_mentions + normalized_growth + normalized_sentiment + recency_bonus
            return round(min(score, 100), 2)
        except Exception as e:
            logger.error(f"Trend prediction error: {e}")
            return 0.0

    def analyze_trend_momentum(self, historical_scores: List[float]) -> Dict:
        """Momentum, direction, acceleration and volatility from history list."""
        try:
            if len(historical_scores) < 2:
                return {"momentum": 0.0, "direction": "stable", "acceleration": 0.0, "volatility": 0.0}
            recent = historical_scores[-7:] if len(historical_scores) >= 7 else historical_scores
            momentum = (recent[-1] - recent[0]) / len(recent) if len(recent) > 1 else 0
            direction = "rising" if momentum > 0.5 else ("falling" if momentum < -0.5 else "stable")
            if len(historical_scores) >= 3:
                old_momentum = (historical_scores[-2] - historical_scores[0]) / (len(historical_scores) - 1)
                acceleration = momentum - old_momentum
            else:
                acceleration = 0.0
            volatility = statistics.stdev(historical_scores) if len(historical_scores) > 1 else 0.0
            return {
                "momentum": round(momentum, 3),
                "direction": direction,
                "acceleration": round(acceleration, 3),
                "volatility": round(volatility, 3),
                "trend_strength": "strong" if abs(momentum) > 2 else "moderate" if abs(momentum) > 1 else "weak",
            }
        except Exception as e:
            logger.error(f"Momentum analysis error: {e}")
            return {"momentum": 0.0, "direction": "unknown", "acceleration": 0.0, "volatility": 0.0}

    # ---------------------------------------------------------------------------
    # OpenAI-powered analysis
    # ---------------------------------------------------------------------------

    _ANALYSIS_PROMPT = """\
You are a senior tech analyst. Analyze this tech article and return ONLY valid JSON — no markdown.

Title: {title}
Summary: {summary}
Content snippet: {content}

Return exactly this JSON shape:
{{
  "verdict": "2-3 sentence technical insight focused on core innovation, relevance for engineers, and long-term impact.",
  "key_signals": ["signal 1", "signal 2", "signal 3"],
  "impact_level": "High" | "Medium" | "Low",
  "hype_or_signal": "Signal" | "Hype" | "Mixed",
  "technical_depth": <integer 1-10>
}}

Rules:
- verdict: start directly with the insight — never say "This article"
- key_signals: max 4 short phrases, concrete technical takeaways
- impact_level: High = paradigm shift, Medium = solid improvement, Low = incremental
- hype_or_signal: Signal = mature/production-ready trend, Hype = speculative/marketing-heavy
- technical_depth: 1 = press release fluff, 10 = deep engineering content
"""

    def _openai_analyze(self, title: str, summary: str, content: str) -> Optional[Dict]:
        """Call GPT-4o-mini for structured analysis. Returns parsed dict or None."""
        try:
            client = _get_openai_client()
            prompt = self._ANALYSIS_PROMPT.format(
                title=title,
                summary=summary[:500],
                content=content[:1200],
            )
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=400,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content or "{}"
            result = json.loads(raw)
            # Validate required fields
            required = {"verdict", "key_signals", "impact_level", "hype_or_signal", "technical_depth"}
            if not required.issubset(result.keys()):
                return None
            return result
        except Exception as e:
            logger.warning(f"OpenAI analysis failed: {e}")
            return None

    def _fallback_analyze(self, title: str, category: str, sentiment: float,
                          keywords: List[str]) -> Dict:
        """Template-based fallback when OpenAI is unavailable."""
        import random
        sentiment_label = "Positive" if sentiment > 0.2 else "Negative" if sentiment < -0.2 else "Neutral"
        openings = {
            "Positive": [
                f"Promising developments detected in {category}.",
                f"Strong positive signals emerging in {category}.",
            ],
            "Negative": [
                f"Critical challenges identified in {category}.",
                f"This {category} report raises technical concerns.",
            ],
            "Neutral": [
                f"Standard update in the {category} domain.",
                f"Observation of steady-state metrics in {category}.",
            ],
        }
        category_insights = {
            'AI/ML': ["Implications for model scalability are significant.",
                      "Suggests improved inference efficiency.",
                      "Indicates a shift towards smaller, more efficient models."],
            'Security': ["Attack surface analysis recommended.",
                         "Zero-trust architecture alignment verification needed."],
            'Blockchain': ["Consensus mechanism optimization noted.",
                           "Layer-2 scaling solutions are a key factor."],
            'DevOps': ["Container orchestration complexity analysis.",
                       "Multi-region availability implications."],
        }
        opening = random.choice(openings.get(sentiment_label, openings["Neutral"]))
        kw_str = ", ".join(keywords[:2]) if keywords else "core architecture"
        context = f"Key technical vectors: {kw_str}."
        insight = random.choice(category_insights.get(category, [
            "Standard technical evolution pattern.",
            "Integration complexity estimated as moderate.",
        ]))
        verdict = f"{opening} {context} {insight}"
        impact = "High" if sentiment > 0.3 else ("Low" if sentiment < -0.2 else "Medium")
        return {
            "verdict": verdict,
            "key_signals": keywords[:3] if keywords else ["technology", "engineering", "development"],
            "impact_level": impact,
            "hype_or_signal": "Mixed",
            "technical_depth": 5,
        }

    def analyze_article(self, article_data: Dict) -> Dict:
        """Full article analysis: sentiment + category + keywords + OpenAI structured verdict."""
        title = article_data.get('title', '')
        summary = article_data.get('summary', '')
        content = article_data.get('content', '')
        text = f"{summary} {content}"

        sentiment = self.analyze_sentiment(text)
        category = self.categorize_text(text, title)
        keywords = self.extract_keywords(text)

        # --- AI Analysis (OpenAI primary, template fallback) ---
        structured = None
        if settings.OPENAI_API_KEY:
            structured = self._openai_analyze(title, summary, content)

        if structured is None:
            structured = self._fallback_analyze(title, category, sentiment, keywords)

        # Serialize structured result as JSON string for storage in technical_analysis column
        technical_analysis_json = json.dumps(structured, ensure_ascii=False)

        return {
            'sentiment_score': sentiment,
            'category': category,
            'keywords': keywords,
            'technical_analysis': technical_analysis_json,
        }

    # ---------------------------------------------------------------------------
    # Embeddings
    # ---------------------------------------------------------------------------

    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate 768-dim vector via OpenAI text-embedding-3-small (truncated from 1536)."""
        try:
            if not settings.OPENAI_API_KEY:
                return None
            client = _get_openai_client()
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000],
                dimensions=768,  # native truncation supported by the API
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return None
