import {
    truncateString,
    hasTitle,
    moveCursorToEnd,
    convertTimeFormat,
    getReadableEndTime,
    isOverlappingWithExistingSet,
    formatDuration,
    showMessage,
} from "../logic/utils.js";
import {
    createProgressBar,
    createScheduleButton,
} from "../helpers/uiElements.js";
import { initializeSets, initializeTimers } from "../helpers/initialize.js";
import { getSets, setSets } from "../logic/state.js";

export const createSet = ({ sIdx }) => {
    const setElement = document.createElement("li");
    setElement.classList.add("set");
    setElement.draggable = true;

    const sets = getSets();
    const header = createSetHeader({ sIdx });
    const body = createSetBody({ sIdx });

    const toggleBodyVisibility = () => {
        body.style.maxHeight = body.style.maxHeight
            ? null
            : `${body.scrollHeight}px`;

        Array.from(document.getElementsByClassName("body")).forEach((bd) => {
            if (body !== bd) bd.style.maxHeight = null;
        });

        if (body.style.maxHeight) {
            document.getElementById("current-set").innerText = truncateString(sets[sIdx].title);
            initializeTimers({ sIdx });
        }
    };

    header.addEventListener("click", toggleBodyVisibility);

    setElement.appendChild(header);
    setElement.appendChild(body);

    return setElement;
};

const createSetHeader = ({ sIdx }) => {
    const sets = getSets();
    const setData = sets[sIdx];

    const header = createHeaderElement(setData);
    const titleDiv = createTitleDiv(setData, sIdx, sets);
    const timeDiv = createTimeDiv(setData);

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    return header;
};

const createSetBody = ({ sIdx }) => {
    const sets = getSets();
    const setData = sets[sIdx];

    const body = createBodyElement();
    body.id = `set-${setData.title}-body`;

    const progress = createProgressBar(
        100,
        `set-${setData.title.replace(" ", "-")}`
    );
    const inputField = createInputField(setData, sIdx, sets);
    const scheduleBtn = createScheduleButton({ sIdx, inputField });
    const deleteButton = createDeleteButton(setData, sIdx, sets);

    body.appendChild(progress);
    body.appendChild(inputField);
    body.appendChild(scheduleBtn);
    body.appendChild(deleteButton);

    return body;
};

const createHeaderElement = (setData) => {
    const header = document.createElement("div");
    header.classList.add("header");
    header.id = `id-${setData.title.replace(" ", "-")}-header`;
    return header;
};

const createTitleDiv = (setData, sIdx, sets) => {
    const titleDiv = document.createElement("div");
    titleDiv.textContent = truncateString(setData.title);
    titleDiv.title = setData.title;

    titleDiv.onclick = () => {
        titleDiv.contentEditable = true;
        titleDiv.textContent = setData.title;
        moveCursorToEnd(titleDiv);
        titleDiv.focus();
    };

    titleDiv.onkeydown = (event) => {
        if (event.key !== "Enter") return;

        const newTitle = titleDiv.textContent.trim();
        titleDiv.contentEditable = false;

        if (newTitle === "") {
            showMessage("Name cannot be empty", 3000);
            titleDiv.textContent = truncateString(setData.title);
            return;
        }

        if (hasTitle(sets, newTitle)) {
            showMessage("Name already exists.", 3000);
            titleDiv.textContent = truncateString(setData.title);
            return;
        }

        sets[sIdx].title = newTitle;
        setSets(sets);

        titleDiv.textContent = truncateString(newTitle);
        titleDiv.title = newTitle;
    };

    return titleDiv;
};

const createTimeDiv = (setData) => {
    const timeDiv = document.createElement("div");
    const totalSetTime = setData.timers.reduce((total, timer) => {
        const [hours, minutes, seconds] = timer.time.split(":").map(Number);
        return total + (hours * 3600 + minutes * 60 + seconds);
    }, 0);

    timeDiv.textContent = setData.scheduled
        ? `${convertTimeFormat(setData.time + ":00")} - ${convertTimeFormat(
              getReadableEndTime(setData.time, setData.timers)
          )}`
        : formatDuration(totalSetTime);
    timeDiv.title = setData.scheduled ? "Scheduled time" : "Timer Duration";

    return timeDiv;
};

const createBodyElement = () => {
    const body = document.createElement("div");
    body.classList.add("body");
    return body;
};

const createInputField = (setData, sIdx, sets) => {
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
                showMessage(
                    `Set "${setTitle}" already occupies this time!`,
                    3000
                );
            } else {
                setSets(sets);
                initializeSets(sets);
            }
        }
    });

    return inputField;
};

const createDeleteButton = (setData, sIdx, sets) => {
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.title = "Delete this set";

    deleteButton.onclick = () => {
        sets.splice(sIdx, 1);
        setSets(sets);
        initializeSets(sets);

        const currentSet = document.getElementById("current-set");
        if (currentSet.textContent == truncateString(setData.title)) {
            if (sets[0]) initializeTimers({ sIdx: 0 });
            currentSet.textContent = sets[0] ? truncateString(sets[0].title) : "";
        }
    };

    return deleteButton;
};
