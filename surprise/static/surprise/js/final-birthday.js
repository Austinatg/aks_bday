(() => {
    const copy = document.getElementById("birthdayCopy");
    const videoStage = document.getElementById("videoStage");
    const video = document.getElementById("birthdayVideo");

    setTimeout(() => {
        copy.classList.add("fade-out");
        videoStage.classList.add("visible");
        video.play().catch(() => {});
    }, 3000);
})();