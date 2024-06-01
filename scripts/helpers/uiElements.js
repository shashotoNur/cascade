import {
    truncateString,
    isOverlappingWithExistingSet,
} from "../logic/utils.js";
import { initializeSets } from "./initialize.js";
import { createActiveTimer } from "../components/activeTimer.js";
import { startCounting } from "../logic/timerCountdown.js";
import { getSets, setSets } from "../logic/state.js";

export const createProgressBar = (max, id) => {
    const progress = document.createElement("progress");
    progress.className = "progress";
    progress.value = 0;
    progress.max = max;
    progress.id = id;
    return progress;
};

export const createLabel = (text) => {
    const label = document.createElement("span");
    label.textContent = text;
    return label;
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
    const set = getSets()[sIdx];
    const timer = set.timers[tIdx];

    const btn = document.createElement("button");
    btn.textContent = truncateString(timer?.title || "None");
    btn.title = timer?.title || "None";
    btn.disabled = !timer?.title;
    btn.onclick = () => {
        createActiveTimer({ sIdx, tIdx });
        startCounting({ sIdx, tIdx, partialStart: false });
        document.getElementById("pause-btn").textContent = "||";
    };
    return btn;
};

export const createScheduleButton = ({ sIdx, inputField }) => {
    const sets = getSets();
    const setData = sets[sIdx];

    const countdownDisplay = document.getElementById("countdown");

    const scheduleBtn = document.createElement("button");
    scheduleBtn.textContent = setData.scheduled ? "Scheduled" : "Not scheduled";
    scheduleBtn.addEventListener("click", () => {
        if (!setData.scheduled) {
            sets[sIdx].time =
            inputField.value === "" ? "00:00" : inputField.value;
            sets[sIdx].scheduled = true;

            const { overlapping, setTitle } = isOverlappingWithExistingSet(
                sets[sIdx],
                sets
            );

            if (overlapping) {
                countdownDisplay.textContent = `Set "${setTitle}" already occupies this time!`;
                return setTimeout(() => {
                    countdownDisplay.textContent = "";
                }, 3000);
            }
            setData.time = inputField.value === "" ? "00:00" : inputField.value;
        } else setData.time = null;

        setData.scheduled = !setData.scheduled;
        scheduleBtn.textContent = setData.scheduled
            ? "Scheduled"
            : "Not scheduled";
        sets[sIdx].scheduled = setData.scheduled;

        setSets(sets);
        initializeSets(sets);
    });
    return scheduleBtn;
};
