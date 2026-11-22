---
layout: distill
title: "Why LLMs Can’t Let Go"
description: "Large Language Models now have access to more context than ever before. A natural concern in this setting has been their ability to retrieve information from that context. We shed light on other problems that arise with larger context windows, not because the model cannot locate the relevant context, but because it cannot ignore the irrelevant context. Through this blog, we aim to motivate the community to think beyond scaling the context window and retrieving the right context, toward the model's ability to ignore what it does not need."
date: 2027-04-30
future: true
htmlwidgets: true
hidden: true

# Mermaid diagrams
mermaid:
  enabled: true
  zoomable: true

# Anonymized for submission
authors:
  - name: Anonymous


# authors:
#   - name: Vishesh Kumar Singh
#     url: "https://vishesh-kumar-singh.github.io/classic"
#     affiliations: { name: IIT Kanpur }
#   - name: Praneel Pathak
#     affiliations: { name: IIT Kanpur }
#   - name: Saumya Shreyasee
#     affiliations: { name: IIT Kanpur }
#   - name: Jaeynaa Godawat
#     affiliations: { name: IIT Kanpur }
#   - name: Granth Chowdhury
#     affiliations: { name: IIT Kanpur }
#   - name: Rayeshwar Prakash Anvekar
#     affiliations: { name: IIT Kanpur }
#   - name: Preet Sethiya
#     affiliations: { name: IIT Kanpur }


# must be the exact same name as your blogpost
bibliography: 2027-04-30-remembering-everything.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: "Introduction"
    subsections:
      - name: "Three ways long context fails"
      - name: "What we argue"
      - name: "What we are not claiming"
  - name: "Retrieval Is the Easy Failure Mode"
  - name: "Proactive Interference: When Old Information Wins"
    subsections:
      - name: "What PI and RI mean"
      - name: "PI and RI are different failures"
  - name: "How Brains Resolve Interference"
  - name: "Overcontextualization: When the Model Uses What It Shouldn't"
    subsections:
      - name: "What the literature measures"
  - name: "Where Current Methods Stand"
    subsections:
      - name: "What we would want"
      - name: "Fixes that work around attention"
      - name: "Architectures that change attention"
      - name: "What has been tested"
  - name: "Summary"

# Below is an example of injecting additional post-specific styles.
# This is used in the 'Layouts' section of this post.
# If you use this post as a template, delete this _styles block.
_styles: >
  .chat-container {
    max-width: 540px;
    margin: 2rem auto;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .chat-header {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    padding: 14px 20px;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .chat-header::before {
    content: "●";
    color: #34d399;
    font-size: 10px;
  }
  .chat-body {
    background: #f8fafc;
    padding: 16px;
    max-height: 500px;
    overflow-y: auto;
  }
  .chat-msg {
    display: flex;
    margin-bottom: 12px;
    gap: 8px;
    align-items: flex-start;
  }
  .chat-msg.user { justify-content: flex-end; }
  .chat-msg.assistant { justify-content: flex-start; }
  .chat-bubble {
    max-width: 75%;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 13px;
    line-height: 1.45;
  }
  .chat-msg.user .chat-bubble {
    background: #6366f1;
    color: white;
    border-bottom-right-radius: 4px;
  }
  .chat-msg.assistant .chat-bubble {
    background: white;
    color: #334155;
    border: 1px solid #e2e8f0;
    border-bottom-left-radius: 4px;
  }
  .chat-divider {
    text-align: center;
    padding: 8px 0;
    font-size: 11px;
    color: #94a3b8;
    font-style: italic;
  }
  .chat-danger {
    background: #fef2f2 !important;
    border-color: #fecaca !important;
    color: #991b1b !important;
  }
  .callout-box,
  .callout-warning,
  .callout-insight,
  .callout-definition {
    padding: 16px 20px;
    border-radius: 8px;
    margin: 1.5rem 0;
    font-size: 0.92rem;
    line-height: 1.6;
  }
  .callout-warning {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    color: #92400e;
  }
  .callout-insight {
    background: #eef2ff;
    border-left: 4px solid #6366f1;
    color: #3730a3;
  }
  .callout-definition {
    background: #f0fdf4;
    border-left: 4px solid #22c55e;
    color: #166534;
  }
  .comparison-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.88rem;
  }
  .comparison-table th {
    background: #6366f1;
    color: white;
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
  }
  .comparison-table td {
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
  }
  .comparison-table tr:nth-child(even) td {
    background: #f8fafc;
  }
  .comparison-table tr:hover td {
    background: #eef2ff;
  }
  /* Dark theme overrides */
  [data-theme="dark"] .callout-warning,
  html[data-theme="dark"] .callout-warning {
    background: rgba(254, 243, 199, 0.12);
    border-left-color: #f59e0b;
    color: #fcd34d;
  }
  [data-theme="dark"] .callout-insight,
  html[data-theme="dark"] .callout-insight {
    background: rgba(99, 102, 241, 0.12);
    border-left-color: #818cf8;
    color: #c7d2fe;
  }
  [data-theme="dark"] .callout-definition,
  html[data-theme="dark"] .callout-definition {
    background: rgba(34, 197, 94, 0.12);
    border-left-color: #4ade80;
    color: #bbf7d0;
  }
  [data-theme="dark"] .callout-warning em,
  [data-theme="dark"] .callout-warning strong,
  html[data-theme="dark"] .callout-warning em,
  html[data-theme="dark"] .callout-warning strong {
    color: #fde68a;
  }
  [data-theme="dark"] .callout-insight em,
  [data-theme="dark"] .callout-insight strong,
  html[data-theme="dark"] .callout-insight em,
  html[data-theme="dark"] .callout-insight strong {
    color: #e0e7ff;
  }
  [data-theme="dark"] .callout-definition em,
  [data-theme="dark"] .callout-definition strong,
  html[data-theme="dark"] .callout-definition em,
  html[data-theme="dark"] .callout-definition strong {
    color: #d9f99d;
  }
  [data-theme="dark"] .chat-body,
  html[data-theme="dark"] .chat-body {
    background: #1e293b;
  }
  [data-theme="dark"] .chat-msg.assistant .chat-bubble,
  html[data-theme="dark"] .chat-msg.assistant .chat-bubble {
    background: #334155;
    color: #e2e8f0;
    border-color: #475569;
  }
  [data-theme="dark"] .chat-danger,
  html[data-theme="dark"] .chat-danger {
    background: rgba(239, 68, 68, 0.15) !important;
    border-color: #7f1d1d !important;
    color: #fca5a5 !important;
  }
  [data-theme="dark"] .chat-divider,
  html[data-theme="dark"] .chat-divider {
    color: #64748b;
  }
  [data-theme="dark"] .comparison-table td,
  html[data-theme="dark"] .comparison-table td {
    border-bottom-color: #334155;
    color: #cbd5e1;
  }
  [data-theme="dark"] .comparison-table tr:nth-child(even) td,
  html[data-theme="dark"] .comparison-table tr:nth-child(even) td {
    background: rgba(51, 65, 85, 0.4);
  }
  [data-theme="dark"] .comparison-table tr:hover td,
  html[data-theme="dark"] .comparison-table tr:hover td {
    background: rgba(99, 102, 241, 0.15);
  }
---

## Introduction
One of the main concerns with LLMs has always been memory. Achieving a complicated goal usually needs a lot of context, and early LLMs had very short context windows. To fix this, the industry pushed context windows from 1K tokens to 8K, then 32K, and now up to a few million. This brought a new problem, commonly known as the **Needle in a Haystack** problem: it is hard to find one particular piece of information in such a large context. A lot of work has studied this. Models struggle when the relevant information sits in the middle of the prompt <d-cite key="liu2024lost"></d-cite>, when the question and the answer share no words <d-cite key="modarressi2025nolima, hsieh2024ruler, vodrahalli2024michelangelo"></d-cite>, and when similar-looking distractors are present <d-cite key="hong2025context"></d-cite>.

But this work mostly focuses on one kind of failure in long context. Imagine you have been talking to an AI agent for a month. A week ago, you switched your working days from Monday–Friday to Tuesday–Saturday. The agent acknowledged it at the time, but today it books your meeting on a Monday. Later you ask it to list the attendees of last week's project meeting. The list is correct, except for one person you haven't worked with in three years, who happened to be mentioned constantly in your 2023 history.

In neither case did the model fail to *read* the relevant information. It failed to *let go* of the irrelevant information. A bigger window gives a model more room to *store* information. It does nothing to help the model decide what to *ignore*. The human brain stores decades of information and still copes, it seems in part by actively suppressing what is no longer relevant.

### Three ways long context fails

Retrieval is the most discussed problem in long context, but it is not the only one. As the context window grows, a model can run into two other failure modes: **Proactive Interference (PI)** and **Overcontextualization**.

<div class="comparison-table" markdown="block">

| Failure mode | What goes wrong |
| :--- | :--- |
| **Retrieval failure** | The model cannot *find* the relevant information, often because of where it sits in the prompt. |
| **Proactive interference (PI)** | Older information *conflicts with* newer information, and the old one wins. |
| **Overcontextualization** | Information that is true but irrelevant is pulled into the response. |

</div>

These failure modes matter because they also reduce the quality and reliability of LLMs in complex reasoning and planning tasks.

### What we argue

1. **The problem is structural, not just a matter of scale.** Retrieval benchmarks hide part of the problem of long context; interference and overcontextualization expose it.
2. **Brains seem to handle this with active suppression.** Humans also suffer from interference, but the brain appears to have mechanisms that actively push down outdated information. LLMs mostly rely on attention alone.
3. **Softmax attention has no built-in way to ignore.** It can make a token's weight small, but that weight depends on how *similar* the token looks to the question, not on whether it is still true or needed. We explain this in the section on current methods.
4. **Current fixes were not built for these failures.** They extend, compress, reorder, or cut the context, and most were never tested on interference or overcontextualization.
5. **Some newer architectures add forgetting, but none yet ignores selectively.** We summarize them, along with what they have and have not been tested on, to show where future work could start.

### What we are *not* claiming

We are not claiming that long context is useless, that retrieval and RAG don't help, or that forgetting is free. Forgetting may even be a bad idea, since deleted information cannot be retrieved again. What we want instead is the ability to *ignore* irrelevant information. But ignoring is also risky: a model that wrongly suppresses a rare but important fact, such as a drug allergy, has made a worse error than one that remembers too much. Whether context can be safely ignored remains an open problem.

## Retrieval Is the Easy Failure Mode
The most visible way long context fails is retrieval: the answer is in the prompt, and the model doesn't use it. Most of the long-context literature targets this failure mode. We define retrieval failure as:

<div class="callout-definition">
<strong>Retrieval Failure:</strong> the inability of a model to locate or extract relevant information present within its context window, typically driven by search depth, prompt length, or position (e.g., "lost in the middle").
</div>

Liu et al. <d-cite key="liu2024lost"></d-cite> showed that accuracy is highest when the relevant passage sits at the start or end of the prompt and drops when it is in the middle. Part of the advantage at the start may relate to attention sinks <d-cite key="xiao2024efficient"></d-cite>, the first few tokens that absorb a disproportionate share of attention. Later work found deeper problems. NoLiMa <d-cite key="modarressi2025nolima"></d-cite> removes word overlap between the question and the needle, and finds that 11 of 13 models claiming a 128K context window fall below half of their short-context accuracy by only 32K tokens. Its proposed explanation is that without a literal match, the target's attention score no longer stands out from the rest. RULER <d-cite key="hsieh2024ruler"></d-cite> and Michelangelo <d-cite key="vodrahalli2024michelangelo"></d-cite> reach similar conclusions with harder tasks, and Chroma's Context Rot report <d-cite key="hong2025context"></d-cite> finds the same on semantic tasks and in the presence of distractors. NoLiMa also tests what happens when the context contains a single irrelevant sentence that shares a word with the question. For GPT-4o, the effective context length falls from 8K to 1K. The distractor says nothing about the answer; the damage comes from word overlap alone.

Placing the query at both ends of the prompt helps <d-cite key="liu2024lost"></d-cite>, and reordering retrieved documents so the likely target lands near the end helps further <d-cite key="peysakhovich2023attention"></d-cite>. Both work by changing *where* the target sits, not how the model processes content. The widget below is a qualitative illustration of how sensitive retrieval is to word overlap and context length. It uses the probability the model gives to the correct answer token.

<div class="l-body-outset">
  <iframe src="{{ 'assets/html/2027-04-30-remembering-everything/retrieval_failure.html' | relative_url }}" frameborder='0' scrolling='no' height="680px" width="100%" style="border-radius: 14px; overflow: hidden; border: 1px solid #e1e4e8; display: block;"></iframe>
</div>
<div class="caption">
  <strong>Interactive Explorer: Lost in the Middle.</strong> This widget shows real predictions from Llama-3-8B on a single example. The model is asked to retrieve a specific update (about the Engineering sync) from the exact middle of $N$ distracting updates about other teams. With the <strong>Literal Match</strong> toggle, the question uses the exact word "Engineering", and the model keeps putting high probability on the correct answer. With the <strong>Semantic Match</strong> toggle, the question asks about the "Tech team" instead, removing the word overlap, and the probability of the correct answer drops quickly as the target gets buried.
</div>

## Proactive Interference: When Old Information Wins

To take search out of the equation, Wang and Sun <d-cite key="wang2025unable"></d-cite> place the target at the very end of the prompt and tell the model exactly what to look for. There is no middle to get lost in and nothing to locate. Yet the model still fails, and it fails more as more old, competing information comes before the target. This is no longer a problem of finding information. It is proactive interference.

### What PI and RI mean
<div class="callout-definition">
<strong>Proactive Interference (PI):</strong> the tendency of older information in context to disrupt the retrieval or selection of newer, conflicting information (stale values outcompeting current updates).
</div>

Its mirror image is:

<div class="callout-definition">
<strong>Retroactive Interference (RI):</strong> the tendency of newly acquired information in context to disrupt or overwrite the retention of older, previously established information.
</div>

In simple terms: suppose the context first says A maps to B, and later updates it to say A maps to C. PI is when the model still answers B. RI is when the model can no longer recall that A once mapped to B.

Wang and Sun's test is a long stream of key–value updates in which the same keys keep getting new values, and the model is asked for a key's *current* value. Accuracy falls log-linearly as the number of earlier, competing updates grows, across a wide range of models. The authors read this as a sign that an LLM's working-memory-like capacity is set by how well it resists interference, not by its advertised context window. Other findings:

- **Scale helps only modestly.** Larger models resist interference better in Wang and Sun's experiments, but a dual-process study of 39 models <d-cite key="chattaraj2026transformers"></d-cite> finds only a weak link between model size and PI resistance.
- **Instructions help little.** Telling the model to disregard older information gives minimal improvement, and chain-of-thought reasoning does not rescue retrieval under interference <d-cite key="wang2025unable"></d-cite>.
- **It is fragile.** In one study, 4-bit quantization sharply worsened PI performance, but only for *semantically* confusable distractors, while 8-bit barely changed it <d-cite key="shahrabi2026compress"></d-cite>. Standard accuracy benchmarks did not show this damage.

### PI and RI are different failures

The dual-process study <d-cite key="chattaraj2026transformers"></d-cite> compared the two directly. Across the models tested, PI was much more damaging than RI. RI accuracy stays near ceiling up to N=50 before falling to 24.6% at N=300, while PI collapses from 94% to 3%, a near-total failure. The study contrasts this with what it describes as the typical human pattern, although the human literature is itself mixed: classic work argued that PI is a major cause of everyday forgetting <d-cite key="underwood1957interference"></d-cite>. In the same study, resistance to RI improves with model size, so it may roughly reflect a model's capacity. RI also varies across architectures, while PI appears in all of them. That uniformity suggests a shared mechanism in how attention chooses among competing candidates.

The widget below is a single example chosen to illustrate proactive interference in Llama-3-8B-Instruct. We do not draw any quantitative claim from it.

<div class="l-body-outset">
  <iframe src="{{ 'assets/html/2027-04-30-remembering-everything/proactive_interference.html' | relative_url }}" frameborder='0' scrolling='no' height="680px" width="100%" style="border-radius: 14px; overflow: hidden; border: 1px solid #e1e4e8; display: block;"></iframe>
</div>
<div class="caption">
  <strong>Interactive Explorer: Proactive Interference.</strong> This widget shows real predictions from Llama-3-8B-Instruct, illustrating how the model fails to retrieve the correct answer when faced with conflicting older information.
</div>

## How Brains Resolve Interference

Proactive interference is not new. It is a well-known psychological phenomenon that also affects humans; the difference is how much. Wang and Sun <d-cite key="wang2025unable"></d-cite> compare the two directly, so we start there. In humans, recall gets worse at first as interference builds up, but then levels off and is barely affected even by large amounts of interfering information, as Wang and Sun note, citing Oberauer and Vockenberg <d-cite key="oberauer2009updating"></d-cite>. LLMs show no such plateau. This raises a natural question: what makes human brains more resistant to this interference? Understanding that may help us think about better ways to handle long context in LLMs.

Wang and Sun's error analysis gives some insight. The errors follow three stages. At first, the mistakes are values that came just before the correct one. Then values that appeared much earlier start creeping in, along with a small but growing share of hallucinations, meaning values that never appeared in the input at all. In the final stage, accuracy collapses: hallucinations dominate, and the remaining errors are anchored to the earliest updates, a bias toward earlier values also called "primacy bias".

Humans don't seem to fall apart like this, and we have the mechanisms of our brain to thank for it. Wang and Sun, drawing on Oberauer and Vockenberg, attribute the human plateau to the active unbinding of outdated associations before new information is stored. A closely related idea is gating, where outdated information is suppressed or discarded automatically as new items come in. Another mechanism is directed forgetting, where people intentionally discard certain information when explicitly told to do so <d-cite key="festini2014cognitive"></d-cite>. The steady decline in LLM accuracy suggests that LLMs have no such automatic gating, though this is Wang and Sun's inference from the shape of the curve and not a direct test. In their experiments, prompts like "forget all the previous updates to key" or "pay close attention to the following updates" gave only limited improvements, and the forget prompt even made errors cluster around the spot where it was inserted <d-cite key="wang2025unable"></d-cite>.

Another mechanism linked to resolving PI in the brain is episodic retrieval. Episodic memory is our ability to relive a specific experience from our own lives, and retrieving one comes with recovering the state of mind we were in at the time, a jump back in time <d-cite key="folkerts2018human"></d-cite>. So when we see something we have seen before, or something similar, it can bring back the old context with it. The trouble is that the old context can be the wrong one. Consider a Recent Probes task: a letter that was in the previous trial's set but isn't in the current one feels familiar, and this familiarity may bring back the previous trial's context, which then has to be rejected <d-cite key="nee2007neural"></d-cite>. Resolving interference is therefore described as choosing among the retrieved details. The left VLPFC, a region near the front of the brain, may be the region that selects the relevant details and decides among similar memories <d-cite key="nee2007neural"></d-cite>. LLMs may have something loosely like this. Wang and Sun speculate that self-attention acts as an implicit, resource-limited filter that works well under low interference but, unlike human prefrontal control, can't be strengthened or redirected on demand. That is their interpretation and not a tested mechanism.

Interference may also be handled earlier, while a memory is still being formed. In a study of rats learning to switch between spatial rules <d-cite key="guise2017medial"></d-cite>, the authors found that the medial prefrontal cortex changes how the hippocampus encodes memories, making similar memories easier to tell apart later and reducing proactive interference. This is rodent work, and how closely the rodent prefrontal cortex maps onto ours is still debated, so it is suggestive, not settled.

So, what does the brain do that LLMs don't? Going by the papers we've analyzed, quite possibly several things. Most of them are still being studied: the unbinding or gating of outdated information, a prefrontal region that selects among retrieved contexts, and a prefrontal–hippocampal system that may keep similar memories apart as they are stored. Brains do experience interference; they just have mechanisms for dealing with it. LLMs, as far as we can tell, mostly have attention. Interestingly, the one intervention that helped substantially in Wang and Sun's experiments was a prompt that made earlier updates look like a finished task. They read this as a hint that gating-like mechanisms could help, although accuracy still declined as updates grew. None of this shows that copying a brain mechanism would fix PI in transformers. What it does give us is a clearer picture of what might be missing.

Note that none of this is deletion. What the brain does is **graded** and **reversible**: old information stays available, and how much it influences us changes with the goal. That is a different target from deleting information, and it is the target we use when looking at current methods later. PI is the case where old and new compete for the same answer. The next section turns to a quieter relative: content that is true, available, and simply not what the task needs.

## Overcontextualization: When the Model Uses What It Shouldn't {#overcontextualization-when-the-model-uses-what-it-shouldn-t}

Suppose you ask an assistant to design the checkout for a small bakery website that gets about 10 orders a day. Asked on its own, Llama-3-8B-Instruct suggests a simple sequence: check the stock, charge the card through Stripe, then reduce the inventory count. Asked after a few turns about distributed microservices, it suggests four separate services, an event-driven orchestrator, and compensating rollback steps. The question is word for word the same, and it states the one fact that makes the simple answer correct. Only the earlier conversation is different. We call this overcontextualization.

<div class="callout-definition">
<strong>Overcontextualization:</strong> the tendency of a model to incorporate prior or surrounding context into its response when that context is uncalled-for, shifting the solution away from its proportional baseline. It is defined counterfactually: the response substantively diverges from what the model would have produced had the irrelevant context been absent.
</div>

The definition has two core criteria:
1. **Inapplicability:** The earlier context is either irrelevant by scope (e.g., enterprise distributed patterns applied to a 10-order/day bakery) or explicitly separated by the user (e.g., starting the next prompt with "New topic:").
2. **Substantive drift:** The presence of that context materially changes the recommendation, ranging from *gratuitous incorporation* (adding unprompted technical baggage) to *degradation* (proposing disproportionate or distorted solutions).

This is different from retrieval failure and proactive interference. Nothing here is hard to find, and nothing in the earlier turns contradicts the question. The earlier context is true, easy to access, and simply not wanted. The widget below shows conversations we recorded with Llama-3-8B-Instruct to illustrate that overcontextualization happens. We did not measure how often it happens or whether it generalizes to other models; studying and quantifying that is an interesting direction for future work. Three things are worth looking for in the widget. First, the isolated baseline is proportionate in every scenario. Second, the leakage appears after only two earlier turns (4 messages) and persists at four (8 messages). Third, a boundary marker does not reliably reset the model. In the robotics scenario, explicit markers restore a conventional answer, but in the bakery scenario with four earlier turns, even "New unrelated topic:" still yields a two-phase-commit design. Each cell is a single sample, so we read this as a pattern worth testing, not a result.

<div class="l-page">
  <iframe src="{{ 'assets/html/2027-04-30-remembering-everything/overcontextualization.html' | relative_url }}" frameborder="0" scrolling="off" height="930px" width="100%" style="border-radius: 14px; border: 1px solid #dfe3ea; display: block;"></iframe>
</div>
<div class="caption">
  <strong>Illustrating overcontextualization across context depth and boundary markers.</strong>
  Llama-3-8B-Instruct, greedy decoding, one reply per condition, cut at 450 new tokens. These are individual transcripts meant to show the behavior, not a measurement of how often it occurs. Yellow marks highlight terms carried over from the earlier discussion.
</div>

### What the literature measures

The closest existing work studies assistants with long-term memory and calls the problem *over-personalization*.

<div class="callout-definition">
<strong>Over-personalization:</strong> the intrusion of stored user profile memories or persistent preferences into unrelated tasks where they are unneeded, degrading task performance.
</div>

PersistBench <d-cite key="pulipaka2026persistbench"></d-cite> finds that memories from one area of a user's life leak into unrelated tasks, with a median failure rate of 53% across 18 models. OP-Bench <d-cite key="hu2026op"></d-cite> reports that adding memory lowers scores by 26% to 61% compared with using no memory. When the authors measured attention, they found that memory tokens receive more than twice as much attention (normalized by length) as the user's actual question. MemCalib <d-cite key="cao2026memcalib"></d-cite> finds that models over-use memory more often than they under-use it.

We use the broader term because nothing in the mechanism requires a memory store. A long chat history, a pasted document, or a block of instructions can play the same role. That generalization is our hypothesis, and the work above supports it only for the memory case. Whether the rate is similar for other kinds of context, and how it depends on how related the context is to the request, is an open question we would like to see measured. The central challenge for a future benchmark is deciding where the boundary lies: how do you decide a piece of context is irrelevant? A dietary restriction should shape a recipe, but not a spreadsheet.

One possible reason for this behavior is how these models are trained. During preference alignment, such as RLHF, models are rewarded for answers people prefer, and people often prefer answers that build on what they said earlier. This is our hypothesis, not a tested claim. Related work supports a version of it: Sharma et al. <d-cite key="sharma2024towards"></d-cite> find that RLHF-trained assistants are sycophantic, tailoring their answers to what the user seems to believe or want, and trace part of this to human preference judgments that favor such answers. Overcontextualization may be a cousin of sycophancy: the model tailors its answer to everything the user has said, whether or not it applies. Testing this, for example by training with contrastive pairs where earlier context should and should not be used, is a direction for future study.

## Where Current Methods Stand

Many methods improve how LLMs handle long context, but their evaluations rarely include anything like interference or overcontextualization. In this section we look at what these methods do and what they were tested on. We have not run them on PI or overcontextualization tests ourselves, so wherever we say a method might or might not help, read it as our reasoning, not a result.

### What we would want

The sections above show that the problem is not only that relevant tokens are out of reach. It is that outdated or unneeded tokens stay active in the window and pull the answer toward them. So the ability we are looking for is closer to *ignoring* than to forgetting:

<div class="callout-definition">
<strong>Active Ignoring:</strong> the ability of a model to lower, or switch off, the influence of tokens in its context for the current question, without deleting them, so they can still matter for a later question. Ideally, the model learns when to do this by itself.
</div>

Doesn't softmax attention already do this, by giving irrelevant tokens low weight? Partly, but with two limits. First, the weight comes from how *similar* a token looks to the current query ($\mathbf{q}_t^\top \mathbf{k}_i$), not from whether the token is still true or useful. A stale update looks almost identical to the current one, and an earlier discussion on a related topic looks similar to the new question. Second, softmax turns every score into a positive number, so every token in the window keeps some weight. Vasylenko et al. <d-cite key="vasylenko2026long"></d-cite> show that, under their assumptions, dense softmax attention spreads out as the context grows (its entropy grows as $\Theta(\log n)$), so more weight leaks onto tokens that don't matter. Models do find a partial workaround: attention sinks <d-cite key="xiao2024efficient"></d-cite> give the model a place to "park" attention it doesn't need. But a sink is a fixed dumping ground, not a decision that a *specific* token should stop mattering for *this* question. OP-Bench's finding above, that memory tokens get more than twice the attention of the question, fits this picture, though attention weights alone are not a full explanation of what a model does.

### Fixes that work around attention

Most methods used today don't change attention itself. They extend, reorder, compress, or filter the input, or they change the instructions.

#### 1. Longer context windows (RoPE and its extensions)
RoPE <d-cite key="su2024roformer"></d-cite> encodes each token's position by rotating its query and key vectors, and extension methods stretch these positions so a model trained on short inputs can read much longer ones. This is a big part of how context windows grew from thousands to millions of tokens. But position tells the model *where* a token is, not *whether* it is still true or relevant. Wang and Sun <d-cite key="wang2025unable"></d-cite> found that a model's resistance to interference was not significantly correlated with the length of its context window ($p = 0.886$). A bigger window gives more room to store, not a way to ignore. A theoretical and empirical study of context length <d-cite key="shi2026intrinsic"></d-cite> points the same way: it argues that, beyond some optimal length, more context can make a model's loss *worse* rather than better. Its experiments mask or vary the visible context, not add distractor passages, so it is a hint about long context in general, not a test of interference.

#### 2. Choosing what stays in the window (StreamingLLM, Attention Sorting)
StreamingLLM <d-cite key="xiao2024efficient"></d-cite> keeps the first few tokens (the attention sinks) plus a window of the most recent tokens, and drops everything in between. This lets a model run on very long streams without its output falling apart. Attention Sorting <d-cite key="peysakhovich2023attention"></d-cite> runs the model once, sees which documents get the most attention, and moves them to the end of the prompt, where models read best. Both were built for length and position problems. Neither looks at whether a token is outdated or off-topic. StreamingLLM keeps or drops tokens based only on their position, so an early but important fact (say, an allergy) can be dropped while a recent irrelevant message stays. Attention Sorting moves whatever already gets high attention, and a stale update that looks like the question would get high attention too. How either one affects PI or overcontextualization has not been tested.

#### 3. Cleaning the context before the model sees it (LLMLingua, RUMS)
LLMLingua <d-cite key="jiang2023llmlingua"></d-cite> uses a small language model to drop tokens that are easy to predict, so the main model gets a shorter prompt (see <d-cite key="li2025promptcompression"></d-cite> for a survey of compression methods). It was built to save cost while keeping task accuracy. A shorter context may help a little with every failure in this blog. But compression decides what to keep by how predictable a token is, not by whether it is current or needed: a stale value is no more predictable than a current one, and a shorter summary of a microservices discussion could still steer a bakery answer. Anything dropped is also gone for later questions.

RUMS <d-cite key="fisher2026response"></d-cite> chooses which stored user memories to give the model by asking which ones actually make the model more certain about its answer, rather than which ones look similar to the question. That is close in spirit to what we want, and it was evaluated on memory-based personalization, the setting closest to overcontextualization. It works on a list of separate memories, though. It is not designed for one long, continuous document where the relevant and irrelevant parts are mixed together.

#### 4. Prompting, partitioning, and post-training
The simplest fix is to ask. When Wang and Sun told models to forget earlier updates, it helped little, and errors began to cluster around the spot where the instruction was inserted <d-cite key="wang2025unable"></d-cite>. PersistBench <d-cite key="pulipaka2026persistbench"></d-cite> found a trade-off for memory: telling the model to be cautious cut leakage to near $0\%$, but the model then also stopped using memories that *were* useful, with that failure rising from $20\%$ to $97\%$. Structured Memory <d-cite key="hannoon2026mitigating"></d-cite> organizes memories by domain and reduces cross-domain leakage on PersistBench by $8.8\%\text{–}14.0\%$ without changing model weights, though most of the leakage remains. MemCalib <d-cite key="cao2026memcalib"></d-cite> uses reinforcement learning to teach a model when to use a memory and when to ignore it. These are the only methods in this section that were tested on overcontextualization-like failures, and all of them were tested in the memory setting only.

<div class="callout-insight">
<strong>What these have in common:</strong> all of these methods work on the input or around the model. None of them changes how attention decides what matters, so once a stale or unneeded token is inside the window, the model still weighs it in the usual way.
</div>

### Architectures that change attention

A second group of methods changes attention itself. We group them into four families.

#### 1. Attention that can give exact zeros (α-entmax, ASEntmax)
Softmax always gives every token some weight. $\alpha$-entmax <d-cite key="correia2019adaptively"></d-cite> replaces it with a function that can give tokens a weight of exactly zero, and ASEntmax <d-cite key="vasylenko2026long"></d-cite> adapts this so attention stays focused as inputs get longer; the authors report that models generalize to much longer inputs than they were trained on. A token set to zero for one query is still there for the next, so nothing is deleted. But the tokens that get zeroed are the ones with *low* scores. A stale update (`A → B`) scores about as high as the current one (`A → C`), and off-topic context that looks similar to the question may also score high. So it is unclear whether exact zeros help with the failures in this blog, and this has not been tested.

#### 2. Subtracting attention (Differential Transformer)
Differential Transformer <d-cite key="ye2025differential"></d-cite> computes two attention maps and subtracts one from the other, with a learned weight $\lambda$:

$$
\text{DiffAttn}(\mathbf{X}) = \left(\text{softmax}\!\left(\frac{\mathbf{Q}_1 \mathbf{K}_1^\top}{\sqrt{d}}\right) - \lambda \, \text{softmax}\!\left(\frac{\mathbf{Q}_2 \mathbf{K}_2^\top}{\sqrt{d}}\right)\right)\mathbf{V}
$$

The idea is similar to noise-cancelling headphones: attention that both maps spread over unimportant tokens cancels out, leaving sharper attention on what matters. The paper reports better retrieval from long context and fewer hallucinations. It was not tested on stale updates or on overcontextualization. Subtraction removes attention that is spread broadly, but a stale update that looks almost exactly like the current one may not count as "noise", so whether it helps with PI is an open question.

#### 3. Forget gates (Selective Attention, FoX, GLA)
These methods let the model lower the weight of earlier tokens as it reads. They are the closest any current design comes to the gating we saw in the brain section.

* **Selective Attention <d-cite key="leviathan2025selective"></d-cite>:** each token can "vote" to reduce attention to earlier tokens, and these votes add up over time. The paper motivates this with cases where a later token makes an earlier one unneeded, such as a variable being reassigned. Tokens that have been masked out can also be dropped from memory, which the paper reports cuts memory use by $16\times\text{–}47\times$.
* **Forgetting Transformer (FoX) <d-cite key="lin2025forgetting"></d-cite>:** adds a learned forget gate to standard softmax attention, so at each step the model can decide how much to fade out older tokens.
* **Gated Linear Attention (GLA) <d-cite key="yang2023gated"></d-cite>:** keeps a fixed-size memory $\mathbf{S}_t$ instead of every past token, and at each step learns how much of each part of that memory to keep and how much to overwrite:
  $$\mathbf{S}_t = \mathbf{G}_t \odot \mathbf{S}_{t-1} + \mathbf{k}_t^\top \mathbf{v}_t$$

These methods are designed to push down older information, so they are natural candidates for PI. To our knowledge, though, they were evaluated on language modeling and long-context benchmarks, not on PI tests like Wang and Sun's. There is also a trade-off. Once these gates fade or overwrite something, it is hard or impossible to bring back. If a user moves from coding to cooking and then returns to the code, information that was faded out is no longer fully available. FoX's gate also fades all earlier tokens in a head together, rather than one specific outdated fact.

#### 4. Separate short-term and long-term memory (Infini-attention, HMT)
Infini-attention <d-cite key="munkhdalai2024leave"></d-cite> keeps normal attention over a recent window and squeezes older content into a fixed-size memory. HMT <d-cite key="he2025hmt"></d-cite> organizes history into levels (recent tokens, summaries of segments, and a compressed memory) and pulls older segments back when they seem relevant. Both were built to handle very long inputs efficiently; Infini-attention, for example, reports passkey retrieval at up to 1M tokens. Moving old history behind a summary means it no longer competes directly with recent tokens, which could reduce some interference. But a fixed-size memory has to store many updates in the same space, so competing values may blur together. And HMT decides what to pull back by similarity, the same signal that off-topic context can exploit. As far as we know, neither has been tested on PI or overcontextualization.

### What has been tested

The table below summarizes what each method changes, what it was built for, and whether it has been evaluated on the failures in this blog. It is based on our reading of the original papers, not on new experiments, and we welcome corrections.

<div class="comparison-table l-page" markdown="block">

| Method | What it changes | Built for | Tested on PI | Tested on overcontext. | Ignored info can return |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RoPE extensions** | Stretches token positions | Longer inputs | No | No | n/a |
| **StreamingLLM** | Keeps first and recent tokens, drops the rest | Very long streams, efficiency | No | No | No (dropped) |
| **Attention Sorting** | Reorders documents by attention | Retrieval in long prompts | No | No | Yes |
| **LLMLingua** | Drops easy-to-predict tokens | Shorter, cheaper prompts | No | No | No (dropped) |
| **RUMS** | Picks memories that help the answer | Memory personalization | No | Memory only | Yes (per question) |
| **Prompting, Structured Memory, MemCalib** | Instructions, domain partitions, RL training | Memory over-use | Prompting only, helped little | Memory only | Yes |
| **α-entmax / ASEntmax** | Lets attention give exact zeros | Longer inputs | No | No | Yes (per query) |
| **Differential Transformer** | Subtracts two attention maps | Attention noise | No | No | Yes |
| **Selective Attention / FoX** | Forget gates on softmax attention | Language modeling, efficiency | No | No | Hard (fading builds up) |
| **GLA** | Gated fixed-size memory | Efficient language modeling | No | No | No (overwritten) |
| **Infini-attention / HMT** | Compressed long-term memory | Very long inputs | No | No | Partly |

</div>



## Summary

We looked at three ways a long context can hurt a model:

* **Retrieval failure.** The relevant information is in the prompt, but the model does not find it, often because of where it sits or because the question shares no words with it.
* **Proactive interference (PI).** Older information conflicts with newer information, and the old value wins even when the question asks only for the latest one. Larger models and instructions to forget help only a little.
* **Overcontextualization.** True but irrelevant earlier context leaks into an answer it should not influence, like microservices showing up in the design for a small bakery's checkout.

Most existing fixes were built for length and retrieval, and few have been tested on the other two. Methods that fade or overwrite old information as they read (Selective Attention, FoX, GLA) are aimed at the stale-update problem, but whatever they fade is hard to get back. Methods that filter at the moment of answering (exact-zero attention, Differential Transformer, RUMS) keep everything available, but they decide what matters mostly by similarity, which is exactly what stale updates and off-topic context share with the question. We did not find a method that does both: keep old information, and also stop it from steering the answer unless the question needs it. We do not know whether that combination can be built, or whether it would be enough. We encourage future work to examine how these methods behave under PI, and we suggest that new methods report PI and RI results alongside retrieval performance.

Even if we can build models that ignore context on a per-question basis, several counterarguments and open problems remain:

1. **When "irrelevant" context is secretly crucial.** As we noted in the introduction, the two kinds of mistake have very different costs. Over-engineering a bakery checkout with microservices is annoying. Suppressing a rarely mentioned note that a user is allergic to penicillin, or that a production database table is read-only, can be catastrophic. How do we tell unneeded baggage apart from a hidden safety constraint when neither is mentioned in the user's current prompt?

2. **Can test-time compute or agent scaffolding replace architectural changes?** Instead of redesigning attention, one could use an external controller, such as RUMS <d-cite key="fisher2026response"></d-cite> or an agent that routes sub-queries, to build a clean, minimal prompt for each turn. This works well for chat memories that come in separate pieces. It is harder when the input itself is large and can't be split, for example reasoning over a 100K-token codebase where old, deprecated functions sit next to active code, or analyzing a multi-year legal contract with amendments. In those settings, the model still has to read the whole thing and resolve interference internally.

3. **Benchmarking overcontextualization beyond personal memory.** OP-Bench <d-cite key="hu2026op"></d-cite>, PersistBench <d-cite key="pulipaka2026persistbench"></d-cite>, and MemCalib <d-cite key="cao2026memcalib"></d-cite> measure over-personalization in user-memory systems, but there is still no standard benchmark for **general overcontextualization**: how often earlier technical turns, pasted documents, or few-shot examples distort a model's answer, across different degrees of relatedness and with or without boundary markers.
