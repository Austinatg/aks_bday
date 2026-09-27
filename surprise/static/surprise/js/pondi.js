(() => {
    const canvas = document.getElementById("pondiCanvas");
    const context = canvas.getContext("2d");
    const story = document.getElementById("story");
    const storyLines = [...document.querySelectorAll(".story-line")];
    const finish = document.getElementById("finish");
    const doorCompass = document.getElementById("doorCompass");
    const compassArrow = document.getElementById("compassArrow");
    const compassText = document.getElementById("compassText");
    const keys = new Set();
    const pointer = { x: 0, y: 0, down: false };
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let lastTime = 0;
    let animationFrame = 0;
    let storyDone = false;
    let won = false;
    let phase = "bus";
    let player = { x: 0, z: 0, vx: 0, vz: 0 };
    let wobble = 0;
    let heading = 0;
    let exitTimer = 10;
    let exitDoor = { x: -3, z: 10 };
    let turnTimer = 15;
    let gameElapsed = 0;
    let washroom = { x: -2.4, z: 18 };
    const insects = Array.from({ length: 15 }, (_, index) => ({
        x: (Math.random() - .5) * 7,
        z: 2 + Math.random() * 17,
        drift: Math.random() * Math.PI * 2,
        size: 2 + (index % 3)
    }));

    function resize() {
        pixelRatio = Math.min(2, window.devicePixelRatio || 1);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function showStory(index) {
        storyLines[index].classList.add("visible");
    }

    function fadeStory(index) {
        storyLines[index].classList.remove("visible");
        storyLines[index].classList.add("fade-out");
    }

    function startStory() {
        showStory(0);
        setTimeout(() => fadeStory(0), 2600);
        setTimeout(() => showStory(1), 3400);
        setTimeout(() => fadeStory(1), 6000);
        setTimeout(() => showStory(2), 6800);
        setTimeout(() => fadeStory(2), 9400);
        setTimeout(() => {
            story.classList.add("hidden");
            storyDone = true;
            lastTime = performance.now();
        }, 10600);
    }

    function pressed(name) {
        return keys.has(name);
    }

    function update(delta) {
        if (!storyDone || won) return;
        const forward = (pressed("ArrowUp") || pressed("w") ? 1 : 0) - (pressed("ArrowDown") || pressed("s") ? .7 : 0);
        const sideways = (pressed("ArrowRight") || pressed("d") ? 1 : 0) - (pressed("ArrowLeft") || pressed("a") ? 1 : 0);
        player.vz += forward * 5.2 * delta;
        player.vz *= Math.pow(.04, delta);
        player.vz = Math.max(-1.5, Math.min(2.6, player.vz));
        player.vx += sideways * 4.8 * delta;
        player.vx *= Math.pow(.025, delta);
        const forwardX = Math.sin(heading);
        const forwardZ = Math.cos(heading);
        const rightX = Math.cos(heading);
        const rightZ = -Math.sin(heading);
        player.x += (forwardX * player.vz + rightX * player.vx) * delta;
        player.z += (forwardZ * player.vz + rightZ * player.vx) * delta;
        wobble += delta * (2.5 + Math.abs(player.vz) * 1.8);
        gameElapsed += delta;
        exitTimer -= delta;
        turnTimer -= delta;
        if (turnTimer <= 0) {
            const turns = [-Math.PI / 2, Math.PI / 2, Math.PI];
            heading += turns[Math.floor(Math.random() * turns.length)];
            player.vz = 0;
            player.vx = 0;
            turnTimer = 15;
        }
        if (exitTimer <= 0 && phase === "bus" && gameElapsed < 60) {
            const distance = 8 + Math.random() * 8;
            const angle = Math.random() * Math.PI * 2;
            exitDoor = { x: player.x + Math.cos(angle) * distance, z: player.z + Math.sin(angle) * distance };
            exitTimer = 10;
        }
        if (gameElapsed >= 90) {
            doorCompass.hidden = false;
            updateCompass();
        }
        insects.forEach(insect => {
            insect.z -= player.vz * delta * .75;
            insect.drift += delta * (1.5 + insect.size * .2);
            if (insect.z < .8) {
                insect.z = 14 + Math.random() * 9;
                insect.x = (Math.random() - .5) * 7;
            }
        });

        if (phase === "bus" && Math.hypot(player.x - exitDoor.x, player.z - exitDoor.z) < 1.35) {
            phase = "outside";
            const forwardX = Math.sin(heading);
            const forwardZ = Math.cos(heading);
            washroom = { x: player.x + forwardX * 9, z: player.z + forwardZ * 9 };
        }
        if (phase === "outside" && Math.hypot(player.x - washroom.x, player.z - washroom.z) < 1.35) {
            won = true;
            finish.hidden = false;
            setTimeout(() => {
                window.location.href = window.RED_WEDDING_URL;
            }, 2200);
        }
    }

    function updateCompass() {
        const deltaX = exitDoor.x - player.x;
        const deltaZ = exitDoor.z - player.z;
        const forward = deltaX * Math.sin(heading) + deltaZ * Math.cos(heading);
        const right = deltaX * Math.cos(heading) - deltaZ * Math.sin(heading);
        const angle = Math.atan2(right, forward) * 180 / Math.PI;
        const absoluteAngle = Math.abs(angle);
        let direction = "FRONT";
        if (absoluteAngle >= 157.5) direction = "BACK";
        else if (absoluteAngle >= 112.5) direction = angle > 0 ? "BACK-RIGHT" : "BACK-LEFT";
        else if (absoluteAngle >= 67.5) direction = angle > 0 ? "RIGHT" : "LEFT";
        else if (absoluteAngle >= 22.5) direction = angle > 0 ? "FRONT-RIGHT" : "FRONT-LEFT";
        compassArrow.style.transform = `rotate(${angle}deg)`;
        compassText.textContent = direction;
    }

    function perspective(depth) {
        return Math.max(.045, 1 / Math.max(.5, depth));
    }

    function project(worldX, worldZ) {
        const depth = worldZ - player.z;
        const scale = perspective(depth);
        return {
            x: width / 2 + (worldX - player.x) * width * .18 * scale,
            y: height * .42 + scale * height * .58,
            scale,
            depth
        };
    }

    function drawBus() {
        const gradient = context.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#24343c");
        gradient.addColorStop(.46, "#182a31");
        gradient.addColorStop(1, "#72534b");
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
        context.fillStyle = "rgba(216,244,230,.2)";
        context.fillRect(width * .46, height * .13, width * .08, height * .08);
        context.fillStyle = "#d5e5ce";
        context.font = "bold 13px Arial";
        context.textAlign = "center";
        context.fillText("EXIT", width / 2, height * .18);

        context.fillStyle = "#372d2d";
        context.beginPath(); context.moveTo(0, height); context.lineTo(width * .4, height * .42); context.lineTo(width * .6, height * .42); context.lineTo(width, height); context.fill();
        context.strokeStyle = "rgba(232,193,144,.25)";
        context.lineWidth = 3;
        context.beginPath(); context.moveTo(width * .4, height); context.lineTo(width * .49, height * .42); context.moveTo(width * .6, height); context.lineTo(width * .51, height * .42); context.stroke();
        for (let row = 1; row < 7; row++) {
            const z = player.z + row * 1.8;
            const scale = perspective(z - player.z);
            const y = height * .42 + scale * height * .58;
            const seatWidth = 85 * scale;
            const seatHeight = 50 * scale;
            context.fillStyle = "#563e3a";
            context.fillRect(width / 2 - width * .18 * scale - seatWidth, y - seatHeight, seatWidth, seatHeight);
            context.fillRect(width / 2 + width * .18 * scale, y - seatHeight, seatWidth, seatHeight);
        }
        if (player.z > 6) {
            const exit = project(exitDoor.x, exitDoor.z);
            const doorWidth = Math.max(40, 150 * exit.scale);
            const doorHeight = Math.max(70, 280 * exit.scale);
            context.fillStyle = "rgba(157,211,193,.7)";
            context.fillRect(exit.x - doorWidth / 2, exit.y - doorHeight, doorWidth, doorHeight);
            context.fillStyle = "rgba(245,255,237,.75)";
            context.font = `${Math.max(9, 18 * exit.scale)}px Arial`;
            context.fillText("OUT", exit.x, exit.y - doorHeight - 10);
        }
    }

    function drawOutside() {
        const sky = context.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, "#d39f7b"); sky.addColorStop(.45, "#5d9c9d"); sky.addColorStop(1, "#1f5866");
        context.fillStyle = sky; context.fillRect(0, 0, width, height);
        context.fillStyle = "rgba(255,220,152,.45)";
        context.beginPath(); context.arc(width * .78, height * .2, 54, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#a77759";
        context.beginPath(); context.moveTo(0, height); context.lineTo(width * .36, height * .45); context.lineTo(width * .63, height * .45); context.lineTo(width, height); context.fill();
        context.strokeStyle = "rgba(222,249,223,.3)"; context.lineWidth = 2;
        for (let row = 0; row < 12; row++) {
            const y = (row * 58 + wobble * 18) % height;
            context.beginPath(); context.moveTo(0, y); context.quadraticCurveTo(width / 2, y - 13, width, y); context.stroke();
        }
        const washroomView = project(washroom.x, washroom.z);
        if (washroomView.depth > .3) {
            const signWidth = Math.max(52, 160 * washroomView.scale);
            const signHeight = Math.max(30, 65 * washroomView.scale);
            context.fillStyle = "#e9d4a7";
            context.fillRect(washroomView.x - signWidth / 2, washroomView.y - signHeight - 90 * washroomView.scale, signWidth, signHeight);
            context.fillStyle = "#25463f";
            context.font = `${Math.max(10, 18 * washroomView.scale)}px Arial`;
            context.textAlign = "center";
            context.fillText("WASHROOM", washroomView.x, washroomView.y - signHeight / 2 - 90 * washroomView.scale + 5);
        }
    }

    function drawInsects() {
        insects.forEach(insect => {
            const position = project(insect.x + Math.sin(insect.drift) * .12, player.z + insect.z);
            if (position.depth < .35 || position.depth > 22) return;
            const size = Math.max(1.5, insect.size * position.scale * 2.2);
            const y = position.y - 22 * position.scale + Math.cos(insect.drift * 1.4) * 8;
            context.save();
            context.translate(position.x, y);
            context.fillStyle = "rgba(25,18,19,.86)";
            context.beginPath(); context.ellipse(0, 0, size, size * .6, 0, 0, Math.PI * 2); context.fill();
            context.strokeStyle = "rgba(222,245,224,.62)";
            context.lineWidth = Math.max(1, size * .45);
            context.beginPath(); context.moveTo(-size * .4, 0); context.lineTo(-size * 1.6, -size); context.moveTo(size * .4, 0); context.lineTo(size * 1.6, -size); context.stroke();
            context.restore();
        });
    }

    function render() {
        const shake = storyDone && !won ? Math.sin(wobble * 5.5) * 11 + Math.sin(wobble * 11) * 3 : 0;
        context.save();
        context.translate(width / 2 + shake, height / 2 + Math.cos(wobble * 4.2) * 5);
        context.rotate(-heading + (storyDone && !won ? Math.sin(wobble * 3.8) * .035 : 0));
        context.translate(-width / 2, -height / 2);
        context.filter = storyDone && !won ? `blur(${1.1 + Math.abs(Math.sin(wobble)) * 1.5}px)` : "none";
        if (phase === "bus") drawBus(); else drawOutside();
        drawInsects();
        context.restore();
        context.fillStyle = "rgba(2,8,12,.18)";
        context.fillRect(0, 0, width, height);
    }

    function loop(time) {
        const delta = Math.min(.04, (time - lastTime) / 1000);
        lastTime = time;
        update(delta);
        render();
        animationFrame = requestAnimationFrame(loop);
    }

    window.addEventListener("keydown", event => {
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        keys.add(key);
        if (key === "r" && !event.repeat) {
            heading += Math.PI;
            player.vz = 0;
            player.vx = 0;
        }
        if ((key === "q" || key === "e") && !event.repeat) {
            heading += key === "q" ? -Math.PI / 2 : Math.PI / 2;
            player.vz = 0;
            player.vx = 0;
        }
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "q", "e", "r"].includes(key)) event.preventDefault();
    });
    window.addEventListener("keyup", event => {
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        keys.delete(key);
    });
    document.querySelectorAll("[data-phone-control]").forEach(button => {
        const control = button.dataset.phoneControl;
        const key = { forward: "ArrowUp", back: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" }[control];
        const press = event => { event.preventDefault(); keys.add(key); button.classList.add("active"); };
        const release = () => { keys.delete(key); button.classList.remove("active"); };
        button.addEventListener("pointerdown", press);
        ["pointerup", "pointercancel", "pointerleave"].forEach(type => button.addEventListener(type, release));
    });
    document.querySelectorAll("[data-phone-turn]").forEach(button => {
        button.addEventListener("pointerdown", event => {
            event.preventDefault();
            const turn = button.dataset.phoneTurn;
            heading += turn === "left" ? -Math.PI / 2 : turn === "right" ? Math.PI / 2 : Math.PI;
            player.vz = 0;
            player.vx = 0;
            button.classList.add("active");
            setTimeout(() => button.classList.remove("active"), 180);
        });
    });
    canvas.addEventListener("pointerdown", event => { pointer.down = true; pointer.x = event.clientX; pointer.y = event.clientY; });
    canvas.addEventListener("pointerup", event => {
        if (!pointer.down) return;
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 18) keys.add(dx > 0 ? "ArrowRight" : "ArrowLeft");
        else if (dy < -18) keys.add("ArrowUp");
        setTimeout(() => { keys.delete("ArrowUp"); keys.delete("ArrowLeft"); keys.delete("ArrowRight"); }, 260);
        pointer.down = false;
    });
    window.addEventListener("resize", resize);
    resize();
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(loop);
    startStory();
})();