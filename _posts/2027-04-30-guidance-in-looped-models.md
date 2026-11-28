---
layout: distill
title: Guidance is becoming a cheat code for LLMs (with Loooop)
description: Guidance can dramatically improve generation. Looped models offer a way to reduce the normalization gap between token-level guidance
  and the guided joint distribution over a full sequence.
date: "2027-04-30"
future: true
htmlwidgets: true
authors:
  - name: Anonymous
bibliography: 2027-04-30-guidance-in-looped-models.bib
toc:
  - name: Why diffusion guidance needs no normalizer
  - name: Token-level guidance and the joint distribution
    subsections:
      - name: A two-token example
  - name: Loooop
    subsections:
      - name: Why loops help
  - name: Are predictions from different loops actually closer?
  - name: Loops and diffusion, beyond guidance
  - name: What's next?
_styles: |
  #guidance-article { --paper:var(--global-bg-color,#fcfbf8); --ink:var(--global-text-color,#282b2d); --muted:var(--global-text-color-light,#676b70); --line:var(--global-divider-color,#dedfdc); --blue:#225b87; --green:#207a65; --tint:#eef3f4; --sans:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; min-width:0; }
  html[data-theme="dark"] #guidance-article { --blue:#86bee6; --green:#83cbb5; --muted:#b2b9bd; }
  #guidance-article *{box-sizing:border-box}
  #guidance-article a{color:var(--blue);text-decoration-thickness:1px;text-underline-offset:4px}
  #guidance-article a:hover{text-decoration-thickness:2px}
  #guidance-article a:focus-visible,#guidance-article summary:focus-visible,#guidance-article input:focus-visible{outline:3px solid var(--blue);outline-offset:5px}
  #guidance-article p{margin:0 0 20px}
  #guidance-article>p,#guidance-article>blockquote p,#guidance-article .proof-body p,#guidance-article .key-result p{text-align:justify;text-align-last:left;hyphens:auto}
  #guidance-article .opening{font-size:23px;line-height:1.58}
  #guidance-article h2{font-size:32px;line-height:1.2;font-weight:550;margin:56px 0 22px;letter-spacing:-.015em}
  #guidance-article h3{font-size:25px;line-height:1.3;font-weight:550;margin:36px 0 16px}
  #guidance-article strong{font-weight:650}
  #guidance-article .section-number{display:block;color:var(--green);font:11px/1 var(--sans);letter-spacing:.13em;margin-bottom:12px}
  #guidance-article blockquote{margin:28px 0;padding:3px 0 3px 24px;border-left:2px solid var(--green);font-size:23px;line-height:1.5}
  #guidance-article blockquote p{margin-bottom:9px}
  #guidance-article blockquote footer{font:13px/1.6 var(--sans);color:var(--muted)}
  #guidance-article .equation{overflow-x:auto;overflow-y:hidden;margin:24px 0;padding:5px 2px;font-size:92%}
  #guidance-article .equation mjx-container[display=true]{margin:12px 0!important}
  #guidance-article mjx-container mjx-assistive-mml{width:1px!important;height:1px!important;overflow:hidden!important}
  #guidance-article .key-result{border-block:1px solid #b8cbd0;padding:22px 0;margin:28px 0}
  #guidance-article .key-result p:last-child{margin:0}
  #guidance-article .key-result .equation{margin:9px 0}
  #guidance-article .aside{border-left:2px solid var(--line);padding:0 0 0 18px;color:var(--muted);font-size:18px;line-height:1.6;margin:26px 0}
  #guidance-article .proof{border-block:1px solid var(--line);margin:24px 0;background:var(--global-code-bg-color)}
  #guidance-article .proof summary{cursor:pointer;padding:15px 0;color:var(--blue);font:14px/1.5 var(--sans)}
  #guidance-article .proof summary::marker{font-size:11px}
  #guidance-article .proof-body{padding:5px 17px 10px;font-size:19px;line-height:1.65}
  #guidance-article .proof-body p:last-child{margin-bottom:10px}
  #guidance-article .proof[open] summary{border-bottom:1px solid var(--line);margin-bottom:14px}
  #guidance-article figure{margin:32px 0}
  #guidance-article figure img{display:block;width:100%;height:auto;background:white}
  #guidance-article figcaption{font:13px/1.65 var(--sans);color:var(--muted);margin-top:14px}
  #guidance-article figcaption strong{color:var(--ink)}
  #guidance-article .visual-interlude{width:100%;margin:40px 0}
  #guidance-article .visual-interlude img{width:100%;height:auto;aspect-ratio:16/5;object-fit:cover;object-position:center}
  #guidance-article #connections-interlude img{object-position:center 65%}
  #guidance-article .measurement-figure figcaption{max-width:750px;margin:16px auto 0;font:inherit}
  #guidance-article .measurement-figure picture{display:block}
  #guidance-article .measurement-figure img{aspect-ratio:2/1}
  @media(max-width:600px){#guidance-article .measurement-figure img{aspect-ratio:3/5}}
  #guidance-article .figure-links{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:10px;font:12px/1.5 var(--sans)}
  #guidance-article .table-scroll{overflow:auto;margin:26px 0}
  #guidance-article table{border-collapse:collapse;width:100%;font:14px/1.6 var(--sans);font-variant-numeric:tabular-nums}
  #guidance-article caption{text-align:left;font-size:14px;color:var(--muted);margin-bottom:14px}
  #guidance-article th,#guidance-article td{padding:11px 12px;border-bottom:1px solid var(--line);white-space:nowrap;text-align:right}
  #guidance-article th{font-size:12px;font-weight:600}
  #guidance-article th:first-child,#guidance-article td:first-child{text-align:left;padding-left:0}
  #guidance-article td:last-child,#guidance-article th:last-child{padding-right:0}
  #guidance-article .loop-row td:first-child{color:var(--green);font-weight:600}
  #guidance-article .table-note{font:13px/1.65 var(--sans);color:var(--muted);margin-top:12px}
  #guidance-article .loopcd-results{table-layout:fixed}
  #guidance-article .loopcd-results th:first-child{width:38%;white-space:normal}
  #guidance-article .loopcd-results th:nth-child(2){width:24%;text-align:left}
  #guidance-article .loopcd-results tbody th{font-size:13px;font-weight:500}
  #guidance-article .loopcd-results td:nth-child(2){text-align:left;white-space:normal}
  #guidance-article .loopcd-results small{display:block;color:var(--muted);font-size:11px;font-weight:400;margin-top:3px}
  #guidance-article .loopcd-results td strong{color:var(--green)}
  #guidance-article .loopcd-results-figure picture{display:block}
  #guidance-article .loopcd-results-figure img{aspect-ratio:1060/490;background:var(--paper)}
  #guidance-article .loopcd-results-figure figcaption{text-align:center}
  @media(max-width:600px){#guidance-article .loopcd-results-figure img{aspect-ratio:520/950}}
  #guidance-article .loop-architecture{padding:22px 18px;border-block:1px solid var(--line);text-align:center}
  #guidance-article .architecture-label{color:var(--muted);font:12px/1.5 var(--sans);margin-bottom:17px}
  #guidance-article .trajectory{display:grid;grid-template-columns:minmax(48px,1fr) auto 1.2fr auto 1.65fr auto minmax(48px,1fr);align-items:center;column-gap:7px;row-gap:10px;text-align:center}
  #guidance-article .trajectory .state,#guidance-article .trajectory .logits{font-size:22px;line-height:1.4;min-width:0}
  #guidance-article .trajectory .state-early,#guidance-article .trajectory .logits-early{color:var(--green)}
  #guidance-article .trajectory .state-final,#guidance-article .trajectory .logits-final{color:var(--blue)}
  #guidance-article .trajectory .arrow{color:var(--muted);font-size:24px;white-space:nowrap}
  #guidance-article .trajectory .readout-arrow{grid-row:2;font:22px/1 var(--sans);color:var(--muted)}
  #guidance-article .trajectory .readout-early,#guidance-article .trajectory .logits-early{grid-column:1}
  #guidance-article .trajectory .readout-final,#guidance-article .trajectory .logits-final{grid-column:7}
  #guidance-article .trajectory .readout-label{grid-column:2/7;grid-row:2;font:12px/1.5 var(--sans);color:var(--muted)}
  #guidance-article .trajectory .logits{grid-row:3}
  #guidance-article .trajectory small{display:block;font:11px/1.5 var(--sans);color:var(--muted);margin-top:5px;white-space:nowrap}
  #guidance-article .logit-space{grid-column:2/7;grid-row:3;align-self:start;display:flex;align-items:center;gap:12px;min-height:31px;min-width:0;font:13px/1.4 var(--sans);color:var(--muted)}
  #guidance-article .space-arrow{position:relative;flex:1;min-width:14px;border-top:1px solid currentColor}
  #guidance-article .space-arrow::after{content:"";position:absolute;top:-3px;width:5px;height:5px;border-top:1px solid currentColor;border-right:1px solid currentColor}
  #guidance-article .space-arrow-early{color:var(--green)}
  #guidance-article .space-arrow-early::after{left:0;transform:rotate(-135deg)}
  #guidance-article .space-arrow-final{color:var(--blue)}
  #guidance-article .space-arrow-final::after{right:0;transform:rotate(45deg)}
  #guidance-article .loop-architecture .architecture-guidance{margin:22px 0 0}
  #guidance-article .token-tree{max-width:600px;margin:28px auto}
  #guidance-article .token-tree-final{color:var(--blue)}
  #guidance-article .token-tree-diagram{position:relative;height:372px;text-align:center;font-size:20px;line-height:32px}
  #guidance-article .token-tree-branches{position:absolute;inset:0 0 auto;width:100%;height:332px;fill:none;stroke:#9da6a5;stroke-width:1.5}
  #guidance-article .token-tree-branches path{vector-effect:non-scaling-stroke}
  #guidance-article .token-tree-start{position:absolute;top:0;left:0;right:0;color:var(--muted)}
  #guidance-article .token-tree-probability{position:absolute;transform:translate(-50%,-50%);padding:2px 4px;background:var(--paper);font-size:15px;line-height:1.5;white-space:nowrap}
  #guidance-article .token-tree-probability output{display:block}
  #guidance-article .token-tree-probability output{font-size:14px;font-variant-numeric:tabular-nums}
  #guidance-article .token-tree-prob-a{top:77px;left:37.5%}
  #guidance-article .token-tree-prob-b{top:77px;left:62.5%}
  #guidance-article .token-tree-prob-a1{top:254px;left:12.5%}
  #guidance-article .token-tree-prob-a2{top:254px;left:37.5%}
  #guidance-article .token-tree-prob-b1{top:254px;left:62.5%}
  #guidance-article .token-tree-prob-b2{top:254px;left:87.5%}
  #guidance-article .token-tree-first,#guidance-article .token-tree-second,#guidance-article .token-tree-sequences{position:absolute;left:0;right:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
  #guidance-article .token-tree-first{top:122px;grid-template-columns:repeat(2,minmax(0,1fr))}
  #guidance-article .token-tree-second{top:300px}
  #guidance-article .token-tree-sequences{top:340px;color:var(--muted);font-size:17px}
  #guidance-article .token-tree figcaption{font:inherit;font-size:18px;text-align:center}
  #guidance-article .toy{background:#fff;border:1px solid var(--line);padding:26px 28px;margin:30px 0}
  #guidance-article .toy h3{margin:0 0 6px;font-size:24px}
  #guidance-article .toy-description{font:13px/1.7 var(--sans);color:var(--muted);margin:0 0 22px}
  #guidance-article .toy-question{font:600 14px/1.5 var(--sans);margin:24px 0 12px}
  #guidance-article .toy-description strong{color:var(--ink)}
  #guidance-article .probability{display:grid;grid-template-columns:115px 1fr 60px;gap:14px;align-items:center;font:13px/1.5 var(--sans);margin:13px 0}
  #guidance-article .probability strong{color:var(--green);font-weight:650}
  #guidance-article .probability.toy-joint strong{color:var(--blue)}
  #guidance-article .toy .probability output{text-align:right;color:var(--green);font-size:18px}
  #guidance-article .toy .probability.toy-joint output{color:var(--blue)}
  #guidance-article .toy-marginals{display:grid;gap:12px;text-align:center}
  #guidance-article .toy-joint-marginal{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px}
  #guidance-article .toy-takeaway{margin:16px 0 20px;font:13px/1.65 var(--sans)}
  #guidance-article .toy-agree .toy-takeaway strong{color:var(--green)}
  #guidance-article .toy-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:16px 0}
  #guidance-article .toy label{display:flex;justify-content:space-between;gap:10px;font:13px/1.5 var(--sans);margin-bottom:10px}
  #guidance-article .toy input[type=range]{width:100%;accent-color:var(--blue);cursor:pointer;min-height:24px;margin:0}
  #guidance-article .toy output{font-variant-numeric:tabular-nums;font-weight:650;color:var(--blue)}
  #guidance-article .bar{height:12px;background:#dbe3e3;overflow:hidden}
  #guidance-article .bar span{display:block;height:100%;background:var(--green);transition:width .1s linear}
  #guidance-article .toy-joint .bar span{background:var(--blue)}
  #guidance-article .toy-details{border-top:1px solid var(--line);font:13px/1.7 var(--sans)}
  #guidance-article .toy-details summary{padding:15px 0;cursor:pointer;color:var(--blue);line-height:1.6}
  #guidance-article .toy-details p{margin:0 0 16px}
  #guidance-article .toy .table-scroll{margin-bottom:18px}
  #guidance-article .toy table{font-size:13px}
  #guidance-article .toy th:nth-child(4),#guidance-article .toy td:nth-child(4){background:#f0f6f3;color:var(--green);font-weight:600}
  #guidance-article .toy th:nth-child(5),#guidance-article .toy td:nth-child(5){background:#eef4f9;color:var(--blue);font-weight:600;padding-right:12px}
  #guidance-article .toy .toy-stats{display:flex;gap:8px 26px;font:12px/1.7 var(--sans);flex-wrap:wrap;margin:15px 0 12px;color:var(--muted)}
  #guidance-article .toy .toy-stats output{font-weight:600;color:var(--ink)}
  #guidance-article .endnote{font:13px/1.75 var(--sans);color:var(--muted);border-top:1px solid var(--line);padding-top:23px;margin-top:38px}
  @media(max-width:700px){#guidance-article .toy-controls{grid-template-columns:1fr;gap:17px}}
  @media(max-width:520px){#guidance-article .opening{font-size:21px}
  #guidance-article h2{font-size:28px;margin-top:42px}
  #guidance-article h3{font-size:23px}
  #guidance-article .proof-body{padding-inline:8px;font-size:17px}
  #guidance-article .equation{font-size:82%}
  #guidance-article .toy{padding:21px 16px}
  #guidance-article .toy-controls{grid-template-columns:1fr;gap:17px}
  #guidance-article .probability{grid-template-columns:110px 1fr 52px;gap:9px;font-size:12px}
  #guidance-article .toy .probability output{font-size:16px}
  #guidance-article .loop-architecture{padding:18px 0}
  #guidance-article .architecture-label{font-size:11px}
  #guidance-article .trajectory{column-gap:3px;grid-template-columns:minmax(40px,1fr) auto 1.2fr auto 1.65fr auto minmax(40px,1fr)}
  #guidance-article .trajectory .state,#guidance-article .trajectory .logits{font-size:16px}
  #guidance-article .trajectory small{font-size:10px;white-space:normal}
  #guidance-article .trajectory .arrow{font-size:17px;line-height:1.1}
  #guidance-article .trajectory .readout-label{font-size:11px}
  #guidance-article .logit-space{min-height:23px;gap:8px;font-size:12px}
  #guidance-article th,#guidance-article td{padding:10px 9px}
  #guidance-article blockquote{font-size:21px}}
  @media(prefers-reduced-motion:reduce){#guidance-article .bar span{transition:none}}
  @media print{#guidance-article .figure-links,#guidance-article .toy-controls{display:none}
  #guidance-article h2,#guidance-article h3,#guidance-article summary{break-after:avoid}
  #guidance-article figure,#guidance-article table,#guidance-article .trajectory{break-inside:avoid}
  #guidance-article .toy{break-inside:auto}
  #guidance-article .proof{border:0}
  #guidance-article .proof summary{font-size:12pt}
  #guidance-article .proof-body{font-size:11pt}
  #guidance-article a{color:inherit}
  #guidance-article .equation{overflow:visible}}
  #guidance-article h2 { scroll-margin-top:80px; }
  #guidance-article .guidance-toy-frame { display:block;width:100%;height:1380px;border:0; }
  #guidance-article .toy { color:#282b2d; --ink:#282b2d; --muted:#676b70; --paper:#fcfbf8; --line:#dedfdc; }
  @media(max-width:700px) { #guidance-article .guidance-toy-frame { height:1700px; } }
  @media(max-width:430px) { #guidance-article .guidance-toy-frame { height:1850px; } }
  @media(max-width:360px) { #guidance-article .guidance-toy-frame { height:2150px; } }
---

<div id="guidance-article">

<p class="opening">Guidance can dramatically improve prompt following and sample quality in image and video generation, simply by changing how a trained model is sampled.<d-cite key="cfg"></d-cite> Classifier-free guidance (CFG) is a standard ingredient in Stable Diffusion 3 and Wan.<d-cite key="sd3"></d-cite><d-cite key="wan"></d-cite> Its benefits are valuable enough that FLUX.1 [dev] is trained to distill guidance directly into the model.<d-cite key="flux"></d-cite></p>
<p>Can language models benefit in the same way? There is a catch: applying guidance to each next-token prediction does not generally produce the desired guided joint distribution over the full token sequence. The two procedures normalize probabilities differently. <strong>Looped models offer a way to narrow this gap.</strong><d-cite key="huginn,ouro,loopformer,fixed-points"></d-cite> When predictions from different loops are close, guidance changes token preferences at first order, while the normalization error enters at second order. In this blog, we explain why loops can make guidance more natural for language models, and how this connects them to diffusion.</p>

<h2 id="why-diffusion-guidance-needs-no-normalizer"><span aria-hidden="true" id="diffusion"></span>Why diffusion guidance needs no normalizer</h2>
<figure class="visual-interlude" id="diffusion-interlude">
<img alt="Sunlight makes soft, overlapping patterns on blue water." decoding="async" height="1067" loading="lazy" src="{{ '/assets/img/2027-04-30-guidance-in-looped-models/water-reflections.jpg' | relative_url }}" width="1600"/>
</figure>
<p>Start with a conditional density \(p(x\mid c)\), where \(c\) might be a text prompt. Suppose we want to favor samples that are especially characteristic of that condition. One way to express this preference is to tilt the density:</p>
<div class="equation">\[
  \widetilde p_w(x\mid c)
  =\frac{1}{Z_w(c)}\,
  \frac{p(x\mid c)^{1+w}}{p(x)^w},\qquad w\geq0.
  \tag{1}
\]</div>
<p>The ratio \(p(x\mid c)/p(x)\) favors samples that are more likely under the prompt than without conditioning. At \(w=0\), we recover ordinary conditional generation. Increasing \(w\) strengthens that preference. The normalizer \(Z_w(c)\) makes the density integrate to one.</p>
<p>Diffusion models use the score, the gradient of a log density, to guide denoising. <strong>Following common practice, we compute the score without knowing the normalizer, as the normalizer \(Z\) is considered independent of \(x\)</strong>.<d-cite key="sander"></d-cite> Guidance can therefore be written as a combination of the conditional and unconditional scores:</p>
<div class="equation">\[
  \nabla_x\log\widetilde p_w(x\mid c)
  =(1+w)\nabla_x\log p(x\mid c)
  -w\nabla_x\log p(x).
  \tag{2}
\]</div>
<p>This is the score combination behind classifier-free guidance.<d-cite key="cfg"></d-cite> <strong>In this score formulation, the normalizer vanishes.</strong><sup class="citation" id="fnref-cfg-scope"><a aria-label="Footnote: scope of the CFG score identity" href="#fn-cfg-scope" role="doc-noteref">*</a></sup></p>
<h2 id="token-level-guidance-and-the-joint-distribution"><span aria-hidden="true" id="sequences"></span>Token-level guidance and the joint distribution</h2>
<figure class="visual-interlude" id="sequence-interlude">
<img alt="Warm sunlight falls through a row of stone arches and windows." decoding="async" height="1067" loading="lazy" src="{{ '/assets/img/2027-04-30-guidance-in-looped-models/sunlit-arches.jpg' | relative_url }}" width="1600"/>
</figure>
<p>Guidance already exists in autoregressive LLMs. <em>Stay on topic with Classifier-Free Guidance</em> applies CFG by contrasting next-token predictions with and without the conditioning prompt, while keeping the generated prefix.<d-cite key="llm-cfg"></d-cite> Contrastive decoding uses a weaker model as the reference;<d-cite key="contrastive-decoding"></d-cite> DoLa uses predictions from earlier layers.<d-cite key="dola"></d-cite> Here we study their shared core idea: combine two next-token predictions, then normalize.</p>
<p>The <strong>joint distribution</strong> assigns a probability to every complete token sequence. Applying guidance to that distribution means reweighting each sequence and normalizing once. Token-level guidance instead normalizes separately at each prefix. These operations generally produce different sequence probabilities.</p>
<p>As Sander noted in his 2022 blog post:</p>
<blockquote>
<p>“my hunch is that diffusion guidance works so well precisely because we are able to apply it to the joint distribution”</p>
<footer>Sander Dieleman, Guidance: a cheat code for diffusion models (2022).<d-cite key="sander"></d-cite></footer>
</blockquote>
<p>Let \(p_K\) be the predictor we want to strengthen and \(p_E\) its reference. For a sequence \(y=(y_1,\ldots,y_T)\) of fixed length \(T\), \(y_t\) is the next token and \(y_{&lt;t}=(y_1,\ldots,y_{t-1})\) is its prefix. Assuming positive token probabilities and leaving the fixed prompt conditioning implicit, token-level guidance gives</p>
<div class="equation">\[
  q(y_t\mid y_{&lt;t})=\frac{1}{C(y_{&lt;t})}\,
    \frac{p_K(y_t\mid y_{&lt;t})^{1+w}}{p_E(y_t\mid y_{&lt;t})^w},
  \qquad C(y_{&lt;t})=\sum_{y_t}\frac{p_K(y_t\mid y_{&lt;t})^{1+w}}{p_E(y_t\mid y_{&lt;t})^w}.
\]</div>
<p>Here \(C(y_{&lt;t})\) is the local normalizer; the sum runs over all possible next tokens.</p>
<p>Write \(p_K(y)\) and \(p_E(y)\) for each model's sequence probability, obtained by multiplying its token probabilities. Both \(Q_{\rm joint}\) and \(Q_{\rm local}\) are distributions over <strong>complete sequences</strong>, but they apply guidance differently:</p>
<div class="equation">\[
  \begin{aligned}
    Q_{\rm joint}(y)
    &amp;=\frac{1}{Z}\,
      \frac{p_K(y)^{1+w}}{p_E(y)^w},
      \qquad Z=\sum_y\frac{p_K(y)^{1+w}}{p_E(y)^w},\\[4pt]
    Q_{\rm local}(y)
    &amp;=\frac{1}{\prod_{t=1}^T C(y_{&lt;t})}\,
      \frac{p_K(y)^{1+w}}{p_E(y)^w}.
  \end{aligned}
  \tag{3}
\]</div>
<p>The numerators are identical, but the normalizers differ: \(Z\) is shared by every sequence, whereas the product of local normalizers depends on the sequence's prefixes \(y_{&lt;t}\). <strong>This is the normalization mismatch.</strong></p>
<p>Additionally, computing the full-sequence normalizer \(Z\) exactly is impractical for real LLMs: it requires summing over all possible future token sequences, whose number grows exponentially with length.</p>
<p><strong>If the guided joint distribution is our target, practical token-level guidance therefore tolerates a normalization error.</strong> The local rule avoids summing over future sequences by normalizing only the next-token scores. The question is how to make the resulting error small.</p>
<h3 id="a-two-token-example">A two-token example</h3>
<iframe class="guidance-toy-frame" loading="lazy" sandbox="allow-scripts allow-same-origin" src="{{ '/assets/html/2027-04-30-guidance-in-looped-models/guidance-toy.html' | relative_url }}" title="Interactive two-token guidance example"></iframe>
<h2 id="loooop"><span aria-hidden="true" id="loops"></span>Loooop</h2>
<figure class="visual-interlude" id="loop-interlude">
<img alt="Looking down a spiral staircase, with repeating white curves and yellow-edged steps." decoding="async" height="854" loading="lazy" src="{{ '/assets/img/2027-04-30-guidance-in-looped-models/spiral-staircase.jpg' | relative_url }}" width="1280"/>
</figure>
<p>A looped Transformer applies <strong>the same block of layers repeatedly</strong> before predicting the next token. Huginn and Ouro implement this idea in different ways.<d-cite key="huginn"></d-cite><d-cite key="ouro"></d-cite> Each completed loop gives a hidden state that can be converted into next-token logits (unnormalized token scores): \(z_E\) after an earlier loop \(E\), and \(z_K\) after the final loop \(K\).</p>
<figure aria-label="Repeated applications of the same block f refine the hidden state from loop E to final loop K. The early and final logits are close and are combined for guidance." class="loop-architecture" id="loop-architecture">
<div class="architecture-label">Same block, repeated</div>
<div class="trajectory">
<div class="state state-early">\(h_E\)</div><span aria-hidden="true" class="arrow">→</span>
<div class="state">\(f(h_E)\)</div><span aria-hidden="true" class="arrow">→</span>
<div class="state">\(f(f(h_E))\)</div><span aria-hidden="true" class="arrow">⋯ →</span>
<div class="state state-final">\(h_K\)</div>
<span aria-hidden="true" class="readout-arrow readout-early">↓</span>
<span aria-hidden="true" class="readout-arrow readout-final">↓</span>
<div class="logits logits-early">\(z_E\)<small>Early logits</small></div>
<div class="logit-space">
<span aria-hidden="true" class="space-arrow space-arrow-early"></span>
<span>Close logits</span>
<span aria-hidden="true" class="space-arrow space-arrow-final"></span>
</div>
<div class="logits logits-final">\(z_K\)<small>Final logits</small></div>
</div>
<div class="equation architecture-guidance">\[
    z_{\rm guided}=z_K+w(z_K-z_E).
  \]</div>
</figure>
<p>The earlier prediction serves as the weaker reference for guiding the final prediction. Both come from the same model on the same text prefix; the difference is how many loops of computation they use.</p>
<p>LoopCD uses these predictions for guidance without additional training.<d-cite key="loopcd"></d-cite> Its logit variant strengthens the final logits \(z_K\) along the difference \(z_K-z_E\). Applying softmax gives \(q\), the <strong>guided next-token probability distribution</strong>:</p>
<div class="equation">\[
  z_{\rm guided}=z_K+w(z_K-z_E),\qquad
  q=\operatorname{softmax}(z_{\rm guided}).
  \tag{4}
\]</div>
<p>LoopCD's logit variant uses the first loop as its reference. The paper also combines hidden states before converting them into logits; the analysis below concerns the logit rule in Equation (4).</p>
<figure class="loopcd-results-figure" id="loopcd-results">
<picture>
<source height="950" media="(max-width: 600px)" srcset="{{ '/assets/img/2027-04-30-guidance-in-looped-models/loopcd-results-mobile.svg' | relative_url }}" width="520"/>
<img alt="Two separate LoopCD comparisons, showing pass@1 percentages on zero-to-100 axes. On AIME 2024, Ouro-2.6B-Thinking improves from 61.88 unguided to 70.62 guided, a gain of 8.74 percentage points. On HumanEval, Huginn-0125 improves from 22.56 unguided to 31.71 guided, a gain of 9.15 percentage points. Both use fixed-strength guidance." height="490" loading="lazy" src="{{ '/assets/img/2027-04-30-guidance-in-looped-models/loopcd-results.svg' | relative_url }}" width="1060"/>
</picture>
<figcaption><strong>Guidance improves results at the same loop count.</strong> Replotted from LoopCD.<d-cite key="loopcd"></d-cite></figcaption>
</figure>
<p>Because every loop repeats the same computation, its predictions are expected to stay close as the hidden state is refined. This gives us a route back to the normalization problem: <strong>close loop predictions can make token-level guidance a better approximation to the guided joint distribution.</strong> Below we show how the error depends on their logit difference, then measure that difference.</p>
<h3 id="why-loops-help"><span aria-hidden="true" id="cancellation"></span>Why loops help</h3>
<p>The key assumption is that predictions from different loops have similar logits. Under this small-difference assumption, we can bound the local normalizer \(C(y_{&lt;t})\).</p>
<p>At a fixed prefix, write \(\delta=z_K-z_E\). After removing an irrelevant constant offset, assume \(\delta=\epsilon d\), with \(d\) bounded and \(\epsilon\) small. Keep the guidance strength fixed and bounded. A Taylor expansion gives</p>
<div class="key-result">
<div class="equation">\[
    \boxed{\log C(y_{&lt;t})
    =\frac{w(1+w)}{2}\operatorname{Var}_{p_E}(\delta)
    +O(\epsilon^3).}
    \tag{5}
  \]</div>
<p>The constant and first-order terms cancel. Guidance changes token log-odds at first order; its local log-normalization cost starts at second order.</p>
</div>
<details class="proof" id="proof-taylor">
<summary>Proof of Equation (5)</summary>
<div class="proof-body">
<p id="proof-kl">Fix a prefix \(y_{&lt;t}\). The local normalizer satisfies the exact identity</p>
<div class="equation">\[
      \begin{aligned}
        \log C(y_{&lt;t})
        &amp;=D_{\rm KL}\bigl(p_K(\cdot\mid y_{&lt;t})\Vert q(\cdot\mid y_{&lt;t})\bigr)\\
        &amp;\quad+wD_{\rm KL}\bigl(p_K(\cdot\mid y_{&lt;t})\Vert p_E(\cdot\mid y_{&lt;t})\bigr).
      \end{aligned}
      \tag{6}
    \]</div>
<p><strong>Proof of Equation (6).</strong> For each possible next token \(y_t\), rearrange the definition of \(q(y_t\mid y_{&lt;t})\):</p>
<div class="equation">\[
      \log\frac{p_K(y_t\mid y_{&lt;t})}{q(y_t\mid y_{&lt;t})}
      =\log C(y_{&lt;t})-w\log\frac{p_K(y_t\mid y_{&lt;t})}{p_E(y_t\mid y_{&lt;t})}.
    \]</div>
<p>Taking the expectation over \(y_t\sim p_K(\cdot\mid y_{&lt;t})\) yields Equation (6). For \(w\geq0\), both KL terms are nonnegative, so \(\log C(y_{&lt;t})\geq0\). This identity does not require small logit differences. \(\square\)</p>
<p>For the Taylor expansion, write the logit difference as \(\delta(y_t\mid y_{&lt;t})=z_K(y_t\mid y_{&lt;t})-z_E(y_t\mid y_{&lt;t})\). Define its log moment-generating function under the reference distribution:</p>
<div class="equation">\[
      \psi(\alpha;y_{&lt;t})
      =\log\sum_{y_t}p_E(y_t\mid y_{&lt;t})e^{\alpha\delta(y_t\mid y_{&lt;t})}.
    \]</div>
<p>Softmax gives</p>
<div class="equation">\[
      p_K(y_t\mid y_{&lt;t})
      =p_E(y_t\mid y_{&lt;t})e^{\delta(y_t\mid y_{&lt;t})-\psi(1;y_{&lt;t})}.
    \]</div>
<p>Substituting into the definition of \(C(y_{&lt;t})\), we obtain the exact expression</p>
<div class="equation">\[
      \log C(y_{&lt;t})
      =\psi(1+w;y_{&lt;t})-(1+w)\psi(1;y_{&lt;t}).
    \]</div>
<p>For \(\delta=\epsilon d\) with uniformly bounded \(d\), and bounded \(\alpha\), expand</p>
<div class="equation">\[
      \begin{aligned}
        \psi(\alpha;y_{&lt;t})
        &amp;=\alpha\mathbb E_{p_E(\cdot\mid y_{&lt;t})}[\delta]\\
        &amp;\quad+\frac{\alpha^2}{2}\operatorname{Var}_{p_E(\cdot\mid y_{&lt;t})}(\delta)
        +O(\epsilon^3).
      \end{aligned}
    \]</div>
<p>The expectation and variance are over next tokens \(y_t\) at the same prefix \(y_{&lt;t}\). Substitution cancels the linear terms and leaves</p>
<div class="equation">\[
      \begin{aligned}
        \log C(y_{&lt;t})
        &amp;=\frac{(1+w)^2-(1+w)}{2}\operatorname{Var}_{p_E(\cdot\mid y_{&lt;t})}(\delta)
          +O(\epsilon^3)\\
        &amp;=\frac{w(1+w)}{2}\operatorname{Var}_{p_E(\cdot\mid y_{&lt;t})}(\delta)
          +O(\epsilon^3).
      \end{aligned}
    \]</div>
<p>This proves Equation (5). \(\square\)</p>
</div>
</details>
<p>Suppose \(0\leq\log C(y_{&lt;t})\leq\eta\) at every prefix of a length-\(T\) sequence. Equation (3) then bounds the log-probability difference between token-level guidance and the guided joint distribution:</p>
<div class="equation">\[
  \left|\log\frac{Q_{\rm local}(y)}{Q_{\rm joint}(y)}\right|
  \leq T\eta.
  \tag{7}
\]</div>
<p>Equation (7) bounds the full-sequence error by \(T\eta\). Under the uniform small-difference assumption, \(\eta=O(\epsilon^2)\), so this error is \(O(T\epsilon^2)\): close predictions let the token-level rule approximate the guided joint distribution without summing over future sequences.</p>
<details class="proof" id="proof-sequence">
<summary>Proof of Equation (7)</summary>
<div class="proof-body">
<p>Set \(D(y)=\prod_t C(y_{&lt;t})\). Equation (3) gives \(ZQ_{\rm joint}(y)=Q_{\rm local}(y)D(y)\). Summing over sequences gives</p>
<div class="equation">\[
      Z=\sum_y Q_{\rm local}(y)D(y)
       =\mathbb E_{Q_{\rm local}}D(Y).
    \]</div>
<p>The prefix bound gives \(1\leq D(y)\leq e^{T\eta}\) for every sequence. Its expectation obeys the same bounds, so \(0\leq\log Z\leq T\eta\). Finally,</p>
<div class="equation">\[
      \log\frac{Q_{\rm local}(y)}{Q_{\rm joint}(y)}
      =\log Z-\log D(y).
    \]</div>
<p>Both terms lie in \([0,T\eta]\), establishing Equation (7). This argument retains the global normalizer rather than dropping it.</p>
</div>
</details>
<p>This is why similar loop outputs help: guidance changes token preferences at first order in \(\epsilon\), while the mismatch between token-level guidance and the guided joint distribution is \(O(T\epsilon^2)\) for a sequence of length \(T\).</p>
<h2 id="are-predictions-from-different-loops-actually-closer"><span aria-hidden="true" id="measurements"></span>Are predictions from different loops actually closer?</h2>
<p>We compared two looped models, Huginn-0125 and Ouro-2.6B, with two ordinary Transformers, Qwen2.5-3B and Pythia-2.8B. Each model saw the same 1,024 text prefixes: eight positions on each of 128 GSM8K development questions. At each prefix, we compared the model's next-token logits partway through its computation with its own final logits.</p>
<p>Here, <strong>depth \(k\)</strong> means the number of completed loops in a looped model, or completed layers in an ordinary Transformer. The final depth \(K\) stays fixed. Let \(V\) be the vocabulary size and \(v\in\{1,\ldots,V\}\) a candidate token's index. Then \(z_{k,v}(y_{&lt;t})\) is that token's score after depth \(k\), on the same text prefix \(y_{&lt;t}\).</p>
<p>For each \(k\), compute the change to the final score, \(\delta^{(k)}_v(y_{&lt;t})=z_{K,v}(y_{&lt;t})-z_{k,v}(y_{&lt;t})\). Remove its vocabulary mean, \(\bar\delta^{(k)}(y_{&lt;t})=V^{-1}\sum_v\delta^{(k)}_v(y_{&lt;t})\), because adding the same constant to every logit does not change softmax. We measure the remaining change with</p>
<div class="equation">\[
  \operatorname{RMS}_{\rm centered}(k,y_{&lt;t})
  =\sqrt{\frac{1}{V}\sum_{v=1}^V
    \bigl(\delta^{(k)}_v(y_{&lt;t})-\bar\delta^{(k)}(y_{&lt;t})\bigr)^2}.
  \tag{8}
\]</div>
<p>Intuitively, this measures <strong>how much the next-token scores change between an intermediate depth and the final depth</strong>. It is the standard deviation of those score changes across the vocabulary. A smaller value means the predictions vary less as the model performs more loops or layers.</p>
<p>In the plot, we vary \(k\), keep the prefix and final depth \(K\) fixed, and average the RMS over the 1,024 prefixes. The horizontal position is \(k/K\): 50% means halfway through that model. The depths used for the quarter, half, and three-quarter comparisons are:</p>
<div class="table-scroll">
<table>
<thead><tr><th scope="col">Model</th><th scope="col">Intermediate \(k\): 25%, 50%, 75%</th><th scope="col">Fixed final \(K\)</th></tr></thead>
<tbody>
<tr><th scope="row">Huginn-0125</th><td>Loops 8, 16, 24</td><td>32 loops</td></tr>
<tr><th scope="row">Ouro-2.6B</th><td>Loops 1, 2, 3</td><td>4 loops</td></tr>
<tr><th scope="row">Qwen2.5-3B</th><td>Layers 9, 18, 27</td><td>36 layers</td></tr>
<tr><th scope="row">Pythia-2.8B</th><td>Layers 8, 16, 24</td><td>32 layers</td></tr>
</tbody>
</table>
</div>
<figure class="measurement-figure" id="readout-comparison">
<picture>
<source media="(max-width: 600px)" srcset="{{ '/assets/img/2027-04-30-guidance-in-looped-models/logit-gaps-mobile.svg' | relative_url }}"/>
<img alt="Logit changes from an intermediate loop or layer to the final depth. Huginn and Ouro have smaller changes than Qwen and Pythia, both in centered RMS and after adjusting for final-logit scale." height="720" loading="eager" src="{{ '/assets/img/2027-04-30-guidance-in-looped-models/logit-gaps.svg' | relative_url }}" width="1440"/>
</picture>
<figcaption><strong>How much do predictions change with more computation?</strong> Panel A: the centered RMS in Equation (8). Panel B: the same gap divided by the final logits' centered RMS at each prefix, then averaged, to account for different logit scales. The horizontal axis changes the intermediate loop or layer; the final depth stays fixed. Lower values mean closer intermediate and final predictions.</figcaption>
</figure>
<p><strong>The looped models' mean gaps are 2.8–14.1 times smaller</strong> across all twelve comparisons. Every paired 95% bootstrap interval for the ratio lies below one. The ordering also holds after scale normalization and when using only question prefixes, before any answer text.</p>
<div class="key-result" id="measurement-takeaway">
<p><strong>The smaller logit gaps support the proposed mechanism: loop predictions stay closer, making smaller normalization errors plausible.</strong> Under the small-difference assumption, guidance changes token preferences at first order while the normalization error grows only at second order. This gives looped models a natural route toward effective token-level guidance that stays close to the desired joint distribution.</p>
</div>
<h2 id="loops-and-diffusion-beyond-guidance"><span aria-hidden="true" id="connections"></span>Loops and diffusion, beyond guidance</h2>
<figure class="visual-interlude" id="connections-interlude">
<img alt="A river curves between moss-covered canyon walls and green banks." decoding="async" height="2133" loading="lazy" src="{{ '/assets/img/2027-04-30-guidance-in-looped-models/winding-river.jpg' | relative_url }}" width="1600"/>
</figure>
<p><strong>Guidance is one connection between looped models and diffusion; learning to refine a prediction is the broader one.</strong> Autoguidance uses a smaller, less-trained diffusion model as a reference,<d-cite key="autoguidance"></d-cite> while a looped model can use its own earlier prediction. In both cases, a weaker prediction provides information for improving a stronger one.</p>
<p>These connections are now explicit in the methods themselves. Time-Modulated Looped Transformers borrow diffusion-style timestep conditioning,<d-cite key="tmlt"></d-cite> and LoopFormer adds step-size conditioning and shortcut consistency.<d-cite key="loopformer"></d-cite> Denoising Recursion Models learn multi-step correction of corrupted solutions,<d-cite key="denoising-recursion"></d-cite> while <em>Thinking with Looped Flows</em> couples recurrent states to a learned denoising flow.<d-cite key="looped-flows"></d-cite> In the other direction, Looped Diffusion Language Models and Looped-DiT repeat Transformer blocks inside diffusion models, allowing compute to grow through loop depth as well as sampling steps.<d-cite key="loopmdm"></d-cite><d-cite key="looped-dit"></d-cite></p>
<h2 id="what-s-next"><span aria-hidden="true" id="whats-next"></span>What's next?</h2>
<p>In this blog, we showed that intermediate and final logits are much closer in the looped models we tested. This supports an approximate decomposition of sequence-level guidance into per-token guidance: close logits reduce the normalizer mismatch, helping explain why token-level guidance can work so well in looped models.</p>
<p>The same structure offers flexibility at test time. Rather than one fixed computation, a looped model performs a sequence of smaller refinement steps. An inference algorithm can decide how long to keep refining a state and how strongly to steer each update.</p>
<p>The broader picture concerns test-time scaling itself. Test-time scaling is about how computation is organized, not only how much is spent.<d-cite key="test-time-compute"></d-cite> Loops refine a hidden state; diffusion refines a sample. Guidance adds another use for their intermediate predictions: a direction for correction. <strong>More compute is useful when the inference algorithm knows what to do with it. What scales is the model together with that algorithm.</strong></p>
<p class="endnote" id="fn-cfg-scope" role="doc-footnote"><sup>*</sup> Score-based models learn scores of noisy distributions from samples.<d-cite key="score-sde"></d-cite> Combining conditional and unconditional score estimates implements the reweighting idea at each noise level, although the resulting sampler need not reproduce the corresponding clean-data distribution in Equation (1).<d-cite key="sander"></d-cite><d-cite key="predictor-corrector"></d-cite><d-cite key="fine-grained"></d-cite> We therefore view score-level CFG as a practical surrogate for distribution-level reweighting. <a aria-label="Back to the CFG score footnote marker" class="citation-back" href="#fnref-cfg-scope" role="doc-backlink">↩</a></p>

</div>
