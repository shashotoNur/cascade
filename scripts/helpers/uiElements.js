import {
    truncateString,
    isOverlappingWithExistingSet,
    showMessage,
} from "../logic/utils.js";
import { createActiveTimer } from "../components/activeTimer.js";
import { startCounting } from "../logic/timerCountdown.js";
import { getSets, setSets } from "../logic/state.js";
import { initializeSets } from "./initialize.js";

export const createProgressBar = (max, id) => {
    return createElement("progress", {
        className: "progress",
        value: 0,
        max,
        id,
    });
};

export const createLabel = (text) => {
    return createElement("span", { textContent: text });
};

export const createDurationPicker = (time) => {
    const picker = document.createElement("input");
    picker.type = "text";
    picker.className = "duration-picker";

    const acceptedKeys = [
        "Backspace",
        "ArrowLeft",
        "ArrowRight",
        "ArrowDown",
        "ArrowUp",
    ];

    const selectFocus = (event) => {
        const cursorPosition = event.target.selectionStart;
        const hourMarker = event.target.value.indexOf(":");
        const minuteMarker = event.target.value.lastIndexOf(":");
        if (hourMarker < 0 || minuteMarker < 0) return;

        if (cursorPosition < hourMarker) {
            event.target.selectionStart = 0;
            event.target.selectionEnd = hourMarker;
        }

        if (cursorPosition > hourMarker && cursorPosition < minuteMarker) {
            event.target.selectionStart = hourMarker + 1;
            event.target.selectionEnd = minuteMarker;
        }

        if (cursorPosition > minuteMarker) {
            event.target.selectionStart = minuteMarker + 1;
            event.target.selectionEnd = minuteMarker + 3;
        }
    };

    const insertFormatted = (inputBox, secondsValue) => {
        let hours = Math.floor(secondsValue / 3600);
        secondsValue %= 3600;
        let minutes = Math.floor(secondsValue / 60);
        let seconds = secondsValue % 60;

        minutes = String(minutes).padStart(2, "0");
        hours = String(hours).padStart(3, "0");
        seconds = String(seconds).padStart(2, "0");
        inputBox.value = hours + ":" + minutes + ":" + seconds;
    };

    const increaseValue = (inputBox) => {
        const rawValue = inputBox.value;
        const sectioned = rawValue.split(":");
        let secondsValue = 0;

        if (sectioned.length === 3) {
            secondsValue =
                Number(sectioned[2]) +
                Number(sectioned[1] * 60) +
                Number(sectioned[0] * 60 * 60);
        }
        secondsValue += 1;
        insertFormatted(inputBox, secondsValue);
    };

    const decreaseValue = (inputBox) => {
        const rawValue = inputBox.value;
        const sectioned = rawValue.split(":");
        let secondsValue = 0;
        if (sectioned.length === 3) {
            secondsValue =
                Number(sectioned[2]) +
                Number(sectioned[1] * 60) +
                Number(sectioned[0] * 60 * 60);
        }
        secondsValue -= 1;
        if (secondsValue < 0) secondsValue = 0;

        insertFormatted(inputBox, secondsValue);
    };

    const validateInput = (event) => {
        const sectioned = event.target.value.split(":");
        if (sectioned.length !== 3) {
            event.target.value = "00:00:00";
            return;
        }
        if (isNaN(sectioned[0])) sectioned[0] = "00";

        if (sectioned[0] > 23 || sectioned[0].length > 2) sectioned[0] = "23";

        if (isNaN(sectioned[1]) || sectioned[1] < 0) sectioned[1] = "00";

        if (sectioned[1] > 59 || sectioned[1].length > 2) sectioned[1] = "59";

        if (isNaN(sectioned[2]) || sectioned[2] < 0) sectioned[2] = "00";

        if (sectioned[2] > 59 || sectioned[2].length > 2) sectioned[2] = "59";

        event.target.value = sectioned.join(":");
    };

    picker.value = time ? time : "00:00:00";
    picker.style.textAlign = "right";
    picker.addEventListener("keydown", (event) => {
        if (event.key == "ArrowDown" || event.key == "ArrowUp") {
            if (event.key == "ArrowDown") decreaseValue(event.target);

            if (event.key == "ArrowUp") increaseValue(event.target);

            event.preventDefault();
        }

        if (isNaN(event.key) && !acceptedKeys.includes(event.key)) {
            event.preventDefault();
            return false;
        }
    });

    picker.addEventListener("focus", selectFocus);
    picker.addEventListener("click", selectFocus);
    picker.addEventListener("change", validateInput);
    picker.addEventListener("blur", validateInput);
    picker.addEventListener("keyup", validateInput);

    return picker;
};

export const createNavigationButton = ({ sIdx, tIdx }) => {
    const timer = getSets()[sIdx]?.timers[tIdx];
    const title = timer ? truncateString(timer.title) : "None";

    return createElement("button", {
        textContent: title,
        title: title,
        disabled: !timer?.title,
        onclick: handleNavigationButtonClick.bind(null, { sIdx, tIdx }),
    });
};

export const createScheduleButton = ({ sIdx, inputField }) => {
    const setData = getSets()[sIdx];
    const buttonText = setData.scheduled ? "Scheduled" : "Not scheduled";

    const scheduleBtn = createElement("button", { textContent: buttonText });
    scheduleBtn.title = setData.scheduled
        ? "Click to remove schedule"
        : "Click to add a schedule";

    scheduleBtn.addEventListener("click", () => {
        handleScheduleButtonClick({ sIdx, inputField, btn: scheduleBtn });
    });

    return scheduleBtn;
};

const createElement = (tag, options) => {
    const element = document.createElement(tag);

    if (options) {
        for (const [key, value] of Object.entries(options)) {
            if (key === "onclick") {
                element.onclick = value;
            } else {
                element[key] = value;
            }
        }
    }

    return element;
};

const handleNavigationButtonClick = ({ sIdx, tIdx }) => {
    const timer = getSets()[sIdx]?.timers[tIdx];
    if (!timer) return;

    createActiveTimer({ sIdx, tIdx });
    startCounting({ sIdx, tIdx, partialStart: false });
    document.getElementById("pause-btn").textContent = "||";
};

const handleScheduleButtonClick = ({ sIdx, inputField, btn }) => {
    const sets = getSets();
    const setData = sets[sIdx];

    if (!setData.scheduled) {
        setData.time = inputField.value === "" ? "00:00" : inputField.value;
        setData.scheduled = true;

        const { overlapping, setTitle } = isOverlappingWithExistingSet(
            setData,
            sets
        );

        if (overlapping)
            return showMessage(
                `Set "${setTitle}" already occupies this time!`,
                3000
            );
    } else {
        setData.time = null;
        setData.scheduled = false;
    }

    sets[sIdx] = setData;
    setSets(sets);

    initializeSets();

    return btn;
};
