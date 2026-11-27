---
layout: distill
title: 'Learning Local Universes: Neural Cellular Automata as decentralized world models'
description: >-
  Can a world model simulate complex environments using decentralized, repeated, and mostly local rules?
  We investigate Neural Cellular Automata (NCA) as a foundation for world modeling (W-NCA), achieving lightweight and generalizable simulations across diverse environments.
  To do that, W-NCA uses only 40k–140k parameters, making it runnable directly in the browser.
date: 2027-04-30
future: true
htmlwidgets: true
related_posts: false
authors:
  - name: Anonymous
    affiliations:
      name: Anonymous
bibliography: 2027-04-30-learning-local-universes.bib
toc:
  - name: Introduction
  - name: Model Architecture
  - name: Training Setup
  - name: Game Environments
    subsections:
      - name: Breakout
      - name: Snake
  - name: Text Editor
  - name: Two-Room Navigation
  - name: 'Bonus: The Physics of Computation'
  - name: Discussion and Future Work
_styles: |
  /* Post-specific refinements within the venue's Distill template.
     Retain its fonts, article grid, title, contents and citation styling. */
  /* Keep the native venue logo fully visible on narrow screens. */
  body:has(.post.distill .lu-hero) > header:has(nav)::after { background-size: min(400px, calc(100vw - 32px)); }
  /* Prevent scrolled content from showing through the fixed navigation. */
  body:has(.post.distill .lu-hero) #navbar { opacity: 1; }
  .post.distill > d-title { padding: 1.5rem 0 .75rem; }
  .post.distill > d-title h1 {
    font-size: clamp(2rem, 3.5vw, 2.75rem);
    font-weight: 500;
    line-height: 1.24;
    letter-spacing: normal;
    text-wrap: balance;
  }
  .post.distill > d-byline .byline > div:not(.authors-affiliations) { display: none; }
  .post.distill > d-byline .byline { grid-template-columns: 1fr; }
  .post.distill > d-byline .authors-affiliations {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 2rem;
    margin-bottom: 0;
  }
  .post.distill > d-byline { padding-block: .75rem; }
  .post.distill > d-byline .authors-affiliations h3 { font-size: max(.75rem, 12px); letter-spacing: .06em; }
  .post.distill > d-byline .authors-affiliations p { font-size: max(.875rem, 14px); line-height: 1.5; }
  .post.distill > d-title p,
  .post.distill d-article p,
  .post.distill d-article li,
  .post.distill d-appendix p,
  .post.distill d-appendix li {
    text-align: justify;
    text-justify: inter-word;
    hyphens: auto;
    text-wrap: pretty;
  }
  .post.distill .lu-question { text-align: center; }
  /* The template renders the front-matter abstract directly beneath the title. */
  /* Keep the cover ahead of the native contents/prose grid rows. */
  .post.distill d-article > .lu-hero { order: -2; }
  .post.distill d-article > .lu-hero { margin-block: 0 1rem; }
  .post.distill .lu-hero iframe { display: block; width: 100%; border: 0; }
  /* Clip figure edges without making the article a separate scroll container;
     the architecture/training illustrations stick to the document viewport. */
  .post.distill > d-article:first-of-type { padding-top: .5rem; overflow-x: clip; overflow-y: visible; }
  @media (max-width: 767px) {
    .post.distill > d-title { padding: 1.5rem 0 1rem; }
    .post.distill > d-byline { padding-block: 1rem; }
    .post.distill > d-article:first-of-type { padding-top: 1.25rem; }
  }
  
  /* Architecture and training keep their narrative in the article. Browsers
     without the scrolling layout get native stage controls; print shows every stage. */
  .post.distill .lu-stage-section {
    --lu-accent: var(--global-theme-color, #0076df);
    --lu-border: var(--global-divider-color, #ddd);
    --lu-panel: var(--global-bg-color, #fff);
    --lu-stage-soft: color-mix(in srgb, var(--lu-accent) 6%, var(--lu-panel));
    margin-top: 1.5em;
    margin-bottom: 2.5em;
  }
  .post.distill .lu-stage-header { position: relative; z-index: 4; margin: 0; padding: .5em 0 .75em; background: var(--lu-panel); }
  .post.distill d-article .lu-stage-header h2 { margin: 0 0 14px; }
  .post.distill .lu-stage-nav,
  .post.distill .lu-stage-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    padding: 5px;
    border: 1px solid color-mix(in srgb, var(--lu-accent) 14%, var(--lu-border));
    border-radius: 14px;
    background: var(--lu-stage-soft);
  }
  .post.distill d-article .lu-stage-nav a,
  .post.distill .lu-stage-tabs label {
    --lu-tab-foreground: color-mix(in srgb, var(--global-text-color, #334155) 75%, var(--lu-panel));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 38px;
    box-sizing: border-box;
    background: transparent;
    border: 1px solid transparent;
    color: var(--lu-tab-foreground) !important;
    border-radius: 9px;
    padding: 7px 9px;
    font-size: max(.7em, 14px);
    font-weight: 600;
    line-height: 1.35;
    text-align: center;
    text-decoration: none;
  }
  .post.distill d-article .lu-stage-nav a:hover,
  .post.distill .lu-stage-tabs label:hover { background: color-mix(in srgb, var(--lu-accent) 10%, var(--lu-panel)); }
  .post.distill d-article .lu-stage-nav a:focus-visible,
  .post.distill .lu-stage-tabs label:has(input:focus-visible) { outline: 2px solid var(--lu-accent); outline-offset: 3px; }
  .post.distill .lu-stage { position: relative; margin: 0 0 2em; }
  .post.distill .lu-stage-window {
    position: relative;
    width: 100%;
    margin: 0 0 1em;
    border: 1px solid var(--lu-border);
    border-radius: 12px;
    overflow: hidden;
    background: var(--lu-panel);
  }
  .post.distill .lu-stage-window img { width: 100%; aspect-ratio: 1050 / 550; object-fit: contain; }
  .post.distill .lu-step-card {
    position: relative;
    background: var(--lu-panel);
    border: 1px solid var(--lu-border);
    border-radius: 12px;
    padding: 1.1em 1.3em;
    margin: 0;
  }
  .post.distill .lu-step-card:has(:target) { border-color: color-mix(in srgb, var(--lu-accent) 45%, var(--lu-border)); }
  .post.distill .lu-step-badge { display: inline-block; margin-bottom: 10px; padding: 2px 8px; border-radius: 5px; background: var(--lu-stage-soft); color: var(--lu-accent); font-size: max(.65em, 13px); font-weight: 700; text-transform: uppercase; letter-spacing: .04em; line-height: 1.6; }
  .post.distill d-article .lu-step-card h3 { margin: 0 0 10px; padding: 0; scroll-margin-top: 96px; }
  .post.distill d-article .lu-step-card p { margin: 0; }
  
  /* Native radio groups keep Safari's fallback compact without article scripts.
     Keep inputs within their labels so keyboard focus never scrolls off-screen. */
  .post.distill .lu-stage-tabs { display: none; }
  .post.distill .lu-stage-tabs label { position: relative; margin: 0; cursor: pointer; }
  .post.distill .lu-stage-tabs input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
  .post.distill .lu-stage-tabs label:has(input:checked) {
    --lu-tab-foreground: var(--lu-panel);
    background: var(--lu-accent);
    border-color: var(--lu-accent);
    box-shadow: 0 2px 5px #00000012;
  }
  @supports selector(:has(*)) {
    @media screen {
      .post.distill .lu-stage-nav { display: none; }
      .post.distill .lu-stage-tabs { display: grid; }
      .post.distill .lu-stage { display: var(--lu-stage-display, none); }
      .post.distill .lu-stage-section:has(.lu-stage-tabs input[value="1"]:checked) > .lu-stage:nth-of-type(1),
      .post.distill .lu-stage-section:has(.lu-stage-tabs input[value="2"]:checked) > .lu-stage:nth-of-type(2),
      .post.distill .lu-stage-section:has(.lu-stage-tabs input[value="3"]:checked) > .lu-stage:nth-of-type(3),
      .post.distill .lu-stage-section:has(.lu-stage-tabs input[value="4"]:checked) > .lu-stage:nth-of-type(4) { --lu-stage-display: block; }
    }
  }
  @media print {
    .post.distill .lu-stage-nav, .post.distill .lu-stage-tabs { display: none; }
  }
  /* All four illustrations occupy the same sticky grid cell. Each narrative
     track drives its matching illustration and tab at one shared reading line.
     Because the timeline is tied to position, scrolling back reverses the state
     immediately, without a stale URL target or direction-dependent observer. */
  @supports (animation-timeline: --lu-step-1) and (timeline-scope: --lu-step-1) and (height: 1cqw) {
    @media screen and (min-height: 600px) and (prefers-reduced-motion: no-preference) {
      .post.distill .lu-stage-section {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        container-type: inline-size;
        timeline-scope: --lu-step-1, --lu-step-2, --lu-step-3, --lu-step-4;
        --lu-navbar-height: 64px;
        --lu-stage-top: 216px;
        --lu-diagram-height: min(52.380952cqw, 38svh);
        --lu-diagram-bottom: calc(var(--lu-stage-top) + var(--lu-diagram-height));
        --lu-card-top: calc(var(--lu-diagram-bottom) + 16px);
        --lu-reading-line: calc(var(--lu-card-top) + 60px);
      }
      .post.distill .lu-stage-header {
        grid-area: 1 / 1;
        position: sticky;
        align-self: start;
        top: var(--lu-navbar-height);
        min-height: calc(var(--lu-stage-top) - var(--lu-navbar-height));
        box-sizing: border-box;
        animation: lu-clip-passed-card linear both;
        animation-timeline: view(block var(--lu-navbar-height) 0px);
        animation-range: exit-crossing 0% exit-crossing 100%;
      }
      .post.distill .lu-stage-nav { display: grid; }
      .post.distill .lu-stage-tabs { display: none; }
      .post.distill .lu-stage { display: contents; }
      .post.distill .lu-stage:nth-of-type(1) { --lu-stage-timeline: --lu-step-1; }
      .post.distill .lu-stage:nth-of-type(2) { --lu-stage-timeline: --lu-step-2; }
      .post.distill .lu-stage:nth-of-type(3) { --lu-stage-timeline: --lu-step-3; }
      .post.distill .lu-stage:nth-of-type(4) { --lu-stage-timeline: --lu-step-4; }
      .post.distill .lu-stage-window {
        grid-area: 2 / 1;
        position: sticky;
        align-self: start;
        top: var(--lu-stage-top);
        z-index: 3;
        height: var(--lu-diagram-height);
        margin: 0;
        box-sizing: border-box;
        opacity: 0;
        animation: lu-show-stage linear forwards, lu-clip-passed-card linear both;
        animation-timeline: var(--lu-stage-timeline), view(block var(--lu-stage-top) 0px);
        animation-range: contain 0% contain 100%, exit-crossing 0% exit-crossing 100%;
      }
      .post.distill .lu-stage:first-of-type .lu-stage-window { opacity: 1; }
      .post.distill .lu-stage-window img { display: block; height: 100% !important; }
      .post.distill .lu-stage-track {
        grid-column: 1;
        min-width: 0;
        padding: 16px 0 clamp(80px, 20svh, 200px);
        view-timeline-name: var(--lu-stage-timeline);
        view-timeline-axis: block;
        view-timeline-inset: var(--lu-reading-line) calc(100% - var(--lu-reading-line) - 1px);
      }
      .post.distill .lu-step-card { z-index: 1; }
      .post.distill d-article .lu-step-card h3 { scroll-margin-top: calc(var(--lu-card-top) + 36px); }
      .post.distill d-article .lu-stage-nav a {
        animation: lu-active-tab linear none;
        animation-range: contain 0% contain 100%;
      }
      .post.distill d-article .lu-stage-nav a:nth-child(1) { animation-timeline: --lu-step-1; animation-fill-mode: backwards; }
      .post.distill d-article .lu-stage-nav a:nth-child(2) { animation-timeline: --lu-step-2; }
      .post.distill d-article .lu-stage-nav a:nth-child(3) { animation-timeline: --lu-step-3; }
      .post.distill d-article .lu-stage-nav a:nth-child(4) { animation-timeline: --lu-step-4; animation-fill-mode: forwards; }
      .post.distill .lu-step-card {
        animation: lu-active-card linear none, lu-clip-passed-card linear both;
        animation-timeline: var(--lu-stage-timeline), view(block var(--lu-diagram-bottom) 0px);
        animation-range: contain 0% contain 100%, exit-crossing 0% exit-crossing 100%;
      }
      @keyframes lu-show-stage { from, to { opacity: 1; } }
      @keyframes lu-active-tab {
        from, to { --lu-tab-foreground: var(--lu-panel); background: var(--lu-accent); border-color: var(--lu-accent); box-shadow: 0 2px 5px #00000012; }
      }
      @keyframes lu-active-card { from, to { border-color: color-mix(in srgb, var(--lu-accent) 45%, var(--lu-border)); } }
      /* Clip passed text at the diagram's lower edge. As the last stage exits,
         also clip the unpinning illustration at the header edge and the header
         at the navbar edge. This prevents content resurfacing behind either
         header, while reverse scrolling reveals it at the same boundaries.
         exit-crossing preserves unread parts of tall paragraphs. */
      @keyframes lu-clip-passed-card {
        from { clip-path: inset(0 0 0 0); }
        to { clip-path: inset(100% 0 0 0); }
      }
      @media (min-width: 1180px) {
        .post.distill .lu-stage-section[aria-labelledby="training-setup"] { --lu-stage-top: 232px; }
      }
      @media (min-width: 601px) and (max-width: 1179px) {
        .post.distill .lu-stage-section { --lu-stage-top: 264px; }
      }
      @media (max-width: 600px) {
        .post.distill .lu-stage-section { --lu-navbar-height: 54px; --lu-stage-top: 240px; }
        .post.distill .lu-stage-section[aria-labelledby="training-setup"] { --lu-stage-top: 260px; }
      }
    }
  }
  @media (max-width: 1179px) {
    .post.distill .lu-stage-nav, .post.distill .lu-stage-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 600px) {
    .post.distill .lu-step-card { padding: .9em; }
    .post.distill d-article .lu-stage-nav a, .post.distill .lu-stage-tabs label { padding: 7px 6px; }
  }
  
  /* Article figure sizing and captions. */
  .post.distill d-article > figure {
    width: 100%;
    min-width: 0;
    justify-self: center;
    margin-block: 1.5rem 2rem;
    scroll-margin-top: 88px;
  }
  .post.distill d-article > figure > figcaption {
    display: block;
    width: 100%;
    max-width: 44rem;
    margin: .8rem auto 0;
    padding: 0 .5rem;
    box-sizing: border-box;
    font-size: max(1rem, 16px);
    line-height: 1.55;
    text-align: center;
    color: var(--global-text-color-light, #555);
  }
  .post.distill d-article > .lu-wide-diagram { max-width: 720px; }
  .post.distill d-article > .lu-embedding-figure { max-width: 560px; }
  /* Keep the original size and shift the plot left around its x-axis label. */
  .post.distill d-article > .lu-capacity-figure { max-width: 600px; }
  .post.distill d-article > .lu-capacity-figure > img {
    width: min(100%, calc((100vw - 32px) * 730 / 864));
    transform: translateX(-9.075723%);
  }
  @media (min-width: 768px) {
    .post.distill d-article > .lu-capacity-figure > img {
      transform: translateX(calc(-9.075723% - 12px));
    }
  }
  .post.distill .lu-embedding-figure > img { border-radius: 10px; }
  .post.distill d-article > figure > img { margin-inline: auto; max-width: 100%; }
  @media (max-width: 600px) {
    .post.distill d-article > figure > figcaption { font-size: max(.9375rem, 15px); padding: 0; }
    /* Keep the venue's floating shortcut off touch controls and figure content. */
    body:has(.post.distill .lu-hero) #back-to-top { display: none; }
  }

---

<figure class="l-page lu-hero">
  <iframe src="{{ 'assets/html/2027-04-30-learning-local-universes/hero.html?v=41aad18b459cb9c6' | relative_url }}" title="Play the learned Breakout world model" loading="eager" width="100%" height="620" frameborder="0" style="display:block;width:100%;border:0;">
    <a href="{{ 'assets/html/2027-04-30-learning-local-universes/hero.html?v=41aad18b459cb9c6' | relative_url }}" target="_blank" rel="noopener noreferrer">Open Play the learned Breakout world model</a>
  </iframe>
</figure>

## Introduction {#introduction}

<p lang="en">Learning to predict how the world reacts to actions taken within it is a central challenge in building agents capable of planning and interacting within it<d-cite key="lecun2022autonomous,ha2018worldmodels"></d-cite>. In the deep-learning era, early work explored using learned neural simulators in which to perform planning<d-cite key="schmidhuber1990differentiable"></d-cite>. Later, Ha and Schmidhuber famously demonstrate the use of recurrent neural networks as <em>World Models</em>, approximating, and indeed simulating, computer game dynamics. In this framework, agents can use these learned simulators, or world models, as internal models of the environment in which they learn how to play via Reinforcement Learning (RL)<d-cite key="ha2018worldmodels"></d-cite>. The premise is powerful: machines, like humans, can use internal models of the world to imagine possible futures and guide their actions. Following this objective, a wide variety of world model architectures have been explored, notably recurrent latent dynamics<d-cite key="hafner2023mastering,hafner2018latent,kaiser2019atari"></d-cite>, diffusion-based models<d-cite key="alonso2024diffusion,ding2024diffusion,hafner2025scalable"></d-cite>, or latent predictive architectures<d-cite key="maes2026leworldmodel"></d-cite>.</p>

<p lang="en">Locality offers a natural principle for designing world models with real-world applicability. Molecules in a test tube continually collide and react, gradually transforming the mixture. A pebble breaks the surface of a pond, sending ripples towards the shore, by pushing neighboring layers of water against each other. Birds adjust their movements in response to a quick glance at their immediate neighbors, forming a coordinated flock. Across scales, real-world local interactions give rise to surprisingly complex global phenomena.</p>

<p lang="en">Many environments, like the physical systems above, evolve mainly through local interactions. For instance, in the video game <em>Breakout</em>, the ball moves, bounces off walls, and destroys bricks through interactions with nearby elements. However, the game also maintains global state variables that break spatial locality. When the ball destroys a brick, the scoreboard must update in the corner of the screen, regardless of where the brick is located. To do that, the cells around the broken brick must send a 1-bit signal over a long distance to trigger a local change in the digits. This suggests a division of labor: dense local updates to model motion and collisions, complemented with low-bandwidth signals over distant regions.</p>

<p lang="en" class="lu-question"><strong>Can we learn to simulate environments through repeated application of the same local rules,<br>with only limited global communication?</strong></p>

<figure class="l-page lu-capacity-figure">
  <img data-zoomable title="Click to enlarge" src="{{ 'assets/img/2027-04-30-learning-local-universes/capacity_hypothesis.svg?v=7190d9b39e70b3bf' | relative_url }}" alt="Proposed allocation of interaction capacity across distance" width="730" height="365" loading="lazy" style="display:block;height:auto;">
  <figcaption>A schematic design of our hypothesis: W-NCA allocates most of its capacity to local interactions, using compact signals for distant coordination.</figcaption>
</figure>

<p lang="en">We investigate Neural Cellular Automata (NCA)<d-cite key="mordvintsev2020growing"></d-cite> as a foundation for world modeling based on mostly local interactions. We introduce World-NCA (W-NCA), a novel variant which extends the original NCA architecture beyond static targets<d-cite key="mordvintsev2020growing,niklasson2021textures,randazzo2020selfclassifying"></d-cite> to support action conditioning and sequential generation, essential elements for world modeling. W-NCA represents the environment as a 2D grid where each cell updates its state using its immediate neighbors and a broadcast action vector. The same update rule applies both across space and time, and propagates information in the environment at a bounded speed, one cell at a time. To account for distant coordination, in <em>Breakout</em>, we introduce a small global communication channel, while preserving primarily local computation.</p>

<p lang="en">W-NCA demonstrates reliable and lightweight interactive simulations in <em>Breakout</em>, <em>Snake</em>, <em>Text Editor</em>, and <em>2D Navigation</em> environments. Our world models operate at low parameter counts (40k–140k), over an order of magnitude fewer parameters than other world model architectures such as DIAMOND<d-cite key="alonso2024diffusion"></d-cite> (~4.4M), DreamerV3<d-cite key="hafner2023mastering"></d-cite> (~8M), and LeWorldModel<d-cite key="maes2026leworldmodel"></d-cite> (~15M). Thanks to this compactness, W-NCA runs directly in the browser, as demonstrated throughout the blog post.</p>

<p lang="en">A rich set of emergent behaviors appears in W-NCA models across the tested environments: spiking global signals in <em>Breakout</em>, distributed memory in <em>Snake</em>, structured action embeddings in <em>Text Editor</em>, and conditional inference and generalization to new layouts in <em>2D Navigation</em>. Strikingly, W-NCA allows for real-time interactions with the environment. Users can edit the cells in the grid to draw new bricks, rewrite the score, or duplicate the paddle, among other edits. Our world model adapts to these changes coherently.</p>

<section class="lu-stage-section" aria-labelledby="model-architecture">
<div class="lu-stage-header">
  <h2 id="model-architecture">Model Architecture</h2>
  <nav class="lu-stage-nav" aria-label="Model Architecture stages"><a href="#macro-step-transitions">Macro-Step</a><a href="#local-perception-action-conditioning">Local Perception</a><a href="#shared-mlp-stochastic-fire-rate">Shared MLP</a><a href="#residual-micro-steps">Residual Micro-Steps</a></nav>
  <div class="lu-stage-tabs" role="group" aria-label="Model Architecture stages">
    <label><input type="radio" name="lu-model-architecture" value="1" checked><span>Macro-Step</span></label>
    <label><input type="radio" name="lu-model-architecture" value="2"><span>Local Perception</span></label>
    <label><input type="radio" name="lu-model-architecture" value="3"><span>Shared MLP</span></label>
    <label><input type="radio" name="lu-model-architecture" value="4"><span>Residual Micro-Steps</span></label>
  </div>
</div>
<section class="lu-stage" aria-labelledby="macro-step-transitions">
<figure class="lu-stage-window">
  <img src="{{ 'assets/img/2027-04-30-learning-local-universes/architecture/1.svg' | relative_url }}" alt="Macro-Step" width="1050" height="550" loading="eager" style="display:block;width:100%;height:auto;">
</figure>
<div class="lu-stage-track">
<div class="lu-step-card">
  <span class="lu-step-badge">Stage 1</span>
  <h3 id="macro-step-transitions">Macro-Step Transitions</h3>
  <p lang="en">Each cell stores a state vector with three color channels (RGB) and \(C-3\) hidden channels. Together, the cells form the grid state, \(x_t \in \mathbb{R}^{H \times W \times C}\). The color channels represent the current environment frame, while the hidden channels retain information across time. To advance from \(x_t\) to \(x_{t+1}\), the grid completes a ‘macro-step’ consisting of several sequential ‘micro-steps’.</p>
</div>
</div>
</section>
<section class="lu-stage" aria-labelledby="local-perception-action-conditioning">
<figure class="lu-stage-window">
  <img src="{{ 'assets/img/2027-04-30-learning-local-universes/architecture/2.svg' | relative_url }}" alt="Local Perception" width="1050" height="550" loading="eager" style="display:block;width:100%;height:auto;">
</figure>
<div class="lu-stage-track">
<div class="lu-step-card">
  <span class="lu-step-badge">Stage 2</span>
  <h3 id="local-perception-action-conditioning">Local Perception &amp; Action Conditioning</h3>
  <p lang="en">Each cell gathers information from its \(3 \times 3\) neighborhood through convolutions, producing a perception vector. These convolutions can use either fixed kernels (Sobel-X and Sobel-Y as in the original NCA paper<d-cite key="mordvintsev2020growing"></d-cite>, plus a Laplacian as in <em>Self-Organising Textures</em><d-cite key="niklasson2021textures"></d-cite>) or trainable kernels. The action vector \(a_t \in \mathbb{R}^{8}\) is concatenated to each cell's perception vector, so that each update depends on both the perception vector and the current action.</p>
</div>
</div>
</section>
<section class="lu-stage" aria-labelledby="shared-mlp-stochastic-fire-rate">
<figure class="lu-stage-window">
  <img src="{{ 'assets/img/2027-04-30-learning-local-universes/architecture/3.svg' | relative_url }}" alt="Shared MLP" width="1050" height="550" loading="eager" style="display:block;width:100%;height:auto;">
</figure>
<div class="lu-stage-track">
<div class="lu-step-card">
  <span class="lu-step-badge">Stage 3</span>
  <h3 id="shared-mlp-stochastic-fire-rate">Shared MLP &amp; Stochastic Fire Rate</h3>
  <p lang="en">At each cell, the update is computed by a multilayer perceptron (MLP) with three layers and a hidden width between 128 and 512. Its parameters are shared across the grid, so every cell follows the same learned rule, similar to a classic cellular automaton<d-cite key="mordvintsev2020growing"></d-cite>. A Bernoulli mask \(M \in \{0, 1\}^{H \times W}\) determines which cells update at each micro-step, introducing asynchronicity.</p>
</div>
</div>
</section>
<section class="lu-stage" aria-labelledby="residual-micro-steps">
<figure class="lu-stage-window">
  <img src="{{ 'assets/img/2027-04-30-learning-local-universes/architecture/4.svg' | relative_url }}" alt="Residual Micro-Steps" width="1050" height="550" loading="eager" style="display:block;width:100%;height:auto;">
</figure>
<div class="lu-stage-track">
<div class="lu-step-card">
  <span class="lu-step-badge">Stage 4</span>
  <h3 id="residual-micro-steps">Residual Micro-Steps</h3>
  <p lang="en">The masked update is added to the cell's existing state through a residual connection. Information can reach only immediate neighbors in one local update, so W-NCA performs \(L\) micro-steps for each environment transition. Repeating the update lets information travel farther across the grid before the model produces the next frame, stored in the RGB channels of \(x_{t+1}\).</p>
</div>
</div>
</section>
</section>

<section class="lu-stage-section" aria-labelledby="training-setup">
<div class="lu-stage-header">
  <h2 id="training-setup">Training Setup</h2>
  <nav class="lu-stage-nav" aria-label="Training Setup stages"><a href="#offline-environment-trajectories">Environment Trajectories</a><a href="#burn-in-phase">Burn-in Phase</a><a href="#autoregressive-generation-phase">Generation Phase</a><a href="#gradient-step-replay-buffer-update">Gradient Step &amp; Buffer Update</a></nav>
  <div class="lu-stage-tabs" role="group" aria-label="Training Setup stages">
    <label><input type="radio" name="lu-training-setup" value="1" checked><span>Environment Trajectories</span></label>
    <label><input type="radio" name="lu-training-setup" value="2"><span>Burn-in Phase</span></label>
    <label><input type="radio" name="lu-training-setup" value="3"><span>Generation Phase</span></label>
    <label><input type="radio" name="lu-training-setup" value="4"><span>Gradient Step &amp; Buffer Update</span></label>
  </div>
</div>
<section class="lu-stage" aria-labelledby="offline-environment-trajectories">
<figure class="lu-stage-window">
  <img src="{{ 'assets/img/2027-04-30-learning-local-universes/training/1.svg' | relative_url }}" alt="Environment Trajectories" width="1050" height="550" loading="eager" style="display:block;width:100%;height:auto;">
</figure>
<div class="lu-stage-track">
<div class="lu-step-card">
  <span class="lu-step-badge">Stage 1</span>
  <h3 id="offline-environment-trajectories">Offline Environment Trajectories</h3>
  <p lang="en">W-NCA is trained on offline trajectories collected by running a policy in each environment (see a description of the policies for each game below). A trajectory records a sequence of RGB frames and the actions taken between them. These frames serve as training targets for W-NCA.</p>
</div>
</div>
</section>
<section class="lu-stage" aria-labelledby="burn-in-phase">
<figure class="lu-stage-window">
  <img src="{{ 'assets/img/2027-04-30-learning-local-universes/training/2.svg' | relative_url }}" alt="Burn-in Phase" width="1050" height="550" loading="eager" style="display:block;width:100%;height:auto;">
</figure>
<div class="lu-stage-track">
<div class="lu-step-card">
  <span class="lu-step-badge">Stage 2</span>
  <h3 id="burn-in-phase">Burn-in Phase</h3>
  <p lang="en">To support stable behavior over long rollouts, a sample replay buffer stores hidden states from trajectories generated by earlier model checkpoints<d-cite key="mordvintsev2020growing"></d-cite>. Each training batch samples states from this buffer and perturbs their hidden channels by adding uniform noise and randomly setting a proportion of them to zero, encouraging recovery from corrupted states. Before predicting future frames, a burn-in phase allows the model to initialize its memory and synchronize with the environment’s dynamics by receiving an initial sequence of ground-truth frames.</p>
</div>
</div>
</section>
<section class="lu-stage" aria-labelledby="autoregressive-generation-phase">
<figure class="lu-stage-window">
  <img src="{{ 'assets/img/2027-04-30-learning-local-universes/training/3.svg' | relative_url }}" alt="Generation Phase" width="1050" height="550" loading="eager" style="display:block;width:100%;height:auto;">
</figure>
<div class="lu-stage-track">
<div class="lu-step-card">
  <span class="lu-step-badge">Stage 3</span>
  <h3 id="autoregressive-generation-phase">Autoregressive Generation Phase</h3>
  <p lang="en">After burn-in, the model predicts future frames sequentially, using its previous prediction and the next action at each step. At every macro-step, an \(L_2\) loss compares the predicted RGB channels with the corresponding ground-truth frame.</p>
</div>
</div>
</section>
<section class="lu-stage" aria-labelledby="gradient-step-replay-buffer-update">
<figure class="lu-stage-window">
  <img src="{{ 'assets/img/2027-04-30-learning-local-universes/training/4.svg' | relative_url }}" alt="Gradient Step &amp; Replay Buffer Update" width="1050" height="550" loading="eager" style="display:block;width:100%;height:auto;">
</figure>
<div class="lu-stage-track">
<div class="lu-step-card">
  <span class="lu-step-badge">Stage 4</span>
  <h3 id="gradient-step-replay-buffer-update">Gradient Step &amp; Replay Buffer Update</h3>
  <p lang="en">The resulting hidden states are saved back to the replay buffer; a small fraction are reinitialized to maintain diversity and limit error accumulation. Training uses backpropagation through time (BPTT) with the Adam optimizer<d-cite key="kingma2014adam"></d-cite> and a learning rate of \(5 \times 10^{-4}\). Gradient clipping and truncated backpropagation are used to stabilize optimization, and gradient checkpointing to reduce memory use.</p>
</div>
</div>
</section>
</section>

## Game Environments {#game-environments}

### Breakout {#breakout}

<p lang="en">For <em>Breakout</em>, we train W-NCA on trajectories obtained from a heuristic policy. Under this policy, the paddle moves towards the ball by using the three available actions: Left, Right, and No-op. To ensure sufficient coverage of infrequent events, such as bounces or collisions, these are oversampled to make up 70% of the training dataset. In <em>Breakout</em>, we can examine how W-NCA can combine both local and global communication for optimal world modeling.</p>

#### Simulating Local Physics {#simulating-local-physics}

<p lang="en">W-NCA learns the local physics in <em>Breakout</em>, such as the ball moving across the grid, reflecting off walls, bouncing off the paddle, and destroying bricks. These interactions involve local changes in the environment that can be resolved by local information propagation. As for the action vector, although every cell in the grid receives it as input, only those cells inside or around the paddle respond to it. W-NCA distinguishes where an action vector should induce a change, while keeping the rest of the static elements unchanged.</p>

#### Emergent Global Communication {#emergent-global-communication}

<p lang="en">Other interactions, such as score updates, require information to travel over long distances in the grid. However, if information travels only locally, sending a signal from a broken brick to the scoreboard over \(L\) intermediate cells needs at least \(L+1\) micro-steps. A longer inner rollout allows information to travel further away, but also makes training harder. In fact, as \(L\) increases, gradients must pass through a deeper recurrence for every environment update. Thus, to account for long-distance signaling, purely local communication results in more computationally expensive and unstable training.</p>

<p lang="en">To solve this problem, we introduce a small global “scratchpad” that allows for low-bandwidth communication between distant cells. After the inner rollout, a max-pool across the whole grid is applied to two of the hidden channels. This simple mechanism provides a short path for information and gradients to flow over long distances. W-NCA learns to propagate two kinds of signals through one of the global channels. The first is a brief, high-amplitude spike, signaling a score update. The second one consists of a half-amplitude and longer spike that signals a lost life.</p>

<figure class="l-page lu-wide-diagram">
  <img data-zoomable title="Click to enlarge" src="{{ 'assets/img/2027-04-30-learning-local-universes/global.svg' | relative_url }}" alt="Global Scratchpad: Local Propagation to Global Broadcast via Max-Pooling" width="660" height="300" loading="lazy" style="display:block;width:100%;height:auto;">
  <figcaption>The maximum activation is taken across the grid and broadcast back to all cells, allowing a local event to trigger a distant update.</figcaption>
</figure>

<p lang="en">We mechanistically test the role of global communication by artificially injecting or suppressing signals on the global channel. Score updates and life losses stop occurring when the channel is clipped at its baseline activity value. Conversely, injecting prototypical spikes induces the expected changes without affecting the rest of the cells in the grid.</p>

<figure class="l-page" id="breakout-details-demo">
  <iframe src="{{ 'assets/html/2027-04-30-learning-local-universes/breakout.html?v=e73eab0b28178a79' | relative_url }}" title="Breakout: local physics and global communication" loading="lazy" width="100%" height="1100" frameborder="0" style="display:block;width:100%;border:0;">
    <a href="{{ 'assets/html/2027-04-30-learning-local-universes/breakout.html?v=e73eab0b28178a79' | relative_url }}" target="_blank" rel="noopener noreferrer">Open Breakout: local physics and global communication</a>
  </iframe>
</figure>

#### Real-Time World Interventions {#real-time-world-interventions}

<p lang="en">During training, W-NCA only observes trajectories from valid Breakout games, always featuring a single paddle, a single ball, and fixed-position bricks, lives, and digits. To test whether the environment can be edited in real time during simulation, we directly modify the cells’ RGB channels while W-NCA simultaneously updates the grid.</p>

<figure class="l-page" id="interventions-album">
  <iframe src="{{ 'assets/html/2027-04-30-learning-local-universes/interventions.html?v=bbe1327704e5362c' | relative_url }}" name="interventions-player" title="Recorded interventions in the Breakout world" loading="lazy" width="100%" height="540" frameborder="0" style="display:block;width:100%;border:0;">
    <a href="{{ 'assets/html/2027-04-30-learning-local-universes/interventions.html?v=bbe1327704e5362c' | relative_url }}" target="_blank" rel="noopener noreferrer">Open Recorded interventions in the Breakout world</a>
  </iframe>
</figure>

<p lang="en">For example, it is possible to <a href="{{ 'assets/html/2027-04-30-learning-local-universes/interventions.html?example=0&v=bbe1327704e5362c' | relative_url }}" target="interventions-player">draw a new brick</a> anywhere in the environment. Upon collision with the ball, the brick disappears and the score updates, replicating the expected behavior. The scoreboard can also be edited as the game progresses: changing it from <a href="{{ 'assets/html/2027-04-30-learning-local-universes/interventions.html?example=1&v=bbe1327704e5362c' | relative_url }}" target="interventions-player">'77' to '81'</a> makes the counter continue from the new value. W-NCA even generalizes to digit configurations never encountered during training. For instance, adding a zero on the right makes the counter change from <a href="{{ 'assets/html/2027-04-30-learning-local-universes/interventions.html?example=2&v=bbe1327704e5362c' | relative_url }}" target="interventions-player">'000' to '001'</a> upon collision. Also, the counter wraps from <a href="{{ 'assets/html/2027-04-30-learning-local-universes/interventions.html?example=3&v=bbe1327704e5362c' | relative_url }}" target="interventions-player">'99' to '00'</a>, a transition never observed during training. New <a href="{{ 'assets/html/2027-04-30-learning-local-universes/interventions.html?example=4&v=bbe1327704e5362c' | relative_url }}" target="interventions-player">balls</a> and <a href="{{ 'assets/html/2027-04-30-learning-local-universes/interventions.html?example=5&v=bbe1327704e5362c' | relative_url }}" target="interventions-player">paddles</a> can also be drawn, behaving identically to the original ones.</p>

<figure class="l-page" id="breakout-editor-demo">
  <iframe src="{{ 'assets/html/2027-04-30-learning-local-universes/editor.html?v=46f96f01b24b9f53' | relative_url }}" title="Edit the Breakout world during simulation" loading="lazy" width="100%" height="900" frameborder="0" style="display:block;width:100%;border:0;">
    <a href="{{ 'assets/html/2027-04-30-learning-local-universes/editor.html?v=46f96f01b24b9f53' | relative_url }}" target="_blank" rel="noopener noreferrer">Open Edit the Breakout world during simulation</a>
  </iframe>
</figure>

#### Sparse Global Communication {#sparse-global-communication}

<p lang="en">Our global communication mechanism, implemented with the max-pool operation, allows every cell to read from and write to the shared scratchpad at once. At every macro-step, all cells have synchronized access to the maximum value across the grid. Such synchronization departs from the original asynchronicity and biological inspiration of NCA models. Motivated by sparse, asynchronous signaling in biological neural networks<d-cite key="piolopez2026brainca"></d-cite>, we test whether global communication can emerge under asynchronous constraints. To do that, we restrict scratchpad access to a small random subset of cells at each simulation step.</p>

<p lang="en">During training, the proportion of cells denied access to the global channel increases gradually, reaching a 90% dropout rate. Our model adapts well to these constraints. Signals propagate locally until they reach a cell with global access, which relays the information through the global communication channel to other cells with access to it. In this way, the resulting model remains playable under an asynchronous global clock.</p>

<figure class="l-page" id="breakout-async-demo">
  <iframe src="{{ 'assets/html/2027-04-30-learning-local-universes/distributed.html?v=655ed956e747a24b' | relative_url }}" title="Breakout with sparse global communication" loading="lazy" width="100%" height="1050" frameborder="0" style="display:block;width:100%;border:0;">
    <a href="{{ 'assets/html/2027-04-30-learning-local-universes/distributed.html?v=655ed956e747a24b' | relative_url }}" target="_blank" rel="noopener noreferrer">Open Breakout with sparse global communication</a>
  </iframe>
</figure>

### Snake {#snake}

<p lang="en">For <em>Snake</em>, W-NCA is trained on trajectories from the Jumanji environment<d-cite key="bonnet2023jumanji"></d-cite>, collected using its expert reinforcement learning policy with four actions: Left, Right, Up, and Down. Fruit locations are supplied from the environment at each step, so the model learns the snake's dynamics without having to predict stochastic fruit placement.</p>

#### Distributed Memory {#distributed-memory}

<p lang="en">To simulate Snake, the cells must remember the trajectory taken by the snake to predict how its tail advances. In fact, when the snake is tightly folded, its previous trajectory becomes ambiguous from the RGB channels alone. For accurate simulation, W-NCA must store information about its path within its hidden channels, implementing a distributed memory across the grid.</p>

<figure class="l-page lu-wide-diagram">
  <img data-zoomable title="Click to enlarge" src="{{ 'assets/img/2027-04-30-learning-local-universes/ambiguous.svg?v=6b6dafd6fa18aa8f' | relative_url }}" alt="Ambiguous Snake Configuration" width="660" height="264" loading="lazy" style="display:block;width:100%;height:auto;">
  <figcaption>The trajectory taken by the snake is ambiguous from the RGB channels alone. Advancing the tail correctly requires implementing a memory that stores previous movements.</figcaption>
</figure>

<p lang="en">Snake consists of a small \(12 \times 12\)-pixel square grid, making local communication sufficient to simulate the game’s dynamics. Visualizing the hidden states during the micro-steps reveals an interesting emergent phenomenon. Waves of activity propagate across the grid, carrying information to predict the next game state. For example, when the snake eats a fruit, a signal must travel from the head to the tail, to instruct it not to advance so the snake can grow in size.</p>

<figure class="l-page" id="snake-demo">
  <iframe src="{{ 'assets/html/2027-04-30-learning-local-universes/snake.html?v=dd7e286f00a0d26a' | relative_url }}" title="Snake and distributed hidden memory" loading="lazy" width="100%" height="820" frameborder="0" style="display:block;width:100%;border:0;">
    <a href="{{ 'assets/html/2027-04-30-learning-local-universes/snake.html?v=dd7e286f00a0d26a' | relative_url }}" target="_blank" rel="noopener noreferrer">Open Snake and distributed hidden memory</a>
  </iframe>
</figure>

## Text Editor {#text-editor}

<p lang="en">In the <em>Text Editor</em> environment, training trajectories are collected with a random keystroke policy including frequent repeated backspaces and line breaks. <em>Text Editor</em> has 29 discrete actions: 26 alphabetical characters, space, backspace, and enter. Each character follows a minimal \(3 \times 5\)-pixel font, emulating a terminal display. Exclusively via local communication, W-NCA learns to generate and delete characters, move the cursor back and forth, and start a new line when enter is pressed.</p>

<figure class="l-page" id="text-demo">
  <iframe src="{{ 'assets/html/2027-04-30-learning-local-universes/text.html?v=83514acd27e53fdf' | relative_url }}" title="Text editor and hidden channels" loading="lazy" width="100%" height="800" frameborder="0" style="display:block;width:100%;border:0;">
    <a href="{{ 'assets/html/2027-04-30-learning-local-universes/text.html?v=83514acd27e53fdf' | relative_url }}" target="_blank" rel="noopener noreferrer">Open Text editor and hidden channels</a>
  </iframe>
</figure>

<p lang="en">The hidden channels reveal horizontal bands corresponding to text lines, an internal structure learned by W-NCA to support the editing task that extends beyond what is visible in the environment frame.</p>

#### Structured Action Embeddings {#structured-action-embeddings}

<p lang="en">Action embeddings can be visualized in two dimensions via dimensionality reduction. A t-SNE projection reveals a structured organization by character orthography<d-cite key="bouma1971visual"></d-cite>, in which different groups, such as ascenders (<em>b</em>, <em>h</em>, <em>k</em>), descenders (<em>q</em>, <em>y</em>, <em>g</em>), rounded forms (<em>o</em>, <em>c</em>, <em>e</em>), and narrow stems (<em>i</em>, <em>l</em>, <em>j</em>), cluster together.</p>

<figure class="l-page lu-embedding-figure">
  <img data-zoomable title="Click to enlarge" src="{{ 'assets/img/2027-04-30-learning-local-universes/orthography_tsne.png' | relative_url }}" alt="Orthography t-SNE" width="1272" height="1036" loading="lazy" style="display:block;width:100%;height:auto;">
  <figcaption>A t-SNE projection of the learned action embeddings suggests that letters with similar shapes have related representations.</figcaption>
</figure>

## Two-Room Navigation {#two-room-navigation}

<p lang="en">For <em>Two-Room Navigation</em>, trajectories from LeWorldModel<d-cite key="maes2026leworldmodel"></d-cite> are used to train W-NCA. These trajectories consist of noisy action sequences guiding the particle from one room to the other through the doorway. In <em>Two-Room Navigation</em>, actions are two-dimensional vectors specifying the particle's velocity, which we linearly project into the model's eight-dimensional action space. The resulting W-NCA model accurately simulates the environment over long rollouts, capturing both the particle's motion and wall collisions.</p>

#### Conditional Inference {#conditional-inference}

<p lang="en">During simulation, W-NCA does not require all cells in the grid to update. In Two-Room Navigation, we show that inference can be conditioned on red channel activation, allowing only cells with high red values and their surrounding neighborhoods to update. This conditional inference saves computation while leaving simulation performance unchanged. In W-NCA, locality saves computational resources by updating cells only where and when it is needed.</p>

#### Generalization to Four-Room Navigation {#generalization-to-four-room-navigation}

<p lang="en">Beyond computational efficiency, we ask whether W-NCA generalizes to novel environment layouts never seen during training. Specifically, we construct a Four-Room Navigation layout consisting of four rooms connected by three doorways, preserving visual properties such as wall thickness, particle size, and colors. Despite being trained only on two-room trajectories, W-NCA generalizes and simulates Four-Room Navigation accurately without further training. The same learned local rule handles the particle's motion and wall collisions.</p>

<figure class="l-page" id="tworooms-demo">
  <iframe src="{{ 'assets/html/2027-04-30-learning-local-universes/navigation.html?v=6f678b0f96dd5918' | relative_url }}" title="Two-room, conditional, and four-room navigation" loading="lazy" width="100%" height="950" frameborder="0" style="display:block;width:100%;border:0;">
    <a href="{{ 'assets/html/2027-04-30-learning-local-universes/navigation.html?v=6f678b0f96dd5918' | relative_url }}" target="_blank" rel="noopener noreferrer">Open Two-room, conditional, and four-room navigation</a>
  </iframe>
</figure>

## Bonus: The Physics of Computation {#bonus-the-physics-of-computation}

<p lang="en">World modeling typically involves predicting future environment states conditioned on applied actions. We ask whether an unconditioned variant of W-NCA can predict sequential dynamics without external actions. A Turing machine provides a useful example: a head reads and modifies symbols on a tape according to a fixed set of rules<d-cite key="wolfram2002science,mitchell1998computation"></d-cite>. We render the tape as a horizontal row of colored symbols on a 2D grid. Given a five-step burn-in, W-NCA must predict the program execution until its eventual halt. Importantly, the Turing machine's internal state is never provided. The model observes only the head's movements and changes to the tape. In this setup, predicting the next frame involves inferring and learning to execute a program based on its traces<d-cite key="papazov2025arithmetic"></d-cite>.</p>

#### Binary Addition {#binary-addition}

<p lang="en">First, we generate trajectories from a simple binary addition program. Two numbers are written on the tape in binary format, where blue pixels denote 0s, yellow pixels denote 1s, and a single red pixel acts as the separator between them. The program repeatedly decrements the right-hand operand and increments the left-hand one, resolving carries until the sum is complete, halting the head on top of the red separator. We train W-NCA on operands of up to 5 bits. On longer operands of up to 11 bits, it achieves 100% accuracy, decaying to 97% on 12 bits.</p>

<figure class="l-page">
  <iframe src="{{ 'assets/html/2027-04-30-learning-local-universes/computation.html?example=addition&v=0f330643060f0ee2' | relative_url }}" title="Binary addition: reference program and NCA prediction" loading="lazy" width="100%" height="420" frameborder="0" style="display:block;width:100%;border:0;">
    <a href="{{ 'assets/html/2027-04-30-learning-local-universes/computation.html?example=addition&v=0f330643060f0ee2' | relative_url }}" target="_blank" rel="noopener noreferrer">Open Binary addition: reference program and NCA prediction</a>
  </iframe>
  <figcaption>The reference program and W-NCA prediction for 6-bit binary addition.</figcaption>
</figure>

#### Context-Free Grammars {#context-free-grammars}

<p lang="en">Then we generate program trajectories from the \(a^n b^n\) formal grammar. The tape starts with \(a^n\), a sequence of \(n\) yellow pixels denoting the \(a\) symbol. The program replaces \(a\)'s with a green marker and appends one red \(b\) symbol at the end of the tape. Once all \(a\)'s have been used up, the program replaces all green markers with \(a\)'s, resulting in an \(a^n b^n\) string. W-NCA is trained on lengths up to \(n=8\), generalizing to all tested lengths up to \(n=200\). As \(n\) increases, testing longer sequences becomes computationally expensive because of the long rollouts.</p>

<figure class="l-page">
  <iframe src="{{ 'assets/html/2027-04-30-learning-local-universes/computation.html?example=grammar&v=0f330643060f0ee2' | relative_url }}" title="Context-free grammar: reference program and NCA prediction" loading="lazy" width="100%" height="420" frameborder="0" style="display:block;width:100%;border:0;">
    <a href="{{ 'assets/html/2027-04-30-learning-local-universes/computation.html?example=grammar&v=0f330643060f0ee2' | relative_url }}" target="_blank" rel="noopener noreferrer">Open Context-free grammar: reference program and NCA prediction</a>
  </iframe>
  <figcaption>The reference program and W-NCA prediction for \(a^n b^n\) generation with \(n=12\).</figcaption>
</figure>

## Discussion and Future Work {#discussion-and-future-work}

<p lang="en">Our work proposes an alternative approach to world modeling. We introduce World-NCA (W-NCA), a Neural Cellular Automata (NCA) variant in which environment dynamics are modeled as a predominantly local and decentralized process. At low parameter counts, W-NCA exhibits a wide range of emergent behaviors across environments, including local physics, sparse global coordination and live editing in <em>Breakout</em>, structured action embeddings in <em>Text Editor</em>, distributed memory in <em>Snake</em>, and conditional inference and spatial generalization in Two-Room Navigation. Together, these results motivate a design principle for world modeling in which capacity is allocated primarily to local dynamics while low-bandwidth signals coordinate distant regions. This pattern echoes the structural organization of biological neural networks<d-cite key="bullmore2012economy,laughlin2003communication"></d-cite>, where dense local circuits coexist with sparse long-range connections.</p>

<p lang="en">Hybridizing W-NCA with existing world model architectures such as LeWorldModel<d-cite key="maes2026leworldmodel"></d-cite> or Dreamer<d-cite key="hafner2023mastering,hafner2025scalable"></d-cite> is a promising direction for future research. Extending W-NCA with a global latent memory could be crucial for modeling more complex and naturalistic, egocentric environments where viewpoints shift and observations may be partial. Furthermore, W-NCA currently assumes deterministic environment dynamics. This assumption does not hold for environments like Pac-Man, where ghosts pick a random direction at intersections. Combining W-NCA with diffusion backbones<d-cite key="alonso2024diffusion,ding2024diffusion"></d-cite> could offer a way to integrate stochasticity into the model’s predictions.</p>

<p lang="en">Lastly, throughout this work, we train W-NCA on previously collected offline trajectories from environments. A natural next step would be to evaluate whether conventional or NCA-based policy networks can learn within W-NCA simulations and transfer to the original environments<d-cite key="ha2018worldmodels,kaiser2019atari"></d-cite>. Also, online training could extend this approach by jointly refining the policy and world model through continued interaction with the environment.</p>
