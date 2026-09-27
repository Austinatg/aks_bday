(() => {
    const arena = document.getElementById("arena");
    const sticks = [...document.querySelectorAll(".stick")];
    const yesBtn = document.getElementById("yesBtn");
    const noBtn = document.getElementById("noBtn");
    const status = document.getElementById("status");
    const instruction = document.getElementById("instruction");
    const lockedMessage = document.getElementById("lockedMessage");
    const toast = document.getElementById("toast");
    const trapOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const trapPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

    trapOverlay.classList.add("trap-overlay");
    trapOverlay.appendChild(trapPolygon);
    arena.prepend(trapOverlay);

    let locked = false;
    let dragging = null;
    let offsetX = 0;
    let offsetY = 0;
    let touchPointerId = null;

    const state = sticks.map((el, i) => ({
        x: 80 + Math.random() * 65 + (i % 2) * 350,
        y: 95 + Math.random() * 230 + Math.floor(i / 2) * 25,
        angle: Math.random() * 360,
    }));

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function renderStick(i) {
        const s = state[i];
        sticks[i].style.left = `${s.x}px`;
        sticks[i].style.top = `${s.y}px`;
        sticks[i].style.transform = `rotate(${s.angle}deg)`;
    }

    function randomizeInitialPositions() {
        const w = arena.clientWidth;
        const h = arena.clientHeight;
        const stickWidth = sticks[0].offsetWidth;

        state.forEach((s, i) => {
            s.x = clamp(Math.random() * (w - stickWidth), 20, Math.max(20, w - stickWidth));
            s.y = clamp(70 + Math.random() * Math.max(40, h - 120), 55, Math.max(55, h - 50));
            s.angle = Math.random() * 360;
            renderStick(i);
        });
    }

    function centerOfStick(i) {
        const el = sticks[i];
        const s = state[i];
        const length = el.offsetWidth;
        const rad = s.angle * Math.PI / 180;
        return {
            x: s.x + length / 2,
            y: s.y + el.offsetHeight / 2,
            dx: Math.cos(rad),
            dy: Math.sin(rad),
            length
        };
    }

    // Each stick is represented by its two endpoints.
    function endpoints(i) {
        const c = centerOfStick(i);
        return [
            { x: c.x - c.dx * c.length / 2, y: c.y - c.dy * c.length / 2 },
            { x: c.x + c.dx * c.length / 2, y: c.y + c.dy * c.length / 2 }
        ];
    }

    function distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function orientation(a, b, c) {
        return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    }

    function onSegment(a, b, point) {
        return point.x >= Math.min(a.x, b.x) && point.x <= Math.max(a.x, b.x) &&
            point.y >= Math.min(a.y, b.y) && point.y <= Math.max(a.y, b.y);
    }

    function segmentsIntersect(a, b, c, d) {
        const abC = orientation(a, b, c);
        const abD = orientation(a, b, d);
        const cdA = orientation(c, d, a);
        const cdB = orientation(c, d, b);
        const epsilon = 0.001;

        if (Math.abs(abC) < epsilon && onSegment(a, b, c)) return true;
        if (Math.abs(abD) < epsilon && onSegment(a, b, d)) return true;
        if (Math.abs(cdA) < epsilon && onSegment(c, d, a)) return true;
        if (Math.abs(cdB) < epsilon && onSegment(c, d, b)) return true;
        return (abC > 0) !== (abD > 0) && (cdA > 0) !== (cdB > 0);
    }

    function pointToSegmentDistance(point, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;
        const projection = lengthSquared === 0
            ? 0
            : clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
        return distance(point, {
            x: start.x + projection * dx,
            y: start.y + projection * dy
        });
    }

    function stickIntersectsButton(index, x, y, width, height) {
        const stickEnds = endpoints(index);
        const padding = sticks[index].offsetHeight / 2 + 2;
        const left = x - padding;
        const right = x + width + padding;
        const top = y - padding;
        const bottom = y + height + padding;
        const corners = [
            { x: left, y: top },
            { x: right, y: top },
            { x: right, y: bottom },
            { x: left, y: bottom }
        ];

        for (let i = 0; i < corners.length; i++) {
            const next = corners[(i + 1) % corners.length];
            if (segmentsIntersect(stickEnds[0], stickEnds[1], corners[i], next)) return true;
        }

        return corners.some(corner => pointToSegmentDistance(corner, stickEnds[0], stickEnds[1]) <= padding);
    }

    function buttonHitsStick(button, x, y) {
        return sticks.some((_, i) => stickIntersectsButton(
            i,
            x,
            y,
            button.offsetWidth,
            button.offsetHeight
        ));
    }

    function buttonPathHitsStick(button, startX, startY, endX, endY) {
        const distanceTravelled = Math.hypot(endX - startX, endY - startY);
        const steps = Math.max(1, Math.ceil(distanceTravelled / 8));

        for (let step = 1; step <= steps; step++) {
            const progress = step / steps;
            const x = startX + (endX - startX) * progress;
            const y = startY + (endY - startY) * progress;
            if (buttonHitsStick(button, x, y)) return true;
        }
        return false;
    }

    function pointInPolygon(point, polygon) {
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const current = polygon[i];
            const previous = polygon[j];
            const crossesEdge = (current.y > point.y) !== (previous.y > point.y);
            const edgeX = (previous.x - current.x) * (point.y - current.y) /
                (previous.y - current.y) + current.x;

            if (crossesEdge && point.x < edgeX) inside = !inside;
        }

        return inside;
    }

    function buttonInsideShape(button, x, y, shape) {
        const width = button.offsetWidth;
        const height = button.offsetHeight;
        return [
            { x, y },
            { x: x + width, y },
            { x: x + width, y: y + height },
            { x, y: y + height }
        ].every(corner => pointInPolygon(corner, shape));
    }

    function renderTrapArea(shape) {
        if (!shape) {
            trapPolygon.removeAttribute("points");
            trapOverlay.style.display = "none";
            return;
        }

        trapOverlay.setAttribute("viewBox", `0 0 ${arena.clientWidth} ${arena.clientHeight}`);
        trapPolygon.setAttribute("points", shape.map(point => `${point.x},${point.y}`).join(" "));
        trapOverlay.style.display = "block";
    }

    function closedShapePoints() {
        const stickSegments = sticks.map((_, i) => {
            const points = endpoints(i);
            return { a: points[0], b: points[1], isStick: true };
        });
        const width = arena.clientWidth;
        const height = arena.clientHeight;
        const borderSegments = [
            { a: { x: 0, y: 0 }, b: { x: width, y: 0 }, isStick: false },
            { a: { x: width, y: 0 }, b: { x: width, y: height }, isStick: false },
            { a: { x: width, y: height }, b: { x: 0, y: height }, isStick: false },
            { a: { x: 0, y: height }, b: { x: 0, y: 0 }, isStick: false }
        ];
        const segments = [...stickSegments, ...borderSegments];
        const tolerance = Math.max(48, arena.clientWidth * 0.08);

        function findLoop(path, used) {
            if (path.length >= 3 && distance(path[path.length - 1].b, path[0].a) <= tolerance) {
                if (path.some(segment => segment.isStick)) {
                    return path.map(segment => segment.a);
                }
            }

            if (path.length === 5) {
                return null;
            }

            const currentEnd = path[path.length - 1].b;
            for (let index = 0; index < segments.length; index++) {
                if (used.has(index)) continue;

                const segment = segments[index];
                for (const oriented of [
                    { a: segment.a, b: segment.b, isStick: segment.isStick },
                    { a: segment.b, b: segment.a, isStick: segment.isStick }
                ]) {
                    if (distance(currentEnd, oriented.a) > tolerance) continue;

                    const nextUsed = new Set(used);
                    nextUsed.add(index);
                    const result = findLoop([...path, oriented], nextUsed);
                    if (result) return result;
                }
            }

            return null;
        }

        for (let index = 0; index < stickSegments.length; index++) {
            const segment = segments[index];
            for (const oriented of [
                { a: segment.a, b: segment.b, isStick: true },
                { a: segment.b, b: segment.a, isStick: true }
            ]) {
                const result = findLoop([oriented], new Set([index]));
                if (result) return result;
            }
        }

        return null;
    }

    function hasBoundaryBarrier() {
        const tolerance = Math.max(48, arena.clientWidth * 0.08);
        const points = sticks.flatMap((_, index) => endpoints(index));
        const parent = points.map((_, index) => index);

        function find(index) {
            while (parent[index] !== index) {
                parent[index] = parent[parent[index]];
                index = parent[index];
            }
            return index;
        }

        function join(first, second) {
            const firstRoot = find(first);
            const secondRoot = find(second);
            if (firstRoot !== secondRoot) parent[secondRoot] = firstRoot;
        }

        for (let index = 0; index < sticks.length; index++) {
            join(index * 2, index * 2 + 1);
        }

        for (let first = 0; first < points.length; first++) {
            for (let second = first + 1; second < points.length; second++) {
                if (distance(points[first], points[second]) <= tolerance) {
                    join(first, second);
                }
            }
        }

        const width = arena.clientWidth;
        const height = arena.clientHeight;
        const componentSides = new Map();

        points.forEach((point, index) => {
            const sides = [];
            if (point.x <= tolerance) sides.push("left");
            if (point.x >= width - tolerance) sides.push("right");
            if (point.y <= tolerance) sides.push("top");
            if (point.y >= height - tolerance) sides.push("bottom");

            const root = find(index);
            const knownSides = componentSides.get(root) || new Set();
            sides.forEach(side => knownSides.add(side));
            componentSides.set(root, knownSides);
        });

        return [...componentSides.values()].some(sides => sides.size >= 2);
    }

    function isButtonEnclosed(button) {
        const shape = closedShapePoints();
        if (!shape) return false;

        const rect = button.getBoundingClientRect();
        const arenaRect = arena.getBoundingClientRect();
        return buttonInsideShape(
            button,
            rect.left - arenaRect.left,
            rect.top - arenaRect.top,
            shape
        );
    }

    function teleportButton(button, mouseX, mouseY) {
        const width = button.offsetWidth;
        const height = button.offsetHeight;
        const minX = 8;
        const maxX = Math.max(minX, arena.clientWidth - width - 8);
        const minY = 55;
        const maxY = Math.max(minY, arena.clientHeight - height - 8);

        for (let attempt = 0; attempt < 80; attempt++) {
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);
            const centerDistance = Math.hypot(x + width / 2 - mouseX, y + height / 2 - mouseY);

            if (centerDistance > 150 && !buttonHitsStick(button, x, y)) {
                button.style.left = `${x}px`;
                button.style.top = `${y}px`;
                return;
            }
        }
    }

    // The four sticks form a closed shape when consecutive endpoints are
    // close enough to touch. We try all endpoint pairings because sticks
    // may be arranged clockwise or anticlockwise.
    function isClosedShape() {
        return Boolean(closedShapePoints());
    }

    function updatePuzzleState() {
        if (locked) return;

        renderTrapArea(closedShapePoints());

        if (isClosedShape() && isButtonEnclosed(yesBtn) && isButtonEnclosed(noBtn)) {
            locked = true;
            sticks.forEach(s => s.classList.remove("dragging"));
            instruction.style.opacity = "0";
            instruction.style.pointerEvents = "none";
            lockedMessage.style.display = "block";
            status.textContent = "Perfect! The buttons are trapped. Choose carefully. 💕";
            yesBtn.classList.add("locked");
            noBtn.classList.add("locked");
        } else {
            status.textContent = "Move and rotate all four sticks until they make a closed shape.";
        }
    }

    function moveButtonAway(button, mouseX, mouseY) {
        if (locked) return;

        const arenaRect = arena.getBoundingClientRect();
        const rect = button.getBoundingClientRect();
        const bx = rect.left - arenaRect.left + rect.width / 2;
        const by = rect.top - arenaRect.top + rect.height / 2;

        const dx = bx - mouseX;
        const dy = by - mouseY;
        const dist = Math.hypot(dx, dy);

        if (dist > 135) return;

        const angle = Math.atan2(dy, dx);
        const push = 120 + (135 - dist) * 1.25;

        const currentX = rect.left - arenaRect.left;
        const currentY = rect.top - arenaRect.top;
        let newX = currentX + Math.cos(angle) * push;
        let newY = currentY + Math.sin(angle) * push;

        const shape = closedShapePoints();
        if (shape && buttonInsideShape(button, currentX, currentY, shape)) return;

        newX = clamp(newX, 8, arena.clientWidth - rect.width - 8);
        newY = clamp(newY, 55, arena.clientHeight - rect.height - 8);

        if (buttonPathHitsStick(button, currentX, currentY, newX, newY)) {
            if (isButtonEnclosed(button)) return;

            if (hasBoundaryBarrier()) return;

            teleportButton(button, mouseX, mouseY);
            return;
        }

        if (buttonHitsStick(button, newX, newY)) {
            const reflectedX = clamp(currentX - Math.cos(angle) * Math.min(push, 28), 8, arena.clientWidth - rect.width - 8);
            const reflectedY = clamp(currentY - Math.sin(angle) * Math.min(push, 28), 55, arena.clientHeight - rect.height - 8);
            newX = buttonHitsStick(button, reflectedX, currentY) ? currentX : reflectedX;
            newY = buttonHitsStick(button, newX, reflectedY) ? currentY : reflectedY;
        }

        button.style.left = `${newX}px`;
        button.style.top = `${newY}px`;
    }

    arena.addEventListener("pointermove", (event) => {
        const r = arena.getBoundingClientRect();
        const mx = event.clientX - r.left;
        const my = event.clientY - r.top;

        if (dragging !== null) {
            const i = dragging;
            const s = state[i];
            s.x = clamp(mx - offsetX, 5, arena.clientWidth - sticks[i].offsetWidth - 5);
            s.y = clamp(my - offsetY, 45, arena.clientHeight - sticks[i].offsetHeight - 5);
            renderStick(i);
            updatePuzzleState();
        } else {
            moveButtonAway(yesBtn, mx, my);
            moveButtonAway(noBtn, mx, my);
        }
    });

    sticks.forEach((stick, i) => {
        stick.addEventListener("pointerdown", (event) => {
            dragging = i;
            touchPointerId = event.pointerId;
            stick.classList.add("dragging");
            const r = arena.getBoundingClientRect();
            offsetX = event.clientX - r.left - state[i].x;
            offsetY = event.clientY - r.top - state[i].y;
            stick.setPointerCapture(event.pointerId);
            event.preventDefault();
        });

        stick.addEventListener("pointerup", () => {
            if (dragging !== null) {
                sticks[dragging].classList.remove("dragging");
            }
            dragging = null;
            touchPointerId = null;
            updatePuzzleState();
        });

        // Double-click/tap a stick to rotate it 15 degrees.
        stick.addEventListener("dblclick", () => {
            if (locked) return;
            state[i].angle = (state[i].angle + 15) % 360;
            renderStick(i);
            updatePuzzleState();
        });
    });

    async function submitChoice(choice) {
        try {
            const csrfToken = getCookie("csrftoken");
            const body = new URLSearchParams({
                choice,
                puzzle_completed: String(locked)
            });

            const response = await fetch(window.RECORD_CHOICE_URL, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Could not save choice.");

            showToast(`Your ${choice.toUpperCase()} has been saved!`);
            status.textContent = choice === "yes"
                ? "Ohhh... you said YES! Something special is coming. 🎁"
                : "You said NO?! The surprise is still waiting. 😏";
            window.location.href = window.BIRTHDAY_WISH_URL;
        } catch (error) {
            console.error(error);
            showToast("Could not save the choice. Check the Django server.");
        }
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
        return "";
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2600);
    }

    yesBtn.addEventListener("click", () => submitChoice("yes"));
    noBtn.addEventListener("click", () => submitChoice("no"));

    window.addEventListener("resize", () => {
        state.forEach((_, i) => {
            state[i].x = clamp(state[i].x, 5, arena.clientWidth - sticks[i].offsetWidth - 5);
            state[i].y = clamp(state[i].y, 45, arena.clientHeight - sticks[i].offsetHeight - 5);
            renderStick(i);
        });
    });

    randomizeInitialPositions();
})();
