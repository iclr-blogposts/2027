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
  - name: "Rollout dependence and length normalization"
  - name: "Verifier calibration and distribution shift"
  - name: "Adaptive stopping and shared verifier failures"
  - name: "Global inference budget allocation"
  - name: "Connections to recent literature and research agenda"
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

<d-cite key="kocsis2006,wang2023"></d-cite>

$$
a^*=\arg\max_a\left[\widehat Q(s,a)+c\sqrt{\frac{\log N(s)}{N(s,a)}}\right].
$$

<div class="l-page">
  <iframe title="Executed finite-tree UCT, beam and sampling comparison" src="{{ 'assets/html/2027-04-30-calculus-of-inference-time-scaling/uct-search.html' | relative_url }}" frameborder="0" height="800px" width="100%" loading="lazy"></iframe>
</div>

<!-- Author: contrast the fixed-tree study with the previous synthetic revision model. Analyze coverage versus selected accuracy, solvability ceilings and verifier-cost asymmetry. The UCT method backs up proxy terminal scores, not true labels. Do not generalize rankings beyond the assumed environments. -->


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

<!-- The three stochastic figures contain the deterministic Node.js generators, parameters, and output tables. Add your own explanation of the tested PyTorch loss, masks, population-standard-deviation convention, fixed denominator and off-policy caveats. The reference implementation is supplied separately for author review. -->

```python
import torch

def grpo_loss(new, old, ref, rewards, mask, eps=.2, beta=.04,
              mode='grpo', max_completion_length=None):
    # [B,G,T] log-probabilities, [B,G] rewards.
    if new.ndim != 3 or new.shape != old.shape or new.shape != ref.shape or new.shape != mask.shape or rewards.shape != new.shape[:2]:
        raise ValueError('Incompatible shapes')
    if mode not in ('grpo','fixed','token') or new.shape[1]<2 or not 0<=eps<1 or beta<0:
        raise ValueError('Invalid configuration')
    mask=mask.bool(); lengths=mask.sum(-1)
    if (lengths==0).any(): raise ValueError('Each completion needs a valid token')
    r=rewards.detach().float(); adv=r-r.mean(-1,keepdim=True)
    if mode!='fixed': adv=adv/(r.std(-1,unbiased=False,keepdim=True)+1e-8)
    n=torch.where(mask,new.float(),0.)
    o=torch.where(mask,old.detach().float(),0.)
    f=torch.where(mask,ref.detach().float(),0.)
    ratio=(n-o).exp(); a=adv.unsqueeze(-1)
    surrogate=torch.minimum(ratio*a,ratio.clamp(1-eps,1+eps)*a)
    x=f-n
    kl=torch.expm1(x)-x
    loss=torch.where(mask,-surrogate+beta*kl,0.)
    if mode=='grpo': return (loss.sum(-1)/lengths).mean()
    if mode=='token': return loss.sum()/lengths.sum()
    if max_completion_length is None or max_completion_length < lengths.max().item():
        raise ValueError('Specify a fixed maximum completion length')
    return loss.sum()/(new.shape[0]*new.shape[1]*max_completion_length)

def process_scores(p, mask):
    # Candidate-level aggregation; scores need not be calibrated.
    mask=mask.bool()
    if p.shape!=mask.shape or p.ndim!=2 or p.shape[1]==0 or (~mask.any(-1)).any():
        raise ValueError('Invalid step mask')
    if ((p[mask]<0)|(p[mask]>1)|~torch.isfinite(p[mask])).any():
        raise ValueError('Invalid step score')
    logp=torch.where(mask,p.clamp_min(1e-30).log(),0.)
    last=(torch.arange(p.shape[1],device=p.device).expand_as(mask).masked_fill(~mask,-1)).max(-1).values
    return {'log_product':logp.sum(-1),
            'minimum':p.masked_fill(~mask,float('inf')).min(-1).values,
            'last':p.gather(-1,last[:,None]).squeeze(-1),
            'geometric_mean':(logp.sum(-1)/mask.sum(-1)).exp()}
```

## Limitations and open questions

<!-- Author narrative required: no pretrained LLM or real hardware benchmark, artificial step-success and revision model, simplified proxy scores, cost omits verifier calls, no claim about actual proprietary models. Propose a real model experiment with fixed prompt split, shared sampling budget, calibrated verifier, blinded gold labels, length-stratified metrics, and uncertainty across problems. Verify conflicts of interest and AI-use disclosure personally. -->


## Rollout dependence and length normalization

<d-cite key="shao2024,liu2025,yu2025,chen2021"></d-cite>

$$
P(\text{mixed})=(1-c)[1-p^G-(1-p)^G],\qquad
G_{\rm eff}=\frac{G}{1+(G-1)c}.
$$

<!-- Author: derive the mixture model; separate within-prompt correlation from heterogeneous prompt difficulty. Explain the independence assumptions and why an ESS for the sample mean cannot be substituted into pass@N. Interpret the scalar gradient coefficients, not full gradient vectors. -->

<div class="l-page">
  <iframe title="Exact correlated rollout model and length-weighting comparison" src="{{ 'assets/html/2027-04-30-calculus-of-inference-time-scaling/correlated-rollouts.html' | relative_url }}" frameborder="0" height="800px" width="100%" loading="lazy"></iframe>
</div>

<div class="caption">Supplementary AI-assisted research exhibit: Exact correlated rollout model and length-weighting comparison. The assumptions and reproduction instructions are included in the figure.</div>


## Verifier calibration and distribution shift

<d-cite key="guo2017,zhou2026,li2026"></d-cite>

$$
\mathrm{Brier}=\frac1n\sum_i(\widehat p_i-y_i)^2,\qquad
\widehat p_i(T)=\sigma(z_i/T).
$$

<!-- Author: distinguish ranking, calibration, thresholding and selected-answer accuracy. Interpret unchanged AUROC, reduced IID ECE and persistent shifted ECE. The temperature is selected on an independent validation split; monotonic calibration cannot improve argmax ranking by itself. -->

<div class="l-page">
  <iframe title="Held-out reliability diagrams and calibration metrics" src="{{ 'assets/html/2027-04-30-calculus-of-inference-time-scaling/calibration-lab.html' | relative_url }}" frameborder="0" height="800px" width="100%" loading="lazy"></iframe>
</div>

<div class="caption">Supplementary AI-assisted research exhibit: Held-out reliability diagrams and calibration metrics. The assumptions and reproduction instructions are included in the figure.</div>


## Adaptive stopping and shared verifier failures

<d-cite key="gao2023,snell2025,li2026,zhou2026"></d-cite>

$$
h_{\rm joint}=ch+(1-ch)\left(\frac{(1-c)h}{1-ch}\right)^2.
$$

<!-- Author: explain independent and shared tail events. Compare the fixed-64 and adaptive policies, uncertainty, and cost. The synthetic utility price and condition-specific validation thresholds are assumptions, not measured hardware costs or a deployable difficulty oracle. Discuss safety of abstention and the limits of correlated verifier ensembles. -->

<div class="l-page">
  <iframe title="Held-out compute-aware selection and correlated error ablation" src="{{ 'assets/html/2027-04-30-calculus-of-inference-time-scaling/adaptive-budget.html' | relative_url }}" frameborder="0" height="800px" width="100%" loading="lazy"></iframe>
</div>

<div class="caption">Supplementary AI-assisted research exhibit: Held-out compute-aware selection and correlated error ablation. The assumptions and reproduction instructions are included in the figure.</div>


## Global inference budget allocation

<d-cite key="snell2025,setlur2026"></d-cite>

$$
\max_{\substack{n_i\geq1\\\sum_i n_i\leq B}}
\sum_i\left[(1-(1-p_i)h_i)^{n_i}-((1-p_i)(1-h_i))^{n_i}\right].
$$

<!-- Author: derive the exact objective only under the ideal ranking and rare-tail assumptions in the exhibit. Discuss marginal returns, unused compute, the distinction between a known-success oracle and learned routing, latency/SLO constraints and verifier cost. -->

<div class="l-page">
  <iframe title="Exact heterogeneous-workload compute allocation explorer" src="{{ 'assets/html/2027-04-30-calculus-of-inference-time-scaling/compute-allocation.html' | relative_url }}" frameborder="0" height="800px" width="100%" loading="lazy"></iframe>
</div>

<div class="caption">Supplementary AI-assisted research exhibit: Exact heterogeneous-workload compute allocation explorer. The assumptions and reproduction instructions are included in the figure.</div>


## Connections to recent literature and research agenda

<d-cite key="uesato2022,wang2024shepherd,setlur2025,zhou2026,li2026,setlur2026,hariri2026"></d-cite>

<!-- Author literature synthesis: Uesato et al. and Math-Shepherd compare outcome/process supervision; Setlur et al. (2025) distinguish process progress under a prover policy from absolute step correctness; Zhou et al. (2026) study generator/verifier capability and task difficulty; Li et al. (2026) diagnose reward-model degradation during search; Setlur et al. (2026) study compute extrapolation through learned exploration. Discuss how each relates to the corresponding exhibits and where their real-model evidence differs from our synthetic evidence. Do not imply these studies were reproduced. Potential applications: code generation with hidden tests, formal theorem proving, tool-using agents, grounded QA, and scientific hypothesis generation. For each, identify an independent gold label, a verifier failure mode, a cost constraint, and a measurable outcome. -->
