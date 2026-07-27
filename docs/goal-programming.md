# Goal Programming — Presentation & Formulation

Canada Relocation DSS

---

## Presentation slides

> Screenshot each section below, or open this file in Markdown Preview for a clean slide-ready view.

---

### Slide 1 — What is Goal Programming?

**Goal Programming (GP)** is a multi-criteria decision method that sets a **target for each objective**, then **minimizes how far the chosen option falls short** of those targets.

Instead of maximizing one blended score, it asks:

> *Which option comes closest to meeting all of my goals?*

**Shortfall on goal \(i\) for city \(c\):**

\[
d_i^-(c) = \max\bigl(0,\; t_i - s_i(c)\bigr)
\]

| Symbol | Meaning |
|--------|---------|
| \(t_i\) | target for factor \(i\) |
| \(s_i(c)\) | city \(c\)'s normalized score on factor \(i\) |
| \(d_i^-(c)\) | shortfall (only undershooting counts) |

Meeting or beating a goal → shortfall = 0.

---

### Slide 2 — Why we chose Goal Programming

| Reason | Explanation |
|--------|-------------|
| **Matches how people decide** | Movers think in targets (“rent ≤ $2,000”, “very walkable”), not abstract weights alone. |
| **Handles conflicting goals** | Affordability vs. income, safety vs. walkability — GP measures shortfalls instead of hiding trade-offs in one score. |
| **Fits our UI naturally** | Must Have / Nice to Have / Bonus map directly onto GP priority tiers. |
| **Recognized OR method** | Standard multi-criteria technique (Charnes & Cooper) — stronger framing than an ad-hoc weighted sum. |

**vs. weighted sum:** a weighted model lets excellence on one factor fully compensate for failure on another. GP is **satisficing** — get to the goal; extra overshoot does not rescue a miss elsewhere (especially in the preemptive form).

---

### Slide 3 — The two formulations

#### A. Weighted (Archimedean)

\[
\min_c \; Z(c) = \sum_{i \in R} \frac{w_i}{W} \cdot d_i^-(c)
\]

One objective. Misses are weighted by priority and added. **Trade-offs allowed.**

#### B. Preemptive (Lexicographic)

\[
\min_c \; \mathbf{D}(c) = \bigl(D_1(c),\; D_2(c),\; D_3(c)\bigr)
\]

Vector minimization in lexicographic order: Must Have first, then Nice to Have, then Bonus. **No cross-tier trade-offs.**

**Tier shortfalls:**

\[
D_k(c) = \sum_{i \in T_k} d_i^-(c)
\quad\text{where}\quad
T_1 = \text{Must Have},\;
T_2 = \text{Nice to Have},\;
T_3 = \text{Bonus}
\]

---

### Slide 4 — Preemptive GP (detail)

**Decision:** choose city \(c\).  
**Objective:** minimize shortfalls **tier by tier**.

**1. Shortfall**

\[
d_i^-(c) = \max\bigl(0,\; t_i - s_i(c)\bigr)
\]

**2. Tier total**

\[
D_k(c) = \sum_{i \in T_k} d_i^-(c)
\]

**3. Vector minimization** (lexicographic order on the shortfall vector)

\[
\min_c \; \mathbf{D}(c) = \bigl(D_1(c),\; D_2(c),\; D_3(c)\bigr)
\]

Compare \(D_1\) first; only break ties with \(D_2\), then \(D_3\).

---

## Full mathematical formulation

### Shared definitions

- \(i \in I\): the 9 factors. \(R \subseteq I\): ranked (selected) factors, partitioned into tiers \(T_1\) (Must Have), \(T_2\) (Nice to Have), \(T_3\) (Bonus).
- \(s_i(c) \in [0,100]\): city \(c\)'s normalized score on factor \(i\) (higher = better).
- \(t_i \in [0,100]\): the user’s goal for factor \(i\), mapped onto the same 0–100 scale.
- \(w_i \ge 0\): the tier weight of factor \(i\), with \(W = \sum_{i \in R} w_i\).

### Goal constraint (deviation variables)

For every ranked factor \(i\):

\[
s_i(c) + d_i^-(c) - d_i^+(c) = t_i,
\quad d_i^-,\; d_i^+ \ge 0,
\quad d_i^- \cdot d_i^+ = 0
\]

Since higher is always better, only the shortfall is unwanted:

\[
d_i^-(c) = \max\bigl(0,\; t_i - s_i(c)\bigr)
\quad\text{for } i \in R;
\quad d_i^-(c) = 0 \text{ otherwise.}
\]

---

### A. Weighted (Archimedean) goal programming

Minimize the weighted sum of shortfalls:

\[
\min_c \; Z(c) = \sum_{i \in R} \frac{w_i}{W} \cdot d_i^-(c)
\]

Reported goal-attainment score:

\[
A(c) = 100 - Z(c)
\]

Cities ranked by largest \(A(c)\) (equivalently, smallest \(Z(c)\)). Tiers trade off: a big win on lower-priority goals can offset a small miss on a Must Have.

---

### B. Preemptive (lexicographic) goal programming

Total shortfall within each priority tier:

\[
D_k(c) = \sum_{i \in T_k} d_i^-(c), \qquad k = 1,2,3
\]

Minimize the shortfall vector in lexicographic order:

\[
\min_c \; \mathbf{D}(c) = \bigl(D_1(c),\; D_2(c),\; D_3(c)\bigr)
\]

City \(a\) ranks ahead of city \(b\) iff there is a tier \(k\) with:

\[
D_j(a) = D_j(b) \;\forall\, j < k
\quad\text{and}\quad
D_k(a) < D_k(b).
\]

So \(T_2\) only matters among cities tied on \(T_1\), and \(T_3\) only among cities tied on \(T_1\) and \(T_2\). A missed higher-priority tier can never be compensated by a lower one.
