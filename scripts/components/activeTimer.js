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

    const createDiv = (className, textContent, title) => {
        const div = document.createElement("div");
        div.className = className || "";
        div.textContent = textContent || "";
        if (title) div.title = title;
        return div;
    };

    const header = createDiv("header");
    const titleDiv = createDiv(
        null,
        truncateString(timerData.title),
        timerData.title
    );
    const timeDiv = createDiv(null, timerData.time, "Duration of countdown");

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

    const createDiv = (className, children = []) => {
        const div = document.createElement("div");
        div.className = className || "";
        children.forEach((child) => {
            div.appendChild(child);
        });
        return div;
    };

    const createInput = (type, id, checked, title, onClick) => {
        const input = document.createElement("input");
        input.setAttribute("type", type);
        input.id = id;
        input.checked = checked;
        input.title = title;
        input.onclick = onClick;
        return input;
    };

    const createButton = (id, text, title, onClick) => {
        const button = document.createElement("button");
        button.id = id;
        button.textContent = text;
        button.title = title;
        button.onclick = onClick;
        return button;
    };

    const progress = createProgressBar(
        100,
        `timer-${timerData.title.replace(" ", "-")}-active`
    );
    progress.title = "Progress bar";

    const alertBoxId = `${timerData.title.replace(" ", "-")}-active-alertbox`;
    const alertBox = createInput(
        "checkbox",
        alertBoxId,
        timerData.alert,
        timerData.alert
            ? "You will be notified once countdown ends"
            : "Countdown will end quietly",
        async () => {
            if (Notification.permission !== "granted" && alertBox.checked) {
                await requestNotificationPermission();
            }

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

            document.getElementById(alertBoxId).checked = alertBox.checked;
        }
    );

    const loopBox = createInput(
        "checkbox",
        `${timerData.title.replace(" ", "-")}-active-loopbox`,
        timerData.loop,
        timerData.loop
            ? "The countdown will restart endlessly until stopped"
            : "Countdown will end after a single run",
        () => {
            timerData.loop = loopBox.checked;
            loopBox.title = loopBox.checked
                ? "The countdown will restart endlessly until stopped"
                : "Countdown will end after a single run";
        }
    );

    const pauseBtn = createButton(
        "pause-btn",
        ">",
        "Click to start timer",
        () => {
            const pauseBtn = document.getElementById("pause-btn");
            const isRunning = pauseBtn.textContent === "||";

            if (isRunning) clearInterval(getIntervalId());
            else startCounting({ sIdx, tIdx, partialStart: !!getIntervalId() });

            document.getElementById("pause-btn").textContent = isRunning
                ? ">"
                : "||";

            document.getElementById("pause-btn").title = isRunning
                ? "Click to resume"
                : "Click to pause";
        }
    );

    const stopBtn = createButton(null, "▣", "Stop this timer", () => {
        clearInterval(getIntervalId());
        setIntervalId(null);

        countdownDisplay.textContent = "";
        document.title = "Cascade";

        pauseBtn.textContent = ">";
        pauseBtn.title = "Click to start timer"
    });

    const zeroSec = "00:00:00";
    const changeTimeInput = createDurationPicker(zeroSec);
    changeTimeInput.title =
        "Enter duration to add or remove time from the running timer for this session";

    const adjustTime = (sign) => () => {
        let [hours, minutes, seconds] = changeTimeInput.value
            .split(":")
            .map(Number);
        const timeValue = hours * 3600 + minutes * 60 + seconds;
        setDuration(getDuration() + sign * timeValue);
        setCompletedDuration(getCompletedDuration() - sign * timeValue);
        changeTimeInput.value = zeroSec;
    };

    const removeTimeBtn = createButton(
        null,
        " - ",
        "Remove time",
        adjustTime(-1)
    );
    const addTimeBtn = createButton(null, " + ", "Add time", adjustTime(1));

    const firstControl = createDiv("first-control", [pauseBtn, stopBtn]);
    const secondControl = createDiv("second-control", [
        removeTimeBtn,
        changeTimeInput,
        addTimeBtn,
    ]);

    const controlDiv = createDiv("control-div", [firstControl, secondControl]);

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

    const navDiv = createDiv("nav-btn-div", [prevBtn, nextBtn]);
    const detailDiv = createDiv("", [
        createDiv("", [progress]),
        checkboxDiv,
        controlDiv,
        navDiv,
    ]);
    const body = createDiv("", [document.createElement("br"), detailDiv]);

    return body;
};
