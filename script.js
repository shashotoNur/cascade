const setsList = document.getElementById("sets-list");
const timersList = document.getElementById("timers-list");

const sets = [
    {
        title: "Morning",
        scheduled: true,
        time: "09:00",
        timers: [
            {
                title: "Rest",
                time: 10,
                alert: false,
            },
            {
                title: "Cardio",
                time: 60,
                alert: true,
            },
        ],
    },
    {
        title: "Afternoon",
        scheduled: false,
        timers: [
            {
                title: "Warm-up",
                time: 10,
                alert: false,
            },
            {
                title: "Strength training",
                time: 60,
                alert: true,
            },
            {
                title: "Cool-down",
                time: 15,
                alert: false,
            },
        ],
    },
    {
        title: "Evening",
        scheduled: true,
        time: "18:00",
        timers: [
            {
                title: "Yoga",
                time: 30,
                alert: true,
            },
        ],
    },
];

const createProgressBar = (value, max) => {
    const progress = document.createElement("progress");
    progress.className = "progress";
    progress.value = value;
    progress.max = max;
    return progress;
};

const createCheckbox = () => {
    const checkBox = document.createElement("input");
    checkBox.setAttribute("type", "checkbox");
    return checkBox;
};

const createLabel = (text) => {
    const label = document.createElement("span");
    label.textContent = text;
    return label;
};

const createTimeInput = (isScheduled, scheduledTime) => {
    const inputField = document.createElement("input");
    inputField.className = "input-field";
    inputField.type = "time";
    inputField.value = isScheduled ? scheduledTime : "";
    return inputField;
};

const createDurationPicker = () => {
    const picker = document.createElement("input");
    picker.type = "text";

    const acceptedKeys = [
        "Backspace",
        "ArrowLeft",
        "ArrowRight",
        "ArrowDown",
        "ArrowUp",
    ];

    const selectFocus = (event) => {
        //get cursor position and select nearest block;
        const cursorPosition = event.target.selectionStart;
        ("000:00:00"); //this is the format used to determine cursor location
        const hourMarker = event.target.value.indexOf(":");
        const minuteMarker = event.target.value.lastIndexOf(":");
        if (hourMarker < 0 || minuteMarker < 0) {
            //something wrong with the format. just return;
            return;
        }
        if (cursorPosition < hourMarker) {
            event.target.selectionStart = 0; //hours mode
            event.target.selectionEnd = hourMarker;
        }
        if (cursorPosition > hourMarker && cursorPosition < minuteMarker) {
            event.target.selectionStart = hourMarker + 1; //minutes mode
            event.target.selectionEnd = minuteMarker;
        }
        if (cursorPosition > minuteMarker) {
            event.target.selectionStart = minuteMarker + 1; //seconds mode
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
        sectioned = rawValue.split(":");
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
        sectioned = rawValue.split(":");
        let secondsValue = 0;
        if (sectioned.length === 3) {
            secondsValue =
                Number(sectioned[2]) +
                Number(sectioned[1] * 60) +
                Number(sectioned[0] * 60 * 60);
        }
        secondsValue -= 1;
        if (secondsValue < 0) {
            secondsValue = 0;
        }
        insertFormatted(inputBox, secondsValue);
    };

    const validateInput = (event) => {
        sectioned = event.target.value.split(":");
        if (sectioned.length !== 3) {
            event.target.value = "000:00:00"; //fallback to default
            return;
        }
        if (isNaN(sectioned[0])) {
            sectioned[0] = "000";
        }
        if (isNaN(sectioned[1]) || sectioned[1] < 0) {
            sectioned[1] = "00";
        }
        if (sectioned[1] > 59 || sectioned[1].length > 2) {
            sectioned[1] = "59";
        }
        if (isNaN(sectioned[2]) || sectioned[2] < 0) {
            sectioned[2] = "00";
        }
        if (sectioned[2] > 59 || sectioned[2].length > 2) {
            sectioned[2] = "59";
        }
        event.target.value = sectioned.join(":");
    };

    picker.value = "000:00:00";
    picker.style.textAlign = "right"; //align the values to the right (optional)
    picker.addEventListener("keydown", (event) => {
        //use arrow keys to increase value;
        if (event.key == "ArrowDown" || event.key == "ArrowUp") {
            if (event.key == "ArrowDown") {
                decreaseValue(event.target);
            }
            if (event.key == "ArrowUp") {
                increaseValue(event.target);
            }
            event.preventDefault(); //prevent default
        }

        if (isNaN(event.key) && !acceptedKeys.includes(event.key)) {
            event.preventDefault(); //prevent default
            return false;
        }
    });

    picker.addEventListener("focus", selectFocus); //selects a block of hours, minutes etc
    picker.addEventListener("click", selectFocus); //selects a block of hours, minutes etc
    picker.addEventListener("change", validateInput);
    picker.addEventListener("blur", validateInput);
    picker.addEventListener("keyup", validateInput);

    return picker;
};

const getAdjacentTimerTitle = (timers, index) => {
    return timers[index]?.title;
};

const createNavigationButton = (timers, index) => {
    const btn = document.createElement("button");
    btn.textContent = getAdjacentTimerTitle(timers, index) || "None";
    btn.disabled = !getAdjacentTimerTitle(timers, index);
    btn.onclick = () => createActiveTimer(timers, index);
    return btn;
};

const createScheduleButton = (setData) => {
    const scheduleBtn = document.createElement("button");
    scheduleBtn.textContent = setData.scheduled ? "Scheduled" : "Not scheduled";
    scheduleBtn.addEventListener("click", () => {
        setData.scheduled = !setData.scheduled;
        scheduleBtn.textContent = setData.scheduled
            ? "Scheduled"
            : "Not scheduled";
        const timeDiv =
            scheduleBtn.parentElement.querySelector("div:nth-child(2)");
        timeDiv.textContent = setData.scheduled
            ? setData.time
            : "Not scheduled";
    });
    return scheduleBtn;
};

const createActiveTimer = (timers, index) => {
    const timer = document.getElementById("active-timer");
    timer.textContent = "";

    const timerData = timers[index];

    const header = createActiveTimerHeader(timerData);
    const body = createActiveTimerBody(timers, index);

    // Build the timer structure
    timer.appendChild(header);
    timer.appendChild(body);

    return timer;
};

const createActiveTimerHeader = (timerData) => {
    const header = document.createElement("div");
    header.className = "header";

    const titleDiv = document.createElement("div");
    titleDiv.textContent = timerData.title;

    const timeDiv = document.createElement("div");
    timeDiv.textContent = timerData.time + " min";

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    return header;
};

const createActiveTimerBody = (timers, index) => {
    const detailDiv = document.createElement("div");
    const controlDiv = document.createElement("div");
    controlDiv.className = "control-div";

    const progress = createProgressBar(10, 100);
    const alertBox = createCheckbox();

    const inputField = createDurationPicker();
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";

    const prevBtn = createNavigationButton(timers, index - 1);
    const nextBtn = createNavigationButton(timers, index + 1);

    const stopBtn = document.createElement("button");
    stopBtn.textContent = "▣";
    const pauseBtn = document.createElement("button");
    pauseBtn.textContent = "||";
    const removeTimeBtn = document.createElement("button");
    removeTimeBtn.textContent = " - ";
    const timeChange = document.createElement("input");
    timeChange.type = "text";
    const addTimeBtn = document.createElement("button");
    addTimeBtn.textContent = " + ";

    controlDiv.appendChild(stopBtn);
    controlDiv.appendChild(pauseBtn);
    controlDiv.appendChild(removeTimeBtn);
    controlDiv.appendChild(timeChange);
    controlDiv.appendChild(addTimeBtn);

    detailDiv.appendChild(progress);
    detailDiv.appendChild(alertBox);
    detailDiv.appendChild(createLabel("Alert"));
    detailDiv.appendChild(inputField);
    detailDiv.appendChild(saveBtn);
    detailDiv.appendChild(prevBtn);
    detailDiv.appendChild(nextBtn);
    detailDiv.appendChild(controlDiv);

    const body = document.createElement("div");
    const lineBreak = document.createElement("br");
    body.appendChild(lineBreak);
    body.appendChild(detailDiv);

    return body;
};

const createTimer = (timers, index) => {
    const timer = document.createElement("li");
    timer.classList.add("timer");
    timer.draggable = true;

    const header = createTimerHeader(timers[index]);
    const body = createTimerBody(timers[index]);

    header.addEventListener("click", () => {
        body.style.maxHeight = body.style.maxHeight
            ? null
            : body.scrollHeight + "px";

        createActiveTimer(timers, index);
    });

    timer.appendChild(header);
    timer.appendChild(body);

    const saveBtn = body.querySelector("button");
    saveBtn.addEventListener("click", () => {});

    return timer;
};

const createTimerHeader = (timerData) => {
    const header = document.createElement("div");
    header.classList.add("header");

    const titleDiv = document.createElement("div");
    titleDiv.textContent = timerData.title;

    const timeDiv = document.createElement("div");
    timeDiv.textContent = timerData.time + " min";

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    return header;
};

const createTimerBody = (timerData) => {
    const body = document.createElement("div");
    body.classList.add("body");

    const progress = createProgressBar(10, 100);
    const alertBox = createCheckbox();
    const inputField = createTimeInput(timerData.scheduled, timerData.time);
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    const startBtn = document.createElement("button");
    startBtn.textContent = "Start";
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";

    body.appendChild(progress);
    body.appendChild(alertBox);
    body.appendChild(createLabel("Alert"));
    body.appendChild(inputField);
    body.appendChild(saveBtn);
    body.appendChild(startBtn);
    body.appendChild(deleteBtn);

    return body;
};

const createSet = (setData) => {
    const set = document.createElement("li");
    set.classList.add("set");
    set.draggable = true;

    const header = createSetHeader(setData);
    const body = createSetBody(setData);

    header.addEventListener("click", () => {
        body.style.maxHeight = body.style.maxHeight
            ? null
            : body.scrollHeight + "px";

        const { timers } = setData;
        const timerUL = timersList.querySelector("ul");
        timerUL.innerHTML = "";
        timers.forEach((_, index) =>
            timerUL.appendChild(createTimer(timers, index))
        );
    });

    set.appendChild(header);
    set.appendChild(body);

    return set;
};

const createSetHeader = (setData) => {
    const header = document.createElement("div");
    header.classList.add("header");

    const titleDiv = document.createElement("div");
    titleDiv.textContent = setData.title;

    const timeDiv = document.createElement("div");
    timeDiv.textContent = setData.scheduled ? setData.time : "Not scheduled";

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    return header;
};

const createSetBody = (setData) => {
    const body = document.createElement("div");
    body.classList.add("body");

    const progress = createProgressBar(10, 100);
    const inputField = createTimeInput(setData.scheduled, setData.time);
    const scheduleBtn = createScheduleButton(setData);
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";

    body.appendChild(progress);
    body.appendChild(inputField);
    body.appendChild(scheduleBtn);
    body.appendChild(deleteButton);

    return body;
};

// Populate list items for sets and timers
sets.forEach((setData) =>
    setsList.querySelector("ul").appendChild(createSet(setData))
);

const { timers } = sets[0];
timers.forEach((_, index) =>
    timersList.querySelector("ul").appendChild(createTimer(timers, index))
);

const activeTimer = timers[0];
createActiveTimer(timers, 0);

// --------------------------------------------------------------
// ---------------- Drag and Drop functionality -----------------
// --------------------------------------------------------------

let draggedItem = null;

// Create and return a newly ordered list
const getDragAfterElement = (container, y) => {
    const draggableElements = [
        ...container.querySelectorAll("li:not(.dragging)"),
    ];

    return draggableElements.reduce(
        (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset)
                return {
                    offset: offset,
                    element: child,
                };
            else return closest;
        },
        { offset: Number.NEGATIVE_INFINITY }
    ).element;
};

const handleDragStart = (event) => {
    draggedItem = event.target;
    setTimeout(() => {
        event.target.style.display = "none";
    }, 0);
};

const handleDragEnd = (event) => {
    setTimeout(() => {
        event.target.style.display = "";
        draggedItem = null;
    }, 0);
};

const handleDragOver = (event, list) => {
    event.preventDefault();
    const afterElement = getDragAfterElement(list, event.clientY);

    if (afterElement == null) list.appendChild(draggedItem);
    else list.insertBefore(draggedItem, afterElement);
};

const expandItem = ({ target }) => {
    const detailDiv = document.createElement("div");
    detailDiv.textContent = data.title;
    target.appendChild(detailDiv);
};

const draggableSets = document.getElementById("sets");

draggableSets.addEventListener("dragstart", handleDragStart);
draggableSets.addEventListener("dragend", handleDragEnd);
draggableSets.addEventListener("dragover", (e) =>
    handleDragOver(e, draggableSets)
);

const draggableTimers = document.getElementById("timers");

draggableTimers.addEventListener("dragstart", handleDragStart);
draggableTimers.addEventListener("dragend", handleDragEnd);
draggableTimers.addEventListener("dragover", (e) =>
    handleDragOver(e, draggableTimers)
);
