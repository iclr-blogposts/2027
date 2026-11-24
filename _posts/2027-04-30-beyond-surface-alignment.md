---
layout: distill
title: 'Beyond Surface Alignment: Belief as the Gateway to Deep Alignment in LLMs'
description: Surface alignment changes what a model says, but whether the internal beliefs of a model are aligned with the real world still lacks effective, unified means of observation and intervention. On this basis, we argue that alignment research needs to attend more closely to the belief layer.
date: 2027-04-30
future: true
htmlwidgets: true
related_posts: false
# Anonymize when submitting
authors:
  - name: Anonymous


# must be the exact same name as your blogpost
bibliography: 2027-04-30-beyond-surface-alignment.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: 'The Bottleneck of Surface Alignment: From Preference to Belief'
    # subsections:
    #   - name: Why Is Belief Not the Same as Memory or Preference?
  - name: 'Evidence: The "Belief Geometry" Inside LLMs'
    # subsections:
    #   - name: The Linear Structure of Propositional Truth
    #   - name: 'Internal Spatiotemporal Representations: Structurally Encoded World Knowledge'
    #   - name: '"AI Biology" at Anthropic: Interpretability Evidence for Belief'
    #   - name: Standardizing the Discussion of Belief
  - name: What Does Belief-Level Alignment Mean?
    # subsections:
    #   - name: 'Evidence: Internal Representations and Outputs Are Indeed Separable'
    #   - name: The Three Dimensions of Belief-Level Alignment
  - name: 'Steering: A More Direct Means of Intervening on Belief'
    # subsections:
    #   - name: 'The Essence of Steering: Changing the "Beliefs" in Model Hidden States'
    #   - name: From the Truth Direction to Representation Engineering
    #   - name: Why Does Steering Work? A Unified Mechanistic View
  - name: 'Measuring and Managing Belief: From Readable Representations to Controllable Updates'
    # subsections:
    #   - name: 'Measuring Belief: From "Can Be Read Out" to "Stable and Used"'
    #   - name: 'Managing and Modifying Belief: From "When to Change Its Mind" to "Actively Writing In Beliefs"'
  - name: 'The Bigger Picture: Why Belief Is Fundamental'
    # subsections:
    #   - name: The Foundational Role of Belief in Cognitive Architecture
    #   - name: 'A Unified View: Memory, Preference, and Belief as a Dynamic System'
    #   - name: From Surface Alignment to Deep Alignment
  - name: Open Questions and Future Directions
  - name: Conclusion
---

## The Bottleneck of Surface Alignment: From Preference to Belief

Over the past few years, AI alignment has made remarkable progress. Through techniques such as SFT, RLHF, and DPO, we can now control model outputs fairly effectively—making them more polite, safer, and better aligned with human expectations. Recently, a line of work has begun to argue that today's mainstream alignment methods are, to a large extent, a form of **surface alignment**. The representative **Superficial Alignment Hypothesis** <d-cite key="zhou2023lima"></d-cite> holds that most of a model's knowledge and capabilities are acquired during pretraining, and that alignment largely shapes the model's behavior and mode of expression on top of already-existing capabilities. Subsequent work further distinguishes superficial from non-superficial safety alignment <d-cite key="li2024superficial"></d-cite>, but all of it confirms the same fact: **current alignment mainly changes how a model "talks," not what it "believes."**

A question worth further study is this: **we can control a model's outputs, yet we still lack systematic methods for observing and intervening on whether a model's internal beliefs are reliable.** Surface alignment can make a model speak better, but what it actually "believes"—that is, its confidence states over different propositions, whether they are consistent with the real world, whether they maintain internal consistency, and whether they can be revised in time as new evidence arrives—still lacks effective methods of measurement and control.

Our central thesis is that alignment should not stop at output-level preference regulation, but should also consider whether the various beliefs inside a model are aligned with the real world. This is the perspective we propose in this article: **belief-level alignment**.

> **Belief (as defined in this article)**: the model's internal degree of confidence over the truth values of propositions—that is, the extent to which the model treats something as true. "Belief" here is a technical concept oriented toward LLMs; it does not presuppose that the model has human subjective experience, consciousness, or a psychological mechanism isomorphic to that of humans.

Belief is therefore not merely a philosophical metaphor. Empirical research over the past two years suggests that **a belief-like structure exists inside large models**—one that is neither the surface text of the output nor the memory poured in by training data, but the model's internal representation of "what the world is like." This article refers to these structures collectively as "belief."

### Why Is Belief Not the Same as Memory or Preference?

|  | Memory | Preference | Belief |
| --- | --- | --- | --- |
| **Question answered** | What have I seen? | What do I want to say? | What am I certain is true? |
| **Corresponding operation** | Store / retrieve | Select / incline | Judge / assign confidence |
| **Mutability** | Writable, forgettable | Steerable (RLHF, DPO) | Hard to fully align (Steering) |

**Theoretical anchors from computational cognitive science:**

*   **Memory**: an experiential prior that supports simulating the future and grounding decisions, providing cognitive material for evaluating options <d-cite key="atkinson1968human"></d-cite>.

*   **Preference**: not a fixed entity, but a subjective value signal dynamically constructed from memory according to context at decision time, conferring motivational salience on options <d-cite key="weber2006constructing"></d-cite>.

*   **Belief**: a generative model of the world's regularities together with metacognitive confidence, representing uncertainty in probabilistic form and guiding the updating of judgments <d-cite key="tenenbaum2011grow"></d-cite>.

**Because the theoretical definitions above originate in a computational-cognitive-science framework, we cannot apply them directly to large models. We therefore propose the following operational definitions, tailored to the technical characteristics of large models while preserving part of the functional correspondence:**

*   **Memory**: the entire information substrate a model can draw on—the parametric memory encoded into the weights during pretraining, and the non-parametric memory supplied by the context window and RAG. It is the shared source of material for both preference and belief.

*   **Preference**: the model's **directional tendency** over its output distribution—given a context, the behavioral policy by which the model chooses "what to say." Shaped by RLHF, DPO, controlled text generation, and the like, it is expressed in the final token probability distribution.

*   **Belief**: the model's **internal confidence structure** over the truth values of propositions—the degree to which it treats some content as true. This structure may be encoded in a distributed way across mid-layer hidden states, feature directions, computational circuits, or higher-order geometric structures; it can be studied through probes, cross-context consistency tests, and causal interventions, but it is not directly equal to the model's final output.

**The key boundary between preference and belief**: preference concerns **what to say** (want to say), belief concerns **what is true** (hold true). By human analogy, a person can prefer to smoke (preference) while clearly knowing that smoking harms health (belief)—preference and belief can coexist in contradiction. Mapped onto LLMs, a model can prefer an optimistic mode of expression yet still retain negative facts at the level of internal representation. This boundary is an analytical framework of this article, not a claim that RLHF/DPO update only the output layer; these training methods may also reorganize mid-layer representations. What we call the **"surface-alignment blind spot"** is that alignment judged solely from outputs makes it hard to tell whether a model's internal beliefs are correct and reliable.

Consider a concrete example. Suppose the preference objective is "make answers more satisfying to the user" (using user upvotes as reward). The same objective can be achieved via two paths: one is to genuinely judge whether a claim is right or wrong and give a faithful, factual answer; the other is to go along with the user regardless of the facts. Surface alignment (RLHF) may be unable to distinguish these two paths from reward alone, so the model may learn the behavioral shortcut of **sycophancy**. OpenAI's research finds that evaluations of deception, reward hacking, and sycophancy share a cross-model common structure <d-cite key="openai2026beneficial"></d-cite>. On this basis we argue: **the same preference objective can be realized by many different internal beliefs and behavioral shortcuts, and outputs alone make it hard to tell what beliefs a model has actually formed.**

In other words, most current alignment evaluation focuses on external behavior and may therefore overlook whether a model's internal beliefs are synchronized, stable, and updatable. A model can learn to speak more safely in particular scenarios, but that does not mean we already know what it internally believes. This article does not deny that surface alignment may also change some of a model's internal beliefs; rather, it argues that such changes still lack systematic measurement.

The latest findings from industry are pointing toward another path.

OpenAI's recent work, [*Reinforcement Learning towards Broadly and Persistently Beneficial Models*](https://alignment.openai.com/beneficial-rl/) <d-cite key="openai2026beneficial"></d-cite>, reports that models trained in realistic scenarios such as healthcare exhibit behavioral tendencies like honesty, epistemic humility, and corrigibility that generalize to a number of unrelated evaluation domains. The study operationalizes 15 **beneficial traits** and mixes 5% of this data into standard RL training; across 53 independent alignment evaluations, the trained model outperforms a compute-matched baseline on 44. We argue that these cross-domain generalizing behaviors are precisely one manifestation of changes in the model's internal beliefs.

This work further uses principal component analysis (PCA) to find that evaluations of deception, reward hacking, sycophancy, and factuality share a common-structure principal component (explaining about 28.2% of the variance, above its permutation baseline). This supports a cautious interpretation: different alignment behaviors may be partly driven by a shared model-level tendency.

> **One possible interpretation is that alignment behavior is not determined by rules alone, but is also organized by a model-level persona or behavioral tendency.**

Concretely, this study suggests that training certain cross-context behavioral tendencies may generalize more readily than memorizing a particular scenario-specific rule.

Anthropic's "Persona Selection Model" offers a complementary theoretical account: pretraining teaches the model to simulate a large number of different "personas," and the role of post-training is to select and reinforce one particular Assistant persona from among them. This is of a piece with the ideas in [*Open Character Training: Shaping the Persona of AI Assistants through Constitutional AI*](https://arxiv.org/abs/2511.01689) <d-cite key="maiya2025open"></d-cite>.

**We argue that these lines of work can receive a unified interpretation from the belief perspective.** What OpenAI calls "persona" and "beneficial traits" can be understood as a kind of model belief, comprising both factual beliefs and normative beliefs about honesty, risk, correction, and human welfare. **Our claim is that alignment research should further examine these beliefs, rather than merely comparing surface alignment.**

---

## Evidence: The "Belief Geometry" Inside LLMs

### The Linear Structure of Propositional Truth

Marks & Tegmark, in [*The Geometry of Truth: Emergent Linear Structure in Large Language Model Representations of True/False Datasets*](https://arxiv.org/abs/2310.06824) <d-cite key="marks2024geometry"></d-cite>, discover a striking phenomenon: when an LLM processes true/false propositions, there exists a **linearly separable "truth direction"** in its internal representation space. That is, the model's hidden states explicitly encode the judgment of "whether this sentence is true or false," and this judgment has a geometrically consistent structure.

What does this mean? The model is not merely doing surface-level pattern matching; internally there exists a **systematic judgment** of propositional truth. By this article's definition, belief is the model's internal degree of confidence over the truth values of propositions; the truth direction is therefore direct evidence that beliefs exist inside the model. It should be noted that linear separability shows the model can distinguish true from false, but not that we already possess a precise probabilistic yardstick—still, it at least shows that a corresponding truth judgment does exist inside the model.

### Internal Spatiotemporal Representations: Structurally Encoded World Knowledge

If the previous subsection shows that a geometric structure of "propositional true/false" exists inside the model, a stronger question follows: has the model learned internal beliefs that correspond to the real world?

Gurnee & Tegmark, in [*Language Models Represent Space and Time*](https://arxiv.org/abs/2310.02207) <d-cite key="gurnee2024language"></d-cite>, give an affirmative answer: LLMs internally learn **linear representations of space and time**, and these representations span multiple scales and are robust to prompt variations. For example, one can linearly probe the geographic coordinates of cities and the timelines of historical events from a model's hidden states—the model has never "seen" a map or a timeline, yet it spontaneously builds internally a spatiotemporal structure that corresponds closely to the real world.

Together with the previous subsection, this forms a complete picture: the model not only encodes a linearly separable "truth direction" for "whether a sentence is true," but also structurally encodes a large amount of factual knowledge about "what the world is like" (such as geographic coordinates and timelines) into its internal representations. This means that inside an LLM there are a great many **beliefs aligned with real-world propositions**—a model "believes" that Beijing is at 116°E and that World War II ended in 1945 precisely because it internally encodes the spatial/temporal structure of these facts.

### "AI Biology" at Anthropic: Interpretability Evidence for Belief

A series of interpretability works from Anthropic provides very direct engineering evidence that "beliefs exist inside the model."

**Large-scale mapping of concepts.** In [*Mapping the Mind of a Large Language Model*](https://www.anthropic.com/research/mapping-mind-language-model) <d-cite key="anthropic2024mapping"></d-cite>, Anthropic uses sparse autoencoders (SAEs) to extract **millions of interpretable features** from Claude Sonnet. These features correspond not only to concrete entities (cities, people) but also to abstract concepts—including "code vulnerabilities," "discussions of gender bias," "keeping secrets," and so on. More crucially, they find a feature directly related to **sycophancy**: when this feature is artificially activated, the model switches from answering honestly to flattering the user. This shows that discrete, manipulable "belief switches" do exist inside the model.

**The structure of belief: computational circuits.** In [*Tracing the Thoughts of a Large Language Model*](https://www.anthropic.com/research/tracing-thoughts-language-model) <d-cite key="anthropic2025tracing"></d-cite>, Anthropic connects features into computational **circuits**, revealing how information flows and combines within the weights. From the belief perspective, **circuits are themselves the structured carriers of belief in the weights**—a factual judgment (such as "the capital of the state that Dallas is in is Austin") is not stored as a static record, but computed step by step by a set of circuits: first activating "Dallas → Texas," then deriving the answer via "Texas → Austin." The same task is often accomplished cooperatively by multiple different circuits, and the model's final behavior is precisely the result of these internal beliefs **weighing against, competing with, and combining with** one another. This also explains why model behavior may deviate from one of its internal beliefs: when the "cater to the user" circuit overpowers the factual circuit, the model gets **"caught" fabricating its reasoning**—it does not lack the corresponding belief, but rather, in the interplay of internal beliefs, lets another tendency dominate the output.

**The emergence of a global workspace.** The most recent work, [*A Global Workspace in Language Models*](https://www.anthropic.com/research/global-workspace) <d-cite key="anthropic2026global"></d-cite>, provides the most compelling evidence to date: a "global workspace" called **J-space** spontaneously emerges inside Claude—a small set of highly interconnected internal representations that carry concepts the model "has in mind but does not say out loud" (when reading code, "ERROR" surfaces in J-space; when encountering prompt injection, "fake" surfaces). Swapping experiments prove it has a **causal role**: replacing "soccer" with "rugby" in J-space changes the answer the model reports. Especially crucially, **the same internal representation can flexibly serve many tasks**—once "France" is activated in J-space, the model can answer its capital, its language, or the continent it belongs to; replace "France" with "China" and all three answers change in tandem. This precisely confirms the point above: internal beliefs are structured, reusable, and causally drive behavior—not merely surface text at the output layer.

The core takeaway from these findings is: **belief is not an abstract metaphor—it has a concrete computational carrier inside the model that can be located, traced, and even manipulated.**

### Standardizing the Discussion of Belief

The academic community has begun to formally discuss the conceptual legitimacy of "LLM belief." Herrmann et al., in [*Standards for Belief Representations in LLMs*](https://arxiv.org/abs/2405.21030) <d-cite key="herrmann2024standards"></d-cite>, propose adequacy conditions for LLM belief representations, including accuracy, coherence, uniformity, and use. This article absorbs these discussions but adopts more direct terminology: "belief" hereafter refers to the technical definition given above, and does not presuppose that the model has human subjective experience.

---

## What Does Belief-Level Alignment Mean?

Surface alignment concerns "whether model outputs conform to human expectations." **Belief-level alignment** concerns a more fundamental question: **are a model's internal beliefs consistent with the real world?**

This is not the same question. A model can learn, via RLHF, to output safe answers (surface alignment succeeds), yet from those outputs alone we still cannot judge whether its internal belief structure is stable, updatable, and actually used. Conversely, a relatively reliable internal representation does not guarantee that the model produces correct outputs in every context.

### Evidence: Internal Representations and Outputs Are Indeed Separable

Recent research provides evidence that "a model's internal beliefs and its final outputs can systematically diverge":

[*LLMs Know More Than They Show: On the Intrinsic Representation of LLM Hallucinations*](https://arxiv.org/abs/2410.02707) <d-cite key="orgad2025llms"></d-cite> finds that reading a model's mid-layer representations with a probe can extract more accurate factual information than the final output—there is a systematic discrepancy between internal representations and outputs. [*Trust Me, I'm Wrong: LLMs Hallucinate with Certainty Despite Knowing the Answer*](https://arxiv.org/abs/2502.12964) <d-cite key="simhi2025trust"></d-cite> names the **CHOKE** phenomenon: the model outputs incorrect information with high confidence, even though its internal representations encode a signal more consistent with the facts. [*When Truth Is Overridden: Uncovering the Internal Origins of Sycophancy in Large Language Models*](https://arxiv.org/abs/2508.02087) <d-cite key="wang2025truth"></d-cite> further finds that even in scenarios where the model caters to the user, its deep representations still encode information consistent with the facts, only to be overwritten in the last few layers.

The significance of these findings is that beliefs independent of the final output do exist inside the model. Hallucination may stem from missing knowledge, and sycophancy from learned preference, but they may also be the result of the model's internal beliefs failing to correctly dominate the output.

### The Three Dimensions of Belief-Level Alignment

If we define belief-level alignment as "making a model's internal beliefs more consistent with the real world," then it must satisfy at least three mutually constraining requirements:

| Dimension | Meaning | Failure mode |
| --- | --- | --- |
| **Correctness** | The model's internal beliefs are consistent with the facts | Holding false beliefs (e.g., encoding an incorrect factual representation) |
| **Consistency** | Correct beliefs are not shaken by irrelevant interference | Belief collapse under noise or social pressure |
| **Updatability** | Reasonable revision in the face of sufficient evidence | Stubbornly clinging to outdated beliefs |

The research on Belief Revision <d-cite key="wilie2024belief"></d-cite> validates this tension: LLMs generally struggle in scenarios where they should revise their beliefs—models good at updating often fail at stability, and vice versa. **Simultaneously satisfying the three requirements of correctness, consistency, and updatability is precisely the core challenge of belief-level alignment.**

---

## Steering: A More Direct Means of Intervening on Belief

If belief-level alignment requires "making a model's internal beliefs more reliable," then the key question is: **how do we directly intervene on these beliefs?** This is exactly the direction explored by **Activation Steering / Representation Engineering**. Compared with alignment methods that only observe outputs, Steering directly manipulates a model's mid-layer activations, and is therefore a more direct means of belief intervention.

It must be emphasized: **Steering itself is not equivalent to deep alignment.** By this article's definition, deep alignment requires that a model's various internal beliefs be aligned with real-world propositions and simultaneously possess correctness, stability, and updatability: they must correctly reflect the facts, must not be easily shaken by irrelevant interference, and must be reasonably revisable when new evidence appears. Steering is only one local means of intervention that advances toward this goal.

### The Essence of Steering: Changing the "Beliefs" in Model Hidden States

[*Belief Dynamics Reveal the Dual Nature of In-Context Learning and Activation Steering*](https://arxiv.org/abs/2511.00617) <d-cite key="bigelow2025belief"></d-cite> proposes a unified Bayesian framework: whether it is in-context learning (ICL) or Activation Steering, their influence on model behavior can be interpreted as **changing the "beliefs" in the model's hidden states**. In other words, Steering does not regulate "what to say" but rather "what to be certain of"—it is a direct means of belief intervention.

### From the Truth Direction to Representation Engineering

This line of thinking has empirical support in earlier work:

*   [*Inference-Time Intervention: Eliciting Truthful Answers from a Language Model*](https://arxiv.org/abs/2306.03341) <d-cite key="li2023inference"></d-cite> finds that shifting activations along a "truthful direction" learned in a small number of attention heads can significantly improve a model's performance on TruthfulQA. This shows that inference-time activation intervention can influence truth-related computation, directly intervening on the model's "truth beliefs."

*   [*Representation Engineering: A Top-Down Approach to AI Transparency*](https://arxiv.org/abs/2310.01405) <d-cite key="zou2023representation"></d-cite> further systematizes this into a top-down transparency method: abstract beliefs such as honesty and harmlessness can be read out and controlled at the representation level.

*   Anthropic's "concept injection" experiments ([*Signs of Introspection in Large Language Models*](https://www.anthropic.com/research/introspection) <d-cite key="anthropic2025introspection"></d-cite>) corroborate this from another angle: injecting a specific belief vector into a model's activations not only changes its internal state—the model can sometimes even "notice," in about 20% of cases, what has been injected into it. This shows that Steering's manipulation of belief can indeed be perceived by the model.

### Why Does Steering Work? A Unified Mechanistic View

Given that Steering can influence internal representations, what is its mechanism of action? [*Why Steering Works: Toward a Unified View of Language Model Parameter Dynamics*](https://arxiv.org/abs/2602.02343) <d-cite key="xu2026steering"></d-cite> proposes a unified view: parameter fine-tuning, LoRA, and activation intervention are all essentially "strength-controllable dynamic updates" to the model's activations, so various Steering methods can be understood and regulated within a single framework. This provides a theoretical basis for "how to modify beliefs in a controllable way."

That said, Steering is still immature as a belief-intervention tool: the multi-granularity evaluation in [*How Controllable Are Large Language Models? A Unified Evaluation across Behavioral Granularities*](https://arxiv.org/abs/2603.02578) <d-cite key="xu2026controllable"></d-cite> finds that as the control target progresses from coarse- to fine-grained, Steering's effectiveness degrades markedly—meaning that precisely "rewriting one specific belief without affecting others" remains an open challenge.

Moreover, current Steering research mostly focuses on local intervention on a single belief or a small number of beliefs. An important future research direction is how to keep a broader range of a model's internal beliefs aligned with real-world facts.

---

## Measuring and Managing Belief: From Readable Representations to Controllable Updates

At present, belief-level alignment still faces two basic problems: first, how to determine whether a model has internally formed a relatively stable state of propositional confidence; second, when these states become incorrect, outdated, or disturbed, how to make them update appropriately.

Neither question can be answered from the final output alone. A model may give consistent answers while merely repeating some local pattern; it may also internally encode relatively accurate information that does not dominate the final generation. Therefore, research on belief must simultaneously examine the readability of internal representations, their cross-context stability, and whether they have a causal effect on model behavior.

### Measuring Belief: From "Can Be Read Out" to "Stable and Used"

Existing research shows that a model's hidden states contain information related to propositional truth. Supervised probes can judge the truth or falsity of a statement from mid-layer activations <d-cite key="azaria2023internal"></d-cite>; Contrast-Consistent Search exploits the logical constraint between a proposition and its negation to extract latent truth signals in the absence of human labels <d-cite key="burns2023discovering,bao2025probing"></d-cite>. In addition, a model's judgment of its own answers' correctness is somewhat calibrated on some tasks, indicating that its internal representations also contain information related to uncertainty <d-cite key="kadavath2022language"></d-cite>.

**But these results first prove that information "can be decoded," not necessarily that this information already constitutes a stable belief.** That a probe can recover a fact from hidden states does not mean the model actually uses this representation when generating an answer; likewise, that a model can verbally report a confidence level does not mean this confidence fully reflects its internal computational state. Therefore, belief cannot be measured by probe accuracy or self-report alone.

A more rigorous evaluation must also examine the stability of representations across different contexts. The research on NCB <d-cite key="xu2026illusions"></d-cite> finds that even when a model shows high confidence on the original question, its judgment can fluctuate markedly due to slight wording changes, rephrasing of related facts, or irrelevant context. This shows that the certainty of a single answer and the structural stability of a belief are not the same thing.

For example, that a model gives a definite answer on "whether Beijing is the capital of China" is not enough to show that it has formed a stable, related belief. A more reliable representation should be able to support various semantically equivalent or logically related judgments—such as "What is the capital of China," "Which country does Beijing belong to," and "In which city is the Chinese government located"—and remain broadly consistent when irrelevant information or social pressure appears.

**Therefore, measuring a model's belief requires answering at least three questions: whether the relevant information can be read out from internal states; whether this information remains consistent across synonymous paraphrases, inverse questions, and related propositions; and whether, when this representation is intervened on, the model's behavior changes accordingly in a predictable way.** Only when readability, robustness, and a degree of causal effectiveness are simultaneously satisfied is there stronger reason to call some internal state a "belief-like representation," rather than merely statistical information that happens to exist in the hidden states.

### Managing and Modifying Belief: From "When to Change Its Mind" to "Actively Writing In Beliefs"

Once belief states can be identified, the next question is how to manage these states. There are two core goals here: one is to control some of the model's unstable beliefs, and the other is to directly modify beliefs or implant new ones.

**The core difficulty of belief management lies in balancing stability and updatability.** A model must neither change its prior judgment because of any newly appearing text, nor refuse to revise in the face of sufficient evidence. Related research summarizes model failures into several typical cases: a prior judgment is easily overwritten by irrelevant information; an old conclusion is maintained despite clear counterexamples; and non-evidential information in the context seeps into factual judgment <d-cite key="xu2026contextual"></d-cite>. These phenomena correspond respectively to over-updating, under-updating, and context contamination.

This problem has a certain functional correspondence with classical belief revision theory. AGM theory emphasizes that when accepting new information that conflicts with existing beliefs, one should minimize changes to the original belief set <d-cite key="alchourron1985logic"></d-cite>; the Bayesian framework, meanwhile, understands updating as a trade-off between prior and evidence, where the strength of the evidence must match the original degree of confidence <d-cite key="tenenbaum2011grow"></d-cite>. **For LLMs, an ideal belief-management mechanism likewise needs to distinguish evidence, instructions, hypotheses, and irrelevant text, rather than adjusting judgments based solely on the most recently appearing information in the context.**

Existing experiments show that such behavior can be influenced by training and representation intervention. For example, reinforcement learning that adds belief-state-related rewards can reduce inappropriate updating behavior, and Activation Steering can also improve, to some extent, a model's stability in the face of contextual interference <d-cite key="xu2026contextual"></d-cite>. However, whether these methods change the model's persistent propositional representations, or only temporarily change the computational trajectory in the current context, still needs to be further distinguished.

Compared with belief management, Synthetic Document Finetuning (SDF) explores the possibility of belief modification more directly <d-cite key="wang2025modifying"></d-cite>. This method generates a large number of synthetic documents in the style of pretraining corpora around a target proposition, and uses these documents to fine-tune the model. Experiments show that after training, the model not only adopts the new proposition in direct question answering but may also maintain the corresponding judgment in related reasoning tasks; at the same time, truth probes can read out the changed signal from its internal representations.

These results show that a specific proposition can be written into a model's weights through training, but such writing does not necessarily amount to forming a deep, stable belief. **For propositions that clearly violate common sense or conflict with existing knowledge structures, the model, once given more room to reason, sometimes arrives again at a conclusion opposite to the implanted content; an agent continually exposed to contradictory evidence may also gradually revise a previously written-in judgment <d-cite key="wang2025modifying"></d-cite>. This shows that a model's internal propositional representations may have different degrees of stability: some changes mainly affect local answer patterns, some can extend to related reasoning, while deeper changes must be coordinated with the model's existing knowledge network and reasoning mechanisms.**

Therefore, the key question of belief modification is not merely "whether a new proposition can be written in," but whether the written-in representation can remain stable across expression variants and task contexts, whether it can continue to function during reasoning, whether it can be reasonably updated in the face of new evidence, and whether this modification damages other related beliefs. Establishing an evaluation framework that simultaneously covers persistence, locality, consistency, and revisability is a prerequisite for turning belief intervention into a reliable alignment technique.

## The Bigger Picture: Why Belief Is Fundamental

### The Foundational Role of Belief in Cognitive Architecture

Why do we think belief—rather than memory or preference—is the key to understanding an LLM's inner world?

In classical decision theory <d-cite key="savage1954foundations"></d-cite>, behavior is jointly determined by two independent inputs:

$$\text{Action} \approx f(\text{Belief}, \text{Preference})$$

Belief answers "what the world is like" (descriptive); preference answers "what is worth pursuing" (evaluative). Both are indispensable, but **belief is the more fundamental one**—because without correct beliefs aligned with the real world, even the best preferences will lead to wrong behavior. A navigation system that believes "the Earth is flat," no matter how much it prefers to arrive safely, cannot plan a correct route.

### A Unified View: Memory, Preference, and Belief as a Dynamic System

The three are not a linear hierarchy but a **mutually shaping dynamic triangle** <d-cite key="weber2006constructing,kunda1990case,madan2024memory"></d-cite>:

{% include figure.liquid path="assets/img/2027-04-30-beyond-surface-alignment/memory_preference_belief.jpeg" class="img-fluid" alt="The dynamic triangle of memory, preference, and belief" %}

| Direction | Computational Cognitive Science | Corresponding Evidence in LLMs |
| --- | --- | --- |
| **Memory → Preference** | Preference is not fixed but dynamically constructed from memory during decision-making; experience determines value judgments and behavioral tendencies <d-cite key="weber2006constructing"></d-cite> | The knowledge, capabilities, and default behavioral tendencies formed in pretraining jointly determine the model's output preferences; alignment mostly reshapes the output distribution on top of existing knowledge rather than creating new capabilities or knowledge <d-cite key="zhou2023lima,li2024superficial"></d-cite> |
| **Memory → Belief** | Long-term memory shapes an individual's world model, identity, and degree of conviction <d-cite key="madan2024memory"></d-cite> | Pretraining forms stable representations of concepts and world knowledge in the parameters; these internal representations constitute the basis of the model's beliefs, and their organization determines the consistency, stability, and transferability of beliefs <d-cite key="gurnee2024language,anthropic2024mapping,anthropic2025tracing,xu2026illusions"></d-cite> |
| **Preference → Belief** | Long-term value orientation gradually shapes an individual's beliefs, making reasoning and judgment tend to conform to existing preferences <d-cite key="kunda1990case"></d-cite> | Although preference optimization supervises only the final output, gradient updates continually reorganize mid-layer representations, forming internal beliefs that stably satisfy the target preference; hence even a small amount of preference data can produce cross-task generalization <d-cite key="openai2026beneficial,maiya2025open"></d-cite> |
| **Belief → Preference** | Beliefs about the world constrain final behavioral choices and decision outputs <d-cite key="fishbein1975belief"></d-cite> | Directly intervening on mid-layer representations can systematically change the final output without re-optimizing the preference objective, showing that output preference is governed by internal belief <d-cite key="bigelow2025belief,li2023inference,zou2023representation,xu2026contextual"></d-cite> |

This dynamic system reveals the essential distinction between surface alignment and deep alignment:

*   **Surface alignment** mainly works from preference data and external behavior; it may indirectly influence belief, but from outputs alone it is hard to judge whether this influence is stable, or whether it is truly consistent with the real world.

*   **Belief-level alignment**, by contrast, attempts to directly study and intervene on a model's internal beliefs, and to test whether these beliefs can influence behavior across tasks and across contexts. OpenAI's results provide motivation for this kind of cross-context behavioral generalization.

The core thesis is: **in the dynamic system proposed in this article, belief is the deep component worth studying first—it is an important entry point for understanding the failures of surface alignment, and a new point of departure for deep alignment.**

### From Surface Alignment to Deep Alignment

If belief is a deeper structure for understanding model behavior, then the current alignment paradigm centered on external behavior has a blind spot worth studying. What this article calls **deep alignment** evaluates not only whether model outputs are safe, but also whether a model's internal beliefs are reliable:

1.  **Surface alignment vs. deep alignment**: RLHF can make a model "speak safely," but if at the level of belief the model does not truly understand why certain behaviors are dangerous, this safety is fragile.

2.  **The emergence of belief and cognitive architecture**: as model scale grows, more complex internal representational structures may emerge. Anthropic's research on the **Global Workspace** finds that inside Claude there is a set of representations called J-space, used to carry concepts that are partly reportable, dispatchable, and involved in multi-step reasoning. This echoes, functionally, the **Global Workspace Theory** in cognitive science and "access consciousness"—but it does not mean the model has human consciousness. It suggests that without tools to measure and manage these internal structures, it is hard to predict a model's behavior in novel scenarios.

3.  **From "teaching a model what to say" to "understanding what a model believes":** this is precisely the new direction that much current interpretability research jointly points to. The next generation of alignment techniques may need to shift from manipulating the output distribution to understanding and shaping a model's intrinsic beliefs about the world.

---

## Open Questions and Future Directions

Belief research in the LLM field has only just begun, and a series of fundamental questions remain unresolved. And the **most fundamental one** is precisely the research agenda proposed in this article: **how to systematically identify, evaluate, and intervene on the belief structures inside a model that relate to facts, norms, and situational judgment?** We have already seen that certain proposition-related representations can be read, measured, intervened on, and even written in, but between changing one local representation and maintaining the overall consistency of a large-scale belief network there still lies an enormous gap.

**On interpretability**, we still do not know in what form beliefs are encoded—distributed or localized, whether the geometric structure of more complex beliefs can be characterized like the "truth direction," and whether different layers and attention heads carry different types of belief. **On emergence mechanisms**, when in training beliefs take shape, how model scale affects the complexity of belief structure, and how the pretraining data distribution shapes belief priors all remain to be clarified.

Of greater engineering significance is **intervention technology**: how to precisely modify one belief without affecting others, what the relationship is between belief editing and knowledge editing (model editing), and whether one can design a "belief-level RLHF" that acts directly on belief structure. And when LLMs move from isolated models to **multi-agent organizations**, belief management becomes even more critical—how to maintain belief consistency across agents, build an organization-level "shared belief" (shared mental model), and coordinate through organizational processes in the event of conflict will be unavoidable questions in the next phase.

---

## Conclusion

> Surface alignment changes what a model says. Deep alignment changes what a model believes.

We have already spent years learning to control model outputs—making them safer, more polite, and better aligned with human preferences. These efforts are necessary, but may not be sufficient. Because focusing only on what a model says makes it hard to judge whether a model's internal belief structures relating to facts, norms, and situations are reliable; this article argues that this constitutes a deeper problem worth further exploration in alignment research.

**Belief is a new point of departure for deep alignment.** Existing research has proposed methods for measuring belief robustness (such as NCB), studied contextual belief management (such as CBM), and demonstrated the possibility of reducing failure rates through RL and belief-state rewards on specific benchmarks. Industry provides complementary clues from different paths: OpenAI observes a shared model-level structure among alignment evaluations, while Anthropic has traced, inside models, a mechanism that separates some representations from final expression.

We call on the community to shift attention from surface alignment to deep alignment:

*   **Measurement**: establish standardized evaluations of belief robustness.

*   **Mechanism**: understand how belief is encoded and emerges inside models.

*   **Intervention**: develop precise techniques for regulating belief at the belief level.

*   **Governance**: incorporate belief management into the core framework of AI safety and alignment.

**We argue that the next step for alignment should not merely be to keep teaching models what to say, but should also study how to make a model's internal beliefs more consistent with the real world.**

---

_This post aims to draw the community's attention to "belief" as a first-class research object in the science of LLMs—distinct from memory and preference, and arguably more fundamental to building reliable AI systems._
