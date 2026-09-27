(() => {
    const canvas = document.getElementById("surfCanvas");
    const context = canvas.getContext("2d");
    const scoreElement = document.getElementById("score");
    const speedElement = document.getElementById("speed");
    const gameMessage = document.getElementById("gameMessage");
    const startMessage = document.getElementById("startMessage");
    const startButton = document.getElementById("startButton");
    const restartButton = document.getElementById("restartButton");
    const controls = {};
    const keys = new Set();
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let lastTime = 0;
    let animationFrame = 0;
    let gameOver = false;
    let started = false;
    let distance = 0;
    let waveTime = 0;
    let spawnTimer = 0;
    let surfer;
    let obstacles;

    function resize() {
        pixelRatio = Math.min(2, window.devicePixelRatio || 1);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        if (surfer) surfer.y = height * .72;
    }

    function reset(startNow = true) {
        surfer = { x: width / 2, y: height * .72, width: 48, height: 86, tilt: 0, vx: 0 };
        obstacles = [];
        distance = 0;
        spawnTimer = .8;
        waveTime = 0;
        gameOver = false;
        started = startNow;
        gameMessage.hidden = true;
        startMessage.hidden = startNow;
        lastTime = performance.now();
        cancelAnimationFrame(animationFrame);
        render();
        if (startNow) animationFrame = requestAnimationFrame(loop);
    }

    function isPressed(name) {
        return keys.has(name) || controls[name];
    }

    function spawnObstacle() {
        const count = 1 + Math.floor(distance / 240);
        const lanes = Math.min(4, count);
        for (let index = 0; index < lanes; index++) {
            const laneWidth = width / (lanes + 1);
            obstacles.push({
                x: laneWidth * (index + 1) + (Math.random() - .5) * laneWidth * .35,
                y: -50 - Math.random() * 100,
                radius: 14 + Math.random() * 13,
                kind: Math.random() > .45 ? "rock" : "buoy",
                rotation: Math.random() * Math.PI
            });
        }
    }

    function update(delta) {
        const acceleration = isPressed("accelerate") ? 1.45 : 1;
        const braking = isPressed("brake") ? .48 : 1;
        const currentSpeed = 180 * acceleration * braking + Math.min(210, distance * .12);
        const steer = (isPressed("right") ? 1 : 0) - (isPressed("left") ? 1 : 0);
        surfer.vx += steer * 900 * delta;
        surfer.vx *= Math.pow(.001, delta);
        surfer.x += surfer.vx * delta;
        surfer.x = Math.max(34, Math.min(width - 34, surfer.x));
        surfer.tilt += (surfer.vx / 900 - surfer.tilt) * Math.min(1, delta * 8);
        distance += currentSpeed * delta / 10;
        waveTime += delta * currentSpeed * .01;
        spawnTimer -= delta;
        if (spawnTimer <= 0) {
            spawnObstacle();
            spawnTimer = Math.max(.42, 1.25 - distance / 900);
        }

        obstacles.forEach(obstacle => {
            obstacle.y += currentSpeed * delta;
            obstacle.rotation += delta;
        });
        obstacles = obstacles.filter(obstacle => obstacle.y < height + 80);

        for (const obstacle of obstacles) {
            const closeX = Math.abs(obstacle.x - surfer.x) < obstacle.radius + 20;
            const closeY = Math.abs(obstacle.y - surfer.y) < obstacle.radius + 32;
            if (closeX && closeY) endGame();
        }

        scoreElement.textContent = `${Math.floor(distance)} m`;
        speedElement.textContent = (currentSpeed / 180).toFixed(1);
    }

    function drawOcean() {
        const gradient = context.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#78d9d2");
        gradient.addColorStop(.38, "#159bb1");
        gradient.addColorStop(1, "#034e76");
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        context.fillStyle = "rgba(255,224,146,.2)";
        context.beginPath();
        context.arc(width * .84, height * .15, Math.min(width, height) * .13, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "rgba(218,255,248,.22)";
        context.lineWidth = 2;
        for (let row = 0; row < 18; row++) {
            const y = ((row * 76 + waveTime * 120) % (height + 90)) - 45;
            context.beginPath();
            for (let x = -20; x <= width + 20; x += 26) {
                const offset = Math.sin(x * .018 + row + waveTime) * 5;
                if (x === -20) context.moveTo(x, y + offset); else context.lineTo(x, y + offset);
            }
            context.stroke();
        }
    }

    function drawObstacle(obstacle) {
        context.save();
        context.translate(obstacle.x, obstacle.y);
        context.rotate(obstacle.rotation);
        if (obstacle.kind === "rock") {
            context.fillStyle = "#554c48";
            context.beginPath();
            context.moveTo(-obstacle.radius, 10);
            context.lineTo(-obstacle.radius * .65, -obstacle.radius);
            context.lineTo(2, -obstacle.radius * 1.25);
            context.lineTo(obstacle.radius, -obstacle.radius * .25);
            context.lineTo(obstacle.radius * .7, obstacle.radius);
            context.closePath();
            context.fill();
            context.fillStyle = "#8c8171";
            context.beginPath();
            context.arc(-4, -8, obstacle.radius * .35, 0, Math.PI * 2);
            context.fill();
        } else {
            context.fillStyle = "#f06452";
            context.beginPath();
            context.arc(0, 0, obstacle.radius, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = "#fff0b0";
            context.lineWidth = 3;
            context.stroke();
            context.strokeStyle = "rgba(255,255,255,.5)";
            context.beginPath();
            context.moveTo(0, obstacle.radius); context.lineTo(0, obstacle.radius + 25); context.stroke();
        }
        context.restore();
    }

    function drawSurfer() {
        context.save();
        context.translate(surfer.x, surfer.y);
        context.rotate(surfer.tilt);
        context.fillStyle = "rgba(255,255,255,.75)";
        context.beginPath(); context.ellipse(0, 27, 43, 8, -.12, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#f5b24d";
        context.beginPath(); context.ellipse(0, 22, 38, 6, -.12, 0, Math.PI * 2); context.fill();
        context.strokeStyle = "#9c4c4c"; context.lineWidth = 6;
        context.beginPath(); context.moveTo(-8, 10); context.lineTo(-15, 29); context.moveTo(8, 10); context.lineTo(15, 29); context.stroke();
        context.fillStyle = "#f0a47d";
        context.beginPath(); context.arc(0, -25, 11, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#302a36";
        context.beginPath(); context.arc(-1, -29, 13, Math.PI, Math.PI * 2); context.fill();
        context.fillStyle = "#e55f72";
        context.beginPath(); context.ellipse(0, -7, 12, 19, 0, 0, Math.PI * 2); context.fill();
        context.strokeStyle = "#f0a47d"; context.lineWidth = 5;
        context.beginPath(); context.moveTo(-8, -9); context.lineTo(-25, 3); context.moveTo(8, -9); context.lineTo(24, -1); context.stroke();
        context.restore();
    }

    function render() {
        drawOcean();
        obstacles.forEach(drawObstacle);
        drawSurfer();
    }

    function endGame() {
        if (gameOver) return;
        gameOver = true;
        document.getElementById("messageTitle").textContent = "Wipeout";
        document.getElementById("messageText").textContent = `You surfed ${Math.floor(distance)} metres.`;
        gameMessage.hidden = false;
    }

    function retryVarkala() {
        const retries = Number.parseInt(localStorage.getItem("varkalaRetries") || "0", 10) + 1;
        localStorage.setItem("varkalaRetries", String(retries));
        if (retries >= 3) {
            window.location.href = window.BHANG_URL;
            return;
        }
        reset(true);
    }

    function loop(time) {
        if (gameOver) return;
        const delta = Math.min(.035, (time - lastTime) / 1000);
        lastTime = time;
        update(delta);
        render();
        animationFrame = requestAnimationFrame(loop);
    }

    document.querySelectorAll("[data-control]").forEach(button => {
        const name = button.dataset.control;
        button.addEventListener("pointerdown", event => { event.preventDefault(); controls[name] = true; button.classList.add("active"); });
        ["pointerup", "pointercancel", "pointerleave"].forEach(type => button.addEventListener(type, () => { controls[name] = false; button.classList.remove("active"); }));
    });
    window.addEventListener("keydown", event => {
        const map = { ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right", ArrowUp: "accelerate", w: "accelerate", ArrowDown: "brake", s: "brake" };
        if (map[event.key]) { keys.add(map[event.key]); event.preventDefault(); }
    });
    window.addEventListener("keyup", event => {
        const map = { ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right", ArrowUp: "accelerate", w: "accelerate", ArrowDown: "brake", s: "brake" };
        if (map[event.key]) keys.delete(map[event.key]);
    });
    restartButton.addEventListener("click", retryVarkala);
    startButton.addEventListener("click", () => reset(true));
    window.addEventListener("resize", resize);
    resize();
    reset(false);
})();