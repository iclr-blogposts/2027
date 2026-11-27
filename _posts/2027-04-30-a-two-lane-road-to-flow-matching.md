---
layout: distill
title: "A Two-Lane Road to Flow Matching"
description: >-
  Imagine you're taking part in a somewhat bizarre competition. You're standing next to a two-lane road,
  and your goal is to guess the average speed of cars.
  Two judges score your guess.
  The first is fond of gadgets.
  He uses one to measure the average speed of all cars,
  then scores your guess against that number.
  The second prefers to keep things simple.
  He scores the same guess against some individual cars in turn, then averages those scores.
  Both judges use squared error.
  Will they rank the contestants in the same order?
  It turns out that the answer to this bizarre puzzle, together with many additional interactive visualisations, will help us learn how flow matching works:
  how we can use a velocity field to carry us from noise to beautiful images and beyond.
  Along the way, we see how empirical flow matching builds a target by averaging velocities
  and why conditional flow matching can train on one sampled velocity at a time.
date: 2027-04-30
future: true
htmlwidgets: true

# Anonymize when submitting
authors:
  - name: Anonymous

# must be the exact same name as your blogpost
bibliography: 2027-04-30-a-two-lane-road-to-flow-matching.bib

toc:
  - name: What we will cover
  - name: Preliminaries
    subsections:
      - name: Numerical integration
      - name: Fitting probability distributions
      - name: Why a mixture of Gaussians is not the end of the story
  - name: Learning probability distributions
    subsections:
      - name: A network that learns a probability distribution
      - name: Deforming probability
      - name: Computing the output density of the network
      - name: Residual flows
      - name: Understanding the meaning of a residual block
  - name: Learning flows
    subsections:
      - name: If we knew the velocity field
      - name: What we get
  - name: Flow matching
    subsections:
      - name: The problem
      - name: One data point
      - name: Many data points
      - name: Let's hit the road
      - name: The velocity of the mixture
      - name: Training on the weighted averages
      - name: Scoring a guess
      - name: From one place to the whole road
      - name: Conditional vs Empirical Flow Matching at a fixed moment
      - name: Conditional vs Empirical Flow Matching over the entire time axis
      - name: Back to the arrows
      - name: The algorithm
  - name: Extensions and applications
    subsections:
      - name: Diffusion models
      - name: Learning families of distributions
      - name: Robot actions
  - name: Summary
  - name: Exercises
    subsections:
      - name: Hitting the data exactly
      - name: The proofs

_styles: >
  .fm-fig { margin-top: 1.4rem; }
  .fm-fig iframe { display: block; width: 100%; margin: 0 auto; border: 0; }
  .fm-cap { margin-bottom: 1.6rem; }
  d-article details { border-left: 3px solid rgba(128, 128, 128, 0.45); padding: 0.1rem 0 0.1rem 1rem; margin: 1.2rem 0; }
  d-article details > summary { cursor: pointer; font-weight: 600; margin-bottom: 0.6rem; }
  mjx-container[display="true"] { overflow-x: auto; overflow-y: hidden; }
  @media (max-width: 1024px) { d-article > :is(d-contents, #what-we-will-cover, #what-we-will-cover ~ *) { order: 1; } }
  @media (min-width: 1025px) { d-article d-contents { grid-row: auto / span 9; } }
  .fm-skip { font-style: italic; color: var(--global-text-color-light); }
  .fm-skip p { margin-bottom: 0.4rem; }
  .fm-question { border-left: 4px solid var(--global-theme-color); background: rgba(128, 128, 128, 0.08); padding: 0.6rem 1rem; margin: 1.2rem 0; }
  .fm-question p { margin: 0; }
  .fm-question p:first-child::before { content: "Question  "; font-weight: 600; color: var(--global-theme-color); }
---

Let's start with the puzzle.
Here are ten cars on a two-lane road.
Eight are doing 100 km/h and two are doing 50 km/h.
Let's see how the two judges score multiple guesses.
In the first score column, we compare a guess with 90 km/h, the true average speed, and square the error.
In the second, we compare it with each car separately, square each error, and average those ten scores.
Lower is better.
Fill in a few guesses.

<div class="l-body fm-fig" id="road-puzzle">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/road-puzzle.html' | relative_url }}" title="Compare speed guesses against the average and against individual cars" style="width: 100%; max-width: 620px; height: 370px"></iframe>
</div>

**Do you see any pattern between the columns?**
Pick two rows.
If one guess beats the other in the first score column, which guess wins in the second?
By how many points?

Keep the puzzle in mind.
We'll expand it along the road (pun intended) to understand how exactly the flow matching loss works.
But let's not get ahead of ourselves and start from the beginning: with numerical integration and the basics of learning probabilities.
If you're comfortable with numerical integration and probability distributions, you can jump ahead to [Learning flows](#learning-flows).

# What we will cover

The goal of a generative model is to learn to sample from a distribution $$p_{\text{target}}$$ given examples from that distribution.
For an image generator, each new sample is a picture.

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/genimg.html' | relative_url }}" title="A picture generated from a prompt" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 642 / 480; max-width: 642px"></iframe>
</div>
<div class="caption fm-cap">
  An example behaviour of generative models: a prompt goes in, and a picture comes out.
  Under the hood, a sample is drawn from a distribution of pictures.
  (The picture is a fixed image and the animation is a cartoon of sampling, not a model.)
</div>

Flow matching <d-cite key="lipman2022flow,liu2022flow,albergo2023building"></d-cite> builds such a generator by combining two ideas.
First, we can efficiently sample from known distributions, such as Gaussians:

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/gauss1d.html' | relative_url }}" title="Samples from a standard Gaussian" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 682 / 234; max-width: 682px"></iframe>
</div>
<div class="caption fm-cap">
  We can easily sample from known distributions: samples of a standard Gaussian, stacked under its density.
</div>

Second, we have many techniques to simulate deformation.
For example, in particle methods such as the material point method <d-cite key="stomakhin2013material"></d-cite>, we consider many particles and we move them around to see deformation:

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/coffee-stir.html' | relative_url }}" title="Milk stirred into a cup of coffee, as a body of particles" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 682 / 370; max-width: 682px"></iframe>
</div>
<div class="caption fm-cap">
  An example of a deformable simulation: milk stirred into a cup of coffee, seen from above.
</div>

The goal is simple: combine the two ideas.
Treat probability as a deformable substance, start from a distribution we can sample, deform it into the distribution of interest, and carry the samples along.

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/melt-density.html' | relative_url }}" title="A density deformed into another density" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 682 / 294; max-width: 682px"></iframe>
</div>
<div class="caption fm-cap">
  Probability as a deformable substance.
  A standard Gaussian (bottom) is deformed into a density with two bumps (top).
  The grey lines show where the deformation sends equally spaced points, and the dots are samples carried along.
</div>

Note that other introductions explore this construction visually <d-cite key="gagneux2025visual,hawley2025flow,fjelde2024introduction"></d-cite>.
Much of this work has been inspired by this great work.

# Preliminaries

Before we dive into flow matching, let's make sure we understand the two underlying concepts well:
1. Numerical integration, which is the core component of any simulation.
2. Learning probability distributions, where we cover intuitions for things useful during the rest of the post (feel free to skip the ones you are already familiar with):
 - Mixture of Gaussians
 - KL-divergence
 - How idealised expectations are actually approximated in practice.

## Numerical integration

If we look again at the stirring animation, the milk did not magically jump from a heart to streaks.
It was deformed gradually.
At every moment milk and coffee particles had a velocity.
A deformation in time is described by a **velocity field** $$u_t(x)$$: the velocity of whatever is at the position $$x$$ at the time $$t$$.
In the cup the field is a swirl around the spoon: every particle follows it.
Note that because the spoon moves, the field changes with time!

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/coffee-flow.html' | relative_url }}" title="The stirring as a continuous flow" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 680 / 404; max-width: 680px"></iframe>
</div>
<div class="caption fm-cap">
  The stirring as a continuous flow.
  The lines are the flow lines of the velocity field as it is at this moment, coloured by speed.
  They turn with the spoon, and the milk is carried along.
</div>

The path $$x(t)$$ of a particle solves a differential equation, $$\dot x(t) = u_t\big(x(t)\big)$$ (for more on differential equations, see the series [Differential equations](https://www.youtube.com/playlist?list=PLZHQObOWTQDNPOjrT6KVlfJuKtYTftqH6) by 3Blue1Brown).
In general there is no formula for the solution, and a computer cannot follow a flow line exactly: it takes discrete steps.
The simplest scheme is the explicit Euler method.
Start from the current state, check the velocity, follow the arrow for a small time $$\Delta t$$, and repeat from the next state.
The update comes from replacing the derivative by a difference quotient:

$$
u_t\big(x(t)\big) = \dot x(t) \approx \frac{x(t + \Delta t) - x(t)}{\Delta t}
\quad\Longrightarrow\quad
x(t + \Delta t) \approx x(t) + \Delta t\, u_t\big(x(t)\big).
$$

Apply this update to every particle of the milk.
Each particle reads the velocity at its own position, and together the particles carry the whole pattern along.

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/coffee-steps.html' | relative_url }}" title="Explicit Euler integration of a four-second stir" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 680 / 529; max-width: 680px"></iframe>
</div>
<div class="caption fm-cap">
  One stir lasts four seconds.
  For each highlighted particle, the long arrow shows how far it would travel in one second at its current velocity.
  Step through to see the arrow shrink to the displacement for the selected time step, then watch the particle move to its tip.
</div>

The step size matters because Euler uses the velocity at the start of each step.
Try half-second steps and watch the milk drift towards the rim.
Then try $$\Delta t = 1/64$$ of a second.
The particles update their velocities more often as the spoon turns, so the milk follows the dashed reference outline more closely.
The price is more evaluations of $$u$$.

## Fitting probability distributions

Before deforming anything, here is the most direct way to learn a distribution: choose a family of densities $$p_\theta$$ with parameters $$\theta$$ and fit it to the data.
A mixture of Gaussians is the classical example,

$$
p_\theta(x) = \sum_{k=1}^K \pi_k\, \mathcal N(x;\, \mu_k, \Sigma_k), \qquad \theta = \{\pi_k, \mu_k, \Sigma_k\}_{k=1}^K .
$$

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/gmmfit.html' | relative_url }}" title="Fitting a mixture of Gaussians" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 682 / 369; max-width: 682px"></iframe>
</div>
<div class="caption fm-cap">
  Fitting a mixture of Gaussians to samples: collect the samples, start with Gaussians at random places, then adapt weights, means and covariances.
  The number shown is the loss introduced below.
</div>

Two questions come up.
What does "fit" mean exactly?
And is a mixture of Gaussians the best choice?

### One way to measure a fit: KL-divergence

<div class="fm-skip" markdown="1">
Below we explain the intuition behind the KL divergence.
If you are already familiar with the topic, feel free to skip to the next section.
</div>

<details markdown="1">
<summary>The intuition behind the KL divergence</summary>

Intuitively, to fit the data means to make the model distribution $$p_\theta$$ close to the unknown $$p_{\text{target}}$$ (in this section we write it $$q$$, to keep the formulas short).
But how do we measure distance between two distributions?
Let's understand the intuition behind the Kullback–Leibler divergence, the standard measure of choice:

$$
D_{\mathrm{KL}}(q \,\Vert\, p_\theta) = \int q(x)\,\log\frac{q(x)}{p_\theta(x)}\,dx = \mathbb E_{x \sim q}\Big[\log\frac{q(x)}{p_\theta(x)}\Big] .
$$

Why does this measure make sense?
The example below follows the video [Intuitively Understanding the KL Divergence](https://www.youtube.com/watch?v=SxGYPqCgJWM) by Adian Liusie.
Take the simplest data there is: flips of a coin,

$$
\text{H}\;\text{H}\;\text{T}\;\text{H}\;\text{T}\;\text{T}\;\text{H}\;\dots \qquad N_H \text{ heads},\; N_T \text{ tails},\; N = N_H + N_T .
$$

Here $$q$$ is the true distribution of the coin, which gives heads with probability $$q_H$$ and tails with probability $$q_T$$, and $$p$$ is a model of it, with $$p_H$$ and $$p_T$$.
How much more likely is the sequence we saw under the true distribution than under the model?
The flips are independent, so the probability of the whole sequence is a product, and the ratio of the two probabilities is a product of ratios.
Each flip contributes another factor, so we look at a geometric mean (i.e., "per flip"), with the $$N$$-th root:

$$
\Big(\prod_{i=1}^N \frac{q(x_i)}{p(x_i)}\Big)^{1/N} = \Big(\frac{q_H^{N_H}\, q_T^{N_T}}{p_H^{N_H}\, p_T^{N_T}}\Big)^{1/N} .
$$

Take the logarithm, which turns the products into sums, and let the number of flips grow.
The share of heads, $$N_H/N$$, approaches $$q_H$$, and the share of tails approaches $$q_T$$:

$$
\frac{N_H}{N}\log\frac{q_H}{p_H} + \frac{N_T}{N}\log\frac{q_T}{p_T} \;\longrightarrow\; \sum_x q(x)\log\frac{q(x)}{p(x)} .
$$

This is the KL divergence of the coin; for a continuous variable the sum becomes the integral above.
So the KL divergence measures how much better, per sample and in the long run, the true distribution explains data drawn from it than the model does, on a logarithmic scale.
If the model is the true distribution, every ratio is 1 and the divergence is 0.
Otherwise it is positive: on average, no model explains the data better than the distribution that produced them.
A textbook treatment is in <d-cite key="murphy2022probabilistic"></d-cite>.

Do we have to minimise the KL divergence directly?
Split the logarithm:

$$
D_{\mathrm{KL}}(q \,\Vert\, p_\theta) = \underbrace{\mathbb E_{x\sim q}\big[\log q(x)\big]}_{\text{does not depend on } \theta} \;\underbrace{-\;\mathbb E_{x\sim q}\big[\log p_\theta(x)\big]}_{\text{cross-entropy}} .
$$

The first term is a property of the data alone (its entropy, up to the sign): unknown, but the same for every $$\theta$$.
Only the second term moves when we change the model, so minimising the divergence is the same as minimising the cross-entropy

$$
\mathcal L(\theta) = -\,\mathbb E_{x \sim q}\big[\log p_\theta(x)\big].
$$

</details>

### From idealised expectations to Monte-Carlo estimates

<div class="fm-skip" markdown="1">
Below we explain how such expectations are estimated in practice: Monte Carlo estimates.
If you are already familiar with the topic, feel free to skip to the next section.
</div>

<details markdown="1">
<summary>Monte Carlo estimates</summary>

The loss $$\mathcal L(\theta)$$ is an expectation over $$p_{\text{target}}$$, which we do not know.
How can we compute it during training?
We cannot, but we can estimate it.
An expectation is an average, and an average can be estimated from samples drawn according to the distribution:

$$
\mathbb E_{x \sim p_{\text{target}}}\big[f(x)\big] \approx \frac{1}{N}\sum_{i=1}^N f(x_i), \qquad x_i \sim p_{\text{target}} .
$$

This is the Monte Carlo method, and the samples are exactly what we have: the training set is a sample from $$p_{\text{target}}$$.
So $$\mathcal L(\theta) \approx -\frac1N \sum_i \log p_\theta(x_i)$$, a quantity we can compute and differentiate.
Keep this move in mind.
Every loss below is an expectation, and every one of them is used through samples.

</details>

### Why a mixture of Gaussians is not the end of the story

A mixture of Gaussians does not scale to images.
A Gaussian in $$d$$ dimensions needs at least $$d$$ numbers, for its mean alone, and a vector representing, e.g., a photograph has thousands or even millions of dimensions.
The parameter budget of 7 billion parameters buys only a couple of thousand such Gaussians, for a training set of a billion images:

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/paramcost.html' | relative_url }}" title="How many Gaussians does a parameter budget buy" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 751 / 202; max-width: 751px"></iframe>
</div>
<div class="caption fm-cap">
  How many Gaussians does a fixed 7B parameter budget buy?
  The count depends on the size of a data point and on how much of the covariance is modelled.
</div>

But there is also a second problem.
We are usually interested in a whole family of distributions $$p_\theta(\,\cdot \mid y)$$.
For example, one for every prompt $$y$$.
A mixture has no natural input through which a condition could enter.

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/condfam-two.html' | relative_url }}" title="One distribution per prompt" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 664 / 214; max-width: 664px"></iframe>
</div>
<div class="caption fm-cap">
  One distribution per prompt: all the images, and the images that fit each of two prompts.
</div>

## Learning probability distributions

### A network that learns a probability distribution

A neural network has both properties Gaussian mixtures lack.
First, its parameters are shared across the whole space.
This allows us to avoid the problem of a decreasing number of Gaussians in higher dimensions.
Second, a network accepts extra inputs, so learning a whole family of distributions is natural.

One might try to do the following: select a random point in the space of interest (e.g., the space of images), input it into the network and ask it to output a reasonable image.
The underlying idea here is that the network will learn how to convert the initial sampling distribution (think of a Gaussian) into the distribution of interest $p_{\text{target}}$.

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/net-whole.html' | relative_url }}" title="A network that turns samples of a Gaussian into samples of the data" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 982 / 344; max-width: 982px"></iframe>
</div>
<div class="caption fm-cap">
  A network that turns samples of a Gaussian into samples of the data.
  The inputs, drawn from \(p_0\) (left), are converted using the network \(\Phi_\theta\) to a data distribution (right, the target distribution displayed faintly).
  The first inputs go through one at a time, then in growing batches.
</div>

Let's figure out what it means mathematically.
The network takes an input $$X_0 \sim p_0$$ and returns $$X = \Phi_\theta(X_0)$$.
Its outputs follow a distribution determined by the model parameters.
When this distribution has a density $$p_\theta$$, we can use the cross-entropy loss from earlier, $$\mathcal L(\theta) = -\,\mathbb E_{x \sim p_{\text{target}}}\big[\log p_\theta(x)\big]$$.
How do we evaluate $$p_\theta(x)$$ at a training point?

### Deforming probability

Passing a random input through a network always produces a probability distribution.
To train by likelihood, we also need to evaluate the output density at each training point.
A smooth, invertible map with a smooth inverse gives us a way to do this.
We can trace each output back to its input and account for how much the map stretched or compressed the volume around it.

Take a region $$A$$ of inputs and its image $$B = \Phi_\theta(A)$$.
An output lands in $$B$$ exactly when its input lies in $$A$$, so

$$
\mathbb P[X \in B] = \mathbb P[X_0 \in A] \quad\Longleftrightarrow\quad \int_B p_\theta(x)\,dx = \int_A p_0(x_0)\,dx_0 .
$$

Changing variables from $$x_0$$ to $$x = \Phi_\theta(x_0)$$ in the integral on the right gives

$$
\int_B p_\theta(x)\,dx = \int_B p_0\big(\Phi_\theta^{-1}(x)\big)\,\big\vert \det D\Phi_\theta^{-1}(x) \big\vert \,dx .
$$

Since this holds for every region $$B$$, we get:

$$
p_\theta(x) = p_0\big(\Phi_\theta^{-1}(x)\big)\,\big\vert \det D\Phi_\theta^{-1}(x) \big\vert .
$$

The Jacobian $$D\Phi_\theta$$ is the linear map that approximates $$\Phi_\theta$$ near a point, and its determinant is therefore the local change of volume (for more intuitions on the determinant, see the video [The determinant](https://www.youtube.com/watch?v=Ip3X9LOh2dk) by 3Blue1Brown):

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/jacdet.html' | relative_url }}" title="How a map changes area locally" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 562 / 409; max-width: 562px"></iframe>
</div>
<div class="caption fm-cap">
  How a map changes area locally.
  The grid is carried by the map, and each cell is coloured by its change of area.
  For the highlighted cell the two arrows are the images of its sides, and the number is the area they span divided by the area of the cell.
  Click a cell to check the behaviour at other points.
</div>


<div class="fm-question" markdown="1">
A deformation can change the shape of a density completely.
Below, a density with a single mode becomes a density with several.
How is this possible, when no mass is created?
</div>

<details markdown="1">
<summary>The answer</summary>

This is the result of the $\big\vert \det D\Phi_\theta^{-1}(x) \big\vert$ part: the mass at the target point $y$ is squeezed or stretched depending on the derivative value (Jacobian in higher dimensions) $$p_{\theta}(x) = p_0(x_0) / \vert\varphi'(x_0)\vert$$.

</details>

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/warp1d.html' | relative_url }}" title="A unimodal density deformed into a multimodal one" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 682 / 390; max-width: 682px"></iframe>
</div>
<div class="caption fm-cap">
  A unimodal density becomes multimodal.
  Bottom: the density of \(X\).
  Top: the density of \(Y = \varphi(X)\) for \(\varphi(x) = x + s \sin(t x)\).
  The grey lines show where points are sent.
</div>

### Computing the output density of the network

We can build such a map by composing invertible layers.
Let's follow a Gaussian sample $$X_0 \sim p_0$$ through the network.
Layer $$k$$ sends $$X_{k-1}$$ to $$X_k = \varphi_k(X_{k-1})$$.
After the last layer we have $$X_N = \Phi_\theta(X_0) \sim p_\theta$$, where $$\Phi_\theta = \varphi_N \circ \dots \circ \varphi_1$$.

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/net-layers.html' | relative_url }}" title="The same network, layer by layer" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 982 / 344; max-width: 982px"></iframe>
</div>
<div class="caption fm-cap">
  The network of the first figure, layer by layer.
  The layer that is lit is the one at work.
  Right: the samples on their way through the network; they take the colour of the layer that moves them, and after the last layer they lie on the data, shown faintly.
</div>

If each layer is smooth and has a smooth inverse, we can apply the same density calculation one layer at a time.
Write $$p_k$$ for the density of $$X_k$$.
To evaluate $$p_\theta(x) = p_N(x)$$ at an output $$x$$, we work backwards from the last layer to $$p_0$$.

$$
\begin{aligned}
p_\theta(x) &= p_{N-1}\big(\varphi_N^{-1}(x)\big)\,\big\vert\det D\varphi_N^{-1}\big\vert \\
&= p_{N-2}\big(\varphi_{N-1}^{-1}\circ\varphi_N^{-1}(x)\big)\,\big\vert\det D\varphi_{N-1}^{-1}\big\vert\,\big\vert\det D\varphi_N^{-1}\big\vert \\
&\;\;\vdots \\
&= p_0\big(\varphi_1^{-1}\circ\dots\circ\varphi_N^{-1}(x)\big)\,\prod_{k=1}^N \big\vert\det D\varphi_k^{-1}\big\vert \\
&= p_0\big(\Phi_\theta^{-1}(x)\big) \prod_{k=1}^N \big\vert\det D\varphi_k^{-1}\big\vert
\end{aligned}
$$

Note that this also determines how we could compute the cross-entropy loss (the logarithm turns the product into a sum):

$$
\mathcal L(\theta) = -\,\mathbb E_{x\sim p_{\text{target}}}\Big[ \log p_{\theta}(x)\Big]= -\,\mathbb E_{x\sim p_{\text{target}}}\Big[\log p_0\big(\Phi_\theta^{-1}(x)\big) + \sum_{k=1}^N \log\big\vert\det D\varphi_k^{-1}\big\vert\Big],
$$


with each determinant evaluated at the point where the inverse passes through layer $$k$$.
So we have to make sure that the inverse of every layer exists, and we have to be able to compute the determinant of its Jacobian.
These two requirements shape the whole family of normalizing flows <d-cite key="rezende2015variational,papamakarios2021normalizing"></d-cite>.
Let's take a brief look at one such approach.

### Residual flows

One way to meet the requirements is to use a residual block <d-cite key="he2015deep"></d-cite>, which changes its input only a little:

$$
\varphi_k(x) = x + \delta\, u_k(x) .
$$

With a proper choice of $$u_k$$ and $\delta$, both requirements can be guaranteed.
If $$\delta\,u_k$$ is a contraction, the block is invertible <d-cite key="behrmann2019invertible,chen2019residual"></d-cite>.
With more structure the determinant becomes easy as well.
An optional example is available below.

<details markdown="1">
<summary>An example: a triangular block</summary>

Write the block out component by component.
Its $$i$$-th output is $$x_i + \delta\,u_{k,i}(x)$$, so

$$
D\varphi_k(x) = D\big(x + \delta\,u_k(x)\big) = D\begin{pmatrix}
x_1 + \delta\,u_{k,1}(x) \\
x_2 + \delta\,u_{k,2}(x) \\
\vdots \\
x_d + \delta\,u_{k,d}(x)
\end{pmatrix}.
$$

In general every component depends on all of $$x_1, \dots, x_d$$, and the Jacobian is a full $$d \times d$$ matrix.
Now restrict the network: let the first component of $$u_k$$ depend only on $$x_1$$, the second only on $$x_1$$ and $$x_2$$, and in general the $$i$$-th only on the first $$i$$ coordinates, $$u_{k,i}(x_1, \dots, x_i)$$.
Then

$$
\begin{aligned}
D\varphi_k(x) &= D\begin{pmatrix}
x_1 + \delta\,u_{k,1}(x_1) \\
x_2 + \delta\,u_{k,2}(x_1, x_2) \\
\vdots \\
x_d + \delta\,u_{k,d}(x_1, \dots, x_d)
\end{pmatrix} \\[0.8em]
&= \begin{pmatrix}
1 + \delta\,\partial_1 u_{k,1} & 0 & \cdots & 0 \\
* & 1 + \delta\,\partial_2 u_{k,2} & & \vdots \\
\vdots & & \ddots & 0 \\
* & \cdots & * & 1 + \delta\,\partial_d u_{k,d}
\end{pmatrix}.
\end{aligned}
$$

The determinant of a triangular matrix is the product of its diagonal:

$$
\det D\varphi_k(x) = \prod_{i=1}^d \big(1 + \delta\,\partial_i u_{k,i}\big),
$$

$$d$$ numbers multiplied instead of a $$d \times d$$ determinant.
One can also prove that with proper choice of $\delta$ one can make each block easy to invert, one coordinate at a time.

</details>

At a general level, what you should focus your attention on is that all of this is non-trivial and requires constraining the network.
Ordinary networks do things that are not invertible all the time: a ReLU sends every negative number to zero, a network with more outputs than inputs puts all its outputs on a thin surface, and so on.

Moreover, remember about the $$\big\vert \det D\Phi_\theta^{-1}(x) \big\vert$$ term in the loss.
It has to be evaluated at every training point, in every training step.
For a general network this is a determinant of a $$d \times d$$ matrix, which takes on the order of $$d^3$$ operations, and for a 256×256 colour image $$d$$ is about 200 000.

To train by likelihood this way, we need a network we can invert and a Jacobian determinant we can compute efficiently.
Is there an easier way to learn to sample from the target distribution?

### Understanding the meaning of a residual block

Let's take a look at the Residual Flows at work with a very suggestive example distribution:

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/coffee-unstir.html' | relative_url }}" title="A chain of residual blocks, and what it does to a very suggestive distribution" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1000 / 444; max-width: 1000px"></iframe>
</div>
<div class="caption fm-cap">
  A chain of residual blocks at work.
  Press next twice: once to see what each block adds to its input, and once more to see how this visualisation relates to what we've already seen.
</div>

Does the deformation remind you of anything?
Use the "next" button to:

1. First see the visualised outputs of the residual blocks for some samples
2. Then add colours to make the analogy super clear

The deformation is the milk in a cup one we saw when discussing deformable simulation!
The blocks un-stir it: each block undoes one slice of the stirring.
But this is what we did in the numerical integration section - only with time flowing in the opposite direction.
Put the two formulas next to each other:

$$
\underbrace{x_k = x_{k-1} + \delta\, u_k(x_{k-1})}_{\text{residual block}}
\qquad\qquad
\underbrace{x(t+\Delta t) \approx x(t) + \Delta t\,u_t\big(x(t)\big)}_{\text{Euler numerical integration}}
$$

I hope it's clear that, in essence, they are the same formula.
A residual block is one step of a numerical integration, and a residual flow learns a numerical integration with the step size and the number of steps frozen into the architecture <d-cite key="chen2018neural"></d-cite>.
This is the key idea of flow matching: **learn the velocity**, not the resulting deformation.
Then use numerical integration to obtain the result.

## Learning flows

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/flowrows.html' | relative_url }}" title="A probability flow and its velocity field" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 680 / 367; max-width: 680px"></iframe>
</div>
<div class="caption fm-cap">
  A probability flow.
  Left: samples of a simple distribution carried along a velocity field.
  Right: the field at the same moment, coloured by speed.
  The menu changes the pair of distributions.
</div>

Some vocabulary for what follows.
The **flow** $$\varphi : [0, 1] \times \mathbb R^d \to \mathbb R^d$$ records where points end up: $$\varphi_t(x_0)$$ is the position at time $$t$$ of the point that started at $$x_0$$.
Under it lies a time-dependent vector field, the velocity field,

$$
\frac{d}{dt}\varphi_t(x) = u_t\big(\varphi_t(x)\big), \qquad \varphi_0(x) = x,
$$

and this is the thing we will learn directly: the network is now $$v_\theta(t, x)$$, which takes a time and a position and returns a velocity.
The family of distributions we encounter along the way, determined by $$\varphi_t(X_0)$$ for $$X_0 \sim p_0$$, is called the **probability path** $$p_t$$.
It starts at a simple distribution, $$p_0 = \mathcal N(0, I)$$, and we want it to end at the target, $$p_1 \approx p_{\text{target}}$$.

### If we knew the velocity field

Suppose for a moment that the velocity field were known, as it is in the cup example.
Take the stirred cup as the start and the heart of milk as the target.
The field that leads from one to the other is the stirring, run backwards.
We can fit the network to the known velocities by least squares:

$$
\mathcal L_{\text{FM}}(\theta) = \mathbb E_{\,t \sim U[0,1],\; x \sim p_t}\, \big\lVert v_\theta(t, x) - u_t(x) \big\rVert^2 .
$$

The loss has four ingredients:
sample a moment in time,
sample a point in space where the flow actually passes at that moment,
check the velocity that the network gives there,
and compare it against the target velocity.
A training step draws moments and points at random and compares the two velocities.

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/coffee-learn.html' | relative_url }}" title="Fitting a network to a known velocity field" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1060 / 490; max-width: 1060px"></iframe>
</div>
<div class="caption fm-cap">
  Fitting a network to a known velocity field.
  Step through the first training step: moments in time, points in the cup at those moments, the outputs of the network, the true velocities.
  After that a small network is trained in your browser, and from time to time training stops to compare the true flow with the flow that the network produces.
</div>

Note that during training this is plain regression.
The numerical integration appears only afterwards, when we want to use the field that was learned.

### What we get

Three things are gained by learning the velocity instead of the deformation.

- **Any network.** $$v_\theta(t, x)$$ needs no invertibility: a differential equation with a well-behaved right-hand side can always be run backwards in time.
- **An arbitrary number of steps.** How many integration steps are taken, how large they are and how they are computed are no longer baked into the network.
  These are chosen when sampling.
- **The density is still there, implicitly.** Along a trajectory, $$\log p_1(x_1) = \log p_0(x_0) - \int_0^1 \nabla\!\cdot u_t(x_t)\,dt$$, the continuous version of $$\log p_0\big(\Phi_\theta^{-1}(x)\big) + \sum_{k} \log\big\vert\det D\varphi_k^{-1}\big\vert$$ <d-cite key="chen2018neural"></d-cite>.

Continuous normalizing flows train $$v_\theta$$ by maximum likelihood with this last formula <d-cite key="chen2018neural,grathwohl2018ffjord"></d-cite>: every training step integrates the differential equation, and the divergence of a network along it, for every data point.
That is correct, but slow.
The regression above would be much cheaper.

## Flow matching

### The problem

But there are some problems.
For images, we don't know the stirring - if we did, we could just use it and there would be nothing to learn.
Of the four ingredients of $$\mathcal L_{\text{FM}}$$, two are missing.
We cannot draw $$x \sim p_t$$, because we do not know the probability path.
And we have no target $$u_t(x)$$, because we do not know the velocity field.
All we have is noise that we can sample, at $$t = 0$$, and a data set, at $$t = 1$$.
Infinitely many flows lead from the noise to the data.
What can we do?

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/problem.html' | relative_url }}" title="What we have, and what we do not: noise, data, and nothing in between" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1060 / 304; max-width: 1060px"></iframe>
</div>
<div class="caption fm-cap">
  What we have, and what we do not: samples of the noise at \(t = 0\), a data set at \(t = 1\) (samples of a distribution that we do not know), and nothing in between.
</div>


### One data point

We can design a reasonable path if the target distribution always produces the same thing, for example the same image: a data set with a single point $$x_1$$.
Draw the noise, $$x_0 \sim \mathcal N(0, I)$$, and move every sample towards $$x_1$$ along a straight line, shrinking the cloud on the way:

$$
x_t = \sigma_t\, x_0 + t\, x_1, \qquad \sigma_t = 1 - (1 - \sigma_{\min})\, t .
$$

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/one-point.html' | relative_url }}" title="A probability path to a single data point" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 897 / 324; max-width: 897px"></iframe>
</div>
<div class="caption fm-cap">
  The simple path of a single data point, drawn as a surface over the plane: a Gaussian that travels to the data point and narrows.
  On the floor: the velocity field that carries it.
</div>

At time $$t$$ these points are distributed as $$p_t(x \mid x_1) = \mathcal N\big(t\,x_1,\; \sigma_t^2 I\big)$$.
This is the **conditional probability path**, and it is our design choice: the standard Gaussian at $$t = 0$$, and a Gaussian of width $$\sigma_{\min}$$ gathered around $$x_1$$ at $$t = 1$$.
As before, a velocity field determines the deformation, the **conditional velocity field** $$u_t(x \mid x_1)$$.
For this family of paths it can be written down <d-cite key="lipman2022flow"></d-cite>: differentiate $$x_t$$ with respect to $$t$$ and express $$x_0$$ through $$x_t$$, which gives

$$
u_t(x \mid x_1) = \frac{x_1 - (1 - \sigma_{\min})\,x}{\sigma_t} .
$$

With $$\sigma_{\min} = 0$$ this is $$(x_1 - x)/(1 - t)$$, and along the path of one sample it is constant, $$x_1 - x_0$$: every point moves on a straight line at constant speed.

### Many data points

For a data set with multiple samples, a natural thing to try is to give every data point its own simple path, and average the paths over the data points.
Think of a mixture of Gaussians we discussed at the beginning, with a mixture at each time $t$.
For a sample of $$n$$ points it's a sum $$\frac1n \sum_k p_t(x \mid x_k)$$, and in general it is:

$$
p_t(x) = \int p_t(x \mid x_1)\; p_{\text{target}}(x_1)\, dx_1 ,
$$

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/mixture.html' | relative_url }}" title="The mixture of the simple paths of several data points" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1060 / 420; max-width: 1060px"></iframe>
</div>
<div class="caption fm-cap">
  The mixture of the simple paths of seven data points.
  Left: one Gaussian per data point, each on its way to its data point (the pins); the net over them is their sum.
  Right: the sum, the mixture \(p_t\), coloured by the data points that contribute at each place.
</div>

At $$t = 0$$ every conditional path is the standard Gaussian, so $$p_0 = \mathcal N(0, I)$$.
At $$t = 1$$ there is a narrow Gaussian around each data point, so $$p_1 \approx p_{\text{target}}$$.
In between we have a valid probability path from noise to data.

### Let's hit the road

We have a probability path.
Which velocity field moves the points along it?
Let's come back to [the opening puzzle](#road-puzzle).
This time we can see the whole road.
The yellow cars still drive at 100 km/h and the blue cars at 50 km/h, but the faster cars overtake the slower ones.
The mix of cars now depends on where and when we look.

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/cars-hint.html' | relative_url }}" title="One speed for all the cars at a place" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1060 / 462; max-width: 1060px"></iframe>
</div>
<div class="caption fm-cap">
  A hint: counting cars.
  Think about the question first, then press next.
</div>

Choose a given kilometer on the road (without choosing the lane) and a moment in time.
If someone asked you how quickly people are driving here at this moment, what would you say?

Take a snapshot of that stretch of road.
Average the speeeds of each lane, weighting each by its share of the cars in the snapshot.

$$
\bar v(x, t) = \frac{\rho_{\text{yellow}}(x, t) \cdot 100 + \rho_{\text{blue}}(x, t) \cdot 50}{\rho_{\text{yellow}}(x, t) + \rho_{\text{blue}}(x, t)} ,
$$

where $$\rho$$ counts cars per km.
The lower picture checks that this is the right speed.
Its cars cannot be told apart, and each of them drives at the weighted average speed of the place where it is.
They take different paths from the real cars: no grey car ever overtakes another.
Yet at every moment the crowd as a whole is the same, and the curve that counts the cars per km is identical in both pictures.

### The velocity of the mixture

Now translate.
A lane is a data point.
The cars per kilometre in that lane correspond to the point's Gaussian density $$p_t(x \mid x_k)$$.
Dividing that density by the sum across lanes gives the lane's share of the cars at $$x$$.
The speed of the lane is the conditional velocity $$u_t(x \mid x_k)$$.
So the guess for the velocity of the mixture is the weighted average

$$
u_t(x) = \sum_k w_k(x)\, u_t(x \mid x_k), \qquad w_k(x) = \frac{p_t(x \mid x_k)}{\sum_j p_t(x \mid x_j)} .
$$

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/mix-velocity.html' | relative_url }}" title="The velocity of the mixture at a point" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1060 / 460; max-width: 1060px"></iframe>
</div>
<div class="caption fm-cap">
  The velocity of the mixture at a point \(x\).
  Step through it: the velocity of every Gaussian at \(x\), how much each of them counts at a later moment, and their weighted average.
  Afterwards the point can be dragged and the time moved.
</div>

For a general data distribution the sum becomes an integral, and the weights become the distribution of the data point given where we are:

$$
u_t(x) = \int u_t(x \mid x_1)\; \frac{p_t(x \mid x_1)\, p_{\text{target}}(x_1)}{p_t(x)}\; dx_1 = \int u_t(x \mid x_1)\; p_t(x_1 \mid x)\; dx_1 .
$$

It can actually be proved that this works: the averaged field moves the points exactly along the mixture path $$p_t$$ (Theorem 1 of <d-cite key="lipman2022flow"></d-cite>).
The proof rests on the continuity equation, which describes how a density changes when a velocity field carries its mass.
It deserves pictures of its own, and we leave it to a separate post.

### Training on the weighted averages

With this, both missing ingredients are back.
A sample of $$p_t$$: read the formula of the mixture as a recipe, pick a data point at random, then draw a point from its Gaussian.
A target at that point: the weighted average of the conditional velocities there.

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/mix-sampling.html' | relative_url }}" title="Sampling training points and their targets" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1060 / 460; max-width: 1060px"></iframe>
</div>
<div class="caption fm-cap">
  Training data from \(p_t\).
  Left: the Gaussians of the data points at one moment, seen from above; a circle is one standard deviation.
  Right: their sum.
  Step through one sample, then draw more with the buttons: the dots are samples of \(p_t\), the arrows their targets.
</div>

Regressing $$v_\theta(t, x)$$ on these weighted averages is a way to train, known as *empirical flow matching* (EFM) <d-cite key="bertrand2025closed"></d-cite>.
With a large data set the sum cannot run over all the data points for every training point, so it runs over a batch of $$M$$ of them, and this batch always includes the data point that the training point came from.
With that precaution the smaller average still has the right mean (Proposition 2 of the paper).

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/efm-moons.html' | relative_url }}" title="Training on the weighted averages, on two moons" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1060 / 534; max-width: 1060px"></iframe>
</div>
<div class="caption fm-cap">
  Empirical flow matching on two moons, with targets averaged over 32 data points.
  Below: training.
  A batch consists of 16 moments in time with 8 points each; three of the moments are drawn, with the points, the outputs of the network and the targets.
  Above: from time to time training stops, and the noise is carried along the field of the network as it is at that moment.
</div>

Training on the weighted average works, but each target uses several data points.
Could we train on the velocity from just one of them?
That's the question we tried out with the two score columns on the road.

### Scoring a guess

In the [opening puzzle](#road-puzzle), a guess of 80 km/h scored 100 against the average speed and 500 against the individual cars.
Change the guess to 85 and the scores fall to 25 and 425.
Both rules reward the change by exactly 75 points.
In fact, adding 400 to the first score gives the second for **every** guess.
So the two columns give the same ranking, ties included.

Now stand at any place $$x$$ at a time $$t$$ and make a prediction $$v_p$$.
The expanded table compares two ways to score it.

- Score the guess against the local average speed $$\bar v = \mathbb E_{\text{lane}}[v_{\text{lane}}]$$.
  Its squared error is $$(v_p - \bar v)^2$$.
- Score the guess against a randomly chosen car at that place and time, then average the squared errors over the choice of car: $$\mathbb E_{\text{lane}}\big[(v_p - v_{\text{lane}})^2\big]$$.

<div class="fm-question" markdown="1">
Move the marker to a stretch of road with a different mix of cars.
What happens to the gap between the columns?
Do the rankings still agree?
</div>

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/guess-road.html' | relative_url }}" title="Scoring a guess of the speed, two ways" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1060 / 486; max-width: 1060px"></iframe>
</div>
<div class="caption fm-cap">
  Scoring a guess, two ways.
  Drag \(x\) along the road or move the time: the shares of the two lanes at \(x\) change, and with them both scores of every guess.
  The last column is the difference of the two scores.
  The last row takes a guess of your own.
</div>

The gap can change when you move the marker.
Nevertheless, at any fixed place and time, it is the same for every guess.
Why is that?

Add and subtract the average speed inside the square:

$$
\begin{aligned}
\mathbb E_{\text{lane}}\big[(v_p - v_{\text{lane}})^2\big]
&= \mathbb E_{\text{lane}}\big[(v_p - \bar v + \bar v - v_{\text{lane}})^2\big] \\
&= (v_p - \bar v)^2 + 2\,(v_p - \bar v)\,\underbrace{\mathbb E_{\text{lane}}\big[\bar v - v_{\text{lane}}\big]}_{=\,0} + \underbrace{\mathbb E_{\text{lane}}\big[(\bar v - v_{\text{lane}})^2\big]}_{\text{no } v_p \text{ in it}} .
\end{aligned}
$$

The middle term vanishes because the deviations from the average cancel; that is what makes $$\bar v$$ the average.
The last term is the spread of the speeds at that place, and the prediction does not appear in it.
So

$$
\mathbb E_{\text{lane}}\big[(v_p - v_{\text{lane}})^2\big] = (v_p - \bar v)^2 + \text{const} .
$$

### From one place to the whole road

But this is at a fixed place and time on the road.
Written with everything it depends on,

$$
\mathbb E_{\text{lane} \sim p_t(\cdot \mid x)} \big[ (v_p(x, t) - v_{\text{lane}}(x, t))^2 \big] = \big( v_p(x, t) - \bar v(x, t) \big)^2 + \text{const}(x, t) ,
$$

and what we want is a prediction for every place and every time.
So take the expectation of both sides over the times $$t$$ and over the places $$x \sim p_t$$ where the cars are:

$$
\begin{aligned}
&\mathbb E_{t}\, \mathbb E_{x \sim p_t}\, \mathbb E_{\text{lane} \sim p_t(\cdot \mid x)} \big[ (v_p(x, t) - v_{\text{lane}})^2 \big] \\
&\qquad = \mathbb E_{t}\, \mathbb E_{x \sim p_t} \big[ \big( v_p(x, t) - \bar v(x, t) \big)^2 \big] + \underbrace{\mathbb E_{t}\, \mathbb E_{x \sim p_t} \big[ \text{const}(x, t) \big]}_{\text{const}} .
\end{aligned}
$$

On the right is the score against the average speed, over the whole road and all times, plus a constant.
But more important things happen on the left.
Because

$$
p_t(x)\; p_t(\text{lane} \mid x) \;=\; p_t(x, \text{lane}) \;=\; p_t(\text{lane})\; p_t(x \mid \text{lane}) ,
$$

we can change the sampling order:

$$
\begin{aligned}
&\mathbb E_{t}\, \mathbb E_{x \sim p_t}\, \mathbb E_{\text{lane} \sim p_t(\cdot \mid x)} \big[ (v_p(x, t) - v_{\text{lane}})^2 \big] \\
&\qquad = \mathbb E_{t}\, \mathbb E_{\text{lane} \sim p_t}\, \mathbb E_{x \sim p_t(\cdot \mid \text{lane})} \big[ (v_p(x, t) - v_{\text{lane}})^2 \big] .
\end{aligned}
$$

Pick a time, pick a lane, then pick a place on that lane.
We no longer have to average over lanes at a given place and time!

This is an equality of expectations, so it holds exactly.
In practice we see finitely many cars, and almost never two of them at the same place and time: the prediction at a place has to be learned from the cars around it.
So the recipe works as long as the prediction changes smoothly with place and time, and what it learns at one place carries over to the neighbouring ones.

### Conditional vs Empirical Flow Matching at a fixed moment

Let us first try this at a single moment in time.
We start with some prediction $v_p(x)$: a curve over the road.
With CFM, we train one lane at a time: every sample pulls the curve towards a target, near its own place.

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/guess-curve.html' | relative_url }}" title="Two prediction curves trained on the same cars" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1060 / 518; max-width: 1060px"></iframe>
</div>
<div class="caption fm-cap">
  Two prediction curves for the whole road, trained at the same places, one car at a time.
  Top row: prediction is scored against selected lane speed.
  Bottom row: prediction is scored against the weighted average of both lanes at a given place.
  Dashed: the true average speed.
  Below the rows: where the cars are, and how many cars every km of road has received.
  The slider changes how smooth the curves are.
</div>

No place comes up twice, but every stretch of road keeps receiving cars in its own mix, and the curve, which is smooth, pools them.
In the end, it settles on the average speed.

Both rows end at the same curve, and the lower one gets there with less wandering.
Is that a fair comparison?
Both rows take the same steps with the same cars, so the prediction is evaluated and corrected equally often.
For a network that is the same amount of work.
But the lower row uses more information in every step: its target is worked out from both lanes, while the upper row looks only at the lane of its car.
The counters in the figure show the difference.
The same is true of empirical flow matching.
An average over $$M$$ data points for every training point costs $$M$$ data points, but no additional passes through the network, and an average is cheap next to those: its authors measure about 2% of extra time for every 100 data points in the average, on CIFAR-10 <d-cite key="bertrand2025closed"></d-cite>.

### Conditional vs Empirical Flow Matching over the entire time axis

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/guess-surface.html' | relative_url }}" title="A prediction for every place and time" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1060 / 540; max-width: 1060px"></iframe>
</div>
<div class="caption fm-cap">
  A prediction for every place and time.
  The figure starts with the curve of one moment; press next to unfold the time axis and to train on cars from any moment.
  The surface is the prediction, and the net is the average speed.
  Drag the picture to turn it.
  The slider sets the width of the bumps that the prediction is made of.
</div>

The slider shows what smoothness does.
Too smooth, and the prediction blurs where the average speed changes quickly.
Too wiggly, and it follows a single car.

It is worth being precise about the role that smoothness plays.
The equality of the two expectations does not need it: every single car is an unbiased sample of the loss, and a perfectly flexible prediction fed with endless fresh cars would also land on the averages.
Smoothness matters because the cars are finitely many.
Almost no place is seen twice, so the prediction at a place can only be learned by pooling the cars around it, in place and in time.
Pool too widely, and places with different average speeds are mixed.
Pool too narrowly, and single cars show through.

In a neural network there is no single slider for this.
The smoothness is set by the size of the network, by weight decay, by penalties on its slope (or spectral normalisation), by the frequencies of its input features (such as the time embedding), by noise on the inputs, and by the moment at which training stops.

In flow matching this trade-off affects what a model generates.
For a fixed training set and $$\sigma_{\min}=0$$, following the exact empirical velocity field to $$t=1$$ returns one of the training examples.
In that setting, generating new examples by exact integration requires a learned field that differs from the empirical one <d-cite key="bertrand2025closed"></d-cite>.
On the road, we saw how smoothing across a sharp change in the mean velocity can produce such a difference.

### Back to the arrows

The road was flow matching in disguise.
Here is the dictionary.

| the cars | flow matching |
| --- | --- |
| a lane | a data point $$x_1$$ |
| the speed of a lane, $$v_{\text{lane}}$$ | the conditional velocity $$u_t(x \mid x_1)$$ |
| the shares of the lanes at $$x$$, $$p_t(\text{lane} \mid x)$$ | the weights $$w_k(x) = p_t(x_1 \mid x)$$ |
| the weighted speed at $$x$$, $$\bar v(x, t)$$ | the velocity of the mixture, $$u_t(x)$$ |
| the prediction $$v_p(x, t)$$ | the network $$v_\theta(t, x)$$ |
| scoring against the average speed | the flow matching loss $$\mathcal L_{\text{FM}}$$ |
| scoring against a random lane, $$\mathbb E_{\text{lane}}\big[(v_p - v_{\text{lane}})^2\big]$$ | the conditional loss $$\mathcal L_{\text{CFM}}$$ |
| a time, a lane, then a place on the road | $$t$$, then $$x_1 \sim p_{\text{target}}$$, then $$x \sim p_t(\cdot \mid x_1)$$ |

In the words of the right-hand column: draw a time, draw a data point, draw a point from its simple path, and regress on the conditional velocity of that one data point.
This is the **conditional flow matching** loss,

$$
\mathcal L_{\text{CFM}}(\theta) = \mathbb E_{\,t \sim U[0,1],\; x_1 \sim p_{\text{target}},\; x \sim p_t(\cdot \mid x_1)}\, \big\lVert v_\theta(t, x) - u_t(x \mid x_1) \big\rVert^2 ,
$$

and the road argument, applied to arrows, gives $$\mathcal L_{\text{CFM}}(\theta) = \mathcal L_{\text{FM}}(\theta) + \text{const}$$.
The constant is the expected squared deviation of a conditional arrow from its local mean.
It is independent of $$\theta$$, so the two losses have the same gradient (Theorem 2 of <d-cite key="lipman2022flow"></d-cite>).
Every ingredient of $$\mathcal L_{\text{CFM}}$$ is something we have.

We can now read the two columns of the road puzzle as training losses.
For a given training set, fix a time $$t$$ and a position $$x$$ on the mixture path.
The weighted mean of the individual arrows gives the full-data EFM target.
Scoring against that arrow gives the first column.
CFM scores against one arrow.
Given $$x$$ and $$t$$, that arrow comes from data point $$x_k$$ with probability $$w_k(x)$$.
Averaging its score over those possibilities gives the second column.
The gap between the columns is independent of the prediction, so even after averaging over positions and times the two losses rank candidate velocity fields in the same order.

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/cfm-arrows.html' | relative_url }}" title="CFM targets near x and the EFM target at x" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 680 / 424; max-width: 680px"></iframe>
</div>
<div class="caption fm-cap">
  Each colored arrow is the CFM target for one sample.
  The wide, shaded arrow is the EFM target at \(x\), computed from all seven data points.
  Press next to draw more samples.
  The thin arrow approaches the mean of the CFM targets over the circle, which approximates the target at its center.
</div>

### The algorithm

Everything is in place.
For the simple paths with $$\sigma_{\min} = 0$$, where $$x_t = (1 - t)\,x_0 + t\,x_1$$ and the conditional velocity along the path is $$x_1 - x_0$$, the whole algorithm fits on a few lines.
Training:

```text
initialize θ randomly
repeat:
    x1 ← a minibatch of data
    x0 ← noise  N(0, I)             # same shape as x1
    t  ← Uniform[0, 1]              # one per example
    xt ← (1 − t) · x0 + t · x1
    L  ← ‖ v_θ(t, xt) − (x1 − x0) ‖²
    θ  ← θ − η · ∇_θ L
```

Inference:

```text
x ← noise  N(0, I)
for k = 0, …, n−1:
    x ← x + (1/n) · v_θ(k/n, x)     # one Euler step
return x
```

During training there is no likelihood, no Jacobian and no differential equation: one evaluation of the network per example, as in any regression.
The solver appears only during inference.
Reference implementations, and many variants of the paths and of the pairing between noise and data, are collected in <d-cite key="lipman2024guide,tong2023improving"></d-cite>.

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/train.html' | relative_url }}" title="Training a flow-matching model in the browser" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 669 / 384; max-width: 669px"></iframe>
</div>
<div class="caption fm-cap">
  Watch it learn.
  A small network \(v_\theta(t, x)\) is trained in your browser on the conditional loss.
  The picture shows the data and, on top of it, the samples that the network generates right now with 12 Euler steps.
  Press "train".
</div>

Inference is numerical integration, so the earlier lesson applies: the number of steps changes the result.
The learned flow bends, a single Euler step cuts every bend, and a handful of steps is often enough.

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/euler.html' | relative_url }}" title="The number of integration steps at sampling time" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 657 / 404; max-width: 657px"></iframe>
</div>
<div class="caption fm-cap">
  The number of integration steps at inference.
  The loop shows the learned flow, then inference with a single straight Euler step, then with more and more steps; the buttons choose a number of steps.
  Dashed: the exact paths.
</div>

## Extensions and applications

### Diffusion models

Diffusion models <d-cite key="ho2020denoising,song2021score"></d-cite> are close relatives.
They also move noise to data, and they are trained with the same trick of regressing on a target that is built from one data point at a time.
The differences are in what is learned and in how samples are drawn.

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/ode-sde.html' | relative_url }}" title="A deterministic path and a noisy path from noise to data" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 564 / 218; max-width: 564px"></iframe>
</div>
<div class="caption fm-cap">
  Two ways from noise to data: a deterministic path, and a path that receives fresh noise at every step.
</div>

| | flow matching | diffusion |
| --- | --- | --- |
| sampling | an ordinary differential equation: deterministic steps | a stochastic differential equation: every step adds noise |
| what is learned | the velocity $$u_t$$ | the score $$\nabla_x \log p_t$$, or the noise |
| training | regression on a per-data-point target | regression on a per-data-point target |

The table is a simplification: a diffusion model can also be sampled deterministically <d-cite key="song2021score"></d-cite>.
A great starting point for learning more is the course MIT 6.S184, Flow Matching and Diffusion Models, which treats both in one framework: [its lectures](https://www.youtube.com/watch?v=9eJQQVrUUoI&list=PL57nT7tSGAAXwjhDYcxEycx5W7YoSrZyt) are online, and so are its lecture notes <d-cite key="holderrieth2025introduction"></d-cite>.

### Learning families of distributions

A prompt $$y$$ picks one member of a family of distributions $$\{\, p_{\text{target}}(\,\cdot \mid y) \,\}_y$$, indexed by $$y$$, and we want to learn the whole family at once.

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/condfam.html' | relative_url }}" title="A family of conditional distributions" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 700 / 168; max-width: 700px"></iframe>
</div>
<div class="caption fm-cap">
  A family of distributions indexed by a condition: all the data, and the data for three different prompts.
</div>

In general $$y$$ stands for conditioning tokens: a text prompt, a class label, an image, an observation of a robot.
With a network, learning the family is a small change.
The condition becomes one more input, $$v_\theta(t, x, y)$$.
Note that here we are not talking about the conditional loss we used earlier!
The conditioning we are discussing here chooses one specific member from the family of distributions.
The training pairs $$(x_1, y)$$ come from the data set, the loss is unchanged, and at inference we fix $$y$$ and run the same numerical integration loop.

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/conditioning.html' | relative_url }}" title="The condition is one more input of the network" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 528 / 230; max-width: 528px"></iframe>
</div>
<div class="caption fm-cap">
  The condition is one more input of the network.
</div>

This view can be made precise: for every $$y$$ there is a probability path that ends at $$p_{\text{target}}(\,\cdot \mid y)$$ and a velocity field that generates it, and a single network is trained to model the fields for all values of $$y$$ (Section 4.10 of <d-cite key="lipman2024guide"></d-cite>, Section 5 of <d-cite key="holderrieth2025introduction"></d-cite>).
In practice the conditional model is usually combined with classifier-free guidance <d-cite key="ho2022classifier,zheng2023guided"></d-cite>, which makes the samples follow the prompt more closely.
A good place to understand it is the guest video by Welch Labs on 3Blue1Brown, [But how do AI images and videos actually work?](https://www.youtube.com/watch?v=iv-5mZ_9CPY).
Systems built this way include image generators <d-cite key="esser2024scaling"></d-cite> and speech generators <d-cite key="le2023voicebox"></d-cite>.

### Robot actions

Flow matching is not only for images.
In $\pi 0$ <d-cite key="black2024pi0"></d-cite> the thing being generated is a chunk of future actions of a robot <d-cite key="zhao2023learning"></d-cite>, and the condition is what the robot observes: camera images, a language command and the state of the arm.
An inference starts from noise and integrates a learned velocity field for a few steps; the robot executes the resulting chunk and asks again.

<div class="l-body fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/chunkflow.html' | relative_url }}" title="Action chunks generated by a flow, one inference at a time" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 631 / 434; max-width: 631px"></iframe>
</div>
<div class="caption fm-cap">
  Action chunks generated by a flow, computed exactly from a small set of demonstrations.
  The gripper has to pass two obstacles, and the demonstrations go around each of them on the left or on the right.
  Each inference carries noise to a chunk of 50 positions in 10 Euler steps; the chain on the left lights up while it runs.
  Then the robot executes the chunk, and the next inference starts from where the gripper is.
</div>

## Summary

Flow matching deforms a distribution we can sample onto the distribution of the data.
A deformation in time is a flow, and a flow is described by a velocity field, so the network learns velocities.
At inference we draw a sample of the known distribution and integrate numerically, with as many steps as we choose.
Learning the velocity avoids the explicit constraints that a network has to satisfy when it represents the deformation itself.
We build a simple path for each data point.
At a given position and time, the weighted average of the conditional velocities gives the velocity field we are after.
Using one sampled velocity as the target gives, on average, the same loss gradient as using that weighted average.
Through conditioning, one network learns a whole family of distributions at once, which is what makes the method useful for prompts and for robots.

## Exercises

### Hitting the data exactly

Suppose we draw $$x_1 \sim p_{\text{target}}$$.
What should the conditional distribution at $$t=1$$ be so that the mixture ends exactly at $$p_{\text{target}}$$?

<details markdown="1">
<summary>Answer</summary>

Set $$\sigma_{\min}=0$$.
The conditional endpoint is then a point mass (a Dirac delta) at $$x_1$$, so we return exactly the point we drew.
Since that draw came from $$p_{\text{target}}$$, the endpoint has distribution $$p_{\text{target}}$$.
If we choose $$x_1$$ uniformly from a fixed training set, the same argument gives its empirical distribution.

</details>

### The proofs

If you are eager to learn more, I encourage you to open the flow matching paper <d-cite key="lipman2022flow"></d-cite> and try to prove its theorems.
The following reading of conditional expectation may help (it follows [an answer on Mathematics Stack Exchange](https://math.stackexchange.com/a/2909504)). $$\mathbb E[X \mid \mathcal B]$$ is a random variable: the average of $$X$$ over each cell that the information $$\mathcal B$$ lets you resolve.
Think of a camera.
Finer information gives a sharper picture, and a low-resolution picture of a high-resolution picture is just the low-resolution picture.

<div class="l-page fm-fig">
  <iframe src="{{ 'assets/html/2027-04-30-a-two-lane-road-to-flow-matching/condexp.html' | relative_url }}" title="Conditional expectation as a camera" loading="lazy" frameborder="0" scrolling="no" style="aspect-ratio: 1130 / 389; max-width: 1130px"></iframe>
</div>
<div class="caption fm-cap">
  Conditional expectation as a camera, for a function on an interval (right) and for a picture (left).
  Step through it: a fine camera, a coarse camera, and the coarse camera pointed at the fine picture.
</div>

In symbols,

$$
\mathbb E\big[\,\mathbb E[X \mid \mathcal B]\;\big\vert\;\mathcal A\big] = \mathbb E[X \mid \mathcal A] \quad\text{whenever } \mathcal A \subseteq \mathcal B .
$$

The velocity of the mixture is such a picture: $$u_t(x)$$ is the conditional arrow $$u_t(x \mid x_1)$$ seen at the resolution of the time and the place alone, without the data point.
