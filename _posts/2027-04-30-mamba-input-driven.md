---
layout: distill
title: "Mamba as a Hierarchy of Input-Driven Linear Systems"
date: 2027-04-30
description: "Mamba's building block is a data-driven linear dynamical system. This post presents an interactive guide to these basic units through small hand-set demonstrations. We start with a single real and complex pole, continue through latches, a gyroscope–compass filter, path integration and a rhythm grammar and end up with the full Mamba-3 block."
future: true
htmlwidgets: true
# tags: mamba, state-space-models, linear-systems, interactive
# categories: []
# related_posts: false
authors:
    - name: Anonymous
bibliography: 2027-04-30-mamba-input-driven.bib
toc: 
  - name: A Single Linear System
  - name: Letting the Input Steer the System
  - name: Rotation and Decay in One Pole
  - name: Stacking Layers
  - name: "Back to Language: A Rhythm Grammar"
  - name: "Putting it Together: The Mamba-3 Block"
---

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@400;500;600&display=swap">
<link rel="stylesheet" href="{{ '/assets/html/2027-04-30-mamba-input-driven/mamba.css' | relative_url }}">

The goal of this post it to look at the Mamba architecture from a different perspective than how it
is explained in the original papers<d-cite key="mamba1,mamba2,mamba3"></d-cite>. Instead of focusing 
on efficient hardware implementation, relation to Transformers and various state-space models, or
scaling to language modelling -- which are all definitely important -- we are taking the basic
computational unit of the architecture, the _data-dependent linear dynamical system_, and visually
demonstrate its capabilities given various parametrization choices. Using small examples with all
parameters set by hand we hope to explain all the bells and whistles of these units as used by 
Mamba. When trained, the units will not always specialize this clearly but will be required to 
fulfill multiple roles, but their capabilities will still be there.

If you have not read the Mamba papers, the high-level picture is that they sit well between
Transformers and recurrent networks. Thanks to its design, Mamba has been shown to be related to the
linear attention and can be trained in parallel over the whole sequence (like Transformers and
unlike RNNs), while it is still recurrent in nature, so it requires only constant compute per
inference time-step (unlike Transformers and like RNNs). It belongs to the state-space models (SSM)
family and with Mamba in particular we talk about _selective_ SSMs (i.e. data-dependent SSMs).

Throughout the post, the model is treated as a driven system. An input sequence goes in, an output
sequence comes out and the question is which input–output mappings the model can represent. Instead
of focusing on discrete problems like the language modelling the papers consider, the examples focus
more on control of general dynamical systems with both continuous and discrete inputs and outputs.

## Part 1: A Single Linear System {#a-single-linear-system}

Let us start with the simplest member of the family, a linear time-invariant (LTI) state-space model.
Its state vector $$h(t) \in \mathbb{C}^n$$ evolves in continuous time as

$$
\begin{aligned}
h'(t) &= A h(t) + B x(t)\;, \\
y(t) &= C h(t)
\end{aligned} \tag{1} \label{eq:continuous}
$$

with a fixed $$n \times n$$ matrix $$A$$. In Mamba, the matrix $$A$$ is always diagonal. This makes
things simple, effectively splitting the system into $$n$$-independent scalar linear systems. Almost
all LTI systems can be written this way<d-footnote markdown="span">Consider a system $$h' = A h$$ 
with $$A$$ being a full $$n \times n$$ matrix (ignoring the control part $$B x$$ for the moment). Finding 
  the eigen-vectors of the matrix we get $$A T = T D$$, where $$T$$ is a matrix with eigen-vectors 
  as its columns and $$D$$ is a diagonal
matrix with eigen-values on the diagonal. We can use $$T$$ to transform the state into the coordinate
system of the eigen-vectors, $$h = T \tilde{h}$$, and rewrite the original differential equation:
$$T \tilde{h}' = A T \tilde{h}$$, so $$\tilde{h}' = T^{-1} A T \tilde{h} = D \tilde{h}$$. So, what
Mamba does is that it just starts from this re-parametrization with diagonal matrix. Mamba also uses only 
one eigenvalue from the conjugate pair of complex eigenvalues. You can see in <a class="figref" href="#fig-mode">Figure 
    1</a> that with real-valued output, they both produce the same dynamics. Btw, this 
  parametrization is often used in control as it allows to [study the stability and controllability 
  of the
system](https://www.youtube.com/watch?v=nyqJJdhReiA). </d-footnote>. In control we would be talking 
about modes of the system, Mamba calls them simply channels. 

A single scalar linear system thus reads

$$
\begin{aligned}
h'(t) &= a h(t) + b x(t)\;, \\
y(t) &= \operatorname{Re}\big(c h(t)\big)\;.
\end{aligned} \tag{2} \label{eq:continuous_scalar}
$$

Mamba works with a discretized version of these equations<d-footnote markdown="span">Like the first 
two versions of Mamba architectures we start with a simple [zero-order
hold](https://en.wikipedia.org/wiki/Discretization#discrete_function) with step size $$\Delta$$
first and we will return to the more precise trapezoidal discretization introduced in Mamba 3 later
in Part 4.</d-footnote> with step-size $$\Delta$$ 

$$
\begin{aligned}
h_t &= \bar a h_{t-1} + \bar b x_t\;, \\
y_t &= \operatorname{Re}\big(c h_t\big)\;, \\
\bar a &= e^{\Delta a}, \\
\bar b &= \frac{e^{\Delta a}-1}{a}\, b.
\end{aligned} \tag{3} \label{eq:discretized}
$$

To make things really simple we fix $$b = -a$$ and $$c = 1$$. That gives $$\bar b = 1-\bar a$$ and 
thus for a constant input the output settles at exactly the input value whatever $$a$$ is (i.e. the 
system has a gain of one at frequency 0). This allows us to observe the effect of $$\bar a$$ on the 
shape of the system's response without mixing it with a change of it overall size. We will let go of 
this simplification in Part 2.

A real model runs many such systems in parallel in one layer and consists of many layers, but most 
of its behavior is already visible in simple hand-designed examples with one or two such systems 
cooperating.

### Poles

Control theory calls $$\bar a$$ the _pole_ of the mode. Placed in the complex plane, with the unit
circle as the border between forgetting and exploding, the pole shows the whole behavior of a mode
at a glance. Its distance from the origin sets the memory, its angle the oscillation.

In the discrete recurrence, eq \ref{eq:discretized}, each step multiplies the state by $$\bar a$$, so an 
input that arrived $$k$$ steps ago has by now been multiplied by $$\bar a^{k}$$. If $$a = -\alpha$$ 
is real and negative, the discrete pole $$\bar a = e^{-\alpha\Delta}$$ lands on the segment between 
0 and 1, the mode can only decay. For positive $$a$$ the state grows without bounds which is 
undesirable for the control of the system. We call $$\alpha$$ the decay rate (or dumping factor) of 
the mode, it determines how fast the "memory" of the state fades. If $$a = -\alpha + i\omega$$ is 
complex, $$\bar a = e^{-\alpha\Delta}e^{i\omega\Delta}$$ can sit anywhere inside the unit disk, the 
state decays and rotates. Here $$\omega$$ is the oscillation frequency<d-footnote markdown="span">
Both kinds of poles matter for this story. S4<d-cite key="s4"></d-cite> and its diagonal variant 
S4D<d-cite key="s4d"></d-cite> used complex data-independent modes, the same as in this example. 
Mamba-1 and Mamba-2 restricted the state matrix to real values but let them be driven by the input, 
which they found sufficient for language. Mamba-3 brings complex, rotating state back.</d-footnote>.

The interactive <a class="figref" href="#fig-mode">Figure 1</a> below lets you move a pole and watch what it does.

### Two views of the same computation

<a class="figref" href="#fig-mode">Figure 1</a> shows also one more aspect of this dynamical system. 
Unrolling the recurrence gives

$$
\begin{aligned} 
y_t &= \sum_{k \ge 0} K_k x_{t-k} \\ 
K_k &= \operatorname{Re}\big(\bar b \bar a^{k}\big)\;. 
\end{aligned} \tag{4} \label{eq:unrolling} 
$$

The same system is therefore both a recurrent network, updating a state one step at a time, and a
convolution with a fixed kernel $$K$$. When you press play in <a class="figref" 
href="#fig-mode">Figure 1</a> the state moves on the right while the reversed kernel slides across 
the input and the two readouts agree at every step. The convolutional form is what made LTI 
state-space models fast to train. It depends on one thing, $$K$$ (or, alternatively, $a$, $b$ and 
$c$) is the same at every time step. 


<div class="fig l-page" id="fig-mode">
  <p class="fig-title"><span class="fig-num">Figure 1.</span> One linear system (mode), two 
  views</p>
  <p class="fig-sub">One mode with pole \(\bar a\). The top row shows what the pole determines: the impulse response, the frequency response and the path of the state. The bottom row runs the mode on an input and computes the output in two ways, as a recurrence and as a convolution with the impulse response, which agree at every step.</p>
  <iframe class="fig-frame" src="{{ 'assets/html/2027-04-30-mamba-input-driven/fig-mode.html' | relative_url }}" title="Figure 1 (interactive): One linear system (mode), two views" scrolling="no" style="height:773px"></iframe>
  <img class="fig-print" src="{{ 'assets/img/2027-04-30-mamba-input-driven/print/fig-mode.png' | relative_url }}" alt="Figure 1: One linear system (mode), two views">
</div>

Switching between the two mode types shows what each kind of pole buys.

**Real mode.** The kernel is a decaying exponential, a moving average with one timescale of about 
$$1/(\alpha\Delta)$$ steps. The frequency response is low-pass. The state moves along a line and it 
records how much input arrived and how recently and nothing about phase.

**Complex mode.** The kernel is a damped oscillation, and the state rotates, so it carries phase. 
The frequency response now has a peak near $$\omega\Delta$$ radians per step, the mode is a 
resonator that answers strongly to one rhythm in the input and weakly to the rest. Select the sine 
input to see this. The Ringing and Tuned presets have the same damping and differ only in where the 
peak sits. In Tuned it falls on the input frequency and the output comes out about three times 
larger. Now drag the pole toward the unit circle. The peak grows taller and narrower, so the mode 
tells frequencies apart more sharply. But the output takes longer to build up, a slight mistuning 
loses most of the response. A sharp peak in frequency is the same thing as a long kernel in time, so 
a mode that is very selective about frequency is also slow.

### Where a fixed filter fails - the latch task

An LTI system with any number of modes, real or complex, is still one fixed convolution. It weighs 
the past by how long ago something happened, never by what happened. Let us introduce a task where 
such mode fails.

**The latch task.** The input has two channels, a value signal $$v_t$$ and a sparse binary flag 
$$f_t$$ that fires with probability $$p$$ at each step. The target is the value at the most recent 
flag held until the next flag. This is a sample-and-hold, or latch, and a minimal version of the 
selective copying task from the Mamba papers.

Suppose $$\bar a$$ and $$\bar b$$ could depend on the current input. When the flag fires we want 
$$\bar a \approx 0$$ and $$\bar b \approx 1$$: forget, then overwrite. When it doesn't, we want 
$$\bar a \approx 1$$ and $$\bar b \approx 0$$: hold. 

With our normalization $$\bar b = 1-\bar a$$, both settings are reachable by changing $$\Delta$$ 
alone. Move the $$\Delta$$ slider in <a class="figref" href="#fig-mode">Figure 1</a> and the pole 
slides along the real segment, to 1 for a small $$\Delta$$ and to 0 for a large one. Making 
$$\Delta$$ a function of the input is exactly Mamba's selection mechanism, and it is the subject of 
Part 2.

The price is the convolutional view. Once $$\bar a$$ changes from step to step there is no single 
kernel $$K$$ any more. The recurrence stays linear in $$h$$, though, and that is what will keep the 
computation parallelizable. 

## Part 2: Letting the Input Steer the System {#letting-the-input-steer-the-system}

The input for the latch task has two scalar channels, the value $$v_t \in \mathbb{R}$$ and the flag 
$$f_t \in \{0,1\}.$$ The state $$h_t$$ and the output $$y_t$$ are scalars too. To make the step size 
$$\Delta_t$$ depend on the flag we will use a simple parametrization with hand-set parameters:

$$
\begin{aligned} \Delta_t &= \operatorname{softplus}(w f_t + c) \\ \bar a_t &= e^{-\alpha\Delta_t} \\ 
h_t &= \bar a_t h_{t-1} + (1-\bar a_t) v_t \\ y_t &= h_t \end{aligned} \tag{5} \label{eq:latch}
$$

<!-- The first line turns the flag into a step size, and softplus keeps it positive. The second turns the 
step size into this step's pole, which therefore stays between 0 and 1: this is still a real, 
decaying mode, whose pole now changes from step to step. The third mixes the old state with the new 
value, using the normalization from Part 1, and the output is simply the state. The value channel is 
what gets written; the flag decides how much.  -->

For a real mode only the product $$\alpha\Delta_t$$ matters, so we fix $$\alpha = 1$$ and the two 
numbers, $$w$$ and $$c$$, do all the work. A very negative bias $$c$$ makes $$\Delta_t$$ tiny when 
the flag is off, so $$\bar a_t \approx 1$$ (hold). A large weight $$w$$ makes $$\Delta_t$$ large when 
the flag fires, so $$\bar a_t \approx 0$$ and $$1-\bar a_t \approx 1$$ (overwrite). Try both in <a 
  class="figref" href="#fig-latch">Figure 2</a>. 


<div class="fig l-page" id="fig-latch">
  <p class="fig-title"><span class="fig-num">Figure 2.</span> A selective mode solves the latch</p>
  <p class="fig-sub">With only two numbers, the selective mode (blue) holds the latched value almost 
  perfectly, while the best LTI mode (red), the best any LTI model can do, only averages recent 
  values. To score the quality of a fit, here and in the rest of the post, we use the <a class="ext" 
  href="https://en.wikipedia.org/wiki/Coefficient_of_determination">coefficient of 
  determination</a>, \(R^2 = 1 - \text{MSE}/\operatorname{Var}(y)\), the mean squared error measured 
  against the error of always predicting the mean. Unlike the raw error it does not depend on the 
  scale of the target, so numbers from different tasks can be compared. There is a perfect match when 
  \(R^2 = 1\), the fit is no better than always outputting the mean when \(R^2 = 0\) and a negative 
  value is worse than that.</p>
  <iframe class="fig-frame" src="{{ 'assets/html/2027-04-30-mamba-input-driven/fig-latch.html' | relative_url }}" title="Figure 2 (interactive): A selective mode solves the latch" scrolling="no" style="height:688px"></iframe>
  <img class="fig-print" src="{{ 'assets/img/2027-04-30-mamba-input-driven/print/fig-latch.png' | relative_url }}" alt="Figure 2: A selective mode solves the latch">
</div>

The same two-parameter family covers the whole range. With $$w = 0$$ the gate ignores the flag and 
the model is an ordinary LTI mode from Part 1, and with $$c = \ln\frac{p}{1-p}$$ as well (the Best 
LTI mode preset) its pole sits at $$1-p$$ and it reproduces the red line. Selective models therefore 
contain the LTI ones as a special case. What changed is not the state update, which is still linear 
in $$h$$, but the fact that its coefficient $$\bar a_t$$ now moves with the input.

### No kernel, but a matrix

With $$\bar a_t$$ varying there is no single kernel any more. Unrolling the recurrence still 
expresses the output as a weighted sum of past inputs,

$$
\begin{aligned} 
y_t &= \sum_{s \le t} M_{t,s} v_s \\ 
M_{t,s} &= (1-\bar a_s) \prod_{r=s+1}^{t} \bar a_r 
\end{aligned} \tag{6} \label{eq:matrix}
$$

but the weights now depend on the data. For an LTI mode $$M_{t,s}$$ depends only on the lag $$t-s$$: 
every row is the same kernel shifted by one step (i.e. a Toeplitz matrix), which is exactly what a 
convolution is. For the selective mode each row is different. <a class="figref" href="#fig-matrix">Figure 3</a> draws both matrices over the 
64 steps ending at the scrubbed time in <a class="figref" href="#fig-latch">Figure 2</a>. Try it with different presets from <a class="figref" href="#fig-latch">Figure 2</a> to see 
the differences.

<div class="fig l-page" id="fig-matrix">
  <p class="fig-title"><span class="fig-num">Figure 3.</span> The matrix that maps inputs to outputs</p>
  <p class="fig-sub">Row \(t\) shows how strongly the output at time \(t\) depends on the input at 
  each earlier time \(s\). Color intensity shows the size of each entry relative to the largest 
  entry of that matrix. Ticks on the 
  edges mark flags. The left matrix is fixed. The right one belongs to the selective mode set up in 
  <a class="figref" href="#fig-latch">Figure 2</a> and changes with time: both show the 64 steps ending at the current step, whose row is 
  outlined at the bottom. The time slider here and the one in <a class="figref" href="#fig-latch">Figure 2</a> are linked.</p>
  <iframe class="fig-frame" src="{{ 'assets/html/2027-04-30-mamba-input-driven/fig-matrix.html' | relative_url }}" title="Figure 3 (interactive): The matrix that maps inputs to outputs" scrolling="no" style="height:488px"></iframe>
  <img class="fig-print" src="{{ 'assets/img/2027-04-30-mamba-input-driven/print/fig-matrix.png' | relative_url }}" alt="Figure 3: The matrix that maps inputs to outputs">
</div>

The selective matrix has a staircase structure. Between two flags every output row points at the 
same input, the one written at the last flag. In general $$M_{t,s} = C_t \big(\prod_{r=s+1}^{t} \bar 
a_r\big) B_s$$, which reads like masked linear attention: $$C_t$$ plays the query, $$B_s$$ the key, 
and the product of decays is the mask. Mamba-2 uses this equivalence, which it calls state-space 
duality, to compute the layer mostly with matrix multiplications and thus effectively utilizing GPUs 
in training. For now this is only an analogy because in our minimal model $$B$$ and $$C$$ are 
constants. The key–value recall task in the next example gives them a real job.

### Remembering several things: key–value recall

The latch task needs one number of memory. Most interesting tasks need several and need to retrieve the 
right one on demand. A small version of this problem is the following **key–value recall task**. The 
input is split into episodes of 48 steps each starting with a reset marker. During the first 20 
steps of an episode three values are written, each tagged with one of three keys, <span 
class="keychip" style="background:var(--k0)"></span>A, <span class="keychip" 
style="background:var(--k1)"></span>B and <span class="keychip" 
style="background:var(--k2)"></span>C, each used only once. In the second half, four queries arrive 
each naming a key and the correct answer is the value written under that key. Between events the 
value channel carries noise that must be ignored. The target exists only at query steps and only 
those steps are scored.

The minimal model from <a class="figref" href="#fig-latch">Figure 2</a> fails for a structural reason. It has one number of state so it can 
only hold the most recent write and it answers every query with that value. Giving it more modes, 
each gated by its own key, would store all three values, but it still would not know which one to 
report. Its readout weights are fixed and the query has no way to change them.

Mamba solves this problem by making two more parameters depend on the input. A vector state with an 
input-dependent $$B_t$$ decides where each value is written and an input-dependent $$C_t$$ decides 
where the answer is read from. We build a single Mamba-2 head that does exactly this. A head is a 
group of modes that share one step size $$\Delta_t$$, and with it one decay, so they forget 
together. They differ only in how $$B_t$$ writes into them and $$C_t$$ reads from them<d-footnote 
markdown="span">A real Mamba layer runs many heads, and they share $$B_t$$ and $$C_t$$: a structure 
the papers call multi-value, by analogy with attention in which keys and queries are shared across 
heads while every head has its own values (Mamba-3 adds a small learned bias per head). Each head 
keeps its own step size $$\Delta_t$$, its own decay and its own value channels. In the recall task 
this would mean several heads that write to and read from the same slots but forget on different 
schedules. One could reset at every episode marker while another, whose $$\Delta_t$$ never spikes, 
keeps its values across episodes. The addressing is shared, the memories are not.</d-footnote>. 

At every step the head receives an input $$x_t \in \mathbb{R}^9$$ made of five parts: (i) a reset 
marker $$r_t \in \{0,1\}$$, which is 1 at the first step of each episode, (ii) a write marker $$s_t 
\in \{0,1\}$$, which is 1 when a value is written, (iii) the key of the write $$k_t \in \{0,1\}^3$$, 
one-hot at write steps and zero otherwise, (iv) the key of the query $$q_t \in \{0,1\}^3$$, one-hot 
at query steps and zero otherwise and (v) the value channel $$v_t \in \mathbb{R}$$, which carries 
the value to store at a write step and noise to be ignored at every other step. The write marker 
equals the sum of the entries of $$k_t$$, so it is redundant, but it keeps the gate readable.

The state $$h_t \in \mathbb{R}^3$$ has one entry, or slot, per key, and the output $$y_t \in 
\mathbb{R}$$ is the answer, scored only at query steps. The hand-set parameters are the gate weights 
$$w_r$$ and $$w_k$$ for the reset and write markers, the gate bias $$c$$, and a write gain $$\beta > 
0$$ that sets the scale of $$B_t$$. One step of the model computes

$$
\begin{aligned} 
\Delta_t &= \operatorname{softplus}(w_r r_t + w_k s_t + c) \\ 
\bar a_t &= e^{-\Delta_t} \\ 
B_t &= \beta k_t \\ 
C_t &= q_t \\ 
h_t &= \bar a_t h_{t-1} + \Delta_t B_t v_t \\ 
y_t &= C_t^{\top} h_t 
\end{aligned} \tag{7} \label{eq:key-value}
$$

The step size $$\Delta_t$$ is one scalar for the whole head and so is the decay $$\bar a_t$$ which 
all three slots share (the decay rate is $$\alpha = 1$$). $$B_t \in \mathbb{R}^3$$ says where to 
write: into the slot of the current key, or nowhere when no value is written. $$C_t \in 
\mathbb{R}^3$$ says what to read: the slot of the queried key, or nothing when no query is asked. 
The state update decays every slot and then adds the value into the selected slot with strength 
$$\Delta_t\beta$$, and the output reads the selected slot<d-footnote markdown="span">In the real 
model $$B_t$$, $$C_t$$ and $$\Delta_t$$ are computed from the whole input by learned projections, 
$$B_t = W_B x_t$$ and $$C_t = W_C x_t$$ with $$W_B, W_C \in \mathbb{R}^{3\times 9}$$, and $$\Delta_t 
= \operatorname{softplus}(w_\Delta^{\top} x_t + c)$$. Our hand-set choice fills these so that they 
pick out the key, query and marker channels. A real head also carries more than one value channel: 
with $$P$$ channels, $$v_t \in \mathbb{R}^P$$, the state becomes a matrix $$h_t \in \mathbb{R}^{N 
\times P}$$ and the write an outer product $$\Delta_t B_t v_t^{\top}$$. Here $$N = 3$$ and $$P = 
1$$.</d-footnote>. 

<!-- A note on the input term $$\Delta_t B_t v_t$$. Mamba starts from the continuous system $$h' = 
a\,h + B\,v$$ and turns it into one step of length $$\Delta_t$$. For the decay it uses the exact 
solution over the step, assuming the input stays constant during it (zero-order hold): $$\bar a_t = 
e^{\Delta_t a}$$, here with $$a = -1$$. Under the same assumption the exact input term would be 
$$\frac{e^{\Delta_t a}-1}{a}\,B_t v_t$$, the formula from Part 1. Mamba's implementation replaces 
it with its first-order approximation $$\Delta_t B_t v_t$$, an Euler step. For small $$\Delta_t$$ 
the two agree. Mamba-3 revisits exactly this term with a trapezoidal rule that also uses the 
previous input; we return to it in Part 3. --> 

<div class="fig l-page" id="fig-recall">
  <p class="fig-title"><span class="fig-num">Figure 4.</span> Key–value recall with a vector state</p>
  <p class="fig-sub">Two episodes of test data (separated by vertical dashed lines). The task is to 
  remember the value of \(v_t\) at the write time, store it to the requested slot and recall it 
  later at the query time from the correct slot.</p>
  <iframe class="fig-frame" src="{{ 'assets/html/2027-04-30-mamba-input-driven/fig-recall.html' | relative_url }}" title="Figure 4 (interactive): Key–value recall with a vector state" scrolling="no" style="height:824px"></iframe>
  <img class="fig-print" src="{{ 'assets/img/2027-04-30-mamba-input-driven/print/fig-recall.png' | relative_url }}" alt="Figure 4: Key–value recall with a vector state">
</div>

Writing and forgetting are now separate knobs. Between events $$\Delta_t$$ is tiny, so every slot is 
held. A write keeps $$\Delta_t$$ tiny as well, so no slot decays, while the large gain $$\beta$$ 
makes $$\Delta_t\beta$$ close to one: the value still lands in full, but only in the slot its key 
selects. Only the reset marker makes $$\Delta_t$$ large, clearing all slots at once for the next 
episode. The same mechanism works in Mamba-1, whose state matrix is diagonal rather than scalar but 
whose $$\Delta_t$$ is still shared by all state dimensions of a channel.

### Queries and keys, now for real

Unrolling the full model gives the matrix view of <a class="figref" href="#fig-matrix">Figure 3</a> again, now with vectors inside:

$$
\begin{aligned} y_t &= \sum_{s \le t} M_{t,s} v_s 
\\ M_{t,s} &= \big(C_t^{\top} B_s\big) \Delta_s \prod_{r=s+1}^{t} \bar a_r\;. 
\end{aligned} \tag{8} \label{eq:matrix_vector}
$$

The factor $$C_t^{\top}B_s$$ is a similarity between what the query asks for and what the write was tagged with, which is exactly the score of linear attention, and the product of decays is a mask that fades or cuts off the past. <a class="figref" href="#fig-attention">Figure 5</a> draws the matrices for the two episodes shown in <a class="figref" href="#fig-recall">Figure 4</a>.

<div class="fig l-page" id="fig-attention">
  <p class="fig-title"><span class="fig-num">Figure 5.</span> Recall as attention</p>
  <p class="fig-sub">Same two episodes and settings as <a class="figref" href="#fig-recall">Figure 4</a>. The right matrix follows the controls there. Only query rows and write columns are drawn: for the full model every other entry is exactly zero (\(C_t = 0\) away from queries, \(B_s = 0\) away from writes), and for the minimal latch they are below 0.001 or not scored. Each cell shows how much of the value written at step \(s\) ends up in the answer at query step \(t\), where 1 means copied in full, and is coloured by the key of the write. Grey cells lie in the future of the query. The dashed lines mark the episode boundary.</p>
  <iframe class="fig-frame" src="{{ 'assets/html/2027-04-30-mamba-input-driven/fig-attention.html' | relative_url }}" title="Figure 5 (interactive): Recall as attention" scrolling="no" style="height:476px"></iframe>
  <img class="fig-print" src="{{ 'assets/img/2027-04-30-mamba-input-driven/print/fig-attention.png' | relative_url }}" alt="Figure 5: Recall as attention">
</div>

For the minimal model from Eq. \ref{eq:latch} every row points at the most recent write. For the 
full model (Eq. \ref{eq:key-value}) each query row lights up at exactly one column, the write whose 
key matches no matter what was written after it. 

With one-hot keys the score is exactly 1 or 0, so there is no interference between keys. Real models 
use dense, learned keys in a state far smaller than the number of things worth remembering, so the 
keys cannot all be orthogonal. Every read then picks up a little of the other stored values, and the 
interference grows with the number of stored pairs.

One more limitation shows here. Writes add to a slot rather than replacing it, so writing key A 
twice in one episode would return the sum of both values. That is why each key is written once per 
episode. Later architectures such as Gated DeltaNet <d-cite key="gated-deltanet"></d-cite> add an 
explicit erase step, the gated delta rule, to handle overwrites. 

<!-- ### What this dynamical system still cannot do

Two limits hold for every model discussed in this part, minimal or full, whatever its parameters. We 
will handle them in the coming parts of this post.

First, the pole never leaves the segment between 0 and 1 because $$\bar a = e^{-\alpha\Delta}$$ is 
positive for every $$\Delta$$. The state can be held, shrunk or overwritten but never flipped or 
rotated. A task as simple as tracking the parity of a bit stream needs a sign flip at every 1. A 
real pole that could become negative would do it, but $$\bar a$$ never is. Part 3 lets the pole 
leave the real axis, and a flip becomes a rotation by $$\pi$$. Part 5 then uses the same rotations 
to cycle through any fixed number of states, of which the flip is the case of two.

Second, the gate sees only the current input, never the state. $$\Delta_t$$, $$B_t$$ and $$C_t$$ are 
functions of the current input, never of $$h_{t-1}$$, so the layer cannot decide what to write or 
read based on what it already holds. That restriction is exactly what keeps the recurrence linear 
and the scan parallel. Part 4 shows how stacking a second layer, whose input is the first layer's 
output, recovers part of what was given up. -->

## Part 3: Rotation and Decay in One Pole {#rotation-and-decay-in-one-pole}

Apart from the introductory visualizations in Part 1, every model so far has kept its pole on the 
real segment between 0 and 1. The state could be held, shrunk or overwritten, but never rotated. In 
this part, the input controls both the angle and the radius of a complex pole. We show why both 
matter on one task: tracking a vehicle's heading. We start with a gyroscope alone, which needs only 
the angle, and then add a compass, which also needs the radius. The sensors and the drive are
simplified and real navigation filters do more than the heads below. The point is what a single
data-driven pole can do, not a production-ready estimator.

A gyroscope in a car, phone or drone measures the yaw rate $$\omega(t)$$, how fast the heading turns 
in radians per second. Integrating it gives the heading, $$\theta(t) = \theta(0) + \int_0^t 
\omega(\tau)\,d\tau$$. This is dead reckoning and it is how a vehicle keeps track of its orientation 
between compass or GPS fixes. 

### Rotation alone

The input at step $$t$$ is the gyroscope sample $$\omega_t \in \mathbb{R}$$ in radians per second 
together with a start marker $$r_t \in \{0,1\}$$ that is 1 at the first step only. The state $$h_t 
\in \mathbb{C}$$ is stored as two real numbers and the output $$y_t \in \mathbb{C}$$ is the heading 
estimate read as the pair $$(\operatorname{Re} y_t, \operatorname{Im} y_t)$$. The only parameter is 
the sample interval $$\Delta = 0.1$$s (10 Hz). The following simple data-driven system will do the 
job

$$
\begin{aligned} \bar a_t &= e^{i \omega_t\Delta} \\ h_t &= \bar a_t h_{t-1} + r_t \\ y_t 
&= h_t \end{aligned} \tag{9} \label{eq:dead_reckoning}
$$

The pole $$\bar a_t$$ has radius 1 and an angle $$\omega_t\Delta$$ set by the input. The state 
rotates by exactly the angle the vehicle turned during the step. The start marker writes the 
reference direction, the number 1 (heading zero), into the empty state. Unrolling the recurrence 
gives

$$
h_t = \prod_{s=1}^{t} e^{i\,\omega_s\Delta} = e^{\,i\sum_{s=1}^{t}\omega_s\Delta} = e^{i\theta_t}.
$$

Multiplying rotations adds their angles, so the model integrates the gyroscope exactly and delivers 
the heading already in its periodic form. Importantly, the recurrence is still linear in 
$$h$$<d-footnote markdown="span">This is the mechanism Mamba-3 adds. Its rotation angles are 
  computed from the input, as ours is from $$\omega_t$$, and the paper shows that such a complex 
  state is equivalent to rotating $$B$$ and $$C$$ matrices of the linear system by the accumulated 
  angle, resulting in a data-dependent version of rotary position embeddings (RoPE). Ordinary RoPE 
  rotates by the token position, as if the vehicle turned at a constant rate, here the rotation 
  follows the data.</d-footnote>. 

<a class="figref" href="#fig-heading">Figure 6</a> shows the situation visually. To score the 
estimate, we use the same $$R^2$$ as before with the squared error measured as the squared distance 
between the estimated and the true direction vector. 

<div class="fig l-body" id="fig-heading">
  <p class="fig-title"><span class="fig-num">Figure 6.</span> Heading from a gyroscope</p>
  <p class="fig-sub">A 60-second drive sampled at 10 Hz. Pick a route, then play or scrub through 
  time. The complex mode is orange.</p>
  <iframe class="fig-frame" src="{{ 'assets/html/2027-04-30-mamba-input-driven/fig-heading.html' | relative_url }}" title="Figure 6 (interactive): Heading from a gyroscope" scrolling="no" style="height:806px"></iframe>
  <img class="fig-print" src="{{ 'assets/img/2027-04-30-mamba-input-driven/print/fig-heading.png' | relative_url }}" alt="Figure 6: Heading from a gyroscope">
</div>

The zoomed pole panel shows something the equations hide. At 10 Hz the pole never moves more than a 
few degrees away from 1, because the vehicle turns only a little between two samples. Each step is a 
small rotation, the large rotation of the state on the right is their accumulation. As the drive 
alternates between straights and curves, the pole shifts between resting on 1 and sitting at a small 
angle above or below it. The state switches between standing still and turning at the matching 
speed. 

Decay could only hurt here. The only thing ever written is the starting direction, so a radius below 
1 would keep the angle of the estimate right but shrink its length at every step and the estimate 
would fade away. When nothing new comes in, a head that tracks a state must keep its pole on the 
unit circle. 

As we now understand how a data-driven complex mode is able to track pure rotation, we will use this 
understanding on a more realistic scenario and we will also add the decay. 

### Rotation with decay: a gyroscope and a compass

A real gyroscope is not perfect, it has a small bias. Even when the vehicle drives straight, it 
reports a slow rotation. Over a minute a bias of 0.5° per second accumulates into a heading error of 
30°. Its readings are also noisy, here by 3° per second. Integrating the noise makes the heading 
wander off in a random walk even without a bias. A magnetic compass has the opposite problem. It 
measures the heading directly, so it does not drift, but each reading is noisy, here by 10°. Neither 
sensor is good enough alone. 

Our data-driven linear system receives three inputs: (i) the gyroscope reading $$\tilde\omega_t \in 
\mathbb{R}$$, which is the true yaw rate $$\omega_t$$ of the previous section plus the bias and 
noise, (ii) the compass reading $$m_t \in \mathbb{C}$$, a unit vector in the measured direction, and 
(iii) the start marker $$r_t$$. The state $$h_t \in \mathbb{C}$$ and the output $$y_t \in 
\mathbb{C}$$ are as before. The only tunable parameter is a decay rate $$\alpha \ge 0$$. One step 
computes

$$
\begin{aligned} \bar a_t &= e^{-\alpha\Delta}\, e^{\,i\,\tilde\omega_t\Delta} \\ h_t &= \bar a_t\, 
h_{t-1} + \big(1 - e^{-\alpha\Delta}\big)\, m_t + r_t \\ y_t &= h_t \end{aligned} 
\tag{10} \label{eq:complementary}
$$

This is the exponential average of Part 1 with one change. There, the real mode kept a fraction 
$$e^{-\alpha\Delta}$$ of its state at every step and filled the rest with the new input. Here the 
kept fraction is first rotated by the angle the gyroscope reports for the step, 
$$\tilde\omega_t\Delta$$, so that a heading from one step ago is not averaged with a current 
heading. The angle of the pole says how the past moved, its radius says how much the past is 
trusted. The radius sets a time scale of about $$1/\alpha$$ seconds. Over shorter times the head 
follows the gyroscope, whose drift has had no time to grow, over longer times it follows the 
compass, whose noise averages out.
The input weight $$1 - e^{-\alpha\Delta}$$ is the normalization of Part 1, which keeps the estimate 
at unit length.

The following figure shows this system in action.

<!-- In Mamba's form of the input term, $$\Delta_t B_t x_t$$ with the compass reading as the value 
$$x_t$$, it corresponds to $$B_t = (1 - e^{-\alpha\Delta})/\Delta$$, close to $$\alpha$$ for a short 
step. -->

<div class="fig l-page" id="fig-drift">
  <p class="fig-title"><span class="fig-num">Figure 7.</span> A gyroscope and a compass blended by one complex pole</p>
  <p class="fig-sub">The whole 60-second city drive at 10 Hz. The top panel compares the heading 
  error of this head (orange) with the gyroscope alone and the raw compass readings. Move the decay 
    rate \(\alpha\) to watch the head move between the drifting gyroscope and the noisy compass. The 
    disturbance and gate switches are used in the next section.</p>
  <iframe class="fig-frame" src="{{ 'assets/html/2027-04-30-mamba-input-driven/fig-drift.html' | relative_url }}" title="Figure 7 (interactive): A gyroscope and a compass blended by one complex pole" scrolling="no" style="height:641px"></iframe>
  <img class="fig-print" src="{{ 'assets/img/2027-04-30-mamba-input-driven/print/fig-drift.png' | relative_url }}" alt="Figure 7: A gyroscope and a compass blended by one complex pole">
</div>

With $$\alpha = 0$$ the head is the gyroscope alone of the previous section, now with the 
imperfect gyroscope. It ends 26° off, an RMS error of 14° over the drive. With a very large 
$$\alpha$$ it copies every compass reading, noise included, and the raw readings have an RMS error 
of 10.1°. The error curve has its minimum in between ($$\alpha=0.45$$). At the default $$\alpha = 
0.5$$ per second, a memory of about two seconds the RMS error is 2.0°, far better than either sensor 
alone. More gyroscope bias moves the best $$\alpha$$ up, more compass noise moves it down. Even with 
the bias set to zero, the noise alone makes the gyroscope wander off by 3.8° RMS, and the blend at 
$$\alpha = 0.5$$ halves that. Decay is not a nuisance here but the point: the radius decides for how 
long the gyroscope is trusted.

### Letting the input set the radius

Part 2 showed what an input-dependent radius buys and the compass gives a reason to want one. Near a 
steel bridge or a power line a magnetic compass is pulled off by tens of degrees for as long as the 
disturbance lasts. Phones and vehicles detect such periods for example from the strength of the 
measured magnetic field, which in our model becomes one more input: a flag $$d_t \in \{0,1\}$$ that 
is 1 while the compass is disturbed.

Switch the disturbances on in <a class="figref" href="#fig-drift">Figure 7</a>. In two time windows 
the compass reads 40° too far left. A fixed $$\alpha$$ now has no good value. A small one rides out 
the windows but drifts in between, a large one follows the compass astray. Even the best fixed 
choice leaves an RMS error of 13.8°. The remedy is to let the flag set the decay rate

$$
\begin{aligned} \alpha_t &= \alpha(1 - d_t) \\ \bar a_t &= e^{-\alpha_t\Delta} 
e^{i\tilde\omega_t\Delta} \\ h_t &= \bar a_t h_{t-1} + \big(1 - e^{-\alpha_t\Delta}\big) m_t 
+ r_t \\ y_t &= h_t \end{aligned} \tag{11} \label{eq:gated_complementary}
$$

On flagged steps the radius is 1 and the compass gets zero weight, the head runs on the gyroscope 
alone, as in the previous section. Between disturbances it is the complementary filter. Switch the 
gate on: at $$\alpha = 0.5$$ the RMS error drops from 16.9° to 3.5° and the largest error from 41° 
to 9°. The change of pole radius in the disturbance strip shows the mechanism.

Not shown in the figure, but taken to the other extreme, a flag announcing an exact heading reading, 
from GPS for instance, would push the radius to 0 and overwrite the estimate like in the latch of 
Part 2, now inside a rotating head. Together the three cases cover the whole range of the radius, 1 
to hold, 0 to overwrite and anything in between to average. The radius is chosen by the input at 
every step, while the angle independently turns whatever is kept<d-footnote markdown="span">
The gate here acts on the decay rate, which in Mamba-3 is the input-dependent $$A_t$$. The latch of 
Part 2 acted on the step size $$\Delta_t$$ instead, the only option in Mamba-2, where $$A$$ is a 
fixed parameter. In Mamba-3 the step size multiplies the angle as well, so gating through 
$$\Delta_t$$ would also change the rotation, which the angle projection would then have to undo. 
$$A_t$$ changes the radius alone.</d-footnote>.

A Mamba layer runs many such heads in parallel, each with its own projections for the radius and the 
angle. Nothing in the architecture assigns a head to rotation or to decay. A trained head may end up 
close to a pure rotation that tracks a state, another may act as a leaky average over a window the 
input sets and a third may blend both as here.

One thing no head of a single layer can do is turn the heading tracking into a position tracking. That 
requires multiplying the heading by the speed before integrating, a product of the current input 
with something the layer has computed from the past. Part 4 shows that adding a second layer solves 
this problem.

## Part 4: Stacking Layers {#stacking-layers}

Part 3's head delivers the heading. A vehicle usually wants its position as well and computing it 
needs something a single layer cannot do: multiply two signals and integrate the product. This part 
shows that a second layer can. We also look at how the integration itself is discretized, which is 
where Mamba-3's trapezoidal rule comes in. 

To make the situation even more interesting, the vehicle drives the city route with a realistic speed 
profile: it accelerates, slows down in curves and stops once at a traffic light. The drive is 
simulated at 1 kHz as ground truth and sampled at 10 Hz. 

### Position needs a second layer

Position is the integral of velocity and velocity is speed times heading 

$$
p(t) = \int_0^t v(\tau) e^{i\theta(\tau)} d\tau
$$ 

with $$p \in \mathbb{C}$$ and the position given by its components $$\operatorname{Re}(p)$$ and 
$$\operatorname{Im}(p)$$.

The heading comes from the head of Part 3 and depends on the whole history. The speed $$v_t \in 
\mathbb{R}$$ is produced by the wheel sensors. Their product has to be integrated and the results 
then needs to enter a recurrence again as input. That is what a single layer cannot do. The input 
term $$B_t x_t$$ of every head is built from the current input alone, and the heading exists only as 
the state of another head. Heads in the same layer do not feed each other. The readout alone could 
form the product, $$C_t$$ may depend on the current speed, so a head holding the heading could 
output the velocity $$v_t e^{i\theta_t}$$. But nothing in the same layer can then accumulate it.

A second layer solves the problem. Mamba wraps every layer in a residual connection, so the next 
layer sees the original inputs together with everything the previous layer has computed. Layer 2 
therefore receives both the speed $$v_t$$ and the heading estimate $$y^{(1)}_t$$ of layer 1. One 
head for layer 2 is enough to accumulate the position

$$
\begin{aligned} \bar a^{(2)}_t &= 1 \\ B_t &= v_t \\ x_t &= y^{(1)}_t, \\ h^{(2)}_t &= h^{(2)}_{t-1} 
+ \Delta B_t x_t \\ y^{(2)}_t &= h^{(2)}_t . \end{aligned}
$$

The decay rate is zero, so the pole is one and the head is a plain integrator. Its step $$\Delta = 
0.1$$s is the sample interval. The multiplication happens in the input term: $$B_t$$ comes from the 
speed and the value $$x_t$$ is the heading, so their product is exactly the velocity. In the general 
form from Part 2, the input term $$\Delta_t B_t x_t^{\top}$$ is an outer product of an 
input-dependent vector with the value channels and this is where Mamba multiplies two signals. The 
heading computed in the first layer enters as $$y^{(1)}_t \in \mathbb{C}$$. The state $$h^{(2)}_t 
\in \mathbb{R}^{1 \times 2}$$ encodes the vehicle position $$p_t = h_t$$.

<svg class="arch arch9" viewBox="0 0 860 200" role="img" aria-label="Two-layer architecture: layer 1 heading head feeds layer 2 position head, speed reaches layer 2 through the residual stream">
  <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ahf"/></marker></defs>
  <text x="4" y="56" class="lb">gyro ω̃ₜ</text>
  <text x="4" y="98" class="lb">compass mₜ, dₜ</text>
  <text x="4" y="170" class="lb">speed vₜ</text>
  <line x1="138" y1="50" x2="186" y2="50" class="ln" marker-end="url(#ah)"/>
  <line x1="138" y1="92" x2="186" y2="92" class="ln" marker-end="url(#ah)"/>
  <rect x="190" y="22" width="210" height="96" rx="8" class="bx c"/>
  <text x="295" y="64" class="bt" text-anchor="middle">Layer 1: heading head</text>
  <text x="295" y="90" class="bs" text-anchor="middle">rotates, blends in compass</text>
  <line x1="400" y1="70" x2="496" y2="70" class="ln" marker-end="url(#ah)"/>
  <text x="448" y="60" class="bs" text-anchor="middle">heading y⁽¹⁾ₜ</text>
  <line x1="88" y1="164" x2="496" y2="164" class="ln" marker-end="url(#ah)"/>
  <text x="295" y="192" class="bs" text-anchor="middle">residual stream</text>
  <rect x="500" y="22" width="200" height="164" rx="8" class="bx"/>
  <text x="600" y="98" class="bt" text-anchor="middle">Layer 2: position head</text>
  <text x="600" y="124" class="bs" text-anchor="middle">ā = 1, Bₜ = vₜ, xₜ = y⁽¹⁾ₜ</text>
  <line x1="700" y1="104" x2="728" y2="104" class="ln" marker-end="url(#ah)"/>
  <text x="734" y="110" class="lb">position pₜ</text>
</svg>


Check <a class="figref" href="#fig-position">Figure 8</a> for the integrated position on the drive 
through the city route of Part 3 sampled at 10 Hz. With the heading of <a class="figref" 
href="#fig-drift">Figure 7</a> at its default settings the position at the end of the minute-long 
460-meter drive is off by about 5 meters. The gyroscope alone ends 30 meters away. Even a perfect 
heading leaves an error of about half a meter. That remainder has nothing to do with the heading, it 
comes from how the input term is discretized.

<div class="fig l-page" id="fig-position">
  <p class="fig-title"><span class="fig-num">Figure 8.</span> Position from two layers</p>
  <p class="fig-sub">Layer 2 integrates speed times the heading from <a class="figref" 
  href="#fig-drift">Figure 7</a>. Change the gyroscope and compass settings there to see the effect 
  here.</p>
  <iframe class="fig-frame" src="{{ 'assets/html/2027-04-30-mamba-input-driven/fig-position.html' | relative_url }}" title="Figure 8 (interactive): Position from two layers" scrolling="no" style="height:463px"></iframe>
  <img class="fig-print" src="{{ 'assets/img/2027-04-30-mamba-input-driven/print/fig-position.png' | relative_url }}" alt="Figure 8: Position from two layers">
</div>


### Discretization: Euler and trapezoid

Layer 2 adds $$\Delta v_t y^{(1)}_t$$ as input at every step of integration. This is the Euler 
(first order) method used by Mamba-1 and Mamba-2. It treats the velocity constant over the step and 
equal to its value at the end of the step. In our driving scenario the vehicle keeps a realistic 
speed profile, it accelerates and brakes. In such situations this simplified integration rule causes 
the error we have just observed. There is an alternative, the trapezoidal rule, which averages the 
two ends of the step instead 

$$
h_t = h_{t-1} + \frac{\Delta}{2}\big(B_{t-1} x_{t-1} + B_t x_t\big).
$$

It is accurate to second order in the step rather than first, so for smooth signals its error is far 
smaller. Mamba-3 builds its discretization on this idea. Instead of just averaging, its input term 
blends the current and the previous input with a weight that itself depends on the data. With equal 
weights and no decay it reduces to the rule above<d-footnote markdown="span">
With the decay rate $$A_t$$ (Part 3 had $$A_t = -\alpha_t$$) and the rotation $$R_t = 
e^{i\omega_t\Delta_t}$$, Mamba-3's update reads $$h_t = e^{\Delta_t A_t} R_t h_{t-1} + 
  (1-\lambda_t)\Delta_t e^{\Delta_t A_t} R_t B_{t-1} x_{t-1} + \lambda_t\Delta_t B_t x_t$$,
where $$\lambda_t \in [0, 1]$$ is computed from the input. With $$\lambda_t = 1$$ it is Mamba-2's 
Euler rule, and with $$\lambda_t = \tfrac12$$ and a pole of 1 it is the rule used in <a class="figref" 
    href="#fig-trapezoid">Figure 9</a>. The paper found a learned $$\lambda_t$$ slightly better than 
  a fixed $$\tfrac12$$. It also points out that the term in $$x_{t-1}$$ acts as a convolution of 
  width two on the state input, one reason Mamba-3 can drop the short convolution of earlier blocks 
  used in Mamba-2.
</d-footnote>. In <a class="figref" href="#fig-trapezoid">Figure 9</a> we use a perfect heading to 
isolate this effect. You can experiment with even lower sampling rates. 

<div class="fig l-page" id="fig-trapezoid">
  <p class="fig-title"><span class="fig-num">Figure 9.</span> Euler versus trapezoidal integration at coarse sampling</p>
  <p class="fig-sub">Perfect heading, only the input term of layer 2 differs. The middle panel zooms 
  in on the end of the drive with a marker at every step.</p>
  <iframe class="fig-frame" src="{{ 'assets/html/2027-04-30-mamba-input-driven/fig-trapezoid.html' | relative_url }}" title="Figure 9 (interactive): Euler versus trapezoidal integration at coarse sampling" scrolling="no" style="height:480px"></iframe>
  <img class="fig-print" src="{{ 'assets/img/2027-04-30-mamba-input-driven/print/fig-trapezoid.png' | relative_url }}" alt="Figure 9: Euler versus trapezoidal integration at coarse sampling">
</div>

At 10 Hz the Euler rule ends about half a meter off, at 1 Hz, five meters. Its error grows in 
proportion to the step. The trapezoidal rule ends within a few centimeters at every rate, and 
stays within about half a meter during the drive even at 1 Hz. Mamba-3 motivates the change for 
language modelling as well. Here, where the input really is a sampled continuous signal, its effect 
has a direct physical meaning.

Two layers now turn a drifting gyroscope, a noisy compass and a speed sensor into a position on the 
map. Every part of the computation is a linear time-varying system. The nonlinearity lives entirely 
in how the inputs set the poles and in the product $$B_t x_t$$. 

Part 5 leaves the vehicle behind and returns to the setting Mamba was built for: language. There the 
same two mechanisms, a state that turns or switches and an integrator, reappear in discrete form.

## Part 5: Back to Language: a Rhythm Grammar {#back-to-language-a-rhythm-grammar}

Mamba was built and demonstrated mainly for language modelling. There, a model reads a sequence of 
tokens and outputs, at every step, a probability distribution over the next token. To generate text, 
it samples a token from that distribution, appends it, and repeats. This last part builds such a 
model by hand for a tiny language whose grammar needs exactly the two mechanisms of this post: a 
state that switches between a fixed number of positions and an integrator.

### The language

Written music has a real grammar of this kind. A time signature fixes how many beats a bar holds and 
the notes of every bar must fill it exactly. Our vocabulary has a quarter note (1 beat), a half note 
(2 beats), a dotted half note (3 beats), a whole note (4 beats), a bar line and an end symbol. In 
3/4 time a bar holds 3 beats, in 4/4 four. The rules are:

<ul class="rules">
  <li>a note may only be written if it fits into the beats left in the current bar,</li>
  <li>a bar line must come as soon as a bar is full and only then,</li>
  <li>the piece may end only right after a bar line and ending becomes more likely the more bars 
have been written.</li>
</ul>

### The model

As in the previous parts, we will hand-design the model. The input at step $$t$$ is the current 
token $$x_t$$, one of the six symbols or a start symbol and its duration $$d(x_t)$$ in beats, 0 for 
the bar line, the end and the start. A single head would be enough to separate the grammatically 
correct next notes from the incorrect ones. But we also want to make the logits of all these 
situations equal and for that we will need a second head for 4/4 beat<d-footnote 
  markdown="span">Telling the allowed positions from the forbidden ones needs only one head for any 
number of beats. The positions at which a note still fits form an arc of the circle and a straight 
line in the $$(\operatorname{Re} h, \operatorname{Im} h)$$ plane cuts any arc off from the rest. 
Where the second head comes handy is for setting logits constant over this arc. On the circle, a 
linear readout of one head is a single cosine over the beat positions and thus there is not single 
projection which would result in the same logit for all of them (it works in 3/4 though). The 
classification would still work, but the preferences for notes would shift with the beat. A second 
head adds another dimension to the linear readout input which allows to find a projection with all 
the logits being the same. </d-footnote>. Let's denote the beat heads 
$$h_t^{(m)}$$ with complex state, where $$m \in \{1\}$$ for 3/4 and $$m \in \{1, 2\}$$ for 4/4 beat. 
We also use a counter head, $$c_t$$, with a real state.

<!-- We will use $$k \in \{3, 4\}$$ beats per bar in our examples. The model needs only one layer with 
two kinds of heads: (i) the beat heads, $$h_t^{(m)}$$, numbered $$m = 1, \dots, \lfloor k/2 
\rfloor$$, each with a  complex state, and (ii) the counter head, $$c_t$$, with a real state -->

$$
\begin{aligned} 
\bar a^{(m)}_t &= e^{i 2 \pi m d(x_t)/k} \\ 
h^{(m)}_t &= \bar a^{(m)}_t h^{(m)}_{t-1} + r_t \\ c_t &= c_{t-1} + [x_t = \text{bar line}] \text{,} 
\end{aligned}
$$

where $$[\cdot]$$ is 1 when the condition holds and 0 otherwise. A start marker $$r_t$$ writes 1 
into the beat heads at the first step. A beat head's pole has radius 1 and an angle set by the 
current token: a quarter note switches the state on by $$2\pi m / k$$, a half note by twice that, 
and the bar line leaves it in place. The state sits on one of exactly $$k$$ points and switches 
between them. The rotation is only a way of writing that switch. The counter head is the integrator 
of Part 4 with nothing to multiply. Its pole starts at 1 and 1 is added at every bar line. You can 
see this behavior in <a class="figref" href="#fig-rhythm">Figure 10</a>.

The next-token distribution comes from a linear readout followed by a softmax:

$$
\begin{aligned} \phi_t &= \big(\operatorname{Re} h^{(1)}_t, \operatorname{Im} h^{(1)}_t, \dots, c_t, 
1\big) \\ \ell_t &= C(x_t)\phi_t + b \\ p(x_{t+1} = v \mid x_{\le t}) &= 
\operatorname{softmax}\!\big(\ell_t / T\big)_v  \end{aligned}
$$

Here $$\ell_t$$ holds one logit per symbol and $$T$$ is the sampling temperature, 1 by default. We 
set the readout so that the logits are exactly the ones we choose, a logit of 0 where a symbol is 
allowed and -12 where it is forbidden. We also add small preferences among the notes (quarter notes 
are the most common) and the end logit that grows with the bar counter. The preferences among the 
allowed notes are then the same at every position in the bar.

Also notice that beat position 0 means two different things. After a note, the bar is full and a bar 
line must follow. After a bar line, a new bar has begun and any note may follow. The same state has 
to be read differently depending on the current token. That is why $$C$$ has to depend on it. This 
is a similar situation to the query $$C_t$$ of Part 2's recall which had to chose which slot to 
read.

A real pole could not do the beat heads' job in 3/4. A positive pole never returns to a previous 
state and a negative one alternates between two. Cycling through three positions needs a rotation. 
This is the limit of real poles from the end of Part 2, now with three states instead of 
two<d-footnote markdown="span">Parity and modular arithmetic are standard benchmarks for state 
  tracking and the Mamba-3 paper reports that its input-dependent rotations solve them while Mamba-2 
  does not. The rhythm grammar is a small relative: the beat position is the running sum of the note 
  durations modulo $$k$$.</d-footnote>.

<div class="fig l-page" id="fig-rhythm">
  <p class="fig-title"><span class="fig-num">Figure 10.</span> A language model for rhythms</p>
  <p class="fig-sub">Write a rhythm by clicking the symbols, or let the model write by sampling from 
  its own predictions. Each button shows the probability the model gives that symbol as the next 
  token. Symbols drawn in red were written against a probability below 0.001. The model considers 
  them ungrammatical. Small numbers under the notes show the beat position after each symbol.</p>
  <iframe class="fig-frame" src="{{ 'assets/html/2027-04-30-mamba-input-driven/fig-rhythm.html' | relative_url }}" title="Figure 10 (interactive): A language model for rhythms" scrolling="no" style="height:504px"></iframe>
  <img class="fig-print" src="{{ 'assets/img/2027-04-30-mamba-input-driven/print/fig-rhythm.png' | relative_url }}" alt="Figure 10: A language model for rhythms">
</div>

At temperature 1, forbidden symbols get probabilities around $$10^{-6}$$, so the samples follow 
the grammar while the choice among allowed notes stays random. Each run writes a different, valid 
rhythm and the pieces tend to end after four to eight bars as the counter pushes the end logit up. 
Temperature divides all logits before the softmax. Low temperatures make the model pick its favorite 
note almost every time, high temperatures flatten the distribution. At $$T = 2$$ about one generated 
piece in nine contains a mistake and at $$T = 4$$, where a forbidden symbol's weight relative to an 
allowed one is only $$e^{-3}$$, three in four do. The grammar holds only as long as the gap between 
allowed and forbidden logits is large compared with the temperature. This is the same trade-off 
between variety and correctness that sampling from any language model involves.

Writing by hand shows the other side. The model as a grammar checker. Put a half note where only one 
beat is left and it turns red. The beat heads carry on regardless because nothing in a linear 
recurrence refuses an input. What the model knows about the grammar lives entirely in its readout.

## Putting it Together: the Mamba-3 Block {#putting-it-together-the-mamba-3-block}

<a class="figref" href="#fig-block">Figure 11</a> shows one Mamba-3 block the layer this post has 
been building towards. Each component is labelled by the part of this post that demonstrated it. The 
block reads its input from the residual stream, normalizes it, and projects it into everything the 
state-space layer needs: each head's value channels $$x_t$$, the key and query $$B_t$$ and $$C_t$$, 
the step size $$\Delta_t$$ and decay rate $$A_t$$, the rotation rates $$\omega_t$$, the trapezoid 
weight $$\lambda_t$$ and the gate $$z_t$$. All of them are computed from the current input, which is 
why Mamba calls this model "selective" SSM. Per head, with $$R_t$$ the block-diagonal rotation by 
the angles $$\Delta_t\omega_t$$, the block computes

$$
\begin{aligned} \bar a_t &= e^{\Delta_t A_t} R_t, \\ h_t &= \bar a_t\, h_{t-1} + (1-\lambda_t)\,\Delta_t\, \bar a_t\, B_{t-1} x_{t-1}^{\top} + \lambda_t\,\Delta_t\, B_t x_t^{\top}, \\ y_t &= C_t^{\top} h_t, \\ o_t &= W_o\big(y_t \odot \operatorname{SiLU}(z_t)\big). \end{aligned}
$$

Here $$h_t \in \mathbb{R}^{N \times P}$$ holds $$N/2$$ complex numbers per value channel, each 
stored as a pair of real state dimensions. The pole $$\bar a_t$$ is therefore an $$N \times N$$ real 
matrix multiplying $$h_{t-1}$$ from the left, with one 2×2 block per pair, $$e^{\Delta_t A_t}$$ 
times a rotation. Each block does exactly what multiplying by a complex pole did in Part 3 and its 
eigenvalues are that pole and its conjugate. Further, $$B_t, C_t \in \mathbb{R}^{N}$$ and $$x_t, y_t 
\in \mathbb{R}^{P}$$. The paper's language models use $$N = 128$$ and $$P = 64$$, where our examples 
used two or three state dimensions.

<div class="fig l-page" id="fig-block">
  <p class="fig-title"><span class="fig-num">Figure 11.</span> One Mamba-3 block, annotated with the parts of this post</p>
  <p class="fig-sub">Solid boxes are parts demonstrated on this post. Dashed boxes are parts of the 
  real architecture that were not, including the gate, which is explained in the text below.</p>
  <svg class="arch arch17" viewBox="0 0 760 510" role="img" aria-label="Diagram of a Mamba-3 block with each component labelled by part">
    <defs><marker id="ah17" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ahf"/></marker></defs>
    <rect x="200" y="8" width="360" height="36" rx="8" class="bx"/>
    <text x="380" y="31" class="bt" text-anchor="middle">input from the residual stream</text>
    <line x1="380" y1="44" x2="380" y2="62" class="ln" marker-end="url(#ah17)"/>
    <rect x="200" y="64" width="360" height="36" rx="8" class="bx dash"/>
    <text x="380" y="87" class="bt" text-anchor="middle">RMSNorm, then linear projections</text>
    <line x1="380" y1="100" x2="380" y2="114" class="ln"/>
    <line x1="68" y1="114" x2="692" y2="114" class="ln"/>
    <g class="fan">
      <line x1="68" y1="114" x2="68" y2="128" class="ln" marker-end="url(#ah17)"/>
      <line x1="192" y1="114" x2="192" y2="128" class="ln" marker-end="url(#ah17)"/>
      <line x1="316" y1="114" x2="316" y2="128" class="ln" marker-end="url(#ah17)"/>
      <line x1="440" y1="114" x2="440" y2="128" class="ln" marker-end="url(#ah17)"/>
      <line x1="564" y1="114" x2="564" y2="128" class="ln" marker-end="url(#ah17)"/>
      <line x1="692" y1="114" x2="692" y2="128" class="ln" marker-end="url(#ah17)"/>
    </g>
    <rect x="12" y="130" width="112" height="86" rx="8" class="bx"/>
    <text x="68" y="151" class="bt" text-anchor="middle">xₜ</text><text x="68" y="168" class="bs" text-anchor="middle">values</text><text x="68" y="184" class="bs" text-anchor="middle">per head</text><text x="68" y="205" class="sc" text-anchor="middle">Part 2</text>
    <rect x="136" y="130" width="112" height="86" rx="8" class="bx"/>
    <text x="192" y="151" class="bt" text-anchor="middle">Bₜ, Cₜ</text><text x="192" y="168" class="bs" text-anchor="middle">key and query</text><text x="192" y="205" class="sc" text-anchor="middle">Part 2</text>
    <rect x="260" y="130" width="112" height="86" rx="8" class="bx"/>
    <text x="316" y="151" class="bt" text-anchor="middle">Δₜ, Aₜ</text><text x="316" y="168" class="bs" text-anchor="middle">step, decay</text><text x="316" y="184" class="bs" text-anchor="middle">per head</text><text x="316" y="205" class="sc" text-anchor="middle">Parts 1–3</text>
    <rect x="384" y="130" width="112" height="86" rx="8" class="bx"/>
    <text x="440" y="151" class="bt" text-anchor="middle">ωₜ</text><text x="440" y="168" class="bs" text-anchor="middle">rotation rates</text><text x="440" y="205" class="sc" text-anchor="middle">Parts 3, 5</text>
    <rect x="508" y="130" width="112" height="86" rx="8" class="bx"/>
    <text x="564" y="151" class="bt" text-anchor="middle">λₜ</text><text x="564" y="168" class="bs" text-anchor="middle">trapezoid weight</text><text x="564" y="184" class="bs" text-anchor="middle">per head</text><text x="564" y="205" class="sc" text-anchor="middle">Part 4</text>
    <rect x="636" y="130" width="112" height="86" rx="8" class="bx dash"/>
    <text x="692" y="151" class="bt" text-anchor="middle">zₜ</text><text x="692" y="168" class="bs" text-anchor="middle">gate</text><text x="692" y="184" class="bs" text-anchor="middle">per head</text><text x="692" y="205" class="sc" text-anchor="middle">see text</text>
    <line x1="192" y1="216" x2="192" y2="222" class="ln"/>
    <rect x="136" y="222" width="112" height="38" rx="6" class="bx dash"/>
    <text x="192" y="237" class="bt" text-anchor="middle">BCNorm + bias</text><text x="192" y="253" class="bs" text-anchor="middle">per head</text>
    <line x1="68" y1="216" x2="68" y2="278" class="ln" marker-end="url(#ah17)"/>
    <line x1="192" y1="260" x2="192" y2="278" class="ln" marker-end="url(#ah17)"/>
    <line x1="316" y1="216" x2="316" y2="278" class="ln" marker-end="url(#ah17)"/>
    <line x1="440" y1="216" x2="440" y2="278" class="ln" marker-end="url(#ah17)"/>
    <line x1="564" y1="216" x2="564" y2="278" class="ln" marker-end="url(#ah17)"/>
    <rect x="12" y="280" width="608" height="86" rx="8" class="bx c"/>
    <text x="316" y="304" class="bt" text-anchor="middle">selective SSM, one per head, complex pole, exponential-trapezoidal input</text>
    <text x="316" y="330" class="bs" text-anchor="middle">hₜ = āₜhₜ₋₁ + (1−λₜ)ΔₜāₜBₜ₋₁xₜ₋₁ᵀ + λₜΔₜBₜxₜᵀ</text>
    <text x="316" y="352" class="bs" text-anchor="middle">yₜ = Cₜᵀhₜ</text>
    <line x1="692" y1="216" x2="692" y2="380" class="ln" marker-end="url(#ah17)"/>
    <line x1="316" y1="366" x2="316" y2="400" class="ln"/>
    <line x1="316" y1="400" x2="600" y2="400" class="ln" marker-end="url(#ah17)"/>
    <rect x="602" y="382" width="146" height="36" rx="8" class="bx dash"/>
    <text x="675" y="405" class="bt" text-anchor="middle">yₜ ⊙ SiLU(zₜ)</text>
    <line x1="675" y1="418" x2="675" y2="438" class="ln"/>
    <line x1="675" y1="438" x2="562" y2="438" class="ln" marker-end="url(#ah17)"/>
    <rect x="200" y="422" width="360" height="34" rx="8" class="bx"/>
    <text x="380" y="444" class="bt" text-anchor="middle">linear, add to residual stream (Part 4)</text>
    <line x1="380" y1="456" x2="380" y2="472" class="ln" marker-end="url(#ah17)"/>
    <rect x="200" y="474" width="360" height="30" rx="8" class="bx dash"/>
    <text x="380" y="494" class="bs" text-anchor="middle">SwiGLU MLP block, then the next Mamba-3 block</text>
    <text x="12" y="392" class="bs">optional MIMO: Bₜ, Cₜ, xₜ widened to rank R</text>
    <text x="12" y="410" class="bs">(same state size, faster generation)</text>
  </svg>
</div>

Each term of the recurrence is one of the mechanisms this post has built. $$\bar a_t$$ is the pole. 
Its decay $$e^{\Delta_t A_t}$$ is that of Parts 1 to 3, opened and closed through the step size like 
the latch of Part 2 or through $$A_t$$ like the compass gate of Part 3. Its rotation $$R_t$$ is that 
of Parts 3 and 5, turning the state or switching it between positions. The two input terms are the 
trapezoidal rule of Part 4 and $$\lambda_t = 1$$ gives back Mamba-2's Euler rule. $$B_t$$ and 
$$C_t$$ are the key and query of the recall task in Part 2, shared by all heads. Stacking blocks 
through the residual stream is what let Part 4 integrate a product of two signals.

The gate deserves a word of its own since no part used it. After the state-space layer, every output 
channel is multiplied by $$\operatorname{SiLU}(z_t)$$, where $$z_t$$ is another projection of the 
current input. SiLU is close to zero for negative arguments and close to linear for positive ones, 
so the current input decides how much of each output channel passes. It is the second place, besides 
$$C_t$$, where the current input multiplies the remembered past. The rhythm model of Part 5 needed 
exactly this kind of interaction. The same beat position had to be read differently after a note 
than after a bar line and there the readout itself depended on the current token. In the real block 
that job is shared between the input-dependent $$C_t$$ and the gate.

Three more parts of the real architecture were not demonstrated here. $$B_t$$ and $$C_t$$ are 
normalized like the query–key normalization of modern Transformers. They also get a small learned 
bias per head. The paper uses both for stable training and expressivity. The short convolution that 
earlier Mamba-2 blocks apply to the input before the state-space layer is gone. The paper finds that 
the trapezoidal term, which acts as a convolution of width two on the state input together with the 
biases makes it unnecessary. And in full language models, Mamba-3 blocks alternate with ordinary MLP 
blocks, which add nonlinearity at every position between the recurrences. None of our models had 
them. An optional multi-input, multi-output (MIMO) form widens $$B_t$$, $$C_t$$ and $$x_t$$ to rank 
$$R$$, adding expressivity while keeping generation fast.

### Looking back

Every model in this post was a stack of input-driven linear systems. A pole on the real segment 
gives memory with a timescale. Letting the input move the pole gives a latch that writes and forgets 
on command. Letting the pole leave the real axis gives a state that turns or switches between a 
fixed number of positions. Stacking layers lets one system's state become another's input, which is 
how products of history-dependent quantities get integrated. Each recurrence stays linear in its 
state, which is what keeps the computation parallel. All the nonlinearity lives in how the inputs 
set the poles and in the readouts. The same machinery that tracks a vehicle's heading tracks the 
beat of a bar.

### Where to go next

This post focused on the building blocks. The papers go much further, they show how to make the same 
computation fast on real hardware. Mamba-1 runs its selective scan as a fused GPU kernel that keeps 
the state in fast on-chip memory. Mamba-2's state space duality turns most of the work into matrix 
multiplications over chunks of the sequence and Mamba-3's MIMO form gives the arithmetic units more 
to do during generation, which is otherwise limited by memory traffic rather than compute. Mamba-2 
paper is a great resource for the relation between SSMs and attention. The papers report experiments 
with models of billions of parameters on language, retrieval and state tracking and study hybrids 
that combine Mamba layers with a few attention layers. If this post made the pieces feel familiar, 
the papers are the place to see them at full scale.
