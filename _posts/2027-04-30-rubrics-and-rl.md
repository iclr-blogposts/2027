---
layout: distill
title: Do Rubrics Expand What RL Can Learn?
description: >-
  We compare rubric-based reinforcement learning with supervised and on-policy distillation on four mathematical reasoning benchmarks.
  Across sampling budgets, the results depend on the benchmark, the model that generates and judges the rubrics, and the form of supervision.
date: 2027-04-30
future: true
htmlwidgets: true
authors:
  - name: Anonymous
bibliography: 2027-04-30-rubrics-and-rl.bib
toc:
  - name: Rubric-Based Rewards and Reasoning Capacity
    subsections:
      - name: Reasoning Capacity Beyond the Base Model
      - name: Pass at k as an Evaluation Metric
  - name: Experimental Setup
  - name: The judge is part of the learning signal
    subsections:
      - name: Does using the same model for both roles help?
  - name: Correctness plus a rubric is not a guaranteed win
  - name: Rubrics, distillation, and self-generated feedback
    subsections:
      - name: Do Rubrics Help Without a Stronger Teacher?
  - name: What I would conclude
---

## Rubric-Based Rewards and Reasoning Capacity

A **rubric** is a structured set of criteria that specifies the requirements for a high-quality response. These criteria may address instruction adherence, constraint satisfaction, the validity of intermediate reasoning, and final-answer correctness. By decomposing response quality into explicit evaluation targets, rubrics support more fine-grained assessment than a single holistic judgment.

In LLM post-training, rubric-based evaluations can serve as **reward signals**. An evaluator scores policy-generated responses against individual criteria, and the resulting judgments are aggregated into rewards for reinforcement learning. Such feedback can distinguish responses that receive the same outcome-based correctness score. However, greater detail in the evaluation criteria does not necessarily translate into more informative supervision. This raises a central question: **can rubric-based rewards extend a model's reasoning capacity, or do they primarily improve the likelihood of generating solutions already accessible to the model?**

### Reasoning Capacity Beyond the Base Model

Yue et al. (2025) <d-cite key="yue2025reasoning"></d-cite> examine this distinction in **reinforcement learning with verifiable rewards (RLVR)**. They use **$$\mathrm{pass}@k$$ across a range of sampling budgets, including large $$k$$**, to compare RLVR-trained models with their base models. In the settings studied, RLVR frequently improves performance at small $$k$$, whereas base models can outperform their RLVR-trained counterparts at larger $$k$$. The authors interpret these findings as evidence that existing RLVR methods primarily improve sampling efficiency rather than introduce fundamentally new reasoning capabilities.

### Pass at k as an Evaluation Metric

**$$\mathrm{pass}@k$$** measures the probability of obtaining **at least one correct response among $$k$$ sampled responses**, averaged over evaluation problems. For example, if 60 out of 100 problems have at least one correct response within 16 samples each, the observed $$\mathrm{pass}@16$$ is 60%. The metric assesses the availability of a correct solution within the sample set. It does not assess whether the model can select that solution.

## Experimental Setup

We follow the **SimpleRLZoo-RL experimental setup** <d-cite key="zeng2025simplerl"></d-cite> and adopt the $$\mathrm{pass}@k$$ evaluation approach used by Yue et al. (2025) <d-cite key="yue2025reasoning"></d-cite>. We study a **Qwen2.5-7B** policy on four mathematical reasoning benchmarks: **AIME24, MATH500, Minerva, and Olympiad**. We evaluate $$\mathrm{pass}@k$$ across increasing sampling budgets, up to **$$k = 1024$$ on AIME24** and **$$k = 128$$ on the other three benchmarks**.

We investigate the effects of different **rubric generators, judges, and reward designs** on post-training performance. We further examine whether the benefits of rubric-based supervision arise from the rubric itself or from access to a stronger model. To investigate this distinction, we compare rubric-based training with **conventional distillation and on-policy distillation (OPD)**, using the same underlying model to provide supervision in each comparison.

## The judge is part of the learning signal

In this experiment, we keep the **rubric generator fixed** and vary the **judge model**. We use `qwen3.7-max` as the rubric generator. We then use two separately deployed judges, **Qwen2.5-72B-Instruct** and **Llama-3.3-70B-Instruct**, to evaluate policy responses against these rubrics and provide reward signals for training.

{% include figure.liquid
  path="assets/img/2027-04-30-rubrics-and-rl/judge-comparison-instruct.png"
  class="img-fluid"
  zoomable=true
  avoid_scaling=true
  alt="Fixed qwen3.7-max rubric generator, two judges"
  caption="Figure 1. Fixed qwen3.7-max rubric generator, two judges. Top: Qwen2.5-72B-Instruct. Bottom: Llama-3.3-70B-Instruct. AIME24 separates strongly at large k, although the same separation is not uniform across benchmarks."
%}

Figure 1 highlights two observations. First, **rubric-based RL does not outperform Base overall with either judge model**. Second, the choice of judge affects the results. With the **Qwen2.5-72B-Instruct** judge, the rubric curve remains relatively close to the reference RL curve on AIME24. With the **Llama-3.3-70B-Instruct** judge, it falls visibly below the reference RL curve at larger sampling budgets. This supports *judge dependence*. A plausible explanation is that differences in how judges interpret the rubric criteria affect which rollouts receive higher rewards.

Because the rubric generator and judge are different models in this setup, their evaluation preferences may not align. We therefore investigate whether using the same model for both roles improves the results by reducing this potential mismatch.

### Does using the same model for both roles help?

{% include figure.liquid
  path="assets/img/2027-04-30-rubrics-and-rl/aligned-generator-judge.png"
  class="img-fluid"
  zoomable=true
  avoid_scaling=true
  alt="Generator and judge both use Qwen3.5-35B-A3B"
  caption="Figure 2. Generator and judge both use Qwen3.5-35B-A3B. This configuration outperforms Base and reference RL on AIME24, MATH500, and Olympiad, while high-budget coverage on Minerva remains below Base."
%}

We use the same model, **Qwen3.5-35B-A3B**, for both rubric generation and judging. This yields encouraging results, with the resulting policy **outperforming both Base and reference RL** on AIME24, MATH500, and Olympiad. Yet Minerva still has lower high-budget coverage than Base. The result is promising on some tasks, not a universal recovery of coverage. My interpretation is that agreement between the generator and judge may help make criteria actionable.

{% include figure.liquid
  path="assets/img/2027-04-30-rubrics-and-rl/aligned-generator-judge-qwen72.png"
  class="img-fluid"
  zoomable=true
  avoid_scaling=true
  alt="Qwen2.5-72B-Instruct serves as both rubric generator and judge for the Qwen2.5-7B policy"
  caption="Figure 3. Qwen2.5-72B-Instruct serves as both rubric generator and judge for the Qwen2.5-7B policy. Rubric-only RL is compared with Base and SimpleRLZoo-RL on the same four benchmarks."
%}

We repeat the shared-generator-and-judge setup using **Qwen2.5-72B-Instruct**. At the largest evaluated sampling budgets, it exceeds both Base and reference RL on MATH500, matches reference RL on AIME24, and remains below Base on AIME24, Minerva, and Olympiad. These results show that the choice of model also matters.

## Correctness plus a rubric is not a guaranteed win

To investigate whether reward design affects the results, we introduce an alternative reward formulation that keeps correctness as the anchor and uses the rubric as an auxiliary signal. We test the following form:

$$
r = r_{\mathrm{correct}} + 0.1 \cdot r_{\mathrm{rubric}}
$$

If exact correctness is binary and the rubric score is normalized to $$[0, 1]$$, a correct answer always receives a higher total reward than an incorrect one.

{% include figure.liquid
  path="assets/img/2027-04-30-rubrics-and-rl/hybrid-qwen35.png"
  class="img-fluid"
  zoomable=true
  avoid_scaling=true
  alt="Qwen3.5-35B-A3B generator and judge"
  caption="Figure 4. Qwen3.5-35B-A3B generator and judge. The rubric-only run is labeled legacy-v3, while the hybrid run is labeled answer-free-v4. This comparison changes more than the reward formula."
%}

For the **Qwen3.5-35B-A3B** configuration, the **hybrid reward underperforms the rubric-only reward on AIME24, MATH500, and Olympiad**. On Minerva, the hybrid reward improves over rubric-only training, but its high-budget coverage remains below Base.

One possible explanation is that the rubric already includes an answer-correctness criterion. Adding a separate correctness reward may therefore double-count this signal, while scaling the rubric score by 0.1 reduces the relative contribution of its other criteria. This could shift the learning signal toward final-answer correctness and weaken the influence of the broader feedback provided by the rubric.

{% include figure.liquid
  path="assets/img/2027-04-30-rubrics-and-rl/hybrid-qwen25.png"
  class="img-fluid"
  zoomable=true
  avoid_scaling=true
  alt="Qwen2.5-72B-Instruct generator and judge"
  caption="Figure 5. Qwen2.5-72B-Instruct generator and judge. The hybrid reward is notably weaker on AIME24 at large k, whereas several other curves remain much closer."
%}

To examine whether this finding holds with a different model, we use **Qwen2.5-72B-Instruct for both rubric generation and judging**. The results again show that the hybrid reward does not consistently improve over rubric-only training, with substantially lower coverage on AIME24 at large $$k$$. This suggests that adding an apparently sensible auxiliary reward can still change exploration or credit assignment in an unfavorable way.

Giving correct answers higher rewards is a useful scoring property. However, as these experiments illustrate, it does **not** guarantee that policy optimization will improve every benchmark or preserve every rare solution.

> The preceding experiments suggest that rubric-based rewards can expand the reasoning capability frontier of the RL-trained policy on some benchmarks. This raises a further question: do these gains arise from the rubric-based learning signal itself, or from the capabilities of a stronger rubric generator model? We investigate this question through two sets of comparisons. First, we compare rubric-based training with conventional distillation through supervised fine-tuning (SFT) and with on-policy distillation (OPD), using the same underlying supervisory model within each comparison. Second, we use the policy model itself for both rubric generation and judging, allowing these roles to evolve alongside the policy during training.

## Rubrics, distillation, and self-generated feedback

We first compare rubric-based RL with **conventional distillation through supervised fine-tuning (SFT)**. In this baseline, a teacher model generates responses to the training problems, and the student model is fine-tuned on these teacher-generated responses. We use **Qwen3.5-35B-A3B** as the teacher for SFT and use the same model as both the **rubric generator and judge** in the rubric-based RL comparison. The results are shown below.

{% include figure.liquid
  path="assets/img/2027-04-30-rubrics-and-rl/distillation.png"
  class="img-fluid"
  zoomable=true
  avoid_scaling=true
  alt="Qwen3.5-35B-A3B traditional distillation versus rubric-only RL"
  caption="Figure 6. Qwen3.5-35B-A3B traditional distillation versus rubric-only RL. Distillation fares better at high-budget Minerva, while rubric RL is stronger on AIME24 in this comparison."
%}

Overall, these results suggest that conventional distillation can expand the model's reasoning capability frontier. It outperforms both the Base model and rubric-based RL on MATH500, Minerva, and Olympiad.

We also compare rubric-based training with **on-policy distillation (OPD)**. In standard token-level OPD, directly matching teacher and student distributions requires aligned tokenization and vocabulary indices. For this comparison, we use **Qwen2.5-72B-Instruct** as the teacher for the Qwen2.5-7B student, keeping both models within the Qwen2.5 family. The teacher provides token-level supervision on student-generated trajectories. A rubric describes what to value, whereas token-level distillation teaches a distribution over continuations.

For a direct comparison using the same supervisory model, Figure 7 includes **rubric-only RL with Qwen2.5-72B-Instruct as both generator and judge**, alongside OPD with the same teacher, Base, and reference RL.

{% include figure.liquid
  path="assets/img/2027-04-30-rubrics-and-rl/opd-rubric-qwen72.png"
  class="img-fluid"
  zoomable=true
  avoid_scaling=true
  alt="Qwen2.5-7B with Qwen2.5-72B-Instruct supervision"
  caption="Figure 7. Qwen2.5-7B with Qwen2.5-72B-Instruct supervision. Rubric-only RL and OPD are compared with Base and SimpleRLZoo-RL on four benchmarks. Curves are replotted from the project's aggregated evaluation metrics."
%}

With the same supervisory model, the relative performance of rubric-only RL and OPD varies across benchmarks. At the largest evaluated sampling budgets, rubric-only RL achieves higher pass rates on AIME24 (73.3% versus 70.0%) and MATH500 (96.0% versus 94.2%). OPD performs better on Minerva (62.5% versus 58.5%), while both reach 73.5% on Olympiad. These results suggest that how a teacher provides supervision matters, even when the teacher model is held fixed.

Overall, the experiments with Qwen3.5-35B-A3B as both rubric generator and judge show improvements over Base on most benchmarks, although conventional distillation through SFT performs better on three of the four benchmarks. Using Qwen2.5-72B-Instruct yields less favorable results overall, but rubric-only RL still outperforms OPD on AIME24 and MATH500 at the largest evaluated sampling budgets. My interpretation is that **some of the capability gains from rubric-based RL may come from the capabilities of the model that generates and judges the rubrics.**

### Do Rubrics Help Without a Stronger Teacher?

This leaves an open question about the contribution of the rubrics themselves. To investigate it, we conduct a self-generated rubric experiment in which the **policy model itself serves as both rubric generator and judge**, with both roles evolving alongside the policy during training.

{% include figure.liquid
  path="assets/img/2027-04-30-rubrics-and-rl/self-rubric.png"
  class="img-fluid"
  zoomable=true
  avoid_scaling=true
  alt="Online self-rubric RL with Qwen2.5-7B"
  caption="Figure 8. Online self-rubric RL with Qwen2.5-7B. Some benchmarks improve, but AIME24 and Minerva remain below Base at the largest shown budgets."
%}

The online self-rubric experiment shows encouraging MATH500 and Olympiad trends.

## What I would conclude

| Experiment | Conclusion |
| --- | --- |
| Fixed rubric generator with different judges (Figure 1) | Changing the judge changes the learned policy's performance, showing that the judge is an important part of the reward signal. |
| Qwen3.5-35B-A3B as both generator and judge (Figure 2) | Using a shared generator and judge is promising, although this experiment also changes the model identity. |
| Qwen2.5-72B-Instruct as both generator and judge (Figure 3) | The shared-model setup performs less favorably overall than the Qwen3.5 configuration, indicating that model choice remains important. |
| Rubric-only versus hybrid rewards (Figures 4–5) | Adding answer correctness to the rubric reward does not consistently improve performance. |
| Rubric-based RL versus SFT distillation (Figure 6) | With Qwen3.5-35B-A3B supervision, SFT distillation exceeds both Base and rubric-based RL on MATH500, Minerva, and Olympiad. |
| Rubric-based RL versus OPD with the same teacher (Figure 7) | At the largest evaluated budgets, rubric-only RL leads on AIME24 and MATH500, OPD leads on Minerva, and they tie on Olympiad. The form of supervision matters even with a fixed teacher. |
| Policy-generated rubrics and self-judging (Figure 8) | The MATH500 and Olympiad trends suggest that self-generated rubric feedback can be useful without a stronger external teacher, motivating further work on jointly improving the policy and its feedback. |

My main takeaway is that **both the capabilities of the supervisory model and the way its feedback is structured matter for the reasoning capability frontier reached through RL**. The comparisons suggest that an external model contributes part of the learning signal, while rubric-based rewards can make that signal useful for learning and support capability gains on some tasks. The self-generated rubric results further motivate exploring whether a policy can improve the criteria it generates and applies as it learns. One direction is to jointly optimize rubric generation, judging, and policy learning over repeated iterations. This could inform future approaches to **recursive self-improvement (RSI)**.

Text rubrics also offer a potential practical advantage. They can be reused across rollouts and obtained through text-only APIs, whereas logit-based OPD requires access to the teacher's token distributions. This may reduce the cost of obtaining supervision, although the experiments here do not quantify that advantage. Together with their task-specific learning benefits, this flexibility makes rubric-based rewards a promising direction for post-training.
