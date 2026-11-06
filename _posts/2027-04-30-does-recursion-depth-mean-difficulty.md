---
layout: distill
title: "Does Recursion Depth Mean Difficulty? A Token-Level Test of Mixture-of-Recursions"
description: Mixture-of-Recursions gives each token a recursion depth, and the original paper reads depth as a sign of how easily the next token can be predicted. We test that reading on the released 360M checkpoints. Depth is low for easy tokens and stops rising near the median token. The hardest tokens gain least from depth, and token-choice depth is almost a fixed function of the token.
date: 2027-04-30
future: true
htmlwidgets: true
hidden: true

authors:
  - name: Anonymous

bibliography: 2027-04-30-does-recursion-depth-mean-difficulty.bib

toc:
  - name: The question
  - name: How MoR assigns depth
  - name: The test
  - name: Depth rises for easy tokens, then stays flat
  - name: The hardest tokens gain least
  - name: Token identity explains much of depth
  - name: Token-choice routing is close to a lookup table
  - name: The router still matters
  - name: How to read a depth map
  - name: Limits
---

## The question

Mixture-of-Recursions (MoR) <d-cite key="bae2025mor"></d-cite> runs one shared Transformer block a different number of times for different tokens. The token visualisations in the paper show some words receiving one pass and others receiving three. Section 5.2 of the paper states that recursion depth "directly indicates how easily the next token can be predicted within the given context".

The paper supports this statement with examples. We found no per-token comparison of depth with a measure of difficulty in the main text or Appendix I of the paper. This post makes that comparison on the authors' released checkpoints and held-out data. We assume familiarity with the standard Transformer and do not assume any background in Mixture-of-Experts or adaptive computation.

This post reports four findings.

- Depth is low for easy tokens and stops rising near the median token. The rank correlation with difficulty is 0.10 to 0.22.
- The hardest tenth of tokens gain the least from depth under three recursions.
- Token identity alone explains 35% to 44% of expert-choice depth and 99.5% of token-choice depth.
- The router still matters. Random routing at the same depth split raises loss, and full depth for every token does not lower it.

These results suggest that depth reflects a learned allocation of computation more than a measure of difficulty.

## How MoR assigns depth

A recursive Transformer applies a shared block up to $$N_r$$ times. Weight sharing across depth with per-position halting appears in earlier work, including Adaptive Computation Time <d-cite key="graves2016act"></d-cite> and Universal Transformers <d-cite key="dehghani2019universal"></d-cite>. Mixture-of-Depths <d-cite key="raposo2024mod"></d-cite> added top-$$k$$ token selection to skip layers. MoR combines a shared block with a router trained from scratch and a matching key-value cache design. Mixture-of-Experts chooses which weights process a token, whereas MoR chooses how many times the same weights run.

Figure 1 shows the two router types in MoR.

{% include figure.liquid path="assets/img/2027-04-30-does-recursion-depth-mean-difficulty/routing_mechanism.png" class="img-fluid" %}

<div class="caption">
  Figure 1. The two routers, drawn with nine illustrative tokens. A green cell marks a token processed at that recursion.
</div>

The **expert-choice router** follows Zhou et al. <d-cite key="zhou2022expertchoice"></d-cite>. At each recursion, a top-$$k$$ selection keeps a fixed share of the tokens in the sequence. With three recursions the shares are 1, 2/3 and 1/3, so each depth holds a third of the tokens in every sequence. Depth under this fixed split is a rank within the sequence, and a hard document cannot receive more depth than an easy document. The top-$$k$$ selection also uses the whole sequence, including future tokens, and the paper calls this effect information leakage.

The **token-choice router** assigns each token one depth before the first recursion. This router is causal, but the number of tokens at each depth can differ. Uneven load leaves hardware idle because a batch waits for its deepest tokens, so training includes a balancing loss. On our data the three depths hold 46.6%, 28.9% and 24.5% of tokens.

Neither router receives a difficulty label. Both routers are trained with the language modelling loss and routing losses, so any link between depth and difficulty arises during training.

## The test

**Models and data.** We used the released 360M checkpoints: expert-choice with 2, 3 and 4 recursions, token-choice with 3 recursions, and the vanilla model without recursion. The data is the first 1,000 sequences of 2,048 tokens from the authors' held-out FineWeb set. Position $$t$$ predicts token $$t+1$$, so every per-token value below refers to that prediction.

**Difficulty.** The main challenge is that language tokens have no ground-truth difficulty. We used the vanilla model's per-token loss as a proxy, because that model has no router and cannot share MoR's routing decisions. We also report its predictive entropy. Both measure difficulty for one model of this size, so a token may be hard here and easy for a larger model.

**Benefit.** We define the benefit of depth at a position as the loss in nats with nearly every token forced to depth 1 minus the loss with every token forced to full depth, using the same MoR model.<d-footnote>The code keeps at least one token per recursion, so the depth 1 run leaves one token per sequence at full depth.</d-footnote>

**Routing swaps.** We replaced only the top-$$k$$ selection and kept the router's own gate values:

```python
def topk(scores, k, policy):
    if policy == "router":
        return torch.topk(scores, k, dim=1)
    rank = -scores if policy == "inverted" else torch.rand_like(scores)
    index = torch.topk(rank, k, dim=1).indices
    return torch.gather(scores, 1, index), index
```

**Pre-set rules.** We wrote the expert-choice analysis and three reading rules before seeing results. The thresholds are our own choices.<d-footnote>Depth tracks difficulty if the mean per-sequence Spearman correlation with vanilla loss is at least 0.2 and at least 0.1 after removing token and position effects. Depth is mainly lexical if the held-out coefficient of determination (R²) on token identity is at least 0.5. Routing matters if random routing is worse with a confidence interval that excludes zero. The choices of 1,000 sequences and 64 position bins are also arbitrary.</d-footnote> The token-choice run, the decile views and the token lists came afterwards and are exploratory.

**Check against the paper.** Our losses for the vanilla, 3-recursion and 2-recursion models are 2.761, 2.773 and 2.731. Table 3 of the paper reports a negative log-likelihood (NLL) of 2.7824, 2.7925 and 2.7511 for matching models. Our three values are each about 0.02 lower, which is consistent with a sample of the same test set. All confidence intervals are 95% bootstrap intervals over sequences. Each interval for a correlation lies within 0.01 of the mean.

## Depth rises for easy tokens, then stays flat

Figure 2 shows the first test sequence, which is the default sample in the official routing notebook. The sequence contains the word "defensively", and the paper uses the same subword as an example.

<div class="l-page">
  <iframe src="{{ 'assets/html/2027-04-30-does-recursion-depth-mean-difficulty/passage.html' | relative_url }}" title="Interactive passage coloured by depth or by vanilla loss" frameborder="0" scrolling="auto" height="560px" width="100%"></iframe>
</div>
<div class="caption">
  Figure 2. One test passage under the 3-recursion expert-choice model. Hover or tab to a token to read its depth and the vanilla loss on the next token.
</div>

The paper describes "-ensively" as straightforward to predict and therefore needing fewer steps. In this passage, the router assigns depth 1 to the position that predicts this subword. The vanilla loss at that position is 5.16 nats, which is in the hardest fifth of tokens. A single token is not evidence of a trend, so the table below uses all two million positions.

| Model | Correlation with vanilla loss | Correlation with vanilla entropy | Vanilla loss at each depth, shallow to deep |
| --- | --- | --- | --- |
| Expert-choice, 2 recursions | 0.098 | 0.088 | 2.61, 2.91 |
| Expert-choice, 3 recursions | 0.217 | 0.249 | 1.90, 3.47, 2.91 |
| Expert-choice, 4 recursions | 0.197 | 0.216 | 1.80, 3.08, 3.39, 2.77 |

The correlations are positive and weak. Under our pre-set rule, the 3-recursion model passes narrowly, the 4-recursion model misses by 0.003, and the 2-recursion model fails. A rank correlation of 0.22 corresponds to about 5% of rank variance, so the size of the correlation matters more than the pass or fail.

With 3 and 4 recursions, tokens at depth 1 are easy, but the highest mean loss is at a middle depth and the deepest group is easier than that middle group.

{% include figure.liquid path="assets/img/2027-04-30-does-recursion-depth-mean-difficulty/depth_by_difficulty.png" class="img-fluid" %}

<div class="caption">
  Figure 3. Left: mean depth by decile of vanilla loss, on the full depth scale. Right: loss reduction from full depth by the same deciles, for 3 recursions.
</div>

Mean depth rises through the easiest three or four deciles and then stays nearly flat. With 3 recursions, mean depth moves from 1.45 to 2.07 by the fourth decile and ends at 2.11 in the hardest decile. In the hardest decile, 32% of tokens receive depth 3, which is close to the one third expected if depth ignored difficulty, and 21% receive depth 1. The statement in the paper fits the easiest deciles and does not describe the tokens above the median.

## The hardest tokens gain least

Difficulty measures how poorly a model predicts a token, and benefit measures how much full depth reduces the loss on that token. The right panel of Figure 3 shows the benefit by loss decile. With 3 recursions, benefit peaks at 0.29 nats in decile 7 and falls to 0.05 in decile 10. The drop also appears with 2 recursions (0.18 to -0.02) and with 4 recursions (0.40 to 0.19). The end-of-text token has a mean depth of 1.00 across 2,074 occurrences, and the vanilla loss on the following token is 6.52 nats. The preceding context contains little information about how a new document begins. One plausible reading is that some loss comes from missing information, which repeated computation cannot add.

Benefit also rises with assigned depth. With 3 recursions, tokens at depths 1, 2 and 3 gain 0.02, 0.25 and 0.38 nats. The rank correlation between depth and benefit is about 0.2 for all three models, so this link is also weak. The Limits section explains why this trend requires caution.

## Token identity explains much of depth

We fitted the mean depth of each token on half of the sequences and predicted depth on the other half.

{% include figure.liquid path="assets/img/2027-04-30-does-recursion-depth-mean-difficulty/token_identity.png" class="img-fluid" %}

<div class="caption">
  Figure 4. Share of depth variance on held-out sequences explained by token identity alone.
</div>

Figure 4 shows the held-out R² for each model. For expert-choice models, R² is below our 0.5 threshold for calling depth mainly lexical. With 3 recursions, the most common depth of a token matches its actual depth 72% of the time, against 33% for the largest depth group.

Among the 350 token types with at least 500 occurrences, the deepest include " who", " human", " could" and " get". Their mean vanilla losses are 2.7 to 3.8 nats. The shallowest include " don", " United" and " al", which have predictable continuations, and also " But" (4.15 nats), which does not.

Expert-choice depth also depends on context. After removal of token and position effects, the correlation with vanilla loss remains 0.13 to 0.16, and the correlation with entropy remains 0.19 to 0.26. The routers at later recursions receive hidden states that have passed through the shared block, so context can affect the decision.

## Token-choice routing is close to a lookup table

The token-choice router makes one decision, after a single Transformer layer. Token identity explains 99.5% of depth on held-out sequences, and the most common depth of a token matches its actual depth 99.9% of the time. The correlation with vanilla loss is -0.095 and changes to -0.005 after removal of token and position effects. Depth in this checkpoint contains almost no information about context.

Shuffling the router's choices within each sequence raises loss from 2.90 to 5.34. Forcing every token to depth 3 raises it to 6.02, and forcing depth 1 raises it to 4.72. Extra recursions raise the loss on tokens assigned to shallower depths, which suggests that each token type is processed at a fixed depth. Table 3 of the paper reports a higher NLL for token-choice than for expert-choice (2.9163 against 2.7925). The lookup behaviour may contribute to this gap, but we have not tested that explanation.

## The router still matters

Figure 5 shows the added loss when the trained router is replaced at inference.

{% include figure.liquid path="assets/img/2027-04-30-does-recursion-depth-mean-difficulty/routing_swaps.png" class="img-fluid" %}

<div class="caption">
  Figure 5. Added loss for expert-choice models. The depth split is fixed for the random and inverted runs.
</div>

Random routing adds 0.074 to 0.124 nats, and inverted routing adds 0.121 to 0.138 nats, with intervals that exclude zero. Table 13 of the paper gives related evidence, with an NLL of 2.9335 for a model trained with random routing against 2.8667 for the best learned router in that table. Our swap changes only inference, so part of our gap may come from the mismatch with training.

Full depth for every token adds 0.0003 to 0.0044 nats. With 3 recursions, the router uses two thirds of the block applications and matches the loss at full depth. The efficiency case for MoR rests on this result and does not depend on depth being a measure of difficulty.

## How to read a depth map

Depth maps invite the same interpretation as attention maps, and Jain and Wallace <d-cite key="jain2019attention"></d-cite> showed that attention weights require testing before being read as explanations. We suggest four checks for any adaptive-depth model, each of which requires only inference.

1. Correlate depth with per-token loss from a separate model, and plot depth by loss decile, because the correlation alone does not show the plateau reported here.
2. Report how much of depth a token-identity baseline explains.
3. Measure benefit as well as difficulty, because the two diverge for the hardest tokens.
4. Swap the router at a fixed depth split to separate router quality from the amount of computation.

Depth under fixed capacity is a rank within a sequence, so depth values cannot be compared across documents.

## Limits

- **One training run per setting.** Our intervals cover variation across sequences, not across training seeds.
- **One dataset and one model size.** We tested 360M models on educational web text. Larger models or other domains may differ.
- **Difficulty is a proxy.** Vanilla loss describes one model and is not a property of the token.
- **Forced runs are off-distribution.** The models never trained with random, inverted or forced routing, so those losses combine router quality with mismatch. The token-choice forced runs are too far from training to give a usable benefit measure, so we do not report one.
- **Benefit is partly circular.** Tokens routed deep during training are the ones the shared block learned to refine, so their larger benefit may be a result of routing and not a reason for it.
- **Future tokens.** Expert-choice results use whole-sequence top-$$k$$, as the official evaluation does. Depth during token-by-token decoding may differ.
- **Exploratory results.** The token-choice, decile and token-list results came after the pre-set analysis.
- **Variants not tested.** We did not run the key-value sharing checkpoint.

**Reproducing this work.** All routing runs for one checkpoint take about four minutes on one A100 GPU and do not require training or a cluster scheduler. The relevant official files are `expert_choice_router.py` and `token_choice_router.py`. We did not edit these files; a wrapper replaces the top-$$k$$ call at run time. We will release our scripts after review.
