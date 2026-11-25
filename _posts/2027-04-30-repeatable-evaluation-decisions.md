---
layout: distill
title: How Many Tasks Make an AI Evaluation Decision Repeatable?
description: An item count chosen for global score dependability need not achieve a specified level of repeat agreement at a pass/fail threshold.
  We compare the standard projected dependability coefficient Phi with exact finite-pool classification probabilities on matched response matrices from seven historical AI benchmark populations and three fixed synthetic cuts.
  On SWE-bench Verified, the projected count is 43 items, while 66 items are required for 90% mean agreement.
date: 2027-04-30
future: true
htmlwidgets: true

# Anonymize when submitting
authors:
  - name: Anonymous

# Do not fill this in until your post is accepted and you're publishing your camera-ready post!
# authors:
#   - name: Author Name
#     url: "https://example.com"
#     affiliations:
#       name: Affiliation

# must be the exact same name as your blogpost
bibliography: 2027-04-30-repeatable-evaluation-decisions.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
toc:
  - name: Introduction
  - name: Define what changes in a repeat
  - name: Distinguish score dependability, label confidence, and agreement
    subsections:
      - name: A global score-dependability count
      - name: A label with 90% probability is a separate requirement
  - name: Compute both counts on the same response pool
    subsections:
      - name: Exact classification probabilities
      - name: Median-cut results across seven populations
  - name: Why the count depends on the cut and population
    subsections:
      - name: Larger task sets can have local dips
      - name: An average can conceal borderline systems
  - name: A practical evaluation-design recipe
  - name: Scope of the lesson
  - name: "Appendix A: Reference calculations and reproducibility details"

# On wide screens the long table of contents otherwise stretches the first few rows of the
# article grid apart; letting it span more rows keeps the Introduction paragraphs together.
# On narrow screens the interactive figure's controls wrap onto more lines, so its frame is taller.
# Capping the TOC width keeps its long labels on screen at 1180-1200px (iPad landscape).
# On phones the three widest tables scroll sideways instead of being clipped; table anchors clear
# the fixed navbar; figure captions use the body text colour so they stay readable in dark mode.
# The calculator's frame is taller on narrow screens, where its table moves under its chart.
_styles: >
  d-article iframe.interactive-calculator {
    height: 640px;
  }
  @media (max-width: 592px) {
    d-article iframe.interactive-calculator {
      height: 780px;
    }
  }
  @media (max-width: 552px) {
    d-article iframe.interactive-calculator {
      height: 870px;
    }
  }
  @media (max-width: 460px) {
    d-article iframe.interactive-calculator {
      height: 940px;
    }
  }
  @media (max-width: 413px) {
    d-article iframe.interactive-calculator {
      height: 1020px;
    }
  }
  @media (max-width: 374px) {
    d-article iframe.interactive-calculator {
      height: 1070px;
    }
  }
  @media (max-width: 319px) {
    d-article iframe.interactive-calculator {
      height: 1200px;
    }
  }
  @media (min-width: 1025px) {
    d-article d-contents {
      grid-row: auto / span 12;
    }
    d-article d-contents nav {
      max-width: 140px;
    }
  }
  @media (max-width: 640px) {
    d-article iframe.interactive-figure {
      height: 780px;
    }
  }
  @media (max-width: 430px) {
    d-article #table-1, d-article #table-2, d-article #table-5 {
      display: block;
      overflow-x: auto;
    }
    d-article table[id] th, d-article table[id] td {
      font-size: 13px;
      padding: 2px 5px;
    }
  }
  @media (max-width: 340px) {
    d-article mjx-container[display="true"] {
      font-size: 88% !important;
    }
  }
  d-article table[id] {
    scroll-margin-top: 66px;
  }
  d-article figcaption {
    color: var(--global-text-color) !important;
  }
---

## Introduction

Suppose an evaluation will produce a pass/fail judgment, and you want two independently sampled task sets to agree at least 90% of the time. How many tasks should each evaluation contain?

A score-reliability calculation gives one answer. A calculation for the decision itself can give another. On the stored SWE-bench Verified response matrix used here, the standard projected dependability target $$\Phi\geq0.90$$ requires **43 items**. At that length, exact average agreement between two task samples is **87.45%**. Reaching 90% average agreement requires **66 items**, about **54% more**. Even at 66 items, **21.6% of the recorded systems** lack a pass/fail label with at least 90% probability.

All those numbers use the same systems, the same selected item pool, and the same fixed cut. They answer different questions. We compare the conventional random-item score projection with exact agreement under finite-pool task sampling; those item-universe assumptions are kept explicit below.

This is a worked application of established measurement theory. It asks what a reliability-based item count promises at a particular threshold; it does not claim that researchers universally use that count to approve capability gates. The thresholds in our experiments are deliberately synthetic and are not deployment or reliability criteria. The practical lesson is to choose the decision target before calculating the evaluation count.

## Define what changes in a repeat

An evaluation can change when we draw new tasks, rerun the model, change a prompt, switch graders, or use a different harness. A reliability statement needs to say which of those changes it includes.

Here we isolate **task selection**. We start with stored binary outcomes, with systems in rows and items in columns. Each entry records whether a system solved an item. We hold all responses fixed and draw a uniformly random set of items. An administration averages those outcomes and compares the score with a fixed numerical cut.

There is no replacement within an administration. Two independent administrations draw separately from the same pool and may share items. There are no fresh model calls. This is sensitivity to task selection, even if the recorded system would answer each particular item deterministically.

For a specified cut $$c$$, let $$p_j(n,c)$$ be the probability that system $$j$$ passes an $$n$$-item administration. Two independent administrations agree if both pass or both fail:

$$
C_j(n,c)=p_j(n,c)^2+\bigl(1-p_j(n,c)\bigr)^2.
$$
{: .l-body}

Their disagreement probability is $$2p_j(1-p_j)$$. We report $$C(n,c)=M^{-1}\sum_j C_j(n,c)$$, the average over the recorded systems. This average is the target in the 43-versus-66 example.

A system far from the cut can receive the same label almost every time. A system near the cut can change labels with the sampled tasks. Those borderline systems matter even when the population average looks good.

<div class="l-page">
  <iframe class="interactive-calculator" src="{{ 'assets/html/2027-04-30-repeatable-evaluation-decisions/agreement_calculator.html' | relative_url }}" title="Interactive Figure 1: pass probability and pair agreement for one system by number of items" frameborder="0" scrolling="no" loading="lazy" height="640px" width="100%"></iframe>
</div>

Figure 1: Interactive calculator for one system's $$p_j(n,c)$$ and $$C_j(n,c)$$.
{: .caption}

## Distinguish score dependability, label confidence, and agreement

### A global score-dependability count

Generalizability theory separates score variation into components associated with systems, items, and other facets of an evaluation <d-cite key="brennan2001,kane1980"></d-cite>. In the simple crossed design used here, we summarize responses as

$$
X_{ji}=\mu+P_j+I_i+R_{ji},
$$
{: .l-body}

where $$P_j$$ captures differences between systems, $$I_i$$ shared item differences, and $$R_{ji}$$ the remaining variation. With one recorded response per cell, system-by-item interaction and other residual error cannot be separated. The variance decomposition does not require pretending that binary responses literally follow an additive Gaussian model.

For $$n$$ randomly sampled items, the global absolute-score dependability coefficient is

$$
\Phi_n=
\frac{\sigma_P^2}
{\sigma_P^2+(\sigma_I^2+\sigma_R^2)/n}.
$$
{: .l-body}

Solving for a target $$\Phi_0$$ gives the usual decision-study, or **D-study**, projection:

$$
n_\Phi^*=
\frac{\sigma_I^2+\sigma_R^2}
{\sigma_P^2(1/\Phi_0-1)}.
$$
{: .l-body}

We use the ceiling of this continuous quantity for an integer count. The formula conditions on the system population, item universe, and error facets. It has no cut-score parameter.

This is a useful score-design calculation. It does not determine classification agreement at every cut. Moving $$c$$ changes $$p_j$$ and $$C$$, while leaving this Phi projection unchanged for the same response matrix.

**Relation to prior work.** That a score coefficient and a decision statistic can disagree is not new. Kane and Brennan <d-cite key="kane1980"></d-cite> showed that most dependability indices for mastery tests are agreement coefficients whose loss function decides their form. Threshold loss gives classification agreement, which is our $$C$$; Subkoviak <d-cite key="subkoviak1976"></d-cite> estimated it with a binomial model, and our hypergeometric calculation is the finite-pool version. Squared-error loss gives the cut-aware coefficient $$\Phi(\lambda)$$ <d-cite key="brennan1977,brennan2001"></d-cite>, where $$\lambda$$ is our cut $$c$$. Switching to $$\Phi(\lambda)$$ does not close the gap. It adds $$(\mu-\lambda)^2$$, the squared distance from the population mean to the cut, to $$\sigma_P^2$$, so its projected count $$n^*_{\Phi(\lambda)}=(\sigma_I^2+\sigma_R^2)/[(\sigma_P^2+(\mu-\lambda)^2)(1/\Phi_0-1)]$$ never exceeds $$n^*_\Phi$$. In the six populations of Table 1 (below) where agreement needs more items than $$\Phi$$, the cut-aware count is no closer: $$\Phi(\lambda)$$ rewards a cut far from the average system, while agreement depends on how many systems sit near the cut. Recent ML work asks different questions: standard errors and power analysis for comparing scores <d-cite key="miller2024,mustahsan2026"></d-cite>, variance across training seeds <d-cite key="madaan2024"></d-cite>, estimating full-benchmark scores from about 100 items <d-cite key="polo2024"></d-cite>, and the signal-to-noise ratio behind small-scale development decisions <d-cite key="heineman2025"></d-cite>. None asks whether a fixed pass/fail label survives a fresh draw of tasks. This post computes that directly on modern response matrices and finds the agreement count ranging from 0.79× to 9.6× the D-study count at the median cut alone.

### A label with 90% probability is a separate requirement

The probability of a system's more frequent label is $$\max(p_j,1-p_j)$$. We also report the fraction of systems for which neither label has 90% probability:

$$
U(n,c)=\frac{1}{M}\sum_j
\mathbf{1}\{0.10<p_j(n,c)<0.90\}.
$$
{: .l-body}

A system with $$p_j=0.90$$ has 90% probability of receiving its more frequent label, but two administrations agree with probability $$0.9^2+0.1^2=0.82$$. At least 90% pair agreement for an individual system requires $$p_j\leq0.0528$$ or $$p_j\geq0.9472$$, approximately.

{% include figure.liquid path="assets/img/2027-04-30-repeatable-evaluation-decisions/reliability_measures.png" class="img-fluid" alt="Label probability and repeated-decision agreement" caption="Figure 2: Confidence in a more frequent label and agreement between two independent evaluations are different targets. Ninety percent pair agreement requires pass probabilities closer to zero or one than ninety percent probability for the more frequent label." %}

The fraction $$U$$ counts systems; it is not the percentage of observed decisions that change. A population average $$C$$ is also not a guarantee for each system. Choosing among these requirements is part of the design, rather than a terminology detail.

## Compute both counts on the same response pool

We use archived item-wise outcomes from **metabench** and public **SWE-bench submission artifacts** <d-cite key="kipnis2025,jimenez2024"></d-cite>. They are historical populations of recorded systems, including related checkpoints and variants. SWE submissions combine models, scaffolds, and settings. They are not random samples of independent contemporary models.

The new analysis selects one reproducible response pool per benchmark. It retains complete system rows, removes items with the same outcome for every included system, and caps large pools at 2,000 informative items with a separately seeded selection for each benchmark. That exact selected matrix supplies both the variance components and the classification probabilities.

The manifest records source fingerprints, system and item identities, filtering rules, and seeds. This prevents an apparently matched comparison from silently combining different item pools. ARC-Challenge uses metabench's training partition of **systems**, retaining the item columns. MMLU uses six specified subjects rather than the entire benchmark.

For each pool we choose score cuts at the 25th, 50th, and 75th percentiles of its recorded population. Each cut is computed once and then held fixed across all administrations. These cut locations are sensitivity checks, not independently justified capability requirements. A median is not necessarily the location with greatest uncertainty.

### Exact classification probabilities

If system $$j$$ solves $$K_j$$ of the $$L$$ selected items and we sample $$n$$ without replacement, the success count follows a hypergeometric distribution:

$$
\begin{gathered}
S_j\sim\operatorname{Hypergeometric}(L,K_j,n),\\
p_j(n,c)=\Pr\{S_j/n\geq c\}.
\end{gathered}
$$
{: .l-body}

The implementation compares the discrete score grid with the cut. It then computes $$C$$ and $$U$$ exactly for this finite-pool sampling design.

"Exact" refers to integrating over the possible task selections conditional on the stored outcomes. It does not remove uncertainty about unobserved tasks, different system populations, grader validity, or fresh model runs.

The two calculations also make different item-universe assumptions. Phi is the standard random-item variance-component projection. Exact agreement samples from the observed finite pool without replacement. At large sampling fractions the finite-pool restriction matters: drawing every selected item leaves no task-selection variation, so agreement becomes one. This is not evidence of perfect reliability on unseen tasks.

### Median-cut results across seven populations

| Population          |   $$L$$ | $$n_\Phi$$ | $$C_\Phi$$ | $$n_{\mathrm{first}}$$ | $$n_{\mathrm{persist}}$$ |
| :------------------ | ------: | ---------: | ---------: | ---------------------: | -----------------------: |
| SWE-bench Verified <d-cite key="openai2024swebenchverified"></d-cite>  |     468 |         43 |     87.45% |                     66 |                       66 |
| GSM8K <d-cite key="cobbe2021"></d-cite>               |   1,319 |         19 |     91.16% |                     15 |                       15 |
| ARC-Challenge <d-cite key="clark2018"></d-cite>       |     844 |         75 |     82.70% |                    239 |                      239 |
| TruthfulQA <d-cite key="lin2022"></d-cite>          |     816 |        124 |     86.07% |                    232 |                      232 |
| WinoGrande <d-cite key="sakaguchi2020"></d-cite>          |   1,267 |        177 |     81.52% |                    563 |                      563 |
| MMLU (six subjects) <d-cite key="hendrycks2021"></d-cite> |   1,683 |         69 |     73.15% |                    624 |                      653 |
| HellaSwag <d-cite key="zellers2019"></d-cite>           |   2,000 |         55 |     73.33% |                    511 |                      529 |
{: #table-1}

Table 1: Matched median-cut counts. $$L$$ is the selected pool size, $$n_\Phi$$ is the projected $$\Phi\geq.90$$ count, and $$C_\Phi$$ is mean agreement there. The first count is the smallest $$n$$ with $$C(n,c)\geq.90$$. The persistent count is the smallest $$n$$ for which every available $$m\geq n$$ through $$L$$ has $$C(m,c)\geq.90$$. These are population-average targets, not individual-system guarantees.
{: .caption}

At the median cut, six of the seven populations fall below 90% average agreement at their Phi-derived count. HellaSwag reaches only **73.33%** agreement at 55 items; its persistent agreement count is **529**. MMLU reaches **73.15%** at 69 items, with a persistent count of **653**. Those count ratios are approximately **9.62** and **9.46**.

GSM8K is a useful counterexample to a blanket underestimation claim. Its 19-item Phi count already gives **91.16%** average agreement, and 15 items suffice for the agreement target. Across these median cuts, the persistent agreement-to-Phi count ratio ranges from about **0.79 to 9.62**. The target relationship depends on the population and cut.

The comparison gives a conditional design lesson, not an intrinsic ranking of benchmark instruments. Each row has its own population, selected tasks, and synthetic cut.

{% include figure.liquid path="assets/img/2027-04-30-repeatable-evaluation-decisions/budget_comparison.png" class="img-fluid" alt="Matched evaluation counts and exact agreement" caption="Figure 3: Matched median-cut item counts (a) and exact mean-agreement curves (b). Phi is a score-dependability projection; agreement samples a fixed finite pool. Each curve reaches one at its full-pool length by construction. The agreement target is a population average." %}

<div class="l-page">
  <iframe class="interactive-figure" src="{{ 'assets/html/2027-04-30-repeatable-evaluation-decisions/agreement_explorer.html' | relative_url }}" title="Interactive Figure 4: projected Phi, exact mean pair agreement, and uncertain systems by number of items" frameborder="0" scrolling="no" loading="lazy" height="600px" width="100%"></iframe>
</div>

Figure 4: Interactive version of Figure 3.
{: .caption}

The median-cut persistent counts use about 14.1% of the SWE pool, 26.5% of the HellaSwag pool, and 38.8% of the selected MMLU pool. These are within-pool repeatability results. The behavior on an unobserved task universe is not identified by these stored matrices.

## Why the count depends on the cut and population

The Phi formula includes variation between the evaluated systems. Restricting attention to closely matched systems can change its denominator, and hence the projected item count. Classification agreement depends on how the systems' scores sit relative to the cut.

A cut through a dense part of the score distribution places many systems near a changing sample's decision boundary. A cut in a sparse region can produce more stable labels. A cut that makes almost every system fail can have high agreement while being a poor operational criterion. Repeatability and the justification for a decision threshold need separate arguments.

The same-matrix experiment makes this dependence visible by changing the cut while keeping the population and items fixed. [Table 2](#table-2) reports the resulting persistent counts.

| Population          | 25th-percentile cut | Median cut | 75th-percentile cut |
| :------------------ | ------------------: | ---------: | ------------------: |
| SWE-bench Verified  |                  68 |         66 |                  81 |
| GSM8K               |                  14 |         15 |                  58 |
| ARC-Challenge       |                  47 |        239 |                 176 |
| TruthfulQA          |                 200 |        232 |                  88 |
| WinoGrande          |                 141 |        563 |                 382 |
| MMLU (six subjects) |                  51 |        653 |               1,366 |
| HellaSwag           |                 107 |        529 |                 666 |
{: #table-2}

Table 2: Persistent counts for 90% population-average agreement at three synthetic score-cut percentiles. Within each population the selected responses and the Phi projection stay fixed.
{: .caption}

For MMLU, the 75th-percentile cut requires 1,366 of the 1,683 selected items, about 81.2% of the pool. The finite-pool sampling assumption is particularly consequential at such large fractions.

### Larger task sets can have local dips

Classification agreement is not necessarily monotone in $$n$$. At a fixed score-proportion cut, the required integer number of successes changes as the test grows. Adding a task can therefore make passing harder or easier relative to the nearby system scores.

For SWE-bench at the median cut, 65 items give 89.89% average agreement, and 66 give 90.09%. The full sweep establishes that all larger available lengths also reach the target. At other cuts the first crossing and persistent crossing can differ; [Table 1](#table-1) records both at the median.

This is why a binary search over lengths is unsafe. We check every integer count in the selected pool. "Persistent" refers only to those finite-pool lengths; it is not a guarantee under a different population, cut, task universe, or execution procedure.

### An average can conceal borderline systems

At the SWE median cut, the 66-item count reaches 90.09% average pair agreement while 29 of 134 systems, or 21.64%, still have $$0.10<p_j<0.90$$. Some highly stable systems compensate for less stable systems in the average.

If the operational question concerns one borderline system, its own $$C_j$$ or label probability is the relevant quantity. If it concerns a set of deployment candidates, define that group before calculating the average. A historical population containing many far-from-threshold systems does not supply a per-candidate guarantee.

The SWE mapping from a Phi target near 0.93 to 90% average agreement is also conditional. It should not become a universal replacement rule such as "use Phi 0.93 for threshold decisions." The cut and population determine the relationship.

## A practical evaluation-design recipe

**State the decision rule.** Give the scoring scale, pass inequality, numerical cut, and how the cut was chosen. Specify whether it stays fixed or is recomputed each administration. Justify the criterion separately from its repeatability; consistently assigning a label does not make the label correct.

**State the repetition procedure.** Give the item universe, task count, and sampling scheme. Independent draws and disjoint halves are different experiments. On the SWE pool at 40 items and the fixed median cut, exact independent-pair disagreement is 13.16%, while disjoint halves disagree 13.78%, as recorded in the calculation reported in [Appendix A](#appendix-a-reference-calculations-and-reproducibility-details). If runs, prompts, graders, or scaffolds also vary, collect those facets instead of inferring them from fixed response matrices.

**State the target population and requirement.** Record the system count, inclusion criteria, and score spread, including related model variants or repeated submissions. Then choose which requirement the count is intended to satisfy; [Table 3](#table-3) lists the matching quantities.

| Intended requirement                                                   | Quantity to verify                                                  |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------ |
| Global absolute-score dependability under specified facets             | $$\Phi$$ and its variance components                                |
| A system's more frequent label has 90% probability                     | $$\max(p_j,1-p_j)\geq.90$$                                          |
| Two independent administrations agree for that system 90% of the time | $$C_j\geq.90$$                                                      |
| Population-average repeat agreement reaches 90%                        | A stated average $$C\geq.90$$, with subgroup results where relevant |
{: #table-3}

Table 3: Decision requirements and the quantities that match them.
{: .caption}

**Calculate and verify the matching count.** A Phi projection can inform score design. A classification target needs the cut and pass-probability distribution. For finite recorded binary pools, the hypergeometric method makes that calculation less resource intensive after the matrices are loaded. With prospective tasks or fresh stochastic runs, use a corresponding validation design and report estimation uncertainty.

**Report what the calculation can support.** These all-seven results are in-sample design calculations. They do not establish performance on unseen systems or guarantee classifications in future executions. A sequential procedure that keeps adding tasks until a label looks convincing also needs its own treatment of stopping and repeated interim looks.

Methodological details and reference calculations appear in [Appendix A](#appendix-a-reference-calculations-and-reproducibility-details).

## Scope of the lesson

The concrete result is that a global score-dependability target and a cut-specific repeat-agreement target can select different task counts, even on the same stored response matrix. The seven-population comparison tests that relationship across several score distributions and cut locations; it does not turn established reliability theory into a new formula.

Constant-item filtering changes the operational scoring scale. SWE-bench uses 468 informative items out of its original 500, with the median cut moving from 0.531 to about 0.5673 on the filtered scale. The calculation in [Appendix A](#appendix-a-reference-calculations-and-reproducibility-details) records both medians. Large metabench pools use selected subsets, MMLU uses six subjects, and ARC uses a selected system partition. Report these choices beside the benchmark names.

The datasets mostly describe historical open-model and agent submissions. The experiment holds recorded responses fixed. It measures neither new agent executions nor prompt, grader, or training-seed variation. It does not establish contamination status, construct validity, or a defensible capability threshold. A flawed score can be perfectly repeatable.

For a short or subset-based evaluation, the practical question is clear: what target does the chosen task count satisfy under the intended repetition procedure? State that target and calculate its count. Reporting a score coefficient and a decision statistic together makes the answer reviewable.

## Appendix A: Reference calculations and reproducibility details

The matched analysis covers 21 population/cut combinations and 8,397 item-count calculations across the median-cut curves. This appendix documents pool selection and reference SWE calculations.

The same selected binary matrix is used for all calculations within a population. Complete-case systems are determined before constant-item filtering and cap selection. Only HellaSwag exceeds the 2,000-item cap. MMLU combines high-school biology, world religions, professional psychology, college chemistry, US foreign policy, and high-school macroeconomics. ARC uses metabench's training-system row partition. The realized populations are shown in [Table 4](#table-4).

| Population          | Systems | Pool items |
| :------------------ | ------: | ---------: |
| SWE-bench Verified  |     134 |        468 |
| GSM8K               |   6,702 |      1,319 |
| ARC-Challenge       |   4,757 |        844 |
| TruthfulQA          |   5,228 |        816 |
| WinoGrande          |   6,558 |      1,267 |
| MMLU (six subjects) |   5,226 |      1,683 |
| HellaSwag           |   5,227 |      2,000 |
{: #table-4}

Table 4: Recorded system populations and selected informative pools.
{: .caption}

The reference SWE pool has 134 systems, with 32 all-fail columns removed from the original 500 items. The median recorded score on the unfiltered pool is $$.531$$; the informative-pool median is $$59/104\approx.5673$$. [Table 5](#table-5) gives exact independent and disjoint calculations at this fixed median cut.

| Items | Projected $$\Phi$$ | Independent agreement | Disjoint agreement |  $$U$$ |
| ----: | -----------------: | --------------------: | -----------------: | -----: |
|    40 |            0.89477 |                86.837 |             86.222 | 29.104 |
|    43 |            0.90139 |                87.454 |             86.823 | 27.612 |
|    65 |            0.93251 |                89.892 |             89.085 | 23.134 |
|    66 |            0.93347 |                90.092 |             89.289 | 21.642 |
{: #table-5}

Table 5: Reference SWE median-cut calculations. Agreement and $$U$$ are percentages. Disjoint administrations use two nonoverlapping item sets and therefore have a different joint distribution.
{: .caption}
