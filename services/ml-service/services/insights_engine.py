"""
Rule-based insights engine for player and match analysis
"""

import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class InsightsEngine:
    """
    Generate rule-based insights from player and team data
    """

    def __init__(self):
        self.form_trend_threshold = 0.5
        self.overplayed_threshold = 360  # minutes
        self.poor_form_threshold = 6.0  # rating
        self.injury_risk_threshold = 360  # minutes

    def generate_player_insights(self, player_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate insights for a player

        Args:
            player_data: Player statistics and history

        Returns:
            List of insight dictionaries
        """
        try:
            insights = []

            # Form trend analysis
            form_insight = self._check_form_trend(player_data)
            if form_insight:
                insights.append(form_insight)

            # Overplayed check
            overplayed_insight = self._check_overplayed(player_data)
            if overplayed_insight:
                insights.append(overplayed_insight)

            # Injury risk
            injury_insight = self._check_injury_risk(player_data)
            if injury_insight:
                insights.append(injury_insight)

            # Scoring streak
            streak_insight = self._check_scoring_streak(player_data)
            if streak_insight:
                insights.append(streak_insight)

            # Poor form
            poor_form_insight = self._check_poor_form(player_data)
            if poor_form_insight:
                insights.append(poor_form_insight)

            # Consistency
            consistency_insight = self._check_consistency(player_data)
            if consistency_insight:
                insights.append(consistency_insight)

            return insights
        except Exception as e:
            logger.error(f"Error generating player insights: {e}")
            return []

    def generate_match_narrative(
        self,
        prediction: Dict[str, float],
        home_team: Dict[str, Any],
        away_team: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate narrative from match prediction

        Args:
            prediction: Match prediction probabilities
            home_team: Home team data
            away_team: Away team data

        Returns:
            Dictionary with narrative information
        """
        try:
            hw = prediction.get('homeWin', 0)
            aw = prediction.get('awayWin', 0)
            dr = prediction.get('draw', 0)
            diff = abs(hw - aw)

            # Generate outlook
            if diff < 0.1:
                outlook = "Evenly matched contest expected"
            elif hw > aw:
                outlook = f"{home_team.get('name', 'Home')} are favourites at home"
            else:
                outlook = f"{away_team.get('name', 'Away')} are the stronger side"

            # Extract key factors
            factors = []
            if home_team.get('injuries', 0) > 2:
                factors.append(
                    f"{home_team.get('name')} missing {home_team.get('injuries')} players"
                )
            if away_team.get('injuries', 0) > 2:
                factors.append(
                    f"{away_team.get('name')} missing {away_team.get('injuries')} players"
                )

            return {
                "outlook": outlook,
                "factors": factors,
                "summary": f"Home Win {hw:.0%} | Draw {dr:.0%} | Away Win {aw:.0%}"
            }
        except Exception as e:
            logger.error(f"Error generating match narrative: {e}")
            return {}

    def _check_form_trend(self, player_data: Dict[str, Any]) -> Dict[str, Any] | None:
        """Check if player form is improving or declining"""
        form_history = player_data.get('formHistory', [])
        if len(form_history) < 6:
            return None

        recent_ratings = [m.get('rating', 7) for m in form_history[-3:]]
        previous_ratings = [m.get('rating', 7) for m in form_history[-6:-3]]

        recent_avg = sum(recent_ratings) / len(recent_ratings)
        previous_avg = sum(previous_ratings) / len(previous_ratings)
        diff = recent_avg - previous_avg

        if diff < -self.form_trend_threshold:
            return {
                "type": "form_decline",
                "severity": "warning",
                "message": f"Form declining - Last 3 avg: {recent_avg:.1f} vs {previous_avg:.1f}"
            }
        elif diff > self.form_trend_threshold:
            return {
                "type": "form_improvement",
                "severity": "positive",
                "message": f"Form improving - Last 3 avg: {recent_avg:.1f} vs {previous_avg:.1f}"
            }

        return None

    def _check_overplayed(self, player_data: Dict[str, Any]) -> Dict[str, Any] | None:
        """Check if player is overplayed"""
        form_history = player_data.get('formHistory', [])
        if len(form_history) < 5:
            return None

        recent_minutes = sum(m.get('minutes', 0) for m in form_history[-5:])

        if recent_minutes > self.overplayed_threshold:
            return {
                "type": "overplayed",
                "severity": "warning",
                "message": f"Overplayed ({recent_minutes} mins in last 5 matches) - rotation recommended"
            }

        return None

    def _check_injury_risk(self, player_data: Dict[str, Any]) -> Dict[str, Any] | None:
        """Check injury risk (workload + history)"""
        form_history = player_data.get('formHistory', [])
        injury_history = player_data.get('injuryHistory', [])

        if not injury_history or len(form_history) < 5:
            return None

        recent_minutes = sum(m.get('minutes', 0) for m in form_history[-5:])

        if recent_minutes > self.injury_risk_threshold:
            return {
                "type": "injury_risk",
                "severity": "danger",
                "message": "Elevated injury risk: high workload + injury history"
            }

        return None

    def _check_scoring_streak(self, player_data: Dict[str, Any]) -> Dict[str, Any] | None:
        """Check if player is on a scoring streak"""
        form_history = player_data.get('formHistory', [])
        if len(form_history) < 3:
            return None

        recent_goals = sum(m.get('goals', 0) for m in form_history[-3:])

        if recent_goals >= 2:
            return {
                "type": "scoring_streak",
                "severity": "positive",
                "message": f"On a scoring streak - {recent_goals} goals in last 3 matches"
            }

        return None

    def _check_poor_form(self, player_data: Dict[str, Any]) -> Dict[str, Any] | None:
        """Check if player is in poor form"""
        form_history = player_data.get('formHistory', [])
        if len(form_history) < 5:
            return None

        recent_ratings = [m.get('rating', 7) for m in form_history[-5:]]
        avg_rating = sum(recent_ratings) / len(recent_ratings)

        if avg_rating < self.poor_form_threshold:
            return {
                "type": "poor_form",
                "severity": "warning",
                "message": f"Struggling for form - avg rating {avg_rating:.1f} over last 5"
            }

        return None

    def _check_consistency(self, player_data: Dict[str, Any]) -> Dict[str, Any] | None:
        """Check player consistency"""
        form_history = player_data.get('formHistory', [])
        if len(form_history) < 5:
            return None

        recent_ratings = [m.get('rating', 7) for m in form_history[-5:]]
        variance = np.var(recent_ratings)

        if variance < 0.25:
            return {
                "type": "consistency",
                "severity": "positive",
                "message": "Highly consistent performer"
            }

        return None


import numpy as np
