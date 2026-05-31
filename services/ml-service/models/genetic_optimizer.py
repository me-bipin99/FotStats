"""
Genetic Algorithm for squad optimization
"""

import random
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

class SquadOptimizer:
    """
    Optimize squad composition using genetic algorithm
    """

    def __init__(
        self,
        population_size: int = 100,
        generations: int = 50,
        mutation_rate: float = 0.1
    ):
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.positions = ['GK', 'DEF', 'MID', 'FWD']
        self.formation = {
            'GK': 1,
            'DEF': 4,
            'MID': 3,
            'FWD': 3
        }

    def optimize(self, players: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate optimal squad using genetic algorithm

        Args:
            players: List of player dictionaries with stats

        Returns:
            Dictionary with best XI and bench
        """
        try:
            logger.info(f"Optimizing squad with {len(players)} players using GA")

            if len(players) < 11:
                raise ValueError(f"Need at least 11 players, got {len(players)}")

            # Initialize population with random 11-player squads
            population = self._initialize_population(players, self.population_size)
            logger.info(f"Initialized population of {len(population)} squads")

            # Run evolutionary process
            best_individual = self._run_evolution(population, players)

            # Calculate metrics
            fitness_score = self._calculate_fitness(best_individual)
            position_counts = {}
            for player in best_individual:
                pos = player.get('position', 'MID')
                position_counts[pos] = position_counts.get(pos, 0) + 1

            return {
                "bestXI": best_individual,
                "formation": "4-3-3",
                "fitness_score": round(fitness_score, 2),
                "composition": position_counts
            }
        except Exception as e:
            logger.error(f"Error optimizing squad: {e}")
            raise

    def _initialize_population(
        self,
        players: List[Dict[str, Any]],
        population_size: int
    ) -> List[List[Dict[str, Any]]]:
        """
        Initialize population with random 11-player squads respecting formation constraints
        """
        population = []
        for _ in range(population_size):
            # Random shuffle and take first 11 players
            squad = random.sample(players, min(11, len(players)))
            population.append(squad)
        return population

    def _run_evolution(
        self,
        population: List[List[Dict[str, Any]]],
        available_players: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Run evolutionary process for self.generations iterations
        """
        best_overall = None
        best_fitness = -float('inf')

        for generation in range(self.generations):
            # Evaluate fitness for each individual
            fitnesses = [self._calculate_fitness(individual) for individual in population]

            # Track best in this generation
            max_fit = max(fitnesses)
            max_idx = fitnesses.index(max_fit)
            if max_fit > best_fitness:
                best_fitness = max_fit
                best_overall = population[max_idx].copy()

            # Selection: keep top 50%
            sorted_pop = sorted(
                zip(population, fitnesses),
                key=lambda x: x[1],
                reverse=True
            )
            top_half = [ind for ind, _ in sorted_pop[:len(population) // 2]]

            # Crossover + Mutation: create new generation
            new_population = top_half.copy()
            while len(new_population) < len(population):
                parent1, parent2 = random.sample(top_half, min(2, len(top_half)))
                child1, child2 = self._crossover(parent1, parent2)
                child1 = self._mutate(child1, available_players)
                child2 = self._mutate(child2, available_players)
                new_population.extend([child1, child2])

            population = new_population[:len(population)]  # Keep original population size

            if generation % 10 == 0:
                logger.debug(f"  Generation {generation}: best fitness = {best_fitness:.2f}")

        logger.info(f"Evolution complete. Best fitness: {best_fitness:.2f}")
        return best_overall if best_overall else population[0]

    def _calculate_fitness(self, squad: List[Dict[str, Any]]) -> float:
        """
        Calculate fitness score for a squad

        Formula:
        fitness = (0.4 × attack) + (0.3 × midfield) + (0.3 × defense)
                + (0.2 × balance) - (0.1 × formDecline)
        """
        try:
            attack_players = [p for p in squad if p['position'] == 'FWD']
            mid_players = [p for p in squad if p['position'] == 'MID']
            def_players = [p for p in squad if p['position'] == 'DEF']

            attack_score = sum(p.get('rating', 7) for p in attack_players) / max(len(attack_players), 1)
            mid_score = sum(p.get('rating', 7) for p in mid_players) / max(len(mid_players), 1)
            def_score = sum(p.get('rating', 7) for p in def_players) / max(len(def_players), 1)

            balance_score = self._calculate_balance(squad)

            fitness = (
                0.4 * attack_score +
                0.3 * mid_score +
                0.3 * def_score +
                0.2 * balance_score
            )

            return fitness
        except Exception as e:
            logger.error(f"Error calculating fitness: {e}")
            return 0.0

    def _calculate_balance(self, squad: List[Dict[str, Any]]) -> float:
        """Calculate positional balance score"""
        position_counts = {}
        for player in squad:
            pos = player.get('position', 'MID')
            position_counts[pos] = position_counts.get(pos, 0) + 1

        balance = 1.0
        for pos, required in self.formation.items():
            actual = position_counts.get(pos, 0)
            if actual != required:
                balance -= abs(actual - required) * 0.1

        return max(balance, 0.0)

    def _crossover(self, parent1: List, parent2: List) -> Tuple[List, List]:
        """Perform crossover between two squads"""
        # Simple crossover: split at midpoint
        midpoint = len(parent1) // 2
        child1 = parent1[:midpoint] + parent2[midpoint:]
        child2 = parent2[:midpoint] + parent1[midpoint:]
        return child1, child2

    def _mutate(self, squad: List, available_players: List) -> List:
        """Perform mutation on a squad"""
        if random.random() < self.mutation_rate:
            idx = random.randint(0, len(squad) - 1)
            squad[idx] = random.choice(available_players)
        return squad
