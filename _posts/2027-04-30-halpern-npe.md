---
layout: distill
title: "Halpern Iteration Achieves Õ(ε⁻¹/ᵖ) p-th Order Oracle Complexity for Monotone Variational Inequalities"
description: In this blog post, we revisit the classical Halpern iteration in 1967 and show its new applications in designing second- and higher-order methods for solving smooth monotone variational inequalities (MVI).  By using a large-step inexact Halpern iteration, we propose a novel pth-order method Halpern-ATM, that achieves a fast convergence rate of Õ(T⁻ᵖ). This improves all prior results for p ≥ 2 and matches the classical extragradient method for p = 1.
date: 2027-04-30
future: true
htmlwidgets: true

authors:
  - name: Anonymous

bibliography: 2027-04-30-halpern-npe.bib

toc:
  - name: 1 Introduction
    subsections:
      - name: 1.1 Technical Overview
      - name: 1.2 Subsequent Works
      - name: 1.3 Related Works
  - name: 2 Preliminaries
    subsections:
      - name: 2.1 Main Assumptions
      - name: 2.2 Tensor Steps
      - name: 2.3 Resolvent Operators and Residuals
  - name: 3 Main Result
  - name: '4 Halpern-NPE Achieves the $\tilde{\mathcal{O}}(T^{-2})$ Rate for $p=2$'
    subsections:
      - name: '4.1 Outer Loop: Inexact Halpern Iteration'
      - name: '4.2 Inner Loop: Approximating the Resolvent'
      - name: 4.3 Final Algorithm and Total Complexity
  - name: '5 Generalizing the Result to All $p\geq 2$'
    subsections:
      - name: '5.1 ATM Achieves the ${\mathcal{O}}(T^{-(p-1)})$ Rate'
      - name: '5.2 Halpern-ATM Achieves the $\tilde{\mathcal{O}}(T^{-p})$ Rate'
  - name: 'Appendix: The Original AI-Provided Algorithm'
---

<!-- ## Abstract
We study second- and higher-order methods for solving smooth monotone variational inequalities (MVI). Monteiro and Svaiter (SIAM J. Optim., 2012) showed that a second-order method, NPE, converges at the rate of $\mathcal{O}(T^{-1.5})$. For convex-concave minimax optimization, a subset of MVI problems, Chen, Liu, Luo, and Zhang (COLT 2025) recently improved the complexity to $\tilde{\mathcal{O}}(T^{-1.75})$ . However, it is open whether the conjectured complexity for MVI can be improved. In this paper, by using a large-step inexact Halpern iteration, we propose a novel Halpern-NPE method that achieves an even faster rate of $\tilde{\mathcal{O}}(T^{-2})$ for solving MVIs. We also provide the $p$th-order generalization of our method. We first introduce an Anchored Tensor Method (ATM) that achieves the rate of $\mathcal{O}(T^{-(p-1)})$, and then combine it with the Halpern iteration to achieve a faster convergence rate of $\tilde{\mathcal{O}}(T^{-p})$. This improves all prior results for $p\geq 2$ and matches the classical extragradient method for $p=1$. -->

{% raw %}
<a id="1-introduction"></a>
## 1 Introduction

<style>
d-article .compact-equation { margin: 0 !important; }
d-article .compact-equation mjx-container[display="true"] { margin: 0.35em 0 !important; }
</style>

In this blog post, we study the monotone variational inequality (MVI) problem <d-cite key="facchinei2003finite"></d-cite> , which targets at finding an solution ${\boldsymbol{x}}^{&#42;}\in{\mathcal{X}}$ such that
<div class="compact-equation">
$$\displaystyle\langle F({\boldsymbol{x}}^{&#42;}),{\boldsymbol{x}}-{\boldsymbol{x}}^{&#42;}\rangle\geq 0,\quad\forall{\boldsymbol{x}}\in{\mathcal{X}}, $$
</div>
where ${\mathcal{X}}\subseteq\mathbb{R}^{d}$ is a nonempty compact convex set and $F:{\mathcal{X}}\to{\mathbb{R}}^{d}$ is a continuously differentiable monotone operator. The theory of solving MVI problems has been extensively studied, with numerous papers appearing at ICLR, ICML, and NeurIPS <d-cite key="choudhury2023single,vankov2024generalized,pethick2023stable,fan2024weaker,pethick2025interpolation,cai2023accelerated,cai2024accelerated,lee2021fast,jiang2024adaptive,pethick2023escaping,patel2025neuralminmax,chen2025lazyhessians,cai2022finite,yoon2021accelerated"></d-cite>. As a important special case of the MVI, the minimax optimization problem <d-footnote> The convex-concave minimax optimization $\min_{{\boldsymbol{u}}\in{\mathcal{U}}}\max_{{\boldsymbol{v}}\in{\mathcal{V}}}\phi({\boldsymbol{u}},{\boldsymbol{v}})$ is equivalent to the MVI problem with the operator given by ${\boldsymbol{F}}({\boldsymbol{u}},{\boldsymbol{v}})=[\nabla_{{\boldsymbol{u}}}\phi({\boldsymbol{u}},{\boldsymbol{v}}),-\nabla_{{\boldsymbol{v}}}\phi({\boldsymbol{u}},{\boldsymbol{v}})]$. </d-footnote> underpins influential machine-learning applications such as generative adversarial networks (GANs), with GAN receiving the NeurIPS 2024 Test of Time Award <d-cite key="goodfellow2020generative"></d-cite> and DCGAN receiving the ICLR 2026 Test of Time Award <d-cite key="radford2016unsupervised"></d-cite>. The theory of MVI is thus the foundation of nonconvex-nonconcave problems such as GAN training in practice.

<!-- 
These neural-network parameterizations are generally nonconvex-nonconcave, so they illustrate the broader reach of minimax optimization rather than the convex-concave MVI subclass.  -->

People have fully understood the optimal complexity of solving MVI for first-order methods, which use the information of ${\boldsymbol{F}}({\boldsymbol{x}})$ to solve the problem. Korpelevich's extragradient method in 1976 <d-cite key="korpelevich1976extragradient"></d-cite> converges at the rate of ${\mathcal{O}}(T^{-1})$ with $T$ queries of ${\boldsymbol{F}}({\boldsymbol{x}})$, which matches Nemirovskij's lower bound in 2004 <d-cite key="nemirovski2004prox"></d-cite>. However, the optimal complexity for $p$th-order methods for $p \ge 2$ remains open for many years. By saying $p$th-order methods, we refer to the algorithms that uses total $T$ queries of the 
derivative information of ${\boldsymbol{F}}$ up to order $p-1$:
<!-- The MVI problem is equivalent to monotone inclusion problem ${\boldsymbol{0}}\in{\boldsymbol{F}}({\boldsymbol{x}}^{&#42;})+{\mathcal{N}}&#95;{\mathcal{X}}({\boldsymbol{x}}^{&#42;})$, which captures a lot of optimization problems, especially   -->
<!-- A typical example is the following convex-concave minimax optimization problem <d-cite key="goodfellow2020generative,cesa2006prediction"></d-cite> : -->
<!-- 
Following the oracle model established in classical textbooks <d-cite key="nemirovskij1983problem,nesterov2018lectures"></d-cite> , we consider the $p$th-order algorithm class that can query the : -->
<div>
<a id="eq-3"></a>
$$ ({\boldsymbol{F}}({\boldsymbol{x}}),D{\boldsymbol{F}}({\boldsymbol{x}}),\ldots,D^{p-1}{\boldsymbol{F}}({\boldsymbol{x}})). \tag{3} $$
</div>

<!-- 
We also assume that the operator is $p$th-order $L&#95;{p}$-smooth, i.e., $D^{p-1}{\boldsymbol{F}}$ is $L&#95;{p}$-Lipschitz continuous. The optimal oracle complexity for convex optimization has been settled, where the monotone operator ${\boldsymbol{F}}({\boldsymbol{x}})=\nabla f({\boldsymbol{x}})$ is the gradient of a convex function $f$. Let $T$ be the total number of oracle calls. The optimal convergence rates for first-order methods ($p=1$) and high-order methods $p \ge 2$ are known to be ${\mathcal{O}}(L&#95;{1}/T^{2})$ <d-cite key="nemirovskij1983problem,nesterov1983method"></d-cite> and ${\mathcal{O}}(L&#95;{p}/T^{(3p+1)/2})$ <d-cite key="monteiro2013accelerated,kovalev2022first,carmon2022optimal,arjevani2019oracle"></d-cite>, respectively. -->

For $p=2$, the classical Monteiro-Svaiter's Newton Proximal Extragradient (NPE) method in 2012 achieves a convergence rate of $\mathcal{O}(T^{-1.5})$. Over the past decade, the NPE method has also been generalized to any order $p \ge 2$, achieving the convergence rate of $\mathcal{O}(T^{-(p+1)/2})$ <d-cite key="bullins2022higher,adil2022optimal,huang2022approximation,lin2023monotone,jiang2022generalized,lin2022perseus,nesterov2023high"></d-cite>. But it is open whether this method can be improved for solving MVI.

<!-- In 2012, <d-cite key="monteiro2012iteration"></d-cite> proposed the Newton Proximal Extragradient (NPE) method with a fast second-order convergence rate of ${\mathcal{O}}(L&#95;{2}/T^{1.5})$ for $p=2$, where the cost at each iteration is nearly the same as matrix inversion/multiplication <d-cite key="duan2023faster,demmel2007fast"></d-cite> . Moreover, the $p$th-order generalization of NPE achieves the rate of ${\mathcal{O}}(L&#95;{p}/T^{(p+1)/2})$ in general  , which is speculated to be optimal in <d-cite key="adil2022optimal,lin2022perseus"></d-cite> . -->

<!-- Very recently, <d-cite key="chen2025solving"></d-cite> proposed a faster method tailored to minimax Problem (2) that can achieve a new convergence rate of $\tilde{\mathcal{O}}(L&#95;{2}/T^{1.75})$ using second-order oracles and $\tilde{\mathcal{O}}(L&#95;{p}/T^{(3p+1)/4})$ using $p$th-order oracles <d-cite key="chen2026solving"></d-cite> . However, it is unknown whether this upper bound is optimal, as it persists a gap compared to the lower bound of $\Omega(L&#95;{2}/T^{2.5})$ and $\Omega(L&#95;{p}/T^{(3p-1)/2})$ for second-order and $p$th-order oracles, respectively <d-cite key="chen2026solving"></d-cite> . More importantly, it is also open whether the classical ${\mathcal{O}}(L&#95;{p}/T^{(p+1)/2})$ rate <d-cite key="monteiro2012iteration,lin2022perseus"></d-cite> can be improved for general MVI, without leveraging the minimax problem structure. -->

**Our Findings.** In this blog post, we revisit the classical Halpern iteration—an old method for finding fixed points dating back to 1967 <d-cite key="halpern1967fixed"></d-cite>—and surprisingly discover that combining it directly with the classic Monteiro-Svaiter's NPE method yields a faster algorithm, improving the convergence rate of NPE from $\mathcal{O}(T^{-1.5})$ to $\tilde{\mathcal{O}}(T^{-2})$ for $p=2$. Moreover, we also extend our method to any $p$th-order, improving the rate achieved by the $p$th-order generalization of NPE from 
$\mathcal{O}(T^{-(p+1)/2})$ to $\tilde {\mathcal{O}}(T^{-p})$ for any $p \ge 2$. 

The idea of incorporating Halpern iteration was first discovered by GPT-5.6 Sol, while the authors simplified the resulting algorithm and wrote a human-readable proof (see <a href="#appendix-d-the-original-ai-provided-algorithm">Appendix</a>). We hope this blog post deepens the community's understanding of this fundamental problem. 

<details open style="margin:1.5em 0 1em; border:1px solid #b7c9dc; border-radius:8px; background:#f7f9fc; padding:0.65em 0.9em;"><summary style="cursor:pointer; color:#315d82; font-size:1.08em; font-weight:700;">Notations <span style="font-size:0.82em; font-weight:500; color:#60758a;">(click to hide)</span></summary>
We use $\Vert \cdot \Vert$ to denote the Euclidean norm for vectors and the spectral norm for matrices and tensors in a unified way. We hide logarithmic factors in the notation $\tilde{\mathcal{O}}(\,\cdot\,)$. Also, we use the notations ${\mathcal{O}}&#95;{p}(\,\cdot\,)$ and $\tilde{\mathcal{O}}&#95;{p}(\,\cdot\,)$ to hide the constants that depend on $p$. We denote $D^{q}{\boldsymbol{F}}$ as the $q$th-order derivative of an operator ${\boldsymbol{F}}:{\mathcal{X}}\to{\mathbb{R}}^{d}$. For a convex compact set ${\mathcal{X}}$, we let $\mathcal{N}_{\mathcal{X}}({\boldsymbol{x}})$ be its normal cone at point ${\boldsymbol{x}}$, equivalently, the subdifferential of the indicator of the set. We also let ${\rm Proj}&#95;{{\mathcal{X}}}$ be the projection operator of ${\boldsymbol{x}}$ onto the set.
</details>
 <!-- propose a superfast high-order method that solves the MVI problem at the convergence rate of $\tilde{\mathcal{O}}(L&#95;{2}/T^{2})$ for $p=2$ and $\tilde{\mathcal{O}}(L&#95;{p}/T^{p})$ for general $p\geq 2$. Our new upper bound achieves a significant improvement in the exponent compared to both the classical rate of ${\mathcal{O}}(L&#95;{p}/T^{(p+1)/2})$ for MVI and the recently established fast rate of $\tilde{\mathcal{O}}(L&#95;{p}/T^{(3p+1)/4})$ for minimax problems, because -->

<!-- <div>
$$ p>\frac{3p+1}{4}>\frac{p+1}{2},\qquad\forall p\geq 2. $$
</div> -->
<a id="1-1-technical-overview"></a>
### 1.1 Technical Overview

We first revisit the application of the classical Halpern iteration in first-order methods ($p=1$). Then, we demonstrate how directly integrating this technique into the proximal iteration yields a new breakthrough acceleration results for second- and high-order optimization ($p \ge 2$).

<div style="margin:1.5em 0 0.65em; padding:0.35em 0.7em; border-left:3px solid #4f7cac; background:#f2f6fa; color:#254b70; font-size:1.08em; font-weight:700;">(A) <span style="font-weight:500;"> Halpern iteration for $p=1$</span></div> The Halpern iteration <d-cite key="halpern1967fixed"></d-cite> for finding the fixed point of a non-expansive operator ${\boldsymbol{P}}:{\mathbb{R}}^{d}\rightarrow{\mathbb{R}}$ takes the form of
<div>
<a id="eq-4"></a>
$$ {\boldsymbol{x}}&#95;{t+1}=\beta&#95;{t}{\boldsymbol{x}}&#95;{0}+(1-\beta&#95;{t}){\boldsymbol{P}}({\boldsymbol{x}}&#95;{t}), \tag{4} $$
</div>

where $\lbrace \beta_t \rbrace_{t=0}^{T-1} \in (0,1)$ is a decreasing sequence and the initial point ${\boldsymbol{x}}&#95;{0}$ is also called the anchor <d-cite key="yoon2021accelerated,lee2021fast"></d-cite> . A simple and common choice of $\beta&#95;{t}={\mathcal{O}}(t^{-1})$ can lead to the optimal convergence rate to the fixed point $\Vert{\boldsymbol{x}}&#95;{T}-{\boldsymbol{P}}({\boldsymbol{x}}&#95;{T})\Vert\leq{\mathcal{O}}(T^{-1})$ <d-cite key="lieder2020convergence,halpern1967fixed,alacaoglu2024revisiting,cai2024variance"></d-cite> . When solving MVI problems, a natural candidate operator ${\boldsymbol{P}}$ that satisfies non-expansiveness is the resolvent/proximal operator ${\boldsymbol{P}}&#95;{\eta({\boldsymbol{F}}+{\mathcal{N}}&#95;{\mathcal{X}})}=({\rm Id}+\eta({\boldsymbol{F}}+{\mathcal{N}}&#95;{\mathcal{X}}))^{-1})$ <d-cite key="rockafellar1976monotone,ryu2016primer"></d-cite> . Let ${\rm res}({\boldsymbol{x}})=\Vert{\boldsymbol{x}}-{\boldsymbol{P}}&#95;{\eta({\boldsymbol{F}}+{\mathcal{N}}&#95;{\mathcal{X}})}({\boldsymbol{x}})\Vert/\eta$ be the normalized proximal residual then the Halpern iteration guarantees the convergence rate of ${\rm res}({\boldsymbol{x}}&#95;{T})={\mathcal{O}}((\eta T)^{-1})$. For first-order methods, we can take $\eta=\mathcal{O}(1)$, and the resolvent can be solved in ${\mathcal{O}}(1)$ gradient steps. As a result, it can convert a method with the optimal ${\mathcal{O}}(T^{-1})$ convergence rate in the gap function <d-cite key="nesterov2007dual,korpelevich1976extragradient"></d-cite> to a counterpart with the same rate in terms of the stronger notions, known as the gradient norm <d-cite key="yoon2021accelerated,lee2021fast"></d-cite> or tangent residual <d-cite key="cai2022finite,cai2023accelerated,cai2024accelerated"></d-cite> .


<div style="margin:1.5em 0 0.65em; padding:0.35em 0.7em; border-left:3px solid #4f7cac; background:#f2f6fa; color:#254b70; font-size:1.08em; font-weight:700;">(B) <span style="font-weight:500;"> Halpern-NPE for $p=2$</span></div> To our surprise, in the second- and  high-order setting, we found that the power of Halpern iteration <d-cite key="diakonikolas2020halpern,cai2024variance"></d-cite> or anchoring technique <d-cite key="ryu2019ode,yoon2021accelerated,lee2021fast"></d-cite> is not limited to converting solution concepts as in $p=1$, but also can lead to a faster convergence rate for $p\geq 2$. We first focus on the simpler setting that $p=2$, and  show that a simple algorithm called Halpern-NPE can achieve the fast convergence rate of $\tilde{\mathcal{O}}(T^{-2})$ by using the following two observations:


1. Since the proximal subproblem is second-order smooth and $\eta^{-1}$-strongly monotone, the NPE method <d-cite key="monteiro2012iteration,huang2022approximation,lin2022perseus,adil2022optimal"></d-cite> achieve the complexity of $N&#95;{t}=\tilde{\mathcal{O}}((\eta R&#95;{t})^{2/3})$ for solving the $t$th subproblem, where $R&#95;{t}=\Vert{\boldsymbol{x}}&#95;{t}-{\boldsymbol{P}}&#95;{\eta({\boldsymbol{F}}+{\mathcal{N}}&#95;{\mathcal{X}})}({\boldsymbol{x}}&#95;{t})\Vert=\eta{\rm res}({\boldsymbol{x}}&#95;{t})$ is the distance between the initialization ${\boldsymbol{x}}&#95;{t}$ and the proximal point ${\boldsymbol{P}}&#95;{\eta({\boldsymbol{F}}+{\mathcal{N}}&#95;{\mathcal{X}})}({\boldsymbol{x}}&#95;{t})$.

2. Recall that the guarantee of the Halpern iteration immediately give $R&#95;{t}={\mathcal{O}}(t^{-1})$. Therefore, we can select a very large stepsize of $\eta={\mathcal{O}}(T)$, while ensuring the total costs remains nearly unchanged since $\sum&#95;{t=0}^{T-1}N&#95;{t}=\tilde{\mathcal{O}}(T)$. Finally, substituting the setting of $\eta$ into ${\rm res}({\boldsymbol{x}}&#95;{T})={\mathcal{O}}((\eta T)^{-1})$ leads to the claimed convergence rate of $\tilde{\mathcal{O}}(T^{-2})$.

<!-- The anchor point ${\boldsymbol{x}}&#95;{0}$ in the Halpern iteration is indispensable for our new results. Without the anchor point, i.e., setting $\beta&#95;{t}=0$ in <a href="#eq-4">equation 4</a>, the Halpern iteration reduces to the proximal point iteration <d-cite key="rockafellar1976monotone"></d-cite> . Although the latter also converges at the rate of ${\mathcal{O}}((\eta T)^{-1})$ in the gap function <d-cite key="mokhtari2020unified"></d-cite> , we can only prove $\sum&#95;{t=0}^{T-1}R&#95;{t}^{2}={\mathcal{O}}(1)$, thus the total cost of subproblem solving is $\eta L&#95;{2}\sum&#95;{t=0}^{T-1}R&#95;{t}={\mathcal{O}}(\eta L&#95;{2}\sqrt{T})$. Hence, one can only choose $\eta=\Theta(\sqrt{T}/L&#95;{2})$ and achieve the classical rate of ${\mathcal{O}}(L&#95;{2}/T^{1.5})$ as prior works <d-cite key="monteiro2012iteration,jiang2024adaptive,alves2023search"></d-cite> . -->

<!-- <details style="margin:1.5em 0 1em; border:1px solid #b7c9dc; border-radius:8px; background:#f7f9fc; padding:0.65em 0.9em;"><summary style="cursor:pointer; color:#315d82; font-size:1.08em; font-weight:700;">(C) Halpern-ATM for $p\geq 2$ <span style="font-size:0.82em; font-weight:500; color:#60758a;">(click to expand)</span></summary> -->

<div style="margin:1.5em 0 0.65em; padding:0.35em 0.7em; border-left:3px solid #4f7cac; background:#f2f6fa; color:#254b70; font-size:1.08em; font-weight:700;">(C) <span style="font-weight:500;"> Halpern-ATM for $p\geq 2$</span> <span style="font-size:0.82em; font-weight:500; color:#60758a;">(can be skipped for the first read)</span></div>
To generalize the above result to higher-order optimization, we can easily follow the same analysis and know that, as long as there exists a basic tensor method that has the complexity of $\tilde{\mathcal{O}}((\eta d&#95;{t})^{1/(p-1)})$ for solving the proximal subproblem, then the large-step Halpern iteration with $\eta=\Theta(T^{p-1})$ yields a method converges at the rate of $\tilde{\mathcal{O}}(T^{-p})$.

However, the high-order generalization of NPE <d-cite key="bullins2022higher,adil2022optimal,huang2022approximation,lin2022perseus"></d-cite> can only achieve a complexity of $\tilde{\mathcal{O}}(\eta d&#95;{t})^{2/(p+1)})$ that is not fast enough for $p\geq 4$. To address this issue, we propose an Anchored Tensor Method (ATM), which iteratively adds regularization on the original operator to ensure that every tensor step lies in the local superlinear convergence region. We show that ATM achieves a rate of ${\mathcal{O}}(T^{-(p-1)})$ for $p\geq 2$, which implies the required complexity of $\tilde{\mathcal{O}}((\eta d&#95;{t})^{1/(p-1)})$ for the proximal subproblem in the Halpern iteration. Finally, the algorithm called Halpern-ATM achieves the fast convergence rate of $\tilde{\mathcal{O}}(T^{-p})$.

<a id="1-2-subsequent-works"></a>

### 1.2 Subsequent Works

Within a month following our release, three independent works <d-cite key="zhang2026optimal,zhang2026matching,jiang2026anchored"> </d-cite> built upon our ideas to establish an optimal convergence rate of $\mathcal{O}(T^{-(3p+1)/2})$, matching the lower bound given by Chen et al. <d-cite key="chen2026solving"></d-cite> . The core idea behind these developments is to incorporate an additional gradient step into the Halpern iteration to predict the optimal solution of each proximal subproblem, thereby enabling larger step sizes. The derivations in these papers are more complicated than our blog. This blog post is to revisit the Halpern iteration and provide a concise   proof for improving the classical NPE algorithm.

<a id="1-3-related-works"></a>

### 1.3 Related Works

<details style="margin:1.5em 0 1em; border:1px solid #b7c9dc; border-radius:8px; background:#f7f9fc; padding:0.65em 0.9em;"><summary style="cursor:pointer; color:#315d82; font-size:1.08em; font-weight:700;">Additional Related Works in Convex Optimization <span style="font-size:0.82em; font-weight:500; color:#60758a;">(click to expand)</span></summary>

Convex optimization $\min_{{\boldsymbol{u}}\in{\mathcal{U}}} \phi({\boldsymbol{u}})$ is equivalent to the MVI problem with the operator given by ${\boldsymbol{F}}({\boldsymbol{u}})=\nabla \phi({\boldsymbol{u}})$, whose complexity is fully understood. For first-order methods, Nesterov in 1983 <d-cite key="nesterov1983method"></d-cite> proposed the accelerated gradient descent (AGD) that improves the convergence rate of gradient descent from $\mathcal{O}(T^{-1})$ to $\mathcal{O}(T^{-2})$, matching the lower bound for first-order methods by Nemirovski and Yudin's textbook <d-cite key="nemirovskij1983problem"></d-cite>. For second-order methods, Nesterov in 2006 <d-cite key="nesterov2006cubic"></d-cite> and 2008 <d-cite key="nesterov2008accelerating"></d-cite> proposed the cubic regularized Newton (CRN) method as well as its acceleration (A-CRN) and showed that they achieve the convergence rate of $\mathcal{O}(T^{-2})$ and $\mathcal{O}(T^{-3})$, respectively. In 2013, Monteiro and Svaiter <d-cite key="monteiro2013accelerated"></d-cite>  proposed the accelerated Newton proximal extragradient (A-NPE) method that improves A-CRN to $\tilde{\mathcal{O}}(T^{-3.5})$. In 2019, three concurrent works <d-cite key="gasnikov2019optimal,bubeck2019near,jiang2019optimal"></d-cite> extended A-NPE to high-order $p \ge 2$ and established the convergence rate of $\tilde{\mathcal{O}}(T^{-(3p+1)/2})$. In 2022, two independent groups <d-cite key="kovalev2022first,carmon2022optimal"></d-cite> introduced novel techniques to achieve the optimal convergence rate of ${\mathcal{O}}(T^{-(3p+1)/2})$ for high-order methods of all orders, exactly matching the corresponding lower bounds <d-cite key="agarwal2018lower,arjevani2019oracle,garg2021near"></d-cite>. Notably, the work <d-cite key="carmon2022optimal"></d-cite> uses a bisection procedure to simplify the nontrivial CRN subproblems in $p=2$ <d-cite key="nesterov2006cubic"></d-cite>, and the resulting second-order algorithm requires only a standard regularized Newton step per iteration to achieve the optimal convergence rate of ${\mathcal{O}}(T^{-3.5})$.
<!-- When the operator ${\boldsymbol{F}}({\boldsymbol{x}})=\nabla f({\boldsymbol{x}})$ is the gradient of a convex function $f$,  proposed the , which is the first globally convergent second-order method and achieves a rate of ${\mathcal{O}}(L&#95;{2}/T^{2})$ for $p=2$.  proposed the accelerated CRN to achieve a fast rate of ${\mathcal{O}}(L&#95;{2}/T^{3})$. proposed the  that converges at an even faster rate of $\tilde{\mathcal{O}}(L&#95;{2}/T^{3.5})$. For $p\geq 2$,  proposed $p$th-order generalization of A-NPE that converges at the rate of $\tilde{\mathcal{O}}(L&#95;{p}/T^{(3p+1)/2})$. Very recently, removed the bisection sub-procedure in A-NPE and achieved the optimal rate of ${\mathcal{O}}(L&#95;{p}/T^{(3p+1)/2})$.

On the lower bound part,  showed a lower bound of $\Omega(L&#95;{p}/T^{(5p+1)/2})$ for randomized algorithms. Concurrently, <d-cite key="arjevani2019oracle"></d-cite> showed the optimal lower bound of $\Omega(L&#95;{p}/T^{(3p+1)/2})$ for deterministic algorithms. Recently, <d-cite key="garg2021near"></d-cite> improved the lower bound of randomized and quantum algorithms to $\tilde{\Omega}(L&#95;{p}/T^{(3p+1)/2})$, which has no gap between the upper bounds up to logarithmic factors. -->

</details>

<details style="margin:1.5em 0 1em; border:1px solid #b7c9dc; border-radius:8px; background:#f7f9fc; padding:0.65em 0.9em;"><summary style="cursor:pointer; color:#315d82; font-size:1.08em; font-weight:700;">Additional Related Works in Monotone Variational Inequalities <span style="font-size:0.82em; font-weight:500; color:#60758a;">(click to expand)</span></summary>

For general MVI problems as studied in this blog post, the optimal complexity is open besides the simple first-order case where $p=1$. For first-order methods, Korpelevich in 1976 proposed the optimal extragradient (EG) method in 1976 <d-cite key="korpelevich1976extragradient"></d-cite> with the convergence rate of $\mathcal{O}(T^{-1})$, which matches the corresponding lower bound <d-cite key="nemirovski2004prox"></d-cite>. For second-order methods, Monteiro and Svaiter in 2012 <d-cite key="monteiro2012iteration"></d-cite>  proposed the Newton proximal extragradient (NPE) method that achieves the convergence rate of $\mathcal{O}(T^{-1.5})$, which each subproblem solved in $\tilde{\mathcal{O}}(T)$ Newton steps using a similar bisection strategy as solving the CRN subproblems <d-cite key="nesterov2006cubic"></d-cite>. Two concurrent works in 2023 <d-cite key="jiang2024adaptive,alves2023search"></d-cite> showed the same convergence rate is achievable with regularized Newton steps per iteration like the case for convex optimization <d-cite key="carmon2022optimal"></d-cite>.  For high-order methods, many follow-up works <d-cite key="bullins2022higher,huang2022approximation,adil2022optimal,lin2023monotone,jiang2022generalized,nesterov2023high,lin2022perseus"></d-cite> of Monteiro and Svaiter's NPE <d-cite key="monteiro2012iteration"></d-cite> generalizes it to $p$th-order schemes, achieving the convergence rate of ${\mathcal{O}}(T^{-(p+1)/2})$ for solving MVIs.


 <!-- , which is then generalized to the rate of $\mathcal{O}(T^{-(p+1)/2})$ for $p \ge 2$ in many follow-up works <d-cite key="huang2022approximation,adil2022optimal,lin2023monotone,jiang2022generalized,nesterov2023high,lin2022perseus"></d-cite>. -->

 <!-- <d-cite key="monteiro2012iteration"></d-cite>  that globally converges at the rate of ${\mathcal{O}}(L&#95;{2}/T^{1.5})$ for $p=2$, using $T$ second-order oracle calls and ${\mathcal{O}}(T\log T)$ matrix inversion operations. <d-cite key="bullins2022higher"></d-cite> generalized NPE to $p$th order and showed a convergence rate of ${\mathcal{O}}(L&#95;{p}/T^{(p+1)/2})$. Subsequently, many simpler analyses or alternative algorithms have been found  , but all the shown convergence rates are ${\mathcal{O}}(L&#95;{p}/T^{(p+1)/2})$. Moreover, <d-cite key="jiang2024adaptive,alves2023search"></d-cite> proposed bisection-free methods for $p=2$ that also converge at the rate of ${\mathcal{O}}(L&#95;{2}/T^{1.5})$ and only require a single matrix inversion at each iteration. -->
<!-- Beyond the convex-concave setting, a line of recent work studies minimax optimization and MVIs under weaker conditions such as the weak Minty variational inequality <d-cite key="pethick2023escaping,pethick2023stochastic,pethick2023stable,fan2024weaker,pethick2025interpolation"></d-cite>, and adaptive second-order optimistic methods achieve optimal rates without line search <d-cite key="jiang2024adaptive"></d-cite>. Notably, among the works above, the following received Oral/Spotlight recognition at ICLR: the lazy-Hessian second-order minimax method of <d-cite key="chen2025lazyhessians"></d-cite> (ICLR 2025 Oral), together with the weak-MVI extragradient frameworks of <d-cite key="fan2024weaker,pethick2025interpolation"></d-cite> (ICLR 2024 and ICLR 2025). -->
</details>


<details style="margin:1.5em 0 1em; border:1px solid #b7c9dc; border-radius:8px; background:#f7f9fc; padding:0.65em 0.9em;"><summary style="cursor:pointer; color:#315d82; font-size:1.08em; font-weight:700;">Additional Related Works in Convex-Concave Optimization <span style="font-size:0.82em; font-weight:500; color:#60758a;">(click to expand)</span></summary>

The convex-concave minimax optimization $\min_{{\boldsymbol{u}}\in{\mathcal{U}}}\max_{{\boldsymbol{v}}\in{\mathcal{V}}}\phi({\boldsymbol{u}},{\boldsymbol{v}})$ is an important subclass of the MVI problem with the monotone operator given by ${\boldsymbol{F}}({\boldsymbol{u}},{\boldsymbol{v}})=[\nabla_{{\boldsymbol{u}}}\phi({\boldsymbol{u}},{\boldsymbol{v}}),-\nabla_{{\boldsymbol{v}}}\phi({\boldsymbol{u}},{\boldsymbol{v}})]$. Therefore, all the above methods for general MVI can also be applied to solving convex-concave minimax optimization to achieve the convergence rate of ${\mathcal{O}}(T^{-(p+1)/2})$ for $p$th-order methods. Very recently, Chen et al. in 2025 
<d-cite key="chen2025solving"></d-cite> proposed a primal-dual Monteiro-Svaiter acceleration framework <d-cite key="monteiro2013accelerated"></d-cite> to achieve a faster rate of ${\mathcal{O}}(T^{-(3p+1)/4})$. Maybe surprisingly, this blog post shows that a simple application of Halpern iteration <d-cite key="halpern1967fixed"></d-cite> already achieve a even faster rate of $\tilde{\mathcal{O}}(T^{-p})$, without leveraging the complicated primal-dual momentum tailored to minimax optimization <d-cite key="chen2025solving"></d-cite>.
<!-- When ${\boldsymbol{F}}$ is the gradient operator of a convex-concave function $\phi:{\mathcal{X}}\rightarrow{\mathbb{R}}$,  applied a primal-dual  to the proximal function and achieved a fast rate of ${\mathcal{O}}(L&#95;{2}/T^{1.75})$ for second-order minimax optimization ($p=2$). In the full version, <d-cite key="chen2026solving"></d-cite> showed the $p$th-order generalization achieves the rate of ${\mathcal{O}}(L&#95;{p}/T^{(3p+1)/4})$ and also established a lower bound of $\Omega(L&#95;{p}/T^{(3p-1)/2})$. This paper reduces the gap by proposing better upper bounds of ${\mathcal{O}}(L&#95;{p}/T^{p})$. -->
</details>




<a id="2-preliminaries"></a>
## 2 Preliminaries

<a id="2-1-main-assumptions"></a>
### 2.1 Main Assumptions

We study the MVI Problem (1) under the following standard assumptions <d-cite key="huang2022approximation,lin2022perseus,bullins2022higher,jiang2022generalized"></d-cite> .

<div id="assumption-2.1" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Assumption 2.1.</strong> ${\mathcal{X}}\subseteq\mathbb{R}^{d}$ is a nonempty compact convex set.
</div>

<div id="assumption-2.2" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Assumption 2.2.</strong> We assume there exists ${\boldsymbol{x}}^{\star},$ such that $0\in({\boldsymbol{F}}+{\mathcal{N}}&#95;{\mathcal{X}})({\boldsymbol{x}}^{\star})$.
</div>

<div id="assumption-2.3" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Assumption 2.3.</strong> ${\boldsymbol{F}}:{\mathcal{X}}\to\mathbb{R}^{d}$ is continuous and monotone:

<div>
$$ \langle{\boldsymbol{F}}({\boldsymbol{x}})-{\boldsymbol{F}}({\boldsymbol{y}}),{\boldsymbol{x}}-{\boldsymbol{y}}\rangle\geq 0,\quad\forall{\boldsymbol{x}},{\boldsymbol{y}}\in{\mathcal{X}}. $$
</div>
</div>

<div id="assumption-2.4" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Assumption 2.4.</strong> Assume $F:{\mathcal{X}}\to{\mathbb{R}}^{d}$ is $p$th-order $L&#95;{p}$ smooth:

<div>
<a id="eq-5"></a>
$$ \left\Vert D^{p-1}{\boldsymbol{F}}({\boldsymbol{x}})-D^{p-1}{\boldsymbol{F}}({\boldsymbol{y}})\right\Vert\leq L&#95;{p}\left\Vert{\boldsymbol{x}}-{\boldsymbol{y}}\right\Vert,\quad\forall{\boldsymbol{x}},{\boldsymbol{y}}\in{\mathcal{X}}. \tag{5} $$
</div>
</div>

<a id="2-2-tensor-steps"></a>
### 2.2 Tensor Steps

A basic operation to leverage the $p$th-order oracle in <a href="#eq-3">equation 3</a> is the following tensor step <d-cite key="huang2022approximation,lin2022perseus,bullins2022higher,jiang2022generalized"></d-cite> , which solves a MVI subproblem induced by a local Taylor approximation.

<div id="definition-2.1" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Definition 2.1.</strong> Under <a href="#assumption-2.3">Assumption 2.3</a> and <a href="#assumption-2.4">Assumption 2.4</a>, for an input point ${\boldsymbol{x}}\in{\mathcal{X}}$ the $p$th-order tensor step with regularization parameter $M\geq L&#95;{p}$ outputs ${\boldsymbol{y}}={\mathcal{T}}&#95;{\boldsymbol{F}}^{p}({\boldsymbol{x}};M)$ such that

<div>
<a id="eq-6"></a>
$$ {\boldsymbol{0}}\in\bar{\boldsymbol{F}}&#95;{\boldsymbol{x}}^{p}({\boldsymbol{y}})+\frac{M}{p!}\left\Vert{\boldsymbol{y}}-{\boldsymbol{x}}\right\Vert^{p-1}({\boldsymbol{y}}-{\boldsymbol{x}})+{\mathcal{N}}&#95;{{\mathcal{X}}}({\boldsymbol{y}}), \tag{6} $$
</div>

where $\bar{\boldsymbol{F}}&#95;{{\boldsymbol{x}}}^{p}({\boldsymbol{y}}):=\sum&#95;{k=0}^{p-1}D^{k}{\boldsymbol{F}}({\boldsymbol{x}})[{\boldsymbol{y}}-{\boldsymbol{x}}]^{k}/k!$ is $(p-1)$th-order Taylor expansion for ${\boldsymbol{F}}$ at the center point ${\boldsymbol{x}}$.
</div>

<!-- When $p=1$, the above tensor step is exactly the (projected) gradient step that can be conducted in vector addition operators; When $p=2$, it can be solved in the same spirit of cubic regularized Newton subproblem <d-cite key="nesterov2006cubic"></d-cite> using a similar binary search, whose costs is nearly the same as matrix multiplication/inversion time <d-cite key="duan2023faster,demmel2007fast"></d-cite> ; In general ($p\geq 2$), the MVI problem in equation <a href="#eq-6">equation 6</a> can be solved in polynomial time using the interior point method <d-cite key="ralph2000superlinear,qi2002smoothing"></d-cite> or the cutting plane method <d-cite key="jiang2020improved"></d-cite> . -->

<a id="2-3-resolvent-operators-and-residuals"></a>
### 2.3 Resolvent Operators and Residuals

To apply the Halpern iteration to MVI problems, we also make use of the following definitions of the resolvent/proximal operator <d-cite key="rockafellar1976monotone,combettes2018monotone,facchinei2003finite"></d-cite> .

<div id="definition-2.2" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Definition 2.2.</strong> Under <a href="#assumption-2.3">Assumption 2.3</a>, for $\eta>0$, we can define the unique-valued resolvent operator as

<div>
$$ {\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}})=({\rm Id}+\eta({\boldsymbol{F}}+{\mathcal{N}}&#95;{\mathcal{X}}))^{-1}({\boldsymbol{x}}). $$
</div>
</div>

It is well-known that ${\boldsymbol{P}}&#95;{\eta}$ is non-expansive if ${\boldsymbol{F}}$ is monotone <d-cite key="ryu2016primer,rockafellar1976monotone"></d-cite> .

<div id="proposition-2.1" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Proposition 2.1 ( <d-cite key="ryu2016primer"></d-cite> ).</strong> Under <a href="#assumption-2.3">Assumption 2.3</a>, the operator ${\boldsymbol{P}}&#95;{\eta}$ is non-expansive for any $\eta>0$,

<div>
$$ \Vert{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}})-{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}^{\prime})\Vert\leq\Vert{\boldsymbol{x}}-{\boldsymbol{x}}^{\prime}\Vert,\quad\forall{\boldsymbol{x}},{\boldsymbol{x}}^{\prime}\in{\mathcal{X}}. $$
</div>
</div>

Moreover, it is easy to see that ${\boldsymbol{x}}^{&#42;}$ solved the MVI problem, i.e., ${\boldsymbol{0}}\in{\boldsymbol{F}}({\boldsymbol{x}}^{&#42;})+{\mathcal{N}}&#95;{\mathcal{X}}({\boldsymbol{x}}^{&#42;})$, if and only if ${\boldsymbol{x}}^{&#42;}$ is the fixed point of ${\boldsymbol{P}}&#95;{\eta}$, i.e., ${\boldsymbol{x}}^{&#42;}={\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}^{&#42;})$. It motives the definition of the following proximal residual <d-cite key="diakonikolas2020halpern,cai2024variance,alacaoglu2024revisiting"></d-cite> .

<div id="definition-2.3" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Definition 2.3.</strong> Under <a href="#assumption-2.3">Assumption 2.3</a>, we define the proximal residual for a point ${\boldsymbol{x}}\in{\mathcal{X}}$ as

<div>
$$ {\rm res}({\boldsymbol{x}}):=\Vert{\boldsymbol{x}}-{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}})\Vert/\eta. $$
</div>
</div>

In addition, finding a point with a small proximal residual is sufficient for approximating the MVI problem, where the left-hand side below is the strong optimality criterion for MVIs <d-cite key="cai2022finite,cai2023accelerated,cai2024accelerated"></d-cite>.

<div id="proposition-2.2" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Proposition 2.2 ( <d-cite key="cai2024variance"></d-cite> ).</strong> Under <a href="#assumption-2.3">Assumption 2.3</a>, then for ${\boldsymbol{y}}={\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}})$,

<div>
<a id="eq-7"></a>
$$ {\rm dist}({\boldsymbol{0}},{\boldsymbol{F}}({\boldsymbol{y}})+{\mathcal{N}}&#95;{\mathcal{X}}({\boldsymbol{y}}))\leq{\rm res}({\boldsymbol{x}}). \tag{7} $$
</div>
</div>

<!-- The left-hand side in <a href="#eq-7">equation 7</a> is also called the tangent residual  at the point ${\boldsymbol{y}}$, which implies a strong solution/Stampacchia variational inequality solution <d-cite key="hartman1966some"></d-cite> . A strong solution also implies a weak solution/Minty variational inequality solution <d-cite key="minty1962monotone"></d-cite> measured by the restricted gap function <d-cite key="nesterov2007dual"></d-cite> ${\rm gap}({\boldsymbol{y}}):=\sup&#95;{{\boldsymbol{y}}^{\prime}\in{\mathcal{X}}}\langle{\boldsymbol{F}}({\boldsymbol{y}}),{\boldsymbol{y}}-{\boldsymbol{y}}^{\prime}\rangle$ on a compact set, because we have ${\rm gap}({\boldsymbol{y}})\leq{\rm dist}({\boldsymbol{0}},{\boldsymbol{F}}({\boldsymbol{y}})+{\mathcal{N}}&#95;{\mathcal{X}}({\boldsymbol{y}}))\cdot{\rm diam}(D)$ by the monotonicity of ${\boldsymbol{F}}$ and Cauchy–Schwarz. Finally, although the right-hand side in <a href="#eq-7">equation 7</a> depends on the proximal point ${\boldsymbol{y}}={\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}})$, it is straightforward to produce $\hat{\boldsymbol{y}}\in{\mathcal{X}}$ such that ${\rm dist}({\boldsymbol{0}},{\boldsymbol{F}}(\hat{\boldsymbol{y}})+{\mathcal{N}}&#95;{\mathcal{X}}(\hat{\boldsymbol{y}}))\leq 2{\rm res}({\boldsymbol{x}})$ by approximately solving the proximal subproblem. See, e.g. <d-cite key="cai2024variance"></d-cite> for the case $p=1$, and for general $p\geq 2$ is similar.
 -->
<a id="3-main-result"></a>
## 3 Main Result

The main theorem below shows a new complexity upper bound that of $T=\tilde{\mathcal{O}}(\epsilon^{-1/p})$ for finding an ${\epsilon}$-solution such that ${\rm res}({\boldsymbol{x}})\leq{\epsilon}$, which is equivalent to the convergence rate ${\rm res}({\boldsymbol{x}})=\tilde{\mathcal{O}}(T^{-p})$ as claimed, which strictly improves the best-known convergence rate of $\mathcal{O}(T^{-(p+1)/2})$ given by the $p$th-order generalization of the NPE method <d-cite key="monteiro2012iteration,bullins2022higher,lin2022perseus,huang2022approximation"></d-cite>.

<div id="theorem-3.1" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Theorem 3.1.</strong> 
Let $D=\left\Vert{\boldsymbol{x}}&#95;{0}-{\boldsymbol{x}}^{&#42;}\right\Vert$ be the distance of the initial point ${\boldsymbol{x}}&#95;{0}\in{\mathcal{X}}$ to the optimal solution ${\boldsymbol{x}}^{&#42;}$. Under Assumptions <a href="#assumption-2.1">2.1</a>–<a href="#assumption-2.4">2.4</a>, for any integer $p\geq 2$, there exists an algorithm (<a href="#algorithm-2">Algorithm 2</a>) that can return an $\epsilon$-solution ${\boldsymbol{x}}\in{\mathcal{X}}$ satisfying ${\rm res}({\boldsymbol{x}})\leq{\epsilon}$ in the $p$th-order oracle complexity of
<div>
$$ T={\widetilde{\mathcal{O}}\Bigg(D\left(\frac{L&#95;{p}}{\epsilon}\right)^{1/p}\Bigg).} $$
</div>
</div>

<!-- For $p=2$, we obtain a Newton method for MVI problems that has the complexity of $\tilde{\mathcal{O}}({\epsilon}^{-1/2})$, improving the classical result of ${\mathcal{O}}({\epsilon}^{-2/3})$ for MVI <d-cite key="monteiro2012iteration"></d-cite>. For the more general setting $p\geq 2$, our new upper bounds also improves the ${\mathcal{O}}({\epsilon}^{-2/(p+1)})$ for MVI <d-cite key="monteiro2012iteration"></d-cite>. -->
<!-- 
 and the recent result of ${\mathcal{O}}({\epsilon}^{-4/7})$ for minimax problems <d-cite key="chen2025solving"></d-cite> . Compared to the $\Omega({\epsilon}^{-2/5})$ lower bound proved in <d-cite key="chen2026solving"></d-cite> , a gap of $\epsilon^{-1/10}$ persists. Therefore, the oracle complexity remains open even for $p=2$.  and the ${\mathcal{O}}({\epsilon}^{-4/(3p+1)})$ for minimax problems <d-cite key="chen2026solving"></d-cite> . Compared to the lower bound of $\Omega({\epsilon}^{-2/(3p-1)})$, the gap becomes larger as $p$ grows. -->
<a id="4-halpern-npe-achieves-the-tilde-mathcal-o-t-2-rate-for-p-2"></a>
## 4 Halpern-NPE Achieves the $\tilde{\mathcal{O}}(T^{-2})$ Rate for $p=2$

In this section, we first prove <a href="#theorem-3.1">Theorem 3.1</a> for $p=2$ by introducing a simple second-order method that achieves the fast convergence rate of $\tilde{\mathcal{O}}(T^{-2})$. Following the ideas in <a href="#1-1-technical-overview">Section 1.1</a>, we apply a large-step inexact Halpern iteration on the resolvent operator, which is solved by a restarted version <d-cite key="huang2022approximation,lin2022perseus"></d-cite> of the NPE method <d-cite key="monteiro2012iteration"></d-cite> . We formally introduce our double-loop Halpern-NPE method algorithm in the following.

<a id="4-1-outer-loop-inexact-halpern-iteration"></a>
### 4.1 Outer Loop: Inexact Halpern Iteration

In <a href="#eq-4">equation 4</a>, a simple choice of the anchoring coefficient $\beta&#95;{t}$ for optimal convergence rate is $\beta&#95;{t}=1/(t+2)$ <d-cite key="lieder2020convergence,diakonikolas2020halpern"></d-cite> . Then, we obtain the following scheme by applying the Halpern iteration $\beta&#95;{t}=1/(t+2)$ on the approximate resolvent ${\boldsymbol{y}}&#95;{t}\approx{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}&#95;{t})$:

<div>
<a id="eq-8"></a>
$$ {\boldsymbol{x}}&#95;{t+1}=\frac{1}{t+2}{\boldsymbol{x}}&#95;{0}+\frac{t+1}{t+2}{\boldsymbol{y}}&#95;{t},\qquad{\rm where}\quad{\boldsymbol{y}}&#95;{t}\approx{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}&#95;{t}). \tag{8} $$
</div>

This inexact Halpern iteration has been analyzed in many prior works <d-cite key="diakonikolas2020halpern,alacaoglu2024revisiting,cai2024variance"></d-cite> . This iteration converges at the rate of ${\rm res}({\boldsymbol{x}}&#95;{T})={\mathcal{O}}((\eta T)^{-1})$ if the approximation error of the resolvent is sufficiently small at every step.

<div id="lemma-4.1" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Lemma 4.1 ( Theorem 2.1 of <d-cite key="alacaoglu2024revisiting"></d-cite> ).</strong> Under Assumptions <a href="#assumption-2.1">2.1</a>–<a href="#assumption-2.3">2.3</a>, if the resolvent approximation error satisfies

<div>
<a id="eq-9"></a>
$$ \Vert{\boldsymbol{y}}&#95;{t}-{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}&#95;{t})\Vert\leq\delta&#95;{t}:=\frac{\Vert{\boldsymbol{x}}&#95;{t}-{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}&#95;{t})\Vert}{98\sqrt{t+2}\log(t+2)},\qquad t=0,\cdots,T-1, \tag{9} $$
</div>

then the inexact Halpern iteration in <a href="#eq-8">equation 8</a> guarantees a convergence rate of

<div>
<a id="eq-10"></a>
$$ {\rm res}({\boldsymbol{x}}&#95;{T})\leq\frac{4\Vert{\boldsymbol{x}}&#95;{0}-{\boldsymbol{x}}^{&#42;}\Vert}{\eta(T+1)}. \tag{10} $$
</div>
</div>

The above result has been extensively used in first-order methods, including parameter-free methods <d-cite key="diakonikolas2020halpern"></d-cite> , finite-sum problems <d-cite key="cai2024variance"></d-cite> , and structured non-monotone problems <d-cite key="alacaoglu2024revisiting"></d-cite> . In the high-order settings considered in this paper, we show that it allows a larger stepsize of $\eta={\mathcal{O}}(T/L&#95;{2})$ than the choice of $\eta={\mathcal{O}}(\sqrt{T}/L&#95;{2})$ in the proximal point method <d-cite key="monteiro2012iteration,bullins2022higher,lin2022perseus,huang2022approximation"></d-cite> .

<a id="4-2-inner-loop-approximating-the-resolvent"></a>
### 4.2 Inner Loop: Approximating the Resolvent

Recall that the resolvent in <a href="#definition-2.2">Definition 2.2</a> is ${\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}})=({\rm Id}+\eta({\boldsymbol{F}}+{\mathcal{N}}&#95;{\mathcal{X}}))^{-1}({\boldsymbol{x}})$. Equivalently, the proximal point ${\boldsymbol{y}}={\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}})$ is the unique solution of

<div>
<a id="eq-11"></a>
$$ {\boldsymbol{0}}\in{\boldsymbol{F}}({\boldsymbol{y}})+\frac{1}{\eta}({\boldsymbol{y}}-{\boldsymbol{x}})+{\mathcal{N}}&#95;{{\mathcal{X}}}({\boldsymbol{y}}). \tag{11} $$
</div>

For a fixed ${\boldsymbol{x}}$, the above problem is equivalent to solving the MVI problem induced by the regularized operator ${\boldsymbol{G}}({\boldsymbol{y}}):={\boldsymbol{F}}({\boldsymbol{y}})+({\boldsymbol{y}}-{\boldsymbol{x}})/\eta$, which is $\mu$-strongly monotone for $\mu=1/\eta$:

<div>
<a id="eq-12"></a>
$$ \langle{\boldsymbol{G}}({\boldsymbol{y}})-{\boldsymbol{G}}({\boldsymbol{y}}^{\prime}),{\boldsymbol{y}}-{\boldsymbol{y}}^{\prime}\rangle\geq\mu\Vert{\boldsymbol{y}}-{\boldsymbol{y}}^{\prime}\Vert^{2},\qquad\forall{\boldsymbol{y}},{\boldsymbol{y}}^{\prime}\in{\mathcal{X}}. \tag{12} $$
</div>

The complexity of obtaining an approximate solution follows from existing results for smooth strongly MVIs <d-cite key="monteiro2012iteration,jiang2022generalized,huang2022approximation,ostroukhov2020tensor"></d-cite> . For instance, we can use the restarted NPE/ARE method <d-cite key="monteiro2012iteration,huang2022approximation"></d-cite> , which is essentially a second-order extragradient method <d-cite key="korpelevich1976extragradient"></d-cite> with large adaptive stepsize $\tau&#95;{k}={\mathcal{O}}(1/(L&#95;{2}\Vert{\boldsymbol{x}}&#95;{k+1/2}-{\boldsymbol{x}}&#95;{k}\Vert))$ <d-cite key="monteiro2012iteration,huang2022approximation"></d-cite> . See <a href="#algorithm-1">Algorithm 1</a> for the complete procedure, whose guarantee is stated as follows.

<div id="lemma-4.2" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Lemma 4.2 ( Theorem 3.2 of <d-cite key="huang2022approximation"></d-cite> ).</strong> Let the operator ${\boldsymbol{G}}:{\mathcal{X}}\to{\mathbb{R}}^{d}$ be $L&#95;{2}$-second-order smooth satisfying <a href="#eq-5">equation 5</a> and $\eta^{-1}$-strongly monotone. Apply <a href="#algorithm-1">Algorithm 1</a> with the parameters

<div>
$$ M=\Theta(L&#95;{2}),\quad K={\mathcal{O}}\left((\eta L&#95;{2}R)^{2/3}\right),\quad S={\mathcal{O}}\left(\log\log(R/\delta)\right) $$
</div>

can return a point ${\boldsymbol{y}}&#95;{S}\in{\mathcal{X}}$ such that $\Vert{\boldsymbol{y}}&#95;{S}-{\boldsymbol{y}}^{&#42;}\Vert\leq\delta$ in the total $p$th-order oracle complexity of $K\times S$, where ${\boldsymbol{y}}^{&#42;}=({\boldsymbol{G}}+{\mathcal{N}}&#95;{\mathcal{X}})^{-1}({\boldsymbol{0}})$ is the unique solution to the MVI induced by ${\boldsymbol{G}}$ and $R=\Vert{\boldsymbol{y}}&#95;{0}-{\boldsymbol{y}}^{&#42;}\Vert$.
</div>

<div style="text-align:center; margin:1.5em 0;"><a id="algorithm-1"></a>
<img src="/2027/assets/img/2027-04-30-halpern-npe/algo1.png" alt="Algorithm 1" style="max-width:100%; border:1px solid #ddd; border-radius:4px;" loading="lazy"/></div>

We remark that the above complexity of $K\times S$ can be reduced to $K+S$ with a refined analysis, as in the works studying a similar restart scheme <d-cite key="jiang2022generalized,huang2022approximation"></d-cite>. However, the slightly looser bound of $K\times S$ is enough for our subsequent analyses.

<a id="4-3-final-algorithm-and-total-complexity"></a>
## 4.3 Final Algorithm and Total Complexity

<div style="text-align:center; margin:1.5em 0;"><a id="algorithm-2"></a>
<img src="/2027/assets/img/2027-04-30-halpern-npe/algo2.png" alt="Algorithm 2" style="max-width:100%; border:1px solid #ddd; border-radius:4px;" loading="lazy"/></div>

By applying <a href="#algorithm-1">Algorithm 1</a> to solve the resolvent operator in <a href="#eq-8">equation 8</a>, we obtain our final high-order method to solve MVI problems in <a href="#algorithm-2">Algorithm 2</a>. Then, by appropriately selecting the stepsize $\eta=\Theta(T)$ as well as sub-solver parameter sequences $K&#95;{t}$ and $S&#95;{t}$, we can obtain the total complexity of <a href="#algorithm-2">Algorithm 2</a> as follows.

<div id="theorem-4.1" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Theorem 4.1 (Theorem 3.1 for $p=2$).</strong> 
Let $D=\left\Vert{\boldsymbol{x}}&#95;{0}-{\boldsymbol{x}}^{&#42;}\right\Vert$ be the distance of the initial point ${\boldsymbol{x}}&#95;{0}\in{\mathcal{X}}$ to the optimal solution ${\boldsymbol{x}}^{&#42;}$.
Under Assumptions <a href="#assumption-2.1">2.1</a>–<a href="#assumption-2.4">2.4</a>, for $p=2$, apply <a href="#algorithm-2">Algorithm 2</a> with parameters
<div>
$$ \displaystyle T=\displaystyle{\mathcal{O}}\left(D\left(\frac{L&#95;{2}}{\epsilon}\right)^{1/2}\right),\quad\eta=\Theta\left(\frac{T}{L&#95;{2}D}\right),\quad M=\Theta(L&#95;{2}), $$
</div>

<div>
$$ \displaystyle K&#95;{t}=\displaystyle{\mathcal{O}}\left(\left(\frac{T}{t+1}\right)^{2/3}\right),\qquad S&#95;{t}=\Theta(\log\log(t+2)), $$
</div>

then the algorithm can ensure ${\rm res}({\boldsymbol{x}}&#95;{T})\leq{\epsilon}$ in the total second-order oracle complexity of

<div>
<a id="eq-13"></a>
$$ {\mathcal{O}}(T\log\log T)=\tilde{\mathcal{O}}(D\left(L&#95;{2}/{\epsilon}\right)^{1/2}). \tag{13} $$
</div>

</div>

<details style="margin:0.5em 0 1em 0; border:1px solid #ddd; border-radius:6px; padding:0.4em 0.8em;"><summary style="cursor:pointer; font-weight:600;">Proof</summary>

Let us prove by induction that our parameter setting ensures the convergence rate of

<div>
<a id="eq-14"></a>
$$ {\rm res}({\boldsymbol{x}}&#95;{T}):=\frac{\Vert{\boldsymbol{x}}&#95;{T}-{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}&#95;{T})\Vert}{\eta}\leq\frac{4D}{\eta(T+1)}. \tag{14} $$
</div>

For $t=0$, we know from the non-expansiveness of ${\boldsymbol{P}}&#95;{\eta}$ and the fixed-point property ${\boldsymbol{x}}^{&#42;}={\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}^{&#42;})$ that

<div>
<a id="eq-15"></a>
$$ \Vert{\boldsymbol{x}}&#95;{0}-{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}&#95;{0})\Vert\leq\Vert{\boldsymbol{x}}&#95;{0}-{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}^{&#42;})\Vert+\Vert{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}^{&#42;})-{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}&#95;{0})\Vert\leq 2\Vert{\boldsymbol{x}}&#95;{0}-{\boldsymbol{x}}^{&#42;}\Vert=2D, \tag{15} $$
</div>

which established the induction base of equation <a href="#eq-14">equation 14</a> by dividing $\eta$ on both sides. Now, we assume equation <a href="#eq-14">equation 14</a> holds for all $t\leq T-1$. Then, $R&#95;{t}:=\Vert{\boldsymbol{x}}&#95;{t}-{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}&#95;{t})\Vert$, the initial distance of <a href="#algorithm-1">Algorithm 1</a> satisfies that

<div>
<a id="eq-16"></a>
$$ R&#95;{t}\leq\frac{4D}{t+1},\quad\forall t=0,\cdots,T-1. \tag{16} $$
</div>

Therefore, by <a href="#lemma-4.2">Lemma 4.2</a>, at each step the resolvent can be solved up to the approximation error $\delta&#95;{t}$ in equation <a href="#eq-9">equation 9</a> under the parameter setting $M=\Theta(L&#95;{2})$,

<div>
$$ K&#95;{t}=\Theta\left((\eta L&#95;{2}R&#95;{t})^{2/3}\right)=\Theta\left(\left(\frac{TR&#95;{t}}{D}\right)^{2/3}\right)={\mathcal{O}}\left(\left(\frac{T}{t+1}\right)^{2/3}\right), $$
</div>

and, by the definition of $\delta&#95;{t}=\Theta(R&#95;{t}/(\sqrt{t+2}\log(t+2))$ in equation <a href="#eq-9">equation 9</a>,

<div>
$$ S&#95;{t}=\Theta\left(\log\log(R&#95;{t}/\delta&#95;{t})\right)=\Theta\left(\log\log(t+2)\right). $$
</div>

Therefore, the inexact condition in <a href="#lemma-4.1">Lemma 4.1</a> is satisfied for $t\leq T-1$, which implies the convergence rate of equation <a href="#eq-14">equation 14</a> for $t=T$ by the lemma. This completes the induction.

Now, substituting our choices of $\eta$ in equation <a href="#eq-14">equation 14</a> yields

<div>
$$ {\rm res}({\boldsymbol{x}}&#95;{T})={\mathcal{O}}\left(L&#95;{2}D^{2}/T^{2}\right), $$
</div>

which is smaller than $\epsilon$ by our setting of $T$. Finally, the total number of oracle calls can be bounded by

<div>
<a id="eq-17"></a>
$$ \sum&#95;{t=0}^{T-1}K&#95;{t}S&#95;{t}={\mathcal{O}}\left(\sum&#95;{t=0}^{T-1}\left(\frac{T}{t+1}\right)^{2/3}\log\log T\right)={\mathcal{O}}(T\log\log T), \tag{17} $$
</div>

which is equivalent to the bound of $\tilde{\mathcal{O}}(D\left(L&#95;{2}/{\epsilon}\right)^{1/2})$ in equation <a href="#eq-13">equation 13</a> by substituting the choice of $T$. ∎

</details>

This theorem shows that the proposed Halpern-NPE converges at a fast rate of $\tilde{\mathcal{O}}(T^{-2})$, which improves both the classical rate of ${\mathcal{O}}(T^{-1.5})$ by NPE <d-cite key="monteiro2012iteration"></d-cite> and the rate of $\tilde{\mathcal{O}}(T^{-1.75})$ via primal-dual A-NPE <d-cite key="chen2025solving"></d-cite> for minimax problems. In the next section, we generalize this theorem to all $p\geq 2$ and achieve the upper bound of $\tilde{\mathcal{O}}(T^{-p})$ claimed by the main <a href="#theorem-3.1">Theorem 3.1</a>.
<a id="5-generalizing-the-result-to-all-p-geq-2"></a>
## 5 Generalizing the Result to All $p\geq 2$

To achieve the rate of $\tilde{\mathcal{O}}(T^{-p})$ for all $p\geq 2$, a natural idea is to also use the Halpern iteration with a large stepsize $\eta=\Theta(T^{p-1})$ and reuse the analysis in the proof of <a href="#theorem-4.1">Theorem 4.1</a>. To ensure that each subproblem is solvable in $\tilde{\mathcal{O}}(1)$ costs like in <a href="#eq-24">equation 24</a>, the sub-solver for the resolvent operator should converges at least $\tilde{\mathcal{O}}(\exp(-\mu^{1/(p-1)}~T))$ for $\mu$-strongly monotone operators, or equivalently (under black-box reductions <d-cite key="allen2016optimal,ostroukhov2020tensor,huang2022approximation,lin2022perseus"></d-cite> ), the $\tilde{\mathcal{O}}(T^{-(p-1)})$ convergence rate for monotone operators.

However, the classical convergence rate of ${\mathcal{O}}(T^{-(p+1)/2})$ achieved by high-order NPE <d-cite key="bullins2022higher,huang2022approximation"></d-cite> does not satisfy the above requirement when $p\geq 4$. In the following, we first introduce an Anchored Tensor Method (ATM) that achieves the required convergence rate of ${\mathcal{O}}(T^{-p})$ in <a href="#5-1-atm-achieves-the-mathcal-o-t-p-1-rate"> Section 5.1 </a>, then we further accelerate it with the Halpern iteration as in $p=2$ to achieve the $\tilde{\mathcal{O}}(T^{-p})$ convergence rate in <a href="#5-2-halpern-atm-achieves-the-tilde-mathcal-o-t-p-rate"> Section 5.2 </a>.

<a id="5-1-atm-achieves-the-mathcal-o-t-p-1-rate"></a>
### 5.1 ATM Achieves the ${\mathcal{O}}(T^{-(p-1)})$ Rate

Recall Section 4.2 that approximating the resolvent is ${\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}})=({\rm Id}+\eta({\boldsymbol{F}}+{\mathcal{N}}&#95;{\mathcal{X}}))^{-1}({\boldsymbol{x}})$ is equivalent to solving the MVI problem induced by the $\eta^{-1}$-strongly monotone operator ${\boldsymbol{G}}({\boldsymbol{y}}):={\boldsymbol{F}}({\boldsymbol{y}})+({\boldsymbol{y}}-{\boldsymbol{x}})/\eta$. We introduce a novel Anchored Tensor Method (ATM) that can solve the problem in the $p$th-order oracle complexity of ${\mathcal{O}}(\eta^{1/(p-1)})$. It also implies a complexity of ${\mathcal{O}}({\epsilon}^{-1/(p-1)})$ for finding an ${\epsilon}$-solution in the monotone case by applying the same algorithm on an ${\epsilon}$-regularized operator <d-cite key="chen2026solving"></d-cite> .

<div style="text-align:center; margin:1.5em 0;"><a id="algorithm-3"></a>
<img src="/2027/assets/img/2027-04-30-halpern-npe/algo3.png" alt="Algorithm 3" style="max-width:100%; border:1px solid #ddd; border-radius:4px;" loading="lazy"/></div>

The starting point of the anchored tensor method is the following local convergence guarantee for the tensor step <d-cite key="huang2022approximation,lin2022perseus"></d-cite> .

<div id="lemma-5.1" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Lemma 5.1 ( Theorem 3.5 of <d-cite key="lin2022perseus"></d-cite> ).</strong> Let the operator ${\boldsymbol{G}}:{\mathcal{X}}\to{\mathbb{R}}^{d}$ be $L&#95;{p}$-$pth$-order smooth satisfying <a href="#eq-5">equation 5</a> and $\mu$-strongly monotone satisfying <a href="#eq-12">equation 12</a>. There exists a numerical constant $C$ such that The tensor step ${\boldsymbol{y}}^{+}={\mathcal{T}}&#95;{\boldsymbol{G}}^{p}({\boldsymbol{y}};CL&#95;{p})$ satisfies

<div>
$$ \Vert{\boldsymbol{y}}^{+}-{\boldsymbol{y}}^{&#42;}\Vert\leq\sqrt{C&#95;{p}\eta L&#95;{p}}\Vert{\boldsymbol{y}}-{\boldsymbol{y}}^{&#42;}\Vert^{(p+1)/2},\quad C&#95;{p}:=\frac{2^{p}(5p-2)}{p!}, $$
</div>

where ${\boldsymbol{y}}^{&#42;}=({\boldsymbol{G}}+{\mathcal{N}}&#95;{\mathcal{X}})^{-1}({\boldsymbol{0}})$ is the unique solution to the MVI induced by ${\boldsymbol{G}}$.
</div>

Define the local region radius $\rho(\mu)$ and contraction factor $\theta&#95;{p}$ indicated by this lemma as

<div>
$$ \rho(\mu):=\frac{1}{2}\left(\frac{\mu}{C&#95;{p}L&#95;{p}}\right)^{1/(p-1)},\qquad\theta&#95;{p}:=2^{-(p-1)/2}&lt;1. $$
</div>

Consequently, <a href="#lemma-5.1">Lemma 5.1</a> implies hat

<div>
<a id="eq-18"></a>
$$ \Vert{\boldsymbol{y}}-{\boldsymbol{y}}^{&#42;}\Vert\leq\rho(\mu)\quad\Longrightarrow\quad\Vert{\boldsymbol{y}}^{+}-{\boldsymbol{y}}^{&#42;}\Vert\leq\theta&#95;{p}\rho(\mu). \tag{18} $$
</div>

It means that whenever ${\boldsymbol{y}}$ enters the local region, the tensor update converges superlinearly to the minimizer. Based on this observation, we formally propose a two-phase Anchored Tensor Method in <a href="#algorithm-3">Algorithm 3</a>:

1. In the first phase with $K$ iterations, the algorithm iteratively performs the tensor step on the anchored/regularized operator ${\boldsymbol{G}}&#95;{k}({\boldsymbol{y}}):={\boldsymbol{G}}({\boldsymbol{y}})+(\mu&#95;{k}-\mu)({\boldsymbol{y}}-{\boldsymbol{y}}&#95;{0})$. The anchoring coefficient $\mu&#95;{k}$ is chosen such that every tensor step lies in the local superlinear convergence region and $\mu&#95;{k}$ decreases over iterations as the algorithm approaches the minimizer.

2. At the beginning of the second phase, the anchoring coefficient $\mu&#95;{K}$ has decreased to $\mu&#95;{K}=\mu$ and the algorithm has entered the local region for the unregularized operator ${\boldsymbol{G}}$. Therefore, the second phase reaches an $\delta$-solution in additional $S={\mathcal{O}}(\log\log\delta)$ iterations.

To analyze the ATM method, we first give two lemmas for the anchored operator.

<div id="lemma-5.2" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Lemma 5.2 ( Lemma A.1 of <d-cite key="chen2024near"></d-cite> ).</strong> Let the operator ${\boldsymbol{G}}$ with MVI solution ${\boldsymbol{y}}^{&#42;}$ satisfies Assumptions <a href="#assumption-2.1">2.1</a>–<a href="#assumption-2.3">2.3</a>. For $\nu>0$, we define ${\boldsymbol{G}}&#95;{\nu}({\boldsymbol{y}})={\boldsymbol{G}}({\boldsymbol{y}})+\nu({\boldsymbol{y}}-{\boldsymbol{y}}&#95;{0})$ be the regularized operator, and let ${\boldsymbol{y}}&#95;{\nu}^{&#42;}$ be the unique solution of $0\in{\boldsymbol{F}}&#95;{\nu}({\boldsymbol{y}})+{\mathcal{N}}&#95;{{\mathcal{X}}}({\boldsymbol{y}})$. Then

<div>
$$ {\left\Vert{\boldsymbol{y}}&#95;{\nu}^{&#42;}-{\boldsymbol{y}}&#95;{0}\right\Vert^{2}+\left\Vert{\boldsymbol{y}}&#95;{\nu}^{&#42;}-{\boldsymbol{y}}^{&#42;}\right\Vert^{2}\leq\left\Vert{\boldsymbol{y}}&#95;{0}-{\boldsymbol{y}}^{&#42;}\right\Vert^{2}} $$
</div>
</div>

<div id="lemma-5.3" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Lemma 5.3 (Stability of anchoring).</strong> Under Assumptions <a href="#assumption-2.1">2.1</a>–<a href="#assumption-2.3">2.3</a>, for every $\nu&#95;{1}>\nu&#95;{2}>0$,

<div>
$$ \Vert{\boldsymbol{y}}&#95;{\nu&#95;{1}}^{&#42;}-{\boldsymbol{y}}&#95;{\nu&#95;{2}}^{&#42;}\Vert\leq\left(1-\frac{\nu&#95;{2}}{\nu&#95;{1}}\right)\Vert{\boldsymbol{y}}&#95;{0}-{\boldsymbol{y}}^{&#42;}\Vert. $$
</div>
</div>

<details style="margin:0.5em 0 1em 0; border:1px solid #ddd; border-radius:6px; padding:0.4em 0.8em;"><summary style="cursor:pointer; font-weight:600;">Proof</summary>

The first-order optimality conditions of ${\boldsymbol{y}}&#95;{\nu&#95;{1}}^{&#42;}$ and ${\boldsymbol{y}}&#95;{\nu&#95;{2}}^{&#42;}$ indicate that $-\nu&#95;{1}({\boldsymbol{y}}&#95;{\nu&#95;{1}}^{&#42;}-{\boldsymbol{y}}&#95;{0})\in{\boldsymbol{G}}({\boldsymbol{y}}&#95;{\nu&#95;{1}}^{&#42;})+{\mathcal{N}}&#95;{\mathcal{X}}({\boldsymbol{y}}&#95;{\nu&#95;{1}}^{&#42;})$ and $-\nu&#95;{2}({\boldsymbol{y}}&#95;{\nu&#95;{2}}^{&#42;}-{\boldsymbol{y}}&#95;{0})\in{\boldsymbol{G}}({\boldsymbol{y}}&#95;{\nu&#95;{2}}^{&#42;})+{\mathcal{N}}&#95;{\mathcal{X}}({\boldsymbol{y}}&#95;{\nu&#95;{2}}^{&#42;})$. Then, the monotonicity of ${\boldsymbol{G}}+{\mathcal{N}}&#95;{{\mathcal{X}}}$ gives

<div>
$$ \left\langle-\nu&#95;{1}({\boldsymbol{y}}&#95;{\nu&#95;{1}}-{\boldsymbol{y}}&#95;{0})+\nu&#95;{2}({\boldsymbol{y}}&#95;{\nu&#95;{2}}-{\boldsymbol{x}}&#95;{0}),{\boldsymbol{y}}&#95;{\nu&#95;{1}}-{\boldsymbol{y}}&#95;{\nu&#95;{2}}\right\rangle\geq 0. $$
</div>

Using ${\boldsymbol{y}}&#95;{\nu&#95;{1}}-{\boldsymbol{y}}&#95;{0}=({\boldsymbol{y}}&#95;{\nu&#95;{1}}-{\boldsymbol{y}}&#95;{\nu&#95;{2}})+({\boldsymbol{y}}&#95;{\nu&#95;{2}}-{\boldsymbol{y}}&#95;{0})$ and <a href="#lemma-5.2">Lemma 5.2</a>, we obtain

<div>
$$ (\nu&#95;{1}-\nu&#95;{2})\Vert{\boldsymbol{y}}&#95;{0}-{\boldsymbol{y}}^{&#42;}\Vert\left\Vert{\boldsymbol{y}}&#95;{\nu&#95;{1}}-{\boldsymbol{y}}&#95;{\nu&#95;{2}}\right\Vert\geq\nu&#95;{1}\left\Vert{\boldsymbol{y}}&#95;{\nu&#95;{1}}-{\boldsymbol{y}}&#95;{\nu&#95;{2}}\right\Vert^{2}. $$
</div>

∎

</details>

<!-- <a href="#lemma-5.3">Lemma 5.3</a> follows from the first-order optimality condition of ${\boldsymbol{y}}&#95;{\nu}^{&#42;}$ and the monotonicity of ${\boldsymbol{G}}$.  -->
With the help of these two lemmas, we carefully design the schedule of $\mu&#95;{k}$ such that the local region $r&#95;{k}$ contracts fast. Let $C&#95;{p}$ and $\theta&#95;{p}$ be the constants implied by <a href="#lemma-5.1">Lemma 5.1</a>, we define

<div>
<a id="eq-19"></a>
$$ r&#95;{k}:=\max\left\{\rho(\mu),\left(\frac{1}{R}+\frac{k(1-\theta&#95;{p})}{2R(p-1)}\right)^{-1}\right\},\qquad\mu&#95;{k}:=\rho^{-1}(r&#95;{k})=C&#95;{p}L&#95;{p}(2r&#95;{k})^{p-1}, \tag{19} $$
</div>

where $R>0$ satisfies $\Vert{\boldsymbol{y}}&#95;{0}-{\boldsymbol{y}}^{&#42;}\Vert\leq R$. By this definition, $r&#95;{k}$ is decreasing from $r&#95;{0}$ that satisfies $r&#95;{0}\leq R$ to $\rho(\mu)$. Consequently, $\mu&#95;{j}$ is decreasing from $\mu&#95;{0}$ such that $\mu&#95;{0}\geq\rho^{-1}(R)$ to $\mu$. We summarize the properties of these sequences in the following.

<div id="lemma-5.4" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Lemma 5.4.</strong> The sequences $\{r&#95;{k}\}&#95;{k=0}^{K-1}$ and $\{\mu&#95;{k}\}&#95;{k=0}^{K-1}$ defined in <a href="#eq-19">equation 19</a> satisfy:<br>
(a) $r&#95;{k+1}/r&#95;{k}\geq(1+\theta&#95;{p})/2$.
(b) $1-\mu&#95;{k+1}/\mu&#95;{k}\leq(1-\theta&#95;{p})r&#95;{k}/(2R)$.
</div>

<details style="margin:0.5em 0 1em 0; border:1px solid #ddd; border-radius:6px; padding:0.4em 0.8em;"><summary style="cursor:pointer; font-weight:600;">Proof</summary>

Note that we only need to prove the inequalities hold before $r&#95;{k}$ reaches $\rho(\mu)$, or, equivalently, before $\mu&#95;{k}$ reaches $\mu$. Then, the truncated $r&#95;{k}$ and $\mu&#95;{k}$ after that trivially satisfy the same inequalities.

<br><strong>Proof of Part (a).</strong> From the definition of $r&#95;{k}$ in <a href="#eq-19">equation 19</a>, we have

<div>
$$ \frac{1}{r&#95;{k+1}}-\frac{1}{r&#95;{k}}\leq\frac{1-\theta&#95;{p}}{2R(p-1)}. $$
</div>

Rearranging, we have

<div>
<a id="eq-22"></a>
$$ \frac{r&#95;{k+1}}{r&#95;{k}}\geq\left(1+\frac{(1-\theta&#95;{p})r&#95;{k}}{2R(p-1)}\right)^{-1} \tag{22} $$
</div>

Finally, using the inequality $(1+x)^{-1}\geq 1-x$ for $x\geq 0$ and the facts $r&#95;{k}\leq R$ and $p\geq 2$ gives

<div>
$$ \frac{r&#95;{k+1}}{r&#95;{k}}\geq 1-\frac{(1-\theta&#95;{p})r&#95;{k}}{2R(p-1)}\geq 1-\frac{1-\theta&#95;{p}}{2}=\frac{1+\theta&#95;{p}}{2}. $$
</div>

<strong>Proof of Part (b).</strong> From the definition of $\mu&#95;{k}$ and $r&#95;{k}$ in <a href="#eq-19">equation 19</a>, we have

<div>
$$ 1-\frac{\mu&#95;{k+1}}{\mu&#95;{k}}=1-\left(\frac{r&#95;{k+1}}{r&#95;{k}}\right)^{p-1} $$
</div>

Using <a href="#eq-22">equation 22</a> and then applying the inequality $1-(1+x)^{-(p-1)}\leq(p-1)x$ for $x\geq 0$, we obtain that

<div>
$$ 1-\frac{\mu&#95;{k+1}}{\mu&#95;{j}}=1-\left(\frac{r&#95;{k+1}}{r&#95;{k}}\right)^{p-1}\leq 1-\left(1+\frac{(1-\theta&#95;{p})r&#95;{k}}{2R(p-1)}\right)^{p-1}\leq\frac{(1-\theta&#95;{p})r&#95;{k}}{2R} $$
</div>

∎

</details>

<!-- <details style="margin:0.5em 0 1em 0; border:1px solid #ddd; border-radius:6px; padding:0.4em 0.8em;"><summary style="cursor:pointer; font-weight:600;">Proof of part 1.</summary>


</details> -->

<!-- <details style="margin:0.5em 0 1em 0; border:1px solid #ddd; border-radius:6px; padding:0.4em 0.8em;"><summary style="cursor:pointer; font-weight:600;">Proof of part 2.</summary>


</details> --> 

Now, we are ready to give the complexity bound of the ATM (<a href="#algorithm-3">Algorithm 3</a>).

<div id="theorem-5.1" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Theorem 5.1.</strong> Let the operator ${\boldsymbol{G}}:{\mathcal{X}}\to{\mathbb{R}}^{d}$ be $L&#95;{p}$-$p$th-order smooth satisfying <a href="#eq-5">equation 5</a> and $\mu$-strongly monotone satisfying <a href="#eq-12"> equation 12 </a>. Apply <a href="#algorithm-3">Algorithm 3</a> with the parameters

<div>
$$ M=\Theta(L&#95;{p}),\quad K={\mathcal{O}}\left(R(L&#95;{p}/\mu)^{1/(p-1)}\right),\quad S={\mathcal{O}}(\log\log(D/\delta)) $$
</div>

can return a point ${\boldsymbol{y}}&#95;{K+S}\in{\mathcal{X}}$ such that $\Vert{\boldsymbol{y}}&#95;{K+S}-{\boldsymbol{y}}^{&#42;}\Vert\leq\delta$ in the total $p$th-order oracle complexity of $K+S$, where ${\boldsymbol{y}}^{&#42;}=({\boldsymbol{G}}+{\mathcal{N}}&#95;{\mathcal{X}})^{-1}({\boldsymbol{0}})$ is the unique solution to the MVI induced by ${\boldsymbol{G}}$ and $R=\Vert{\boldsymbol{y}}&#95;{0}-{\boldsymbol{y}}^{&#42;}\Vert$.
</div>

<details style="margin:0.5em 0 1em 0; border:1px solid #ddd; border-radius:6px; padding:0.4em 0.8em;"><summary style="cursor:pointer; font-weight:600;">Proof</summary>

Let us prove by induction that our parameter setting ensures that

<div>
<a id="eq-20"></a>
$$ \Vert{\boldsymbol{y}}&#95;{k}-{\boldsymbol{y}}&#95;{k}^{&#42;}\Vert\leq r&#95;{k}=\rho(\mu&#95;{k}), \tag{20} $$
</div>

where ${\boldsymbol{y}}&#95;{k}^{&#42;}$ is the unique solution of the MVI induced by the anchored operator ${\boldsymbol{G}}&#95;{k}$ that satisfies $0\in{\boldsymbol{G}}&#95;{k}({\boldsymbol{y}})+{\mathcal{N}}&#95;{\mathcal{X}}({\boldsymbol{y}})$. For $k=0$, we know from <a href="#lemma-5.2">Lemma 5.2</a> that $\Vert{\boldsymbol{y}}&#95;{0}-{\boldsymbol{y}}&#95;{0}^{&#42;}\Vert\leq R$, which established the induction base since $r&#95;{0}=R$ by definition. Now, we assume equation <a href="#eq-20">equation 20</a> holds for the $k$th iteration. Then, by equation <a href="#eq-18">equation 18</a>,

<div>
$$ \Vert{\boldsymbol{y}}&#95;{k+1}-{\boldsymbol{y}}&#95;{k}^{&#42;}\Vert\leq\theta&#95;{p}r&#95;{k}. $$
</div>

Moreover, by <a href="#lemma-5.3">Lemma 5.3</a> and <a href="#lemma-5.4">Lemma 5.4</a> (part 2), we have

<div>
$$ \Vert{\boldsymbol{y}}&#95;{k+1}^{&#42;}-{\boldsymbol{y}}&#95;{k}^{&#42;}\Vert\leq\left(1-\frac{\mu&#95;{k+1}}{\mu&#95;{k}}\right)R\leq\frac{(1-\theta&#95;{p})r&#95;{k}}{2}. $$
</div>

Combining the above two inequalities and using the triangle inequality, we obtain

<div>
$$ \Vert{\boldsymbol{y}}&#95;{k+1}-{\boldsymbol{y}}&#95;{k+1}^{&#42;}\Vert\leq\Vert{\boldsymbol{y}}&#95;{k+1}-{\boldsymbol{y}}&#95;{k}^{&#42;}\Vert+\Vert{\boldsymbol{y}}&#95;{k+1}^{&#42;}-{\boldsymbol{y}}&#95;{k}^{&#42;}\Vert\leq\frac{(1+\theta&#95;{p})r&#95;{k}}{2}\leq r&#95;{k+1}, $$
</div>

where the last step uses <a href="#lemma-5.4">Lemma 5.4</a> (part 1). This completes the induction. Consequently, all the tensor step in phase 1 lies in the local superlinear convergence region in <a href="#lemma-5.1">Lemma 5.1</a>. We let the total number of iterations of phase 1 be the smallest number such that $\mu&#95;{k}$ decays to $\mu$. By equation <a href="#eq-19">equation 19</a>, such a $K$ satisfies

<div>
$$ K={\mathcal{O}}\left(R(L&#95;{p}/\mu)^{1/(p-1)}\right). $$
</div>

After phase 1 ends, we have $\mu&#95;{K}=\mu$ and thus ${\boldsymbol{G}}&#95;{K}={\boldsymbol{G}}$. Since the initialization of phase 2 already lies in the local region for ${\boldsymbol{G}}$, by equation <a href="#eq-18">equation 18</a>, phase 2 can find a $\delta$-solution in $S={\mathcal{O}}(\log\log(D/\delta)$ iterations. ∎

</details>

Treating the ${\mathcal{O}}(\log\log(D/\delta))$ factor as a constant, the above theorem shows that ATM achieves a new complexity upper bound of ${\mathcal{O}}((L&#95;{p}/\mu)^{1/(p-1)})$ for $L&#95;{p}$-$p$th-order smooth and $\mu$-strongly monotone operators. This improves the classical ${\mathcal{O}}((L&#95;{p}/\mu)^{2/(p+1)})$ complexity achieved by high-order NPE <d-cite key="monteiro2012iteration,bullins2022higher,lin2022perseus,huang2022approximation,adil2022optimal"></d-cite> for any $p\geq 4$. As we have discussed, it also implies a complexity of ${\mathcal{O}}({\epsilon}^{-1/(p-1)})$ for finding an ${\epsilon}$-solution in the monotone case by applying the same algorithm on an ${\epsilon}$-regularized operator <d-cite key="chen2026solving"></d-cite> .

<a id="5-2-halpern-atm-achieves-the-tilde-mathcal-o-t-p-rate"></a>
### 5.2 Halpern-ATM Achieves the $\tilde{\mathcal{O}}(T^{-p})$ Rate

<div style="text-align:center; margin:1.5em 0;"><a id="algorithm-4"></a>
<img src="/2027/assets/img/2027-04-30-halpern-npe/algo4.png" alt="Algorithm 4" style="max-width:100%; border:1px solid #ddd; border-radius:4px;" loading="lazy"/></div>

The sequence $R_t=4D/(t+1)$ used in <a href="#algorithm-4">Algorithm 4</a> is defined in <a href="#eq-16">equation 16</a>.

The ATM introduced in the previous section achieves the complexity upper bound of $\tilde{\mathcal{O}}({\epsilon}^{-1/(p-1)})$ for monotone problems. In this section, we further show an accelerated complexity of $\tilde{\mathcal{O}}({\epsilon}^{-1/p})$ by applying ATM to solve the resolvent operator in the Halpern iteration in Section 4.1. We present the resulting method in <a href="#algorithm-4">Algorithm 4</a>. In light of <a href="#theorem-4.1">Theorem 4.1</a>, we choose a large stepsize $\eta=\Theta(T^{p-1})$, which indicates that the outer Halpern iteration converges at the rate of ${\mathcal{O}}((\eta T)^{-1})={\mathcal{O}}(T^{-p})$. We can then complete the proof by providing a global upper bound of the total oracle complexity via a similar analysis to the proof of <a href="#theorem-4.1">Theorem 4.1</a> in $p=2$. This leads to the following main theorem.

<div id="theorem-5.2" class="theorem-block" style="border-left:3px solid #7a5195; padding:0.6em 1em; margin:1em 0; background:#f8f6fb;">
<strong>Theorem 5.2 (Full version of Theorem 3.1 ).</strong>
Let $D=\left\Vert{\boldsymbol{x}}&#95;{0}-{\boldsymbol{x}}^{&#42;}\right\Vert$ is the distance of the initial point ${\boldsymbol{x}}&#95;{0}\in{\mathcal{X}}$ to the optimal solution ${\boldsymbol{x}}^{&#42;}$. Under Assumptions <a href="#assumption-2.1">2.1</a>–<a href="#assumption-2.4">2.4</a>, for any integer $p\geq 2$, apply <a href="#algorithm-4">Algorithm 4</a> with parameters
<div>
$$ \displaystyle T=\displaystyle{\mathcal{O}}\left(D\left(\frac{L&#95;{p}}{\epsilon}\right)^{1/p}\right),\quad\eta=\Theta\left(\frac{T^{p-1}}{L&#95;{p}D^{p-1}}\right),\quad M=\Theta(L&#95;{p}), $$
</div>

<div>
$$ \displaystyle K&#95;{t}=\displaystyle{\mathcal{O}}\left(\frac{T}{t+1}\right),\qquad S&#95;{t}=\Theta(\log\log(t+2)), $$
</div>

then the algorithm can ensure ${\rm res}({\boldsymbol{x}}&#95;{T})\leq{\epsilon}$ in the total $p$th-order oracle complexity of

<div>
<a id="eq-21"></a>
$$ {\mathcal{O}}(T\log T)=\tilde{\mathcal{O}}(D\left(L&#95;{p}/{\epsilon}\right)^{1/p}). \tag{21} $$
</div>

</div>

<details style="margin:0.5em 0 1em 0; border:1px solid #ddd; border-radius:6px; padding:0.4em 0.8em;"><summary style="cursor:pointer; font-weight:600;">Proof</summary>

Following the proof of <a href="#theorem-4.1">Theorem 4.1</a>, we show by induction that our parameter setting ensures the convergence rate of

<div>
<a id="eq-23"></a>
$$ {\rm res}({\boldsymbol{x}}&#95;{T}):=\frac{\Vert{\boldsymbol{x}}&#95;{T}-{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}&#95;{T})\Vert}{\eta}\leq\frac{4D}{\eta(T+1)}. \tag{23} $$
</div>

The induction base of $t=0$ follows from equation <a href="#eq-15">equation 15</a> by dividing $\eta$ on both sides. Now, we assume equation <a href="#eq-23">equation 23</a> holds for all $t\leq T-1$. Then, $R&#95;{t}:=\Vert{\boldsymbol{x}}&#95;{t}-{\boldsymbol{P}}&#95;{\eta}({\boldsymbol{x}}&#95;{t})\Vert$, the initial distance of <a href="#algorithm-3">Algorithm 3</a> satisfies

<div>
$$ R&#95;{t}\leq\frac{4D}{t+1},\quad\forall t=0,\cdots,T-1. $$
</div>

Therefore, by <a href="#theorem-5.1">Theorem 5.1</a>, at each step the resolvent can be solved up to the approximation error $\delta&#95;{t}$ in equation <a href="#eq-9">equation 9</a> under the parameter setting $M=\Theta(L&#95;{p})$,

<div>
$$ K&#95;{t}=\Theta\left(R&#95;{t}(\eta L&#95;{p})^{1/(p-1)})\right)=\Theta\left(\frac{TR&#95;{t}}{D}\right)={\mathcal{O}}\left(\frac{T}{t+1}\right), $$
</div>

and, by the definition of $\delta&#95;{t}=\Theta(R&#95;{t}/(\sqrt{t+2}\log(t+2))$ in equation <a href="#eq-9">equation 9</a>,

<div>
$$ S&#95;{t}=\Theta\left(\log\log(R&#95;{t}/\delta&#95;{t})\right)=\Theta\left(\log\log(t+2)\right). $$
</div>

Therefore, the inexact condition in <a href="#lemma-4.1">Lemma 4.1</a> is satisfied for $t\leq T-1$, which implies the convergence rate of equation <a href="#eq-23">equation 23</a> for $t=T$ by the lemma. This completes the induction.

Now, substituting our choices of $\eta$ in equation <a href="#eq-23">equation 23</a> yields

<div>
$$ {\rm res}({\boldsymbol{x}}&#95;{T})={\mathcal{O}}\left(L&#95;{p}D^{p}/T^{p}\right), $$
</div>

which is smaller than $\epsilon$ by our setting of $T={\mathcal{O}}(D\left(L&#95;{p}/{\epsilon}\right)^{1/p})$. Finally, the total number of oracle calls can be bounded by

<div>
<a id="eq-24"></a>
$$ \sum&#95;{t=0}^{T-1}K&#95;{t}+S&#95;{t}={\mathcal{O}}\left(\sum&#95;{t=0}^{T-1}\left(\frac{T}{t+1}+\log\log(t+2)\right)\right)={\mathcal{O}}(T\log T), \tag{24} $$
</div>

which is equivalent to the bound of $\tilde{\mathcal{O}}(D\left(L&#95;{p}/{\epsilon}\right)^{1/p})$ in equation <a href="#eq-21">equation 21</a> by substituting the choice of $T$. ∎

</details>

<!-- The proof can be done by replacing the sub-solver in $p=2$ with ATM for general $p\geq 2$ and following the analysis in the proof of <a href="#theorem-4.1">Theorem 4.1</a>. The formal proof is contained in Appendix C.  -->
This theorem shows that the proposed Halpern-ATM converges at a fast rate of $\tilde{\mathcal{O}}(T^{-p})$, which improves both the classical rate of ${\mathcal{O}}(T^{-2/(p+1)})$ by high-order NPE <d-cite key="bullins2022higher,adil2022optimal,lin2022perseus,huang2022approximation"></d-cite> and the rate of $\tilde{\mathcal{O}}(T^{-4/(3p+1)})$ via high-order primal-dual A-NPE <d-cite key="chen2026solving"></d-cite> for minimax problems.
<!-- <a id="6-conclusion-and-future-work"></a> ## 6 Conclusion and Future Work In this paper, we propose a novel Halpern-NPE method that achieves a fast convergence rate of $\tilde{\mathcal{O}}(T^{-2})$ for solving MVI problems, which improves the classical rate of ${\mathcal{O}}(T^{-1.5})$ by NPE <d-cite key="monteiro2012iteration"></d-cite> and the rate of $\tilde{\mathcal{O}}(T^{-1.75})$ via primal-dual A-NPE <d-cite key="chen2025solving"></d-cite> for minimax problems. We also provide the $p$th-order generalization of our method, which can achieve the fast rate of $\tilde{\mathcal{O}}(T^{-p})$. However, the optimality of our methods remains open for $p\geq 2$, where the lower bound in <d-cite key="chen2026solving"></d-cite> is $\Omega(T^{-2.5})$ for $p=2$ and $\Omega(T^{-(3p-1)/2})$ in general. We hope the gap can be closed in future work. -->

<a id="appendix-d-the-original-ai-provided-algorithm"></a>
## Appendix: The Original AI-Provided Algorithm

The initial resolvent sub-solver generated by AI has triple loops, whose full procedure is presented in <a href="#algorithm-5">Algorithm 5</a>. The initial proof by AI is also accessible through the following link: [chatgpt.com/share/6a6c372c-6efc-83e8-a378-c6aa1ea3b527](https://chatgpt.com/share/6a6c372c-6efc-83e8-a378-c6aa1ea3b527).

The authors simplified the algorithm and its proof, using the Restarted-NPE algorithm <d-cite key="huang2022approximation"></d-cite> for $p=2$ and the single-loop Anchored-Tensor-Method introduced in <a href="#algorithm-3">Algorithm 3</a> for general $p\geq 2$.

<div style="text-align:center; margin:1.5em 0;"><a id="algorithm-5"></a>
<img src="/2027/assets/img/2027-04-30-halpern-npe/algo5.png" alt="Algorithm 5" style="max-width:100%; border:1px solid #ddd; border-radius:4px;" loading="lazy"/></div>

{% endraw %}
