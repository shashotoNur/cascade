import {
    truncateString,
    requestNotificationPermission,
} from "../logic/utils.js";
import {
    createProgressBar,
    createLabel,
    createDurationPicker,
    createNavigationButton,
} from "../helpers/uiElements.js";
import {
    getIntervalId,
    getCompletedDuration,
    getDuration,
    getSets,
    setCompletedDuration,
    setDuration,
    setIntervalId,
    setSets,
} from "../logic/state.js";
import { startCounting } from "../logic/timerCountdown.js";

export const createActiveTimer = ({ sIdx, tIdx }) => {
    const set = getSets()[sIdx];
    if (!set) return;
    const timerData = set.timers[tIdx];
    if (!timerData) return;

    const timer = document.getElementById("active-timer");
    timer.textContent = "";

    const header = document.createElement("div");
    header.className = "header";

    const titleDiv = document.createElement("div");
    titleDiv.textContent = truncateString(timerData.title);
    titleDiv.title = timerData.title;

    const timeDiv = document.createElement("div");
    timeDiv.textContent = timerData.time;
    timeDiv.title = "Duration of countdown";

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    const body = createActiveTimerBody({ sIdx, tIdx });

    timer.appendChild(header);
    timer.appendChild(body);

    return timer;
};

const createActiveTimerBody = ({ sIdx, tIdx }) => {
    const set = getSets()[sIdx];
    const timerData = set.timers[tIdx];

    const countdownDisplay = document.getElementById("countdown");

    const detailDiv = document.createElement("div");
    const controlDiv = document.createElement("div");
    controlDiv.className = "control-div";

    const progress = createProgressBar(
        100,
        `timer-${timerData.title.replace(" ", "-")}` + "-active"
    );
    progress.title = "Progress bar";

    const alertBox = document.createElement("input");
    alertBox.setAttribute("type", "checkbox");
    const alertBoxId = timerData.title.replace(" ", "-") + "-active-alertbox";
    alertBox.id = alertBoxId;

    alertBox.checked = timerData.alert;
    alertBox.title = alertBox.checked
        ? "You will be notified once countdown ends"
        : "Countdown will end quietly";

    alertBox.onclick = async () => {
        if (Notification.permission !== "granted" && alertBox.checked)
            await requestNotificationPermission();

        if (Notification.permission !== "granted" && alertBox.checked) {
            countdownDisplay.textContent = "Notifications are blocked!";
            setTimeout(() => {
                countdownDisplay.textContent = "";
            }, 3000);

            return (alertBox.checked = false);
        }

        const sets = getSets();
        sets[sIdx].timers[tIdx].alert = alertBox.checked;
        setSets(sets);

        document.getElementById(
            timerData.title.replace(" ", "-") + "-alertbox"
        ).checked = alertBox.checked;
    };

    const loopBox = document.createElement("input");
    loopBox.setAttribute("type", "checkbox");
    loopBox.id = timerData.title.replace(" ", "-") + "-active-loopbox";

    loopBox.checked = timerData.loop;
    loopBox.title = loopBox.checked
        ? "The countdown will restart endlessly until stopped"
        : "Countdown will end after a single run";
    loopBox.onclick = async () => {
        timerData.loop = loopBox.checked;
        loopBox.title = loopBox.checked
            ? "The countdown will restart endlessly until stopped"
            : "Countdown will end after a single run";
    };

    const pauseBtn = document.createElement("button");
    pauseBtn.id = "pause-btn";
    pauseBtn.textContent = ">";
    pauseBtn.title = "Click to start timer";
    pauseBtn.onclick = () => {
        if (pauseBtn.textContent == "||") clearInterval(getIntervalId());
        else startCounting({ sIdx, tIdx, partialStart: !!getIntervalId() });

        const thisBtn = document.getElementById("pause-btn");
        thisBtn.textContent = pauseBtn.textContent == "||" ? ">" : "||";
        thisBtn.title =
            thisBtn.textContent == "||" ? "Click to pause" : "Click to resume";
    };

    const stopBtn = document.createElement("button");
    stopBtn.textContent = "▣";
    stopBtn.title = "Stop this timer";
    stopBtn.onclick = () => {
        clearInterval(getIntervalId());
        setIntervalId(null);

        countdownDisplay.textContent = "";
        document.title = "Cascade";
        pauseBtn.textContent = ">";
    };

    const zeroSec = "00:00:00";
    const changeTimeInput = createDurationPicker(zeroSec);
    changeTimeInput.title =
        "Enter duration to add or remove time from the running timer for this session";

    const removeTimeBtn = document.createElement("button");
    removeTimeBtn.textContent = " - ";
    removeTimeBtn.title = "Remove time";
    removeTimeBtn.onclick = () => {
        let [hours, minutes, seconds] = changeTimeInput.value
            .split(":")
            .map(Number);
        const timeValue = hours * 3600 + minutes * 60 + seconds;
        setDuration(getDuration() - timeValue);
        setCompletedDuration(getCompletedDuration() + timeValue);
        changeTimeInput.value = zeroSec;
    };

    const addTimeBtn = document.createElement("button");
    addTimeBtn.textContent = " + ";
    addTimeBtn.title = "Add time";
    addTimeBtn.onclick = () => {
        let [hours, minutes, seconds] = changeTimeInput.value
            .split(":")
            .map(Number);
        const timeValue = hours * 3600 + minutes * 60 + seconds;
        setDuration(getDuration() + timeValue);
        setCompletedDuration(getCompletedDuration() - timeValue);
        changeTimeInput.value = zeroSec;
    };

    const firstControl = document.createElement("div");
    firstControl.className = "first-control";
    const secondControl = document.createElement("div");
    secondControl.className = "second-control";

    firstControl.appendChild(pauseBtn);
    firstControl.appendChild(stopBtn);

    secondControl.appendChild(removeTimeBtn);
    secondControl.appendChild(changeTimeInput);
    secondControl.appendChild(addTimeBtn);

    controlDiv.appendChild(firstControl);
    controlDiv.appendChild(secondControl);

    const prevBtn = createNavigationButton({ sIdx, tIdx: tIdx - 1 });
    const nextBtn = createNavigationButton({ sIdx, tIdx: tIdx + 1 });

    prevBtn.title = prevBtn.disabled
        ? "No previous timer"
        : "Click to start previous timer";
    nextBtn.title = nextBtn.disabled
        ? "No follow up timer"
        : "Click to start next timer";
    prevBtn.className = "nav-btn";
    nextBtn.className = "nav-btn";

    const progressDiv = document.createElement("div");
    progressDiv.appendChild(progress);

    const checkboxDiv = document.createElement("div");
    checkboxDiv.className = "checkbox-div";
    const alertLabel = createLabel("Alert");
    alertLabel.className = "checkbox-label";
    checkboxDiv.appendChild(alertBox);
    checkboxDiv.appendChild(alertLabel);

    const loopLabel = createLabel("Loop");
    loopLabel.className = "checkbox-label";
    checkboxDiv.appendChild(loopBox);
    checkboxDiv.appendChild(loopLabel);

    const navDiv = document.createElement("div");
    navDiv.className = "nav-btn-div";
    navDiv.appendChild(prevBtn);
    navDiv.appendChild(nextBtn);

    detailDiv.appendChild(progressDiv);
    detailDiv.appendChild(checkboxDiv);
    detailDiv.appendChild(controlDiv);
    detailDiv.appendChild(navDiv);

    const body = document.createElement("div");
    const lineBreak = document.createElement("br");
    body.appendChild(lineBreak);
    body.appendChild(detailDiv);

    return body;
};
