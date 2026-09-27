(() => {
    const stages = [
        document.querySelector(".stage-one"),
        document.querySelector(".stage-two"),
        document.querySelector(".stage-three")
    ];
    const button = document.getElementById("gameButton");

    function show(stage) {
        stage.classList.add("visible");
    }

    function fade(stage) {
        stage.classList.remove("visible");
        stage.classList.add("fade-out");
    }

    show(stages[0]);
    setTimeout(() => fade(stages[0]), 2000);
    setTimeout(() => show(stages[1]), 2600);
    setTimeout(() => fade(stages[1]), 4600);
    setTimeout(() => show(stages[2]), 5200);
    setTimeout(() => fade(stages[2]), 7200);
    setTimeout(() => button.classList.add("visible"), 7800);
})();