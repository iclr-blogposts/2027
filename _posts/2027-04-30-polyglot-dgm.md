---
layout: distill
title: "What Are We Actually Evolving? Four Flaws in Darwin Gödel Machine’s Polyglot Environment"
description: Self-evolving coding agents such as Darwin Gödel Machine (DGM) use their scores on a coding benchmark to guide changes to their own harnesses, such as their tools and workflows. We find four flaws in DGM’s adaptation of Aider’s Polyglot benchmark that make these scores an unreliable signal of which harness changes improve a coding agent. Later systems such as Huxley-Gödel Machine reuse the same evaluation setup and inherit these flaws. In this misconfigured Polyglot environment, agents can access hidden tests and solutions, task contracts and supporting files are missing, and most Java tests are skipped. Repairing the environment shifts the score of the same gpt-5.4-mini agent by up to 12 percentage points. This sensitivity to the evaluation setup warrants revisiting DGM’s reported gains on Polyglot, and it shows that a correct environment is a precondition for reliable self-evolving systems.
date: 2027-04-30
future: true
htmlwidgets: true
hidden: true

# Mermaid diagrams
mermaid:
  enabled: true
  zoomable: true

# Anonymize when submitting
authors:
  - name: Anonymous

# must be the exact same name as your blogpost
bibliography: 2027-04-30-polyglot-dgm.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Introduction
  - name: An Overview of DGM
  - name: Anatomy of a Stuck Task
  - name: Four Evaluation Flaws
    subsections:
      - name: Hidden Test and Answer Leakage
      - name: Missing Task Contracts
      - name: Missing Supporting Files
      - name: Tests That Never Run
  - name: A Repaired Polyglot Environment
  - name: Reflections

# Below is an example of injecting additional post-specific styles.
# This is used in the 'Layouts' section of this post.
# If you use this post as a template, delete this _styles block.
_styles: >
  .fake-img {
    background: #bbb;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 0px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 12px;
  }
  .hl {
    background: rgba(255, 212, 0, 0.35);
    padding: 0 .15em;
    border-radius: 2px;
  }
  .fake-img p {
    font-family: monospace;
    color: white;
    text-align: left;
    margin: 12px 0;
    text-align: center;
    font-size: 16px;
  }
---

## Introduction
Darwin Gödel Machine (DGM) <d-cite key="zhang2026darwin"></d-cite> is a self-evolving coding agent that builds on the idea of Gödel Machines <d-cite key="schmidhuber2007godel"></d-cite>. It iteratively refines its own harness by analyzing its failures on a curriculum of coding tasks drawn from [Aider's Polyglot](https://github.com/Aider-AI/polyglot-benchmark/tree/main) benchmark <d-cite key="gauthier2024polyglot"></d-cite>. This blog shows that DGM's Polyglot environment is flawed and investigates how those flaws prevent benchmark scores from reliably reflecting the agents' coding ability. We focus on DGM because later methods, such as Huxley-Gödel Machine and Hyperagents <d-cite key="wang2026huxleygodel,zhang2026hyperagents,weng2026groupevolving,liu2026mendel"></d-cite>, reuse its evaluation code and inherit the same flaws.

We use the following terms throughout this post:
1. **Aider's Polyglot:** A coding benchmark spanning six programming languages, built from exercises on [Exercism](https://exercism.org). Performance is measured by the resolved rate: the proportion of tasks whose solutions pass the hidden tests.
2. **DGM's Polyglot:** We use this to specifically refer to DGM's testing adaptation of Aider's Polyglot. The tasks are the same as Aider's, but the evaluation setup has flaws.
3. **Hidden tests:** The test files a task is graded with. The solver agent is not meant to see them.
4. **Task contract:** The interface the hidden tests expect of a solution, such as function names and signatures, return shapes, and exact error messages.
5. **Solver agent:** A coding agent made of an LLM combined with a harness (its prompts, tools, memory, and workflows).
6. **Meta-agent:** An LLM-based component that analyzes execution traces and proposes changes to the solver agent's harness.
7. **Curriculum:** A subset of Polyglot tasks used repeatedly to evaluate candidate agents and guide self-improvement.

## An Overview of DGM
DGM’s self-evolving process begins with a basic initial solver agent. The meta-agent diagnoses the agent’s failed curriculum tasks and proposes harness modifications; the solver agent applies these changes to its own code, producing a child solver agent. Parent and child are both kept in a lineage tree. In each later round of evolution, one promising agent in the tree is selected as the parent, the meta-agent derives new modification guidance based on that parent’s failed curriculum tasks, and the resulting child is evaluated against the curriculum and added to the tree. The evolution budget sets how many generations, and how many children per generation, the system can produce. When the budget is exhausted, the agent with the highest resolved rate on a validation set is reported as DGM’s final agent.

The interactive figure below shows DGM’s performance across tasks and generations, generated from the [officially released log](https://github.com/jennyzzt/dgm). Drag the `Generation` slider to watch the lineage tree grow, and click on any node to see that agent’s performance on the curriculum scoreboard.
<div class="l-page">
  <iframe class="fig-autoheight" src="{{ 'assets/html/2027-04-30-polyglot-dgm/scoreboard_dgm.html' | relative_url }}"
          frameborder="0" scrolling="no" height="640px" width="100%"></iframe>
</div>
<script>
  // Size each figure iframe to its content, and keep it sized as the figure changes (steps, slider, window width).
  (function () {
    function fit(f) {
      var d = f.contentDocument;
      if (!d || !d.body) return;
      var cs = d.defaultView.getComputedStyle(d.body);
      var h = Math.ceil(d.body.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom));
      if (h > 0) f.style.height = h + "px";
    }
    function watch(f) {
      function attach() {
        fit(f);
        if (window.ResizeObserver && f.contentDocument && f.contentDocument.body) new ResizeObserver(function () { fit(f); }).observe(f.contentDocument.body);
      }
      if (f.contentDocument && f.contentDocument.readyState === "complete") attach();
      f.addEventListener("load", attach);
    }
    function init() { document.querySelectorAll("iframe.fig-autoheight").forEach(watch); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  })();
</script>
Some curriculum tasks remain unresolved despite repeated attempts to improve the agent based on those tasks. On the curriculum scoreboard above, Java’s `sgf-parsing` task was selected for self-improvement 11 times (outlined cells) across 20 generations, yet no resulting agent solved it. How hard can this task be? The next section shows that this persistent failure points to a flaw in the evaluation setup rather than in the agent’s coding ability.

## Anatomy of a Stuck Task
We inspect [Java's `sgf-parsing`](https://github.com/Aider-AI/polyglot-benchmark/tree/main/java/exercises/practice/sgf-parsing) task to see why the agent failed. Initially, the agent’s workspace `/testbed` holds the task instructions, the Gradle build files, and a single stub file (a starter file without an implementation):
```text
/testbed
├── .docs/instructions.md
├── build.gradle                           # Gradle build setup
└── src/main/java/SgfParsing.java          # the single stub file
    src/main/java/SgfNode.java             # withheld "editor" file
    src/main/java/SgfParsingException.java # withheld "editor" file
```
The stub `SgfParsing.java` is the only file the solver agent should modify:
```java
public class SgfParsing {
    public SgfNode parse(String input) throws SgfParsingException {
        throw new UnsupportedOperationException("Please implement the SgfParsing.parse method.");
    }
}
```
The stub references `SgfNode` and `SgfParsingException`, but both classes live in files that are withheld (`SgfNode.java` and `SgfParsingException.java`). The solver agent looks for the classes in its workspace but finds nothing, so it writes its own `SgfNode`:
```java
// SgfNode.java as written by the agent, public members only, bodies omitted
public class SgfNode {
    public SgfNode()
    public Map<String, List<String>> getProperties()
    public List<SgfNode> getChildren()
    public void addProperty(String key, String value)
    public void addChild(SgfNode child)
    public String toString()
}
```
Once the agent is done, DGM's test setup runs [`git reset --hard test_commit`](https://github.com/jennyzzt/dgm/blob/a565fd2d1dca504ef5104a7cc0f3bdc4ab9b4fd2/polyglot/harness.py#L163) before the evaluation, which restores the withheld `SgfNode.java` over the agent's. That file has a different interface:
```java
// SgfNode.java as restored at grading, public members only, bodies omitted
public class SgfNode {
    public SgfNode()
    public SgfNode(Map<String, List<String>> properties)
    public boolean equals(Object o)
    public int hashCode()
    public void appendChild(SgfNode node)
    public void setProperties(Map<String, List<String>> properties)
}
```
The build fails because the solver calls `addChild`, but the evaluation restores a class that defines `appendChild`:
```terminal
$ ./gradlew test
src/main/java/SgfParsing.java:51: error: cannot find symbol
                last.addChild(variation);
                    ^
  symbol:   method addChild(SgfNode)
  location: variable last of type SgfNode
... 6 errors
BUILD FAILED in 12s
```
DGM therefore spends its evolution budget on guessing a method name the solver was never given, a hurdle that has nothing to do with the solver's ability to write the SGF parser. We unpack this failure mode in detail in [Missing Supporting Files](#missing-supporting-files).

## Four Evaluation Flaws
As the preceding example illustrates, a solver agent’s failure on a task may reflect a flaw in the environment rather than limited coding ability. Confusing the two distorts benchmark results and obscures which harness changes genuinely improve the agent. Our investigation of DGM’s Polyglot evaluation setup reveals four major flaws.

### Hidden Test and Answer Leakage
The most damaging flaw is that a solver agent can reach the hidden tests and the reference solutions. In Aider's original Polyglot setup, the solver sees only the instructions and a stub. The hidden tests and the reference solutions stay in the benchmark repository, outside the solver's reach. DGM's Polyglot environment brings that repository inside the task container, where the solver agent runs as root and can reach it by two routes (see figure below). First, the working directory `/testbed` is a Git clone of the task. Its checked-out commit has the tests removed, but its `origin/main` still points at [the commit that has them](https://github.com/jennyzzt/dgm/blob/a565fd2d1dca504ef5104a7cc0f3bdc4ab9b4fd2/polyglot/test_spec.py#L120-L125) (route 1). Second, the Dockerfile [copies the entire benchmark repository](https://github.com/jennyzzt/dgm/blob/a565fd2d1dca504ef5104a7cc0f3bdc4ab9b4fd2/polyglot/dockerfiles.py#L86), including hidden tests and solutions, to `/polyglot` in the container (route 2).

<div class="l-body">
  {% include figure.liquid path="assets/img/2027-04-30-polyglot-dgm/polyglot_test_setup.jpg" class="img-fluid" %}
</div>
<div class="caption">
  DGM's Polyglot environment. The solver agent can reach the hidden tests and reference solutions through git history in <code>/testbed</code> or directly under <code>/polyglot</code>, both inside its own task container.
</div>
DGM’s only guardrail against hidden-test leakage is its prompt. The solver agent is told to ["make changes to the files in the `/testbed` directory"](https://github.com/jennyzzt/dgm/blob/a565fd2d1dca504ef5104a7cc0f3bdc4ab9b4fd2/coding_agent_polyglot.py#L144-L152). The meta-agent’s prompt mentions that ["the tests for tasks are not provided in the repo, and the agent needs workflow design to implement them"](https://github.com/jennyzzt/dgm/blob/a565fd2d1dca504ef5104a7cc0f3bdc4ab9b4fd2/prompts/self_improvement_prompt.py#L281-L282). Nothing enforces these instructions. The leak stayed latent in DGM’s released traces, possibly because `o3-mini` was less capable: in those runs the solver never ran a Git command or read files under `/polyglot`. <span class="hl">When we ran DGM’s initial solver agent with `GPT-5.4` in the same setup, the solver found the hidden tests on its own.</span>

Roesner and Kohno have already documented the Git-history route (route 1)<d-cite key="roesner2026reflections"></d-cite>, so we walk through a route 2 example, [C++’s `crypto-square`](https://github.com/Aider-AI/polyglot-benchmark/tree/main/cpp/exercises/practice/crypto-square). The agent is given two stub files and [instructions](https://github.com/Aider-AI/polyglot-benchmark/blob/main/cpp/exercises/practice/crypto-square/.docs/instructions.md) that describe the problem. The header is an empty namespace that specifies no class, function, or return type (workspace below).
```text
/testbed
├── .docs/instructions.md
├── CMakeLists.txt              # build recipe; compiles crypto_square_test.cpp
├── crypto_square.h             # stub, empty namespace
├── crypto_square.cpp           # stub
└── test/
    ├── catch.hpp               # Catch2 framework
    └── tests-main.cpp          # generic runner, not real test cases
```
The agent lists its workspace and notices a `test/` directory. It searches `test/` for anything that tests `crypto_square`, and finds only the Catch2 header in `test/catch.hpp`:
```console
$ grep -R "crypto_square\|cipher\|encode\|normalize" -n test || true
test/catch.hpp:6231:        void encodeTo( std::ostream& os ) const;
test/catch.hpp:8836:    // may encode an option + its argument if the : or = form is used
…
```
A solver that respected its workspace and instructions would stop here and accept that no meaningful tests are provided. However, the agent reads the [build file `CMakeLists.txt`](https://github.com/Aider-AI/polyglot-benchmark/blob/7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f/cpp/exercises/practice/crypto-square/CMakeLists.txt#L23) and realizes that a `crypto_square_test.cpp` should exist. The agent checks whether Git tracks that file in `/testbed`, then searches the entire container by filename with `find`. It finds the hidden test under `/polyglot`, outside its working directory, and opens it with `sed`:
```console
$ git ls-files | grep 'crypto_square_test.cpp' || true && find / -name 'crypto_square_test.cpp' 2>/dev/null | head
/polyglot/polyglot-benchmark/cpp/exercises/practice/crypto-square/crypto_square_test.cpp

$ sed -n '1,220p' /polyglot/polyglot-benchmark/cpp/exercises/practice/crypto-square/crypto_square_test.cpp
#include "crypto_square.h"
…
TEST_CASE("empty plaintext results in an empty ciphertext",
          "[407c3837-9aa7-4111-ab63-ec54b58e8e9f]") {
    REQUIRE("" == crypto_square::cipher("").normalized_cipher_text());
}
…
```
The agent now knows that the solution needs a class `cipher` with a method `normalized_cipher_text()`, and writes its header and implementation to match. It then recreates every hidden test case in `/testbed/crypto_square_test.cpp` and uses that file to refine its solution. At official grading, the evaluation builds against the official test file, which the agent has already read. The solver passes all 8 tests on a task it had no legitimate way to solve.

For an initial fixed solver this leak is already alarming: the agent finds the test file outside of its permitted boundary and uses it to pass all the tests. The self-evolving nature of DGM makes it worse. A solver agent that reaches the hidden tests resolves more of the curriculum, then a higher resolved rate makes it more likely to be selected as a parent. Then its children most likely will inherit the misaligned harness change: a prompt that says to search for the hidden test files so it can always pass the test. <span class="hl">One agent that learns to trick the evaluation can pollute the whole evolution lineage, and the best solver it produces is worthless in any properly isolated environment.</span>

### Missing Task Contracts
Aider's Polyglot gives the solver agent <span class="hl">two attempts</span>. If the first solution fails, the agent sees the test output and tries again. Some exercises depend on that second pass: their instructions describe what to compute but not the interface the hidden tests call. The first attempt is a guess, and the error log supplies the missing contract. DGM adopted the benchmark but evaluates with a <span class="hl">single attempt</span> and no feedback, so for these tasks the solver can only pass by guessing the interface correctly.

[C++'s `all-your-base`](https://github.com/Aider-AI/polyglot-benchmark/tree/main/cpp/exercises/practice/all-your-base) demonstrates this flaw. The instructions ask the agent to convert a sequence of digits from one base to another. The stub it receives is an empty namespace:

```cpp
// all_your_base.h (visible to the agent), relevant lines only
namespace all_your_base { }  // namespace all_your_base
```

The hidden test, however, calls a specific function:

```cpp
// all_your_base_test.cpp (hidden), relevant lines only
vector<unsigned int> out_digits = all_your_base::convert(2, in_digits, 10);
```
The test above expects a function named `convert` that takes the input base first, the digits second, and the output base third, then returns `std::vector<unsigned int>`. None of this appears anywhere in the agent's provided workspace. A correct implementation of `convert` under any other name or signature fails to compile, and the task is scored as unresolved. DGM’s own run named the function `rebase` and failed in exactly this way:

```text
all_your_base_test.cpp:15:54: error: 'convert' is not a member of 'all_your_base'
```
Under Aider’s two-attempt protocol, this error would reach the agent, and the second attempt would fix it; under DGM’s single attempt, the task ends here.

This is not limited to one task. Every C++ exercise in Polyglot ships the same empty stub, 12 more in Go, Python, Rust and JavaScript omit a declaration the tests call, and many others leave a return shape or an exact error message unstated. For these tasks, the resolved rate measures how often the agent guesses an interface it was never shown. A solver cannot, and should not have to, recover a contract that exists only in the hidden test.

### Missing Supporting Files
Some exercises come with more than stub files and instructions. Aider’s Polyglot ships them with supporting files, such as interfaces, exception classes or data types, that the stub files depend on, and marks them as <span class="hl">*editor* files</span>. It leaves them in the task directory, so the solution compiles against them. DGM omits those *editor* files. [Its initial commit contains only the stub, the instructions and the build files](https://github.com/jennyzzt/dgm/blob/a565fd2d1dca504ef5104a7cc0f3bdc4ab9b4fd2/polyglot/prepare_polyglot_dataset.py#L179-L199). The supporting *editor* files are held back with the hidden tests and appear only at grading time.

Our Java example `sgf-parsing` in [Anatomy of a Stuck Task](#anatomy-of-a-stuck-task) is an instance of this flaw. `SgfNode.java` and `SgfParsingException.java` are *editor* files. Whatever the agent writes in their place is replaced or duplicated at grading, so the build fails whenever the agent's guess differs from Exercism’s file. To pass, the agent must either guess the hidden classes’ interface correctly or leave them undefined and trust that a file it has never seen will appear at grading time. Neither is a reasonable thing to ask of any coding agent.

To see how common missing contracts and missing supporting files are, we counted the affected tasks across the whole Polyglot benchmark. The count below is conservative: it includes only tasks where a name, signature or file the tests depend on is absent from the agent’s workspace, and leaves out those where an error message or return shape is merely unstated.

| Language | Tasks | Missing contract | Missing supporting files | Affected (at least) |
|---|---:|---:|---:|---:|
| C++ | 26 | 26 | 0 | 26 (100%) |
| Java | 47 | 0 | 14 | 14 (30%) |
| Go | 39 | 5 | 5 | 10 (26%) |
| Python | 34 | 4 | 0 | 4 (12%) |
| Rust | 30 | 2 | 0 | 2 (7%) |
| JavaScript | 49 | 1 | 0 | 1 (2%) |
| **Total** | **225** | **38** | **19** | **57 (25%)** |

<div class="caption">
Polyglot tasks that cannot be solved in DGM’s environment without guessing correctly. <em>Missing contract</em>: the stub lacks a name or signature the hidden tests call (C++’s <code>all-your-base</code>). <em>Missing supporting files</em>: the stub references a type defined in a file withheld until grading (Java’s <code>sgf-parsing</code>).
</div>

### Tests That Never Run
This flaw affects every Java task. Exercism’s Java exercises enable only the first test. Every other test method carries `@Disabled("Remove to run test")`, so that a learner can turn them on one at a time. DGM’s adaptation overlooks that these annotations must be removed before grading. Take the [task `forth`](https://github.com/Aider-AI/polyglot-benchmark/tree/main/java/exercises/practice/forth) as an example. The [hidden test file](https://github.com/Aider-AI/polyglot-benchmark/blob/main/java/exercises/practice/forth/src/test/java/ForthEvaluatorTest.java) begins:
```java
// ForthEvaluatorTest.java (hidden; applied at grading, annotations intact)
@Test
public void testNumbersAreJustPushedOntoTheStack() { ... }

@Disabled("Remove to run test")
@Test
public void testNegativeNumbersArePushedOntoTheStack() { ... }
```
Aider's Polyglot [strips the annotations](https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/benchmark/benchmark.py#L1016-L1023) before running a Java task:
```python
# aider/benchmark/benchmark.py
content = re.sub(r"@Disabled\([^)]*\)\s*\n", "", content)
```
In contrast, DGM's evaluation [runs the test command directly](https://github.com/jennyzzt/dgm/blob/a565fd2d1dca504ef5104a7cc0f3bdc4ab9b4fd2/polyglot/harness.py#L172-L182):
```python
# polyglot/harness.py (relevant lines only)
test_command = TEST_COMMANDS[language]   # "./gradlew test" for Java tasks
eval_file.write_text(get_eval_script(test_command))
copy_to_container(container, eval_file, '/testbed/eval.sh')
...
exec_result = container.exec_run("timeout 120 ./eval.sh", workdir='/testbed')
```
As a result, `forth` is marked resolved when its single enabled test passes. DGM’s own grading log for its best agent on `forth` confirms this:
```java
ForthEvaluatorTest > testNumbersAreJustPushedOntoTheStack() PASSED
ForthEvaluatorTest > testCombinedAdditionAndMultiplication() SKIPPED
ForthEvaluatorTest > testUserDefinedWordsAreCaseInsensitive() SKIPPED
...   1 passed, 54 skipped
```
The only behavior checked is pushing numbers onto a stack. A Java task can therefore be marked resolved without any of the logic the instructions ask for. This inflates the reported Java scores and feeds the evolution process a false signal about which harness changes helped.

## A Repaired Polyglot Environment
We repaired the four flaws and fixed a few minor engineering issues along the way. The solver’s container now holds only the base commit, with no test history and no copy of the benchmark repository, and grading runs in a separate evaluator container; the missing interfaces are stated in the stubs or instructions the agent can see, without copying any test cases; the *editor* files are included in the solver's workspace; and the evaluator strips the `@Disabled` annotations before running the Java tests. All 225 reference solutions pass under our repaired setup, so every task remains solvable. We then re-evaluated the two agents DGM reported<d-cite key="zhang2026darwin"></d-cite>: the initial agent and the final “best” agent produced by its evolution run. Since the `o3-mini` model DGM originally used is no longer available, both agents use `gpt-5.4-mini` as the solver backbone. Due to a limited budget we did not re-run the entire evolution itself. Instead, we ask whether its final evolved agent is better than its initial one in our repaired Polyglot environment. To see how much the environment correction alone moves the scores, we also ran both agents in DGM’s flawed setup.

**On our repaired benchmark, the initial agent solves 91 of 225 tasks (40.4%) and the evolved agent solves 88 (39.1%).** The two agents solve a largely overlapping set: 69 tasks are solved by both, 22 only by the initial agent, and 19 only by the evolved one.

|  | Original environment (flawed) | Repaired environment |
|---|---:|---:|
| Initial agent | 28.4% | 40.4% |
| Best agent from DGM evolution | 29.8% | 39.1% |

<div class="caption">
Success rate on all 225 Polyglot tasks with <code>gpt-5.4-mini</code> as the solver.
</div>

As a sanity check on our recreation of the original environment: DGM’s own transfer experiment, which swaps `o3-mini` for `Sonnet 3.5 or 3.7`, reports the best agent ahead of the initial one by 1.3 and 1.2 percentage points. We measure 1.4 with `gpt-5.4-mini`.

The table is not a test of DGM’s evolution procedure, since the best agent was selected with `o3-mini` in the original environment. We therefore do not try to conclude whether DGM’s reported gain, from 14.2% to 30.7%, was produced by the flawed environment. What the table does show is how unreliable the original environment is as a parent-selection signal. Holding the agent fixed, repairing the environment moves the score by up to 12 points (28.4% vs 40.4%). The initial and evolved agents, by contrast, differ by only about one point in either environment. <span class="hl">A sound evaluation environment is a precondition for meaningful self-improvement. In a flawed environment, evolution can favor policies that exploit those flaws over policies that improve coding ability.</span>

## Reflections
Our intention is not to discredit the contribution of DGM and its successors in the field of recursive self-improving agents. We appreciate DGM’s work and the authors’ openness in sharing their implementation and detailed evolution traces with the research community; this post was only possible because of it.

The recent OpenAI-Hugging Face incident <d-cite key="metr-2026-openai-hugging-face-incident-investigation"></d-cite> showed that LLM agents can exploit their environment to cheat on their tasks. In the incident, agents that had unintentionally been given impossible tasks went looking for a way around the scorer, and the sandboxes meant to isolate them did not hold. We saw the same pattern play out on a much smaller scale in Polyglot: tasks that could not be solved as given (due to missing contracts or files), and a stronger solver that went looking for the hidden tests and used them. The prompt was the only defense, and it failed. 

When building environments and sandboxes for self-evolving systems, we believe two things are needed. First, the benchmark’s original testing protocol must be fully understood before it is adapted, so that the agent is given a fair task. Second, access boundaries should be enforced by the sandbox rather than entrusted to the prompt. As agents become more capable, guardrails that held for weaker agents may no longer be effective, and we consider the study of how and when that happens an important direction for future work.