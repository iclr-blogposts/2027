---
layout: distill
title: "The Linear Algebra of Long Context: What Recurrent Sequence Models Remember, Forget, and Overwrite"
description: "This post examines scalar forgetting, directional memory updates, and simplified linear test-time training through a common matrix-state framework. Controlled associative-recall experiments illustrate why an exact local overwrite does not guarantee better aggregate retrieval."
date: 2027-04-30
future: true
htmlwidgets: true
hidden: true
authors:
  - name: Anonymous
bibliography: 2027-04-30-duality-of-sequence-models.bib
toc:
  - name: The quadratic wall and separate paradigms
  - name: Rank-one associative memory
  - name: Structured state-space duality
  - name: Scalar retention and capacity
  - name: Delta-rule directional edits
  - name: Chunkwise parallelization
  - name: Stability and state dynamics
  - name: Test-time training beyond linear memory
  - name: Controlled associative recall experiments
  - name: Reference implementation
  - name: Limitations and next steps
---

<!-- WORKING DRAFT FOR AUTHOR REVIEW. Original supplied manuscript retained where possible; AI-assisted fact corrections, reference formatting, code and scientific figures. Author must confirm the prose satisfies the track's predominantly-human-written requirement, review all derivations and interpretations, replace any AI-authored text as needed, and remove this comment before formal submission. -->

## The quadratic wall and separate paradigms

For nearly a decade, causal Softmax Attention <d-cite key="vaswani2017"></d-cite> has been a widely used backbone of frontier sequence modeling. Its retrieval mechanism retains explicit token-level keys and values: at every token $$t$$, the model retains the complete history of past keys $$\{\mathbf{k}_s\}_{s=1}^t$$ and values $$\{\mathbf{v}_s\}_{s=1}^t$$ in a growing key-value (KV) cache in standard full-cache inference, computing an exact, data-dependent convex combination over all prior tokens. Yet this exactness comes at an $$\mathcal{O}(T^2)$$ prefill compute cost and an $$\mathcal{O}(T)$$ per-token key-value read cost for a fixed head dimension during autoregressive decoding.

Reading the literature on recurrent sequence mixing in isolation can obscure connections between its different mathematical traditions. Practitioners frequently ask: *Are state-space models fundamentally different from linear attention? Why did Mamba-2 suddenly look like a masked Transformer? And why can some $$\mathcal{O}(T)$$ recurrent models struggle with associative retrieval?*

<!-- Author: articulate the three traditions and the specific original contribution using your own words. Cite prior equivalences explicitly. -->
<d-cite key="katharopoulos2020,schlag2021,dao2024,yang2025gated,sun2025"></d-cite>

## Rank-one associative memory

Consider an input sequence of length $$T$$. At each token step $$t \in \{1, \dots, T\}$$, linear projections produce a query $$\mathbf{q}_t \in \mathbb{R}^{d_k}$$, a key $$\mathbf{k}_t \in \mathbb{R}^{d_k}$$, and a value $$\mathbf{v}_t \in \mathbb{R}^{d_v}$$.

In standard **Causal Softmax Attention**, the output $$\mathbf{o}_t \in \mathbb{R}^{d_v}$$ is a normalized exponential similarity lookup over all past pairs $$\{(\mathbf{k}_s, \mathbf{v}_s)\}_{s=1}^t$$:

$$\mathbf{o}_t = \sum_{s=1}^{t} \frac{\exp(\mathbf{q}_t^\top \mathbf{k}_s / \sqrt{d_k})}{\sum_{j=1}^{t} \exp(\mathbf{q}_t^\top \mathbf{k}_j / \sqrt{d_k})} \, \mathbf{v}_s$$

To compress this growing $$\mathcal{O}(T \cdot d)$$ KV-cache into a **constant-size matrix state** $$\mathbf{S}_t \in \mathbb{R}^{d_v \times d_k}$$, the simplified linear-memory architectures considered here maintain a linear associative memory updated via a **rank-1 outer product** $$\mathbf{v}_t \mathbf{k}_t^\top$$:

$$\mathbf{S}_t = \mathbf{S}_{t-1} \mathbf{A}_t + \beta_t \mathbf{v}_t \mathbf{k}_t^\top, \qquad \mathbf{o}_t = \mathbf{S}_t \mathbf{q}_t$$

*(Note: Depending on whether the transition matrix acts on the left $$\mathbf{A}_t \mathbf{S}_{t-1}$$ or right $$\mathbf{S}_{t-1} \mathbf{A}_t$$, it modulates either value channels $$d_v$$ or key channels $$d_k$$. Right-multiplication $$\mathbf{S}_{t-1}\mathbf{A}_t$$ acts directly in key space $$\mathbb{R}^{d_k \times d_k}$$, which is where key-collision erasure happens.)*

| Architecture | Key-Space Transition $$\mathbf{A}_t \in \mathbb{R}^{d_k \times d_k}$$ | Write coefficient $$\beta_t$$ | Chunkwise Tensor-Core Form? |
| :--- | :--- | :--- | :--- |
| **Unnormalized linear attention** <d-cite key="katharopoulos2020"></d-cite> | $$\mathbf{I}_{d_k}$$ (No forgetting) | $$1$$ | Yes ($$\mathbf{Q}\mathbf{K}^\top$$ causal mask) |
| **Scalar retention (illustrative)** | $$\gamma \mathbf{I}_{d_k}$$ (Static scalar decay) | $$1$$ | Yes (Static Toeplitz mask) |
| **Mamba-2 / SSD core** <d-cite key="dao2024"></d-cite> | $$\alpha_t \mathbf{I}_{d_k}$$ (Data-dependent scalar) | $$\Delta_t$$ | Yes (1-Semiseparable mask) |
| **GLA** <d-cite key="yang2024gla"></d-cite> | $$\mathrm{Diag}(\boldsymbol{\alpha}_t)$$ (Vector forget gate) | $$1$$ | Yes (Channel-wise cumsum) |
| **DeltaNet** <d-cite key="schlag2021,yang2024delta"></d-cite> | $$\mathbf{I}_{d_k} - \beta_t \mathbf{k}_t \mathbf{k}_t^\top$$ (Rank-1 erasure) | $$\beta_t \text{ (unit keys)}$$ | Yes (Ordered WY form) |
| **Gated DeltaNet** <d-cite key="yang2025gated"></d-cite> | $$\alpha_t (\mathbf{I}_{d_k} - \beta_t \mathbf{k}_t \mathbf{k}_t^\top)$$ | $$\beta_t \text{ (unit keys)}$$ | Yes (Gated WY factorization) |
| **Simplified linear TTT (single-token SGD)** <d-cite key="sun2025"></d-cite> | $$\mathbf{I}_{d_k} - \eta_t \mathbf{k}_t \mathbf{k}_t^\top$$ (Online SGD) | $$\eta_t$$ (Learning rate) | Depends on update semantics |

### The Algebraic Equivalence of DeltaNet and TTT-Linear

Compare the non-decaying delta rule with the simplified linear TTT row. Suppose we view the matrix $$\mathbf{S}_{t-1} \in \mathbb{R}^{d_v \times d_k}$$ as the weights of a linear associative network $$f(\mathbf{k}; \mathbf{S}) = \mathbf{S}\mathbf{k}$$ trained online to map incoming key $$\mathbf{k}_t$$ to target value $$\mathbf{v}_t$$ under the self-supervised reconstruction loss:

$$\mathcal{L}_t(\mathbf{S}) = \frac{1}{2} \big\Vert{} \mathbf{S} \mathbf{k}_t - \mathbf{v}_t \big\Vert{}_2^2$$

Taking the gradient with respect to $$\mathbf{S}$$ gives $$\nabla_{\mathbf{S}} \mathcal{L}_t(\mathbf{S}_{t-1}) = (\mathbf{S}_{t-1}\mathbf{k}_t - \mathbf{v}_t)\mathbf{k}_t^\top$$. Applying one step of stochastic gradient descent with step size $$\eta_t$$ yields:

$$\begin{aligned} \mathbf{S}_t &= \mathbf{S}_{t-1} - \eta_t \nabla_{\mathbf{S}} \mathcal{L}_t(\mathbf{S}_{t-1}) \\ &= \mathbf{S}_{t-1} - \eta_t \big(\mathbf{S}_{t-1}\mathbf{k}_t - \mathbf{v}_t\big)\mathbf{k}_t^\top \\ &= \mathbf{S}_{t-1}\big(\mathbf{I}_{d_k} - \eta_t \mathbf{k}_t \mathbf{k}_t^\top\big) + \eta_t \mathbf{v}_t \mathbf{k}_t^\top \end{aligned}$$

For normalized positive-feature kernel attention, an additional state $$z_t=\sum_{s\leq t}\phi(k_s)$$ is needed, with output $$o_t=S_t\phi(q_t)/(z_t^\top\phi(q_t))$$ when the denominator is nonzero. Here the memory-state keys are the feature-mapped vectors, not necessarily raw keys.

<!-- Author: distinguish full Mamba-2 and TTT layers from the simplified recurrences, and explain the relationship in your own words. -->

## Structured state-space duality

Why does restricting $$\mathbf{A}_t$$ to a scalar multiple of the identity $$\alpha_t I$$, with $$\alpha_t \in (0, 1]$$ permit a structured dual formulation? Unroll the recurrence $$\mathbf{S}_t = \alpha_t \mathbf{S}_{t-1} + \beta_t \mathbf{v}_t \mathbf{k}_t^\top$$ from $$s = 1$$ to $$t$$ with zero initial state:

$$\mathbf{S}_t = \sum_{s=1}^{t} \left( \prod_{r=s+1}^{t} \alpha_r \right) \beta_s \mathbf{v}_s \mathbf{k}_s^\top$$

Multiplying on the right by the query vector $$\mathbf{q}_t$$ and absorbing $$\beta_s$$ into $$\tilde{\mathbf{k}}_s = \beta_s \mathbf{k}_s$$ yields the output at step $$t$$:

$$\mathbf{o}_t = \mathbf{S}_t \mathbf{q}_t = \sum_{s=1}^{t} \left( \prod_{r=s+1}^{t} \alpha_r \right) (\mathbf{q}_t^\top \tilde{\mathbf{k}}_s) \, \mathbf{v}_s$$

Stacking all $$T$$ queries, keys, and values into matrices $$\mathbf{Q}, \tilde{\mathbf{K}} \in \mathbb{R}^{T \times d_k}$$ and $$\mathbf{V}, \mathbf{O} \in \mathbb{R}^{T \times d_v}$$, this entire SSM recurrence can be expressed as a single masked matrix multiplication:

$$\mathbf{O} = \Big( \mathbf{L} \circ \big(\mathbf{Q} \tilde{\mathbf{K}}^\top\big) \Big) \mathbf{V}$$

where $$\mathbf{L} \in \mathbb{R}^{T \times T}$$ is a lower-triangular **1-semiseparable matrix** whose entries are defined by cumulative sums in log-space ($$a_r = \ln \alpha_r \le 0$$):

$$L_{t,s} = \begin{cases} \exp\!\left(\sum_{r=s+1}^t a_r\right) & \text{if } t \ge s \\ 0 & \text{if } t < s \end{cases}$$

### Why Semiseparable Matrices Enable Chunkwise Tensor-Core Execution

A matrix $$\mathbf{L}$$ is called **1-semiseparable** if every off-diagonal block below a time cut has rank at most $$1$$. Specifically, for any block boundary $$m$$ with $$s \le m < t$$, the product splits cleanly:

$$L_{t,s} = \left(\prod_{r=m+1}^t \alpha_r\right) \cdot \left(\prod_{r=s+1}^m \alpha_r\right) = L_{t,m} \cdot L_{m,s}$$

<d-cite key="dao2024"></d-cite>

For nonzero initial state, add $$c_t S_0q_t$$ to the readout, where $$c_t=\prod_{r=1}^{t}\alpha_r$$. Materializing the full $$T\times T$$ matrix would still be quadratic in sequence length; the semiseparable structure is useful because the off-diagonal blocks can be handled using boundary states.

<!-- Author: provide your own discussion of chunk size, memory traffic and dense matrix multiplication. -->


## Scalar retention and capacity

Suppose a model stores $$M$$ key-value pairs $$\{(\mathbf{k}_s, \mathbf{v}_s)\}_{s=1}^M$$ into $$\mathbf{S}_T = \sum_{s=1}^M \gamma_{T,s} \mathbf{v}_s \mathbf{k}_s^\top$$ using purely additive outer products ($$\mathbf{A}_t = \alpha_t \mathbf{I}$$). When we query the state at step $$T$$ with $$\mathbf{q}_T = \mathbf{k}_{s^*}$$:

$$\mathbf{o}_T = \mathbf{S}_T \mathbf{k}_{s^*} = \underbrace{\gamma_{T, s^*} \|\mathbf{k}_{s^*}\|_2^2 \, \mathbf{v}_{s^*}}_{\text{Desired Needle Signal}} + \underbrace{\sum_{s \neq s^*} \gamma_{T, s} (\mathbf{k}_s^\top \mathbf{k}_{s^*}) \, \mathbf{v}_s}_{\text{Additive Cross-Talk Noise}}$$

This separates the desired signal from interference.

For independent random unit keys, the off-target dot products have mean zero and variance exactly $$1/d_k$$ under the uniform spherical distribution. If the values and keys are independent and the values have unit norm, the expected squared cross-talk norm for the unweighted additive rule (unit write and retention gates) is $$(M-1)/d_k$$. This is a mean-square statement under the stated random-key assumptions, not a universal accuracy bound.

Exact representability of a set of key-value bindings requires $$SK=V$$, where the columns of $$K$$ and $$V$$ are keys and target values. A linear solution exists if and only if $$\ker K\subseteq\ker V$$. 

<!-- Author: explain these distinctions and the effect of key geometry in your own voice. -->

<div class="l-page">
  <iframe title="Exact scalar retention and semiseparable mask" src="{{ 'assets/html/2027-04-30-duality-of-sequence-models/decay-explorer.html' | relative_url }}" frameborder="0" height="650px" width="100%" loading="lazy"></iframe>
</div>

## Delta-rule directional edits

$$\mathbf{S}_t = \alpha_t \mathbf{S}_{t-1} \left( \mathbf{I}_{d_k} - \beta_t \frac{\mathbf{k}_t \mathbf{k}_t^\top}{\|\mathbf{k}_t\|_2^2} \right) + \beta_t \mathbf{v}_t \frac{\mathbf{k}_t^\top}{\|\mathbf{k}_t\|_2^2}$$

Assuming $$L_2$$-normalized keys ($$\Vert{}\mathbf{k}_t\Vert{}_2 = 1$$) and $$\alpha_t = 1$$, consider how $$\mathbf{S}_t$$ responds to two test queries:
* **Orthogonal Query ($$\mathbf{q} = \mathbf{k}_{\text{other}} \perp \mathbf{k}_t$$):** Because $$(\mathbf{I} - \beta_t \mathbf{k}_t \mathbf{k}_t^\top)\mathbf{k}_{\text{other}} = \mathbf{k}_{\text{other}}$$, **orthogonal queries receive no directional correction**.
* **Overwrite Query ($$\mathbf{q} = \mathbf{k}_t$$ with $$\beta_t = 1$$):** Because $$(\mathbf{I} - \mathbf{k}_t \mathbf{k}_t^\top)\mathbf{k}_t = \mathbf{0}$$, the stale association $$\mathbf{S}_{t-1}\mathbf{k}_t$$ is **annihilated** and replaced cleanly by $$\mathbf{v}_t$$!
* **Combined Gated DeltaNet ($$\alpha_t \in (0,1], \beta_t \in (0,2)$$):** Combining global forget gate $$\alpha_t$$ with directional erasure $$\beta_t$$ allows the model to both *flush* stale context globally (when $$\alpha_t \to 0$$ at document boundaries) and *selectively edit* individual key-value slots in-place (when $$\alpha_t \approx 1, \beta_t \approx 1$$).

$$
S_t=\alpha_t S_{t-1}+\beta_t(v_t-\alpha_t S_{t-1}k_t)k_t^\top
$$

$$
S_tq=\alpha_t S_{t-1}q+\beta_t(v_t-\alpha_t S_{t-1}k_t)(k_t^\top q).
$$

<d-cite key="yang2025gated"></d-cite>

<div class="l-page">
  <iframe title="Exact two-key directional interference counterexample" src="{{ 'assets/html/2027-04-30-duality-of-sequence-models/two-key-geometry.html' | relative_url }}" frameborder="0" height="610px" width="100%" loading="lazy"></iframe>
</div>

<!-- Author: explain overlap-induced interference and distinguish exact overwrite from aggregate retrieval. -->

## Chunkwise parallelization

At first glance, DeltaNet's non-diagonal transition matrix $$\mathbf{A}_t = \alpha_t(\mathbf{I} - \beta_t \mathbf{k}_t \mathbf{k}_t^\top)$$ requires care in parallel training: unlike Mamba-2's scalar $$\alpha_t$$, rank-one transition factors **generally do not commute** ($$\mathbf{A}_2 \mathbf{A}_1 \neq \mathbf{A}_1 \mathbf{A}_2$$).

A useful factorization is the WY representation. Over a chunk of $$B$$ tokens with keys $$\mathbf{K}_{[b]} \in \mathbb{R}^{B \times d_k}$$ and write gates $$\boldsymbol{\beta}_{[b]} \in \mathbb{R}^B$$, the product of $$B$$ sequential rank-one transition factors can be factored into a single update of rank at most $$B$$:

$$\prod_{r=1}^{B} \big(\mathbf{I}_{d_k} - \beta_r \mathbf{k}_r \mathbf{k}_r^\top\big) = \mathbf{I}_{d_k} - \mathbf{K}_{[b]}^\top \mathbf{T}_{[b]} \mathbf{K}_{[b]}$$

For the chronological right-acting product $$A_1 A_2\cdots A_B$$ without scalar gates, let $$D=\operatorname{Diag}(\beta)$$. The ordered factorization uses

$$T=(I+D\,\operatorname{StrictUpper}(KK^\top))^{-1}D.$$

The matrix $$T$$ is upper triangular, including the diagonal. The corresponding reverse product uses the transposed ordering.

<d-cite key="yang2024delta,dao2024"></d-cite>

<!-- Author: describe chunk boundaries and avoid unmeasured GPU throughput claims. -->

## Stability and state dynamics

For unit keys, consider the mathematical range of step sizes and the eigenvalues of the transition matrix $$\mathbf{A}_t = \alpha_t(\mathbf{I}_{d_k} - \beta_t \mathbf{k}_t \mathbf{k}_t^\top)$$ for unit-norm $$\mathbf{k}_t$$:
* Along the $$d_k - 1$$ directions orthogonal to $$\mathbf{k}_t$$, the eigenvalue is $$\lambda_{\perp} = \alpha_t$$.
* Along the key direction $$\mathbf{k}_t$$, the eigenvalue is $$\lambda_{\parallel} = \alpha_t (1 - \beta_t)$$. 

For a fixed key and gate, the homogeneous response in the key direction is $$[\alpha(1-\beta)]^t$$. The case $$\beta=1$$ erases the old component, $$1<\beta<2$$ gives alternating contraction for $$0<\alpha\leq1$$, and $$|\alpha(1-\beta)|>1$$ produces expansion in this fixed-key homogeneous example. A one-step spectral condition is not by itself a guarantee of bounded forced dynamics.

<div class="l-page">
  <iframe title="Fixed-key homogeneous stability" src="{{ 'assets/html/2027-04-30-duality-of-sequence-models/stability-explorer.html' | relative_url }}" frameborder="0" height="650px" width="100%" loading="lazy"></iframe>
</div>

## Test-time training beyond linear memory

$$\mathbf{W}_t = \mathbf{W}_{t-1} - \eta_t \nabla_{\mathbf{W}} \ell_{\text{SSL}}\big(f(\tilde{\mathbf{k}}_t; \mathbf{W}_{t-1}), \, \mathbf{v}_t\big), \qquad \mathbf{o}_t = f(\mathbf{q}_t; \mathbf{W}_t)$$

<d-cite key="sun2025"></d-cite>

<!-- Author: discuss nonlinear function class, parameter budget, and anchor-weight minibatches; do not claim universal rank-one equivalence or guaranteed recall gains. -->

## Controlled associative recall experiments

### Protocol (recorded experimental configuration)

| Setting | Value |
|---|---|
| Key dimensions | 16, 32, 64 |
| Distinct-key load ratios | 0.5, 1, 2, 4 |
| Overwrite fractions | 0, 0.25, 0.75 |
| Independent episodes per condition | 32 |
| Target classes | 8 |
| Key distribution | Independent normalized Gaussian vectors |
| Values | Uniform random one-hot labels |
| Overwrites | Distinct existing keys assigned a different label |
| Evaluation | Latest-label argmax at every original key |
| Gates | Scalar decay 0.98; non-decaying 1; write step 1 |
| Uncertainty | Standard error across independent episode means |

Total: 36 conditions, 1,152 independent episodes and 4,608 episode-rule evaluations. The figure shows the dimension-32 subset of the recorded experiment.

<div class="l-page">
  <iframe title="Measured associative recall" src="{{ 'assets/html/2027-04-30-duality-of-sequence-models/associative-recall.html' | relative_url }}" frameborder="0" height="620px" width="100%" loading="lazy"></iframe>
</div>

<!-- Author: interpret the measured crossover and report uncertainty, acknowledge fixed hyperparameters and random untrained features. Do not represent the data as trained-model benchmarks. -->

### Gate sensitivity and correlated keys

| Setting | Value |
|---|---|
| Key dimension / distinct keys | 32 / 64 |
| Shared Gaussian component weights | 0, 0.25, 0.65 |
| Overwrite fractions | 0, 0.25, 0.75 |
| Episodes per condition | 64 |
| Retention gates | 0.90, 0.98, 1.00 |
| Delta step sizes | 0.25, 0.50, 1.00, 1.50 |
| Additive write step | 1.00 |

Each key is sampled by normalizing $$\sqrt{1-\rho}\epsilon_i+\sqrt{\rho}u$$, where $$u$$ is shared within an episode and $$\epsilon_i$$ is independent standard Gaussian noise. There are nine paired conditions, 576 independent episodes and 8,640 episode-configuration evaluations. The observed average pairwise cosine in the nine conditions is displayed in the figure.

<div class="l-page">
  <iframe title="Measured gate sensitivity and key correlation" src="{{ 'assets/html/2027-04-30-duality-of-sequence-models/gate-sensitivity.html' | relative_url }}" frameborder="0" height="650px" width="100%" loading="lazy"></iframe>
</div>

<!-- Author: compare beta=1 against smaller steps, discuss the effect of correlated keys, and distinguish exploratory selection on the same episodes from held-out hyperparameter validation. -->

## Reference implementation

```python
import torch
import torch.nn.functional as F

def unified_rank1_recurrence(q, k, v, alpha, beta, mode="gated_deltanet"):
    """
    Unified Rank-1 Associative Memory Recurrence:
      q, k:  [B, T, H, d_k]
      v:     [B, T, H, d_v]
      alpha: [B, T, H, 1]     (scalar retention gate in (0, 1])
      beta:  [B, T, H, 1]     (write / Householder step in (0, 2))
    """
    B, T, H, d_k = q.shape
    d_v = v.shape[-1]
    S = torch.zeros(B, H, d_v, d_k, device=q.device, dtype=q.dtype)
    outputs = []
    if mode not in {"linear_attn", "mamba2_ssd", "gated_deltanet"}:
        raise ValueError(f"Unknown memory rule: {mode}")
    if T == 0:
        return v[:, :0]

    for t in range(T):
        qt = q[:, t]                                     # [B, H, d_k]
        kt = F.normalize(k[:, t], dim=-1)                # [B, H, d_k]
        vt = v[:, t]                                     # [B, H, d_v]
        at = alpha[:, t].unsqueeze(-1)                   # [B, H, 1, 1]
        bt = beta[:, t].unsqueeze(-1)                    # [B, H, 1, 1]

        if mode == "linear_attn":
            S = S + torch.einsum("bhv,bhk->bhvk", vt, kt)
        elif mode == "mamba2_ssd":
            S = at * S + bt * torch.einsum("bhv,bhk->bhvk", vt, kt)
        elif mode == "gated_deltanet":
            # S_t = alpha_t * (S_{t-1} - beta_t * (S_{t-1} k_t) k_t^T) + beta_t * v_t k_t^T
            prior = at * S
            sk = torch.einsum("bhvk,bhk->bhv", prior, kt)
            delta = bt.squeeze(-1) * (vt - sk)           # Prediction error from decayed state
            S = prior + torch.einsum("bhv,bhk->bhvk", delta, kt)

        ot = torch.einsum("bhvk,bhk->bhv", S, qt)
        outputs.append(ot)

    return torch.stack(outputs, dim=1)                   # [B, T, H, d_v]
```

### Reproducing both synthetic experiments

The following executable NumPy function returns episode means using shared draws across the compared gates. Set rho to None for the original 32-episode study; otherwise use the shared-component construction in the sensitivity study.

```python
import numpy as np

def episode_scores(d, m, fraction, alpha, beta, delta, rho=None):
    N = 32 if rho is None else 64
    C = 8
    if rho is None:
        seed = 27001 + d * 10000 + m * 100 + round(fraction * 100)
    else:
        seed = 27077 + int(rho * 100) * 100 + int(fraction * 100)
    rng = np.random.default_rng(seed)
    k = rng.normal(size=(N, m, d))
    if rho is not None:
        common = rng.normal(size=(N, 1, d))
        k = np.sqrt(1-rho)*k + np.sqrt(rho)*common
    k /= np.linalg.norm(k, axis=-1, keepdims=True)
    y = rng.integers(C, size=(N, m))
    latest = y.copy()
    n = int(m * fraction)
    rr = np.arange(N)[:, None]
    ix = np.argsort(rng.random((N,m)), axis=1)[:, :n]
    changed = (y[rr,ix] + rng.integers(1,C,size=(N,n))) % C
    latest[rr,ix] = changed
    S = np.zeros((N,C,d))
    I = np.eye(C)
    def step(S, key, value):
        prior = alpha*S
        r = value - np.einsum('ncd,nd->nc',prior,key) if delta else value
        return prior + beta*r[:,:,None]*key[:,None,:]
    for t in range(m):
        S = step(S,k[:,t],I[y[:,t]])
    for t in range(n):
        S = step(S,k[np.arange(N),ix[:,t]],I[changed[:,t]])
    out = np.einsum('ncd,nmd->nmc',S,k)
    ep = (out.argmax(-1)==latest).mean(1)
    return ep.mean(), ep.std(ddof=1)/np.sqrt(N)

# Initial study: d in (16,32,64), m in (d//2,d,2*d,4*d),
# fraction in (0,.25,.75), alpha in (1,.98), beta=1,
# delta in (False,True).
# Sensitivity: d=32, m=64, rho in (0,.25,.65),
# fraction in (0,.25,.75), alpha in (.9,.98,1),
# additive beta=1 or delta beta in (.25,.5,1,1.5).
mean, se = episode_scores(32,64,.75,1,.25,True,rho=0)
np.testing.assert_allclose(mean, 0.63330078125, rtol=0, atol=1e-12)
print(mean, se)
```

Recorded reference output for this configuration: mean accuracy = 0.63330078125 (63.33%).

## Limitations and next steps

<!-- Author: write this section in your own words. Discuss fixed gates, no training or GPU timing, random keys and values, absence of a pretrained architecture comparison, and sensitivity to key correlation and model state budget. Verify your actual AI-use disclosure and conflict-of-interest declaration. -->
