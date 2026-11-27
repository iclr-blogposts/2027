---
layout: distill
title: Don't Overthink Your Distributed Training
description: With PyTorch's DDP on up to 32 GPUs, communication accounts for at most about 6.5% of training time on V100 GPUs with Omni-Path,
  and at most about 5.5% on H100 GPUs with InfiniBand, across transformers, a CNN and a deep MLP.
  No communication-reduction method can save more than that, so for models that fit on one GPU,
  plain synchronous data parallelism leaves little to gain.
date: 2027-04-30
future: true
htmlwidgets: true
hidden: true

# Anonymize when submitting
# authors:
#   - name: Anonymous

authors:
  - name: Hippolyte Verninas
    affiliations:
      name: Université Paris-Saclay, Inria, CEA, Palaiseau, 91120, France
  - name: Hadrien Hendrikx
    affiliations:
      name: Université Grenoble Alpes, Inria, CNRS, Grenoble INP, LJK, Grenoble, 38000, France
  - name: Thomas Moreau
    affiliations:
      name: Université Paris-Saclay, Inria, CEA, Palaiseau, 91120, France

# must be the exact same name as your blogpost
bibliography: 2027-04-30-distributed-training.bib

toc:
  - name: Introduction
  - name: How Gradients Are Communicated
    subsections:
      - name: Ring All-Reduce
      - name: Communication Overlap
  - name: Measuring the Communication Overhead
    subsections:
      - name: A Typical Deep Learning Setup
      - name: Isolating communication time
      - name: Results
  - name: Conclusion

# Segmented toggles for figures/code: radio inputs, then .seg labels, then the panes (img or highlight figure).
_styles: >
  .toggle > input { position: absolute; opacity: 0; pointer-events: none; }
  .toggle .seg { display: flex; width: fit-content; margin: 0 auto; gap: 2px; padding: 3px; background: rgba(127,127,127,.15); border-radius: 999px; font-size: .9rem; }
  .toggle .seg label { cursor: pointer; margin: 0; padding: .25rem 1.1rem; border-radius: 999px; opacity: .7; transition: background .15s, box-shadow .15s; }
  .toggle .seg label:hover { opacity: 1; }
  .toggle > input:nth-of-type(1):checked ~ .seg label:nth-of-type(1),
  .toggle > input:nth-of-type(2):checked ~ .seg label:nth-of-type(2),
  .toggle > input:nth-of-type(3):checked ~ .seg label:nth-of-type(3),
  .toggle > input:nth-of-type(4):checked ~ .seg label:nth-of-type(4) { background: var(--global-bg-color); opacity: 1; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.15); }
  .toggle > input:nth-of-type(1):focus-visible ~ .seg label:nth-of-type(1),
  .toggle > input:nth-of-type(2):focus-visible ~ .seg label:nth-of-type(2),
  .toggle > input:nth-of-type(3):focus-visible ~ .seg label:nth-of-type(3),
  .toggle > input:nth-of-type(4):focus-visible ~ .seg label:nth-of-type(4) { outline: 2px solid var(--global-theme-color); outline-offset: 1px; }
  .toggle > :is(img, figure) { display: none !important; max-width: 100%; margin: .8rem auto 0 !important; }
  .toggle > input:nth-of-type(1):checked ~ :is(img, figure):nth-of-type(1),
  .toggle > input:nth-of-type(2):checked ~ :is(img, figure):nth-of-type(2),
  .toggle > input:nth-of-type(3):checked ~ :is(img, figure):nth-of-type(3),
  .toggle > input:nth-of-type(4):checked ~ :is(img, figure):nth-of-type(4) { display: block !important; }
---
## Introduction

You have a model that trains fine on one GPU, and you want to speed up its training by spreading it over a few dozen. To set up such distributed training, should you reach for gradient compression, local SGD, or some clever new communication scheme to shave off some training time? Or can you just wrap your model in DistributedDataParallel and press run?

Distributed training spreads the work over several GPUs, either to train models that are too large for one GPU, or to process larger batches in the same time. When the model does not fit in memory, its computation must be split across devices, by slicing each layer (tensor parallelism <d-cite key="megatronlm"></d-cite>) or by distributing whole layers (pipeline parallelism <d-cite key="gpipe"></d-cite>). This model parallelism comes with its own trade-offs, which we leave aside here.

When the model fits on one GPU, the simpler option is to split the data instead. Each GPU keeps a full copy of the model and processes its share of a larger batch, which gives less noisy gradients and often allows larger steps. Since data points are processed independently, the GPUs only need to average their gradients after each step. This is data parallelism, the setting we consider here, through PyTorch's Distributed Data Parallel (DDP), by far the most widely used implementation.

<figure class="toggle">
<input type="radio" name="intro-code" id="intro-single" checked>
<input type="radio" name="intro-code" id="intro-ddp">
<input type="radio" name="intro-code" id="intro-powersgd">
<div class="seg"><label for="intro-single">Single GPU</label><label for="intro-ddp">DDP</label><label for="intro-powersgd">DDP + PowerSGD</label></div>

{% highlight python %}
model = Model().cuda()
opt = torch.optim.Adam(model.parameters())
loader = DataLoader(dataset, batch_size=B, shuffle=True)

for x, y in loader:
    loss = loss_fn(model(x.cuda()), y.cuda())
    opt.zero_grad()
    loss.backward()
    opt.step()
{% endhighlight %}

{% highlight python %}
# launched with torchrun, one process per GPU
dist.init_process_group("nccl")
torch.cuda.set_device(int(os.environ["LOCAL_RANK"]))
model = DDP(Model().cuda())
opt = torch.optim.Adam(model.parameters())
loader = DataLoader(dataset, batch_size=B, sampler=DistributedSampler(dataset))

for x, y in loader:
    loss = loss_fn(model(x.cuda()), y.cuda())
    opt.zero_grad()
    loss.backward()  # gradients are all-reduced here
    opt.step()
{% endhighlight %}

{% highlight python %}
# launched with torchrun, one process per GPU
dist.init_process_group("nccl")
torch.cuda.set_device(int(os.environ["LOCAL_RANK"]))
model = DDP(Model().cuda())
state = powerSGD.PowerSGDState(process_group=None, matrix_approximation_rank=1,
                               start_powerSGD_iter=1000)
model.register_comm_hook(state, powerSGD.powerSGD_hook)  # compress gradients
opt = torch.optim.Adam(model.parameters())
loader = DataLoader(dataset, batch_size=B, sampler=DistributedSampler(dataset))

for x, y in loader:
    loss = loss_fn(model(x.cuda()), y.cuda())
    opt.zero_grad()
    loss.backward()  # compressed gradients are all-reduced here
    opt.step()
{% endhighlight %}

<figcaption>
<p>Going from one GPU to many with DDP changes only the setup, not the training loop. Gradient compression such as PowerSGD <d-cite key="powersgd"></d-cite> is a few more lines, but it changes the optimisation itself.</p>
</figcaption>
</figure>

The main cost DDP adds to the single-GPU loop is communication: at every step, the GPUs must exchange their gradients. This communication is often presented as the main bottleneck of distributed training, and a large body of research proposes to reduce it by changing what is sent, or when <d-cite key="dgc,localsgd,powersgd,diloco"></d-cite>. Gradient compression <d-cite key="qsgd,terngrad,topk,signsgdmv"></d-cite> and local SGD <d-cite key="localsgd,postlocalsgd,slowmo"></d-cite>, for instance, promise to cut the time spent synchronising workers, but trade it against slower convergence or extra computation. Whether that trade is worth making depends on how large the overhead is in the first place, and this is rarely measured directly. In fact, many of these methods report their gains in training steps or communication rounds rather than in measured wall-clock time <d-cite key="localsgd,diloco"></d-cite>, and their convergence is often studied without any real network communication, with workers simulated or run on a single machine <d-cite key="localsgd,topk,ef21"></d-cite>.

In this post, we measure this overhead. Through benchmarks on HPC clusters, we time the communication of standard synchronous data-parallel training across a range of models and hardware configurations, on up to 32 GPUs. In many common settings, we find that it is already small, often just a few percent of total training time, which caps what any communication-reduction method can save in these settings.
These results are in line with Agarwal et al. <d-cite key="agarwal2022utility"></d-cite>, who find that an optimised all-reduce with communication overlap leaves little room for gradient compression.

Before looking at the measurements, let us briefly recall how DDP works and where communication comes into play.


**Standard SGD.** Given a dataset $$(\mathbf{x}_i)_{i=1}^n$$, training minimises an empirical loss

$$\min_{\boldsymbol{\theta} \in \mathbb{R}^d} \mathcal{L}(\boldsymbol{\theta}) = \frac{1}{n} \sum_{i=1}^{n} \ell(\boldsymbol{\theta};\, \mathbf{x}_i).$$

At each step $$t$$, SGD samples a batch $$\mathcal{B} \subset [n]$$ and performs the update

$$\boldsymbol{\theta}_{t+1} = \boldsymbol{\theta}_t - \eta \, \frac{1}{\lvert\mathcal{B}\rvert} \sum_{i \in \mathcal{B}} \nabla \ell(\boldsymbol{\theta}_t;\, \mathbf{x}_i).$$

The batch gradient is a sum of per-sample gradients, and each of them depends only on the current parameters $$\boldsymbol{\theta}_t$$ and on a single data point $$\mathbf{x}_i$$. They can thus be computed in any order and accumulated, giving exactly the same update. This is what gradient accumulation exploits on a single GPU, to emulate a batch too large to fit in memory. Layers that mix the samples of a batch, such as batch normalisation, are the main exception.

**Distributed data-parallel SGD.** Since the batch gradient is a sum over samples, the batch can be split across workers, each computing the gradient of its own part. The workers never need to exchange data points or activations, only their partial gradients. With $$m$$ workers, each worker $$k$$ holds a replica of the current parameters $$\boldsymbol{\theta}_t$$ and draws a local batch $$\mathcal{B}_k$$ (with $$\lvert\mathcal{B}_k\rvert = B$$). Worker $$k$$ computes a local gradient

$$\mathbf{g}_{t,k} = \frac{1}{B} \sum_{i \in \mathcal{B}_k} \nabla \ell(\boldsymbol{\theta}_t;\, \mathbf{x}_i),$$

and workers synchronise by averaging those gradients across all $$m$$ workers (the *all-reduce* step, detailed below):

$$\bar{\mathbf{g}}_t = \frac{1}{m} \sum_{k=1}^{m} \mathbf{g}_{t,k}.$$

The shared parameter is then updated as

$$\boldsymbol{\theta}_{t+1} = \boldsymbol{\theta}_t - \eta\, \bar{\mathbf{g}}_t.$$

This is the same update as SGD on a single GPU with a global batch of size $$mB$$. It also holds for adaptive optimisers such as Adam, which we use in our experiments: only the gradient is averaged, and every worker then applies the same optimiser step, so the replicas stay identical.

**How much is communicated.** Each gradient is as large as the model itself: about 500 MB for GPT-2 small (124M parameters in fp32). This is small compared to the memory of a GPU. With Adam, the weights, the gradients and the two moment estimates already take four times the model size. The activations take most of the rest, because the batch size on each GPU is usually set as large as memory allows, to keep the GPU fully busy. With a smaller batch, a single GPU would sit partly idle, and there would be little point in distributing the computation. The naive way to compute $$\bar{\mathbf{g}}_t$$ is then for every worker to send its gradient to every other worker. Each worker sends $$m-1$$ copies of its gradient per step, so the traffic grows with the number of workers. Smarter algorithms, described in the next section, avoid this factor $$m-1$$ altogether.

To reduce this cost further, many methods compress gradients before communication, through quantisation <d-cite key="qsgd"></d-cite>, sparsification <d-cite key="topk"></d-cite>, often combined with error feedback <d-cite key="ef21"></d-cite>, or low-rank approximations <d-cite key="powersgd"></d-cite>, to reduce the volume of data exchanged. Another line of work, local SGD <d-cite key="localsgd,slowmo"></d-cite>, communicates less often by letting workers take several local steps between synchronisations. As we will see, however, communication already accounts for a small fraction of total training time in most practical settings, so these methods can save at most a few percent of training time, which must be weighed against their effect on convergence.

## How Gradients Are Communicated

To understand why this overhead is small, let us first look at how communication is performed in practice.

### Ring All-Reduce

Ring All-Reduce <d-cite key="ringallreduce"></d-cite> is a method for synchronising gradients across multiple workers in a distributed training setting. It works by organising the workers in a ring, where each worker sends data to the next worker in the ring, and receives data from the previous one.

The first step of Ring All-Reduce is to break the gradients into smaller chunks. For $$m$$ workers, the gradients are split into $$m$$ chunks.

Ring All-Reduce then consists of two phases: the reduce phase (often called reduce-scatter) and the share phase (all-gather). During the reduce phase, each worker sends one chunk of its gradients to the next worker in the ring, and receives a chunk from the previous one. Each worker adds the received chunk to its own corresponding chunk, and sends the partial sum to the next node at the following step. After $$m-1$$ steps, every chunk has travelled around the ring and has been summed over all workers.

At the end of the reduce phase, each worker holds one fully summed chunk. In the 3-worker example of the animation below, the gradients of workers A, B and C are $$\mathbf{a}$$, $$\mathbf{b}$$ and $$\mathbf{c}$$, and each worker ends up holding a different summed chunk $$\mathbf{s}_i=\mathbf{a}_i+\mathbf{b}_i+\mathbf{c}_i$$, where $$\mathbf{a}_i$$, $$\mathbf{b}_i$$, $$\mathbf{c}_i$$ are the $$i$$-th chunks of the three gradients. Then, during the share phase, each worker sends its summed chunk $$\mathbf{s}_i$$ to the next worker in the ring, and receives a summed chunk from the previous one. When receiving a summed chunk, each worker stores it in the correct position in the gradient vector, without adding it to its own gradients, since it has already been summed during the reduce phase.

<figure>
<iframe src="{{ 'assets/html/2027-04-30-distributed-training/ring_allreduce.html' | relative_url }}" title="Ring All-Reduce animation" loading="lazy" style="width: 100%; height: 580px; border: 0;"></iframe>
<figcaption>
<p>Ring All-Reduce with 3 workers: the gradients are split into chunks, summed during the reduce phase, then shared and concatenated back.</p>
</figcaption>
</figure>

With this method, each worker sends $$2(m-1)$$ messages, each containing $$\frac{s}{m}$$ bytes, where $$s$$ is the size (in bytes) of the gradients. The method is bandwidth optimal, meaning that it minimises the amount of data that each worker needs to send and fully utilises the available bandwidth, which significantly reduces the communication time when the gradients are large. Under the standard latency–bandwidth cost model <d-cite key="thakur"></d-cite>, the communication time for Ring All-Reduce is:

$$
T_\text{comm} = \underbrace{2 (m-1)\, \alpha}_{\text{latency}} + \underbrace{\frac{2 (m-1)}{m} \frac{s}{\beta}}_{\text{bandwidth}}
$$

where $$m$$ is the number of workers, $$\alpha$$ is the latency of a single message, $$\beta$$ is the bandwidth, and $$s$$ is the size of the gradients. The two terms behave very differently. The latency term grows linearly with the number of workers but does not depend on the size of the gradients. The bandwidth term grows linearly with the size of the gradients, but is almost independent of the number of workers, since $$\frac{m-1}{m} \leq 1$$.

Which term dominates therefore decides how communication scales. For deep learning models, the gradients typically weigh hundreds of megabytes or more, so the bandwidth term dominates as long as the number of workers stays moderate. In this regime, the communication time per step is nearly constant as workers are added, while each step processes proportionally more data: this is what makes synchronous data-parallel training scale well. The latency term only becomes significant for small models, or for very large numbers of workers.

### Communication Overlap

In addition to Ring All-Reduce, communication overlap can be used to further reduce the perceived communication time during training. Indeed, when training deep learning models, the models are often organised in layers, and the gradients for each layer are computed sequentially. This allows for the communication of the gradients to be overlapped with the computation of the gradients of the layer before it (the backward pass runs from the last layer to the first), which can significantly reduce the perceived communication time. This requires no extra effort from the user: existing deep learning libraries implement it out of the box, for example PyTorch's DistributedDataParallel (DDP) <d-cite key="pytorchddp"></d-cite>, which groups the gradients into buckets and launches the all-reduce of each bucket as soon as its gradients are computed.

<figure>
<iframe src="{{ 'assets/html/2027-04-30-distributed-training/comm_interleave.html' | relative_url }}" title="Communication overlap animation" loading="lazy" style="width: 100%; height: 740px; border: 0;"></iframe>
<figcaption>
<p>Backward pass with communication overlap: the gradients of each layer are all-reduced while the backward step of the layer before it is computed, so a layer could in principle be updated as soon as its gradients are averaged (by default, PyTorch's DDP still runs the optimiser step once all gradients are averaged).</p>
</figcaption>
</figure>

## Measuring the Communication Overhead

### A Typical Deep Learning Setup
Only a few organisations can train on hundreds or thousands of GPUs. Most practitioners distribute their training over a handful of nodes, with models that fit on a single GPU, and this is the setting we reproduce here. We use up to 8 nodes (32 GPUs), which is close to the resources available to many academic labs. Our models range from 16M to 355M parameters: GPT-2 small and medium (124M and 355M parameters), ConvNeXt V2 Tiny (28M parameters), and MLPs with 1 and 16 layers of width 4000 (16M and 256M parameters). Communication-efficient methods are usually evaluated at a similar or smaller scale: a few to a few dozen GPUs, with models that rarely exceed a few hundred million parameters <d-cite key="powersgd,postlocalsgd,signsgdmv,diloco"></d-cite>.

We measure the time taken by communication during the training of different models. We train the models on different numbers of GPUs, keeping the batch size constant for each GPU, so that the total batch size increases with the number of GPUs. The cluster has nodes with 4 GPUs each, and we always use all 4, so 8 nodes means 32 GPUs.

We run the experiments on two partitions of the same cluster:
* H100 partition, made up of H100 80GB GPUs, with an InfiniBand NDR400 interconnect (50 GB/s per GPU, i.e. 200 GB/s per node).
* V100 partition, made up of V100 16GB GPUs, with an Omni-Path 100 series interconnect (6.25 GB/s per GPU, i.e. 25 GB/s per node).

All models are trained with Adam. On the H100 partition, we use bf16 mixed precision (`torch.autocast`), as is now standard for training on recent GPUs. The V100 has no native bf16 support, so models are trained in fp32 there. The results below are obtained without `torch.compile`. We discuss its effect at the end of this section.

On both partitions, the 4 GPUs of a node are connected to each other through NVLink, so communication within a node is much faster than between nodes, which goes through Omni-Path or InfiniBand. More recent systems extend NVLink across nodes (e.g. NVSwitch-based rack-scale systems), with much higher bandwidth and lower latency between nodes, which would significantly reduce the communication time. However, such systems are not yet widely available, and in particular not on our cluster, so we did not evaluate the communication ratio on them. Faster interconnects reduce the communication time, but newer GPUs also compute faster, so the communication ratio depends on how both evolve. From V100 to H100, the interconnect improved more than the compute, and the ratio went down, even with bf16 on the H100.

To communicate the gradients, we use PyTorch distributed (PyTorch 2.8 with CUDA 12.8 and NCCL 2.27 on V100, PyTorch 2.13 with CUDA 13.2 and NCCL 2.29 on H100) with the NCCL backend, which picks among ring, tree and NVLink-SHARP all-reduce algorithms depending on the topology and message size, using NVLink within a node and the network between nodes.

### Isolating communication time

Measuring communication time in this setting is not straightforward. GPU operations are asynchronous by default: when an all-reduce is issued, the program does not wait for it to complete and immediately moves on to the next operation. This allows communication and computation to overlap, as described in the previous section, which is the key mechanism behind DDP's performance. However, this also means that the communication time cannot be directly observed without altering the execution. Adding explicit synchronisation barriers forces the program to wait until the all-reduce is complete, which makes the communication time measurable, but also serialises communication and computation, artificially increasing the total run time. Measuring communication time therefore requires finding a balance between accuracy and representativeness.

To address this, we run two pairs of variants. In each pair, one run is the training loop we want to measure, and the other provides the quantity it cannot measure itself.

* **DDP**, PyTorch's DistributedDataParallel, is the method used in practice: it groups the gradients of several parameter tensors into buckets and all-reduces each bucket during the backward pass, as soon as its gradients are ready, overlapping communication with computation.
* **DDP without communication (NoCom-DDP)** is DDP with the all-reduces skipped. It gives DDP's compute time: its run time is the pure compute time of a training step (we take that of the slowest worker, since workers no longer wait for each other).
* **All-Reduce (AR)** is the simplest alternative to DDP, a *per-tensor all-reduce*: after the backward pass, one all-reduce is launched for the gradient of each parameter tensor, for instance the weight matrix of a layer. None of its communication overlaps with computation.
* **Synchronised All-Reduce (Sync-AR)** is AR with all workers synchronised before the all-reduces, so that they can be timed. It gives AR's communication time: $$T^\text{comm}_\text{Sync-AR}$$ measures the time spent moving data, and nothing else.

<figure class="toggle">
<input type="radio" name="measure-code" id="measure-ddp" checked>
<input type="radio" name="measure-code" id="measure-nocom">
<input type="radio" name="measure-code" id="measure-ar">
<input type="radio" name="measure-code" id="measure-syncar">
<div class="seg"><label for="measure-ddp">DDP</label><label for="measure-nocom">NoCom-DDP</label><label for="measure-ar">AR</label><label for="measure-syncar">Sync-AR</label></div>

{% highlight python %}
# model = DDP(model): bucketed all-reduces are launched during backward
loss.backward()
opt.step()
{% endhighlight %}

{% highlight python %}
# model = DDP(model); same as DDP, but the all-reduces are skipped
model.register_comm_hook(None, noop_hook)
loss.backward()
opt.step()
{% endhighlight %}

{% highlight python %}
loss.backward()
for p in model.parameters():
    dist.all_reduce(p.grad, op=dist.ReduceOp.SUM)
    p.grad /= world_size
opt.step()
{% endhighlight %}

{% highlight python %}
loss.backward()
torch.cuda.synchronize()  # wait for the local backward pass
dist.barrier()            # wait for all workers
start.record()
for p in model.parameters():
    dist.all_reduce(p.grad, op=dist.ReduceOp.SUM)
    p.grad /= world_size
end.record()
torch.cuda.synchronize()  # T_comm = start.elapsed_time(end)
opt.step()
{% endhighlight %}

<figcaption>
<p>The gradient synchronisation step in the four variants of the training loop.</p>
</figcaption>
</figure>

**From run times to communication ratios.** We define the communication ratio of a method as the share of its run time spent on communication that is not hidden behind computation. For DDP, it is whatever DDP's run time adds on top of the same training step without communication, NoCom-DDP:

$$
R_\text{DDP} = \frac{T^\text{run}_\text{DDP} - T^\text{run}_\text{NoCom-DDP}}{T^\text{run}_\text{DDP}}.
$$

This counts the communication that DDP fails to hide behind the backward pass. Since both runs include DDP's own bookkeeping, it is not counted as communication. When noise makes DDP run slightly faster than NoCom-DDP, $$R_\text{DDP}$$ comes out slightly negative, and we clip it to zero.

AR performs all the work of a training step, computation and communication, without overlapping them. Assuming its all-reduces take as long as those timed in Sync-AR, its communication ratio is simply the measured communication time over its run time:

$$
R_\text{AR} = \frac{T^\text{comm}_\text{Sync-AR}}{T^\text{run}_\text{AR}}.
$$

We use Sync-AR only for its communication time, because the synchronisation itself is costly. For ConvNeXt V2, Sync-AR is about 3% slower than AR even on a single node, as the GPUs sit idle at each barrier. This idle time is not counted in $$T^\text{comm}_\text{Sync-AR}$$, but it inflates Sync-AR's run time.

All run times are measured over 21 training steps, after one warm-up step, and each configuration is repeated 3 times. The repetitions agree closely, so the figures show the median and, as a shaded band, the range of the repetitions. To make this benchmark more reproducible, we will make the code for these experiments available. We use the Benchopt framework <d-cite key="benchopt"></d-cite> to run the benchmarks and log the results, which allows for easy reproduction of the results.

### Results

**Transformer Models.** We benchmark the communication time on GPT-2 small and GPT-2 medium, with a fixed sequence length of 1024 tokens. We use the GPT-2 model definition from the PyTorch reference implementation of llm.c <d-cite key="llmc"></d-cite>, itself derived from nanoGPT <d-cite key="nanogpt"></d-cite>. We remove the bias terms from the linear layers and the LayerNorms of the transformer blocks. It is trained on the FineWeb <d-cite key="fineweb"></d-cite> tokens prepared for modded-nanogpt <d-cite key="modded-nanogpt"></d-cite>. On the V100 partition, we train GPT-2 small with a batch size of 8 per GPU, the largest that fits in 16 GB in fp32. We only run GPT-2 medium on the H100 partition: on the V100s, a batch of 4 sequences per GPU already runs out of memory with DDP. On the H100 partition, both models use a batch size of 32 per GPU, while memory would allow up to 64 sequences for GPT-2 small and 40 for GPT-2 medium. Smaller batches make each step cheaper to compute, which pushes the communication ratio up: on H100, our measurements are, if anything, pessimistic.

<figure class="toggle">
<input type="radio" name="nanogpt" id="nanogpt-h100" checked>
<input type="radio" name="nanogpt" id="nanogpt-medium-h100">
<input type="radio" name="nanogpt" id="nanogpt-v100">
<div class="seg"><label for="nanogpt-h100">GPT-2 small, H100</label><label for="nanogpt-medium-h100">GPT-2 medium, H100</label><label for="nanogpt-v100">GPT-2 small, V100</label></div>
<img src="{{ 'assets/img/2027-04-30-distributed-training/communication_ratio_nanogpt_h100.svg' | relative_url }}" alt="GPT-2 small communication ratio on H100">
<img src="{{ 'assets/img/2027-04-30-distributed-training/communication_ratio_nanogpt_medium_h100.svg' | relative_url }}" alt="GPT-2 medium communication ratio on H100">
<img src="{{ 'assets/img/2027-04-30-distributed-training/communication_ratio_nanogpt_v100.svg' | relative_url }}" alt="GPT-2 small communication ratio on V100">
<figcaption>
<p>Communication ratio for GPT-2 small and medium</p>
</figcaption>
</figure>

<figure class="toggle">
<input type="radio" name="rt-nanogpt" id="rt-nanogpt-h100" checked>
<input type="radio" name="rt-nanogpt" id="rt-nanogpt-medium-h100">
<input type="radio" name="rt-nanogpt" id="rt-nanogpt-v100">
<div class="seg"><label for="rt-nanogpt-h100">GPT-2 small, H100</label><label for="rt-nanogpt-medium-h100">GPT-2 medium, H100</label><label for="rt-nanogpt-v100">GPT-2 small, V100</label></div>
<img src="{{ 'assets/img/2027-04-30-distributed-training/run_time_nanogpt_h100.svg' | relative_url }}" alt="GPT-2 small run time on H100">
<img src="{{ 'assets/img/2027-04-30-distributed-training/run_time_nanogpt_medium_h100.svg' | relative_url }}" alt="GPT-2 medium run time on H100">
<img src="{{ 'assets/img/2027-04-30-distributed-training/run_time_nanogpt_v100.svg' | relative_url }}" alt="GPT-2 small run time on V100">
<figcaption>
<p>Run time of 21 training steps for GPT-2 small and medium. PowerSGD is discussed under Gradient compression below.</p>
</figcaption>
</figure>

DDP keeps the communication ratio of GPT-2 small at or below 5% on the H100 partition and 6.4% on the V100 partition, at all scales. Without overlap (AR), the ratio grows with the number of nodes, up to 14% on H100 and 18% on V100 at 8 nodes: DDP hides about two thirds of the communication. GPT-2 medium behaves almost exactly like GPT-2 small: its gradients are about three times larger, but its communication time only doubles, as does the computation of each step, so the ratios stay at 14% for AR and 5.5% for DDP at 8 nodes.

**Convolutional Neural Networks.** We benchmark ConvNeXt V2 Tiny <d-cite key="convnextv2"></d-cite> on random images of size 224×224, generated directly on the GPU, with a batch size of 64 per GPU on the V100 partition and 128 per GPU on the H100 partition. Since we only measure time, the content of the data does not matter, and random data removes any dataloading cost from the measurements.

<figure class="toggle">
<input type="radio" name="convnext" id="convnext-h100" checked>
<input type="radio" name="convnext" id="convnext-v100">
<div class="seg"><label for="convnext-h100">H100</label><label for="convnext-v100">V100</label></div>
<img src="{{ 'assets/img/2027-04-30-distributed-training/communication_ratio_conv_h100.svg' | relative_url }}" alt="ConvNeXt V2 communication ratio on H100">
<img src="{{ 'assets/img/2027-04-30-distributed-training/communication_ratio_conv_v100.svg' | relative_url }}" alt="ConvNeXt V2 communication ratio on V100">
<figcaption>
<p>Communication ratio for ConvNeXt V2 on the H100 and V100 partitions</p>
</figcaption>
</figure>

<figure class="toggle">
<input type="radio" name="rt-convnext" id="rt-convnext-h100" checked>
<input type="radio" name="rt-convnext" id="rt-convnext-v100">
<div class="seg"><label for="rt-convnext-h100">H100</label><label for="rt-convnext-v100">V100</label></div>
<img src="{{ 'assets/img/2027-04-30-distributed-training/run_time_conv_h100.svg' | relative_url }}" alt="ConvNeXt V2 run time on H100">
<img src="{{ 'assets/img/2027-04-30-distributed-training/run_time_conv_v100.svg' | relative_url }}" alt="ConvNeXt V2 run time on V100">
<figcaption>
<p>Run time of 21 training steps for ConvNeXt V2 on the H100 and V100 partitions. PowerSGD is discussed under Gradient compression below.</p>
</figcaption>
</figure>

Without overlap (AR), the communication ratio grows steadily with the number of nodes, reaching 11% on H100 and 14% on V100 at 8 nodes. DDP hides almost all of it: its ratio stays at or below 2% on H100 and 3% on V100.

**MLP.** To see how the benefit of overlapping depends on the depth of the model, we benchmark two MLPs of width 4000 (bias-free linear layers with ReLU activations, trained with a squared loss on random data): one with a single layer, and one with 16 layers. The batch size is set to 12k per GPU, and the models are trained on the V100 partition.

MLPs are not representative of the models used in practice, but they make the role of depth easy to isolate: in a deep MLP, the backward pass of each layer can be computed while the gradients of the layers after it are communicated. Note that the communication ratio also depends directly on the batch size: larger batches mean more computation per all-reduce, and therefore a lower ratio.

<figure class="toggle">
<input type="radio" name="mlp" id="mlp-1" checked>
<input type="radio" name="mlp" id="mlp-16">
<div class="seg"><label for="mlp-1">1 layer</label><label for="mlp-16">16 layers</label></div>
<img src="{{ 'assets/img/2027-04-30-distributed-training/communication_ratio_mlp_1.svg' | relative_url }}" alt="MLP-1 communication ratio">
<img src="{{ 'assets/img/2027-04-30-distributed-training/communication_ratio_mlp_16.svg' | relative_url }}" alt="MLP-16 communication ratio">
<figcaption>
<p>Communication ratio for an MLP with 1 and 16 layers on the V100 partition</p>
</figcaption>
</figure>

<figure class="toggle">
<input type="radio" name="rt-mlp" id="rt-mlp-1" checked>
<input type="radio" name="rt-mlp" id="rt-mlp-16">
<div class="seg"><label for="rt-mlp-1">1 layer</label><label for="rt-mlp-16">16 layers</label></div>
<img src="{{ 'assets/img/2027-04-30-distributed-training/run_time_mlp_1.svg' | relative_url }}" alt="MLP-1 run time">
<img src="{{ 'assets/img/2027-04-30-distributed-training/run_time_mlp_16.svg' | relative_url }}" alt="MLP-16 run time">
<figcaption>
<p>Run time of 21 training steps for an MLP with 1 and 16 layers on the V100 partition. PowerSGD is discussed under Gradient compression below.</p>
</figcaption>
</figure>

With a single layer, there is nothing to overlap: the only gradient is ready at the very end of the backward pass, so DDP cannot hide any communication. Bucketing does not help either, since the model has a single weight matrix and AR already sends it in one all-reduce. Both methods reach a ratio of 15–17% from 4 nodes on. With 16 layers, on the other hand, DDP brings the communication ratio from 11–13% down to less than 3% at 4 and 8 nodes.

The benefit of overlapping therefore depends on the depth of the model: the more layers, the more backward computation is available to hide the communication of the gradients that are already computed. Real deep learning models, with tens to hundreds of layers, are much closer to the 16-layer case than to the single-layer one, which explains why DDP hides most of the communication for the transformers and CNNs above.

This also matters when reading the distributed optimisation literature. Linear models such as logistic regression, the main or only benchmark of several communication-efficient methods <d-cite key="localsgd,topk,ef21"></d-cite>, behave like our single-layer MLP: there is nothing to overlap, so communication is as exposed as it can be. Conclusions drawn on such models do not carry over to deep networks, where most of the communication is hidden for free.

**Effect of `torch.compile`.** Compilation fuses operations into faster kernels and is widely used in practice, so we also ran every configuration with `torch.compile`. On H100 with bf16, it cuts the compute time of a training step substantially: by 27% for GPT-2 small, 18% for GPT-2 medium and a factor of 2.7 for ConvNeXt. On V100 in fp32, the gains are smaller (2% for GPT-2 small, 15% for ConvNeXt), and the MLPs do not speed up at all. Faster computation alone raises the communication ratio, since the same communication now weighs more: for ConvNeXt on H100, the ratio of AR goes from 11% to 25% at 8 nodes.

Compilation also weakens DDP's overlap. At 8 nodes, DDP's ratio goes from 5.0% to 9.5% for GPT-2 small on H100, and from 6.4% to 13.6% on V100, where compilation barely speeds up the model. For the 16-layer MLP, which compilation does not speed up at all, it goes from 1.5% to 9.5%, close to the 11% of AR: compilation only removes the overlap. PyTorch splits compiled models at DDP's bucket boundaries precisely to preserve the overlap, and we have not established why it falls short here. On H100 and for ConvNeXt, compilation remains a net gain despite this, but for GPT-2 small and the 16-layer MLP on V100, compiled DDP is slower than uncompiled DDP at 8 nodes. With a compiled model, it is worth checking that the overlap still works.

**Gradient compression.** The communication ratio bounds what any communication-reduction method can save. To see how much of it a real method recovers, we ran PowerSGD <d-cite key="powersgd"></d-cite> through PyTorch's built-in DDP communication hook, as in the code at the top of this post. We use rank 1, the most aggressive compression, with the default error feedback and warm start. PowerSGD replaces each gradient matrix by a rank-1 approximation, so it sends only a tiny fraction of the gradient. In exchange, it adds two matrix products and an orthogonalisation per layer at every step. The table below gives its run time relative to DDP, without `torch.compile`; negative values mean that PowerSGD is faster.

| GPU | Model | 1 node | 2 nodes | 4 nodes | 8 nodes |
|---|---|---|---|---|---|
| H100 | GPT-2 small | +3.1% | +2.2% | +3.7% | +3.5% |
| H100 | GPT-2 medium | +3.8% | +2.5% | +2.3% | +3.7% |
| H100 | ConvNeXt V2 | +5.6% | +5.8% | +5.8% | +4.3% |
| V100 | GPT-2 small | +1.2% | +2.4% | +0.9% | +0.5% |
| V100 | ConvNeXt V2 | +6.5% | +6.6% | +5.1% | +5.9% |
| V100 | MLP, 1 layer | +2.2% | -3.5% | -11.9% | -11.9% |
| V100 | MLP, 16 layers | +0.6% | +1.0% | -0.2% | +0.1% |

On the transformers and ConvNeXt, where DDP already hides most of the communication, PowerSGD is slower than DDP at every scale and on both partitions. It is 2–4% slower for GPT-2 small and medium on H100 and up to 2.4% slower for GPT-2 small on V100, and 4–7% slower for ConvNeXt. Compressing the gradients costs more than the little communication that is left to save. PowerSGD only pays off where communication is exposed. For the single-layer MLP, it saves 12% at 4 and 8 nodes, most of the 14–15% that DDP leaves exposed. For the 16-layer MLP, where DDP leaves less than 3% exposed, PowerSGD runs within 1% of DDP at every scale. Apart from the 16-layer MLP, which we ran with all methods in the same session, PowerSGD was measured in a separate run, on other nodes of the partition, so differences of a few percent are within the run-to-run variation. These are run times only: rank-1 compression also changes the optimisation and may need more steps to reach the same loss, which can only widen the gap on GPT-2 and ConvNeXt.

## Conclusion

The distributed training landscape can feel overwhelming: a large menu of methods, each with its own claims about communication efficiency, and little practical guidance on when any of them are worth the trouble. This post offers one concrete data point to navigate that landscape.

Across transformers, convolutional networks, and deep MLPs, on both V100 and H100 hardware and up to 32 GPUs, we find that communication accounts for only a small fraction of total training time when using standard synchronous data parallelism with DDP: at most about 6.5% on V100 with Omni-Path, and at most about 5.5% on H100 with InfiniBand. The exception is the single-layer MLP, where nothing can be overlapped and communication reaches about 15%, but real models are deep enough to avoid this case. Gradient compression or local SGD can then save at most these few percent, while they can slow convergence. In our measurements, PowerSGD did not even save these: it was slower than DDP on GPT-2 small and medium and on ConvNeXt, on both partitions, and only paid off for the single-layer MLP.

Communication overlap, by contrast, is essentially free: PyTorch's DDP implements it out of the box, and our experiments show that it hides a large part of the communication cost for models with many layers.

These conclusions hold for well-connected clusters. Communication-efficient methods remain relevant where bandwidth is scarce, such as clusters connected by commodity Ethernet, training across data centres <d-cite key="diloco"></d-cite>, or federated learning. The picture also changes for models with billions of parameters, whose weights and optimiser state no longer fit on a single GPU. Tensor parallelism <d-cite key="megatronlm"></d-cite> and pipeline parallelism <d-cite key="gpipe"></d-cite> then become necessary, and sharded data parallelism such as ZeRO <d-cite key="zero"></d-cite> trades memory for up to 50% more communication, so the communication overhead becomes more significant. But for models that fit on one GPU, trained on a well-connected cluster with up to a few dozen GPUs, the right answer is simpler than the literature might suggest: use synchronous data parallelism with DDP, and spend the saved engineering effort elsewhere.

More broadly, this is the classic advice to profile before optimising. As Knuth put it, "premature optimization is the root of all evil" <d-cite key="knuth"></d-cite>. Before adopting a communication-efficient method, measure how much of your training time is actually spent communicating. On a well-connected cluster, it is likely less than you think.
