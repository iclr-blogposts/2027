---
layout: distill
title: "EMA: A Quiet Hyperparameter That Moves Diffusion Leaderboards"
description:
  "Diffusion transformers are increasingly compared by convergence speed: who can reach a target FID in the fewest training epochs. But before
  changing the model architecture, loss, or input space, one quiet hyperparameter can already move the number: EMA decay."
date: "2027-04-30"
future: true
htmlwidgets: true
related_posts: false
hidden: true
authors:
  - name: Anonymous
bibliography: 2027-04-30-ema-in-diffusion-training.bib
toc:
  - name: Why Did EMA Become the Default?
  - name: Short-Schedule FID Makes EMA Visible
  - name: EMA Trades Precision for Recall
  - name: Soft Collapse in a 2D Toy
  - name: Closing Remarks
_styles: |
  d-article .ema-figure, d-article .ema-table-figure { margin-top: 1.8rem; margin-bottom: 2rem; }
  d-article .ema-figure img { display: block; width: 100%; max-width: 100%; height: auto; margin: 0 auto; border-radius: 6px; background: white; }
  d-article .ema-teaser img { max-width: 640px; margin-left: 0; }
  d-article .ema-figure figcaption, d-article .ema-table-figure figcaption { margin-top: 0.75rem; text-align: left; color: var(--global-text-color-light); font-size: 0.86rem; line-height: 1.58; }
  d-article .ema-pair-figure { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 1rem; }
  d-article .ema-label { text-align: center; font-size: 0.78rem; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; }
  d-article .ema-beta-compare { margin-top: 0.85rem; padding-top: 0.8rem; border-top: 1px solid var(--global-divider-color); }
  d-article .ema-beta-compare__title { font-size: 0.76rem; font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; }
  d-article .ema-beta-compare__row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  d-article .ema-beta-compare__item { min-width: 0; padding: 0 1rem; border-left: 1px solid var(--global-divider-color); }
  d-article .ema-beta-compare__item:first-child { padding-left: 0; border-left: none; }
  d-article .ema-beta-compare__decay, d-article .ema-beta-compare__label, d-article .ema-beta-compare__fid { display: block; line-height: 1.35; }
  d-article .ema-beta-compare__decay, d-article .ema-beta-compare__fid { font-size: 0.92rem; font-weight: 600; }
  d-article .ema-beta-compare__label { font-size: 0.76rem; margin-top: 0.08rem; }
  d-article .ema-beta-compare__fid { margin-top: 0.18rem; }
  d-article .ema-beta-compare__item--best .ema-beta-compare__fid { color: #24788d; }
  d-article .ema-callout { padding: 1rem 1.1rem; background: #e9f4f6; border: 1px solid #d7e9ed; border-left: 4px solid #24788d; border-radius: 6px; color: #252932; }
  d-article .ema-paper-quote { padding: 1rem 1.1rem; border: 1px solid #24788d; border-radius: 8px; background: #f8fbfc; color: #252932; }
  d-article .ema-paper-quote cite { display: block; margin-bottom: 0.4rem; font-style: normal; font-weight: 600; }
  d-article .ema-paper-quote p { margin: 0; }
  d-article .ema-table-figure { overflow-x: auto; }
  d-article .ema-table-figure table { width: 100%; border-collapse: collapse; font-size: 0.8rem; font-variant-numeric: tabular-nums; }
  d-article .ema-table-figure th, d-article .ema-table-figure td { padding: 0.55rem 0.45rem; border-bottom: 1px solid var(--global-divider-color); text-align: center; vertical-align: middle; line-height: 1.35; }
  d-article .ema-table-figure th:first-child, d-article .ema-table-figure td:first-child { text-align: left; padding-left: 0; }
  @media (max-width: 640px) {
    d-article .ema-pair-figure { grid-template-columns: 1fr; }
    d-article .ema-beta-compare__row { grid-template-columns: 1fr; gap: 0.65rem; }
    d-article .ema-beta-compare__item { padding: 0; border-left: none; }
    d-article .ema-table-figure table { min-width: 640px; }
  }
---

Diffusion transformers are increasingly compared by convergence speed: who can reach a target FID in the fewest training epochs. But before changing the model architecture, loss, or input space, one quiet hyperparameter can already move the number: EMA decay. In the figure below, we take the same RAE-DiT<d-cite key="ema-rae"></d-cite> training run at 80 epochs and change only the EMA decay. The gFID moves from <b>4.14</b> to <b>3.21</b>. This is large enough that two papers could appear to differ in method quality when they are partly differing in EMA protocol.

<figure class="ema-figure ema-teaser">
<img width="1491" height="699" alt="gFID vs EMA decay at 80 epochs for RAE-DiT (DINOv2-B), with horizontal references for raw, LightningDiT, and the published RAE number" class="img-fluid" loading="lazy" src="{{ '/assets/img/2027-04-30-ema-in-diffusion-training/ema_sweep_curves_v2.png' | relative_url }}"/>
<div aria-label="EMA decay comparison at 80 epochs" class="ema-beta-compare">
<div class="ema-beta-compare__title">Same training run, different EMA decay</div>
<div class="ema-beta-compare__row">
<div class="ema-beta-compare__item">
<span class="ema-beta-compare__decay">β = 0.9999</span>
<span class="ema-beta-compare__label">community default</span>
<span class="ema-beta-compare__fid">FID 4.14</span>
</div>
<div class="ema-beta-compare__item">
<span class="ema-beta-compare__decay">β = 0.9995</span>
<span class="ema-beta-compare__label">common non-default</span>
<span class="ema-beta-compare__fid">FID 3.29</span>
</div>
<div class="ema-beta-compare__item ema-beta-compare__item--best">
<span class="ema-beta-compare__decay">β = 0.999</span>
<span class="ema-beta-compare__label">best in sweep</span>
<span class="ema-beta-compare__fid">FID 3.21</span>
</div>
</div>
</div>
<figcaption>
    RAE-DiT-XL with DINOv2-B on ImageNet 256, trained for
    80 epochs. The training run is fixed; only the EMA decay changes. See the
    <a href="#ema-reporting-table">reporting table</a> below for common EMA choices in recent
    diffusion papers.
  </figcaption>
</figure>

This plot is the instability we want to make visible. EMA decay is often treated as a fixed detail of the training recipe rather than a hyperparameter to study. But the plot above shows the key point: common EMA choices are not interchangeable. Later, the <a href="#ema-reporting-table">reporting table</a> shows how often these choices are inherited from existing codebases or left implicit in recent diffusion papers.

The rest of the post asks two questions. First, when diffusion models are evaluated before full convergence, how much can EMA decay change the comparison? Second, what does EMA decay change inside the learned distribution? We study three settings: representation-space diffusion (RAE<d-cite key="ema-rae"></d-cite>), pixel-space diffusion (JiT<d-cite key="ema-jit"></d-cite>), and latent-space diffusion (SiT<d-cite key="ema-sit"></d-cite>).

<div class="ema-callout">
<b>TL;DR.</b> EMA decay is not just a smoothing trick. In short-schedule diffusion training,
  common choices such as β = 0.9999 and 0.9995 can produce materially different FID
  numbers from the same training run. EMA decay should be treated as a critical hyperparameter:
  swept when possible, and clearly reported.
</div>

## Why Did EMA Become the Default?

Exponential moving average (EMA) keeps a slowly updated copy of the model weights alongside the training weights. At every optimizer step <em>t</em>, the EMA weights θ′ are updated as

$$
\theta'_t \;=\; \beta \, \theta'_{t-1} \;+\; (1 - \beta)\, \theta_t\,,
$$

where β is the EMA decay. At evaluation time, samples are drawn from θ′ instead of θ: the running average, not the latest optimizer step. That sounds like harmless smoothing, and historically that is exactly why EMA became popular.

The NCSNv2 example below shows the original motivation. EMA was introduced to diffusion models as a fix for a very <em>visible</em> failure mode: <em>color shift</em><d-cite key="ema-ncsnv2"></d-cite>. Without EMA, samples near the end of training drifted in color statistics, even when the score loss kept decreasing. The EMA checkpoint smoothed the trajectory and brought the sample statistics back in line.

<figure class="ema-figure">
<img width="1400" height="1010" alt="CIFAR-10 FID over training iterations for NCSN with and without EMA, with sample insets showing color-shifted samples from the raw model and clean samples from the EMA model" class="img-fluid" loading="lazy" src="{{ '/assets/img/2027-04-30-ema-in-diffusion-training/ncsnv2_color_shift.png' | relative_url }}" style="max-width: 500px; display: block; margin: 0 auto;"/>
<figcaption>
<b>NCSN with vs. without EMA on CIFAR-10.</b> The raw NCSN checkpoint (dashed blue)
    oscillates wildly in FID and produces visibly color-shifted, off-distribution samples;
    the EMA-averaged checkpoint (orange) trains stably and recovers correct image statistics.
    Figure taken from Song &amp; Ermon, <em>Improved Techniques for Training Score-Based
    Generative Models</em> (NeurIPS 2020)<d-cite key="ema-ncsnv2"></d-cite>;
    credit to the original authors.
  </figcaption>
</figure>

This figure explains why EMA became a near-universal default: the fix is obvious, visual, empirically useful, and almost free. In our sweeps, EMA-smoothed checkpoints also beat the raw checkpoint across pixel-, latent-, and representation-space diffusion. So the question is not whether EMA helps. It does. The question is whether the decay rate can be left on autopilot.

That distinction matters most away from convergence. If the goal is a final, near-converged FID, the exact averaging window may look less central: late in training, the weights move more slowly, and different EMA averages can become similar. But at 40 epochs, 80 epochs, or any target-FID speed benchmark, the trajectory is still moving quickly. Different EMA decays can then correspond to very different evaluated checkpoints.

## Short-Schedule FID Makes EMA Visible

That lag becomes a measurement problem because diffusion papers usually report the EMA checkpoint. An FID number is therefore not determined only by the method, optimizer, and training budget; it also depends on the EMA decay used to build the checkpoint. The reporting landscape below shows why this is easy to miss.

<figure class="ema-table-figure" id="ema-reporting-table">
<table>
<thead>
<tr>
<th>Method</th>
<th>Parent Codebase</th>
<th>Reported EMA Decay</th>
<th>Epoch 40</th>
<th>Epoch 80</th>
<th>EP<sub>FID@3</sub></th>
<th>Open Sourced?</th>
</tr>
</thead>
<tbody>
<tr>
<td>DiT<d-cite key="ema-dit"></d-cite></td>
<td>-</td>
<td>0.9999</td>
<td>39</td>
<td>16</td>
<td>&gt;800</td>
<td>Yes</td>
</tr>
<tr>
<td>SiT<d-cite key="ema-sit"></d-cite></td>
<td>DiT<d-cite key="ema-dit"></d-cite></td>
<td>0.9999</td>
<td>34</td>
<td>15</td>
<td>&gt;800</td>
<td>Yes</td>
</tr>
<tr>
<td>JiT<d-cite key="ema-jit"></d-cite></td>
<td>DiT<d-cite key="ema-dit"></d-cite></td>
<td>0.9999</td>
<td>-</td>
<td>42.9</td>
<td>&gt;800</td>
<td>Yes</td>
</tr>
<tr>
<td>REPA<d-cite key="ema-repa"></d-cite></td>
<td>DiT<d-cite key="ema-dit"></d-cite>, SiT<d-cite key="ema-sit"></d-cite></td>
<td>0.9999</td>
<td>10.5</td>
<td>7.9</td>
<td>&gt;800</td>
<td>Yes</td>
</tr>
<tr>
<td>RAE<d-cite key="ema-rae"></d-cite></td>
<td>LightningDiT<d-cite key="ema-lightningdit"></d-cite></td>
<td>0.9995</td>
<td>6.7</td>
<td>4.3</td>
<td>200</td>
<td>Yes</td>
</tr>
<tr>
<td>RJF<d-cite key="ema-rjf"></d-cite></td>
<td>RAE<d-cite key="ema-rae"></d-cite></td>
<td>0.9995</td>
<td>-</td>
<td>3.6</td>
<td>80~85</td>
<td><a href="https://github.com/amandpkr/RJF">Yes</a></td>
</tr>
<tr>
<td>FAE<d-cite key="ema-fae"></d-cite></td>
<td>RAE<d-cite key="ema-rae"></d-cite></td>
<td>-</td>
<td>2.8</td>
<td>2.1</td>
<td>35~40</td>
<td>No</td>
</tr>
<tr>
<td>RAEv2<d-cite key="ema-raev2"></d-cite></td>
<td>RAE<d-cite key="ema-rae"></d-cite></td>
<td>0.9995</td>
<td>2.8</td>
<td>2.3</td>
<td>&lt;20</td>
<td>Yes</td>
</tr>
<tr>
<td>PAE<d-cite key="ema-pae"></d-cite></td>
<td>RAE<d-cite key="ema-rae"></d-cite></td>
<td>0.9999</td>
<td>5.8</td>
<td>1.9</td>
<td>45~50</td>
<td>Yes</td>
</tr>
</tbody>
</table>
<figcaption>
<b>Recent diffusion papers often inherit EMA decay from a parent codebase.</b>
  Reported values are taken from the cited papers and, where
  needed, their released implementations.
  This table shows that short-schedule FID and EP<sub>FID@k</sub> numbers can use an EMA choice that is not always
  searched over, matched, or easy to find.
</figcaption>
</figure>

The table matters because recent comparisons increasingly live at intermediate checkpoints. Final FID still appears, but many papers now emphasize fixed-budget FID at 40 or 80 epochs, or the number of epochs needed to hit a target FID. RAEv2<d-cite key="ema-raev2"></d-cite> makes one piece of this shift explicit:

<blockquote cite="https://arxiv.org/abs/2605.18324" class="ema-paper-quote">
<cite>RAEv2 on Training-Convergence Evaluation<d-cite key="ema-raev2"></d-cite></cite>
<p>
  "Incremental improvements in absolute gFID values might provide limited signal
  for practical applications. Inspired by recent speedrun in language domain, we also report training
  convergence using EP<sub>FID@k</sub> (epochs to reach unguided gFID ≤ <em>k</em>)."
  </p>
</blockquote>

RAEv2 therefore reports EP<sub>FID@k</sub>: the number of epochs needed to reach unguided gFID ≤ <em>k</em>. This is a useful direction because it asks how much training a method needs to become good enough, not just where it lands after a long run. But the curve being thresholded is usually the EMA-smoothed curve. If changing β moves that curve, it can also move the apparent convergence time.

The figure below shows this within a single RAE-DiT<d-cite key="ema-rae"></d-cite> run. All curves come from the same optimizer trajectory; only the EMA decay changes. At target <em>k</em> = 4, that choice changes the apparent convergence time from 32 epochs to beyond 80 epochs.

<figure class="ema-figure">
<img width="1894" height="915" alt="FID vs. training epoch for one RAE-DiT run, with one curve per EMA decay" class="img-fluid" loading="lazy" src="{{ '/assets/img/2027-04-30-ema-in-diffusion-training/convergence_threshold_v2.png' | relative_url }}"/>
<figcaption>
<b>Same RAE-DiT run at 80 epochs.</b> Left: gFID vs. training epoch for one optimizer trajectory under different
    EMA decays. The FID = 4 threshold is shown as a dashed line and threshold-crossing points are marked.
    Right: the same run reduced to EP<sub>FID@4</sub> — the number of epochs to first reach gFID ≤ 4.
  </figcaption>
</figure>

Read together, these results show why fixed-budget FID and EP<sub>FID@k</sub> need a matched EMA protocol. If two methods use different decays, the reported gap can reflect both the proposed method and the EMA checkpoint used to evaluate it.

That motivates the controlled sweeps in the next section: if EMA decay can change both the number and the crossing time, what exactly is it changing in the learned distribution?

## EMA Trades Precision for Recall

We showed that EMA decay can change the reported FID. Here we ask what changes inside the learned distribution. The answer is not simply "better" or "worse": EMA decay moves the model along a precision-recall trade-off. Larger decays tend to sharpen samples and raise precision, but they also reduce coverage and lower recall.

The intuition is that EMA rewards what is stable across time. Common patterns survive the averaging window and become cleaner; rare or fragile modes are more easily averaged away. So the model looks more precise, but it covers less of the distribution.

To isolate this effect, we sweep EMA decay for three diffusion models spanning common input spaces: JiT<d-cite key="ema-jit"></d-cite> in pixel space, SiT<d-cite key="ema-sit"></d-cite> in latent space, and RAE<d-cite key="ema-rae"></d-cite> in representation space. Each sweep also includes the raw online checkpoint.

The RAE sweep makes the mechanism visible. Every point below comes from the same online training trajectory; only the EMA decay used to form the checkpoint changes.

<figure class="ema-figure">
<img width="1643" height="1114" alt="Precision-recall trade-off curve for the RAE EMA sweep at 80 epochs: each point is one EMA decay value; as decay grows from raw to 0.9999, precision rises and recall falls" class="img-fluid" loading="lazy" src="{{ '/assets/img/2027-04-30-ema-in-diffusion-training/rae_precision_recall.png' | relative_url }}"/>
<figcaption>
<b>RAE-DiT-XL at 80 epochs: EMA decay changes the precision-recall balance.</b>
    Each point is the same training run with a different EMA decay. As β grows from raw
    toward β = 0.9999, precision<d-cite key="ema-pr"></d-cite>
    rises while recall falls.
  </figcaption>
</figure>

This is the key mechanism. Moving from raw to β = 0.9999, precision rises from 0.68 to 0.79, while recall falls from 0.61 to 0.53. No single decay wins on both axes. EMA does not only smooth optimization noise; it dials the model between fidelity and coverage.

The same pattern holds in pixel and latent spaces. JiT and SiT show the same broad direction: as decay grows, precision tends to improve and recall tends to shrink. The exact curve shape differs by model, but the effect is not specific to RAE.

<figure class="ema-figure">
<img width="1643" height="1114" alt="Precision-recall trade-off curve for JiT (pixel space) at 80 epochs: as EMA decay grows, precision generally rises and recall falls" class="img-fluid" loading="lazy" src="{{ '/assets/img/2027-04-30-ema-in-diffusion-training/jit_precision_recall.png' | relative_url }}"/>
<figcaption>
<b>JiT (pixel space) at 80 epochs: the same precision-up, recall-down pressure.</b>
    Larger EMA decay pushes samples toward higher precision and lower recall.
  </figcaption>
</figure>

<figure class="ema-figure">
<img width="1643" height="1114" alt="Precision-recall trade-off curve for SiT (latent space) at 90 epochs: EMA decay changes the balance between precision and recall" class="img-fluid" loading="lazy" src="{{ '/assets/img/2027-04-30-ema-in-diffusion-training/sit_precision_recall.png' | relative_url }}"/>
<figcaption>
<b>SiT (latent space) at 90 epochs, CFG = 1.5: a subtler version of the same trade-off.</b>
</figcaption>
</figure>

This also explains why there is no universally best decay. FID is sensitive to both fidelity and coverage, so it tends to reward a compromise point on the precision-recall curve. Precision-like metrics can prefer larger decays. Recall prefers smaller decays. Once EMA decay moves the precision-recall ratio, different metrics naturally select different decays.

<figure class="ema-figure">
<img width="3054" height="998" alt="3-panel chart of FID and Inception Score vs EMA decay for RAE-DiT-XL, JiT, and SiT, showing that the FID-best and IS-best EMA decays can differ" class="img-fluid" loading="lazy" src="{{ '/assets/img/2027-04-30-ema-in-diffusion-training/fid_is_3panel.png' | relative_url }}"/>
<figcaption>
<b>Different metrics prefer different EMA decays.</b>
    Each panel shows FID (blue, left axis) and Inception Score<d-cite key="ema-is"></d-cite>
    (purple, right axis). Because EMA changes the precision-recall balance, FID, IS, precision,
    and recall need not agree on the same best decay.
  </figcaption>
</figure>

RAE is the cleanest example: FID is best at β = 0.999, while Inception Score keeps improving toward larger decays. JiT is different: β = 0.9995 is best on both FID and IS in this sweep. SiT is milder: FID is nearly flat around the high-decay region, while IS keeps rising. The common lesson is not that one decay is always right. The lesson is that EMA decay changes the distributional trade-off, so the metric decides which decay rate serves best.

## Soft Collapse in a 2D Toy

The ImageNet sweeps show the metric-level effect: larger EMA decay raises precision and reduces recall. The toy example below shows the same effect at the sample level. We use a 2D distribution from AutoGuidance<d-cite key="ema-autoguidance"></d-cite>: a tree with dense, popular branches and sparse tail branches. If recall drops, those tail branches should be the first places to disappear.

We train one small MLP score model, then compare the raw model with EMA versions at <code>0.99 / 0.997 / 0.998 / 0.999</code>. The first figure is the sweep overview: read it left to right as EMA decay increases.

<figure class="ema-figure">
<img width="1800" height="567" alt="2D toy EMA sweep showing samples and same-seed trajectories concentrating on dominant branches as EMA decay increases" class="img-fluid" loading="lazy" src="{{ '/assets/img/2027-04-30-ema-in-diffusion-training/soft-overconcentration.jpg' | relative_url }}"/>
<figcaption>
<b>Increasing EMA decay pulls mass toward the dominant branches.</b>
    Top: final samples overlaid on the true tree. Bottom: same-seed trajectories, with tail-branch
    paths highlighted. As decay grows, trajectories that should cover tail branches are pulled
    back toward the trunk. At 0.999, the averaged model is stale enough that samples
    start leaving the manifold.
  </figcaption>
</figure>

The most useful comparison is not the catastrophic <code>0.999</code> case. It is the softer <code>0.998</code> case: samples still look plausible, but coverage has already changed.

<figure class="ema-figure">
<div class="ema-pair-figure">
<div class="ema-col">
<div class="ema-label">Raw model</div>
<img width="700" height="697" alt="Raw model samples on the tree distribution" class="img-fluid" loading="lazy" src="{{ '/assets/img/2027-04-30-ema-in-diffusion-training/model.jpg' | relative_url }}"/>
</div>
<div class="ema-col">
<div class="ema-label">EMA 0.998</div>
<img width="700" height="700" alt="EMA 0.998 samples on the tree distribution" class="img-fluid" loading="lazy" src="{{ '/assets/img/2027-04-30-ema-in-diffusion-training/ema0998.jpg' | relative_url }}"/>
</div>
</div>
<figcaption>
<b>Same seeds, same training run.</b>
    The red boxes mark sparse tail branches. The raw model covers them more broadly; EMA 0.998
    concentrates samples along the main trunk and under-covers the tail branches.
  </figcaption>
</figure>

This is not a hard collapse to a single mode. It is softer: EMA over-concentrates the model on high-density regions. That explains the precision-recall trade-off from the previous section. Samples can look cleaner because they hug typical patterns more tightly, while rare configurations quietly lose coverage.

## Closing Remarks

EMA is easy to trust because it is genuinely useful. It stabilizes sampling, improves raw checkpoints, and has become part of the default diffusion training recipe. But the decay rate is not just an implementation detail: it changes which checkpoint we evaluate and where the model sits on the precision-recall curve.

<b>Our practical recommendation is simple: report the EMA decay, and treat it as part of the evaluation protocol.</b> For short-schedule comparisons, fixed-budget FID at 40 or 80 epochs, or EP<sub>FID@k</sub>, matched EMA settings matter. When possible, sweep EMA under a shared protocol; at minimum, an early FID number should come with the EMA decay that produced it.

Several questions remain open. Can the precision-recall trade-off be characterized directly from how EMA reshapes the score function? Does the optimal β drift predictably with training horizon, model size, or guidance scale? If so, adaptive EMA, scheduled EMA, or post-hoc EMA methods such as EDM2<d-cite key="ema-edm2"></d-cite> could make matched comparisons routine rather than expensive. Until then, the cheapest safeguard is also the simplest: whenever you report a short-schedule number, report the EMA decay that produced it.
