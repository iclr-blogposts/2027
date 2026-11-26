---
layout: distill
title: "Same Collision, Different Prediction: A Lesson in JEPA Masking"
description: >-
  We use a collision simulation to ask which cues a predictor learns when part of an object's history is hidden.
  Flipping a lamp while holding the collision fixed changed the predicted motion more after masked training, even when the lamp was an imperfect cue.
  The experiment illustrates how masking and the training data together shape what a predictor relies on.
date: 2027-04-30
future: true
htmlwidgets: true
authors:
  - name: Anonymous
bibliography: 2027-04-30-same-collision-different-prediction.bib
toc:
  - name: Same collision, two lamp states
  - name: What the mask hides
  - name: Testing what the model learned
  - name: When the lamp is only sometimes right
  - name: A shortcut test you can reuse
---

<!-- Working draft for author review and rewrite before submission. -->

## Same collision, two lamp states

Even when two rollouts show the exact same collision, flipping the lamp changes the context a predictor receives. In our experiment, the lamp is a separate input cue, and the puck’s motion and the mask stay fixed. A JEPA predictor uses the context it can see to infer target representations. We use the lamp flip to ask when object masking helps a model learn the dynamics and when it increases reliance on a shortcut.

Try **Lamp follows contact** below. A rule that predicts motion when the striker makes contact gets all four trials right. A rule that predicts motion when the lamp is on gets the same score. Now choose **Lamp varies independently** and compare trials 3 and 4. The striker hits the puck in both trials, and the puck moves both times. The two rules disagree when the lamp is off.

<div class="l-page">
  <iframe
    src="{{ 'assets/html/2027-04-30-same-collision-different-prediction/contact-shortcut.html' | relative_url }}"
    title="Contact and lamp predictions in two toy datasets"
    width="100%"
    height="630"
    style="border: 0"
  ></iframe>
</div>

The lamp is a *shortcut*: its relationship to contact can make it useful for prediction even though it does nothing to the puck. Hiding the puck’s recent motion leaves the predictor with two possible clues. Which one will it learn to use?

## What the mask hides

A joint-embedding predictive architecture, or JEPA, learns to predict a representation of a target from a representation of its context. In Causal-JEPA, the representations are organized into *object slots*. Each slot is a vector associated with an entity in the scene. That gives the training procedure a choice about which entity’s history to show the predictor.<d-cite key="nam2026causal"></d-cite>

During training, Causal-JEPA keeps the first frame’s slot as an identity anchor for a selected object and masks that object’s remaining history. The predictor is trained to fill in the missing history and forecast future slots. At test time it receives the full observed history. The intuition is that hiding recent puck positions takes away the easy option of extrapolating the puck’s own motion. The striker’s trajectory can then help explain what happened to it.<d-cite key="nam2026causal"></d-cite>

How useful the mask is depends on what the remaining slots contain. In the paper’s CLEVRER masking ablation, counterfactual accuracy per question increased from 47.68% to 68.81% for the VideoSAUR encoder when the number of masked objects went from zero to four. For SAVi, accuracy peaked at 60.19% with two masked objects and dropped to 34.06% with four. The paper’s analysis also allows correlated variables to be useful for prediction. Our lamp example isolates that possibility.<d-cite key="nam2026causal"></d-cite>

It helps to distinguish three changes. An **object mask** hides observations. A **lamp flip** changes one observed cue while holding the motion fixed. An **action intervention** varies an action that can change how the scene evolves. Do-JEPA studies the third kind by comparing action-conditioned rollouts from the same starting state.<d-cite key="resani2026dojepa"></d-cite>

## Testing what the model learned

We simulate two equal-mass discs. One approaches a stationary puck and either hits or misses it. The dataset contains equal numbers of hits and misses and leaves out grazing approaches. Each example gives the predictor two striker positions before contact, two recent puck positions after contact or closest approach, a lamp bit, and a flag indicating whether the puck history is hidden. The prediction is the puck’s two-dimensional displacement over the next unit of time. With the puck history visible, its velocity already gives enough information to predict the displacement exactly.

We train the same two-hidden-layer predictor under two mask rates. One always sees the puck history. The other loses both recent puck positions with 50% probability for each training example. At the two endpoints of our comparison, the lamp either always agrees with contact or appears equally often in both states for each scene. Each condition uses five seeds, with 8,192 training scenes, 4,096 held-out scenes, and 600 updates per seed. Within each seed, the geometry, initial weights, and training budget are matched across conditions. We use two layers of 64 hidden units with SiLU activations and train with squared displacement loss and AdamW at a learning rate of 0.003.

For every held-out scene, we predict once with the lamp off and once with it on. In the main test, the puck history is visible in both versions. We measure two quantities:

- **Lamp sensitivity** is the average distance between the two predicted displacements.
- **Paired prediction error** is the average distance from the predicted displacement to the true displacement, across both lamp states.

Both are distances on a scale where the two disc radii sum to one. The first measures how much the predictor responds to the edited input. The second measures how accurate its forecasts are.

{% include figure.liquid path="assets/img/2027-04-30-same-collision-different-prediction/paired-lamp-sensitivity.png" class="img-fluid" alt="Across five seeds, masking during training increases sensitivity to a perfectly coupled lamp. Training with independent lamp values reduces that sensitivity." %}

When the lamp always tracks contact during training, adding masking increases sensitivity from **0.120 to 0.466**, even though the puck history is visible at test time. Giving each training scene both lamp values brings the masked model’s sensitivity down to **0.020**. The second panel hides the puck history at test time as a separate stress test. Hidden history is a new input pattern for models trained without masking, so the visible-history panel is the primary comparison.

This is a controlled test with simulator-provided object states and a small predictor. DINO-WM evaluates planning with pretrained visual features, and CF-JEPA tests control under visual distractors. A paired lamp test on learned video representations or a planning system would need its own experiment.<d-cite key="zhou2025dinowm,byrd2026cfjepa"></d-cite>

## When the lamp is only sometimes right

Perfect agreement leaves the predictor with no training examples where contact and the lamp disagree. To see whether the effect extends to familiar cue combinations, we repeat training at five levels of lamp agreement: 50%, 62.5%, 75%, 87.5%, and 100%. At intermediate levels, we train on both lamp versions of each scene, weighting their losses by the probabilities of agreement and disagreement. The held-out test still gives both lamp states equal weight for each scene.

{% include figure.liquid path="assets/img/2027-04-30-same-collision-different-prediction/lamp-coupling-sweep.png" class="img-fluid" alt="With history visible at test time, masking increased lamp sensitivity at each measured agreement level. The largest change occurred at perfect agreement. Paired error for masked training was broadly steady through 87.5 percent agreement and jumped at 100 percent." %}

At **87.5% agreement**, both lamp states occur for each type of collision during training. Masking still increases sensitivity from **0.017 to 0.073**. All five seeds show higher sensitivity after masked training at each tested agreement level. The largest change occurs at perfect agreement, where the edited combination falls outside the training data.

Notice what happens to the masked model between 50% and 87.5% agreement. Its paired prediction error decreases from **0.117 to 0.104**, while its sensitivity to the lamp increases from **0.020 to 0.073**. A predictor can improve on average and become more reliant on a particular cue at the same time. The paired comparison makes that reliance visible.

## A shortcut test you can reuse

Pick one cue whose relationship to the target could change outside training. Make paired test inputs that differ only in that cue, and keep the physical state and target fixed. Measure how much the prediction changes alongside how accurately it predicts both examples. Record whether each cue and state combination appeared during training, and report separate results if you test with a different observation mask.

The useful question after masking is which clues are still available and whether they can stand in for one another in the training data. In our collision example, the puck’s motion came from contact in every condition. The models learned different roles for the lamp because they saw different patterns of agreement.
