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

    const header = createTimerHeader({ sIdx, tIdx, timerData });
    const body = createTimerBody({ sIdx, tIdx, timerData });

    header.addEventListener("click", () => {
        body.style.maxHeight = body.style.maxHeight
            ? null
            : `${body.scrollHeight}px`;
    });

    timer.appendChild(header);
    timer.appendChild(body);

    const saveBtn = body.querySelector("button.save-btn");
    saveBtn.addEventListener("click", () => {
        /* Save logic here if needed */
    });

    return timer;
};

const createTimerHeader = ({ sIdx, tIdx, timerData }) => {
    const header = document.createElement("div");
    header.classList.add("header");

    const titleDiv = createTitleDiv({ sIdx, tIdx, timerData });
    const timeDiv = createTimeDiv(timerData.time);

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    return header;
};

const createTimerBody = ({ sIdx, tIdx, timerData }) => {
    const sets = getSets();
    const set = sets[sIdx];
    if (!set) return;

    const body = document.createElement("div");
    body.classList.add("body");

    const progress = createProgressBar(
        100,
        `timer-${timerData.title.replace(" ", "-")}`
    );
    const alertBox = createAlertBox({ sIdx, tIdx, timerData });
    const copyDiv = createCopyDiv({ timerData });
    const inputField = createDurationPicker(timerData.time);
    const saveBtn = createSaveButton({ sIdx, tIdx, inputField });
    const startBtn = createStartButton({ sIdx, tIdx });
    const deleteBtn = createDeleteButton({ sIdx, tIdx });

    const checkboxDiv = document.createElement("div");
    checkboxDiv.className = "checkbox-div";
    const alertLabel = createLabel("Alert");
    alertLabel.className = "checkbox-label";

    checkboxDiv.appendChild(alertBox);
    checkboxDiv.appendChild(alertLabel);
    checkboxDiv.appendChild(copyDiv);

    body.appendChild(progress);
    body.appendChild(checkboxDiv);
    body.appendChild(inputField);
    body.appendChild(saveBtn);
    body.appendChild(startBtn);
    body.appendChild(deleteBtn);

    return body;
};

const createTitleDiv = ({ sIdx, tIdx, timerData }) => {
    const countdownDisplay = document.getElementById("countdown");

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

        const set = getSets()[sIdx];
        if (hasTitle(set.timers, newTitle)) {
            showAlert(countdownDisplay, "Name already exists!");
            titleDiv.textContent = truncateString(timerData.title);
            return;
        }

        const sets = getSets();
        sets[sIdx].timers[tIdx].title = newTitle;
        setSets(sets);

        titleDiv.textContent = truncateString(newTitle);
        titleDiv.title = newTitle;
    };

    return titleDiv;
};

const createTimeDiv = (time) => {
    const timeDiv = document.createElement("div");
    timeDiv.textContent = time;
    timeDiv.title = "Duration of countdown";
    return timeDiv;
};

const createAlertBox = ({ sIdx, tIdx, timerData }) => {
    const countdownDisplay = document.getElementById("countdown");
    const alertBox = document.createElement("input");
    alertBox.setAttribute("type", "checkbox");
    alertBox.id = `${timerData.title.replace(" ", "-")}-alertbox`;

    alertBox.checked = timerData.alert;
    alertBox.title = alertBox.checked
        ? "You will be notified once countdown ends"
        : "Countdown will end quietly";

    alertBox.onclick = async () => {
        if (Notification.permission !== "granted" && alertBox.checked) {
            await requestNotificationPermission();
        }

        if (Notification.permission !== "granted" && alertBox.checked) {
            showAlert(countdownDisplay, "Notifications are blocked!");
            alertBox.checked = false;
            return;
        }

        const sets = getSets();
        sets[sIdx].timers[tIdx].alert = alertBox.checked;
        setSets(sets);

        const activeAlertBox = document.getElementById(
            `${timerData.title.replace(" ", "-")}-active-alertbox`
        );
        if (activeAlertBox) activeAlertBox.checked = alertBox.checked;
    };

    return alertBox;
};

const createCopyDiv = ({ timerData }) => {
    const sets = getSets();
    const copyDiv = document.createElement("div");
    copyDiv.className = "dropdown";

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy >";
    const copyLocations = document.createElement("div");
    copyLocations.className = "dropdown-content";

    copyDiv.onclick = () => {
        copyLocations.style.display = "block";
    };

    sets.forEach((set, idx) => {
        const location = document.createElement("div");
        location.textContent = set.title;
        location.onclick = () => {
            let i = 1;
            let timerTitle = timerData.title;

            while (hasTitle(set.timers, timerTitle)) {
                timerTitle = `${timerData.title} (${i})`;
                i++;
            }

            const copyingTimer = { ...timerData, title: timerTitle };
            sets[idx].timers.push(copyingTimer);

            setSets(sets);
            initializeTimers({ sIdx: idx });

            const currentSet = document.getElementById("current-set");
            currentSet.textContent = set.title;

            const countdownDisplay = document.getElementById("countdown");
            showAlert(
                countdownDisplay,
                `${timerData.title} has been copied to ${set.title}`
            );
        };
        copyLocations.appendChild(location);
    });

    copyDiv.appendChild(copyBtn);
    copyDiv.appendChild(copyLocations);

    return copyDiv;
};

const createSaveButton = ({ sIdx, tIdx, inputField }) => {
    const countdownDisplay = document.getElementById("countdown");
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.classList.add("save-btn");
    saveBtn.title = "Click to update countdown duration";

    saveBtn.onclick = () => {
        const sets = getSets();
        sets[sIdx].timers[tIdx].time = inputField.value;

        const { overlapping, setTitle } = isOverlappingWithExistingSet(
            sets[sIdx],
            sets
        );
        if (overlapping) {
            showAlert(
                countdownDisplay,
                `Set "${setTitle}" already occupies this time!`
            );
        } else {
            setSets(sets);
            initializeTimers({ sIdx });
        }
    };

    return saveBtn;
};

const createStartButton = ({ sIdx, tIdx }) => {
    const startBtn = document.createElement("button");
    startBtn.textContent = "Start";
    startBtn.title = "Start the countdown";

    startBtn.onclick = () => {
        startCounting({ sIdx, tIdx, partialStart: false });
        document.getElementById("pause-btn").textContent = "||";
    };

    return startBtn;
};

const createDeleteButton = ({ sIdx, tIdx }) => {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.title = "Delete this timer";

    deleteBtn.onclick = () => {
        const sets = getSets();
        sets[sIdx].timers.splice(tIdx, 1);
        setSets(sets);
        initializeTimers({ sIdx });
    };

    return deleteBtn;
};

const showAlert = (element, message) => {
    element.textContent = message;
    setTimeout(() => {
        element.textContent = "";
    }, 3000);
};
