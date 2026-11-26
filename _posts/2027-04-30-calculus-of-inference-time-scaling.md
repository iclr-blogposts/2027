---
layout: distill
title: "The Calculus of Inference-Time Scaling: Unifying Process Verification, Group Relative Policy Optimization (GRPO), and Search-Based Reasoning"
description: "An investigation of training signals, verification reliability, and budgeted inference in reasoning systems. Interactive exhibits examine group-relative gradients, process aggregation, synthetic search, and verifier selection risk."
date: 2027-04-30
future: true
htmlwidgets: true
hidden: true
authors:
  - name: Anonymous
bibliography: 2027-04-30-calculus-of-inference-time-scaling.bib
toc:
  - name: "From pretraining to inference-time compute"
  - name: "PPO, DPO and group-relative policy optimization"
  - name: "Group advantages and finite-sample bias"
  - name: "Process and outcome verification"
  - name: "Search under a generation budget"
  - name: "Verifier tail risk and over-optimization"
  - name: "Reference implementation and reproducibility"
  - name: "Limitations and open questions"
---

<!-- AUTHOR-REVIEW SCAFFOLD ONLY. The supplied draft contains unsupported claims and illustrative curves; it is preserved separately. Write the main scientific narrative yourself, review the AI-assisted research exhibits and disclose assistance accurately before any formal submission. Do not submit this scaffold as a finished article. -->

## From pretraining to inference-time compute

<!-- Author narrative: use a concrete example of a reasoning problem, distinguish learning a proposal distribution from selecting a candidate at inference, and explain why generated tokens, FLOPs, latency and money are different budgets. Anchor the perspective in the papers rather than claiming private implementation details of o1/o3. -->
<d-cite key="snell2025,deepseek2025,hariri2026"></d-cite>

<div class="l-page">
  <iframe title="Reasoning system architecture and process aggregation" src="{{ 'assets/html/2027-04-30-calculus-of-inference-time-scaling/process-supervision.html' | relative_url }}" frameborder="0" height="720px" width="100%" loading="lazy"></iframe>
</div>

## PPO, DPO and group-relative policy optimization

<!-- Author narrative: contrast PPO's policy and learned value losses, DPO's paired-preference objective, and GRPO's within-prompt reward baseline. No universal critic memory tax. Distinguish verifier type from the optimizer. -->
<d-cite key="schulman2017,rafailov2023,shao2024"></d-cite>

$$
\rho_{it}=\exp(\log\pi_\theta(o_{it}\mid h_{it})-\log\pi_{\rm old}(o_{it}\mid h_{it})).
$$

$$
A_i=\frac{r_i-\bar r}{\sigma_r+\epsilon_a},\qquad
\ell_{it}=-\min(\rho_{it}A_i,\operatorname{clip}(\rho_{it},1-\epsilon,1+\epsilon)A_i)+\beta k_3.
$$

$$
k_3=\exp(x)-x-1,\qquad x=\log\pi_{\rm ref}(o_{it}\mid h_{it})-\log\pi_\theta(o_{it}\mid h_{it}).
$$

<!-- Explain that k3 is nonnegative and has forward-KL expectation under current-policy sampling with suitable support. Off-policy rollout reuse does not automatically preserve that expectation. -->

## Group advantages and finite-sample bias

<d-cite key="shao2024,liu2025,yu2025"></d-cite>

$$
P(\text{mixed rewards}\mid p,G)=1-p^G-(1-p)^G.
$$

$$
\mathbb E\!\left[\frac1G\sum_i (r_i-\bar r)\nabla\log\pi(o_i)\right]
=\frac{G-1}{G}\nabla\mathbb E[r]
$$

<!-- Assumptions: IID on-policy rollouts, score-function gradient, no standardization, clipping or length normalization. A leave-one-out baseline removes this factor. The result is not a general proof of unbiased GRPO or Dr. GRPO. Explain how group normalization, length normalization and dynamic sampling differ. -->

<div class="l-page">
  <iframe title="Exact group gradient and clipping explorer" src="{{ 'assets/html/2027-04-30-calculus-of-inference-time-scaling/grpo-explorer.html' | relative_url }}" frameborder="0" height="640px" width="100%" loading="lazy"></iframe>
</div>

## Process and outcome verification

<d-cite key="lightman2024"></d-cite>

<!-- Author narrative: distinguish exact outcome checkers, learned outcome reward models, step-level correctness and value-to-go. Compare minimum, last, product and geometric mean. Product is a chain-rule probability only with appropriate conditional probabilities. Explain label noise, segmentation, calibration, and backtracking. Return to the interactive process aggregation exhibit above. -->

## Search under a generation budget

<d-cite key="snell2025,huang2024,hariri2026"></d-cite>

$$
P(\text{at least one correct candidate})=1-(1-p)^N.
$$

<!-- Author narrative: compare independent sampling with majority voting, reranking, beam search, MCTS and sequential repair. Distinguish oracle coverage from selection accuracy, and explain why revision and search require additional assumptions. Report generated steps separately from verifier compute, memory and latency. -->

<div class="l-page">
  <iframe title="Executed synthetic search study" src="{{ 'assets/html/2027-04-30-calculus-of-inference-time-scaling/budgeted-search.html' | relative_url }}" frameborder="0" height="800px" width="100%" loading="lazy"></iframe>
</div>

## Verifier tail risk and over-optimization

<d-cite key="gao2023"></d-cite>

$$
P(\text{no catastrophic proxy error and at least one correct})
=(1-(1-p)h)^N-[(1-p)(1-h)]^N.
$$

<!-- Author narrative: derive this upper bound for the specified mixture model and compare it with measured synthetic accuracy. Discuss the limitations of two-score averaging, shared errors, formal verifier specification gaps and adaptive stopping. Do not present the synthetic curve as a replication of the Gao et al. fitted law. -->

<div class="l-page">
  <iframe title="Executed verifier rare-tail ablation" src="{{ 'assets/html/2027-04-30-calculus-of-inference-time-scaling/verifier-tail-risk.html' | relative_url }}" frameborder="0" height="800px" width="100%" loading="lazy"></iframe>
</div>

## Reference implementation and reproducibility

<!-- The two stochastic figures contain the deterministic Node.js generators, parameters, and output tables. Add your own explanation of the tested PyTorch loss, masks, population-standard-deviation convention, fixed denominator and off-policy caveats. The reference implementation is supplied separately for author review. -->

## Limitations and open questions

<!-- Author narrative required: no pretrained LLM or real hardware benchmark, artificial step-success and revision model, simplified proxy scores, cost omits verifier calls, no claim about actual proprietary models. Propose a real model experiment with fixed prompt split, shared sampling budget, calibrated verifier, blinded gold labels, length-stratified metrics, and uncertainty across problems. Verify conflicts of interest and AI-use disclosure personally. -->
