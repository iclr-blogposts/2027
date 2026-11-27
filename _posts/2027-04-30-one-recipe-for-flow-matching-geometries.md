---
layout: distill
title: "One recipe for the geometries of flow matching: from densities to amplitudes"
description: Flow matching assumes your data lives in Euclidean space, but when each data point is a distribution, the straight line and the L2 norm need replacing, and Wasserstein, the linear mixture and Fisher-Rao are the usual choices. We show that all three come from one recipe with three ingredients, a state, a rule for how it may change and a price for each change. Made with complex amplitudes as the state, the same recipe gives a fourth geometry, Fubini-Study; samples cannot see its phase, and a signed amplitude lets a network represent zeros of a density that survive small errors.
date: 2027-04-30
future: true
htmlwidgets: true

authors:
  - name: Anonymous

bibliography: 2027-04-30-one-recipe-for-flow-matching-geometries.bib

toc:
  - name: Flow matching is Euclidean flow matching
  - name: Flow matching over families of distributions
  - name: One recipe
  - name: Three geodesics between two Gaussians
  - name: Transport gives Wasserstein
  - name: Birth and death give the mixture
  - name: Fisher's price gives Fisher-Rao
  - name: An amplitude gives Fubini-Study
  - name: Interference
  - name: Fisher-Rao inside Fubini-Study
  - name: The phase is invisible to samples
  - name: Geometry and representation
  - name: Side by side
  - name: Which geometry for which data
_styles: >
  .table-scroll { overflow-x: auto; }
  .table-scroll table { font-size: 0.9rem; margin: 0 auto; }
  .table-scroll th, .table-scroll td { padding: 0.35rem 0.6rem; } .table-scroll td:first-child { white-space: nowrap; } .table-scroll mjx-container { white-space: nowrap; }
  @media (max-width: 1199px) { .table-scroll table { font-size: 0.8rem; } .table-scroll th, .table-scroll td { padding: 0.3rem 0.4rem; } }
  iframe.fig { display: block; }
  /* captions as a boxed aside: left-aligned, theme colours (light and dark) */
  .caption { text-align: left; line-height: 1.55; background: var(--global-code-bg-color); background: color-mix(in srgb, var(--global-text-color) 5%, transparent); color: var(--global-text-color); border-left: 3px solid var(--global-theme-color); border-radius: 4px; padding: 0.6rem 0.9rem; }
  /* figure heights by screen width, measured on the built site (2026-11-23); no script resizes them */
  iframe.fig-twolevel { height: 740px; } iframe.fig-densfield { height: 1146px; } iframe.fig-ampspace { height: 1397px; } iframe.fig-learned { height: 1921px; } iframe.fig-geod { height: 968px; } iframe.fig-simplex { height: 816px; } iframe.fig-dict4 { height: 1045px; } iframe.fig-samples { height: 983px; } iframe.fig-zeros { height: 967px; } iframe.fig-traj { height: 1248px; }
  @media (min-width: 360px) { iframe.fig-twolevel { height: 722px; } iframe.fig-densfield { height: 1081px; } iframe.fig-ampspace { height: 1361px; } iframe.fig-learned { height: 1766px; } iframe.fig-geod { height: 904px; } iframe.fig-simplex { height: 781px; } iframe.fig-dict4 { height: 999px; } iframe.fig-samples { height: 965px; } iframe.fig-zeros { height: 903px; } iframe.fig-traj { height: 1184px; } }
  @media (min-width: 420px) { iframe.fig-twolevel { height: 704px; } iframe.fig-densfield { height: 1025px; } iframe.fig-ampspace { height: 1274px; } iframe.fig-learned { height: 1649px; } iframe.fig-geod { height: 868px; } iframe.fig-simplex { height: 764px; } iframe.fig-dict4 { height: 979px; } iframe.fig-samples { height: 913px; } iframe.fig-zeros { height: 847px; } iframe.fig-traj { height: 1148px; } }
  @media (min-width: 560px) { iframe.fig-traj { height: 1122px; } iframe.fig-twolevel { height: 669px; } iframe.fig-densfield { height: 904px; } iframe.fig-ampspace { height: 1168px; } iframe.fig-learned { height: 1447px; } iframe.fig-geod { height: 764px; } iframe.fig-simplex { height: 701px; } iframe.fig-zeros { height: 829px; } iframe.fig-dict4 { height: 960px; } iframe.fig-samples { height: 813px; } }
  @media (min-width: 690px) { iframe.fig-twolevel { height: 669px; } iframe.fig-densfield { height: 904px; } iframe.fig-ampspace { height: 1168px; } iframe.fig-learned { height: 1447px; } iframe.fig-geod { height: 764px; } iframe.fig-dict4 { height: 960px; } iframe.fig-zeros { height: 829px; } iframe.fig-simplex { height: 701px; } iframe.fig-traj { height: 1122px; } iframe.fig-samples { height: 813px; } }
  @media (min-width: 700px) { iframe.fig-twolevel { height: 650px; } iframe.fig-densfield { height: 865px; } iframe.fig-ampspace { height: 1132px; } iframe.fig-learned { height: 1338px; } iframe.fig-geod { height: 555px; } iframe.fig-simplex { height: 486px; } iframe.fig-dict4 { height: 573px; } iframe.fig-samples { height: 812px; } iframe.fig-zeros { height: 594px; } iframe.fig-traj { height: 721px; } }
  @media (min-width: 748px) { iframe.fig-twolevel { height: 433px; } iframe.fig-densfield { height: 551px; } iframe.fig-ampspace { height: 697px; } iframe.fig-learned { height: 919px; } iframe.fig-geod { height: 555px; } iframe.fig-samples { height: 412px; } iframe.fig-traj { height: 703px; } iframe.fig-simplex { height: 470px; } iframe.fig-zeros { height: 594px; } iframe.fig-dict4 { height: 573px; } }
  @media (min-width: 768px) { iframe.fig-twolevel { height: 650px; } iframe.fig-densfield { height: 885px; } iframe.fig-ampspace { height: 1150px; } iframe.fig-learned { height: 1356px; } iframe.fig-geod { height: 573px; } iframe.fig-simplex { height: 701px; } iframe.fig-dict4 { height: 914px; } iframe.fig-samples { height: 813px; } iframe.fig-zeros { height: 762px; } iframe.fig-traj { height: 1030px; } }
  @media (min-width: 1000px) { iframe.fig-twolevel { height: 433px; } iframe.fig-densfield { height: 515px; } iframe.fig-ampspace { height: 644px; } iframe.fig-learned { height: 885px; } iframe.fig-geod { height: 555px; } iframe.fig-simplex { height: 470px; } iframe.fig-dict4 { height: 573px; } iframe.fig-samples { height: 412px; } iframe.fig-zeros { height: 576px; } iframe.fig-traj { height: 677px; } }
  @media (min-width: 1200px) { iframe.fig-twolevel { height: 399px; } iframe.fig-densfield { height: 497px; } iframe.fig-ampspace { height: 627px; } iframe.fig-learned { height: 762px; } iframe.fig-geod { height: 519px; } iframe.fig-simplex { height: 452px; } iframe.fig-dict4 { height: 573px; } iframe.fig-samples { height: 360px; } iframe.fig-zeros { height: 524px; } iframe.fig-traj { height: 677px; } }
---

## Flow matching is Euclidean flow matching

In most ML datasets, a data point is a vector; here a data point is a distribution: a histogram, a point cloud, a row of class probabilities, a quantum state. Flow matching can generate such data, but the Euclidean geometry (straight line and the Euclidean norm) it is built on has to be replaced. The literature offers several alternative geometries more suited to distributions: Wasserstein, the linear mixture and Fisher-Rao, each introduced in its own language. This post derives them from one recipe, on one example, and then follows the recipe once more with amplitudes in place of densities. It assumes you know flow matching; the geometry, and the few words of quantum mechanics, are explained as they come up. We start from the standard loss.

Flow matching<d-cite key="lipman2023flow"></d-cite> trains a vector field $$v_\theta$$ to transform a source distribution to a data distribution. In its standard form it draws a source point $$x_0$$, a data point $$x_1$$ and a time $$t \sim \mathrm{Unif}[0,1]$$, joins the two points by a straight line, and regresses $$v_\theta$$ onto the line's velocity:

$$
\mathcal L(\theta) = \mathbb E_{t,\,x_0,\,x_1}\, \parallel v_\theta(x_t, t) - \dot x_t \parallel^2,
$$

$$
x_t = (1-t)\,x_0 + t\,x_1, \qquad \dot x_t = x_1 - x_0 .
$$

In this loss, both the interpolant (a chord, the straight line through the ambient space) and the error (measured in the Euclidean norm) are derived from an assumption of Euclidean geometry. Riemannian flow matching<d-cite key="chen2024riemannian"></d-cite> keeps the form of the loss and replaces both on a manifold with metric $$g$$. The chord becomes the geodesic, and the Euclidean norm becomes the metric at the current point:

$$
\mathcal L(\theta) = \mathbb E_{t,\,x_0,\,x_1}\, \parallel v_\theta(x_t, t) - \dot x_t \parallel^2_{g(x_t)},
$$

$$
x_t = \exp_{x_0}\!\big(t \log_{x_0} x_1\big),
\qquad \dot x_t = \frac{\log_{x_t} x_1}{1-t}.
$$

Here $$\log_x y$$ is the initial velocity of the geodesic from $$x$$ to $$y$$, scaled so that its length is their distance, and $$\exp_x$$ walks along the geodesic with a given initial velocity. These are the exponential and logarithm maps of the manifold, not the elementwise functions (these maps, in Euclidean space, are $$\exp_x(\delta) = x + \delta$$ and $$\log_x y = y - x$$). So, the geometry enters the loss through two objects: **the interpolant** $$x_t$$ and **the norm** $$\parallel \cdot\parallel_{g}$$. Though, they are not equally important. Because $$g$$ depends only on $$x_t$$, the best $$v_\theta$$ is $$\mathbb E[\dot x_t \mid x_t]$$ whatever the norm, so the norm only reweights the regression. The interpolant decides what is learned.

## Flow matching over families of distributions

Riemannian flow matching is usually run on manifolds whose points are plain data: a sphere for locations on the Earth, a torus for the angles of a protein backbone, a mesh, or the symmetric positive-definite matrices for covariance matrices<d-cite key="chen2024riemannian"></d-cite>. In this post every data point is itself a distribution $$\mu$$: a whole density takes the place that the vector $$x_t$$ had above. The space of all densities is what information geometry calls a statistical manifold; it appears as flow matching "on statistical manifolds"<d-cite key="cheng2024statistical"></d-cite> and "over families of distributions"<d-cite key="haviv2025wasserstein"></d-cite>. We use the latter.

What $$\mu$$ looks like depends on the data. For categorical data with $$K$$ classes, $$\mu$$ is a vector of $$K$$ probabilities, the source distribution can be uniform over such vectors, and $$v_\theta$$ outputs a velocity $$\dot\mu$$ whose entries sum to zero. In Fisher and Dirichlet flow matching the data are one-hot vectors, and only the path between them passes through general distributions (statistical-manifold and Wasserstein flow matching also take data points that are themselves general distributions).

For a parametric family, such as the Gaussians, $$\mu$$ is named by its parameters. For the pictures below, $$\mu$$ is a density parameterised by $$m,w$$ as $$\mathcal N(m, w^2)$$ where each pair $$(m, w)$$ is a point of the plane in Figure 1.

So there are two levels. One level up, the flow's source and data distributions, call them $$P_0$$ and $$P_1$$, are distributions over densities: a training pair is a draw $$\mu_0 \sim P_0$$ and a draw $$\mu_1 \sim P_1$$, the interpolant is the geodesic from $$\mu_0$$ to $$\mu_1$$, and the loss averages over many such pairs. Within a pair we call $$\mu_0$$ and $$\mu_1$$ the start and end densities, or the endpoints. One level down, each density $$\mu(x)$$ is itself a distribution over positions $$x$$; this post keeps the word samples for draws $$X \sim \mu$$ at this level, and says draws for the densities $$\mu \sim P$$ one level up. Figures 2, 3, 6, 9 and 10 each show a single training pair, that is, one term of the loss; Figures 4 and 7 show the field learned from many.

<div class="l-page">
  <iframe class="fig fig-twolevel" src="{{ 'assets/html/2027-04-30-one-recipe-for-flow-matching-geometries/twolevel.html' | relative_url }}" frameborder="0" scrolling="no" height="420px" width="100%"></iframe>
</div>
<div class="caption">
<b>Figure 1.</b> Flow matching over families of distributions, drawn in the plane of Gaussians: every Gaussian $\mathcal N(m, w^2)$, of mean $m$ and width $w$, is one point, so <b>each point here is itself a distribution</b> over $x$. The contours are the densities of the source distribution $P_0$ (blue) and the data distribution $P_1$ (red) on this plane, and the points are draws $\mu_0 \sim P_0$ and $\mu_1 \sim P_1$; click one to see it as a density over $x$. Samples $X \sim \mu$ live one level down, inside each point.
</div>

A data point is a density over $$x$$: a function with $$\mu(x) \in \mathbb R_{\ge 0}$$ at every $$x$$ and $$\int \mu(x)\,dx = 1$$. A path of data points is a density $$\mu(x,t)$$ that changes with $$t$$ (also written $$\mu_t(x)$$), and its velocity at time $$t$$ is the function

$$
\dot\mu(x) = \frac{\partial \mu(x,t)}{\partial t}, \qquad \int \dot\mu(x)\,dx = 0 ,
$$

where the integral is zero because the total mass stays one. This $$\dot\mu$$ plays the role of $$\dot x_t$$ in the loss above, and a metric $$g_\mu(\dot\mu,\dot\mu)$$ is a rule that assigns this velocity a squared length, which may depend on where the path is, $$\mu$$. This squared length is the norm in the loss: the error $$v_\theta(\mu_t, t) - \dot\mu_t$$ is itself a change of density.

Existing work constructs the metric $$g$$ in two different ways. Moving mass gives the Wasserstein geometry, used by Wasserstein Flow Matching<d-cite key="haviv2025wasserstein"></d-cite>. Creating and destroying mass in place gives the geometries of simplex flow matching (the flat geometry of linear mixtures, the usual baseline, and the Fisher-Rao geometry of Fisher Flow Matching<d-cite key="davis2024fisher"></d-cite> and statistical-manifold flow matching<d-cite key="cheng2024statistical"></d-cite>).

## One recipe

So, each geometry should provide: an interpolant and a norm. Because the data points in our setting are densities, $$\mu_0$$ and $$\mu_1$$, the interpolant is a path of densities and the velocity is $$\dot\mu$$. Many paths join two densities, we want the shortest one. But "shortest" needs definition of length for every velocity: a metric $$g_\mu(\dot\mu,\dot\mu)$$. Each geometry below gets its metric and geodesic in the same four steps. The ingredients are a state, the thing that changes along the path (for now the density $$\mu$$ itself; later, an amplitude), a rule and a price. These three are choices; the lowest price and the geodesic follow from them.

**A rule.** Say how probability mass may change. A rule comes with a control $$u$$: which we are free to choose at each instant, and the only way the density can change. For transport the control is a velocity field $$U(x)$$, which says where the mass at $$x$$ moves. For birth and death it is a rate $$r(x)$$, which says how fast the mass at $$x$$ grows or shrinks. The rule is the map $$R_\mu$$ that turns a control into a velocity of the density,

$$
\dot\mu = R_\mu(u),
$$

$$
\begin{gathered}
\text{for example} \quad R_\mu(U) = -\nabla\cdot(\mu\, U) \\
\text{or} \quad R_\mu(r) = r\,\mu ,
\end{gathered}
$$

so applying $$u$$ for a short time $$\tau$$ takes $$\mu$$ to $$\tilde\mu(x) = \mu(x) + \tau\,\dot\mu(x)$$. As we are working with densities, the map should conserve total mass, $$\int\dot\mu(x)\,dx = 0$$, keep $$\tilde\mu$$ nonnegative, and be linear in $$u$$.

**A price.** Put a cost $$c_\mu(u)$$ on applying the control $$u$$ at $$\mu$$; the same change can then cost different amounts at different $$\mu$$. We require that it is quadratic in $$u$$, so that the length it defines comes from an inner product and the loss is a weighted least squares; that it charges $$u$$ and $$-u$$ alike; and that it is positive unless the control leaves the state unchanged.

**The lowest price.** Several controls may lead from $$\mu$$ to $$\tilde\mu$$. The squared length of the change is the price of the cheapest one:

$$
g_\mu(\dot\mu,\dot\mu) = \min\big\{\, c_\mu(u) \;:\; R_\mu(u) = \dot\mu \,\big\} .
$$

Note, it is possible for different controls to produce the same change at different prices: for example, transport in two or more dimensions, where many velocity fields move mass the same way. Elsewhere either the change fixes the control (birth and death) or all controls with the same effect cost the same (amplitudes), and the price sets the metric.

**Geodesics.** With a length for every velocity, the geodesic from $$\mu_0$$ to $$\mu_1$$ is the path whose total price $$\int_0^1 g_{\mu_t}(\dot\mu_t,\dot\mu_t)\,dt$$ is smallest; that smallest total is the squared distance between them. For transport this is optimal transport: the cheapest way to move one density onto another.

> Fix a rule for how probability mass may change, and a price for changing it. The metric is the lowest price of a given change. Flow matching then uses the metric's geodesics as interpolants and its norm in the loss.

**What the network outputs.** Lastly. The network can output the change $$\dot\mu$$, and the loss is the metric's norm of its error. Or it can output the control $$u$$, and the loss is the price of its error, $$c_{\mu_t}(u_\theta - u_t)$$, where $$u_t$$ is the cheapest control along the geodesic. The two have the same minimiser, but they are not equally easy to compute. For transport, comparing two velocity fields is a weighted least squares, while comparing two changes of density means solving an equation for a potential first.

None of these geometries is new, nor their derivation from state, rule and price. We add a single frame to view it all: the geometries of flow matching on distributions side by side, derived the same way on one example, then the recipe followed once more with amplitudes. Table 2, near the end, collects the four results.

## Three geodesics between two Gaussians

Take two Gaussian densities, $$\mu_0$$ and $$\mu_1$$, each a point $$(m, w)$$ of the plane of Figure 1. For three different geometries, we visualise the geodesic from $$\mu_0$$ to $$\mu_1$$, one training pair:

<div class="l-page">
  <iframe class="fig fig-geod" src="{{ 'assets/html/2027-04-30-one-recipe-for-flow-matching-geometries/geodesics.html' | relative_url }}" frameborder="0" scrolling="no" height="560px" width="100%"></iframe>
</div>
<div class="caption">
<b>Figure 2.</b> Geodesics between two Gaussians in three geometries. Left: every Gaussian $\mathcal N(m, w^2)$, of mean $m$ and width $w$, is one point of the plane; drag $\mu_0$ and $\mu_1$, and the markers show $\mu_t$ at the current $t$. Right: the whole path of each geometry as a density over $x$, from $\mu_0$ (top) to $\mu_1$ (bottom), with time running down. The next three sections take the columns in turn; drag the endpoints closer together to see the third bump of the Fisher-Rao path.
</div>

## Transport gives Wasserstein

**Rule.** Mass moves with a velocity field $$U(x,t)$$ and is conserved locally (for $$x \in \mathbb R^n$$; $$\nabla\cdot$$ is the divergence, the net outflow, and $$\nabla$$ the gradient):

$$
\frac{\partial \mu(x,t)}{\partial t} + \nabla\cdot\big(\mu(x,t)\,U(x,t)\big) = 0 .
$$

This is the continuity (transport) equation, the same equation that links the probability path of any flow matching model to its vector field. Here it acts one level down, inside a single data point: $$U(x,t)$$ says where the mass of that one density moves.

**Lowest price.** Here, unlike for the other rules, several controls produce the same change, so the cheapest one has to be found. Adding to $$U(x)$$ any field $$\eta(x)$$ with $$\nabla\cdot\big(\mu(x)\,\eta(x)\big) = 0$$, a flow that circulates without piling up mass anywhere, moves the mass differently but leaves the change of density $$\dot\mu(x)$$ the same. Charge kinetic energy, $$\int \parallel U(x)\parallel^2\,\mu(x)\,dx$$, the squared speed of the mass averaged over where the mass is. A circulating part is orthogonal to a gradient field under this price, so it only adds energy and moves nothing; the cheapest field has none, and is a gradient, $$U(x) = \nabla\xi(x)$$. The potential $$\xi(x)$$ is an ordinary function of $$x$$, fixed by $$\mu$$ and $$\dot\mu$$ through the second equation below. The price is Otto's metric<d-cite key="otto2001"></d-cite>

$$
g^{W}_\mu(\dot\mu,\dot\mu) = \int \parallel\nabla\xi(x)\parallel^2\,\mu(x)\,dx,
$$

$$
-\nabla\cdot\big(\mu(x)\,\nabla\xi(x)\big) = \dot\mu(x).
$$

**Geodesics.** With this metric, the length of the shortest path is the 2-Wasserstein distance $$W_2(\mu_0,\mu_1)$$. Along it every particle moves in a straight line at constant speed (displacement interpolation). This is the interpolant in the loss. It is closed form in one dimension, where it interpolates the quantile functions. Wasserstein Flow Matching uses the closed form between Gaussians and entropic estimates between point clouds<d-cite key="haviv2025wasserstein"></d-cite>.

**Between two Gaussians.** The Wasserstein path between two Gaussians stays Gaussian. It is McCann's displacement interpolation: on the line the optimal map between two Gaussians is affine, so every particle moves in a straight line, and the mean and the width both change linearly in time. In the plane of Figure 2 the path is the straight segment between the endpoints, and over $$x$$ the bump slides and stretches without changing shape.

## Birth and death give the mixture

**Rule.** Mass may not move. It may only appear or disappear (aka creation and annihilation) in place, at a rate $$r(x,t)$$:

$$
\frac{\partial \mu(x,t)}{\partial t} = r(x,t)\,\mu(x,t),
$$

$$
\int r(x,t)\,\mu(x,t)\,dx = 0 ,
$$

where the zero-mean condition keeps the total mass at one. Unlike transport, there is no cheapest control to find: the change fixes the rate, $$r(x) = \dot\mu(x)/\mu(x)$$, so the price alone sets the metric.

**Flat price.** Charge the change itself, $$\int \big(r(x)\,\mu(x)\big)^2\,dx$$. The metric is

$$
g^{L^2}_\mu(\dot\mu,\dot\mu) = \int \dot\mu(x)^2\, dx ,
$$

the same at every $$\mu$$, so the geometry is flat.

**Geodesics.** Straight lines, $$\mu_t(x) = (1-t)\,\mu_0(x) + t\,\mu_1(x)$$, the mixture path. A mixture of densities is a density, so the path never leaves the simplex. In the loss, this is Euclidean flow matching on the probability vector: the interpolant is linear, the regression target is $$\mu_1 - \mu_0$$ at every $$t$$, and the norm is Euclidean. It is the linear baseline that Dirichlet Flow Matching<d-cite key="stark2024dirichlet"></d-cite> and statistical-manifold flow matching<d-cite key="cheng2024statistical"></d-cite> compare against.

**Between two Gaussians.** The mixture path leaves the Gaussians at once: $$(1-t)\,\mu_0(x) + t\,\mu_1(x)$$ is a mixture of the two endpoints, which stay where they are while their weights trade off. One bump fades as the other grows, and in between the density has two bumps.

## Fisher's price gives Fisher-Rao

**Same rule, other price.** Keep birth and death, and charge the rate instead of the change: the variance of the rate, $$\int r(x)^2\,\mu(x)\,dx$$. This gives the Fisher-Rao metric<d-cite key="amari2016information"></d-cite>,

$$
g^{FR}_\mu(\dot\mu,\dot\mu) = \int \frac{\dot\mu(x)^2}{\mu(x)}\, dx .
$$

Compared with the flat price it divides by $$\mu$$, so changing mass that is nearly zero is expensive. It is also the curvature of the KL divergence: for a small step, $$\mathrm{KL}\big(\mu \,\|\, \mu + \tau\dot\mu\big) = \tfrac12\tau^2\, g^{FR}_\mu(\dot\mu,\dot\mu) + O(\tau^3)$$. Up to scale, it is the only metric that is unchanged when a category is split into sub-categories in fixed proportions, which is Chentsov's theorem<d-cite key="amari2016information"></d-cite>. For densities on a closed space of two or more dimensions it is also the only one unchanged by any smooth relabelling of $$x$$<d-cite key="bauer2016uniqueness"></d-cite>; our pictures, on a line, fall outside that result.

**The square root.** In the coordinates $$s(x) = \sqrt{\mu(x)}$$ the velocity is $$\dot s(x) = \dot\mu(x)/\big(2\sqrt{\mu(x)}\big)$$, so

$$
g^{FR}_\mu(\dot\mu,\dot\mu) = 4\int \dot s(x)^2\,dx .
$$

Since $$\int s(x)^2\,dx = \int\mu(x)\,dx = 1$$, the square roots lie on the unit sphere, and Fisher-Rao is four times its round metric: densities fill the sphere's nonnegative part. This is why Fisher Flow Matching and statistical-manifold flow matching replace $$\mu$$ by $$\sqrt\mu$$ before anything else. The mixture is flat in $$\mu$$; Fisher-Rao is round in $$\sqrt\mu$$.

**Geodesics.** Great circles on that sphere: the interpolant in the loss is the spherical interpolation (slerp) of $$\sqrt{\mu_0}$$ and $$\sqrt{\mu_1}$$ through the angle $$\Omega$$ between them,

$$
\sqrt{\mu_t(x)} = a_t\sqrt{\mu_0(x)} + b_t\sqrt{\mu_1(x)},
$$

$$
a_t = \frac{\sin((1-t)\Omega)}{\sin\Omega},\qquad b_t = \frac{\sin(t\Omega)}{\sin\Omega}.
$$

Its cosine is the overlap of the two square roots, $$\cos\Omega = \mathrm{BC}(\mu_0,\mu_1) = \int\sqrt{\mu_0(x)\,\mu_1(x)}\,dx$$, known as the Bhattacharyya coefficient: it is $$1$$ when the densities are equal and $$0$$ when they do not overlap. The distance is $$d_{FR}(\mu_0,\mu_1) = 2\Omega$$, twice the angle because of the factor 4 in the metric. Because small masses are expensive, the path slows down near the edges of the simplex.

**Between two Gaussians.** The Fisher-Rao path is also a mixture (of three Gaussians). Squaring the slerp gives $$a_t^2\,\mu_0(x) + b_t^2\,\mu_1(x) + 2a_tb_t\sqrt{\mu_0(x)\,\mu_1(x)}$$, and between two Gaussians $$\sqrt{\mu_0(x)\,\mu_1(x)}$$ is itself proportional to a Gaussian $$\nu(x)$$ lying between them, with weight at most $$\mathrm{BC}(\mu_0,\mu_1)$$. While the endpoints overlap, the path grows a third bump in the middle; when they are far apart the overlap is small and the path is close to the mixture's cross-fade. (This is the Fisher-Rao geodesic in the space of all densities, which is free to leave the Gaussians. Restricted to the Gaussian family, the same metric is the hyperbolic half-plane of information geometry, whose geodesics stay Gaussian; that is a different path.)

<div class="l-page">
  <iframe class="fig fig-simplex" src="{{ 'assets/html/2027-04-30-one-recipe-for-flow-matching-geometries/simplex.html' | relative_url }}" frameborder="0" scrolling="no" height="540px" width="100%"></iframe>
</div>
<div class="caption">
<b>Figure 3.</b> Distributions on three categories, with probabilities $p_1, p_2, p_3$. Left: the simplex is a triangle, and the mixture path is a straight line. Right: after the square-root map, each distribution is the point $(\sqrt{p_1}, \sqrt{p_2}, \sqrt{p_3})$, whose squared coordinates sum to one, so it lies on the unit sphere; the coordinates are nonnegative, so the distributions fill the part of the sphere with all three coordinates positive, one eighth of it, seen here from the direction <span style="white-space: nowrap">$(1,1,1)$.</span> The Fisher-Rao path is a great circle. Each path is straight in its own coordinates and curved in the other's. Drag the endpoints. The unit balls show the price of a step. Under the flat price they are equal circles in $\mu$. Under Fisher-Rao they shrink and flatten towards the edges, where changing a small mass is expensive, and on the sphere they become equal round discs, foreshortened near the rim by the viewing angle. Each edge of the triangle is the two-category simplex.
</div>

**Same reach, different price.** Each rule can make any change to a density, as long as the total mass stays one and the density is nowhere zero. Birth and death make it with the rate $$r(x) = \dot\mu(x)/\mu(x)$$; transport makes it with the gradient field of the Wasserstein section. So no rule limits where a path can go: each can take any positive density to any other. The rules and prices differ only in how a change is paid for, and therefore in which path is cheapest. The mixture and Fisher-Rao make the point most sharply: one rule, two prices, two geometries.

**What flow matching learns.** Flow matching learns a field $$v_\theta(\mu, t)$$ over all densities, and the loss is minimised when, at each density $$\mu$$ and time $$t$$, $$v_\theta$$ is the average velocity of the training pairs whose geodesics pass through $$\mu$$ at $$t$$. Which pairs are drawn is a choice of the method (aka coupling); here they are matched by optimal transport, each geometry using its own distance as the cost. To draw this field we need a space that every geodesic stays in. Densities built from a few bumps are one. Fix $$K$$ bump densities $$b_1(x), \dots, b_K(x)$$ that do not overlap, and take every mixture of them, $$\mu(x) = p_1 b_1(x) + \dots + p_K b_K(x)$$, with weights $$p_i \ge 0$$ that sum to one. Each such density is a point $$(p_1, \dots, p_K)$$ of the probability simplex, a triangle for $$K = 3$$ as in Figure 3, and both the mixture and the Fisher-Rao geodesics between two of them stay in it: the mixture's because a mixture of mixtures is a mixture, and Fisher-Rao's because, with no overlap, $$\sqrt{\mu(x)} = \sqrt{p_1}\, \sqrt{b_1(x)} + \dots + \sqrt{p_K}\, \sqrt{b_K(x)}$$ is built from the same bumps. Wasserstein's do not, because they move mass between the bumps, through densities that are not built from them.

<div class="l-page">
  <iframe class="fig fig-densfield" src="{{ 'assets/html/2027-04-30-one-recipe-for-flow-matching-geometries/densfield.html' | relative_url }}" frameborder="0" scrolling="no" height="640px" width="100%"></iframe>
</div>
<div class="caption">
<b>Figure 4.</b> The field that flow matching learns on densities (densities built as a mixture of three bumps that do not overlap), where each density is a point of the triangle; click a corner to see one of the basis bumps. The source distribution $P_0$ holds densities with most of their weight on the first bump; the data distribution $P_1$ has two clusters. Pairs are matched by minibatch optimal transport, with the chosen geometry's own squared distance as the cost, and joined by its geodesics; the arrows are the average velocity of the pairs passing through each density at time $t$, the minimiser of the loss, which $v_\theta$ approximates. A set of draws from $P_0$ (blue) is pushed forward by the field: each line joins a point's start to where it is at time $t$, and at $t = 1$ the end points are generated draws from $P_1$. The field carries each one where the velocity field leads, and only the set as a whole matches $P_1$. The mixture field moves weight along straight lines; the Fisher-Rao field bends, because it charges more for changing small weights. On the right, the followed point as a density over $x$.
</div>

## An amplitude gives Fubini-Study

So far the state in the recipe has been the density itself. A density is nonnegative, so all three geometries live in the nonnegative orthant of the square-root sphere. An amplitude $$\psi(x)$$, a signed or complex function, can also represent a density, through the Born rule $$\mu(x) = \lvert\psi(x)\rvert^2$$, and many amplitudes give the same one. Some data are amplitudes in their own right: a short-time Fourier transform frame, an MRI measurement or an eigenfunction that changes sign, where the sign or phase carries information. So substitute the amplitude for the density as the state, and follow the recipe again. The geometry it gives, Fubini-Study, is already in use: flow matching for quantum states builds phase-aligned paths between rays in it, and reports frequent, often large, gains over flow matching on the flat real and imaginary parts<d-cite key="xu2026intrinsic"></d-cite>.

We follow the same recipe as before: the state (an amplitude, and where its phase can matter), the rule, the price and the geodesics. Then we apply the geodesic to the example of two Gaussians. Last, we build a space of amplitudes from a few basis states, as Figure 4 built densities from bumps, so that flows can be drawn.

<details>
<summary><b>The complex/quantum words used below, for ML readers</b></summary>
<ul>
<li><b>Complex numbers.</b> $i$ is the imaginary unit, $i^2 = -1$. A complex number $z = a + ib$ is a point $(a, b)$ of the plane. Written as $z = \lvert z\rvert\, e^{i\theta}$ it is a length $\lvert z\rvert$ and an angle $\theta$, its <b>phase</b>; here $e$ is the exponential, and $e^{i\theta} = \cos\theta + i\sin\theta$ is the point at angle $\theta$ on the unit circle. Multiplying by $e^{i\alpha}$ turns $z$ by the angle $\alpha$ and leaves its length alone. The conjugate $\bar z = a - ib$ is its mirror image, and $\bar z z = \lvert z\rvert^2$.</li>
<li><b>Amplitude</b> $\psi(x)$: a function with a complex value at each $x$, normalised so that $\int \lvert\psi(x)\rvert^2 dx = 1$. Its density is $\mu(x) = \lvert\psi(x)\rvert^2$, the Born rule: keep the length at each $x$, square it, and forget the phase.</li>
<li><b>Inner product</b> $\langle\psi,\phi\rangle = \int \overline{\psi(x)}\,\phi(x)\,dx$: the dot product of two functions, with a conjugate so that $\langle\psi,\psi\rangle = 1$. It is a complex number; its size says how much the two amplitudes overlap.</li>
<li><b>Global phase</b>: multiplying all of $\psi(x)$ by one constant $e^{i\alpha}$, which turns the value at every $x$ by the same angle. It changes neither the density nor anything used below.</li>
<li><b>Ray</b>: an amplitude with its global phase ignored, that is, the set of all $e^{i\alpha}\psi(x)$.</li>
<li><b>Self-adjoint operator</b> $H$: a linear map from functions to functions, which for functions on a grid is a matrix, with $\langle\psi, H\phi\rangle = \langle H\psi, \phi\rangle$ for all $\psi, \phi$. It is the complex version of a symmetric matrix, and like one it has real eigenvalues. The simplest example multiplies by a real function, $(H\psi)(x) = V(x)\,\psi(x)$.</li>
<li><b>Hamiltonian</b>: a self-adjoint $H$ used to move an amplitude, $\frac{\partial \psi(x,t)}{\partial t} = -iH\psi(x,t)$. The factor $-i$ turns each change into a rotation, so the norm stays one; with $H = V(x)$ the value at each $x$ just turns at the rate $V(x)$. Here $H$ is only a control, like $U$ and $r$ above; no physics is assumed.</li>
<li><b>Fidelity</b> $F(\psi_0,\psi_1) = \lvert\langle\psi_0, \psi_1\rangle\rvert$: the overlap of two rays, the size of their inner product, whatever global phases they carry; the analogue of BC.</li>
</ul>
</details>

**State.** A complex amplitude, a function with $$\psi(x) \in \mathbb C$$ at every $$x$$, with density $$\mu(x) = \lvert\psi(x)\rvert^2$$. Since the density integrates to one, the amplitude is normalised, $$\int\lvert\psi(x)\rvert^2\,dx = 1$$. On a grid of $$d$$ points that is the unit sphere of $$\mathbb C^d$$, as $$\sqrt{\mu}$$ lay on the (positive orthant of the) unit sphere of $$\mathbb R^d$$ for Fisher-Rao. Every density can be represented (via $$\psi(x) = \sqrt{\mu(x)}$$), but many amplitudes give the same density: for example $$e^{i\chi(x)}\psi(x)$$ gives the same density, for any real function $$\chi(x)$$, which is a change of the phase at each point. A constant phase, $$e^{i\alpha}\psi(x)$$, changes nothing used below, so the state is the amplitude up to this global phase, called a ray and written $$[\psi]$$. The rays of $$\mathbb C^d$$ form the complex projective space $$\mathbb{CP}^{d-1}$$: the unit sphere with each circle $$e^{i\alpha}\psi$$ counted as one point.

**Where the phase enters.** Write the amplitude using polar coordinates, $$\psi(x) = \sqrt{\mu(x)}\, e^{i\varphi(x)}$$, with a phase $$\varphi(x)$$ at every point. On its own a phase never changes the density: $$\lvert\psi(x)\rvert^2 = \mu(x)$$ whatever $$\varphi(x)$$ is. The density of a sum is not the sum of the densities:

$$
\begin{gathered}
\lvert\psi_a(x) + \psi_b(x)\rvert^2 = \mu_a(x) + \mu_b(x) \\
+\; 2\sqrt{\mu_a(x)\,\mu_b(x)}\,\cos\big(\varphi_a(x) - \varphi_b(x)\big) .
\end{gathered}
$$

The last term is the only place a phase can show. It is nonzero only where the two amplitudes overlap, and it depends on the difference of their phases there. The fringes and the zeros in the figures below all come from this one term.

**Rule.** Conservation of mass becomes conservation of the norm, $$\int\lvert\psi(x,t)\rvert^2\,dx = 1$$. As before we ask for a linear rule, $$\frac{\partial \psi(x,t)}{\partial t} = A\psi(x,t)$$ for some linear operator $$A$$, and find which $$A$$ keep the norm. Write the norm with the inner product $$\langle\psi,\phi\rangle = \int \overline{\psi(x)}\,\phi(x)\,dx$$, where the bar is complex conjugation, as $$\parallel\psi\parallel^2 = \langle\psi,\psi\rangle$$. For the norm to stay one, its rate of change must be zero:

$$
\begin{aligned}
\frac{d}{dt}\langle\psi,\psi\rangle &= \langle A\psi,\psi\rangle + \langle\psi,A\psi\rangle \\
&= \langle\psi,(A^\dagger + A)\,\psi\rangle = 0,
\end{aligned}
$$

where $$A^\dagger$$ is the adjoint of $$A$$, for a matrix its conjugate transpose. This holds for every $$\psi$$ exactly when $$A^\dagger = -A$$. For real vectors these are the antisymmetric matrices, which generate rotations: the motions that keep length. Any such $$A$$ can be written $$A = -iH$$ with $$H^\dagger = H$$, that is, with $$H$$ self-adjoint, the complex analogue of a symmetric matrix. So the rule is

$$
\frac{\partial \psi(x,t)}{\partial t} = -iH\psi(x,t),
$$

with $$H$$ self-adjoint, and $$H$$ is the control. This is the Schrödinger equation, but nothing about physics went in: it is the general linear rule that preserves the norm.

**Price.** As Fisher-Rao charges the variance of the rate, charge the variance of $$H$$ in the state $$\psi(x)$$, the energy variance

$$
\mathrm{Var}_\psi(H) = \parallel H\psi\parallel^2 - \langle\psi,H\psi\rangle^2 ,
$$

where $$\langle\psi,H\psi\rangle$$ is real because $$H$$ is self-adjoint. A constant $$H$$ only turns the global phase and costs nothing, which is why the state is the ray. Many $$H$$ produce the same change, since only $$H\psi(x)$$ matters, but they all cost the same, so the lowest price needs no minimising: with $$\dot\psi(x) = -iH\psi(x)$$ it is the **Fubini-Study metric**<d-cite key="bengtsson2017geometry"></d-cite> on the velocity $$\dot\psi(x) = \partial\psi(x,t)/\partial t$$,

$$
g^{FS}_\psi(\dot\psi,\dot\psi) = \parallel\dot\psi\parallel^2 - \lvert\langle\psi,\dot\psi\rangle\rvert^2 ,
$$

the length of a motion once the part that only rotates the global phase is removed. Fisher-Rao charges the variance of the growth rate; Fubini-Study charges the variance of the energy.

**Geodesics.** The overlap of two rays is the **fidelity**,

$$
\begin{aligned}
F(\psi_0,\psi_1) &= \lvert\langle\psi_0,\psi_1\rangle\rvert \\
&= \Big\lvert \int \overline{\psi_0(x)}\,\psi_1(x)\,dx \Big\rvert \\
&= \max_\alpha\, \mathrm{Re}\,\langle\psi_0, e^{i\alpha}\psi_1\rangle ,
\end{aligned}
$$

the inner product after the best global phase alignment. Multiplying $$\psi_1(x)$$ by $$e^{i\alpha}$$ turns the complex number $$\langle\psi_0,\psi_1\rangle$$ about the origin; turned onto the positive real axis, it equals $$F(\psi_0,\psi_1)$$. Only one constant phase is aligned: aligning every point separately would give $$\int\lvert\psi_0(x)\rvert\,\lvert\psi_1(x)\rvert\,dx = \mathrm{BC}(\mu_0,\mu_1)$$, so $$F(\psi_0,\psi_1) \le \mathrm{BC}(\mu_0,\mu_1)$$. Take $$\psi_1(x)$$ with this aligned phase. The geodesic is the same slerp as for Fisher-Rao, now applied to the amplitudes,

$$
\psi_t(x) = a_t\,\psi_0(x) + b_t\,\psi_1(x),
$$

with $$a_t, b_t$$ as for Fisher-Rao, where $$\Omega$$ is now the angle between the amplitudes, $$\cos\Omega = F(\psi_0,\psi_1)$$, and distance $$d_{FS}(\psi_0,\psi_1) = \Omega$$. (By convention this is half the Fisher-Rao value, so compare $$d_{FS}$$ with $$\tfrac12 d_{FR}$$.)

**Between two Gaussians.** If both endpoints are Gaussian amplitudes with no phase, $$\psi_0(x) = \sqrt{\mu_0(x)}$$ and $$\psi_1(x) = \sqrt{\mu_1(x)}$$, the path is again a mixture of three Gaussians. Now give the end a phase within it, for example the winding $$e^{ikx}$$ of a wave packet. Its density is unchanged, but the cross term between the two bumps now oscillates in $$x$$, so where they overlap the path carries fringes that neither endpoint has (the interference term below, and Figure 6).

**A space of amplitudes.** To draw a learned flow, as in Figure 4, we need a space of amplitudes small enough to see. Build it as Figure 4 built densities from bumps, from $$K$$ fixed functions $$f_1(x), \dots, f_K(x)$$, the basis states. Take them orthonormal, $$\int \overline{f_i(x)}\, f_j(x)\, dx = 1$$ when $$i = j$$ and $$0$$ otherwise (any $$K$$ independent amplitudes can be made so by Gram-Schmidt), and take every combination $$\psi(x) = c_1 f_1(x) + \dots + c_K f_K(x)$$ with complex coefficients $$c_i$$. Orthonormality makes the norm $$\lvert c_1\rvert^2 + \dots + \lvert c_K\rvert^2$$, which must be one, and the global phase is dropped as before. The space of all of them needs more than a triangle; it can be drawn in two parts: the weights $$\lvert c_i\rvert^2$$, a point of the same triangle, and the $$K-1$$ relative phases, a point of a torus. When the basis states do not overlap, the weights are the density and the phases are invisible to samples; when they overlap, the phases also shape the density, through interference. At an edge of the triangle one coefficient is zero and its phase is undefined, so the torus collapses there. A nonnegative path that reaches an edge must stop; a signed path can cross it, the coefficient passing through zero as its phase jumps by $$\pi$$. For $$K = 2$$ the triangle is a segment and the torus a circle, and the two together make a sphere, the Bloch sphere of quantum mechanics. For $$K = 3$$ they are a triangle and a square (Figure 5).

**Phases in a basis.** A combination of basis states is a sum of parts, so a phase can sit in two places. Take two parts, $$\psi(x) = c_1 f_1(x) + c_2 f_2(x)$$: a phase between the parts sits in the coefficients $$c_1$$ and $$c_2$$, and a phase within them sits in the functions $$f_1(x)$$ and $$f_2(x)$$. Table 1 sets out the four cases. With real parts, such as square roots of densities, complex coefficients give an amplitude over densities; with complex parts they give an amplitude over amplitudes. With $$K$$ basis states the coefficients are the $$c_i$$ and the parts are the states $$f_i(x)$$.

<div class="table-scroll l-page" markdown="1">

| $$\psi(x) = c_1 f_1(x) + c_2 f_2(x)$$ | **$$c_1, c_2$$ real** | **$$c_1, c_2$$ complex** |
|---|---|---|
| **$$f_1, f_2$$ real functions** | no phase beyond signs | a phase between the parts: an amplitude over densities |
| **$$f_1, f_2$$ complex functions** | a phase within each part | phases within and between: an amplitude over amplitudes |

</div>
<div class="caption">
<b>Table 1.</b> Where the phase of a sum of two parts can sit. In Figure 7, the basis control chooses the row (basis b: real, nonnegative states; basis f: complex states) and the phases control the column.
</div>

<div class="l-page">
  <iframe class="fig fig-ampspace" src="{{ 'assets/html/2027-04-30-one-recipe-for-flow-matching-geometries/learned.html' | relative_url }}?mode=space" frameborder="0" scrolling="no" height="720px" width="100%"></iframe>
</div>
<div class="caption">
<b>Figure 5.</b> The space of all amplitudes $\psi(x) = c_1 f_1(x) + c_2 f_2(x) + c_3 f_3(x)$ built from three basis states: the start, the wave packet and the signed state of Figure 6, made orthonormal; click a corner to see one. A point of the triangle (the weights) and a point of the square (the phases between the states) together are one amplitude; the triangle alone is the space of Figure 4. The source distribution $P_0$ and the data distribution $P_1$ are distributions over this space; click a draw to see it as an amplitude and as a density. Because these basis states overlap, draws with the same weights but different phases have different densities.
</div>

## Interference

Since a Fubini-Study geodesic only ever mixes its two endpoints, every state along the geodesic lies in the endpoints' span. Squaring the Fubini-Study geodesic $$\psi_t(x) = a_t\,\psi_0(x) + b_t\,\psi_1(x)$$ gives its density:

$$
\begin{aligned}
\mu_t(x) &= a_t^2\,\mu_0(x) + b_t^2\,\mu_1(x) \\
&\quad + 2a_t b_t\,\mathrm{Re}\big(\overline{\psi_0(x)}\,\psi_1(x)\big),
\end{aligned}
$$

where $$a_t, b_t$$ are the slerp coefficients above. The first two terms are the Fisher-Rao cross-fade. The third is an interference term. At each $$x$$, $$\psi_t(x)$$ is the sum of two complex numbers, $$a_t\psi_0(x)$$ and $$b_t\psi_1(x)$$, and the interference term is the law of cosines: where the two point the same way the density grows, where they point in opposite directions it shrinks, and where they cancel it vanishes. If the difference between the two phases changes as $$x$$ moves across the overlap, the two alternate between agreeing and opposing, and the density alternates between bright and dark bands. These are fringes (Figure 6, where the end's phase $$kx$$ grows with $$x$$ and the start has none). It needs the endpoints to overlap: where either one is zero the term is zero, so amplitudes that are orthogonal because they do not overlap never interfere, whatever their phases, while amplitudes that overlap and are still orthogonal can.

The fringes are made by cancellation, not by moving mass: they come from the relative phase between the overlapping parts, which Wasserstein and Fisher-Rao cannot see and Fubini-Study charges for.

<div class="l-page">
  <iframe class="fig fig-traj" src="{{ 'assets/html/2027-04-30-one-recipe-for-flow-matching-geometries/trajectories.html' | relative_url }}?target=packet&d=1.4&k=6" frameborder="0" scrolling="no" height="560px" width="100%"></iframe>
</div>
<div class="caption">
<b>Figure 6.</b> The Fubini-Study geodesic from a Gaussian start (top) to an end you choose (bottom), with time running down. The choices for ends are; a Gaussian, a wave packet and a signed state; here the wave packet at a separation $d = 2w$, twice the width $w$ of each bump, and $k = 6$, whose phase within it, $e^{ikx}$, varies across the overlap and makes fringes that neither endpoint has. With the signed state, whose sign flips within it, a zero comes in from the right tail and settles between the two lobes of the end. Left: the density $\mu(x,t)$, with colour for $\sqrt{\mu(x,t)}$, the density's height on a square-root scale. Right: the amplitude $\psi(x,t)$, with hue for its phase (the colour wheel), faded where $\lvert\psi(x,t)\rvert$ is small; the endpoint strips show $\lvert\psi_0(x)\rvert$ and $\lvert\psi_1(x)\rvert$ as bars in the same hues. Move $t$, or press play, to read one time off both panels: the line carries the density on the left and, on the right, the real and imaginary parts of the amplitude inside its envelope $\lvert\psi(x,t)\rvert$.
</div>

## Fisher-Rao inside Fubini-Study

Rewrite the amplitude in polar form, $$\psi(x) = \sqrt{\mu(x)}\, e^{i\varphi(x)}$$, and the Fubini-Study metric splits into a part that changes the density and a part that changes only the phase<d-cite key="khesin2019madelung"></d-cite>. Differentiating the polar form in time, the velocity of the amplitude is the amplitude times a complex rate, whose real part changes the density and whose imaginary part changes the phase:

$$
\dot\psi(x) = \Big(\frac{\dot\mu(x)}{2\mu(x)} + i\,\dot\varphi(x)\Big)\,\psi(x) .
$$

The Fubini-Study metric charges each separately. The real part costs its mean square over $$\mu$$, which is a quarter of Fisher-Rao. The imaginary part costs the variance of $$\dot\varphi(x)$$ when $$x$$ is drawn from $$\mu$$; it is a variance because turning every phase at the same rate only changes the global phase, which is free. Together,

$$
g^{FS}_\psi(\dot\psi,\dot\psi) = \tfrac14\, g^{FR}_\mu(\dot\mu,\dot\mu) + \mathrm{Var}_\mu(\dot\varphi) .
$$

In the top-left corner of Table 1, with every part and coefficient nonnegative, there is no phase to change, the second term is zero, and Fubini-Study is Fisher-Rao: Fisher-Rao sits inside Fubini-Study as its no-phase corner.

Figure 6 shows the first term at work. Look at the density panel: the start bump does not move towards the end. It fades where it stands, and the end bump grows where it stands. That is the birth-and-death dynamics, the rule of Fisher-Rao. With the signed end, a zero appears between the two lobes without any mass moving out of its way: the two amplitudes cancel there.

- **In the no-phase corner the two flows coincide.** For $$\psi_0(x) = \sqrt{\mu_0(x)}$$ and $$\psi_1(x) = \sqrt{\mu_1(x)}$$ the great circle stays nonnegative, so the Fubini-Study geodesic is the Fisher-Rao geodesic, and the sphere used by Fisher Flow Matching is the nonnegative part of this one. Figure 7, with basis b and no phases, shows it for a whole learned flow.
- **Real coefficients on other parts give Fisher-Rao on the weights.** With orthonormal parts that carry phases of their own and nonnegative coefficients, the geodesic again never leaves the nonnegative coefficients, so it is Fisher-Rao on the weights $$\lvert c_i\rvert^2$$; but where the parts overlap the weights are not the density (Figure 7, basis f and no phases).
- **Any phase only adds distance.** Since $$F(\psi_0,\psi_1) \le \mathrm{BC}(\mu_0,\mu_1)$$, with equality when the relative phase is constant where both amplitudes are nonzero, $$d_{FS}(\psi_0,\psi_1) \ge \tfrac12\, d_{FR}(\mu_0,\mu_1)$$.

**What flow matching learns, for amplitudes.** Figure 6 shows one pair. The field that flow matching learns lives on the space of all amplitudes, and on the space of Figure 5 it can be drawn in the same way as for densities, next to Fisher-Rao on the weights.

<div class="l-page">
  <iframe class="fig fig-learned" src="{{ 'assets/html/2027-04-30-one-recipe-for-flow-matching-geometries/learned.html' | relative_url }}?mode=field" frameborder="0" scrolling="no" height="560px" width="100%"></iframe>
</div>
<div class="caption">
<b>Figure 7.</b> The field that flow matching learns on the amplitudes of Figure 5. Pairs are matched by minibatch optimal transport under the Fubini-Study distance and joined by Fubini-Study geodesics; the field is the average velocity of the pairs passing through each state at time $t$, the minimiser of the loss, which $v_\theta$ approximates. A set of draws from $P_0$ (blue) is pushed forward by it, moving through both panels at once, the square holding the phases between the basis states: each line joins a point's start to where it is at time $t$, and at $t = 1$ the end points are generated draws from $P_1$. With “compare” ticked, the same set is also pushed forward by Fisher-Rao on the weights alone (orange), with pairs matched under the Fisher-Rao distance; it cannot move in the square. The two controls pick a cell of Table 1:
<ul>
<li><b>basis b, no phases</b>: every coefficient and every state is nonnegative and the weights are the density. The two generated sets coincide exactly: this is Fisher-Rao on these densities, as in Figure 4, and Fisher-Rao is Fubini-Study restricted to nonnegative amplitudes.</li>
<li><b>basis f, no phases</b>: the coefficients are nonnegative, so the two sets still coincide in the triangle, but the states overlap and carry phases of their own, so the weights are not the density.</li>
<li><b>basis b, phases</b>: the bumps do not overlap, so the phases are invisible in the density, yet they change the Fubini-Study route through the triangle; the Fisher-Rao set keeps the phases it started with.</li>
<li><b>basis f, phases</b> (the default): phases in both places. The routes differ, the Fisher-Rao set never reaches $P_1$, and the densities at $t = 1$ (bottom right) differ even where the weights agree, because different phases interfere differently.</li>
</ul>
On the right, the followed point over $x$.
</div>

Figure 7 makes the containment concrete. With the bumps of Figure 4 as the basis and the phases switched off, every part and every coefficient is nonnegative, the no-phase corner of Table 1, and the Fubini-Study and Fisher-Rao generated sets coincide exactly. Every other setting separates them.

## The phase is invisible to samples

In practice a data point $$\mu$$ is often known only through samples drawn from it. Suppose they are samples from $$\mu(x) = \lvert\psi(x)\rvert^2$$. Their distribution depends on $$\mu$$ alone, so **every statistic computed from them is unchanged by any phase** $$e^{i\chi(x)}$$. This covers likelihoods, MMD, sliced Wasserstein distances and classifier-based scores. A flow that also carries a phase can fit such data exactly as well as a flow on $$\mu$$.

The phase can be measured, but not from samples of $$x$$ alone. The Fourier transform of the amplitude, $$\hat\psi(q) = (2\pi)^{-1/2}\int\psi(x)\,e^{-iqx}\,dx$$, gives a second density, $$\lvert\hat\psi(q)\rvert^2$$, over the Fourier variable $$q$$, which physicists call momentum. A phase does change this one: $$e^{ikx}$$ leaves the density over $$x$$ alone but shifts the density over $$q$$ by $$k$$. So data that hold samples of both kinds can see the phase. This is how quantum state tomography recovers a state, from measurements of several kinds. It is also why recovering a signal from the magnitude of a single Fourier transform is ill-posed, while overlapping short-time transforms usually pin it down.

<div class="l-page">
  <iframe class="fig fig-samples" src="{{ 'assets/html/2027-04-30-one-recipe-for-flow-matching-geometries/samples.html' | relative_url }}" frameborder="0" scrolling="no" height="740px" width="100%"></iframe>
</div>
<div class="caption">
<b>Figure 8.</b> Samples from a Gaussian amplitude with a phase $\chi$ within it, against samples from the same Gaussian with no phase. With a single bump there is nothing for the phase to interfere with, so samples in position cannot see it. The option $\chi = kx$ is the wave packet's phase. In position, the two-sample test separates them only at its false-positive rate, whatever the phase. In momentum (the Fourier variable) it separates them once the phase is strong enough: $kx$ shifts the momentum distribution, and a chirp widens it.
</div>

## Geometry and representation

We introduced Fubini-Study as a geometry: a metric, and the geodesics it puts in the loss. But it comes paired with a second thing, the **representation**, meaning the function that the network outputs and the flow carries. The two are separate choices. Fisher Flow Matching already makes a representation choice. Fisher-Rao in $$\mu$$ and Fisher-Rao in $$\sqrt\mu$$ are the same geometry in different coordinates, and the square root is chosen because the geodesics, and the outputs, are simpler there, and because the metric no longer blows up at the corners of the simplex.

The representation matters most at a **node**, a point where the density vanishes. Take $$\mu(x) \propto x^2 e^{-x^2}$$. The density is smooth and touches zero at the origin. Its nonnegative root $$\sqrt{\mu(x)} \propto \lvert x\rvert\, e^{-x^2/2}$$ has a kink there, while the signed root $$\psi(x) \propto x\, e^{-x^2/2}$$ is smooth and has the same density.

The signed root is far easier for a network to fit. A network with smooth activations outputs a smooth function, and a smooth function can only round off a kink: making the network larger sharpens the corner, but slowly. The other common outputs do no better at a node: $$\mu$$ itself must stay nonnegative and touch its bound there, and $$\log\mu$$, the natural output of a softmax, goes to minus infinity.

Zeros also separate the geometries along a path. Take a start density with no zeros and an end density with some, follow the geodesic between them, and explore what happens when a network, which outputs smooth functions, has to produce it.

<div class="l-page">
  <iframe class="fig fig-zeros" src="{{ 'assets/html/2027-04-30-one-recipe-for-flow-matching-geometries/zeros.html' | relative_url }}" frameborder="0" scrolling="no" height="520px" width="100%"></iframe>
</div>
<div class="caption">
<b>Figure 9.</b> Geodesics from a Gaussian with no zeros to an end with one, two or three zeros, a signed state whose sign flips within it; red marks are zeros of $\mu(x,t)$. The slider $\ell$ blurs each geometry's output at scale $\ell$, a simple stand-in for the limited resolution, or smoothness, of a network's output: the transport map for Wasserstein, $\sqrt{\mu(x)}$ for Fisher-Rao and $\psi(x)$ for Fubini-Study. At the default $\ell = 0.05$, Wasserstein and Fisher-Rao produce dips but no zeros, even at $t = 1$, while Fubini-Study keeps every zero, made by cancellation: for an odd end one node arrives from far away, and the others form in pairs partway along. Set $\ell = 0$ for the exact geodesics. Fisher-Rao then reaches its zeros only at $t = 1$, and Wasserstein has them from the first instant. The same $\ell$ blurs the Wasserstein map more severely than it blurs $\sqrt{\mu(x)}$ or $\psi(x)$, because each bump of the end comes from a narrow range of starting positions.
</div>

The three behaviours follow from the formulas. Along a Fisher-Rao geodesic, $$\sqrt{\mu_t(x)} = a_t\sqrt{\mu_0(x)} + b_t\sqrt{\mu_1(x)}$$ with $$a_t, b_t \ge 0$$ the slerp coefficients of that geodesic, so the density vanishes only where both endpoints vanish, which a start with no zeros never does; the mixture behaves the same way. Along a Fubini-Study geodesic, $$\psi_t(x) = a_t\psi_0(x) + b_t\psi_1(x)$$ vanishes wherever the two terms cancel.

Wasserstein moves mass: following the velocity field $$U(x)$$ carries the mass at a position $$z$$ to a new position $$T(z)$$. In one dimension the density this map produces is $$\mu(T(z)) = \mu_0(z)\big/\tfrac{dT(z)}{dz}$$, so from a start with no zeros the end can vanish only where $$dT(z)/dz = \infty$$. The exact optimal map has exactly that at each zero of the end, which is why the exact geodesic has its zeros from the first instant. A network that outputs the control cannot: its $$U(x)$$ is a smooth function of position, and following a smooth field gives a map that is a diffeomorphism at every time. So from a start with no zeros the generated density only approaches the end, with dips that deepen as the network sharpens.

The outputs differ in the same way. A smooth $$\sqrt{\mu(x)}$$ or $$\mu(x)$$ can only touch zero, and a touching zero disappears under the smallest upward error. A real, signed $$\psi(x)$$ passes through zero by changing sign, and a small error moves that zero but cannot remove it. (This needs the amplitude to be real: on a line a complex amplitude vanishes only where its real and imaginary parts vanish together, which a small complex error destroys.) Physics already uses networks that output signed or complex amplitudes directly<d-cite key="carleo2017solving"></d-cite>, and flows that transport samples meet the same obstacle at sign changes<d-cite key="thiede2024waveflow"></d-cite>.

Samples cannot tell $$\psi(x)$$ from $$\lvert\psi(x)\rvert$$, so choosing a signed root changes nothing the data can check. It changes what the network has to output. Fubini-Study therefore offers two things, which are worth keeping apart. Its geometry, the phase direction and the interference term, helps only when the data carry a sign or a phase. Its representation, a real amplitude allowed to change sign, can help whenever the densities have zeros.

## Side by side

With all four geometries defined, we can put them side by side on one pair $$\mu_0, \mu_1$$.

<div class="l-page">
  <iframe class="fig fig-dict4" src="{{ 'assets/html/2027-04-30-one-recipe-for-flow-matching-geometries/dictionary.html' | relative_url }}?target=packet&d=1.4&k=6" frameborder="0" scrolling="no" height="600px" width="100%"></iframe>
</div>
<div class="caption">
<b>Figure 10.</b> Four geodesics from the same start, a Gaussian amplitude, to an end you choose. The separation $d$ starts at $2w$, twice the width $w$ of each bump, so that the two endpoints overlap; drag it to pull them apart. The ends:
<ul>
<li><b>A Gaussian</b>: both amplitudes are real and nonnegative, so the Fubini-Study row is the Fisher-Rao row.</li>
<li><b>A wave packet</b> (shown first): the Gaussian end multiplied by $e^{ikx}$. Its density is unchanged, so the first three rows do not change, but the Fubini-Study row gains fringes where the bumps overlap.</li>
<li><b>A signed state with one zero</b>: the density rows see two bumps with a gap, which the exact Wasserstein path opens at once and the Fubini-Study path makes by cancellation.</li>
</ul>
</div>

<div class="table-scroll l-page" markdown="1">

| | **Wasserstein** | **Mixture** | **Fisher-Rao** | **Fubini-Study** |
|---|---|---|---|---|
| state | density, $$\mu(x) \in \mathbb R_{\ge 0}$$ | density, $$\mu(x) \in \mathbb R_{\ge 0}$$ | density, $$\mu(x) \in \mathbb R_{\ge 0}$$ | ray $$[\psi]$$, $$\psi(x) \in \mathbb C$$, $$\mu = \lvert\psi\rvert^2$$ |
| rule | $$\frac{\partial\mu}{\partial t} + \nabla\cdot(\mu U) = 0$$ | $$\frac{\partial\mu}{\partial t} = r\mu$$ | $$\frac{\partial\mu}{\partial t} = r\mu$$ | $$\frac{\partial\psi}{\partial t} = -iH\psi$$ |
| price | $$\int \parallel U\parallel^2 \mu\, dx$$ | $$\int (r\mu)^2 dx$$ | $$\int r^2 \mu\, dx$$ | $$\mathrm{Var}_\psi(H)$$ |
| metric | $$\int \parallel\nabla\xi\parallel^2 \mu\, dx$$ | $$\int \dot\mu^2 dx$$ | $$\int \dot\mu^2/\mu\, dx$$ | $$\tfrac14 g^{FR} + \mathrm{Var}_\mu(\dot\varphi)$$ |
| interpolant | displacement interpolation | $$(1-t)\mu_0 + t\mu_1$$ | slerp of $$\sqrt\mu$$ | slerp of phase-aligned $$\psi$$ |
| distance | $$W_2(\mu_0,\mu_1)$$ | $$\parallel \mu_1-\mu_0\parallel_{L^2}$$ | $$2\arccos \mathrm{BC}(\mu_0,\mu_1)$$ | $$\arccos F(\psi_0,\psi_1)$$ |

</div>

<div class="caption">
<b>Table 2.</b> The recipe, made four ways. Each column is one choice of state, rule and price; the rows below them follow from those choices: the metric is the lowest price of a change, the interpolant in the loss is its geodesic, and the distance is the geodesic's length.
</div>

<div class="table-scroll l-page" markdown="1">

| | **Wasserstein** | **Mixture** | **Fisher-Rao** | **Fubini-Study** |
|---|---|---|---|---|
| how mass changes | moves along $$x$$ | fades in place | fades in place | fades in place, and interferes |
| distance responds to | how far apart | overlap | overlap | overlap and relative phase |
| closed-form interpolant | in one dimension and between Gaussians | always | always | always |
| between two Gaussians (Fig. 2) | one Gaussian, sliding | two components | three components | as Fisher-Rao, with fringes if phases differ |
| zeros along the path (Fig. 9) | from the first instant (exact map) | only where both ends vanish | only where both ends vanish | anywhere, by cancellation |
| what samples can test (Fig. 8) | everything | everything | everything | the density, not the phase |
| what the network outputs (Fig. 9) | a transport map | $$\mu$$ | $$\sqrt\mu$$ | $$\psi$$, signed or complex |

</div>
<div class="caption">
<b>Table 3.</b> What each geometry does in flow matching, collected from the figures above.
</div>

## Which geometry for which data

So our recipe, with its three ingredients (a state, a rule and a price), gives all four geometries. Following the recipe starting with densities, it reproduces the ones flow matching already uses; with amplitudes substituted for densities, it adds a phase that samples cannot see and a representation that keeps zeros.

- **Wasserstein**, when distances in the underlying space should matter. Bumps far apart are far apart, and the interpolant moves mass rather than teleporting it. Point clouds and spatial densities are examples.
- **Mixture**, as the baseline. It is the simplest and is exact on the simplex, but its price ignores how much mass is already present, and its distance depends on the units of $$x$$. Dirichlet Flow Matching reports that linear flow matching on the simplex behaves pathologically and was built to avoid it<d-cite key="stark2024dirichlet"></d-cite>, and statistical-manifold flow matching benchmarks against it<d-cite key="cheng2024statistical"></d-cite>.
- **Fisher-Rao**, when the categories are exchangeable. Its distance ignores where mass sits, does not depend on units, and saturates at $$\pi$$ once the supports separate. Categorical data are the natural case.
- **Fubini-Study**, when the sign or phase is part of the object: ensembles of quantum pure states<d-cite key="xu2026intrinsic"></d-cite>, STFT frames, MRI $$k$$-space, eigenfunctions that change sign. On samples of a density its geometry adds nothing, as above. Its representation is a separate matter: when the densities have zeros, a real signed amplitude is the smoother function to output.

So the geometries of flow matching on distributions can be derived via the same recipe. Each is the same recipe made with different ingredients, producing a geometry. Substituting only the first ingredient in the recipe, an amplitude for a density, led us to the Fubini-Study geometry.

One caveat. The recipe says what each geometry charges for, and so which path is cheapest. It does not say which of these paths a network learns most easily, or whether an output that is easier to represent is also easier to train. Those are empirical questions for each kind of data, and this post does not answer them.

Much is left to explore, because each of the three ingredients can be swapped for others. Quickly, two examples:

- **What if both rules act at once?** Allow transport and birth and death together and add their prices: the Wasserstein-Fisher-Rao geometry of unbalanced optimal transport<d-cite key="chizat2018interpolating"></d-cite>. A length scale set by the relative price decides when moving mass is cheaper than destroying and recreating it.
- **What if mass jumps on a graph?** If the categories have structure (ordinal labels, neighbouring tokens), let mass hop between neighbours and price the hops like kinetic energy: Maas's discrete Wasserstein distance<d-cite key="maas2011gradient"></d-cite>, under which nearby categories are close, unlike under Fisher-Rao. The rule is a continuous-time Markov chain, the kind of process discrete flow matching<d-cite key="gat2024discrete"></d-cite> samples, though there its state is a sequence of tokens rather than a distribution.