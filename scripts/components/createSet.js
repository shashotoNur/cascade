import {
    truncateString,
    hasTitle,
    moveCursorToEnd,
    convertTimeFormat,
    getReadableEndTime,
    isOverlappingWithExistingSet,
    formatDuration,
} from "../logic/utils.js";
import {
    createProgressBar,
    createScheduleButton,
} from "../helpers/uiElements.js";
import { initializeSets, initializeTimers } from "../helpers/initialize.js";
import { getSets, setSets } from "../logic/state.js";

export const createSet = ({ sIdx }) => {
    const set = document.createElement("li");
    set.classList.add("set");
    set.draggable = true;

    const sets = getSets();

    const header = createSetHeader({ sIdx });
    const body = createSetBody({ sIdx });

    header.addEventListener("click", () => {
        body.style.maxHeight = body.style.maxHeight
            ? null
            : body.scrollHeight + "px";

        Array.from(document.getElementsByClassName("body")).forEach((bd) => {
            if (body !== bd) bd.style.maxHeight = null;
        });

        const { timers } = sets[sIdx];
        if (body.style.maxHeight != "") {
            const currentSet = document.getElementById("current-set");
            currentSet.innerText = sets[sIdx].title;

            initializeTimers({ sIdx });
        }
    });

    set.appendChild(header);
    set.appendChild(body);

    return set;
};

const createSetHeader = ({ sIdx }) => {
    const sets = getSets();
    const setData = sets[sIdx];

    const countdownDisplay = document.getElementById("countdown");
    const header = document.createElement("div");
    header.classList.add("header");
    header.id = "id-" + setData.title.replace(" ", "-") + "-header";

    const titleDiv = document.createElement("div");
    titleDiv.textContent = truncateString(setData.title);
    titleDiv.title = setData.title;
    titleDiv.onclick = () => {
        titleDiv.contentEditable = true;
        moveCursorToEnd(titleDiv);
        titleDiv.focus();
    };

    titleDiv.onkeydown = (event) => {
        if (event.key !== "Enter") return;

        const newTitle = titleDiv.textContent.trim();
        titleDiv.contentEditable = false;

        const titleExists = hasTitle(sets, newTitle);
        if (titleExists) {
            countdownDisplay.textContent = "Name already exists!";
            setTimeout(() => (countdownDisplay.textContent = ""), 3000);
            return (titleDiv.textContent = truncateString(setData.title));
        }

        sets[sIdx].title = newTitle;
        setSets(sets);

        titleDiv.textContent = truncateString(newTitle);
        titleDiv.title = newTitle;
    };

    let totalSetTime = 0;
    setData.timers.forEach((timer, i) => {
        let [hours, minutes, seconds] = timer.time.split(":").map(Number);
        const timerTimeInSec = hours * 3600 + minutes * 60 + seconds;

        totalSetTime += timerTimeInSec;
    });

    const timeDiv = document.createElement("div");
    timeDiv.textContent = setData.scheduled
        ? convertTimeFormat(setData.time + ":00") +
          " - " +
          convertTimeFormat(getReadableEndTime(setData.time, setData.timers))
        : formatDuration(totalSetTime);
    timeDiv.title = setData.scheduled ? "Scheduled time" : "Timer Duration";

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    return header;
};

const createSetBody = ({ sIdx }) => {
    const sets = getSets();
    const setData = sets[sIdx];

    const countdownDisplay = document.getElementById("countdown");

    const body = document.createElement("div");
    body.classList.add("body");

    const progress = createProgressBar(
        100,
        `set-${setData.title.replace(" ", "-")}`
    );
    progress.title = "Progress bar";

    const inputField = document.createElement("input");
    inputField.className = "input-field";
    inputField.type = "time";
    inputField.value = setData.scheduled ? setData.time : "";
    inputField.title = "Set a time and press enter to confirm";

    inputField.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const enteredTime = inputField.value;
            if (enteredTime == "") return;

            sets[sIdx].time = enteredTime;
            sets[sIdx].scheduled = true;

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
                initializeSets(sets);
            }
        }
    });

    const scheduleBtn = createScheduleButton({ sIdx, inputField });
    scheduleBtn.title = setData.scheduled
        ? "Click to remove schedule"
        : "Click to add schedule";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.title = "Delete this set";
    deleteButton.onclick = () => {
        sets.splice(sIdx, 1);

        setSets(sets);
        initializeSets(sets);

        const currentSet = document.getElementById("current-set");
        if (currentSet.textContent == setData.title) {
            if (sets[0]) initializeTimers({ sIdx: 0 });

            currentSet.textContent = sets[0] ? sets[0].title : "";
        }
    };

    body.appendChild(progress);
    body.appendChild(inputField);
    body.appendChild(scheduleBtn);
    body.appendChild(deleteButton);

    return body;
};
