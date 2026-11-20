---
layout: distill
title: What Makes a Good Toy Example for Diffusion Models?
description: >-
  Toy examples help us see how probability mass moves and what structure is kept or lost along the way.
  Using guidance in diffusion models, we examine how class separation and within-class branching shape what we conclude from a toy.
date: 2027-04-30
future: true
htmlwidgets: true
authors:
  - name: Anonymous
bibliography: 2027-04-30-diffusion-toy-design.bib
toc:
  - name: Why We Build Toys
  - name: When Simple Toys Mislead
  - name: The AutoGuidance Toy
  - name: A Multi-Class Toy
  - name: Where the Toy Reaches Its Limits
  - name: Closing Thoughts
---

## Why We Build Toys

Diffusion and flow matching models<d-cite key="ho2020denoising,lipmanflow,albergo2023stochastic"></d-cite> learn and generate data by gradually transforming noise into samples. Many of their most important behaviors are easiest to understand at the level of distributions. From this view, we can directly see how probability mass moves and what structure is kept or lost along the way.

This is why toy examples appear so often in diffusion research<d-cite key="karras2024guiding,sadat2024eliminating,tang2025diffusion,galashov2025learn,yin2024one"></d-cite>. They give us a small, visual, and controllable setting where training and sampling behavior can be observed directly, without the extra complexity of high-dimensional image data or heavy evaluation pipelines. In a good toy problem, effects that are hard to notice in realistic datasets can become clear at a glance, which makes toy examples useful for introducing ideas, testing intuitions, and showing empirical phenomena in a direct way.

But this simplicity comes with a price: what we conclude from a toy example might depend on how the toy is set up, and those choices can quietly encode preferences.

## When Simple Toys Mislead

Consider a simple toy distribution: a two-component Gaussian mixture, with Class A centered at $$(-2, 0)$$ and Class B centered at $$(2, 0)$$. We train a toy diffusion model conditioned on the class label. In the visualization below, you can see:

- **Light green contours**: Class A ground truth samples
- **Dark green contours**: Class B ground truth samples
- **Orange contours**: Generated samples for Class B using classifier-free guidance (CFG)<d-cite key="ho2021classifier"></d-cite>

<iframe title="Two-Gaussian samples by guidance scale" src="{{ 'assets/html/2027-04-30-diffusion-toy-design/gaussians.html' | relative_url }}" style="width:100%;height:1000px;border:0"></iframe>

Notice the effect of increasing the guidance scale. When $$w = 1.0$$, that is, without additional guidance beyond the conditional prediction, the orange samples closely match the dark green Class B distribution. As $$w$$ increases beyond $$1.0$$, the behavior changes. The orange samples drift away from the dark green target. Their mean x-coordinate moves from 2.007 at scale 1 to 2.583 at scale 10. The target sample mean is 2.005. At first glance, this seems at odds with practical image generation, where much larger guidance scales are often preferred, such as $$w=7.5$$ in Stable Diffusion <d-cite key="rombach2022high"></d-cite>.

**Why does this happen?**

To understand this phenomenon, let's start with the ideal case. We use the flow-matching formulation<d-cite key="gao2025diffusionmeetsflow"></d-cite> with a linear interpolation between independent data and noise samples:

$$
\mathbf{x}_t = (1-t)\mathbf{x}_0 + t\boldsymbol{\epsilon},\qquad \mathbf{x}_0 \sim p_{\text{data}}(\cdot \mid c), \quad \boldsymbol{\epsilon} \sim \mathcal{N}(0, \mathbf{I})
$$

Under this path, the *optimal* conditional velocity field is the conditional expectation of the endpoint displacement given the intermediate state:

$$
v^*(\mathbf{x}_t, t, c) = \mathbb{E}_{\mathbf{x}_0 \sim p(\cdot | c), \boldsymbol{\epsilon} \sim \mathcal{N}(0, \mathbf{I})} [\boldsymbol{\epsilon} - \mathbf{x}_0 \mid \mathbf{x}_t, t]
$$

For an empirical distribution that weights the class examples equally, the field at time $$t>0$$ has a closed form:

$$
v^*(\mathbf{x}_t, t, c)=\frac{\sum_{i \in \mathcal{N}_c}(\mathbf{x}_t-\mathbf{x}_0^i)\,\mathcal{N}\!\left(\mathbf{x}_t;\,(1-t)\mathbf{x}_0^i,\;t^2\mathbf{I}\right)}{t\sum_{i \in \mathcal{N}_c}\mathcal{N}\!\left(\mathbf{x}_t;\,(1-t)\mathbf{x}_0^i,\;t^2\mathbf{I}\right)},\qquad \mathcal{N}_c=\{\,i\mid \mathbf{x}_0^i \in c\,\}.
$$

If the model learns this optimal field, sampling follows the true marginal distributions and can reconstruct the data points<d-cite key="gumemorization"></d-cite>. In our two-dimensional toy setting, this is not very hard. The space is low-dimensional, the structure is simple, and training can get very close to the optimum. As a result, when $$w=1.0$$ (i.e. no guidance), the learned conditional model already matches the ground-truth distribution well.

Real images and videos are very different. Their distributions are much more complex, so the optimal velocity field is much harder to learn. The predicted field is therefore only approximate, and these small errors can build up during sampling. Over many steps, the generated trajectory may drift away from the true conditional path.

Now consider classifier-free guidance, written in velocity form as

$$
v_{\mathrm{cfg}}(\mathbf{x}_t, t, c)=v(\mathbf{x}_t, t)+w\bigl(v(\mathbf{x}_t, t, c)-v(\mathbf{x}_t, t)\bigr).
$$

In the two-Gaussian setting, this extra amplification is not needed. The conditional model already separates the classes well, so increasing $$w$$ adds little useful information. Instead, it over-pushes the velocity field and moves samples away from the true target distribution.

## The AutoGuidance Toy

AutoGuidance (AG) <d-cite key="karras2024guiding"></d-cite> uses a weaker conditional model to guide a stronger one. Its toy experiment constructs a richer example with more complex in-class distributions. Instead of simple unimodal Gaussians, each class contains multiple internal modes, giving the toy enough structure to reveal differences in how guidance strategies handle within-class diversity.

<div class="l-body">
  <img src="{{ '/assets/img/2027-04-30-diffusion-toy-design/autoguidance.png' | relative_url }}" alt="AutoGuidance toy experiment" style="width: 100%; border-radius: 6px; margin: 20px 0;">
  <figcaption style="text-align: center; font-size: 14px; color: inherit; margin-top: 8px;">Toy experiment from Figure 1 of Karras et al.<d-cite key="karras2024guiding"></d-cite> Black dots show generated samples. Compare branch coverage under classifier-free guidance (c) and autoguidance (e).</figcaption>
</div>

In this setting, CFG tends to concentrate samples in the high-density region of each class, reducing mode coverage. AG, by contrast, preserves coverage within classes. This pattern is consistent with the empirical finding of AutoGuidance on ImageNet, where AG outperforms CFG in generation quality.

Other studies have found that CFG remains competitive with AG in some settings<d-cite key="hoogeboom2024simpler,liu2025flowing"></d-cite>. Our interpretation is that the difference arises from context. Consider a *well-trained* conditional model such as EDM2<d-cite key="karras2024edm2"></d-cite> on ImageNet. In that context, class information is already captured reliably, so the main remaining issue is mode coverage in the class, which is precisely where AG helps.

<table style="width: 100%; text-align: center;">
<caption style="text-align: center; font-size: 0.85em; caption-side: bottom;">Fréchet inception distance (FID) on ImageNet at 512 × 512 resolution. Lower is better. The scale is the classifier-guidance weight for the ADM-U base model and the classifier-free guidance weight for the other models. FID values are from Table 2 of Karras et al.<d-cite key="karras2024edm2"></d-cite></caption>
<thead>
<tr><th style="text-align: center;">Model</th><th style="text-align: center;">FID without guidance</th><th style="text-align: center;">FID with guidance</th><th style="text-align: center;">Guidance scale <em>w</em></th></tr>
</thead>
<tbody>
<tr><td>ADM-U<d-cite key="dhariwal2021diffusion"></d-cite></td><td>9.96</td><td>3.85</td><td>2.0</td></tr>
<tr><td>DiT-XL/2<d-cite key="peebles2023scalable"></d-cite></td><td>12.03</td><td>3.04</td><td>1.5</td></tr>
<tr><td>EDM2-S<d-cite key="karras2024edm2"></d-cite></td><td>2.56</td><td>2.23</td><td>1.4</td></tr>
<tr><td>EDM2-XXL<d-cite key="karras2024edm2"></d-cite></td><td>1.91</td><td>1.81</td><td>1.2</td></tr>
</tbody>
</table>

The example contains only two classes. Its unguided model already captures much of the branching structure, although some samples fall between branches. Karras et al. explicitly study finite-capacity models: the weaker model makes larger errors in these low-density regions.<d-cite key="karras2024guiding"></d-cite> In this setting, CFG exaggerates the separation between classes and can sacrifice within-class coverage. In jointly trained conditional models with shared parameters and limited capacity, conditional fields may overlap or blur. There, stronger conditional contrast may help distinguish nearby classes.

## A Multi-Class Toy

So far, we have moved from a two-Gaussian mixture to the more structured multi-modal toy used in AutoGuidance. Each step makes the toy more realistic, but also brings in new assumptions, such as a small number of classes, well-fitted models, or a fixed context. To study behaviors like guidance in diffusion models more systematically, we need a toy that can vary the main sources of difficulty in a controlled way.

Two factors matter here. The first is **class-condition complexity**, which describes how many classes the model must separate. The second is **within-class complexity**, which describes how much internal structure each class contains. Real datasets vary along both axes at once. ImageNet, for example, contains many classes, and each class also has large variation in pose, background, and subtype. Text-to-image settings go further by introducing additional modalities and richer conditions. A useful toy should let us adjust these factors separately and study how they affect guidance behavior.

The *Leaves dataset*<d-cite key="segmentedguidance"></d-cite> is a parameterized family of toy distributions designed to vary both factors. It is controlled by two parameters, `num_classes` and `max_depth`. Each class grows from a shared trunk into a branching structure. Increasing `max_depth` adds recursive splits and makes the structure within each class more complex. Increasing `num_classes` adds more branches and makes class separation harder. We denote each setting as `num_classes/max_depth`. For example, `4/3` means four classes with depth-three branching, while `24/1` means twenty-four classes with minimal internal structure.

These two parameters mainly control between-class crowding and within-class branching. At the same time, like any designed toy, they also affect other properties such as geometry, support overlap, local curvature, and optimization difficulty. We do not fully isolate these secondary effects, and we acknowledge them as part of the limitation of the setup.

<div class="l-body" style="display: flex; justify-content: center; gap: 10px; margin: 20px 0;">
  <div style="text-align: center; flex: 1;">
    <img src="{{ '/assets/img/2027-04-30-diffusion-toy-design/gt_4_3.png' | relative_url }}" alt="GT 4/3" style="width: 100%; border-radius: 6px;">
    <figcaption style="font-size: 13px; color: inherit; margin-top: 6px;">4 classes / depth 3</figcaption>
  </div>
  <div style="text-align: center; flex: 1;">
    <img src="{{ '/assets/img/2027-04-30-diffusion-toy-design/gt_12_2.png' | relative_url }}" alt="GT 12/2" style="width: 100%; border-radius: 6px;">
    <figcaption style="font-size: 13px; color: inherit; margin-top: 6px;">12 classes / depth 2</figcaption>
  </div>
  <div style="text-align: center; flex: 1;">
    <img src="{{ '/assets/img/2027-04-30-diffusion-toy-design/gt_24_1.png' | relative_url }}" alt="GT 24/1" style="width: 100%; border-radius: 6px;">
    <figcaption style="font-size: 13px; color: inherit; margin-top: 6px;">24 classes / depth 1</figcaption>
  </div>
</div>
<figcaption style="text-align: center; font-size: 14px; color: inherit; margin-bottom: 20px;">Ground-truth distributions for three Leaves configurations. From left to right: fewer classes with deeper branching (richer in-class structure) to many classes with shallow structure (harder class separation, simpler in-class modes).</figcaption>

The above three configurations illustrate the trade-off. In `4/3`, each class forms a deep recursive tree, so the main challenge is to model rich within-class structure while separating only four classes. In `24/1`, each class has simple geometry, but the number of classes is much larger, so the main challenge shifts to between-class discrimination. The `12/2` setting lies between these extremes. By sweeping across this space, we can ask when CFG helps, when AG performs better, and when both become inadequate.

The Leaves experiments train a single conditional model over all classes jointly. This means the model shares capacity across classes, and guidance is studied in a more crowded label space rather than in a setting where each class is handled separately.

<div class="l-body" style="margin: 20px 0;">
  <div style="display: flex; justify-content: space-around; text-align: center; font-size: 14px; font-weight: 600; color: inherit; margin-bottom: 8px;">
    <span style="flex: 1;">Ground Truth</span>
    <span style="flex: 1;">Unguided</span>
    <span style="flex: 1;">CFG<d-cite key="ho2021classifier"></d-cite></span>
    <span style="flex: 1;">AG<d-cite key="karras2024guiding"></d-cite></span>
    <span style="flex: 1;">SGG<d-cite key="segmentedguidance"></d-cite></span>
  </div>
  <div style="text-align: center; margin-bottom: 15px;">
    <img src="{{ '/assets/img/2027-04-30-diffusion-toy-design/4_3.png' | relative_url }}" alt="Samples 4/3" style="width: 100%; border-radius: 6px;">
    <figcaption style="font-size: 13px; color: inherit; margin-top: 6px;">4 classes / depth 3, T = 32,768 iterations</figcaption>
  </div>
  <div style="text-align: center; margin-bottom: 15px;">
    <img src="{{ '/assets/img/2027-04-30-diffusion-toy-design/12_2.png' | relative_url }}" alt="Samples 12/2" style="width: 100%; border-radius: 6px;">
    <figcaption style="font-size: 13px; color: inherit; margin-top: 6px;">12 classes / depth 2, T = 32,768 iterations</figcaption>
  </div>
  <div style="text-align: center; margin-bottom: 15px;">
    <img src="{{ '/assets/img/2027-04-30-diffusion-toy-design/24_1.png' | relative_url }}" alt="Samples 24/1" style="width: 100%; border-radius: 6px;">
    <figcaption style="font-size: 13px; color: inherit; margin-top: 6px;">24 classes / depth 1, T = 4,096 iterations</figcaption>
  </div>
</div>

<figcaption style="text-align: center; font-size: 14px; color: inherit; margin-bottom: 20px;">Generated samples (black dots) overlaid on the target class (orange) and neighboring classes (green). Each row shows one target class. T counts training iterations. Segmented guidance (SGG) uses CFG at higher noise and AG at lower noise.</figcaption>

### 4/3: Preserving within-class structure

In the `4/3 T=2^15` regime, the main challenge is to preserve fine within-class structure rather than to separate classes. Because there are only four classes but each class has deep branching, the model must capture detailed conditional geometry. In this setting, unguided sampling gives reasonable class separation but misses some branch detail. CFG tends to over-amplify the class signal and pushes samples toward the main trunk, which reduces structural fidelity. In the AG panel, samples follow the fine branches more closely.

### 24/1: Separating many classes

In the `24/1 T=2^12` regime, the situation is reversed. Each class has simple internal structure, but there are many classes packed into the same space, so the main difficulty is between-class separation. At the earlier checkpoint, $$T=2^{12}$$, unguided sampling often shows class confusion, with samples leaking across nearby class boundaries. CFG is more effective because its stronger conditional contrast sharpens class separation and helps keep samples aligned with the intended class. AG is less helpful in this context, since refinement offers limited benefit when the main problem is not subtle geometry but coarse discrimination among many classes.

### Context-dependent behavior

In the examples shown, CFG helps separate nearby classes, while AG preserves more of the branching structure in the four-class example. The intermediate `12/2` case lies between these extremes, and both methods show mixed behavior there. Class count, branching depth, and training duration change together across these examples, so the panels do not isolate the effect of any one factor.

## Where the Toy Reaches Its Limits

Leaves makes context dependence visible, but it remains a two-dimensional distribution. Once the question moves beyond coordinate-space behavior to issues such as representation geometry, semantic abstraction, or feature collapse, a toy of this kind can no longer provide a faithful answer.

### Beyond coordinates: where 2D toys fail

The comparison below uses three training variants on the Leaves dataset.

- **Score matching.** The toy provides the exact score of the noisy class density, $$s^*(x,\sigma,c)=\nabla_x\log p_\sigma(x\mid c)$$. The baseline minimizes the squared error between that score and the model prediction, weighted by $$\sigma^2$$.
- **Dispersive loss** <d-cite key="wang2025diffuse"></d-cite>. The toy adds a penalty proportional to the reciprocal of the batch covariance trace of the denoised estimates, $$\hat{x}=x+\sigma^2 s_\theta(x,\sigma,c)$$. This encourages the estimates to spread out.
- **Deep supervision** <d-cite key="shin2025deeply"></d-cite>. An auxiliary head at an intermediate layer receives the same score target as the final head.

<div class="l-body" style="margin: 20px 0;">
  <div style="text-align: center;">
    <img src="{{ '/assets/img/2027-04-30-diffusion-toy-design/eval_wasserstein_compare.png' | relative_url }}" alt="Wasserstein distance comparison" style="width: 70%; border-radius: 6px;">
    <figcaption style="font-size: 14px; color: inherit; margin-top: 8px;">Sliced Wasserstein distance during training for three loss variants on Leaves. Lower values indicate closer agreement with the target along the sampled projections.</figcaption>
  </div>
</div>

The dispersive variant ends at a higher distance than the baseline in this run. The deep-supervision and baseline curves finish close together. These curves measure agreement in the two output coordinates. They give us little evidence about how a model organizes its hidden features. Methods such as dispersive loss <d-cite key="wang2025diffuse"></d-cite> and REPA <d-cite key="yurepresentation"></d-cite> were designed to shape representation geometry in image models.

Toy distributions can reveal distribution-level effects, such as mode coverage, class separation, and guidance drift. To study feature alignment or collapse, we would need to measure the representations themselves.

### Inevitable preferences in toy construction

A second limitation is more subtle: every toy dataset requires many design choices, and these choices inevitably encode assumptions about what should count as realistic or important.

Take Leaves as an example. Its construction depends on several decisions, including the number of classes, the branching depth, the variance at each node, the angular spread of branches, and the sampling density. Each choice changes the resulting distribution and can affect which guidance method appears more effective. A setting with many classes and an underfit model may favor CFG, whereas a setting with richer within-class structure and a well-fitted model may favor AG. As a result, outcomes are shaped not only by the method, but also by the preferences built into the toy design.

Other toy settings can carry similar assumptions. The two-Gaussian mixture assumes a simple distribution with clearly separated classes, while the AutoGuidance toy makes errors around thin branches visible in a two-class setting. These choices can influence the outcome before the comparison begins.

## Closing Thoughts

Perspective shapes both how we see the world and how we model it. Diffusion models are powerful generative tools that extend across images, videos, proteins, language, and simple toy settings, yet each domain requires its own adaptation and reveals its own phenomena. The assumptions and preconditions we adopt in defining algorithms and benchmarks may carry implicit or explicit human bias. For that reason, we view toy analysis as a way to study a given context rather than answer the full question. Its value lies in presenting the setup, the assumptions, and the behavior we observe.
