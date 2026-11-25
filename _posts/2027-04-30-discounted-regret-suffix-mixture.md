---
layout: distill
title: From Strongly Adaptive Regret to Discounted Regret
description: Discounted regret against a fixed comparator equals a convex combination of regrets over suffixes of the horizon. This post derives the identity, uses it to transfer strongly adaptive regret bounds to all nonincreasing discount sequences at once, and collects the resulting uniform bounds for convex, strongly convex, and exp-concave losses.
date: 2027-04-30
future: true
htmlwidgets: true

# Anonymized for review. Do not add names or affiliations before acceptance.
authors:
  - name: Anonymous

# Must match the file name of this post.
bibliography: 2027-04-30-discounted-regret-suffix-mixture.bib

# Entries must match the section headings below.
toc:
  - name: Setting and notation
  - name: The suffix decomposition
  - name: Transfer to every discount sequence
  - name: Exponential discounting
  - name: Consequences for strongly adaptive algorithms
    subsections:
      - name: Convex losses
      - name: Strongly convex losses
      - name: Exp-concave losses
  - name: Limitations

# Post-specific styles. Every rule is scoped to .post.distill, so the site
# navigation and footer keep the shared template appearance.
_styles: >
  @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&display=swap');

  .post.distill {
    --p-serif: 'Newsreader', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
    --p-ink: #1f2427;
    --p-ink-2: #59646a;
    --p-rule: #d6dcdc;
    --p-accent: #1d6268;
    --p-accent-hover: #12464b;
    --p-wash: #eef3f2;
    --p-signal: #a2690c;
    --global-text-color: var(--p-ink);
    --global-theme-color: var(--p-accent);
    --global-hover-color: var(--p-accent-hover);
    --global-divider-color: var(--p-rule);
    --global-distill-app-color: var(--p-ink-2);
  }

  html[data-theme='dark'] .post.distill {
    --p-ink: #e3e6e3;
    --p-ink-2: #a3aeb0;
    --p-rule: #3d4446;
    --p-accent: #79bcbd;
    --p-accent-hover: #a8d7d7;
    --p-wash: #232a2a;
    --p-signal: #e2b04f;
  }

  .post.distill d-title h1 {
    font-family: var(--p-serif); font-weight: 500; font-size: 3.1rem;
    line-height: 1.06; letter-spacing: -0.012em; color: var(--p-ink);
  }

  .post.distill d-title p {
    font-family: var(--p-serif); font-style: italic; font-weight: 400;
    font-size: 1.2rem; line-height: 1.5; color: var(--p-ink-2);
  }

  .post.distill d-article {
    font-family: var(--p-serif); font-size: 1.25rem; line-height: 1.6;
    color: var(--p-ink); counter-reset: sec;
  }

  .post.distill d-article p, .post.distill d-article li { font-family: var(--p-serif); }

  .post.distill d-article p { margin-bottom: 1.05em; }

  .post.distill d-article > p, .post.distill d-article > ul, .post.distill d-article > ol,
  .post.distill d-article > h2, .post.distill d-article > h3, .post.distill d-article > .thm,
  .post.distill d-article > .proof, .post.distill d-article > mjx-container,
  .post.distill d-article > .fig, .post.distill d-article > .tab-caption { max-width: 38rem; }

  .post.distill d-article > h2:not([class]) {
    font-family: var(--p-serif); font-weight: 500; font-size: 1.8rem;
    line-height: 1.2; letter-spacing: -0.006em; border-bottom: 0;
    padding-bottom: 0; margin: 3.3rem 0 1.1rem;
    counter-increment: sec; counter-reset: sub;
  }

  .post.distill d-article > h2:not([class])::before {
    content: counter(sec); display: inline-block; min-width: 1.5em;
    color: var(--p-accent); font-weight: 400;
  }

  .post.distill d-article > h3 {
    font-family: var(--p-serif); font-weight: 600; font-size: 1.24rem;
    line-height: 1.3; margin: 2.3rem 0 0.7rem; counter-increment: sub;
  }

  .post.distill d-article > h3::before {
    content: counter(sec) '.' counter(sub); display: inline-block;
    min-width: 2.4em; color: var(--p-accent); font-weight: 400;
  }

  .post.distill d-article a { text-decoration: none; border-bottom: 1px solid var(--p-rule); }

  .post.distill d-article a:hover { border-bottom-color: var(--p-accent); }

  .post.distill .mathjax-macros { display: none; }

  .post.distill mjx-container a { color: var(--p-accent); fill: var(--p-accent); border-bottom: 0; }

  .post.distill d-article mjx-container[display='true'] {
    margin: 1.05em 0 !important; padding: 0.1em 0; max-width: 100%;
    overflow-x: auto; overflow-y: hidden;
  }

  .post.distill .thm {
    margin: 1.9rem 0 1.8rem; padding: 0.1rem 0 0.1rem 1.15rem;
    border-left: 2px solid var(--p-accent);
  }

  .post.distill .thm.main { background: var(--p-wash); padding: 1rem 1.25rem 0.9rem 1.15rem; }

  .post.distill .thm > p:last-child, .post.distill .proof > p:last-child { margin-bottom: 0; }

  .post.distill .thm > mjx-container:last-child { margin-bottom: 0.35em !important; }

  .post.distill .thm-label { font-weight: 600; color: var(--p-accent); margin-right: 0.25em; }

  .post.distill .thm.remark { border-left-color: var(--p-rule); }

  .post.distill .thm.remark .thm-label { color: var(--p-ink); font-style: italic; }

  .post.distill .proof { margin: 1.3rem 0 2.1rem; }

  .post.distill .proof-label { font-style: italic; margin-right: 0.3em; }

  .post.distill .qed { display: block; text-align: right; color: var(--p-ink-2); line-height: 1; }

  .post.distill .fig { margin: 2.3rem 0 2.1rem; }

  .post.distill .fig figure { margin: 0; }

  .post.distill .fig img { display: block; width: 100%; height: auto; }

  .post.distill .fig .fig-dark { display: none; }

  html[data-theme='dark'] .post.distill .fig .fig-light { display: none; }

  html[data-theme='dark'] .post.distill .fig .fig-dark { display: block; }

  .post.distill .fig .caption, .post.distill .bounds caption {
    font-family: var(--p-serif); font-size: 0.97rem; line-height: 1.5;
    color: var(--p-ink-2); text-align: left; margin-top: 0.75rem;
  }

  .post.distill .fig-num { color: var(--p-ink); font-weight: 600; margin-right: 0.3em; }

  .post.distill .table-wrap { overflow-x: auto; margin: 0 0 2.2rem; }

  .post.distill table.bounds {
    width: 100%; min-width: 34rem; border-collapse: collapse; font-family: var(--p-serif);
    font-size: 1rem; line-height: 1.4; margin: 0;
    border-top: 1.5px solid var(--p-ink); border-bottom: 1.5px solid var(--p-ink) !important;
  }

  .post.distill .tab-caption { margin: 2rem 0 0.7rem; }

  .post.distill table.bounds th, .post.distill table.bounds td {
    padding: 0.55rem 1rem 0.55rem 0; text-align: left; vertical-align: top;
    border-bottom: 1px solid var(--p-rule) !important;
  }

  .post.distill table.bounds thead th {
    font-weight: 600; font-size: 0.93rem; color: var(--p-ink-2) !important;
    border-bottom: 1px solid var(--p-ink) !important;
  }

  .post.distill table.bounds tbody th { font-weight: 400; }

  .post.distill table.bounds td.rate { white-space: nowrap; }

  .post.distill table.bounds td, .post.distill table.bounds tbody th { vertical-align: middle; }

  .post.distill d-contents nav h3 {
    font-family: var(--p-serif); font-size: 1rem; font-weight: 600;
    color: var(--p-ink-2) !important;
  }

  .post.distill d-contents nav div, .post.distill d-contents nav div a { font-weight: 500; color: var(--p-ink) !important; margin-bottom: 0.5em; }

  .post.distill d-contents nav a { font-family: var(--p-serif); font-size: 1rem; color: var(--p-ink) !important; }

  .post.distill d-contents nav ul li a { font-size: 0.95rem; color: var(--p-ink-2) !important; }

  .post.distill d-contents nav a:hover { color: var(--p-accent) !important; }

  .post.distill d-appendix { font-family: var(--p-serif); font-size: 0.95rem; line-height: 1.55; }

  .post.distill d-appendix h3 { font-family: var(--p-serif); font-size: 1.05rem; font-weight: 600; color: var(--p-ink) !important; }

  @media (max-width: 1024px) {
    .post.distill d-article d-contents {
      border: 0; border-top: 1px solid var(--p-rule); border-bottom: 1px solid var(--p-rule);
      padding: 0.9rem 0 0.6rem;
    }
  }

  @media (max-width: 760px) {
    .post.distill d-title h1 { font-size: 34px; }
    .post.distill d-title p { font-size: 17px; }
    .post.distill d-article { font-size: 17px; line-height: 1.58; }
    .post.distill d-article > h2:not([class]) { font-size: 23px; margin-top: 2.6rem; }
    .post.distill d-article > h3 { font-size: 18.5px; }
    .post.distill .thm { padding-left: 0.85rem; }
    .post.distill .thm.main { padding: 0.85rem 0.9rem 0.75rem 0.85rem; }
    .post.distill table.bounds { font-size: 15px; }
    .post.distill d-article mjx-container[display='true'] { font-size: 100% !important; }
    .post.distill .fig .caption, .post.distill .tab-caption { font-size: 14.5px; }
  }
---

<div class="mathjax-macros" aria-hidden="true">\(\newcommand{\w}{\mathbf{w}}\newcommand{\cW}{\mathcal{W}}\newcommand{\Reg}{\operatorname{Regret}}\newcommand{\SAReg}{\mathop{\text{SA-Regret}}\nolimits}\newcommand{\DReg}{\mathop{\text{D-Regret}}\nolimits}\)</div>

Discounted regret measures an online learner over a horizon of $$T$$ rounds by weighting the loss of round $$t$$ with $$\lambda^{T-t},$$ so that recent rounds dominate the comparison with the best fixed decision in hindsight <d-cite key="cesabianchi2006prediction,freund2008new"></d-cite>. When $$\lambda$$ is known, online gradient descent (OGD) with a step size proportional to $$\sqrt{1-\lambda}$$ attains an $$O(1/\sqrt{1-\lambda})$$ bound <d-cite key="yang2026discounted"></d-cite>. The appropriate discount factor depends on how fast the environment changes, which is rarely known in advance, and a single algorithm that performs well for all $$\lambda$$ simultaneously is harder to design. Experts tuned to different discount factors are each analyzed under their own discounted regret, while standard meta-algorithms such as Hedge compare experts under one common performance measure.

SOGD resolves this mismatch for convex losses. It aggregates OGD instances tuned to a geometric grid of discount factors through the Discounted-Normal-Predictor with conservative updating, and attains an $$O(\sqrt{\log T/(1-\lambda)})$$ bound simultaneously over a continuous interval of discount factors <d-cite key="zhang2022smoothed,kapralov2010prediction,yang2026discounted"></d-cite>. The guarantee relies on this specialized meta-algorithm, and it does not extend to strongly convex or exp-concave losses.

In this post, we show how to obtain uniform bounds from a guarantee that several existing algorithms already provide. Strongly adaptive regret <d-cite key="daniely2015strongly"></d-cite> controls the regret on every contiguous interval as a function of its length, and in particular on every suffix $$[r,T]$$ of the horizon. The key observation is that discounted regret against a fixed comparator is exactly a convex combination of suffix regrets, and hence any strongly adaptive regret bound transfers to all nonincreasing discount sequences at once, with no change to the algorithm. Below, we work through this reduction and its consequences for convex, strongly convex, and exp-concave losses.

## Setting and notation

In round $$t\in[T],$$ a learner chooses $$\w_t$$ from a convex domain $$\cW\subseteq\mathbb{R}^d$$ and then suffers the loss $$f_t(\w_t).$$ For integers $$1\le r\le s\le T$$ we write $$[r,s]=\{r,r+1,\dots,s\}$$ and $$[T]=[1,T].$$ The regret on an interval against a comparator $$\w\in\cW,$$ and against the best comparator for that interval, are

$$
\begin{aligned}
\Reg_{[r,s]}(\w)&=\sum_{t=r}^{s}\bigl(f_t(\w_t)-f_t(\w)\bigr),\\
\Reg([r,s])&=\max_{\w\in\cW}\Reg_{[r,s]}(\w).
\end{aligned}
$$

Strongly adaptive regret <d-cite key="daniely2015strongly"></d-cite> records the largest interval regret at each length $$\tau\in[T],$$

$$
\SAReg(T,\tau)=\max_{1\le r\le T-\tau+1}\Reg([r,r+\tau-1]).
$$

Discounting is specified by a nonincreasing sequence indexed by the age of a loss,

$$
1=\beta_0\ge\beta_1\ge\cdots\ge\beta_{T-1}\ge\beta_T=0, \tag{1}\label{eq:beta}
$$

under which the loss of round $$t$$ receives the weight $$\beta_{T-t}.$$ The value $$\beta_T=0$$ is a boundary convention and is not assigned to any round. The discounted regret against $$\w$$ and the discounted regret of the learner are

$$
\begin{aligned}
\DReg^{\beta}_T(\w)&=\sum_{t=1}^{T}\beta_{T-t}\bigl(f_t(\w_t)-f_t(\w)\bigr),\\
\DReg(T,\beta)&=\max_{\w\in\cW}\DReg^{\beta}_T(\w).
\end{aligned}
$$

This definition covers the general discounted regret studied in <d-cite key="cesabianchi2006prediction"></d-cite>, and the choice $$\beta_k=\lambda^k$$ with $$\lambda\in(0,1)$$ recovers the $$\lambda$$-discounted regret $$\DReg(T,\lambda)$$ <d-cite key="freund2008new"></d-cite>. The total weight, called the effective window size,

$$
\begin{gathered}
\tau_\beta=\sum_{k=0}^{T-1}\beta_k\in[1,T],\\
\tau_\lambda=\sum_{k=0}^{T-1}\lambda^k=\frac{1-\lambda^T}{1-\lambda}\le\min\Bigl\{T,\frac{1}{1-\lambda}\Bigr\},
\end{gathered}
$$

serves as an interval length in the reduction below. Finally, the learner is assumed to admit a strongly adaptive regret bound

$$
\SAReg(T,\tau)\le\psi_T(\tau),\qquad\forall\tau\in[T]. \tag{2}\label{eq:sa}
$$

The learner may depend on $$T,$$ but it does not receive the discount sequence as input.

## The suffix decomposition

Strongly adaptive regret controls unweighted sums over intervals, whereas discounted regret weights every round individually. The two measures meet on suffixes $$[T-\tau+1,T],$$ which consist of the most recent rounds and hence of the rounds that discounting favors. A nonincreasing weight profile is a superposition of such suffixes, in which the suffix of length $$\tau\in[T]$$ receives the decrement

$$
p_\tau=\beta_{\tau-1}-\beta_\tau .
$$

Condition $$\eqref{eq:beta}$$ ensures $$p_\tau\ge0,$$ and the boundary values $$\beta_0=1$$ and $$\beta_T=0$$ yield $$\sum_{\tau=1}^{T}p_\tau=1.$$ The weights $$(p_\tau)_{\tau\in[T]}$$ therefore form a probability distribution over suffix lengths.

<div class="thm" markdown="1">
<span class="thm-label">Lemma 1.</span> For any discount sequence $$\beta$$ satisfying $$\eqref{eq:beta}$$ and any fixed comparator $$\w\in\cW,$$

$$
\DReg^{\beta}_T(\w)=\sum_{\tau=1}^{T}p_\tau\Reg_{[T-\tau+1,T]}(\w). \tag{3}\label{eq:decomp}
$$

Moreover, the mean suffix length equals the effective window size,

$$
\sum_{\tau=1}^{T}\tau\,p_\tau=\tau_\beta. \tag{4}\label{eq:mean}
$$

</div>

<div class="fig l-body" id="figure-1">
  <div class="fig-light">{% include figure.liquid path="assets/img/2027-04-30-discounted-regret-suffix-mixture/fig1-suffix-mixture.svg" class="img-fluid" alt="Eight horizontal slabs stacked into a staircase over rounds 1 to 8. Each slab spans a suffix of rounds ending at round 8 and has a thickness equal to its weight. Column heights rise from about 0.13 at round 1 to 1 at round 8. A dashed rectangle of width about 3.6 and height 1 encloses the same area." zoomable=true %}</div>
  <div class="fig-dark">{% include figure.liquid path="assets/img/2027-04-30-discounted-regret-suffix-mixture/fig1-suffix-mixture-dark.svg" class="img-fluid" alt="Eight horizontal slabs stacked into a staircase over rounds 1 to 8. Each slab spans a suffix of rounds ending at round 8 and has a thickness equal to its weight. Column heights rise from about 0.13 at round 1 to 1 at round 8. A dashed rectangle of width about 3.6 and height 1 encloses the same area." zoomable=true %}</div>
  <div class="caption"><span class="fig-num">Figure 1.</span> Lemma 1 for \(T=8\) and \(\beta_k=(3/4)^k.\) Each slab is a suffix \([T-\tau+1,T]\) of thickness \(p_\tau,\) stacked from the longest suffix at the bottom to the shortest at the top. Column \(t\) collects exactly the suffixes that contain round \(t,\) and its height \(\beta_{T-t}\) is identity \(\eqref{eq:decomp}\) read one round at a time. The area counted slab by slab is \(\sum_\tau\tau p_\tau\) and counted column by column is \(\sum_k\beta_k,\) which is identity \(\eqref{eq:mean}.\) The dashed rectangle of width \(\tau_\beta\) and height one encloses the same area.</div>
</div>

<div class="proof" markdown="1">
<span class="proof-label">Proof.</span> Round $$t$$ belongs to the suffix of length $$\tau$$ exactly when $$\tau\ge T-t+1.$$ The total weight that the mixture assigns to round $$t$$ is therefore

$$
\sum_{\tau=T-t+1}^{T}p_\tau=\beta_{T-t}-\beta_T=\beta_{T-t}.
$$

An exchange of the two finite sums on the right-hand side of $$\eqref{eq:decomp}$$ then recovers the discounted regret,

$$
\begin{aligned}
\sum_{\tau=1}^{T}p_\tau\Reg_{[T-\tau+1,T]}(\w)
&=\sum_{\tau=1}^{T}p_\tau\sum_{t=T-\tau+1}^{T}\bigl(f_t(\w_t)-f_t(\w)\bigr)\\
&=\sum_{t=1}^{T}\Bigl(\sum_{\tau=T-t+1}^{T}p_\tau\Bigr)\bigl(f_t(\w_t)-f_t(\w)\bigr)\\
&=\sum_{t=1}^{T}\beta_{T-t}\bigl(f_t(\w_t)-f_t(\w)\bigr)=\DReg^{\beta}_T(\w).
\end{aligned}
$$

The same exchange, applied to $$\tau=\sum_{k=0}^{\tau-1}1,$$ proves $$\eqref{eq:mean},$$

$$
\sum_{\tau=1}^{T}\tau\,p_\tau=\sum_{k=0}^{T-1}\sum_{\tau=k+1}^{T}p_\tau=\sum_{k=0}^{T-1}\beta_k=\tau_\beta.
$$

<span class="qed" aria-label="End of proof">□</span>
</div>

## Transfer to every discount sequence

Lemma 1 fixes one comparator for all suffixes, while $$\DReg(T,\beta)$$ maximizes over comparators. The nonnegativity of $$p_\tau$$ settles this difference, since the maximum of a nonnegative combination is at most the same combination of maxima, and each of those maxima is a suffix regret controlled by $$\eqref{eq:sa}.$$

<div class="thm main" markdown="1">
<span class="thm-label">Theorem 2.</span> Suppose the learner satisfies $$\eqref{eq:sa}.$$ For any discount sequence $$\beta$$ satisfying $$\eqref{eq:beta},$$

$$
\DReg(T,\beta)\le\sum_{\tau=1}^{T}p_\tau\,\psi_T(\tau). \tag{5}\label{eq:general}
$$

If $$\psi_T$$ admits a concave extension to $$[1,T],$$ then

$$
\DReg(T,\beta)\le\psi_T(\tau_\beta). \tag{6}\label{eq:jensen}
$$

Both bounds hold simultaneously for all discount sequences satisfying $$\eqref{eq:beta}.$$
</div>

<div class="proof" markdown="1">
<span class="proof-label">Proof.</span> For every $$\w\in\cW$$ and $$\tau\in[T],$$ the definitions and $$\eqref{eq:sa}$$ imply

$$
\begin{aligned}
\Reg_{[T-\tau+1,T]}(\w)&\le\Reg([T-\tau+1,T])\le\SAReg(T,\tau)\le\psi_T(\tau).
\end{aligned}
$$

The maximum of $$\eqref{eq:decomp}$$ over $$\w$$ is bounded termwise, which is valid since $$p_\tau\ge0,$$

$$
\begin{aligned}
\DReg(T,\beta)&=\max_{\w\in\cW}\sum_{\tau=1}^{T}p_\tau\Reg_{[T-\tau+1,T]}(\w)\\
&\le\sum_{\tau=1}^{T}p_\tau\max_{\w\in\cW}\Reg_{[T-\tau+1,T]}(\w)\\
&\le\sum_{\tau=1}^{T}p_\tau\,\psi_T(\tau),
\end{aligned}
$$

which is $$\eqref{eq:general}.$$ If $$\psi_T$$ has a concave extension, Jensen's inequality for the distribution $$(p_\tau)$$ and the mean identity $$\eqref{eq:mean}$$ bound the right-hand side by $$\psi_T\bigl(\sum_\tau\tau p_\tau\bigr)=\psi_T(\tau_\beta),$$ where $$\psi_T$$ now denotes the extension evaluated at the possibly fractional point $$\tau_\beta.$$

<span class="qed" aria-label="End of proof">□</span>
</div>

<div class="thm remark" markdown="1">
<span class="thm-label">Remark 3.</span> Identity $$\eqref{eq:decomp}$$ holds for a fixed comparator, and the inequality in $$\eqref{eq:general}$$ arises only from the maximization over comparators, which may select a different best decision on each suffix. No step uses convexity or any other property of the losses. Curvature assumptions enter only through the envelope $$\psi_T$$ of a specific algorithm.
</div>

The uniformity in Theorem 2 is pathwise. The decisions $$\w_1,\dots,\w_T$$ are fixed before any discount sequence enters the argument, and $$\eqref{eq:general}$$ and $$\eqref{eq:jensen}$$ hold for every admissible $$\beta$$ on the same run. The analysis involves neither a grid of discount factors nor an aggregation across them, and the discount sequence may be chosen after the run has been observed.

Concavity is needed only in the last step of the proof, where the distribution of suffix lengths is replaced by its mean. Bound $$\eqref{eq:general}$$ holds for any envelope, and an envelope with ceilings or other integer effects can first be dominated by a concave function, which is how the logarithmic bounds in Section 5 are handled.

## Exponential discounting

For $$\beta_k=\lambda^k$$ with $$k\in\{0,\dots,T-1\}$$ and the boundary value $$\beta_T=0,$$ the suffix weights are geometric up to the horizon,

$$
p_\tau=(1-\lambda)\lambda^{\tau-1}\quad\text{for }\tau\in[T-1],\qquad p_T=\lambda^{T-1}.
$$

The last weight collects the entire tail mass beyond the horizon. The suffix length is thus distributed as $$\min\{N,T\},$$ where $$N$$ is geometric on $$\{1,2,\dots\}$$ with success probability $$1-\lambda,$$ and its mean $$\mathbb{E}\min\{N,T\}=\sum_{k=0}^{T-1}\Pr(N>k)=\tau_\lambda$$ agrees with $$\eqref{eq:mean}.$$ Corollary 4 is Theorem 2 with these weights.

<div class="thm" markdown="1">
<span class="thm-label">Corollary 4.</span> Suppose the learner satisfies $$\eqref{eq:sa}.$$ Then, simultaneously for all $$\lambda\in(0,1),$$

$$
\begin{aligned}
\DReg(T,\lambda)\le{}&(1-\lambda)\sum_{\tau=1}^{T-1}\lambda^{\tau-1}\psi_T(\tau)+\lambda^{T-1}\psi_T(T).
\end{aligned}
$$

If $$\psi_T$$ admits a concave extension to $$[1,T],$$ then $$\DReg(T,\lambda)\le\psi_T(\tau_\lambda).$$
</div>

<div class="fig l-body" id="figure-2">
  <div class="fig-light">{% include figure.liquid path="assets/img/2027-04-30-discounted-regret-suffix-mixture/fig2-geometric-window.svg" class="img-fluid" alt="Two bar charts of the suffix-length weights for T equal to 30. For lambda 0.8 the weights decay quickly and the effective window is about 4.99. For lambda 0.97 the weights decay slowly, the last weight at tau equal to T is about 0.41, and the effective window is about 19.97, while one over one minus lambda is about 33.3 and lies beyond the horizon." zoomable=true %}</div>
  <div class="fig-dark">{% include figure.liquid path="assets/img/2027-04-30-discounted-regret-suffix-mixture/fig2-geometric-window-dark.svg" class="img-fluid" alt="Two bar charts of the suffix-length weights for T equal to 30. For lambda 0.8 the weights decay quickly and the effective window is about 4.99. For lambda 0.97 the weights decay slowly, the last weight at tau equal to T is about 0.41, and the effective window is about 19.97, while one over one minus lambda is about 33.3 and lies beyond the horizon." zoomable=true %}</div>
  <div class="caption"><span class="fig-num">Figure 2.</span> Suffix-length distributions behind Corollary 4 for \(T=30.\) For \(\lambda=0.8,\) almost all mass lies on short suffixes and \(\tau_\lambda\) is indistinguishable from \(1/(1-\lambda)=5.\) For \(\lambda=0.97,\) the tail weight \(p_T=\lambda^{T-1}\) carries about 41% of the mass, and \(\tau_\lambda\approx19.97\) stays below \(T\) while \(1/(1-\lambda)\) exceeds the horizon.</div>
</div>

The bounds in Section 5 use $$\tau_\lambda\le1/(1-\lambda)$$ in the last step. Every envelope involved there is nondecreasing, and hence each bound also holds with $$\tau_\lambda$$ in place of $$1/(1-\lambda),$$ which keeps the cap $$\tau_\lambda\le T$$ visible in Figure 2 when $$\lambda$$ is close to one.

## Consequences for strongly adaptive algorithms

The reduction acts on the decisions of a strongly adaptive method without modifying it, and each known envelope therefore converts into a uniform discounted regret bound at the original computational cost. Throughout this section $$T\ge2,$$ the gradients satisfy $$\|\nabla f_t(\w)\|\le G,$$ the domain $$\cW$$ is convex with diameter at most $$D,$$ and, without loss of generality, $$0\le f_t(\w)\le GD$$ for all $$t\in[T]$$ and $$\w\in\cW.$$ Each subsection adds one curvature assumption, and Table 1 collects the resulting bounds.

<div class="tab-caption"><span class="fig-num">Table 1.</span> Uniform discounted regret bounds from Corollary 4. All bounds hold simultaneously for \(\lambda\in(0,1).\) Here \(q\ge2\) is a fixed integer, the exp-concave rows use a valid exp-concavity parameter with \(\alpha GD\le1,\) and the last column counts active experts at round \(t.\)</div>
<div class="table-wrap">
<table class="bounds">
  <thead>
    <tr><th scope="col">Losses</th><th scope="col">Algorithm</th><th scope="col">\(\DReg(T,\lambda)\)</th><th scope="col">Active experts</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">Convex</th><td>CBCE <d-cite key="jun2017improved"></d-cite></td><td class="rate">\(\displaystyle O\bigl(GD\sqrt{\log T/(1-\lambda)}\bigr)\)</td><td>\(O(\log(t+1))\)</td></tr>
    <tr><th scope="row" rowspan="2">Strongly convex</th><td>IFLH, \(K=2\) <d-cite key="zhang2018dynamic"></d-cite></td><td class="rate">\(\displaystyle O\bigl(\frac{G^2}{\mu}\log T\,(1+\log\frac{1}{1-\lambda})\bigr)\)</td><td>\(O(\log(t+1))\)</td></tr>
    <tr><td>IFLH, \(K=\lceil T^{1/q}\rceil\)</td><td class="rate">\(\displaystyle O\bigl(\frac{qG^2}{\mu}\log T\bigr)\)</td><td>\(O(qT^{1/q})\)</td></tr>
    <tr><th scope="row" rowspan="2">Exp-concave</th><td>AFLH <d-cite key="hazan2007adaptive"></d-cite></td><td class="rate">\(\displaystyle O\bigl(\frac{d}{\alpha}\log T\,(1+\log\frac{1}{1-\lambda})\bigr)\)</td><td>\(O(\log(t+1))\)</td></tr>
    <tr><td>FLH <d-cite key="hazan2007adaptive"></d-cite></td><td class="rate">\(\displaystyle O\bigl(\frac{1}{\alpha}\bigl(d(1+\log\frac{1}{1-\lambda})+\log T\bigr)\bigr)\)</td><td>\(t\)</td></tr>
  </tbody>
</table>
</div>

### Convex losses

Under convexity, CBCE <d-cite key="jun2017improved"></d-cite> runs OGD base learners on geometric covering intervals, combines them by coin betting, and maintains $$O(\log t)$$ active experts at round $$t.$$ With $$c_T=\frac{6}{\sqrt{2}-1}+8\sqrt{7\log T+5},$$ its interval guarantee holds for every $$[r,s]\subseteq[T],$$

$$
\Reg([r,s])\le c_T\,GD\sqrt{s-r+1}.
$$

The envelope is concave in the interval length, and Corollary 4 yields, simultaneously for all $$\lambda\in(0,1),$$

$$
\DReg(T,\lambda)\le c_T\,GD\sqrt{\tau_\lambda}=O\biggl(GD\sqrt{\frac{\log T}{1-\lambda}}\biggr).
$$

This rate coincides with that of SOGD <d-cite key="yang2026discounted"></d-cite> on the interval of discount factors analyzed there, and the guarantee now covers every $$\lambda\in(0,1).$$

### Strongly convex losses

For $$\mu$$-strongly convex losses, IFLH <d-cite key="zhang2018dynamic"></d-cite> runs OGD base learners under a base-$$K$$ lifetime schedule. For an integer $$K\ge2,$$ it maintains at most $$(K-1)(\lfloor\log_K t\rfloor+1)$$ active experts at round $$t$$ and guarantees, for all $$\tau\in[T],$$

$$
\begin{aligned}
\SAReg(T,\tau)\le\frac{G^2}{2\mu}\Bigl[&(1+3\log T)\bigl(\lceil\log_K\tau\rceil+1\bigr)+4\log T\Bigr].
\end{aligned}
$$

The ceiling rules out a direct application of Jensen's inequality. The estimate $$\lceil\log_K\tau\rceil+1\le2+\log\tau/\log K$$ dominates the bound by an envelope that is concave in $$\tau,$$ and Corollary 4 together with $$\tau_\lambda\le1/(1-\lambda)$$ leads to

$$
\DReg(T,\lambda)\le\frac{G^2}{2\mu}\Bigl[2+10\log T+\frac{1+3\log T}{\log K}\log\frac{1}{1-\lambda}\Bigr].
$$

The schedule parameter $$K$$ trades regret against computation. The choice $$K=2$$ keeps $$O(\log t)$$ active experts and achieves $$\DReg(T,\lambda)=O\bigl(\frac{G^2}{\mu}\log T\,(1+\log\frac{1}{1-\lambda})\bigr).$$ For a fixed integer $$q\ge2,$$ the choice $$K=\lceil T^{1/q}\rceil$$ ensures $$\lceil\log_K\tau\rceil\le q$$ for all $$\tau\in[T],$$ and the bound loses its dependence on $$\lambda,$$

$$
\begin{aligned}
\DReg(T,\lambda)&\le\frac{G^2}{2\mu}\bigl[q+1+(3q+7)\log T\bigr]\\
&=O\Bigl(\frac{qG^2}{\mu}\log T\Bigr),
\end{aligned}
$$

at the price of $$O(qT^{1/q})$$ active experts.

### Exp-concave losses

Suppose each $$f_t$$ is $$\alpha$$-exp-concave, that is, $$\exp(-\alpha f_t)$$ is concave on $$\cW.$$ FLH <d-cite key="hazan2007adaptive"></d-cite> starts an online Newton step (ONS) instance in every round and maintains $$t$$ active experts at round $$t.$$ With $$\gamma=\frac12\min\{\alpha,1/(4GD)\},$$ the ONS regret bound and the FLH aggregation guarantee combine into the envelope, for all $$\tau\in[T],$$

$$
\SAReg(T,\tau)\le\frac{\log T}{\alpha}+\frac{1}{2\gamma}\Bigl(1+d\log\Bigl(1+\frac{\gamma^2G^2D^2}{d}\,\tau\Bigr)\Bigr),
$$

which is concave in $$\tau.$$ Corollary 4 and $$\tau_\lambda\le1/(1-\lambda)$$ then lead to

$$
\begin{aligned}
\DReg(T,\lambda)&\le\frac{\log T}{\alpha}+\frac{1}{2\gamma}\Bigl(1+d\log\Bigl(1+\frac{\gamma^2G^2D^2}{d(1-\lambda)}\Bigr)\Bigr)\\
&=O\Bigl(d\Bigl(\frac{1}{\alpha}+GD\Bigr)\Bigl(1+\log\frac{1}{1-\lambda}\Bigr)+\frac{\log T}{\alpha}\Bigr).
\end{aligned}
$$

AFLH, the efficient variant of FLH <d-cite key="hazan2007adaptive"></d-cite>, maintains $$O(\log t)$$ active experts and satisfies $$\SAReg(T,\tau)=O\bigl(d(\frac{1}{\alpha}+GD)\log T\,(1+\log\tau)\bigr).$$ Corollary 4 converts this envelope into $$\DReg(T,\lambda)=O\bigl(d(\frac{1}{\alpha}+GD)\log T\,(1+\log\frac{1}{1-\lambda})\bigr).$$ The two methods differ in how the logarithmic factors combine. FLH incurs $$\log T$$ and $$\log\frac{1}{1-\lambda}$$ additively, whereas AFLH incurs their product.

IFLH with ONS base learners admits the same base-$$K$$ trade-off as in the strongly convex case <d-cite key="zhang2018dynamic"></d-cite>. It matches the AFLH bound at $$K=2,$$ and the choice $$K=\lceil T^{1/q}\rceil$$ achieves the $$\lambda$$-independent bound $$O\bigl(qd(\frac{1}{\alpha}+GD)\log T\bigr)$$ with $$O(qT^{1/q})$$ active experts. The exp-concave rows of Table 1 simplify these rates with a valid exp-concavity parameter satisfying $$\alpha GD\le1,$$ which can always be arranged by decreasing $$\alpha.$$

## Limitations

The reduction is deliberately simple, and two natural boundaries follow directly from the proof:

- **Monotone weights.** Theorem 2 relies on $$p_\tau = \beta_{\tau-1} - \beta_\tau \ge 0$$ to bound the maximum termwise. If a weight profile is not nonincreasing in the age of a loss, some decrements $$p_\tau$$ turn negative and the inequality breaks down. This is a limitation of the proof technique rather than an impossibility result for non-monotone discounting.
- **Suffix regret is enough.** Although we state the consequences for strongly adaptive algorithms, the proof never uses intervals that end before round $$T$$. Any guarantee over the suffixes $$[T-\tau+1, T]$$ alone suffices as input to Theorem 2, which raises a natural question: whether algorithms tailored specifically to suffix regret can achieve tighter constants or lower overhead than general strongly adaptive methods.
