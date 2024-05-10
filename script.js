const setsList = document.getElementById("sets-list");
const timersList = document.getElementById("timers-list");
const currentSet = document.getElementById("current-set");
const countdown = document.getElementById("countdown");

const setsString = localStorage.getItem("sets");
const sets = setsString ? JSON.parse(setsString) : [];

let isIntervalRunning = false;
let intervalId;

const initializeSets = (sets) => {
    setsList.querySelector("ul").innerHTML = "";
    sets.forEach((_, index) =>
        setsList.querySelector("ul").appendChild(createSet(sets, index))
    );
};

const initializeTimers = (timers) => {
    const timerUL = timersList.querySelector("ul");
    timerUL.innerHTML = "";
    timers.forEach((_, index) =>
        timerUL.appendChild(createTimer(timers, index))
    );
};

const addNewSet = () => {
    const newSet = {
        title: "New Set",
        scheduled: false,
        time: "",
        timers: [],
    };

    sets.push(newSet);
    initializeSets(sets);

    localStorage.setItem("sets", JSON.stringify(sets));
};

const addNewTimer = () => {
    const newTimer = {
        title: "New Timer",
        time: "",
        alert: false,
    };

    const targetSetIndex = sets.findIndex(
        (set) => set.title === currentSet.innerText
    );
    sets[targetSetIndex].timers.push(newTimer);

    initializeTimers(sets[targetSetIndex].timers);
    localStorage.setItem("sets", JSON.stringify(sets));
};

const startCounting = (timers, index) => {
    const timer = timers[index];
    if (!timer) {
        countdown.textContent = "";
        document.title = "Scheduler";
        return;
    }
    createActiveTimer(timers, index);

    const prefix = timer.title + " [" + currentSet.textContent + "]: ";
    let [hours, minutes, seconds] = timer.time.split(":").map(Number);

    let duration = hours * 3600 + minutes * 60 + seconds;

    if (isIntervalRunning) return;

    const initialDuration = duration;
    intervalId = setInterval(() => {
        minutes = parseInt(duration / 60, 10);
        seconds = parseInt(duration % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        isIntervalRunning = true;
        countdown.textContent = prefix + minutes + ":" + seconds;
        document.title = minutes + ":" + seconds;
        progress = ((initialDuration - duration) * 100) / initialDuration;
        const progressBar = document.getElementById(
            `timer-${timers[index].title}`
        );
        const activeBar = document.getElementById(
            `timer-${timers[index].title}-active`
        );
        progressBar.value = progress;
        activeBar.value = progress;

        if (--duration < 0) {
            clearInterval(intervalId);
            isIntervalRunning = false;
            if (timer.alert) {
                sendNotification(
                    timer.title,
                    "Your timer countdown has finished!"
                );
            }

            startCounting(timers, index + 1);
        }
    }, 1000);
};

const handleImportFile = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function ({ target }) {
        const { result } = target;
        localStorage.setItem("sets", result);

        const sets = JSON.parse(result);
        initializeSets(sets);
    };

    reader.readAsText(file);
};

const exportSetsToFile = () => {
    const storedSetsString = localStorage.getItem("sets");
    if (!storedSetsString) return;

    const blob = new Blob([storedSetsString], { type: "application/json" });
    const downloadLink = document.createElement("a");

    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "my-sets.json";

    downloadLink.click();

    window.setTimeout(() => URL.revokeObjectURL(downloadLink.href), 10 * 1000);
};

const createProgressBar = (max, title) => {
    const progress = document.createElement("progress");
    progress.className = "progress";
    progress.value = 0;
    progress.max = max;
    progress.id = `timer-${title}`;
    return progress;
};

const createLabel = (text) => {
    const label = document.createElement("span");
    label.textContent = text;
    return label;
};

const createDurationPicker = (time) => {
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

    picker.value = time ? time : "000:00:00";
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

const createNavigationButton = (timers, index) => {
    const btn = document.createElement("button");
    btn.textContent = timers[index]?.title || "None";
    btn.disabled = !timers[index]?.title;
    btn.onclick = () => {
        createActiveTimer(timers, index);
        startCounting(timers, index);
    };
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

        if (setData.scheduled) return;

        setData.time = null;
        initializeSets(sets);
        localStorage.setItem("sets", JSON.stringify(sets));
    });
    return scheduleBtn;
};

const createActiveTimer = (timers, index) => {
    if (!timers[index]) return;
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
    timeDiv.textContent = timerData.time;

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    return header;
};

const createActiveTimerBody = (timers, index) => {
    const detailDiv = document.createElement("div");
    const controlDiv = document.createElement("div");
    controlDiv.className = "control-div";

    const progress = createProgressBar(100, timers[index].title + "-active");
    const alertBox = document.createElement("input");
    alertBox.setAttribute("type", "checkbox");
    alertBox.checked = timers[index].alert;
    alertBox.onclick = () => {
        timers[index].alert = alertBox.checked;
        localStorage.setItem("sets", JSON.stringify(sets));
    };

    const inputField = createDurationPicker(timers[index].time);
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.onclick = () => {
        timers[index].time = inputField.value;
        initializeTimers(timers);
        localStorage.setItem("sets", JSON.stringify(sets));
    };

    const prevBtn = createNavigationButton(timers, index - 1, progress);
    const nextBtn = createNavigationButton(timers, index + 1, progress);

    const stopBtn = document.createElement("button");
    stopBtn.textContent = "▣";
    stopBtn.onclick = () => {
        clearInterval(intervalId);
        countdown.textContent = "";
        document.title = "Scheduler";
    };

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

    const header = createTimerHeader(timers, index);
    const body = createTimerBody(timers, index);

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

const createTimerHeader = (timers, index) => {
    const timerData = timers[index];
    const header = document.createElement("div");
    header.classList.add("header");

    const titleDiv = document.createElement("div");
    titleDiv.textContent = timerData.title;
    titleDiv.onclick = () => {
        titleDiv.contentEditable = true;
        titleDiv.focus(); // Set focus for immediate editing
    };

    titleDiv.onkeydown = (event) => {
        if (event.key !== "Enter") return;

        const newTitle = titleDiv.textContent.trim();
        titleDiv.contentEditable = false;

        const setIndex = sets.findIndex(
            (set) => set.title === currentSet.innerText
        );
        sets[setIndex].timers[index].title = newTitle;
        localStorage.setItem("sets", JSON.stringify(sets));
    };

    const timeDiv = document.createElement("div");
    timeDiv.textContent = timerData.time;

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    return header;
};

const createTimerBody = (timers, index) => {
    const body = document.createElement("div");
    body.classList.add("body");

    const progress = createProgressBar(100, timers[index].title);
    const alertBox = document.createElement("input");
    alertBox.setAttribute("type", "checkbox");
    alertBox.checked = timers[index].alert;
    alertBox.onclick = () => {
        timers[index].alert = alertBox.checked;
        localStorage.setItem("sets", JSON.stringify(sets));
    };
    const inputField = createDurationPicker(timers[index].time);
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.onclick = () => {
        timers[index].time = inputField.value;
        initializeTimers(timers);
        localStorage.setItem("sets", JSON.stringify(sets));
    };

    const startBtn = document.createElement("button");
    startBtn.textContent = "Start";
    startBtn.onclick = () => startCounting(timers, index);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => {
        const targetSetIndex = sets.findIndex(
            (set) => set.title === currentSet.innerText
        );
        sets[targetSetIndex].timers.splice(index, 1);

        initializeTimers(timers);
        localStorage.setItem("sets", JSON.stringify(sets));
    };

    body.appendChild(progress);
    body.appendChild(alertBox);
    body.appendChild(createLabel("Alert"));
    body.appendChild(inputField);
    body.appendChild(saveBtn);
    body.appendChild(startBtn);
    body.appendChild(deleteBtn);

    return body;
};

const createSet = (sets, index) => {
    const set = document.createElement("li");
    set.classList.add("set");
    set.draggable = true;

    const header = createSetHeader(sets, index);
    const body = createSetBody(sets, index);

    header.addEventListener("click", () => {
        body.style.maxHeight = body.style.maxHeight
            ? null
            : body.scrollHeight + "px";

        const { timers } = sets[index];
        currentSet.innerText = sets[index].title;
        initializeTimers(timers);
    });

    set.appendChild(header);
    set.appendChild(body);

    return set;
};

const createSetHeader = (sets, index) => {
    const setData = sets[index];
    const header = document.createElement("div");
    header.classList.add("header");

    const titleDiv = document.createElement("div");
    titleDiv.textContent = setData.title;
    titleDiv.onclick = () => {
        titleDiv.contentEditable = true;
        titleDiv.focus(); // Set focus for immediate editing
    };

    titleDiv.onkeydown = (event) => {
        if (event.key !== "Enter") return;

        const newTitle = titleDiv.textContent.trim();
        titleDiv.contentEditable = false;

        sets[index].title = newTitle;
        localStorage.setItem("sets", JSON.stringify(sets));
    };

    const timeDiv = document.createElement("div");
    timeDiv.textContent = setData.scheduled ? setData.time : "Not scheduled";

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    return header;
};

const createSetBody = (sets, index) => {
    const setData = sets[index];
    const body = document.createElement("div");
    body.classList.add("body");

    const progress = createProgressBar(100, setData.title);
    const inputField = document.createElement("input");
    inputField.className = "input-field";
    inputField.type = "time";
    inputField.value = setData.scheduled ? setData.time : "";

    inputField.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const enteredTime = inputField.value;
            sets[index].time = enteredTime;
            sets[index].scheduled = true;
            console.log(sets);
            initializeSets(sets);
            localStorage.setItem("sets", JSON.stringify(sets));
        }
    });

    const scheduleBtn = createScheduleButton(setData);
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = () => {
        sets.splice(index, 1);

        initializeSets(sets);
        localStorage.setItem("sets", JSON.stringify(sets));
    };

    body.appendChild(progress);
    body.appendChild(inputField);
    body.appendChild(scheduleBtn);
    body.appendChild(deleteButton);

    return body;
};

// Populate list items for sets and timers
initializeSets(sets);

if (sets.length > 0) {
    const { timers } = sets[0];
    currentSet.innerText = sets[0].title;
    initializeTimers(timers);
    createActiveTimer(timers, 0);
}

const importFileInput = document.getElementById("import-btn");
importFileInput.addEventListener("change", handleImportFile);

const exportButton = document.getElementById("export-btn");
exportButton.addEventListener("click", exportSetsToFile);

const addSetButton = document.getElementById("add-set-btn");
addSetButton.addEventListener("click", addNewSet);

const addTimerButton = document.getElementById("add-timer-btn");
addTimerButton.addEventListener("click", addNewTimer);

// --------------------------------------------------------------
// ---------------- Drag and Drop functionality -----------------
// --------------------------------------------------------------

let draggedItem = null;

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

let orderOfArrays = [];

const handleDragEnd = (event) => {
    setTimeout(() => {
        if (event.target.className == "set") {
            const ulElement = document.getElementById("sets");
            const listItems = ulElement.querySelectorAll("li");

            for (const listItem of listItems) {
                const headerDiv = listItem.querySelector(
                    ".header div:first-child"
                );

                if (headerDiv) {
                    const textContent = headerDiv.textContent.trim();
                    orderOfArrays.push(textContent);
                    if (orderOfArrays.length == listItems.length) {
                        const orderedSets = orderOfArrays.reduce(
                            (acc, currentTitle) => {
                                const matchingSet = sets.find(
                                    (set) => set.title === currentTitle
                                );
                                acc.push(matchingSet);
                                return acc;
                            },
                            []
                        );
                        localStorage.setItem(
                            "sets",
                            JSON.stringify(orderedSets)
                        );
                        orderOfArrays = [];
                    }
                }
            }
        } else {
            const ulElement = document.getElementById("timers");
            const listItems = ulElement.querySelectorAll("li");
            for (const listItem of listItems) {
                const headerDiv = listItem.querySelector(
                    ".header div:first-child"
                );

                if (headerDiv) {
                    const textContent = headerDiv.textContent.trim();
                    orderOfArrays.push(textContent);
                    if (orderOfArrays.length == listItems.length) {
                        const targetSetIndex = sets.findIndex(
                            (set) => set.title === currentSet.innerText
                        );
                        const { timers } = sets[targetSetIndex];
                        const orderedTimers = orderOfArrays.reduce(
                            (acc, currentTitle) => {
                                const matchingSet = timers.find(
                                    (timer) => timer.title === currentTitle
                                );
                                acc.push(matchingSet);
                                return acc;
                            },
                            []
                        );
                        sets[targetSetIndex].timers = orderedTimers;
                        localStorage.setItem("sets", JSON.stringify(sets));
                        orderOfArrays = [];
                    }
                }
            }
        }
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

function requestNotificationPermission() {
    if (!Notification.permission) return;

    Notification.requestPermission().then((permission) => {
        if (permission === "granted")
            console.log("Notification permission granted!");
        else console.log("Notification permission denied.");
    });
}

requestNotificationPermission();

function sendNotification(title, body, icon = "") {
    if (Notification.permission === "granted") {
        const notification = new Notification(title, {
            body: body,
            icon: icon,
        });

        notification.onclick = () => {
            window.open(window.location.href);
        };
    } else {
        console.log("Notification permission not granted.");
    }
}