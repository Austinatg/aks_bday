(() => {
    const scene = document.getElementById("birthdayScene");
    const candles = document.getElementById("candles");
    const status = document.getElementById("wishStatus");
    const meterBars = [...document.querySelectorAll("#soundMeter span")];
    let completed = false;
    let loudSince = 0;
    let analyser;
    let microphoneStream;

    function setMeter(level) {
        const activeBars = Math.round(level * meterBars.length);
        meterBars.forEach((bar, index) => bar.classList.toggle("active", index < activeBars));
    }

    function finishBlow() {
        if (completed) return;

        completed = true;
        scene.classList.add("is-blowing");
        status.textContent = "Beautiful breath. Your wish is on its way...";

        setTimeout(() => {
            scene.classList.remove("is-blowing");
            scene.classList.add("flames-out");
            candles.classList.add("final-number");
        }, 2000);

        setTimeout(() => {
            candles.querySelectorAll('[data-digit="0"]').forEach(candle => {
                candle.classList.add("vanish");
            });
            status.textContent = "The zeros drifted away. Here is to 23 and everything ahead.";
            if (microphoneStream) microphoneStream.getTracks().forEach(track => track.stop());
        }, 5000);

        setTimeout(() => {
            window.location.href = window.WAIT_ITS_NOT_DONE_URL;
        }, 20000);
    }

    function monitorMicrophone() {
        const values = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(values);

        let squareTotal = 0;
        values.forEach(value => {
            const normalized = (value - 128) / 128;
            squareTotal += normalized * normalized;
        });

        const level = Math.min(1, Math.sqrt(squareTotal / values.length) * 4.5);
        setMeter(level);

        if (level > .12) {
            if (!loudSince) loudSince = performance.now();
            if (performance.now() - loudSince > 320) finishBlow();
        } else {
            loudSince = 0;
        }

        if (!completed) requestAnimationFrame(monitorMicrophone);
    }

    async function listenForBlow() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            status.textContent = "Microphone input is not available in this browser.";
            return;
        }

        try {
            microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(microphoneStream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            status.textContent = "Blow gently toward your microphone...";
            monitorMicrophone();
        } catch (error) {
            status.textContent = "Please allow microphone access to blow out the candles.";
        }
    }

    listenForBlow();
})();