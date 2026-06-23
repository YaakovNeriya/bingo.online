"""
Greedy Nearest Neighbor sorting algorithm for customers based on shared items.

Sorts customers into a chain where consecutive customers share the most
common color_sku_ids, optimizing for batch picking/cutting efficiency.
"""

from typing import List, Dict, Any


def sort_customers_by_shared_items(customers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Sort customers using Greedy Nearest Neighbor based on shared color_sku_ids.

    Each customer dict must have a 'sku_ids' key containing a set of color_sku_id values.

    Algorithm:
    1. Find the pair with maximum pairwise overlap
       (tiebreak: prefer the pair where one member has the highest total network score)
    2. The member of the pair with higher total network score goes first
    3. From the last in chain, pick the unsorted customer with max overlap
    4. Repeat until all sorted
    """
    if len(customers) <= 1:
        return list(customers)

    n = len(customers)

    # Pre-compute total network scores for tiebreaking
    total_scores = []
    for i in range(n):
        score = sum(
            len(customers[i]['sku_ids'] & customers[j]['sku_ids'])
            for j in range(n) if j != i
        )
        total_scores.append(score)

    # Step 1: Find the pair with the highest pairwise overlap
    best_i, best_j = 0, 1
    best_overlap = -1
    best_tiebreak = -1

    for i in range(n):
        for j in range(i + 1, n):
            overlap = len(customers[i]['sku_ids'] & customers[j]['sku_ids'])
            tiebreak = max(total_scores[i], total_scores[j])
            if overlap > best_overlap or (overlap == best_overlap and tiebreak > best_tiebreak):
                best_overlap = overlap
                best_tiebreak = tiebreak
                best_i, best_j = i, j

    # The member of the pair with higher total network score goes first
    if total_scores[best_j] > total_scores[best_i]:
        best_i, best_j = best_j, best_i

    sorted_indices = [best_i, best_j]
    remaining = set(range(n)) - {best_i, best_j}

    # Step 2: Greedy nearest neighbor from the last in chain
    while remaining:
        last_sku_ids = customers[sorted_indices[-1]]['sku_ids']

        best_next = None
        best_next_overlap = -1
        best_next_tiebreak = -1

        for idx in remaining:
            overlap = len(last_sku_ids & customers[idx]['sku_ids'])
            tiebreak = total_scores[idx]
            if overlap > best_next_overlap or (overlap == best_next_overlap and tiebreak > best_next_tiebreak):
                best_next_overlap = overlap
                best_next_tiebreak = tiebreak
                best_next = idx

        sorted_indices.append(best_next)
        remaining.remove(best_next)

    return [customers[i] for i in sorted_indices]
