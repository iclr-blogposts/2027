/*
 * Playback and settings for the resource competition figure.
 * Markup comes from resource-competition.html.
 * The simulation is deterministic, so moving the timeline replays the stream from the start.
 */
(() => {
  "use strict";

  const core = globalThis.ResourceCompetition;
  const view = globalThis.ResourceView;
  const { tokens, uniqueId, onThemeChange, mountAll } = globalThis.Vis;

  // Slow enough to follow one signal at a time; the fast speed is for skipping ahead.
  const SPEEDS = [
    { label: "1×", intervalMs: 500 },
    { label: "4×", intervalMs: 125 },
  ];
  const RECENT_COUNT = 13;

  // Names and colors stay fixed; presets change only the numbers.
  const TOPICS = [
    { id: "A", name: "Everyday English", color: "--vis-accent" },
    { id: "B", name: "Code", color: "--vis-ink" },
    { id: "C", name: "Quantum physics", color: "--vis-yellow" },
  ];
  const PRESETS = [
    { name: "MOSTLY ENGLISH", weights: [70, 25, 5], complexities: [3, 4, 5] },
    { name: "BOOST QUANTUM", weights: [45, 15, 40], complexities: [6, 3, 4] },
    { name: "BALANCED", weights: [34, 33, 33], complexities: [4, 4, 4] },
  ];
  const DEFAULT_CONFIG = {
    weights: PRESETS[0].weights,
    complexities: PRESETS[0].complexities,
    capacities: [4, 14],
    seed: 7,
    steps: 200,
  };

  function sameNumbers(a, b) {
    return a.every((value, i) => value === b[i]);
  }

  function mount(root) {
    const find = (selector) => root.querySelector(selector);
    const stage = find(".vis-rc-stage");
    const topicList = find(".vis-rc-topics");
    const timeline = find(".vis-rc-timeline");
    const count = find(".vis-rc-count");
    const playButton = find(".vis-rc-play");
    const speedButton = find(".vis-rc-speed");
    const interferenceButton = find(".vis-rc-interference");
    const form = find(".vis-rc-advanced");
    const topicFields = find(".vis-rc-topic-fields");
    const errorText = find(".vis-rc-error");
    const fields = {
      small: form.elements.small,
      large: form.elements.large,
      steps: form.elements.steps,
      seed: form.elements.seed,
    };
    const color = tokens(root);
    const ctx = {
      svg: stage,
      color,
      crayon: view.createCrayonFilter(root, uniqueId("vis-crayon")),
      colorOf: (featureId) => color(TOPICS.find((topic) => topic.id === featureId.split(":")[0]).color),
    };

    let config = DEFAULT_CONFIG;
    let interference = false;
    let timer = null;
    let speedIndex = 0;

    function toCoreConfig(settings) {
      return {
        tasks: TOPICS.map((topic, i) => ({ id: topic.id, weight: settings.weights[i], complexity: settings.complexities[i] })),
        capacities: settings.capacities,
        seed: settings.seed,
        steps: settings.steps,
        mode: interference ? "strength" : "space",
      };
    }

    function simulateUpTo(step) {
      const simulation = core.createSimulation(toCoreConfig(config));
      const recent = [];
      for (let i = 0; i < step; i++) recent.push(simulation.advance().feature.id);
      return { simulation, recent: recent.slice(-RECENT_COUNT) };
    }

    function render() {
      const step = Number(timeline.value);
      const { simulation, recent } = simulateUpTo(step);
      view.renderTopics(topicList, TOPICS, simulation.catalog, ctx.crayon);
      view.render(ctx, simulation, recent);
      count.textContent = `${step} / ${config.steps}`;
    }

    function pause() {
      clearInterval(timer);
      timer = null;
      playButton.textContent = "PLAY";
    }

    function play() {
      if (Number(timeline.value) >= config.steps) timeline.value = 0;
      playButton.textContent = "PAUSE";
      timer = setInterval(() => {
        timeline.value = Number(timeline.value) + 1;
        render();
        if (Number(timeline.value) >= config.steps) pause();
      }, SPEEDS[speedIndex].intervalMs);
    }

    function markActivePreset() {
      presetButtons.forEach((button, i) => {
        const preset = PRESETS[i];
        const active = sameNumbers(preset.weights, config.weights) && sameNumbers(preset.complexities, config.complexities);
        button.setAttribute("aria-pressed", String(active));
      });
    }

    function topicRow(topic, i) {
      const row = document.createElement("div");
      row.className = "vis-rc-field-row vis-rc-topic-row";
      row.innerHTML = `
				<span class="vis-rc-topic-name"></span>
				<label>FREQUENCY WEIGHT <input class="vis-rc-weight" name="weight-${topic.id}" type="number" min="0" max="100" required></label>
				<label>FEATURES <input class="vis-rc-complexity" name="features-${topic.id}" type="number" min="1" max="8" required></label>`;
      row.querySelector(".vis-rc-topic-name").textContent = topic.name;
      row.querySelector(".vis-rc-weight").value = config.weights[i];
      row.querySelector(".vis-rc-complexity").value = config.complexities[i];
      return row;
    }

    function fillForm() {
      topicFields.replaceChildren(...TOPICS.map(topicRow));
      fields.small.value = config.capacities[0];
      fields.large.value = config.capacities[1];
      fields.steps.value = config.steps;
      fields.seed.value = config.seed;
    }

    function readForm() {
      return {
        weights: [...form.querySelectorAll(".vis-rc-weight")].map((input) => Number(input.value)),
        complexities: [...form.querySelectorAll(".vis-rc-complexity")].map((input) => Number(input.value)),
        capacities: [Number(fields.small.value), Number(fields.large.value)],
        seed: Number(fields.seed.value),
        steps: Number(fields.steps.value),
      };
    }

    // New settings replay the stream up to the same signal, so the result shows immediately.
    function applyConfig(next) {
      pause();
      config = next;
      timeline.max = config.steps;
      timeline.value = Math.min(Number(timeline.value), config.steps);
      fillForm();
      markActivePreset();
      render();
    }

    const presetButtons = PRESETS.map((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = preset.name;
      button.addEventListener("click", () => applyConfig({ ...config, weights: preset.weights, complexities: preset.complexities }));
      return button;
    });
    find(".vis-rc-presets").append(...presetButtons);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const next = readForm();
      try {
        if (next.capacities[0] > next.capacities[1]) throw new RangeError("Small slots must not exceed large slots.");
        core.createSimulation(toCoreConfig(next)); // throws on invalid settings
        errorText.textContent = "";
        applyConfig(next);
      } catch (error) {
        errorText.textContent = error.message;
      }
    });

    // Interference adds a layer on top of the same stream: learning becomes gradual,
    // and updates can wear down neighbors in the same slot. The timeline position is kept.
    interferenceButton.addEventListener("click", () => {
      interference = !interference;
      interferenceButton.setAttribute("aria-pressed", String(interference));
      render();
    });

    playButton.addEventListener("click", () => (timer === null ? play() : pause()));
    speedButton.addEventListener("click", () => {
      speedIndex = (speedIndex + 1) % SPEEDS.length;
      speedButton.textContent = SPEEDS[speedIndex].label;
      if (timer !== null) {
        pause();
        play();
      }
    });
    timeline.addEventListener("input", () => {
      pause();
      render();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pause();
    });
    // The stage switches between the wide and narrow layouts by its own width.
    let lastWidth = stage.clientWidth;
    new ResizeObserver(() => {
      if (stage.clientWidth === lastWidth) return;
      lastWidth = stage.clientWidth;
      render();
    }).observe(stage);
    onThemeChange(render);

    timeline.max = config.steps;
    timeline.value = Math.round(config.steps / 2);
    fillForm();
    markActivePreset();
    render();
  }

  mountAll("resource-competition", mount);
})();
