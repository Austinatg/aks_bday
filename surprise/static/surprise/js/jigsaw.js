(() => {
    const canvas = document.getElementById("puzzleCanvas");
    const context = canvas.getContext("2d");
    const columns = 4;
    const rows = 4;
    const pieces = [];
    const image = new Image();
    let imageSource = null;
    let imageRect = null;
    let activePiece = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function resizeCanvas() {
        const size = Math.floor(Math.min(window.innerWidth * .88, window.innerHeight * .88, 780));
        canvas.width = size;
        canvas.height = size;
        if (image.naturalWidth) createPieces();
    }

    function fitImage() {
        const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
        const sourceWidth = canvas.width / scale;
        const sourceHeight = canvas.height / scale;
        return {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height,
            sourceX: (image.naturalWidth - sourceWidth) / 2,
            sourceY: (image.naturalHeight - sourceHeight) / 2,
            sourceWidth,
            sourceHeight
        };
    }

    function createPieces() {
        if (!image.naturalWidth || !image.naturalHeight) return;

        imageRect = fitImage();
        pieces.length = 0;
        const pieceWidth = canvas.width / columns;
        const pieceHeight = canvas.height / rows;

        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
                pieces.push({
                    targetX: column * pieceWidth,
                    targetY: row * pieceHeight,
                    width: pieceWidth,
                    height: pieceHeight,
                    sourceX: column,
                    sourceY: row,
                    x: 0,
                    y: 0,
                    solved: false
                });
            }
        }

        const positions = pieces.map((_, index) => index).sort(() => Math.random() - .5);
        pieces.forEach((piece, index) => {
            const slot = pieces[positions[index]];
            piece.x = slot.targetX;
            piece.y = slot.targetY;
        });
        render();
    }

    function render() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#171a21";
        context.fillRect(0, 0, canvas.width, canvas.height);

        pieces.forEach(piece => {
            const sourceWidth = imageRect.sourceWidth / columns;
            const sourceHeight = imageRect.sourceHeight / rows;
            context.drawImage(
                image,
                imageRect.sourceX + piece.sourceX * sourceWidth,
                imageRect.sourceY + piece.sourceY * sourceHeight,
                sourceWidth,
                sourceHeight,
                piece.x,
                piece.y,
                piece.width,
                piece.height
            );
            context.strokeStyle = piece.solved ? "rgba(255,255,255,.12)" : "rgba(17,20,27,.75)";
            context.lineWidth = 2;
            context.strokeRect(piece.x, piece.y, piece.width, piece.height);
        });
    }

    function pointerPosition(event) {
        const bounds = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - bounds.left) * canvas.width / bounds.width,
            y: (event.clientY - bounds.top) * canvas.height / bounds.height
        };
    }

    function pieceAt(point) {
        for (let index = pieces.length - 1; index >= 0; index--) {
            const piece = pieces[index];
            if (!piece.solved && point.x >= piece.x && point.x <= piece.x + piece.width &&
                point.y >= piece.y && point.y <= piece.y + piece.height) return piece;
        }
        return null;
    }

    canvas.addEventListener("pointerdown", event => {
        const point = pointerPosition(event);
        activePiece = pieceAt(point);
        if (!activePiece) return;
        dragOffsetX = point.x - activePiece.x;
        dragOffsetY = point.y - activePiece.y;
        canvas.classList.add("dragging");
        canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", event => {
        if (!activePiece) return;
        const point = pointerPosition(event);
        activePiece.x = point.x - dragOffsetX;
        activePiece.y = point.y - dragOffsetY;
        render();
    });

    canvas.addEventListener("pointerup", event => {
        if (!activePiece) return;
        const distance = Math.hypot(activePiece.x - activePiece.targetX, activePiece.y - activePiece.targetY);
        if (distance < 28) {
            activePiece.x = activePiece.targetX;
            activePiece.y = activePiece.targetY;
            activePiece.solved = true;
        }
        activePiece = null;
        canvas.classList.remove("dragging");
        render();
        if (pieces.every(piece => piece.solved)) {
            canvas.classList.add("solved");
            setTimeout(() => {
                window.location.href = window.SURFING_URL;
            }, 400);
        }
    });

    image.onload = createPieces;
    image.src = window.DEFAULT_PUZZLE_IMAGE;
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
})();