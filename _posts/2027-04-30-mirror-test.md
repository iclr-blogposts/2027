---
layout: distill
title: "Does a Verlet-Like Orbit Transformer Respect the Mirror?"
description: "Small transformers trained only on counter-clockwise planetary orbits have been described as close to Verlet, a textbook integration rule. Reflecting held-out orbits about their major axes leaves the physics intact, yet all five noise-free baseline models, trained on counter-clockwise orbits only, fail the mirror test while their rotation-equivariance error stays small. Adding mirrored orbits at the same training budget narrows the gap in steps, and for the recipe with input noise the outcome at 50% mirrored data is undetermined by the criterion set in advance."
date: 2027-04-30
future: true
htmlwidgets: true
hidden: true

authors:
  - name: Anonymous

# must be the exact same name as the blog post file
bibliography: 2027-04-30-mirror-test.bib

# The toc entries must match the section headings exactly.
toc:
  - name: Why physics should respect the mirror
  - name: The models under test
  - name: How close to Verlet, and where
  - name: What breaks in the mirror
  - name: Adding mirrored orbits at the same budget
  - name: Why a local extrapolation flags even the true rule
  - name: What the study supports
  - name: Notes on evidence
---

## Why physics should respect the mirror

Take a planet circling its star counter-clockwise on an ellipse, and reflect its path across the long axis of the ellipse. The ellipse does not move and the planet still starts at its closest point to the star, but it now travels clockwise (Figure 1).

Newtonian gravity cannot tell the two paths apart: the pull depends only on the distance to the star and points at it, so the reflected path obeys the same law. Hence a correct rule that maps the planet's two latest positions to the next one must answer a reflected pair with the reflection of its earlier answer, and a rotated pair with a rotated answer. Such a rule is called *equivariant*: transform the input, and the output transforms the same way.

<div class="l-page">
  {% include figure.liquid path="assets/img/2027-04-30-mirror-test/fig1_mirror_orbit.png" class="img-fluid" zoomable=true %}
</div>

<div class="caption" style="text-align: left;">
    <strong>Figure 1.</strong> Left, an original orbit; middle, its reflection about the major axis; right, a rotated copy. Only geometry is drawn, and no model is involved. Small dots are successive samples at the time step of the data, the open circle marks the start, the dotted line is the major axis, and large black dots mark the same frame numbers in all three panels. Reflection keeps the ellipse but reverses the direction of travel; rotation keeps the direction. The released data generator produces only counter-clockwise orbits. <a href="{{ 'assets/img/2027-04-30-mirror-test/fig1_mirror_orbit.png' | relative_url }}">Open the full-size figure.</a>
</div>

The released data generator produces only counter-clockwise orbits, and models trained on them with this recipe have been described as close to a textbook integration rule that is itself equivariant under reflection. Does a model that resembles the rule share this symmetry, which its training never exercised?

I first test a baseline group trained on counter-clockwise orbits only. For its noise-free models the answer is no: on mirrored orbits their one-step error rises by a factor of roughly 9 to 40, depending on the training run. I then retrain with mirrored orbits mixed in at the same budget, which shrinks the gap in stages, and finally ask whether a local look at the models could have predicted the failure.

## The models under test

The background comes from Vafa et al. <d-cite key="vafa2025foundation"></d-cite>, a peer-reviewed ICML 2025 paper. Their large transformer predicts planetary trajectories accurately but, when adapted to new physics tasks, does not use Newtonian mechanics. Liu et al. <d-cite key="liu2026kepler"></d-cite> argue in an arXiv preprint that three design choices change this: continuous coordinates, noisy training inputs, and a context of just two positions. They speculate that such models should also do better outside the training distribution, without testing it.

Sandler and York <d-cite key="sandler2026keplerish"></d-cite>, in an Arcadia Science publication that is not peer reviewed, analyzed two-position models trained with this recipe; these are not the models of this post. In their reading, the model trained with noise uses a circular-orbit heuristic, and the noise-free model is close to a Verlet integrator whose acceleration toward the center decays roughly as $$r^{-1.9}$$.

My subjects are small two-position models of the same kind, not the large model of Vafa et al. Each has about 25,000 parameters and maps two consecutive positions to the next. All 30 models in this post were trained for this study, using the recipe of Liu et al. in the implementation released with the Arcadia analysis: two recipes (with or without input noise), three kinds of training data, and five seeds (independent training runs) per combination. The baseline group of 10 models sees counter-clockwise orbits only; the other 20 models are trained on mixtures with mirrored orbits, introduced later.

The released generator starts each orbit at perihelion, its point closest to the star, picks the orientation of the ellipse uniformly at random, and always runs the orbit counter-clockwise. The direction is set in the code; the main text of the paper of Liu et al. does not state it. The training distribution of the baseline group therefore covers every orientation but no reflection, which makes rotation a natural control.

All model results in this post use one shared validation set: 500 held-out orbits, drawn from the training distribution independently of the training data, each paired with its mirror image. I call the two members of a pair the *original orbit* and the *mirrored orbit*. For the baseline group, the original orbits come from the training distribution and the mirrored ones do not; for the models trained with mirrored orbits, both kinds do.

## How close to Verlet, and where

Position Verlet steps an orbit forward from its two latest positions. With the star at the origin and $$\Delta t$$ the time between samples,

$$
r_{t+1} = 2 r_t - r_{t-1} - \Delta t^2 \, GM \, \frac{r_t}{\lvert r_t \rvert^3}
$$

*Verlet with exact force* means this rule with the true inverse-square force; it is still a discrete approximation, with a small error of its own.

The *inertial part*, $$2 r_t - r_{t-1}$$, carries the last displacement forward, as if no force acted. The *gravity correction*, the final term, is the only term that contains the force (Figure 2). A constant-velocity rule shares the inertial part and lacks the correction, so a model that weights the current and previous positions by about 2 and −1 has shown only that it has the inertial part (see the supplement below).

<div style="max-width: 520px; margin: 0 auto;">
  {% include figure.liquid path="assets/img/2027-04-30-mirror-test/fig2_verlet_step.png" class="img-fluid" zoomable=true %}
</div>

<div class="caption" style="text-align: left;">
    <strong>Figure 2.</strong> Schematic of one position-Verlet step, with the time step enlarged so the parts are visible. The dashed arrow (inertial part) continues the last displacement; the orange arrow (gravity correction) points toward the star. Their sum is the Verlet prediction (hollow square), next to the true next position (black star). <a href="{{ 'assets/img/2027-04-30-mirror-test/fig2_verlet_step.png' | relative_url }}">Open the full-size figure.</a>
</div>

<details markdown="1">
<summary>Supplement: the linear weights of all 30 models</summary>

{% include figure.liquid path="assets/img/2027-04-30-mirror-test/figS1_linear_weights.png" class="img-fluid" zoomable=true %}

<div class="caption" style="text-align: left;">
    <strong>Figure S1.</strong> Average linear weights of all 30 models. The equivalent linear map <d-cite key="golden2025elm"></d-cite>, which Sandler and York used, expresses the output of a network at a given input as an exact linear function of that input, with weights that vary from input to input. Each marker is one model, positioned at the weights its map assigns to the current and previous positions, averaged over inputs from the original orbits. Noise-free models cluster near (2, −1); noisy ones do not. The star marks the inertial part on its own. A constant-velocity rule lies exactly on it, so being near the star is no evidence of gravity. <a href="{{ 'assets/img/2027-04-30-mirror-test/figS1_linear_weights.png' | relative_url }}">Open the full-size figure.</a>
</div>

</details>

Subtracting the inertial part from the prediction $$\hat r_{t+1}$$ of a model and dividing by $$\Delta t^2$$ isolates what the model adds:

$$
a_{\mathrm{eff}} = \frac{\hat r_{t+1} - 2 r_t + r_{t-1}}{\Delta t^2}
$$

This is the *implied acceleration*. For Verlet with exact force it equals the Newtonian acceleration, of size $$GM/r^2$$ and directed at the star. With samples this coarse in time, even the true next position does not give exactly the Newtonian value, so the formula applied to it serves as a second reference.

On the original orbits, the five noise-free baseline models give (Figure 3a and 3c):

- a median angle between the implied acceleration and the direction of the star of 2.5 to 4.8 degrees;
- a median component toward the star of roughly 0.91 to 1.01 times the Newtonian value;
- a power-law decay with distance, with fitted exponents from −1.90 to −2.08 against Newton's −2.

The angle has a long tail, its 99th percentile ranging from 32 to 73 degrees across models. Agreement is best at intermediate distances and gets worse far from the star, where gravity is weak. Near the star the discrete sampling error is not negligible: even the true-position reference deviates from the direction toward the star by a median of about 5 degrees.

<details markdown="1">
<summary>Details: the numbers by distance from the star</summary>

Distances use the units of the data, in which the semi-major axes of training orbits range from 0.5 to 2. In the band from 0.5 to 1, all five models have a median angle below 2 degrees. From a distance of 2 outward, where about 16% of the samples lie, the median angle is roughly 8 to 22 degrees, and the median gap to the true-position reference is roughly 23% to 44%. Inside 0.5 (about 4% of the samples), the true-position reference itself deviates from the star direction by a median of about 5 degrees.

</details>

As behavioral evidence, this supports a bounded description. For typical inputs from their training distribution, the noise-free baseline models behave like a Verlet step with a central, nearly inverse-square acceleration; the median deviation of their implied acceleration from the true-position reference is 7.4% to 12.3%. It does not show that the models carry a Newtonian law that holds on other inputs. The noisy baseline models do not fit even this description. Their implied acceleration deviates from the direction of the star by a median of 36 to 42 degrees and decays with exponents of −0.64 to −0.70, consistent with the circular-orbit heuristic that Sandler and York describe.

For seeds 1 to 3 this analysis is post hoc, added once the mirror results were in; for seeds 4 and 5 it was specified in a written plan before training. Both groups give the same picture.

<div class="l-body-outset">
  {% include figure.liquid path="assets/img/2027-04-30-mirror-test/fig3_implied_acceleration.png" class="img-fluid" zoomable=true %}
</div>

<div class="caption" style="text-align: left;">
    <strong>Figure 3.</strong> Implied acceleration of the noise-free models, on the 500 original orbits (blue) and their mirror images (orange). (a, b) For the five baseline models, the median size within each distance bin, compared with the Newtonian value (dashed) and the true-position reference (solid line); both axes are logarithmic. (c) Median angle between the implied acceleration and the direction of the star, with the 5–95% range, on a logarithmic axis: the true-position reference, the five baseline models, and the five models trained with 50% mirrored orbits. Filled markers: seeds 1–3, post hoc analysis. Open markers: seeds 4–5, analysis fixed before training. <a href="{{ 'assets/img/2027-04-30-mirror-test/fig3_implied_acceleration.png' | relative_url }}">Open the full-size figure.</a>
</div>

Everything in this section, including the judgment that these models are close to Verlet, was measured on original orbits, the kind of input the baseline models were trained on. The next section asks whether the Verlet-like behavior brings the rule's mirror symmetry with it.

## What breaks in the mirror

The test reflects each validation orbit about its own major axis and runs the model on both members of the pair, always feeding it the two true previous positions (teacher forcing) so that each prediction is scored alone. The one-step error $$e$$ of an orbit is the distance between the prediction and the true next position, in units of 1.25 (the mean semi-major axis in training), averaged along the orbit.

The quantity of interest is the paired increase

$$
\Delta = \frac{1}{500} \sum_{i=1}^{500} \left( e_i^{\mathrm{mirrored}} - e_i^{\mathrm{original}} \right),
$$

with a 95% bootstrap interval from resampling the pairs. The interval reflects the choice of test orbits, not differences between training runs, so every seed is listed.

I calibrated the test on hand-written rules before evaluating any trained model, using a separate batch of orbit pairs drawn for that purpose. Each rule that is equivariant by construction, Verlet with exact force included, shows an increase of zero up to rounding error; a circular-orbit rule hard-wired to turn counter-clockwise shows 0.233. Between the two, I placed the threshold at 0.01. A model is *degraded* if its interval lies entirely above 0.01, *not degraded* if entirely below, and *undetermined* if it straddles the threshold. *Not degraded* says only that the increase stayed under the threshold; it claims neither that there is no difference nor that the symmetry is exact.

Every one of the five noise-free baseline models is degraded (Figure 4, top left). Mean error climbs from 0.0020–0.0033 on the original orbits to 0.030–0.085 on the mirrored ones; seed by seed, the factors are about 9, 30, 40, 25 and 20. The size of the failure varies across training runs, but the verdict does not. Verlet with exact force, by contrast, has an error of about 0.0026 whichever way the orbit runs.

The models almost always turn the right way: on more than 97% of the mirrored steps the predicted motion is clockwise, yet the predicted position is wrong. And the failure appears under the mirror but not under rotation. Equivariance can be measured head-on: transform the input pair, predict, and compare with the transformed original prediction, in the same units. For a rotation by a random angle per orbit, this rotation-equivariance error is 0.0013 to 0.0023, the same order as the one-step error on the original orbits. Computed with the reflection instead, the mirror-equivariance error comes out 14 to 57 times larger.

On mirrored orbits the implied acceleration no longer points at the star (Figure 3b and 3c); its median angle to the star is 25, 69, 68, 57 and 72 degrees for seeds 1 to 5. A sideways component appears in every seed: the median of its size is 0.86, 2.24, 3.47, 0.85 and 1.33 times the Newtonian acceleration for seeds 1 to 5. In four seeds it pushes consistently against the motion. Seed 4 is the exception: its sideways push is about as large as that of seed 1, but it falls on either side of the motion, so its signed median is close to zero. A consistent backward push is therefore not a general feature of the failure. These observations describe the failure without explaining it.

Seeds 1 to 3 were first measured on a separate exploration set of orbits. I then froze their weights, wrote down the metrics and criteria, drew the 500 validation pairs and measured again: all 18 verdicts for these seeds, across six training conditions, were unchanged. Seeds 4 and 5 were trained later under a plan written in advance and evaluated on the same validation set; no third set was drawn.

The obvious suspect is the training data, which held no clockwise orbit. That can be tested.

## Adding mirrored orbits at the same budget

The control keeps the 10,000 training orbits, the training windows, the initial weights and the number of steps of each seed, but reflects each orbit before training with probability 10% or 50%. Depending on the seed, this mirrors 973 to 1,018 orbits in the 10% condition and 4,947 to 5,025 in the 50% condition. The total stays fixed, so counter-clockwise examples become fewer, while clockwise ones go from none to about a tenth or a half of the data.

Teaching a symmetry through the data is an established idea <d-cite key="chen2020group"></d-cite>; here it is not a proposed method but a test of one explanation. Before these models were trained, I wrote down the *joint criterion* for 50%: every seed not degraded, and in every seed a mirror-equivariance error no more than twice the rotation-equivariance error.

**Noise-free recipe.** The gap closes in two stages (Figure 4, top row). At 10%, all five models are not degraded, with increases of about 0.002–0.003, yet some asymmetry remains: on clockwise orbits the error is still 1.4 to 2.0 times the counter-clockwise error.

At 50%, no seed has an absolute increase of 0.0004 or more, and the ratio of mirror- to rotation-equivariance error falls to 1.0–1.2, which meets the joint criterion. That is relative to rotation, not proof of exact mirror equivariance. The implied acceleration of these 50% models stays central on both kinds of orbit, with a median angle of roughly 2.4 to 4.3 degrees (Figure 3c). On original orbits it looks like that of the baseline models; the two groups differ on mirrored inputs.

**Noisy recipe.** Training inputs here carry Gaussian noise of standard deviation 0.1; evaluation, as in the earlier work, uses clean inputs. Coverage works more slowly (Figure 4, bottom row). The noisy baseline models predict counter-clockwise motion on more than 99.8% of the mirrored steps, with an increase of about 0.30. At 10%, every seed is still degraded, with increases of 0.09 to 0.11, and only 32% to 39% of the mirrored steps turn clockwise.

At 50%, all five noisy models are not degraded. Their increases lie between −0.006 and +0.009, and the largest upper end of an interval, about 0.0090, sits just under the threshold. The ratio of mirror- to rotation-equivariance error is less tidy: 1.5, 2.6, 1.7, 1.3 and 2.2 for seeds 1 to 5, which puts seeds 2 and 5 above the factor of two. The rule fixed in advance counts this as neither support nor failure, so the joint criterion is undetermined.

On original (counter-clockwise) orbits, the noisy 50% models are also less accurate than the noisy baseline model of the same seed: their error is roughly 15% to 29% higher, in all five seeds, for reasons I have not identified. The noise-free recipe shows no consistent shift: four seeds go up and one goes down.

The control therefore supports one explanation for the noise-free models: their mirror failure comes from the absence of mirrored training data. It does not exclude other contributing factors, and two tested fractions cannot locate the smallest share of mirrored data that would suffice.

<div class="l-page">
  {% include figure.liquid path="assets/img/2027-04-30-mirror-test/fig4_coverage.png" class="img-fluid" zoomable=true %}
</div>

<div class="caption" style="text-align: left;">
    <strong>Figure 4.</strong> Mirror-test results for all 30 models on the shared validation set of 500 orbit pairs. Upper row, no training noise; lower row, training noise 0.1. Groups: one direction (the baseline), 10% and 50% mirrored. Left panels: one-step error on the original (counter-clockwise) orbits and on their mirror images, with Verlet with exact force as a dashed line. Right panels: rotation- and mirror-equivariance errors. Each model appears as a pair of markers joined by a thin line, one marker for each of its two values in that panel; within each group the seeds run from 1 to 5, left to right, and open markers are seeds 4–5. Vertical axes are logarithmic and shared by both rows. The criteria for the mirror-trained models were set before those models were trained. <a href="{{ 'assets/img/2027-04-30-mirror-test/fig4_coverage.png' | relative_url }}">Open the full-size figure.</a>
</div>

## Why a local extrapolation flags even the true rule

Could the behavior of a model near its usual inputs have revealed the failure before its answers on mirrored orbits were seen? The extrapolations below use the mirrored inputs, which are known in advance from the geometry, but never the model's actual output for them. This is a side question, and it covers only the nine noise-free models of seeds 1 to 3. Their Jacobian-based numbers were computed after the test results were known and are exploratory.

The obvious tool is a first-order extrapolation: take the Jacobian of the model at an input from an original orbit, follow that tangent out to the mirrored input, and read off an estimated output and error increase.

For all nine models, the estimate sits between 0.09 and 0.11 (Figure 5b), including the six mirror-trained models whose measured increase is below 0.003.

The reason shows up on a rule whose answer is known. For Verlet with exact force the true increase is zero, yet the extrapolation predicts about 0.106, roughly ten times the threshold. The inertial part is linear, and the tangent captures it exactly. The gravity correction is nonlinear, and mirroring shifts the input by a distance on the scale of the orbit itself, far beyond where a tangent is reliable (Figure 5a).

<details markdown="1">
<summary>Details: the extrapolation error in closed form, and a second variant</summary>

For Verlet with exact force, the first-order extrapolation across the mirror differs from the output of the rule at the mirrored input by

$$
-6 \, \Delta t^2 \, GM \, s^2 \, \frac{r_t}{\lvert r_t \rvert^5}
$$

with $$s$$ the distance of the current position from the mirror axis. The terms of first order in $$s$$ cancel, leaving this second-order term as the entire error. Averaged over the held-out orbits, its size is about three times that of the gravity correction.

A second variant freezes the equivalent linear map of a model (the map behind Figure S1) at the original input and reuses it at the mirrored input; its predictions were saved before the test inputs were run. It too predicts a degradation for all six models trained with mirrored orbits.

</details>

Two results should be kept apart. First, on these nine models, neither extrapolation's threshold verdict separates the three degraded models from the six not-degraded ones: both call all nine degraded. Yet the predicted values of the frozen map place all six mirror-trained models below the three baseline models, so the information is not absent; the verdicts are what fail. Second, and more strongly, the Jacobian extrapolation flags even Verlet with exact force, an exactly equivariant rule. Across a change as large as a mirror, such threshold verdicts cannot be trusted. That falls well short of showing that looking inside a model reveals nothing about how it generalizes.

<div class="l-page">
  {% include figure.liquid path="assets/img/2027-04-30-mirror-test/fig5_first_order.png" class="img-fluid" zoomable=true %}
</div>

<div class="caption" style="text-align: left;">
    <strong>Figure 5.</strong> First-order extrapolation across the mirror. (a) Validation orbit pair 0, at the frame where the original and mirrored positions lie farthest apart. Applied to the mirrored input, Verlet with exact force lands near the true next position at this scale; the first-order extrapolation of the same rule from the original input misses. (b) Predicted versus measured error increase for Verlet with exact force and for the noise-free models of seeds 1–3 (post hoc, exploratory); dashed line, threshold 0.01. <a href="{{ 'assets/img/2027-04-30-mirror-test/fig5_first_order.png' | relative_url }}">Open the full-size figure.</a>
</div>

## What the study supports

The scope of this study is two short-context recipes, five seeds per condition and one shared validation set. Within it, the noise-free baseline models act approximately like Verlet on typical inputs from their training distribution, within the limits measured above. They lack the mirror symmetry of that rule, while their rotation-equivariance error stays small. Mirrored training data at the same budget narrows this gap in steps.

The noisy baseline models are not Verlet-like even on original orbits, and coverage helps the noisy recipe more slowly, at a cost that appears in all five seeds. At 50%, every noisy seed stays under the threshold, but only three of five meet the factor-of-two bound, so the joint criterion is undetermined. Finally, on the nine models tested, the threshold verdicts of both local extrapolations fail to separate the degraded models from the not-degraded ones, and the Jacobian extrapolation flags even Verlet with exact force.

Still open: why the mirror failure takes this form and differs between training runs (seed 4 most visibly), what causes the cost in the noisy recipe, and how the gap depends on the mirrored share beyond the two fractions tested. Gaps remain too: only two seeds per condition followed a plan fixed before training, and no third set of orbits confirmed them.

Nothing here extends to the large model of Vafa et al., to longer-context models or to transformers in general. *Not degraded* and *meets the joint criterion* are threshold statements, not proofs of exact symmetry, and two extrapolations with failed verdicts are no verdict on mechanistic analysis.

My main takeaway is that a description such as *close to a Verlet integrator*, established on inputs from the training distribution, applies to those inputs. Whether the network also has the symmetries of the rule it names is a separate question, and a paired test answers it directly: transform the inputs, use a symmetry the data cover as the control, and calibrate the threshold on hand-written rules with known answers. Here, for the noise-free baseline models, resemblance on the training distribution did not bring the symmetry with it.

## Notes on evidence

Results come from saved result files, and a script draws the figures from them. Numbers are rounded to the digits shown, a range like 0.0020–0.0033 spans the smallest to the largest value over the models concerned (usually the five seeds), and every bound stated in words, such as below, more than or between, holds for the unrounded values. The plans I mention are version-controlled local records, not external registrations. No code, weights or raw results are linked, to keep the post anonymous during review.
