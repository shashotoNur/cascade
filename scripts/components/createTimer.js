import {
    truncateString,
    hasTitle,
    requestNotificationPermission,
    moveCursorToEnd,
    isOverlappingWithExistingSet,
} from "../logic/utils.js";
import {
    createProgressBar,
    createLabel,
    createDurationPicker,
} from "../helpers/uiElements.js";
import { initializeTimers } from "../helpers/initialize.js";
import { getSets, setSets } from "../logic/state.js";
import { startCounting } from "../logic/timerCountdown.js";

export const createTimer = ({ sIdx, tIdx }) => {
    const set = getSets()[sIdx];
    if (!set) return;
    const timerData = set.timers[tIdx];
    if (!timerData) return;

    const timer = document.createElement("li");
    timer.classList.add("timer");
    timer.draggable = true;

    const header = createTimerHeader({ sIdx, tIdx });
    const body = createTimerBody({ sIdx, tIdx });

    header.addEventListener("click", () => {
        body.style.maxHeight = body.style.maxHeight
            ? null
            : body.scrollHeight + "px";
    });

    timer.appendChild(header);
    timer.appendChild(body);

    const saveBtn = body.querySelector("button");
    saveBtn.addEventListener("click", () => {});

    return timer;
};

const createTimerHeader = ({ sIdx, tIdx }) => {
    const countdownDisplay = document.getElementById("countdown");

    const set = getSets()[sIdx];
    if (!set) return;
    const timerData = set.timers[tIdx];
    if (!timerData) return;

    const header = document.createElement("div");
    header.classList.add("header");

    const titleDiv = document.createElement("div");
    titleDiv.textContent = truncateString(timerData.title);
    titleDiv.title = timerData.title;
    titleDiv.onclick = () => {
        titleDiv.contentEditable = true;
        moveCursorToEnd(titleDiv);
        titleDiv.focus();
    };

    titleDiv.onkeydown = (event) => {
        if (event.key !== "Enter") return;

        const newTitle = titleDiv.textContent.trim();
        titleDiv.contentEditable = false;

        const titleExists = hasTitle(set.timers, newTitle);
        if (titleExists) {
            countdownDisplay.textContent = "Name already exists!";
            setTimeout(() => (countdownDisplay.textContent = ""), 3000);
            return (titleDiv.textContent = truncateString(timerData.title));
        }

        const sets = getSets();

        sets[sIdx].timers[tIdx].title = newTitle;
        setSets(sets);

        titleDiv.textContent = truncateString(newTitle);
        titleDiv.title = newTitle;
    };

    const timeDiv = document.createElement("div");
    timeDiv.textContent = timerData.time;
    timeDiv.title = "Duration of countdown";

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    return header;
};

const createTimerBody = ({ sIdx, tIdx }) => {
    const sets = getSets();
    const set = sets[sIdx];
    if (!set) return;

    const timerData = set.timers[tIdx];
    if (!timerData) return;

    const currentSet = document.getElementById("current-set");
    const countdownDisplay = document.getElementById("countdown");

    const body = document.createElement("div");
    body.classList.add("body");

    const progress = createProgressBar(
        100,
        `timer-${timerData.title.replace(" ", "-")}`
    );
    progress.title = "Progress bar";

    const alertBox = document.createElement("input");
    alertBox.setAttribute("type", "checkbox");
    const alertBoxId = timerData.title.replace(" ", "-") + "-alertbox";
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

        sets[sIdx].timers[tIdx].alert = alertBox.checked;
        setSets(sets);

        if (
            document.getElementById(
                timerData.title.replace(" ", "-") + "-active-alertbox"
            )
        )
            document.getElementById(
                timerData.title.replace(" ", "-") + "-active-alertbox"
            ).checked = alertBox.checked;
    };

    const copyDiv = document.createElement("div");
    copyDiv.className = "dropdown";

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy >";
    const copyLocations = document.createElement("div");
    copyLocations.className = "dropdown-content";

    sets.forEach((set, idx) => {
        const location = document.createElement("div");
        location.textContent = set.title;
        location.onclick = () => {
            let i = 1,
                timerTitle = timerData.title;

            while (true) {
                const titleExists = hasTitle(set.timers, timerTitle);
                if (!titleExists) break;
                timerTitle += ` (${i})`;
                i++;
            }

            const copyingTimer = Object.assign({}, timerData, {
                title: timerTitle,
            });

            sets[sIdx].timers.push(copyingTimer);

            setSets(sets);
            initializeTimers({ sIdx, tIdx });

            currentSet.textContent = set.title;

            countdownDisplay.textContent = `${timerData.title} has been copied to ${set.title}`;
            setTimeout(() => {
                countdownDisplay.textContent = "";
            }, 3000);
        };
        copyLocations.appendChild(location);
    });

    copyDiv.onclick = () => {
        copyLocations.style.display = "block";
    };

    const inputField = createDurationPicker(timerData.time);
    inputField.title = "Enter duration of countdown";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.title = "Click to update countdown duration";
    saveBtn.onclick = () => {
        sets[sIdx].timers[tIdx].time = inputField.value;

        const { overlapping, setTitle } = isOverlappingWithExistingSet(
            sets[sIdx],
            sets
        );

        if (overlapping) {
            countdownDisplay.textContent = `Set "${setTitle}" already occupies this time!`;
            setTimeout(() => {
                countdownDisplay.textContent = "";
            }, 3000);
        } else {
            setSets(sets);
            initializeTimers({ sIdx });
        }
    };

    const startBtn = document.createElement("button");
    startBtn.textContent = "Start";
    startBtn.title = "Start the countdown";
    startBtn.onclick = () => {
        startCounting({ sIdx, tIdx, partialStart: false });
        document.getElementById("pause-btn").textContent = "||";
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.title = "Delete this timer";
    deleteBtn.onclick = () => {
        sets[sIdx].timers.splice(tIdx, 1);

        setSets(sets);
        initializeTimers({ sIdx });
    };

    const progressDiv = document.createElement("div");
    progressDiv.appendChild(progress);

    const checkboxDiv = document.createElement("div");
    checkboxDiv.className = "checkbox-div";
    const alertLabel = createLabel("Alert");
    alertLabel.className = "checkbox-label";

    checkboxDiv.appendChild(alertBox);
    checkboxDiv.appendChild(alertLabel);

    copyDiv.appendChild(copyBtn);
    copyDiv.appendChild(copyLocations);
    checkboxDiv.appendChild(copyDiv);

    body.appendChild(progressDiv);
    body.appendChild(checkboxDiv);
    body.appendChild(inputField);
    body.appendChild(saveBtn);
    body.appendChild(startBtn);
    body.appendChild(deleteBtn);

    return body;
};
