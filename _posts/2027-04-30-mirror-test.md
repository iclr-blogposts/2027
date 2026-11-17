---
layout: distill
title: "The Mirror Test: Does a Physics-Like Orbit Model Respect a Symmetry It Never Saw?"
description: "Small transformers trained on planetary orbits can behave much like a textbook integration rule on held-out orbits from their training distribution. Mirroring an orbit leaves the physics unchanged, but every training orbit runs counter-clockwise. I mirror the test orbits to see whether the models carry this symmetry, and then measure how much of the gap closes when mirrored orbits are added to the training data at the same budget."
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

Picture a planet on an elliptical orbit, moving counter-clockwise around its star. Reflect the whole picture across the long axis of the ellipse, and the planet traces the same ellipse clockwise (Figure 1).

Newtonian gravity does not notice the difference. The force depends only on the distance to the star and points toward it, so the mirrored motion is as valid an orbit as the original. A rule that computes the next position of the planet from its last two positions should therefore return the mirrored output when it is given mirrored inputs. This property is called *equivariance*, and it holds for rotations of the picture as well.

<div class="l-page">
  {% include figure.liquid path="assets/img/2027-04-30-mirror-test/fig1_mirror_orbit.png" class="img-fluid" zoomable=true %}
</div>

<div class="caption" style="text-align: left;">
    <strong>Figure 1.</strong> An orbit from the training distribution, its mirror image, and a rotated copy. Geometry only: no model output is shown. Dots are consecutive samples at the time step of the data, the open circle is the starting point, and the dotted line is the major axis. Mirroring keeps the ellipse and reverses the direction of travel; rotation keeps the direction. Every training orbit runs counter-clockwise. <a href="{{ 'assets/img/2027-04-30-mirror-test/fig1_mirror_orbit.png' | relative_url }}">Open the full-size figure.</a>
</div>

This post puts that requirement to small transformers that predict orbits. Earlier work describes one kind of them as close to a textbook integration rule, and every orbit they were trained on runs counter-clockwise. Does such a model also have a symmetry of that rule which training never exercised? In brief, it does not: on mirrored orbits the one-step error grows roughly 9 to 40 times, depending on the training run, and adding mirrored orbits to the training data at the same budget narrows the gap in steps.

## The models under test

The models come out of three pieces of earlier work with different status.

Vafa et al. <d-cite key="vafa2025foundation"></d-cite>, a peer-reviewed paper (ICML 2025), trained a large transformer on planetary trajectories: it predicts them accurately, yet fails to apply Newtonian mechanics when adapted to new physics tasks. Liu et al. <d-cite key="liu2026kepler"></d-cite>, in an arXiv preprint, argued that three design choices change this: continuous coordinates, noise added to the inputs, and a context of only two positions. They speculated, without testing it, that such a model should generalize better outside its training distribution. Sandler and York <d-cite key="sandler2026keplerish"></d-cite>, in an Arcadia Science publication that is not peer reviewed, analysed the two-position models and concluded that the one trained with noise computes a circular-orbit heuristic, while the one trained without noise is close to a Verlet integrator with a central acceleration that falls off roughly as $$r^{-1.9}$$.

I test these small two-position models, not the large model of Vafa et al. Each has about 25,000 parameters, reads two consecutive positions and predicts the next. All 30 models reported here were trained for this study with the recipe of Liu et al., as implemented in the code released with the Arcadia analysis: with or without input noise, three kinds of training data introduced below, and five training seeds (independent training runs) each.

One property of the data matters throughout. The released data-generation code starts every orbit at its closest point to the star, draws its orientation uniformly at random, and always runs it counter-clockwise. (I read the direction from the code; the paper does not state it.) The training distribution therefore covers rotations and contains no reflected orbit, which makes rotation a natural control.

All measurements below use held-out orbits: 500 new orbits drawn from the training distribution, independently of the training data. I call them in-distribution orbits, and first ask what "close to Verlet" amounts to on them.

## How close to Verlet, and where

Position Verlet computes the next position from the current and the previous one:

$$
r_{t+1} = 2 r_t - r_{t-1} - \Delta t^2 \, GM \, \frac{r_t}{\lvert r_t \rvert^3}
$$

Here $$\Delta t$$ is the time between two samples and the star sits at the origin. By *Verlet with exact force* I mean this rule with the true inverse-square force; it is still a discrete approximation, not the exact orbit.

The first two terms continue the last displacement, as if nothing acted on the planet. I call this the inertial part (Figure 2). Only the last term contains gravity. A rule that assumes constant velocity has the same first two terms, so linear weights close to 2 and −1 in a model say nothing about gravity.

<div style="max-width: 520px; margin: 0 auto;">
  {% include figure.liquid path="assets/img/2027-04-30-mirror-test/fig2_verlet_step.png" class="img-fluid" zoomable=true %}
</div>

<div class="caption" style="text-align: left;">
    <strong>Figure 2.</strong> One position-Verlet step, drawn as a schematic with an enlarged time step. The inertial extrapolation (dashed arrow) plus the gravity correction (orange arrow) gives the Verlet prediction (hollow square), shown next to the true next position (black star). <a href="{{ 'assets/img/2027-04-30-mirror-test/fig2_verlet_step.png' | relative_url }}">Open the full-size figure.</a>
</div>

<details markdown="1">
<summary>Supplement: the average linear weights of all 30 models</summary>

{% include figure.liquid path="assets/img/2027-04-30-mirror-test/figS1_linear_weights.png" class="img-fluid" zoomable=true %}

<div class="caption" style="text-align: left;">
    <strong>Figure S1.</strong> The equivalent linear mapping <d-cite key="golden2025elm"></d-cite>, the tool used by Sandler and York, rewrites the output of a network for one input as an exact linear function of that input. Each marker is one model: the weights that this map puts on the current and on the previous position, averaged over in-distribution inputs. The noise-free models lie near the inertial point (2, −1) and the noisy ones do not. Being near that point does not show a gravity term, because constant-velocity extrapolation sits exactly on it. <a href="{{ 'assets/img/2027-04-30-mirror-test/figS1_linear_weights.png' | relative_url }}">Open the full-size figure.</a>
</div>

</details>

To look at the gravity term directly, I subtract the inertial part from the prediction $$\hat r_{t+1}$$ of a model and divide by the squared time step:

$$
a_{\mathrm{eff}} = \frac{\hat r_{t+1} - 2 r_t + r_{t-1}}{\Delta t^2}
$$

I call this the *implied acceleration*. For Verlet with exact force it equals the Newtonian acceleration, which points at the star and has size $$GM/r^2$$. Because the samples are coarse in time, even a perfect predictor does not imply exactly the Newtonian value, so a second reference applies the same formula to the true next position.

For the five noise-free models trained on counter-clockwise orbits, on in-distribution orbits (Figure 3a and 3c):

- the direction is off the direction to the star by a median of 2.5 to 4.8 degrees;
- the component toward the star has a median of roughly 0.91 to 1.01 times the Newtonian value;
- the size falls off with distance as a power law with an exponent between −1.90 and −2.08, where Newton's law gives −2.

These are typical values. The direction has a wide tail: its 99th percentile is 32 to 73 degrees. The fit is best at intermediate distances and worse far from the star, where gravity is weak. Close to the star the discrete sampling error is not negligible: even the reference computed from the true positions points off-centre by a median of about 5 degrees.

<details markdown="1">
<summary>Details: numbers by distance from the star</summary>

Distances are in the units of the data, in which orbit sizes range from 0.5 to 2. At radii between 0.5 and 1, the median angle is under 2 degrees for all five models. At radii of 2 or more (about 16 per cent of the samples), it is roughly 8 to 22 degrees, and the implied acceleration differs from the true-position reference by a median of roughly 23 to 44 per cent. At radii below 0.5 (about 4 per cent of the samples), the true-position reference itself is off-centre by a median of about 5 degrees.

</details>

The implied acceleration is therefore behavioural evidence for the description: on typical in-distribution inputs, these models act like a Verlet step with a central, roughly inverse-square acceleration, with deviations of the order of ten per cent. It is not enough to show that they hold a Newtonian law that carries over to other inputs. The models trained with input noise do not fit the description: their implied acceleration is off-centre by a median of 36 to 42 degrees and falls off with exponents of −0.64 to −0.70, in line with the circular-orbit heuristic reported by Sandler and York.

The evidence has two stages. For seeds 1 to 3 this analysis was added after the mirror results were known, so it is post hoc; for seeds 4 and 5 it was fixed in a written plan before the models were trained. The two groups agree.

<div class="l-body-outset">
  {% include figure.liquid path="assets/img/2027-04-30-mirror-test/fig3_implied_acceleration.png" class="img-fluid" zoomable=true %}
</div>

<div class="caption" style="text-align: left;">
    <strong>Figure 3.</strong> Implied acceleration of the models trained without input noise, on 500 held-out orbits and their mirror images. (a, b) Median size per distance bin for the five models trained on one direction, against the Newtonian value (dashed) and the reference from true positions (solid); both axes are logarithmic. (c) Angle to the direction of the star, median and 5–95% range, on a logarithmic axis: the true-position reference, the five models trained on one direction, and the five trained with 50% mirrored orbits. Open markers are follow-up seeds 4–5 (analysis fixed before training); filled markers are seeds 1–3 (post hoc). <a href="{{ 'assets/img/2027-04-30-mirror-test/fig3_implied_acceleration.png' | relative_url }}">Open the full-size figure.</a>
</div>

The mirror test asks whether this description extends beyond in-distribution orbits.

## What breaks in the mirror

The test reflects each held-out orbit about its own major axis. A model predicts each next position from the two true previous positions, on both versions. The error is the distance between prediction and truth in units of 1.25, the mean orbit size in training, averaged over each orbit. The quantity of interest is the paired increase: the error on the mirrored orbit minus the error on the original, averaged over the 500 pairs, with a 95 per cent bootstrap interval over orbits.

I calibrated the test on hand-written rules before looking at any trained model. Rules that are equivariant by construction, Verlet with exact force among them, have an increase of zero up to rounding error; a circular-orbit rule that always turns counter-clockwise has an increase of 0.233. I set the threshold at 0.01: a model is *degraded* if its whole interval lies above the threshold and *not degraded* if its whole interval lies below. "Not degraded" means only that the increase stayed under this threshold, not that the symmetry holds exactly.

All five noise-free models trained on one direction are degraded (Figure 4, top left). Their mean error rises from 0.0020–0.0033 on in-distribution orbits to 0.030–0.085 on the mirrored ones, a factor of roughly 9, 30 and 40 for seeds 1 to 3 and 25 and 20 for seeds 4 and 5. The size of the failure depends on the training run; the verdict does not. Verlet with exact force has an error of about 0.0026 on both versions.

Two observations narrow down the failure. The models are not simply turning the wrong way: on more than 97 per cent of the mirrored steps the predicted motion is clockwise, as it should be, and the prediction still lands in the wrong place. The failure is also specific to the mirror. The rotation-equivariance error, which measures how far the output is from rotating together with the input, is 0.0013 to 0.0023, the same order as the in-distribution prediction error. The mirror-equivariance error is 14 to 57 times larger.

The implied acceleration shows what the wrong predictions look like (Figure 3b and 3c). On mirrored orbits it no longer points at the star: the median angle is 25, 69, 68, 57 and 72 degrees for the five seeds. Beyond that, the seeds fail in different ways. In four of them a sideways component appears that pushes against the direction of motion, with a median size of roughly 0.9 to 3.5 times the Newtonian acceleration. Seed 4 is a counter-example: its sideways component is close to zero in the median, and its pull toward the star is only about half of the Newtonian value. This describes the failures without explaining them.

The numbers were obtained in stages. Seeds 1 to 3 were first measured on one set of held-out orbits; the models, metrics and criteria were then fixed in writing, 500 new orbit pairs were drawn, and all 18 verdicts for these seeds (six training conditions each) came out the same on the new set. Seeds 4 and 5 were trained afterwards under a plan fixed in advance and were measured on that same second set, not on a third one.

The most direct explanation is that the models never saw a clockwise orbit. That can be tested.

## Adding mirrored orbits at the same budget

For each seed I retrained with the same trajectories, training windows, initial weights and number of steps, after mirroring a random 10 or 50 per cent of the trajectories. The budget is unchanged, so each direction gets fewer examples. Supplying a symmetry through the training data is a well-known idea <d-cite key="chen2020group"></d-cite>; here it is not a method but a control for one explanation. Before training these models I wrote down what would count as confirmation at 50 per cent: the increase is not degraded, and in every seed the mirror-equivariance error is at most twice the rotation-equivariance error. I call this the joint criterion.

Without input noise the gap narrows in two steps (Figure 4, top row). With 10 per cent mirrored orbits the increase falls to about 0.002–0.003 and all five models are not degraded, but the error on clockwise orbits is still 1.4 to 2.0 times the error on counter-clockwise ones. With 50 per cent the absolute increase is below 0.0004 in all five seeds and the mirror-equivariance error is 1.0 to 1.2 times the rotation-equivariance error, so the joint criterion is met. That is a statement relative to rotation, not a proof of exact mirror equivariance. The implied acceleration of these models points at the star to within a median of 2.4 to 4.3 degrees on original and mirrored orbits alike (Figure 3c). On in-distribution orbits the two groups of models look alike; they differ on mirrored inputs.

The second recipe adds Gaussian noise of standard deviation 0.1 to the training inputs and, as in the earlier work, evaluates on clean inputs. Coverage acts more slowly here (Figure 4, bottom row). Trained on one direction, these models predict counter-clockwise motion on more than 99.8 per cent of the mirrored steps, and the increase is about 0.30. With 10 per cent mirrored orbits all five are still degraded (increase 0.09 to 0.11) and turn clockwise on only 32 to 39 per cent of the mirrored steps. With 50 per cent, all five are not degraded: the increase is between −0.006 and +0.009, and the interval closest to the threshold ends at about 0.0090. The ratio of mirror to rotation equivariance error, however, is 1.5, 2.6, 1.7, 1.3 and 2.2 for the five seeds. Three seeds are within the factor of two and two are not, so by the rule set in advance the joint criterion is neither confirmed nor refuted. I report it as undetermined.

The 50 per cent models of this recipe also do worse on counter-clockwise orbits: their error is roughly 15 to 29 per cent higher than the one-direction model of the same seed, in all five seeds. The cause is not identified. Without noise there is no consistent cost; the corresponding error is higher in four seeds and lower in one.

The control supports the explanation that the mirror failure of the noise-free models comes from the missing mirrored training data. It does not rule out other contributing factors, and two tested fractions do not show how much mirrored data would be the minimum.

<div class="l-page">
  {% include figure.liquid path="assets/img/2027-04-30-mirror-test/fig4_coverage.png" class="img-fluid" zoomable=true %}
</div>

<div class="caption" style="text-align: left;">
    <strong>Figure 4.</strong> The mirror test for all 30 models on the same 500 held-out orbit pairs; logarithmic vertical axes, shared between the rows. Each marker is one model, and a line joins the two measurements of that model; within a group, seeds run from 1 to 5, left to right. Left: one-step error on in-distribution orbits and on their mirror images. Right: how far the output is from rotating, or from reflecting, together with the input. The criteria for the models with mirrored training data were written down before those models were trained. <a href="{{ 'assets/img/2027-04-30-mirror-test/fig4_coverage.png' | relative_url }}">Open the full-size figure.</a>
</div>

One question is left: could the failure have been seen without running a mirrored orbit, from how a model behaves near in-distribution inputs?

## Why a local extrapolation flags even the true rule

This part is secondary, and its model-level numbers are exploratory: they were computed after the test results were known, and only for seeds 1 to 3.

The simplest attempt is a first-order extrapolation. At an in-distribution input, the Jacobian of the model says how the output changes for small changes of the input. This tangent approximation gives an estimate of the output at the mirrored input, and with it an estimate of the error increase.

For all nine noise-free models of seeds 1 to 3 the predicted increase is between 0.09 and 0.11 (Figure 5b). That includes the six models trained with mirrored data, whose observed increase is below 0.003.

A case with a known answer shows why. Verlet with exact force has a true increase of zero, and the same extrapolation predicts an increase of about 0.106, roughly ten times the threshold. The inertial part of the rule is linear and is extrapolated exactly. The gravity term is not linear, and mirroring moves the input by a distance comparable to the size of the orbit, far outside the range in which a tangent approximation is accurate (Figure 5a).

<details markdown="1">
<summary>Details: the extrapolation error in closed form, and a second variant</summary>

For Verlet with exact force, the first-order extrapolation across the mirror misses the prediction of the rule itself by

$$
-\,6 \, \Delta t^2 \, GM \, s^2 \, \frac{r_t}{\lvert r_t \rvert^5}
$$

where $$s$$ is the distance of the current position from the mirror axis. The first-order terms cancel, and this is the second-order remainder. On the held-out orbits its mean size is about three times the mean size of the gravity correction.

A second variant keeps the equivalent linear map of a model (see the supplement above) fixed while the input changes. It also predicts a clear degradation for the six mirror-trained models.

</details>

The conclusion is narrow. Across a change of input as large as a mirror, this extrapolation cannot tell whether a rule is mirror-equivariant, since Verlet with exact force is flagged too. That does not show that looking inside a model is uninformative about how it generalizes.

<div class="l-page">
  {% include figure.liquid path="assets/img/2027-04-30-mirror-test/fig5_first_order.png" class="img-fluid" zoomable=true %}
</div>

<div class="caption" style="text-align: left;">
    <strong>Figure 5.</strong> First-order extrapolation across the mirror. (a) One mirrored orbit, at the frame where the original and the mirrored positions are farthest apart. Verlet with exact force, applied to the mirrored input, lands very close to the true next position at the scale of the plot; the first-order extrapolation of the same rule from the original input does not. (b) Error increase predicted by the extrapolation and observed, for Verlet with exact force and for the noise-free models of seeds 1–3 (post hoc, exploratory). <a href="{{ 'assets/img/2027-04-30-mirror-test/fig5_first_order.png' | relative_url }}">Open the full-size figure.</a>
</div>

## What the study supports

The study covers two short-context recipes, five training seeds per condition and one set of held-out orbits. Within that scope, the noise-free two-position models act like Verlet on typical in-distribution inputs and do not carry the mirror symmetry of that rule, while their rotation-equivariance error stays small. Mirrored training data at equal budget narrow the gap in steps. With input noise, 10 per cent is not enough, and at 50 per cent the increase is under the threshold in all five seeds while the joint criterion remains undetermined, with three of five seeds within the bound.

Several things remain open: why the mirror failure takes the form it does and differs between training runs, with seed 4 as the clearest case; what causes the cost in the noisy recipe; and how the gap depends on the share of mirrored data beyond the two values tested. Only two seeds per condition were trained under a plan fixed in advance, and they were not measured on a third set of orbits.

The results say nothing about the large model of Vafa et al., models with a longer context, or transformers in general. "Not degraded" and "meets the joint criterion" are statements about thresholds, not proofs of exact symmetry, and the failure of the local extrapolations tested here is not a verdict on mechanistic analysis.

A description such as "this network is close to a Verlet integrator" is obtained on inputs from the training distribution, and it is a statement about those inputs. The rule it names has symmetries. Whether the model has them is a separate question, and here a paired test on reflected inputs, with rotation as a control and hand-written rules as calibration, answered it directly.

## Notes on evidence

Numbers are read from saved result files and figures are produced by script. Values are rounded to the digits shown; a range such as "0.0020–0.0033" gives the smallest and the largest value over the five seeds. Where a sentence states a bound ("below", "under", "more than", "between"), the unrounded values satisfy it. The plans mentioned above are version-controlled local records, not external registrations. Code, weights and raw results are not linked here, to keep the post anonymous during review.
