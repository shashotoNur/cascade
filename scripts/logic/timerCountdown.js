import {
    getIntervalId,
    getCompletedDuration,
    getDuration,
    setCompletedDuration,
    setDuration,
    getSets,
    setIntervalId,
} from "./state.js";
import {
    parseTimeString,
    calculateEndTime,
    sendNotification,
} from "./utils.js";
import { createActiveTimer } from "../components/activeTimer.js";
import { initializeTimers } from "../helpers/initialize.js";

const startCounting = ({ sIdx, tIdx, partialStart }) => {
    const countdownDisplay = document.getElementById("countdown");

    clearInterval(getIntervalId());
    setIntervalId(null);

    const set = getSets()[sIdx];
    const timer = set.timers[tIdx];

    const setProgressBar = document.getElementById(
        `set-${set.title.replace(" ", "-")}`
    );

    if (!timer) {
        setProgressBar.value = 0;
        countdownDisplay.textContent = "";
        document.title = "Cascade";
        return;
    }

    createActiveTimer({ sIdx, tIdx });

    const prefix = timer.title + " [" + set.title + "]: ";
    let [hours, minutes, seconds] = timer.time.split(":").map(Number);
    let initialDuration = hours * 3600 + minutes * 60 + seconds;
    if (!partialStart) setDuration(initialDuration);

    let totalSetTime = 0;
    setCompletedDuration(0);

    set.timers.forEach((timer, i) => {
        let [hours, minutes, seconds] = timer.time.split(":").map(Number);
        const timerTimeInSec = hours * 3600 + minutes * 60 + seconds;
        if (i < sIdx)
            setCompletedDuration(getCompletedDuration() + timerTimeInSec);

        totalSetTime += timerTimeInSec;
    });

    const countdown = () => {
        minutes = parseInt(getDuration() / 60, 10);
        seconds = parseInt(getDuration() % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        countdownDisplay.textContent = prefix + minutes + ":" + seconds;
        document.title = minutes + ":" + seconds;

        const progressBar = document.getElementById(
            `timer-${timer.title.replace(" ", "-")}`
        );
        const activeBar = document.getElementById(
            `timer-${timer.title.replace(" ", "-")}-active`
        );

        if (initialDuration > 0) {
            const d = initialDuration - getDuration();
            if (d < 0) initialDuration += d * -1;

            const progress = (d * 100) / initialDuration;
            if (progressBar) progressBar.value = progress;
            activeBar.value = progress;

            if (getCompletedDuration() < 0)
                totalSetTime += getCompletedDuration() * -1;

            const setProgress = (getCompletedDuration() * 100) / totalSetTime;
            if (setProgressBar) setProgressBar.value = setProgress;
        }

        setCompletedDuration(getCompletedDuration() + 1);
        setDuration(getDuration() - 1);

        if (getDuration() < 0) {
            clearInterval(getIntervalId());
            setIntervalId(null);

            if (progressBar) progressBar.value = 0;
            activeBar.value = 0;

            if (timer.alert) {
                sendNotification(timer.title);
                const audio = document.getElementById("myAudio");
                audio.play();

                setTimeout(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }, 2000);
            }

            const nextTimerIndex = timer.loop ? tIdx : tIdx + 1;
            startCounting({ sIdx, tIdx: nextTimerIndex, partialStart: false });
        }
    };
    countdown();
    const intervalId = setInterval(countdown, 1000);
    setIntervalId(intervalId);
};

const findAndStartTimer = (currentTime) => {
    const sets = getSets();

    let sIdx = 0;
    for (const set of sets) {
        if (set.time) {
            const startTime = parseTimeString(set.time + ":00");
            const endTime = calculateEndTime(startTime, set.timers);

            if (currentTime >= startTime && currentTime <= endTime) {
                const elapsedTime = currentTime - startTime;
                const { timers } = set;

                let accumulatedTime = 0,
                    tIdx = 0;

                for (const timer of timers) {
                    const timerDuration = parseTimeString(timer.time);
                    accumulatedTime += timerDuration;

                    if (elapsedTime < accumulatedTime) {
                        initializeTimers({ sIdx });
                        setDuration(accumulatedTime - elapsedTime);

                        const currentSet =
                            document.getElementById("current-set");
                        currentSet.textContent = set.title;

                        startCounting({ sIdx, tIdx, partialStart: true });
                        return timer;
                    }
                    tIdx++;
                }
            }
        }
        sIdx++;
    }

    const countdownDisplay = document.getElementById("countdown");
    countdownDisplay.textContent = "No timer scheduled for now";
    document.title = "Cascade";

    setTimeout(() => (countdownDisplay.textContent = ""), 3000);
};

export { startCounting, findAndStartTimer };
