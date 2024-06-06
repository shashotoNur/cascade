import {
    getIntervalId,
    getCompletedDuration,
    getDuration,
    setCompletedDuration,
    setDuration,
    getSets,
    setIntervalId,
    isShowingMsg,
} from "./state.js";
import {
    parseTimeString,
    calculateEndTime,
    sendNotification,
    showMessage,
    truncateString,
} from "./utils.js";
import { createActiveTimer } from "../components/activeTimer.js";
import { initializeTimers } from "../helpers/initialize.js";

const parseTime = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return {
        hours,
        minutes,
        seconds,
        totalSeconds: hours * 3600 + minutes * 60 + seconds,
    };
};

const formatTime = (duration) => {
    let minutes = parseInt(duration / 60, 10);
    let seconds = parseInt(duration % 60, 10);
    return {
        minutes: minutes < 10 ? "0" + minutes : minutes,
        seconds: seconds < 10 ? "0" + seconds : seconds,
    };
};

const updateProgressBar = (progressBarId, progress) => {
    const progressBar = document.getElementById(progressBarId);
    if (progressBar) progressBar.value = progress;
};

const updateCountdownDisplay = (prefix, minutes, seconds) => {
    document.title = `${minutes ? minutes + ":" : "Cascade"}${
        seconds ? seconds : ""
    }`;
    if (isShowingMsg()) return;
    showMessage(
        `${prefix} ${minutes ? minutes + ":" : ""}${seconds ? seconds : ""}`,
        -1
    );
};

const resetCountdownDisplay = () => {
    showMessage("", -1);
    document.title = "Cascade";
};

const playAlert = () => {
    const audio = document.getElementById("myAudio");
    audio.play();
    setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
    }, 2000);
};

const initializeCountdown = ({
    set,
    timer,
    prefix,
    totalSetTime,
    tIdx,
    sIdx,
    initialDuration,
}) => {
    const countdown = () => {
        let duration = getDuration();
        let { minutes, seconds } = formatTime(duration);

        updateCountdownDisplay(prefix, minutes, seconds);

        let elapsedTime = initialDuration - duration;
        let progress = (elapsedTime * 100) / initialDuration;
        updateProgressBar(`timer-${timer.title.replace(" ", "-")}`, progress);
        updateProgressBar(
            `timer-${timer.title.replace(" ", "-")}-active`,
            progress
        );

        let completedDuration = getCompletedDuration();
        let setProgress = (completedDuration * 100) / totalSetTime;
        updateProgressBar(`set-${set.title.replace(" ", "-")}`, setProgress);

        setCompletedDuration(completedDuration + 1);
        setDuration(duration - 1);

        if (duration < 0) {
            clearInterval(getIntervalId());
            setIntervalId(null);
            updateProgressBar(`timer-${timer.title.replace(" ", "-")}`, 0);
            updateProgressBar(
                `timer-${timer.title.replace(" ", "-")}-active`,
                0
            );

            if (timer.alert) {
                sendNotification(timer.title);
                playAlert();
            }

            let nextTimerIndex = timer.loop ? tIdx : tIdx + 1;
            startCounting({ sIdx, tIdx: nextTimerIndex, partialStart: false });
        }
    };

    return countdown;
};

const getCurrentSetElement = () => document.getElementById("current-set");

const findCurrentSetIndex = (sets, currentTime) => {
    return sets.findIndex((set) => {
        if (!set.time) return false;
        const startTime = parseTimeString(set.time + ":00");
        const endTime = calculateEndTime(startTime, set.timers);
        return currentTime >= startTime && currentTime <= endTime;
    });
};

const findCurrentTimerIndex = (timers, elapsedTime) => {
    let accumulatedTime = 0;
    return timers.findIndex((timer) => {
        accumulatedTime += parseTimeString(timer.time);
        return elapsedTime < accumulatedTime;
    });
};

const startTimer = (sets, sIdx, tIdx, elapsedTime) => {
    const set = sets[sIdx];
    const accumulatedTime = set.timers
        .slice(0, tIdx + 1)
        .reduce((acc, timer) => acc + parseTimeString(timer.time), 0);

    initializeTimers({ sIdx });
    setDuration(accumulatedTime - elapsedTime);

    const currentSetElement = getCurrentSetElement();
    currentSetElement.textContent = truncateString(set.title);

    startCounting({ sIdx, tIdx, partialStart: true });
};

export const startCounting = ({ sIdx, tIdx, partialStart }) => {
    const sets = getSets();
    const set = sets[sIdx];
    const timer = set.timers[tIdx];

    if (!timer) {
        resetCountdownDisplay();
        return;
    }

    const activeSetBody = document.getElementById(`set-${set.title}-body`);
    activeSetBody.style.maxHeight = `${activeSetBody.scrollHeight}px`;

    createActiveTimer({ sIdx, tIdx });

    clearInterval(getIntervalId());
    setIntervalId(null);

    const { totalSeconds: initialDuration } = parseTime(timer.time);
    if (!partialStart) setDuration(initialDuration);

    let totalSetTime = set.timers.reduce((acc, timer) => {
        const { totalSeconds } = parseTime(timer.time);
        return acc + totalSeconds;
    }, 0);

    let completedDuration = set.timers.slice(0, tIdx).reduce((acc, timer) => {
        const { totalSeconds } = parseTime(timer.time);
        return acc + totalSeconds;
    }, 0);

    setCompletedDuration(completedDuration);

    const prefix = `${timer.title} [${set.title}]: `;
    const countdown = initializeCountdown({
        set,
        timer,
        prefix,
        totalSetTime,
        tIdx,
        sIdx,
        initialDuration,
    });

    countdown();
    const intervalId = setInterval(countdown, 1000);
    setIntervalId(intervalId);
};

export const findAndStartTimer = (currentTime) => {
    const sets = getSets();
    const sIdx = findCurrentSetIndex(sets, currentTime);

    if (sIdx !== -1) {
        const set = sets[sIdx];
        const startTime = parseTimeString(set.time + ":00");
        const elapsedTime = currentTime - startTime;
        const tIdx = findCurrentTimerIndex(set.timers, elapsedTime);

        if (tIdx !== -1) {
            startTimer(sets, sIdx, tIdx, elapsedTime);
            setCompletedDuration(elapsedTime);
            return set.timers[tIdx];
        }
    }

    updateCountdownDisplay("No timer scheduled for now");
    setTimeout(() => updateCountdownDisplay(""), 3000);
};
