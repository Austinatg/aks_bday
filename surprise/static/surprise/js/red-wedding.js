(() => {
    const grid = document.getElementById("memoryGrid");
    const lever = document.getElementById("lever");
    const leverState = document.getElementById("leverState");
    const hairFill = document.getElementById("hairFill");
    const timerElement = document.getElementById("timer");
    const spentElements = {
        green: document.getElementById("greenSpent"),
        yellow: document.getElementById("yellowSpent"),
        red: document.getElementById("redSpent")
    };
    const pairsFound = document.getElementById("pairsFound");
    const status = document.getElementById("gameStatus");
    const woman = document.getElementById("woman");
    const womanStatus = document.getElementById("womanStatus");
    const endMessage = document.getElementById("endMessage");
    const endTitle = document.getElementById("endTitle");
    const endText = document.getElementById("endText");
    const playAgain = document.getElementById("playAgain");
    const symbols = ["🌹", "💍", "👠", "💄", "🪞", "✨", "🦋", "🎀"];
    let cards = [];
    let flipped = [];
    let matched = 0;
    let locked = false;
    const zoneRemaining = { green: 49, yellow: 27, red: 7 };
    const zoneMaximum = { green: 49, yellow: 27, red: 7 };
    let zoneOrder = ["red", "yellow", "green"];
    const zoneSpent = { green: 0, yellow: 0, red: 0 };
    let lastTick = performance.now();
    let finished = false;
    let randomLeverTimer = 5;

    function shufflePipe() {
        zoneOrder = ["green", "yellow", "red"].sort(() => Math.random() - .5);
        zoneOrder.forEach((zone, index) => {
            const label = document.querySelector(`.${zone}-time`);
            label.style.top = `${index * 33.33 + 16.66}%`;
            label.textContent = `${zoneMaximum[zone]}s`;
        });
    }

    function buildCards() {
        cards = [...symbols, ...symbols].sort(() => Math.random() - .5);
        grid.innerHTML = "";
        cards.forEach((symbol, index) => {
            const card = document.createElement("button");
            card.className = "memory-card";
            card.type = "button";
            card.dataset.symbol = symbol;
            card.dataset.index = index;
            card.setAttribute("aria-label", "Face-down memory card");
            card.textContent = symbol;
            card.addEventListener("click", () => flipCard(card));
            grid.appendChild(card);
        });
    }

    function flipCard(card) {
        if (locked || finished || card.classList.contains("flipped") || card.classList.contains("matched")) return;
        card.classList.add("flipped");
        flipped.push(card);
        if (flipped.length < 2) return;

        locked = true;
        if (flipped[0].dataset.symbol === flipped[1].dataset.symbol) {
            flipped.forEach(item => item.classList.add("matched"));
            matched++;
            pairsFound.textContent = `${matched} / 8`;
            flipped = [];
            locked = false;
            if (matched === 8) finishGame(true);
        } else {
            setTimeout(() => {
                flipped.forEach(item => item.classList.remove("flipped"));
                flipped = [];
                locked = false;
            }, 750);
        }
    }

    function updateLever() {
        const zone = getZone();
        if (zone === "green") {
            leverState.textContent = "GREEN";
            leverState.style.color = "#559d6b";
            status.textContent = "Good. Keep the heat steady while you remember.";
        } else if (zone === "yellow") {
            leverState.textContent = "YELLOW";
            leverState.style.color = "#b88925";
            status.textContent = `Warning: yellow heat has ${Math.ceil(zoneRemaining.yellow)} seconds left.`;
        } else {
            leverState.textContent = "RED";
            leverState.style.color = "#bf394c";
            status.textContent = `Warning: red heat has ${Math.ceil(zoneRemaining.red)} seconds left.`;
        }
    }

    function getZone() {
        const value = Number(lever.value);
        return zoneOrder[Math.min(2, Math.floor(value / 33.34))];
    }

    function finishGame(success) {
        finished = true;
        endMessage.hidden = false;
        if (success) {
            woman.classList.add("straight");
            endTitle.textContent = "Beautifully done.";
            endText.textContent = "Her curls are straight, and every pair is remembered.";
            setTimeout(() => {
                window.location.href = window.FINAL_BIRTHDAY_URL;
            }, 2200);
        } else {
            woman.classList.add("hair-gone");
            endTitle.textContent = "The hair is gone.";
            endText.textContent = "The heat escaped before the memory puzzle was complete.";
        }
    }

    function updateTimer(time) {
        if (finished) return;
        const delta = Math.min(.25, (time - lastTick) / 1000);
        lastTick = time;
        randomLeverTimer -= delta;
        if (randomLeverTimer <= 0) {
            shufflePipe();
            lever.value = String(Math.floor(Math.random() * 101));
            updateLever();
            randomLeverTimer = 5;
        }
        const zone = getZone();
        zoneSpent[zone] += delta;
        zoneRemaining[zone] = Math.max(0, zoneRemaining[zone] - delta);
        hairFill.style.transform = `scaleX(${zoneRemaining[zone] / zoneMaximum[zone]})`;
        timerElement.textContent = `${Math.ceil(zoneRemaining[zone])}s`;
        Object.keys(zoneSpent).forEach(name => {
            spentElements[name].textContent = `${Math.floor(zoneSpent[name])}s`;
        });
        updateLever();

        if (zone === "green") womanStatus.textContent = "The curls are holding in the green.";
        else if (zone === "yellow") womanStatus.textContent = "Yellow warning: move the lever back to green.";
        else womanStatus.textContent = "Red warning: the hair will be gone in 15 seconds.";

        if (zoneRemaining[zone] <= 0) {
            if (zone === "green") {
                lever.value = "44";
                status.textContent = "Green time finished. The lever slipped into yellow.";
            } else if (zone === "yellow") {
                lever.value = "12";
                status.textContent = "Yellow time finished. The lever dropped into red.";
            } else {
                finishGame(false);
            }
        }
        requestAnimationFrame(updateTimer);
    }

    lever.addEventListener("input", updateLever);
    playAgain.addEventListener("click", () => window.location.reload());
    buildCards();
    shufflePipe();
    updateLever();
    requestAnimationFrame(updateTimer);
})();