document.addEventListener("DOMContentLoaded", () => {
  const scene = document.querySelector(".space-scene");
  const world = document.querySelector(".space-world");
  const ship = document.querySelector(".space-ship");

  if (!scene || !world || !ship) {
    return;
  }

  const pressedKeys = new Set();
  const moveSpeed = 260;
  const worldWidth = world.offsetWidth;
  const worldHeight = world.offsetHeight;
  const viewportWidth = scene.clientWidth || window.innerWidth;
  const viewportHeight = scene.clientHeight || window.innerHeight;
  const shipSize = {
    width: ship.offsetWidth,
    height: ship.offsetHeight,
  };
  const padding = 8;
  const cameraSmoothing = 0.12;
  const zoneIndicator = document.querySelector(".zone-indicator");
  const zoneIndicatorName = document.querySelector(".zone-indicator-name");
  const zoneIndicatorDescription = document.querySelector(".zone-indicator-description");
  const zoneIndicatorDiscoveries = document.querySelector(".zone-indicator-discoveries");
  const discoveryCounter = document.querySelector(".discovery-counter");
  const zoneIntroduction = document.querySelector(".zone-introduction");
  const zoneIntroductionTitle = document.querySelector(".zone-introduction-title");
  const zoneIntroductionText = document.querySelector(".zone-introduction-text");
  const proximityPrompt = document.querySelector(".proximity-prompt");
  const proximityObjectName = document.querySelector(".proximity-object-name");
  const proximityInstruction = document.querySelector(".proximity-instruction");
  const storyDialog = document.querySelector(".story-dialog");
  const storyTitle = document.querySelector(".story-title");
  const storyYear = document.querySelector(".story-year");
  const storyType = document.querySelector(".story-type");
  const storyMission = document.querySelector(".story-mission");
  const storyDestination = document.querySelector(".story-destination");
  const storyPlanetFacts = document.querySelector(".story-planet-facts");
  const storyDiameter = document.querySelector(".story-diameter");
  const storyDistance = document.querySelector(".story-distance");
  const storyMoons = document.querySelector(".story-moons");
  const storyTemperature = document.querySelector(".story-temperature");
  const storyHighlight = document.querySelector(".story-highlight");
  const storyHistory = document.querySelector(".story-history");
  const storyVisual = document.querySelector(".story-visual");
  const storyVisualImage = document.querySelector(".story-visual-image");
  const storyCloseButtons = document.querySelectorAll(".story-close, .story-continue");
  const completionScreen = document.querySelector(".completion-screen");
  const completionTitle = document.querySelector(".completion-title");
  const completionHighlight = document.querySelector(".completion-highlight");
  const completionContinue = document.querySelector(".completion-continue");
  const proximityRadius = 140;
  let objectInteractables = [];
  let planetInteractables = [];
  const discoveredInteractables = new Set();
  let completionPending = false;
  let completionShown = false;
  let completionOpen = false;
  let objectsLoaded = false;
  let planetsLoaded = false;
  let activeInteractable = null;
  let zoneIntroData = new Map();
  let zoneIntroDataLoaded = false;
  let currentZoneId = null;
  let activeZoneIntro = false;
  const visitedZoneIds = new Set();
  const pendingZoneIntros = [];

  const zones = [
    {
      id: "earth",
      name: "TIERRA",
      description: "Zona inicial",
      start: 0,
      end: 700,
    },
    {
      id: "moon",
      name: "LUNA",
      description: "Exploración de la Luna",
      start: 700,
      end: 1250,
    },
    {
      id: "mars",
      name: "MARTE",
      description: "Exploración de Marte",
      start: 1250,
      end: 2200,
    },
    {
      id: "jupiter",
      name: "JÚPITER",
      description: "Exploración de Júpiter",
      start: 2200,
      end: 3300,
    },
    {
      id: "saturn",
      name: "SATURNO",
      description: "Exploración de Saturno",
      start: 3300,
      end: 4600,
    },
    {
      id: "deep-space",
      name: "ESPACIO PROFUNDO",
      description: "Más allá del sistema planetario",
      start: 4600,
      end: worldWidth,
    },
  ];

  const generateStars = () => {
    const starsCount = 220;
    const starLayer = document.querySelector(".stars-front");

    if (!starLayer) {
      return;
    }

    for (let index = 0; index < starsCount; index += 1) {
      const star = document.createElement("span");
      const size = Math.random() * 2.5 + 1;
      const left = Math.random() * worldWidth;
      const top = Math.random() * worldHeight;
      const opacity = Math.random() * 0.8 + 0.2;

      star.className = "space-star";
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${left}px`;
      star.style.top = `${top}px`;
      star.style.opacity = String(opacity);
      starLayer.appendChild(star);
    }
  };

  let worldX = ship.offsetLeft;
  let worldY = ship.offsetTop;
  let cameraX = 0;
  let cameraY = 0;

  const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

  const getDiscoveryKey = (interactable) => `${interactable.type}:${interactable.data.id}`;

  const getTotalDiscoveries = () => objectInteractables.length + planetInteractables.length;

  const openCompletionScreen = () => {
    if (completionShown || !completionScreen || !completionTitle || !completionHighlight) {
      return;
    }

    completionShown = true;
    completionOpen = true;
    const totalDiscoveries = getTotalDiscoveries();
    completionTitle.textContent = "Exploración completada";
    completionHighlight.textContent =
      `${totalDiscoveries} historias. Un mismo impulso: descubrir qué hay más allá.`;
    completionScreen.hidden = false;
    requestAnimationFrame(() => completionScreen.classList.add("is-visible"));
    completionContinue?.focus();
  };

  const closeCompletionScreen = () => {
    if (!completionOpen || !completionScreen) {
      return;
    }

    completionScreen.classList.remove("is-visible");
    setTimeout(() => {
      completionScreen.hidden = true;
      completionOpen = false;
    }, 650);
  };

  const updateDiscoveryIndicators = () => {
    if (!objectsLoaded || !planetsLoaded) {
      return;
    }

    const currentZone = zones.find((zone) => zone.id === currentZoneId);
    const zoneInteractables = currentZone
      ? [
          ...objectInteractables.filter((item) => item.data.zone === currentZone.id),
          ...planetInteractables.filter((item) => item.data.id === currentZone.id),
        ]
      : [];
    const zoneDiscoveredCount = zoneInteractables.filter((item) =>
      discoveredInteractables.has(getDiscoveryKey(item))
    ).length;

    if (zoneIndicatorDiscoveries) {
      zoneIndicatorDiscoveries.textContent =
        `${zoneDiscoveredCount} / ${zoneInteractables.length} descubiertos`;
    }

    if (discoveryCounter) {
      discoveryCounter.textContent =
        `Descubiertos: ${discoveredInteractables.size} / ${getTotalDiscoveries()}`;
    }
  };

  const showNextZoneIntroduction = () => {
    if (
      activeZoneIntro ||
      pendingZoneIntros.length === 0 ||
      !zoneIntroduction ||
      !zoneIntroductionTitle ||
      !zoneIntroductionText
    ) {
      return;
    }

    const introduction = zoneIntroData.get(pendingZoneIntros.shift());
    if (!introduction) {
      showNextZoneIntroduction();
      return;
    }

    activeZoneIntro = true;
    zoneIntroductionTitle.textContent = introduction.title;
    zoneIntroductionText.textContent = introduction.intro;
    zoneIntroduction.hidden = false;
    requestAnimationFrame(() => zoneIntroduction.classList.add("is-visible"));

    setTimeout(() => {
      zoneIntroduction.classList.remove("is-visible");
      setTimeout(() => {
        zoneIntroduction.hidden = true;
        activeZoneIntro = false;
        showNextZoneIntroduction();
      }, 500);
    }, 4000);
  };

  const loadZoneIntroductions = async () => {
    try {
      const response = await fetch("data/zones.json");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const zoneRecords = await response.json();
      const validZoneIds = new Set(zones.map((zone) => zone.id));

      if (
        !Array.isArray(zoneRecords) ||
        zoneRecords.length !== zones.length ||
        zoneRecords.some((zone) =>
          !zone ||
          typeof zone.id !== "string" ||
          !validZoneIds.has(zone.id) ||
          typeof zone.name !== "string" ||
          typeof zone.title !== "string" ||
          typeof zone.intro !== "string"
        )
      ) {
        throw new Error("El archivo no contiene introducciones válidas para todas las zonas.");
      }

      const receivedZoneIds = new Set(zoneRecords.map((zone) => zone.id));
      if (
        receivedZoneIds.size !== zones.length ||
        zones.some((zone) => !receivedZoneIds.has(zone.id))
      ) {
        throw new Error("Falta una introducción o hay zonas duplicadas en data/zones.json.");
      }

      zoneIntroData = new Map(zoneRecords.map((zone) => [zone.id, zone]));
      zoneIntroDataLoaded = true;
      showNextZoneIntroduction();
    } catch (error) {
      console.error("No se pudieron cargar las introducciones desde data/zones.json.", error);
    }
  };

  const updateCamera = () => {
    const shipCenterX = worldX + shipSize.width / 2;
    const shipCenterY = worldY + shipSize.height / 2;
    const targetCameraX = clamp(
      shipCenterX - viewportWidth / 2,
      0,
      worldWidth - viewportWidth,
    );
    const targetCameraY = clamp(
      shipCenterY - viewportHeight / 2,
      0,
      worldHeight - viewportHeight,
    );

    cameraX += (targetCameraX - cameraX) * cameraSmoothing;
    cameraY += (targetCameraY - cameraY) * cameraSmoothing;
    world.style.transform = `translate(${-cameraX}px, ${-cameraY}px)`;
  };

  const updateShipPosition = (x, y) => {
    const maxX = worldWidth - shipSize.width - padding;
    const maxY = worldHeight - shipSize.height - padding;
    const nextX = Math.min(Math.max(x, padding), maxX);
    const nextY = Math.min(Math.max(y, padding), maxY);

    worldX = nextX;
    worldY = nextY;
    ship.style.left = `${nextX}px`;
    ship.style.top = `${nextY}px`;
  };

  const updateZoneIndicator = () => {
    const shipCenterX = worldX + shipSize.width / 2;
    const zone = zones.find((item) => shipCenterX >= item.start && shipCenterX < item.end) || zones[zones.length - 1];

    if (currentZoneId !== zone.id) {
      currentZoneId = zone.id;
      if (!visitedZoneIds.has(zone.id)) {
        visitedZoneIds.add(zone.id);
        if (zoneIntroDataLoaded) {
          pendingZoneIntros.push(zone.id);
          showNextZoneIntroduction();
        } else {
          pendingZoneIntros.push(zone.id);
        }
      }
    }

    if (zoneIndicatorName) {
      const zoneData = zoneIntroData.get(zone.id);
      zoneIndicatorName.textContent = zoneData?.name.toLocaleUpperCase("es") || zone.name;
    }

    if (zoneIndicatorDescription) {
      zoneIndicatorDescription.textContent = zone.description;
    }

    updateDiscoveryIndicators();
  };

  const updateProximity = () => {
    if (!objectsLoaded || !planetsLoaded) {
      return;
    }

    const shipCenterX = worldX + shipSize.width / 2;
    const shipCenterY = worldY + shipSize.height / 2;
    let nearestInteractable = null;
    let nearestDistance = proximityRadius;

    [...objectInteractables, ...planetInteractables].forEach((interactable) => {
      const centerDistance = Math.hypot(
        shipCenterX - interactable.x,
        shipCenterY - interactable.y,
      );
      const distance = Math.max(0, centerDistance - interactable.radius);

      if (distance < nearestDistance) {
        nearestInteractable = interactable;
        nearestDistance = distance;
      }
    });

    if (activeInteractable !== nearestInteractable) {
      activeInteractable?.element.classList.remove("is-nearby");
      activeInteractable = nearestInteractable;
      activeInteractable?.element.classList.add("is-nearby");
    }

    if (proximityPrompt && proximityObjectName) {
      proximityPrompt.hidden = !activeInteractable;
      proximityObjectName.textContent = activeInteractable
        ? activeInteractable.type === "planet"
          ? activeInteractable.data.name.toLocaleUpperCase("es")
          : activeInteractable.data.name
        : "";
    }

    if (proximityInstruction) {
      proximityInstruction.textContent = activeInteractable &&
        discoveredInteractables.has(getDiscoveryKey(activeInteractable))
        ? "Presiona E para volver a leer su historia"
        : "Presiona E para descubrir su historia";
    }
  };

  const openStory = () => {
    if (!activeInteractable || !storyDialog || storyDialog.open) {
      return;
    }

    const { data, type } = activeInteractable;
    const isPlanet = type === "planet";

    if (
      !data ||
      !storyTitle ||
      !storyYear ||
      !storyMission ||
      !storyDestination ||
      !storyHighlight ||
      !storyHistory
    ) {
      return;
    }

    const discoveryKey = getDiscoveryKey(activeInteractable);
    if (!discoveredInteractables.has(discoveryKey)) {
      discoveredInteractables.add(discoveryKey);
      activeInteractable.element.classList.add("is-discovered");
      if (activeInteractable.discoveryMark) {
        activeInteractable.discoveryMark.hidden = false;
      }
      updateDiscoveryIndicators();
      if (proximityInstruction) {
        proximityInstruction.textContent = "Presiona E para volver a leer su historia";
      }
      if (
        getTotalDiscoveries() > 0 &&
        discoveredInteractables.size === getTotalDiscoveries() &&
        !completionShown
      ) {
        completionPending = true;
      }
    }

    storyTitle.textContent = data.name;
    storyYear.hidden = isPlanet;
    storyMission.hidden = isPlanet;
    storyDestination.hidden = isPlanet;
    if (storyType) {
      storyType.hidden = !isPlanet;
      storyType.textContent = isPlanet ? data.type : "";
    }
    if (storyPlanetFacts) {
      storyPlanetFacts.hidden = !isPlanet;
    }
    if (storyDiameter) {
      storyDiameter.textContent = isPlanet ? data.diameter : "";
    }
    if (storyDistance) {
      storyDistance.textContent = isPlanet ? data.distanceFromSun : "";
    }
    if (storyMoons) {
      storyMoons.textContent = isPlanet ? data.moons : "";
    }
    if (storyTemperature) {
      storyTemperature.textContent = isPlanet ? data.temperature : "";
    }
    if (!isPlanet) {
      storyYear.textContent = `Año: ${data.year}`;
      storyMission.textContent = `Misión: ${data.mission}`;
      storyDestination.textContent = `Destino: ${data.destination}`;
    } else {
      storyYear.textContent = "";
      storyMission.textContent = "";
      storyDestination.textContent = "";
    }
    storyHighlight.textContent = data.highlight;
    storyHistory.textContent = data.story;
    if (storyVisual && storyVisualImage) {
      storyVisual.classList.remove("has-image");
      storyVisualImage.hidden = true;
      storyVisualImage.removeAttribute("src");

      if (data.image) {
        const imagePath = data.image;
        storyVisualImage.onload = () => {
          if (storyVisualImage.getAttribute("src") !== imagePath || !storyDialog.open) {
            return;
          }

          storyVisualImage.hidden = false;
          storyVisual.classList.add("has-image");
        };
        storyVisualImage.onerror = () => {
          if (storyVisualImage.getAttribute("src") !== imagePath) {
            return;
          }

          storyVisualImage.hidden = true;
          storyVisual.classList.remove("has-image");
          const itemType = isPlanet ? "planeta" : "objeto";
          console.warn(`No se pudo cargar la imagen del ${itemType} ${data.name}: ${imagePath}`);
        };
        storyVisualImage.src = imagePath;
      }
    }
    pressedKeys.clear();
    storyDialog.showModal();
  };

  const closeStory = () => {
    if (storyDialog?.open) {
      storyDialog.close();
    }
  };

  storyDialog?.addEventListener("close", () => {
    if (!completionPending || completionShown) {
      return;
    }

    completionPending = false;
    setTimeout(openCompletionScreen, 700);
  });

  const handleKeyChange = (event, isPressed) => {
    const { code } = event;
    const movementKeys = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"];

    if (completionOpen) {
      if (movementKeys.includes(code)) {
        event.preventDefault();
      }
      return;
    }

    if (code === "Escape" && isPressed && storyDialog?.open) {
      closeStory();
      return;
    }

    if (code === "KeyE" && isPressed) {
      if (!storyDialog?.open) {
        openStory();
      }
      return;
    }

    if (!movementKeys.includes(code)) {
      return;
    }

    event.preventDefault();

    if (storyDialog?.open || completionOpen) {
      if (!isPressed) {
        pressedKeys.delete(code);
      }
      return;
    }

    if (isPressed) {
      pressedKeys.add(code);
    } else {
      pressedKeys.delete(code);
    }
  };

  const getMovement = () => {
    let horizontal = 0;
    let vertical = 0;

    if (pressedKeys.has("KeyA") || pressedKeys.has("ArrowLeft")) {
      horizontal -= 1;
    }
    if (pressedKeys.has("KeyD") || pressedKeys.has("ArrowRight")) {
      horizontal += 1;
    }
    if (pressedKeys.has("KeyW") || pressedKeys.has("ArrowUp")) {
      vertical -= 1;
    }
    if (pressedKeys.has("KeyS") || pressedKeys.has("ArrowDown")) {
      vertical += 1;
    }

    return { horizontal, vertical };
  };

  let previousTimestamp = 0;

  const moveShip = (timestamp) => {
    const elapsedSeconds = (timestamp - previousTimestamp) / 1000 || 0;
    previousTimestamp = timestamp;

    if (storyDialog?.open || completionOpen) {
      requestAnimationFrame(moveShip);
      return;
    }

    const { horizontal, vertical } = getMovement();
    const moveX = horizontal * moveSpeed * elapsedSeconds;
    const moveY = vertical * moveSpeed * elapsedSeconds;
    const previousX = worldX;
    const previousY = worldY;

    updateShipPosition(worldX + moveX, worldY + moveY);

    const movementX = worldX - previousX;
    const movementY = worldY - previousY;

    if (movementX !== 0 || movementY !== 0) {
      const angle = Math.atan2(movementY, movementX) * (180 / Math.PI);
      ship.style.transform = `rotate(${angle}deg)`;
    }

    updateCamera();
    updateZoneIndicator();
    updateProximity();

    requestAnimationFrame(moveShip);
  };

  const createSpaceObject = (data) => {
    const element = document.createElement("div");
    const image = document.createElement("img");
    const visual = document.createElement("span");
    const name = document.createElement("span");
    const discoveryMark = document.createElement("span");

    element.className = `space-object object-${data.id}`;
    element.setAttribute("aria-label", data.name);
    element.setAttribute("role", "img");
    element.dataset.zone = data.zone;
    element.style.left = `${data.x}px`;
    element.style.top = `${data.y}px`;

    image.className = "space-object-image";
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.hidden = true;
    visual.className = "space-object-visual";
    visual.setAttribute("aria-hidden", "true");
    name.className = "space-object-name";
    name.textContent = data.name;
    discoveryMark.className = "discovery-mark";
    discoveryMark.textContent = " ✓";
    discoveryMark.hidden = true;
    image.onload = () => {
      image.hidden = false;
      visual.hidden = true;
      element.classList.add("has-image");
    };
    image.onerror = () => {
      image.hidden = true;
      visual.hidden = false;
      console.warn(`No se pudo cargar la imagen del objeto ${data.name}: ${data.image}`);
    };
    name.appendChild(discoveryMark);
    element.append(image, visual, name);
    if (data.image) {
      image.src = data.image;
    }
    world.insertBefore(element, ship);

    return {
      type: "object",
      element,
      data,
      x: data.x + 45,
      y: data.y + 20,
      radius: 0,
      discoveryMark,
    };
  };

  const createPlanetInteractable = (data) => {
    const element = Array.from(world.querySelectorAll("[data-planet-id]"))
      .find((planet) => planet.dataset.planetId === data.id);

    if (!element) {
      console.error(`No existe un elemento visual para el planeta ${data.name} (${data.id}).`);
      return null;
    }

    element.style.setProperty("--planet-x", `${data.x}px`);
    element.style.setProperty("--planet-y", `${data.y}px`);
    element.setAttribute("aria-label", data.name);
    const name = element.querySelector(".planet-name");
    if (name) {
      name.textContent = data.name;
    }
    const discoveryMark = document.createElement("span");
    discoveryMark.className = "discovery-mark";
    discoveryMark.textContent = " ✓";
    discoveryMark.hidden = true;
    name?.appendChild(discoveryMark);

    const image = element.querySelector(".planet-image");
    if (image && data.image) {
      image.onload = () => {
        image.hidden = false;
      };
      image.onerror = () => {
        image.hidden = true;
        console.warn(`No se pudo cargar la imagen del planeta ${data.name}: ${data.image}`);
      };
      image.src = data.image;
    }

    return {
      type: "planet",
      element,
      data,
      x: element.offsetLeft + element.offsetWidth / 2,
      y: element.offsetTop + element.offsetHeight / 2,
      radius: Math.min(element.offsetWidth, element.offsetHeight) / 2,
      discoveryMark,
    };
  };

  const loadSpaceObjects = async () => {
    try {
      const response = await fetch("data/objects.json");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const objects = await response.json();

      if (!Array.isArray(objects) || objects.some((object) =>
        !object ||
        typeof object.id !== "string" ||
        typeof object.name !== "string" ||
        typeof object.zone !== "string" ||
        typeof object.year !== "number" ||
        typeof object.mission !== "string" ||
        typeof object.destination !== "string" ||
        typeof object.highlight !== "string" ||
        typeof object.story !== "string" ||
        (object.image !== undefined && typeof object.image !== "string") ||
        typeof object.x !== "number" ||
        typeof object.y !== "number"
      )) {
        throw new Error("El archivo no contiene una lista válida de objetos espaciales.");
      }

      objectInteractables = objects.map(createSpaceObject);
    } catch (error) {
      console.error("No se pudieron cargar los objetos desde data/objects.json.", error);
    } finally {
      objectsLoaded = true;
      updateDiscoveryIndicators();
      updateProximity();
    }
  };

  const loadPlanets = async () => {
    try {
      const response = await fetch("data/planets.json");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const planets = await response.json();

      if (!Array.isArray(planets) || planets.some((planet) =>
        !planet ||
        typeof planet.id !== "string" ||
        typeof planet.name !== "string" ||
        typeof planet.type !== "string" ||
        typeof planet.image !== "string" ||
        typeof planet.diameter !== "string" ||
        typeof planet.distanceFromSun !== "string" ||
        typeof planet.moons !== "string" ||
        typeof planet.temperature !== "string" ||
        typeof planet.highlight !== "string" ||
        typeof planet.story !== "string" ||
        typeof planet.x !== "number" ||
        typeof planet.y !== "number"
      )) {
        throw new Error("El archivo no contiene una lista válida de planetas.");
      }

      planetInteractables = planets
        .map(createPlanetInteractable)
        .filter((planet) => planet !== null);
    } catch (error) {
      console.error("No se pudieron cargar los planetas desde data/planets.json.", error);
    } finally {
      planetsLoaded = true;
      updateDiscoveryIndicators();
      updateProximity();
    }
  };

  document.addEventListener("keydown", (event) => handleKeyChange(event, true));
  document.addEventListener("keyup", (event) => handleKeyChange(event, false));
  storyCloseButtons.forEach((button) => button.addEventListener("click", closeStory));
  completionContinue?.addEventListener("click", closeCompletionScreen);
  window.addEventListener("resize", () => {
    updateShipPosition(worldX, worldY);
    if (!storyDialog?.open) {
      updateCamera();
      updateZoneIndicator();
      updateProximity();
    }
  });

  generateStars();
  updateCamera();
  updateZoneIndicator();
  updateProximity();
  scene.setAttribute("data-ready", "true");
  loadSpaceObjects();
  loadPlanets();
  loadZoneIntroductions();
  requestAnimationFrame(moveShip);
});
