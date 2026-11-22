---
layout: distill
title: "Toward Observability in Physical AI: Offline Diagnostics for Imitation-Learning Policies in Robotics"
description: When an imitation-learning policy fails on a robot, the failure looks the same whatever its cause. This post turns the terms of the objective behind the Action Chunking Transformer into ten metrics that are computed from recorded demonstrations and saved policies, without a robot, each with a reference value and a place in a fixed order of checks. On two datasets from a low-cost arm they expose a policy that had been trained for 2 steps instead of 20,000, policies that take 98 to 100% of their output from the cameras and almost none from the joint readings, and a measure of the demonstrations alone that anticipates the error after training.
date: 2027-04-30
future: true
htmlwidgets: true
hidden: true

# Anonymize when submitting
authors:
  - name: Anonymous

# must be the exact same name as your blogpost
bibliography: 2027-04-30-toward-observability-in-physical-ai.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
toc:
  - name: Introduction
  - name: Related Work
  - name: Preliminaries
    subsections:
      - name: Behavioural Cloning
      - name: Covariate Shift
      - name: Action Chunking With a Hidden Variable
  - name: Offline Observability Metrics
    subsections:
      - name: What the Metrics Need
      - name: The Ten Metrics
      - name: The Order of the Checks
  - name: Experiments
    subsections:
      - name: Setup
      - name: A Failed Run
      - name: Training
      - name: New Demonstrations
      - name: More Demonstrations
      - name: The Inputs
      - name: The Light
  - name: Limitations
  - name: Conclusion
  - name: Reproducibility
  - name: Appendix
---

## Introduction

Training a manipulation policy by imitation has become an afternoon's work. With an open-source library such as LeRobot <d-cite key="cadene2026lerobot"></d-cite>, a low-cost arm and a set of teleoperated demonstrations, a practitioner can record data, train an Action Chunking Transformer (ACT) <d-cite key="zhao2023act"></d-cite> and run it on hardware the same day. What has not become easier is finding out why such a policy fails. On the robot every failure looks alike: the arm does not do the task.

The papers that introduce these policies report how often a task succeeds, which needs the robot. Studies with many rollouts have shown that numbers computed from recordings cannot stand in for that, because they do not rank policies by success <d-cite key="mandlekar2021matters,cowling2026validation"></d-cite>. Ranking is not the only use of a number, however. Elsewhere in machine learning, SHAP <d-cite key="lundberg2017shap"></d-cite> and LIME <d-cite key="ribeiro2016lime"></d-cite> are used to look inside a model before it is trusted. This raises the question we pursue here: _what can the files that a training run leaves behind tell us about why a policy will fail, before it is put on a robot?_

We are trying to make better metrics and observability for these models, just like SHAP and LIME are used in ML.<d-footnote>SHAP and LIME explain a single prediction by the inputs that drove it. Most of the checks in this post are of another kind and come earlier: whether a policy was trained, whether it fits its data, whether it carries over to something new. What they share with SHAP and LIME is the aim: a model whose behaviour can be looked at before it is trusted. One of our metrics, the share of an answer that comes from each input, is a Shapley value in the strict sense.</d-footnote> We check the math at each step and take decisions accordingly. In other words, this post is an attempt to monitor what is going on and then decide what to do, rather than estimate, ask your favourite LLM or search online. The thought process, the calculation, the analysis should be yours. Asking an LLM is letting it make judgement calls, which can go either way depending on how effectively you have used the prompt and which version of the LLM you are using (Sonnet, Fable, etc.); each has different token limits and infrastructure available around it. Going by analysis is first making the table, taking a look, and then making the decision.

The work started from a failure of exactly this kind. A policy trained at a hackathon was run on an SO-101 arm for 55 seconds, and the arm stayed where it was. The explanation written down afterwards blamed a change in the light, and nothing that was checked at the time contradicted it. Eight months later the files of that run told a different story: the training had run for 2 optimisation steps instead of 20,000, and none of the policy's 51.7 million parameters had moved by more than 0.000021 from its starting value.

{% include figure.liquid path="assets/img/2027-04-30-toward-observability-in-physical-ai/order-of-questions.png" class="img-fluid" %}

<div class="caption">
    <strong>Figure 1.</strong> Overview. The terms of the imitation-learning objective become checks that are run in a fixed order on recorded files. Each check has a reference to read it against, and a check that fails says what to do before the later ones are worth running. The values shown are the ones found in this post.
</div>

We take the objective behind ACT and turn each of its terms into a metric that can be computed from three things a training run leaves behind: the recorded demonstrations, the saved policy and the random seed. Every metric comes with a reference value to read it against, and the metrics are grouped into four checks with a fixed order (Figure 1). We apply them to two datasets recorded on a low-cost arm: a pick-and-place task with 2 demonstrations, trained for 2 to 20,000 steps, and a second task with up to 58 demonstrations.

Our contributions are summarized as follows:

- We define ten offline metrics for imitation-learning policies, grouped into four checks. Each is tied to a term of the objective and has a reference value: a policy that holds still, the movement in the demonstrations, the starting parameters rebuilt from the seed, or the distances among the training pictures. None needs a robot.
- Three of the metrics we have not found reported for ACT: the share of an answer that comes from each input, as an exact Shapley value; the coverage of new demonstrations by the training demonstrations, computed before any training; and the first action of a chunk, compared with holding still.
- On real data we find that the joint readings account for 0 to 2% of a policy's answer and the cameras for the rest; that coverage anticipates the error after training; that on new demonstrations a chunk starts 5 to 17 units away from where the arm is; and that a policy trained to an error of 1.8 on two demonstrations has an error of 45.8 on a third.

This post is not meant to show awesome new ways of training. Rather, it builds on what three types of model have already achieved: ACT at the first hackathon, then a VLA and SmolVLA <d-cite key="shukor2025smolvla"></d-cite> at the second. Nothing is better than understanding something at its core, to control how to build on those foundations.

## Related Work

**Imitation learning on low-cost arms.** ACT trains a conditional variational autoencoder <d-cite key="kingma2013vae"></d-cite> to predict chunks of future actions from camera images and joint readings <d-cite key="zhao2023act"></d-cite>. LeRobot packages it with tools for recording and training <d-cite key="cadene2026lerobot,lerobot2024github"></d-cite>, and a tutorial from the same group gives the derivations we follow <d-cite key="capuano2025robot"></d-cite>. The ACT authors "record 50 demonstrations for each task" <d-cite key="zhao2023act"></d-cite>, and LeRobot's [documentation](https://huggingface.co/docs/lerobot/il_robots) suggests "at least 50 episodes, with 10 episodes per location".

**What recordings can and cannot tell.** In a large study in simulation, choosing a checkpoint by its loss on validation data gave a policy "significantly worse than the best one (10% to 100% decrease)" <d-cite key="mandlekar2021matters"></d-cite>. A recent study on the same arm as ours, with four kinds of policy and 930 rollouts on the robot, concludes that "Held-out metrics are a sound diagnostic of learning but no substitute for evaluation on the robot" <d-cite key="cowling2026validation"></d-cite>. We take the first half of that sentence as our subject. The effects we measure are known at scale. A benchmark of manipulation policies under controlled perturbations found changes in lighting among the most damaging <d-cite key="pumacay2024colosseum"></d-cite>, and a study with more than 40,000 demonstrations found that generalisation follows the variety of the data more than its amount <d-cite key="lin2025scaling"></d-cite>.

**Looking inside a policy.** SHAP and LIME explain a single prediction by the inputs that drove it, and MM-SHAP uses Shapley values to measure how much each modality contributes in vision and language models <d-cite key="parcalabescu2023mmshap"></d-cite>. For vision-language-action models, a visual importance ratio has been estimated by replacing the visual input or the joint readings with zeros and measuring the change in the action; it ranges from proprioception-dominant to vision-dominant across models and environments <d-cite key="zhang2026idr"></d-cite>. A study at ICLR 2026 finds that in policies given both vision and proprioception, vision plays a limited role in the phases where the motion changes, because proprioception dominates there <d-cite key="lu2026when"></d-cite>; the ACT policies tested here show the opposite imbalance. Scores of how unusual an observation is for a policy are used to predict failures without a robot <d-cite key="majumdar2025redteaming"></d-cite>. Diffusion policies trained on small datasets have been found to memorise a lookup table of their training actions, while "ACT shows action interpolation with poor robustness in OOD regimes" <d-cite key="he2025demystifying"></d-cite>. Our metrics bring these ideas to ACT on recorded files, and add the three listed above.

## Preliminaries

So understanding the base paper and each equation is imperative. Here is the translation. Table I gives each equation in plain words, with its value in the run of the section "A Failed Run". The rest of this section states the equations. The derivations follow the tutorial of Capuano et al. <d-cite key="capuano2025robot"></d-cite>, which is distributed under a CC BY-NC-SA 4.0 license.

<div class="caption">
    <strong>TABLE I</strong><br>The equations in plain words, and their values in the first run.
</div>

| Equation | In plain words | Value in the first run |
| -------- | -------------- | ---------------------- |
| (1) $$ \mathcal{D} = \{(o_t, a_t)\} $$ | A demonstration is a recording of the task done once. Thirty times a second it holds what the robot saw and what it was told to do. | 2 demonstrations, 3,365 timesteps |
| (2) $$ \mathcal{L}(\theta) = -\,\mathbb{E}\bigl[\log \pi_\theta(a \mid o)\bigr] $$ | How surprised the policy is by what the demonstrator did. There is no reward in it and no notion of success. | Error on its own data: 27.9 after 2 steps, 1.8 after 20,000 |
| (3) $$ \theta_{k+1} = \theta_k - \eta\, u_k $$ | One training step moves every parameter a little. $$ \eta $$ sets how little, so the number of steps times $$ \eta $$ bounds how far the parameters can go. | $$ \eta $$ = 0.00001 and 2 steps: no parameter moved by more than 0.000021 |
| (4) $$ p_{\text{deploy}}(o_t) \neq p_{\text{train}}(o_t) $$ | The policy only knows what the cameras saw during the demonstrations. Anything else is outside its experience, and small errors build on each other. | 1.9% of the picture at or near white in training, 5 to 23% in the rollout |
| (5) $$ p(o, a) = \int p(o, a \mid z)\, p(z)\, dz $$ | Some things about a demonstration are never recorded, such as the way the demonstrator chose to reach. $$ z $$ stands in for them. | 32 numbers in training, all zero on the robot |
| (6) $$ \text{ELBO} = \mathbf{L}^{\text{rec}} - D_{\text{KL}}\bigl[q_\phi \,\Vert\, p(z)\bigr] $$ | Two terms pull against each other: reconstruct what was demonstrated, and keep $$ z $$ close to plain noise so that it cannot memorise each demonstration. | The weight on the second term, $$ \beta $$, is 10 |
| (7) $$ \pi_\theta(a_t, \ldots, a_{t+H-1} \mid o_t, z) $$ | The policy predicts the next $$ H $$ actions at once. Fewer decisions means fewer chances for errors to build up; the cost is that it does not look again until the chunk is played. | $$ H $$ = 100 actions, 3.3 s per chunk, 17 chunks in the 55 s rollout |

### Behavioural Cloning

A demonstration $$ \tau^{(i)} $$ is a recording of the task done once by teleoperation. At each of its $$ T_i $$ timesteps it holds an observation $$ o_t $$, here camera images and joint readings, and an action $$ a_t $$, the target joint positions:

$$
\mathcal{D} = \{\tau^{(i)}\}_{i=1}^{N}, \qquad \tau^{(i)} = \{(o_t^{(i)}, a_t^{(i)})\}_{t=0}^{T_i}. \tag{1}
$$

Behavioural cloning fits a policy $$ \pi_\theta(a \mid o) $$ to the $$ N $$ demonstrations by minimising

$$
\mathcal{L}(\theta) = -\,\mathbb{E}_{(o,a) \sim \mathcal{D}}\bigl[\log \pi_\theta(a \mid o)\bigr]. \tag{2}
$$

There is no reward in this loss and no notion of success: the policy learns to reproduce the demonstrator. Training repeats one small step,

$$
\theta_{k+1} = \theta_k - \eta\, u_k, \tag{3}
$$

where $$ u_k $$ is the direction that reduces the loss on a batch of recorded timesteps and $$ \eta $$ is the learning rate. With the optimiser used here, AdamW <d-cite key="loshchilov2019adamw"></d-cite>, a parameter moves by about $$ \eta $$ at most in each of the first steps, so the distance $$ \theta $$ can have travelled is bounded by about the number of steps times $$ \eta $$.

### Covariate Shift

A cloned policy has only seen the observations that the demonstrator produced. At deployment it meets others:

$$
p_{\text{deploy}}(o_t) \neq p_{\text{train}}(o_t). \tag{4}
$$

Once the policy errs, it sees something outside the training distribution, and its next action is less reliable still. A policy that errs with probability $$ \epsilon $$ on the demonstrator's states "can make as many as $$ T^2 \epsilon $$ mistakes in expectation over $$ T $$-steps" when it runs by itself <d-cite key="ross2011dagger"></d-cite>, a bound due to Ross and Bagnell <d-cite key="ross2010efficient"></d-cite>. Anything that changes what the camera sees, a shifted object or a change in the light, moves the observations away from the training distribution (Figure 2).

{% include figure.liquid path="assets/img/2027-04-30-toward-observability-in-physical-ai/covariate-shift.png" class="img-fluid" %}

<div class="caption">
    <strong>Figure 2.</strong> Covariate shift: the observations seen in training (blue) and at deployment (red). The shaded band holds observations the policy was never trained on.
</div>

### Action Chunking With a Hidden Variable

ACT is a conditional variational autoencoder (Figure 3). A hidden variable $$ z $$ stands for what a demonstration does not record, such as the way the demonstrator chose to reach. The likelihood of the data is an average over $$ z $$,

$$
p(o, a) = \int_{\text{supp}(Z)} p(o, a \mid z)\, p(z)\; dz, \tag{5}
$$

which cannot be computed directly. Training maximises a lower bound instead, derived in the Appendix:

$$
\text{ELBO}_{\mathcal{D}}(\theta, \phi) = \sum_{i=1}^{N} \Bigl( \underbrace{\mathbb{E}_{z \sim q_\phi(\bullet \mid (o,a)_i)}\bigl[\log p_\theta((o,a)_i \mid z)\bigr]}_{\mathbf{L}^{\text{rec}}(\theta):\;\text{reconstruction}} - \underbrace{D_{\text{KL}}\bigl[q_\phi(z \mid (o,a)_i) \,\Vert\, p(z)\bigr]}_{\mathbf{L}^{\text{reg}}(\phi):\;\text{regularisation}} \Bigr). \tag{6}
$$

The first term rewards the decoder for reconstructing the demonstrated actions from the encoder's estimate of $$ z $$. The second keeps that estimate close to a standard normal distribution, so that the decoder can act without the encoder. In ACT the decoder predicts a chunk of $$ H $$ actions at once,

$$
\pi_\theta(a_t, a_{t+1}, \ldots, a_{t+H-1} \mid o_t, z), \tag{7}
$$

and is trained with an L1 reconstruction term and a weight $$ \beta $$ on the regularisation term:

$$
\mathcal{L}_{\text{ACT}}(\theta, \phi) = \bigl\lVert a_{t:t+H-1} - \hat a_{t:t+H-1} \bigr\rVert_1 + \beta\, D_{\text{KL}}\bigl[q_\phi(z \mid o_t, a_{t:t+H-1}) \,\Vert\, \mathcal{N}(\mathbf{0}, \mathbf{I})\bigr]. \tag{8}
$$

Predicting in chunks "reduces the effective horizon of the task by k-fold, mitigating compounding errors" <d-cite key="zhao2023act"></d-cite>. At deployment there is no demonstration to encode, and $$ z $$ is set to zero, "the mean of the prior distribution" <d-cite key="zhao2023act"></d-cite>. One property of the L1 term is used later: a model that can only output a constant does best with the median of the data.

{% include figure.liquid path="assets/img/2027-04-30-toward-observability-in-physical-ai/act-cvae.png" class="img-fluid" %}

<div class="caption">
    <strong>Figure 3.</strong> ACT as a conditional variational autoencoder. In training, the encoder turns the demonstrated chunk into \(z\) and the decoder reconstructs the chunk. At deployment the encoder is not used and \(z = 0\).
</div>

## Offline Observability Metrics

### What the Metrics Need

The metrics need three things that a training run leaves behind: the recorded demonstrations, with at least one demonstration kept out of training; the saved policy, at one or more checkpoints; and the random seed of the run. None of them needs the robot. A _chunk_ is the $$ H $$ actions a policy predicts from one observation. Distances between chunks are mean absolute differences over the $$ H $$ steps and the joints, in the units of the dataset.

A number means little alone, so each metric is read against a reference:

- **Holding still.** A policy that predicts no movement: its chunk repeats the arm's current joint positions. It needs no learning, so a learned policy should beat it.
- **The demonstrations.** How far the joints travel within $$ H $$ steps of a demonstration, and how far the demonstrator's first action is from where the arm is.
- **The starting parameters.** They are rebuilt by seeding the random generators as the training script does and constructing the policy.
- **The training pictures.** The distances among them in the policy's own vision features.

### The Ten Metrics

Table II lists the metrics and the reference each is read against. Their definitions follow it.

<div class="caption">
    <strong>TABLE II</strong><br>The ten metrics, grouped into four checks.
</div>

| Check | Metric | What it makes visible | Read it against |
| ----- | ------ | --------------------- | --------------- |
| **1. Was it trained?** | M1. Parameter movement | Whether training happened at all | Steps times $$ \eta $$; the size of a typical parameter |
| **2. Does it fit its data?** | M2. Error on its own demonstrations | Whether the policy fits its data | Holding still |
| | M3. Movement inside a chunk | Whether it moves at all | The demonstrations |
| **3. Does it carry over?** | M4. Error on demonstrations it never saw | Memory or skill | Holding still, and M2 |
| | M5. Coverage | Whether the data can support what will be asked, before training | M4, after training |
| | M6. Closest stretch | Where an answer comes from | The distance to the truth |
| **4. What does it depend on?** | M7. Input shares | Whether it listens to its cameras, its joint readings, or both | The other inputs |
| | M8. First action of a chunk | Whether a chunk starts where the arm is | The demonstrator's first action; holding still |
| | M9. Brightness sensitivity | How much it depends on how the scene looks | The error on unchanged pictures |
| | M10. Picture distance | How new a scene is to the policy | The distances among the training pictures |

**M1, parameter movement.** The mean and the largest absolute difference between the saved parameters $$ \theta_k $$ and the starting parameters $$ \theta_0 $$ rebuilt from the seed. By (3) it cannot much exceed $$ k\eta $$.

**M2 to M4, error and movement.** The policy is given a recorded frame and the joint readings that went with it, and its chunk is compared with the $$ H $$ actions that the demonstrator took next. Movement inside a chunk is the range each joint covers within the chunk, averaged over joints.

**M5 and M6, coverage and closest stretch.** Let $$ \mathcal{S} $$ be every stretch of $$ H $$ consecutive actions in the training demonstrations, and let $$ d(c, \mathcal{S}) $$ be the distance from a chunk $$ c $$ to the closest of them. Coverage is $$ d $$ averaged over the true chunks of demonstrations the policy will not see; it needs the recordings only. The closest-stretch metric is $$ d $$ of the chunks the policy predicts.

**M7, input shares.** For two recorded frames $$ i $$ and $$ j $$, write $$ f(I, S) $$ for the chunk the policy predicts from picture $$ I $$ and joint readings $$ S $$. The share of the cameras in the difference between the two answers is

$$
\phi_{\text{cam}} = \tfrac{1}{2}\bigl[f(I_i, S_i) - f(I_j, S_i)\bigr] + \tfrac{1}{2}\bigl[f(I_i, S_j) - f(I_j, S_j)\bigr], \tag{9}
$$

and the share of the joint readings is defined in the same way with the roles exchanged. The two shares add up exactly to $$ f(I_i, S_i) - f(I_j, S_j) $$. This is the Shapley value for two inputs; with two cameras there are three inputs and eight evaluations per pair. We report the mean absolute share. For comparison we also report the visual importance ratio $$ R_{\text{img}} $$ of Zhang et al. <d-cite key="zhang2026idr"></d-cite>, which replaces an input with zeros instead of with that of another frame, and a variant of it that uses the mean over the training data.

**M8, first action of a chunk.** The distance between the first predicted action and the arm's current joint positions, against the same distance for the demonstrator's action. We also give the first position in the chunk from which the policy's error stays below that of holding still.

**M9 and M10, brightness and picture distance.** For M9 every pixel value is multiplied by a gain and clipped at white, with the joint readings unchanged; a pixel counts as at or near white when its three colour values average at least 250 of 255. For M10 each frame is passed through the policy's vision backbone and averaged over the picture; the metric is the distance to the closest training frame, in units of the median distance between a training frame and the closest training frame more than 5 s away.

### The Order of the Checks

The checks are ordered so that each one is informative only once the earlier ones pass (Figure 1). A policy has to be trained before it can fit its data. It has to fit its data before its behaviour on new data means anything. And it has to carry over before its sensitivity to the scene is what limits it. A check that fails says what to do: train; train longer; record more demonstrations; control the scene, or put its variation in the data.

## Experiments

### Setup

Table III describes the two datasets and the policies trained on them.

<div class="caption">
    <strong>TABLE III</strong><br>Datasets and policies. All policies are ACT as implemented in LeRobot 0.4.5 with default settings: \(H = 100\), \(\beta = 10\), \(\eta = 10^{-5}\), batch size 8, seed 1000.
</div>

| | Ball task | Toaster task |
| --- | --- | --- |
| Robot | One SO-101 arm, 6 joints | Two SO-101 arms, 12 joints; one arm moves |
| Cameras | 1, above the table, 1920 × 1080 | 2, front and hand, 640 × 480 |
| Units | Degrees; gripper in % of its opening | A scale from −100 to 100 |
| Demonstrations | 2 for training (3,365 timesteps at 30 Hz); 1 unseen | 64 (32,670 timesteps at 30 Hz); the last 6 unseen |
| Policies | 2 steps (the failed run); 300 to 20,000 steps; 20,000 steps with image augmentation | 20,000 steps on the first 2, 8, 29 and 58 demonstrations; 58 continued to 60,000 steps |
| Also recorded | One rollout of the 2-step policy on the arm, 1,656 steps | |

**Datasets.** The ball task is to pick up a ball and put it in a roll of tape. The toaster task is to put a slice of bread in a toaster; it was recorded two months later by the author and two teammates. Because the two tasks use different units, numbers are never compared across them. Each is read against its own references, and for the toaster task errors are taken over the six joints of the arm that moves.

**Evaluation.** All tests are offline and use every 30th frame unless stated otherwise: 113 frames of the two training demonstrations and 60 of the unseen one for the ball task; about 90 frames of the six unseen demonstrations for the toaster task. The offline test was checked against the robot: on frames of the recorded rollout it reproduces the commands that were sent to the arm to within 2.8 units on average.

### A Failed Run

The first run took place at a public hackathon, with LeRobot and the [`solo-cli`](https://github.com/GetSoloTech/solo-cli) tool that wraps it. Table IV lists what its files record, and Table V sets the run beside the published recipe.

<div class="caption">
    <strong>TABLE IV</strong><br>The day of the first run, as recorded in its files.
</div>

| Local time | What the records show | Source |
| ---------- | --------------------- | ------ |
| 12:38 | Tool downloaded | Version-control history |
| 13:00, 14:10 | Leader arm calibrated, then follower arm | Calibration files |
| 14:42 – 14:56 | Four demonstrations recorded, about a minute each; the last two form the training set | Dataset files |
| 15:20 | Replay of the first training demonstration on the arm; no policy involved | Shell history, tool settings |
| 15:31 | Training launched on a cloud GPU | Shell history |
| 16:35 | Policy uploaded; its saved configuration says `steps: 2` | Model repository |
| 16:59 | Policy run on the arm for 55 s | Recorded rollout |
| 18:15 – 19:04 | Motor scan, two recalibrations, three more recording attempts, none registered as a dataset | Shell history, dataset files |

<div class="caption">
    <strong>TABLE V</strong><br>The published recipe and the first run.
</div>

| | ACT paper | LeRobot documentation | First run |
| --- | --- | --- | --- |
| Demonstrations | 50 per task | At least 50, with 10 per location | **2** |
| Training | Around 5 hours on one GPU | 100,000 steps by default | **2 steps** |
| Chunk size | 100 actions at 50 Hz | 100 | 100 actions at 30 Hz |
| Learning rate, batch size | 1e-5, 8 | The same | The same |
| Cameras | Four | Fixed cameras | One |
| Light | Auto-exposure on, "to adjust for changing lighting conditions" | | Even light for the demonstrations, direct sun on the table two hours later |

**Observation 1: The policy had not been trained.** The saved configuration gives `steps: 2`, where the tool's prompt offers 20,000 by default. The prompt before it asks which policy to train, and ACT is option 2; the likeliest cause is that 2 was entered twice. By (3), two steps at $$ \eta = 10^{-5} $$ can move a parameter by about 0.00002 at most. Rebuilding the starting parameters from the recorded seed confirms it (M1): of 51.7 million parameters none had moved by more than 0.000021, where a typical parameter is 0.02 in size. For scale, a network started from another seed differs from this start by 0.023 per parameter on average, a thousand times more; only its pretrained vision layers, about a fifth of the parameters, are the same.

**Observation 2: It fails on its own data, and not as a learned policy fails.** On the two demonstrations it was trained on, the policy's error is 27.9, where holding still scores 9.5 (M2). Across frames its predicted pose has a standard deviation of 0.8 to 2.4 units per joint, where the demonstrated actions have 12 to 61 (Figure 4). It is not even the best constant: for an L1 loss that is the median, and the policy predicts a shoulder lift of 85.6 where the median is 54.4.

{% include figure.liquid path="assets/img/2027-04-30-toward-observability-in-physical-ai/policy-output.png" class="img-fluid" %}

<div class="caption">
    <strong>Figure 4.</strong> The 2-step policy on its own training data, for three of the six joints. Grey: the demonstrated action. Red dots: the mean of the chunk the policy predicts at that frame. Blue dashed: the median of the demonstrated actions. The dotted vertical line separates the two demonstrations.
</div>

**Observation 3: The rollout shows the chunk length and nothing else.** In the demonstrations the arm joints sweep through 47 to 190 degrees; in the rollout none covers more than 13.4 degrees, and the gripper never opens (Figure 5). For every one of the six joints, the largest change in the commands falls exactly on a multiple of 100 steps, the chunk length $$ H $$. Across those boundaries the commands change by 1.85 units on average, against 0.48 between other steps.

{% include figure.liquid path="assets/img/2027-04-30-toward-observability-in-physical-ai/rollout-vs-demos.png" class="img-fluid" %}

<div class="caption">
    <strong>Figure 5.</strong> Top two rows: the six joint positions over time in the two demonstrations (blue, teal) and in the recorded rollout (red). Bottom: the shoulder-lift command sent to the arm during the rollout, with a dashed line every 100 steps.
</div>

An account of the day written within two weeks described the arm completing the task, and put the trouble that followed down to a change in the light, drift in the motors and inconsistent demonstrations. The command that account gives for the success is the replay of 15:20, issued eleven minutes before training began. The light did change (Figure 9), but an untrained policy does not depend on it. None of the three observations above needed the robot, and each was available on the day.

### Training

The same training was then repeated with the same data, code, settings and seed, for 20,000 steps instead of 2 (78 minutes on one desktop GPU). Table VI follows the policy through it.

<div class="caption">
    <strong>TABLE VI</strong><br>Ball task through training. Parameter movement is the mean change per parameter from the rebuilt start. The last three columns are the input shares (M7): how much the answer differs between two frames, and how much of that comes from the camera and from the joint readings. Holding still scores 9.5; the demonstrations move 16.6 units within a chunk.
</div>

| Steps | Parameter movement (×10⁻³) | Error on own data | Movement in a chunk | Answer differs by | From the camera | From the joints |
| ----- | -------------------------- | ----------------- | ------------------- | ----------------- | --------------- | --------------- |
| 2 (failed run) | 0.015 | 27.9 | 2.1 | 2.0 | 2.0 | 0.02 |
| 300 | 0.17 | 7.8 | 0.9 | 27.8 | 27.8 | 0.01 |
| 1,000 | 0.28 | 6.5 | 2.5 | 28.2 | 28.2 | <0.01 |
| 3,000 | 0.53 | 4.8 | 11.0 | 30.3 | 30.3 | <0.01 |
| 5,000 | 0.73 | 3.7 | 14.6 | 29.4 | 29.4 | <0.01 |
| 10,000 | 1.02 | 2.6 | 17.2 | 29.7 | 29.7 | <0.01 |
| 20,000 | 1.36 | **1.8** | 17.6 | 29.1 | 29.1 | <0.01 |

**Observation 4: Training passes through three stages.** At 2 steps the policy holds one pose whatever it sees: its answers differ by 2.0 units between frames. By 300 steps it has found the cheapest good answer, which is to stay roughly where the arm already is; its error is below that of holding still, but its chunks contain almost no movement. Real movement appears between 1,000 and 5,000 steps, and by 10,000 the chunks move as much as the demonstrations do (Figure 6). Had the first run been trained for a few hundred steps, the arm would most likely also have stayed still, for a different reason.

**Observation 5: The whole of training is a small change in the parameters.** After 20,000 steps the mean change per parameter is 0.0014, about 7% of the size of a typical parameter. At 300 steps, when the second stage has begun, it is 0.00017.

{% include figure.liquid path="assets/img/2027-04-30-toward-observability-in-physical-ai/learning-curve.png" class="img-fluid" %}

<div class="caption">
    <strong>Figure 6.</strong> Left: the policy's error on its own training data against the number of optimisation steps; the dashed line is a policy that holds still. Right: how far the joints move inside one predicted chunk; the dashed line is the same quantity in the demonstrations. The red dot is the 2-step policy.
</div>

### New Demonstrations

A few minutes before the training data, one more demonstration of the same task had been recorded and was never used. Table VII compares the 20,000-step policy on its own data, on that demonstration, and on the frames of the recorded rollout.

<div class="caption">
    <strong>TABLE VII</strong><br>The 20,000-step ball policy on familiar and new inputs. Holding still and the demonstrator's first action are given in parentheses. Picture distance is in units of the typical distance among training frames, so it is 1.0 for them by definition. On the rollout frames there are no demonstrated actions, so no error is given.
</div>

| Input | Error (holding still) | Closest stretch | Coverage | First action, from the arm (demonstrator's) | Picture distance |
| ----- | --------------------- | --------------- | -------- | ------------------------------------------- | ---------------- |
| Its own demonstrations | **1.8** (9.5) | 1.7 | | 4.7 (3.5) | 1.0 |
| The unseen demonstration | 45.8 (5.2) | 10.4 | 32.9 | 51.2 (0.9) | 1.6 |
| The rollout frames, arm at rest | | 11.6 | | 59.3 | 1.2 without sun, 2.4 with |

**Observation 6: The trained policy has memorised.** Its error is 1.8 on the two demonstrations it trained on and 45.8 on the third (M4). That is nearly nine times worse than holding still, and almost as bad as the 2-step policy, which scores 50.9. It is not timid either: its chunks on the unseen demonstration move 30.5 units where the demonstration moves 10.9.

**Observation 7: Its wrong answers stay near its recordings.** All 60 predictions on the unseen demonstration lie closer to a stretch of the training demonstrations (10.4 on average) than to what the demonstrator did (45.8) (M6). Of the 60, 56 fall in the same two stretches of the first demonstration, where the arm is raised and comes down towards the ball; so do 14 of the 17 rollout frames (Figure 7). They are not copies: on its own frames the policy is within 1.7 units of the right stretch. This agrees with the finding that ACT interpolates between training actions <d-cite key="he2025demystifying"></d-cite>.

**Observation 8: What is new in the unseen demonstration is the motion, not the picture.** Its pictures are hardly unusual for the policy: 1.6 on a scale where training frames are 1.0 apart (M10). Its motion is far from anything in the training set: the coverage is 32.9 (M5).

{% include figure.liquid path="assets/img/2027-04-30-toward-observability-in-physical-ai/where-answers-come-from.png" class="img-fluid" %}

<div class="caption">
    <strong>Figure 7.</strong> Each dot is one chunk predicted by the 20,000-step ball policy. Across: where the frame really is. Up: where the closest stretch of the two training demonstrations starts. A dot on the diagonal means the policy answers with the stretch that belongs to the frame. Left: the training frames as recorded. Middle: the same frames twice as bright. Right: the demonstration it never saw.
</div>

### More Demonstrations

The toaster task allows the number of demonstrations to be varied with everything else fixed. Table VIII gives all metrics for the four policies.

<div class="caption">
    <strong>TABLE VIII</strong><br>Toaster task: all metrics against the number of training demonstrations (Demos), on the six demonstrations no policy saw. Cov. denotes coverage; Seen and Unseen denote the error on trained-on and unseen demonstrations; 2× denotes the unseen error with pixel values doubled (64 to 65% of pixels at or near white), with the change in parentheses; First denotes the distance of the first action from the arm; From denotes the step from which the policy beats holding still. Holding still scores 16.3 to 16.7, and the demonstrator's first action is about 2.3 from the arm. The last three columns are the input shares. Bold marks the best value.
</div>

| Demos | Cov. | Seen | Unseen | 2× | First | From | Front cam. | Hand cam. | Joints |
| ----- | ---- | ---- | ------ | -- | ----- | ---- | ---------- | --------- | ------ |
| 2 | 13.9 | **0.8** | 19.1 | 27.7 (+8.6) | 16.6 | 54 | 76% | 24% | 0.2% |
| 8 | 14.0 | 1.3 | 18.6 | 20.8 (+2.2) | 17.0 | 56 | 61% | 39% | 0.1% |
| 29 | 11.3 | 2.2 | 14.8 | 19.3 (+4.5) | 11.8 | 46 | 53% | 47% | 0.1% |
| 58 | **4.1** | 3.2 | **7.0** | **7.6** (+0.6) | **5.2** | **10** | 59% | 39% | 2.3% |

**Observation 9: With few demonstrations the policy is worse than holding still.** With 2 or 8 demonstrations it reproduces them almost perfectly and does worse than holding still on the six it never saw (Figure 8, left). This repeats Observation 6 on another task with other cameras.

**Observation 10: Coverage anticipates the error.** The coverage column was computed from the demonstrations alone, before any policy existed, and the error on unseen demonstrations follows it. Eight demonstrations covered the unseen ones no better than two, and the policy trained on eight did hardly better. The 58 include the demonstrations recorded just before the six unseen ones, which is probably why coverage improves so sharply at the end.

**Observation 11: More demonstrations fill in what the policy draws on.** At every size the policy's predictions stay within 2.7 to 4.2 units of some training stretch. What changes with more demonstrations is that a training stretch exists close to what the new situation needs.

**Observation 12: Longer training does not close the gap.** Continuing the 58-demonstration run to 60,000 steps keeps reducing the error on the demonstrations it trained on and leaves the error on unseen ones where it was after about 30,000 steps (Table IX).

<div class="caption">
    <strong>TABLE IX</strong><br>Toaster task, 58 demonstrations: longer training.
</div>

| Steps | Error, trained-on | Error, unseen |
| ----- | ----------------- | ------------- |
| 10,000 | 4.3 | 7.8 |
| 20,000 | 3.2 | 7.0 |
| 30,000 | 2.7 | 6.7 |
| 40,000 | 2.3 | **6.6** |
| 50,000 | 2.2 | **6.6** |
| 60,000 | **1.9** | **6.6** |

{% include figure.liquid path="assets/img/2027-04-30-toward-observability-in-physical-ai/more-demonstrations.png" class="img-fluid" %}

<div class="caption">
    <strong>Figure 8.</strong> Toaster task. Left: the error on the demonstrations each policy trained on (blue) and on the six that none of them saw (red). Right: the error on those six as the picture is brightened, one line per policy. The dashed line is what holding still scores on the six.
</div>

### The Inputs

**Observation 13: The cameras decide the answer.** In the ball task the joint readings contribute less than 0.02 units to an answer that differs by up to 30 units between frames, at every stage of training (Table VI). In the toaster task they contribute 0.1 to 2.3% for every size of dataset (Tables VIII and X). These policies know where the arm is only through the picture. This explains how the 300-step policy of Observation 4 stays where the arm is: it reads the arm's pose from the image. With more demonstrations the hand camera's share rises from 24% to between 39 and 47%.

<div class="caption">
    <strong>TABLE X</strong><br>Reliance on vision by three measures. Share denotes the cameras' exact Shapley share over pairs of recorded frames (M7). \(R_{\text{img}}\) denotes the visual importance ratio of Zhang et al., with an input replaced by zeros, as in their definition, or by its mean over the training data.
</div>

| Policy | Share | $$ R_{\text{img}} $$, zeros | $$ R_{\text{img}} $$, training mean |
| ------ | ----- | --------------------------- | ----------------------------------- |
| Ball task, 2 steps | 99.1% | 99.7% | 99.8% |
| Ball task, 20,000 steps | 100.0% | 100.0% | 100.0% |
| Toaster task, 2 demonstrations | 99.8% | 50.2% | 99.7% |
| Toaster task, 8 demonstrations | 99.9% | 51.2% | 99.9% |
| Toaster task, 29 demonstrations | 99.9% | 54.9% | 99.9% |
| Toaster task, 58 demonstrations | 97.7% | 52.8% | 97.5% |

Table X sets our share beside the visual importance ratio of Zhang et al. <d-cite key="zhang2026idr"></d-cite>. On the ball task the measures agree. On the toaster task the ratio falls to about 50% when an input is replaced by zeros, and returns to between 97.5 and 99.9% when it is replaced by its mean over the training data. The reason is in the data. One joint of the arm that does not move sits at −98.1 with a standard deviation of 0.05, so a reading of zero is about 1,800 standard deviations from anything the policy has seen. The answer then changes because the input is impossible, not because the policy relies on it. Replacing an input with a value the policy has seen, another frame's or the mean, avoids this.

**Observation 14: A chunk starts away from where the arm is.** On demonstrations it has not seen, each policy's first action is 5.2 to 17.0 units from the arm's position, where the demonstrator's is 2.3 (Table VIII). On a robot that is a jump at the start of every chunk, the kind the recorded rollout shows at its chunk boundaries (Observation 3). It follows from Observation 13: a policy that does not listen to the joint readings has nothing but the picture to anchor the start of its chunk. Even the 58-demonstration policy is worse than holding still for the first 9 steps of a chunk and better only after that.

### The Light

Table XI brightens the training frames of the ball task for the 20,000-step policy, and for a policy trained with LeRobot's image augmentation, which varies brightness by a factor of 0.8 to 1.2 among other changes.

<div class="caption">
    <strong>TABLE XI</strong><br>Ball task, brightness test on 113 training frames. "Lose their place": frames whose closest training stretch is more than 100 steps from the frame's own position. The change brought by augmentation is in parentheses. Bold marks the better of the two policies.
</div>

| Gain | Pixels at or near white | Error, default training | Error, with augmentation | Closest stretch | Frames that lose their place | Picture distance |
| ---- | ----------------------- | ----------------------- | ------------------------ | --------------- | ---------------------------- | ---------------- |
| 1.0 | 1.9% | **1.8** | 1.9 (+0.1) | 1.7 | 0 | |
| 1.25 | 11.6% | 3.2 | **1.9** (−1.3) | 2.4 | 8 | 0.5 |
| 1.5 | 29.5% | 9.9 | **7.4** (−2.5) | 4.6 | 30 | |
| 2.0 | 48.8% | 17.4 | **16.0** (−1.4) | 6.7 | 55 | 1.4 |
| 3.0 | 58.7% | **20.4** | 25.4 (+5.0) | 6.8 | 61 | |

**Observation 15: A brighter picture makes the policy lose its place.** With the picture twice as bright the error is 17.4, more than nine times its value in the original light and worse than holding still (M9). The predictions do not turn into noise: they stay within 6.7 units of some stretch of the recordings, but for 55 of the 113 frames that stretch is more than 100 steps, 3.3 s, away from the right one (Figure 7, middle).

**Observation 16: The real scene was further from training than its brightness suggests.** The frames of the recorded rollout have 5 to 23% of their pixels at or near white, 12% on average, against 1.9% in training (Figure 9). A uniform brightening of that size raises the error to about 3 (Figure 10, left). Yet on the real frames, with the arm at rest, the trained policy's answer is 48.5 units from the resting pose, against 4.6 in the light of the demonstrations. Picture distance resolves this (M10): the sunlit frames are 2.4 from the training pictures, where a picture made twice as bright is 1.4, and 24 of the 26 sunlit frames lie beyond every training frame. The real frames differ in more than brightness: the sun falls in hard-edged patches, objects have moved, and a person is partly in view.

**Observation 17: Built-in augmentation protects inside its range.** Up to the brightness it was trained for, the augmented policy's error does not move: 1.9 where the default policy has 3.2. Twice as bright, it is as lost as the default policy, and at the brightest level it is worse. On the real rollout frames it helps where the table is not washed out (21.1 units from the resting pose against 35.3) and little where it is (55.0 against 64.8). It does not help with the unseen demonstration (60.9 against 45.8), whose problem is not the light.

**Observation 18: The policy trained on more demonstrations is also less sensitive to brightness.** On the toaster task, doubling the pixel values adds 8.6 units to the unseen error of the policy trained on 2 demonstrations and 0.6 to that of the policy trained on 58 (Table VIII; Figure 8, right).

{% include figure.liquid path="assets/img/2027-04-30-toward-observability-in-physical-ai/lighting.png" class="img-fluid" %}

<div class="caption">
    <strong>Figure 9.</strong> The same camera during the demonstrations and during the rollout about two hours later, cropped to the table. The rollout frame is the brightest of those sampled.
</div>

{% include figure.liquid path="assets/img/2027-04-30-toward-observability-in-physical-ai/light-test.png" class="img-fluid" %}

<div class="caption">
    <strong>Figure 10.</strong> Left: the error of the 20,000-step policy on its own training frames as they are brightened (green), and the same for the policy trained with image augmentation (purple). The shaded band is where the frames of the recorded rollout fall on the same scale, and the dotted line is their average. Right: with the arm in the same resting pose, what the policy predicts in the light of the demonstrations (blue circles) and on the frames of the rollout (red squares).
</div>

## Limitations

- **Task success.** Every number here is a distance between predicted and demonstrated actions. A large distance on its own demonstrations means a policy has not learned them. A small one does not prove that it works, and studies with real rollouts find that such distances do not rank policies by success <d-cite key="mandlekar2021matters,cowling2026validation"></d-cite>. The arms were not available for new trials.
- **One seed, one arm, two tasks.** Each configuration was trained once. The training subsets of the toaster task are the first 2, 8, 29 and 58 demonstrations, each contained in the next, and the unseen demonstrations are the last six.
- **The light.** The brightening is uniform. The real sun fell in patches, changed during the 55 seconds, and came with other changes in the picture. We show that the real frames are far from the training pictures, not which of their differences is responsible.
- **Input shares.** They are averaged over 60 pairs of frames for the ball task and 40 for the toaster task. Swapping an input with that of another frame produces combinations the policy never saw in training, as does replacing it with zeros.
- **Mechanism.** We report that the policies ignore their joint readings, not which part of the network is responsible.

## Conclusion

We have presented ten metrics that are computed from the files a training run leaves behind, and an order in which to check them. On two datasets from a low-cost arm they separate a policy that was never trained from one that memorised its demonstrations and from one that carries over, and they show where each policy's answers come from: from the cameras, almost never from the joint readings, and from the neighbourhood of what it was shown. Table XII turns each result into a decision.

<div class="caption">
    <strong>TABLE XII</strong><br>From the math, to a value in the files, to a decision.
</div>

| What the math says | The value in the files | So do this | And not this |
| ------------------ | ---------------------- | ---------- | ------------ |
| Each step moves $$ \theta $$ by about $$ \eta $$ = 0.00001 | $$ \theta $$ was updated 2 times; no parameter moved by more than 0.000021 | Train first: 20,000 steps took 78 minutes | Recalibrate the arms and record again |
| With an L1 loss, the best constant answer is the median | The policy answered 85.6 where the median is 54.4 | Read it as "nothing was learned" | Look for what it learned wrong |
| The loss is an average over the dataset $$ \mathcal{D} $$, and here $$ N = 2 $$ | Error 1.8 on those two demonstrations, 45.8 on a third; coverage 32.9 | Record more demonstrations, and compute coverage before training | Train longer: on 58 demonstrations, tripling the steps moved the unseen error from 7.0 to 6.6 |
| The policy is a function of the observation $$ o_t $$, pictures and joint readings | The joint readings account for 0 to 2% of the answer | Treat the cameras as the policy's only sense: fix them and light the scene evenly | Count on the joint readings to tell the policy where the arm is |
| $$ p_{\text{deploy}}(o_t) \neq p_{\text{train}}(o_t) $$ | The sunlit frames lie beyond every training picture; the answer is 48.5 units from the arm | Control the light, or put its variation in the data | Blame the light before the first three checks pass |
| A chunk of $$ H = 100 $$ actions is played before the policy looks again | 17 decisions in 55 seconds; a chunk starts 5 to 17 units from the arm | Expect a jump at the start of each chunk, and a reaction every 3.3 seconds | Expect it to notice a ball that moves in the middle of a chunk |

What would we do differently? We would follow the math properly: record about 50 demonstrations, and check the number of training steps before running the policy. We would keep the same lighting. That would not have saved the first run, but it matters once a policy is trained.

Two months after the first run, at a second hackathon, the recipe was followed: about sixty demonstrations per task, two cameras, full training runs. A vision-language-action model was tried first and did not work; SmolVLA <d-cite key="shukor2025smolvla"></d-cite> was used instead, with a vision-language model above it as a supervisor that decides which skill to run. On the arms those policies were jumpy on tight pick-and-place and not perfect, and the supervisor retried and asked for help. Those runs were not recorded, so this paragraph rests on notes from that weekend. Its demonstrations are the toaster dataset of this post.

The metrics do not predict whether a robot will complete its task. What they offer is observability: before the robot moves, the files already say whether a policy was trained, whether it fits, whether it carries over, and what it listens to.

## Reproducibility

- **Code.** LeRobot 0.4.5 as packaged in the fork that `solo-cli` installed on the day of the first run, pinned to its commit of 12 March 2026. All ACT settings at their defaults. Random seed 1000 for every run.
- **Hardware and time.** The first run used a cloud GPU. The re-runs used one desktop GPU with 32 GB of memory: 78 minutes for 20,000 steps on the ball task, 2 hours 20 minutes with image augmentation, which is computed on the processor, and about half an hour for every 20,000 steps on the toaster task.
- **Data.** The two training demonstrations of the ball task and the 64 demonstrations of the toaster task are public. The unseen demonstration and the recorded rollout will be published with the final version.
- **Tests.** The training curve of Table VI samples every 75th frame of the ball task (45 frames); all other tests sample every 30th. For the toaster task the trained-on error uses every 30th frame of all training demonstrations for 2 and 8 demonstrations, of every third for 29 and of every fifth for 58. The starting network is rebuilt from the recorded seed and compared with each saved policy parameter by parameter. Pairs of frames for the input shares are drawn with a fixed seed.
- **Links** to the datasets, the policies, the training curves and the analysis code are withheld for anonymous review.

_Acknowledgments. The analysis code was written with an AI assistant, which also helped draft and edit the text; every number comes from the recorded files. The names of the teammates are withheld for anonymous review._

## Appendix

**Deriving the bound.** This follows the tutorial of Capuano et al. <d-cite key="capuano2025robot"></d-cite> and keeps its equation numbers (19) to (26); Equations (19) and (26) are (5) and (6) of the main text. Training wants to make the recorded data as likely as possible (20). Putting (19) inside gives an integral over every value of the hidden variable (21), which cannot be computed. A second network, the encoder $$ q_\phi $$, estimates which $$ z $$ was behind a demonstration. Multiplying and dividing by its estimate changes nothing (22), but turns the integral into an average over the encoder's estimates (23).<d-footnote>The tutorial writes Eqs. (20) to (23) with the logarithm outside the sum over datapoints. For independent datapoints the likelihood is a product, so the log-likelihood is a sum of logarithms, which is the form used here. The bound and Eq. (26) come out the same either way.</d-footnote>

$$
\log p_\theta(\mathcal{D}) = \sum_{i=1}^{N} \log p_\theta\bigl((o,a)_i\bigr) \tag{20}
$$

$$
= \sum_{i=1}^{N} \log \int_{\text{supp}(Z)} p_\theta\bigl((o,a)_i \mid z\bigr)\,p(z)\; dz \tag{21}
$$

$$
= \sum_{i=1}^{N} \log \int_{\text{supp}(Z)} \frac{q_\phi(z \mid (o,a)_i)}{q_\phi(z \mid (o,a)_i)} \cdot p_\theta\bigl((o,a)_i \mid z\bigr)\, p(z)\; dz \tag{22}
$$

$$
= \sum_{i=1}^{N} \log\, \mathbb{E}_{z \sim q_\phi(\bullet \mid (o,a)_i)}\!\left[\frac{p(z)}{q_\phi(z \mid (o,a)_i)} \cdot p_\theta\bigl((o,a)_i \mid z\bigr)\right] \tag{23}
$$

Jensen's inequality then moves the logarithm inside the average. The equals sign becomes a "greater than or equal to": what is computed is no longer the likelihood, only something guaranteed to lie below it.

$$
\begin{aligned}
\log p_\theta(\mathcal{D}) \geq \sum_{i=1}^{N} \Bigl( \; & \mathbb{E}_{z \sim q_\phi(\bullet \mid (o,a)_i)}\bigl[\log p_\theta((o,a)_i \mid z)\bigr] \\
& + \mathbb{E}_{z \sim q_\phi(\bullet \mid (o,a)_i)}\!\left[\log \frac{p(z)}{q_\phi(z \mid (o,a)_i)}\right] \Bigr)
\end{aligned} \tag{24–25}
$$

The second term is the negative of the KL divergence in (26). For demonstrations by people the hidden variable earns its place: without it, the ACT authors report "a significant drop from 35.3% to 2%" in success on human data <d-cite key="zhao2023act"></d-cite>.
