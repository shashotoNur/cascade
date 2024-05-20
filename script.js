const hasTitle = (array, title) => {
    for (const object of array) {
        if (object.title === title) {
            return true;
        }
    }
    return false;
};

const isCountdownFormat = (text) => {
    const regex = /^([^:]+)(?:\[([^:]*)\])?[: ](.*)$/;
    return regex.test(text);
};

const initializeSets = (sets) => {
    setsList.querySelector("ul").innerHTML = "";
    sets.forEach((_, index) =>
        setsList.querySelector("ul").appendChild(createSet(sets, index))
    );
};

const initializeTimers = (timers, setTitle) => {
    const timerUL = timersList.querySelector("ul");
    timerUL.innerHTML = "";
    timers.forEach((_, index) =>
        timerUL.appendChild(createTimer(timers, index, setTitle))
    );
    Array.from(gotoTimersBtns).forEach(
        (btn) => (btn.title = `Display timers in ${setTitle}`)
    );
};

const addNewSet = () => {
    const newSet = {
        title: "New Set",
        scheduled: false,
        time: "",
        timers: [],
    };

    let i = 1;
    while (true) {
        const titleExists = hasTitle(sets, newSet.title);
        if (!titleExists) break;
        newSet.title = `New Set (${i})`;
        i++;
    }

    sets.push(newSet);
    initializeSets(sets);

    localStorage.setItem("sets", JSON.stringify(sets));

    const newSetHeader = document.getElementById(
        "id-" + newSet.title.replace(" ", "-") + "-header"
    );
    newSetHeader.click();
};

const addNewTimer = () => {
    const newTimer = {
        title: "New Timer",
        time: "000:00:00",
        alert: false,
    };

    const targetSetIndex = sets.findIndex(
        (set) => set.title === currentSet.innerText
    );

    if (targetSetIndex == -1) return console.log("No set matches");

    const { timers } = sets[targetSetIndex];

    let i = 1;
    while (true) {
        const titleExists = hasTitle(timers, newTimer.title);
        if (!titleExists) break;
        newTimer.title = `New Timer (${i})`;
        i++;
    }

    sets[targetSetIndex].timers.push(newTimer);

    initializeTimers(sets[targetSetIndex].timers, sets[targetSetIndex].title);
    localStorage.setItem("sets", JSON.stringify(sets));
};

const truncateString = (str, maxLength = 32) => {
    return str.length > maxLength ? str.slice(0, maxLength - 3) + "..." : str;
};

const startCounting = (timers, index, partialStart = false, setTitle) => {
    clearInterval(intervalId);
    const timer = timers[index];

    const setProgressBar = document.getElementById(
        `set-${setTitle.replace(" ", "-")}`
    );

    if (!timer) {
        setProgressBar.value = 0;
        countdownDisplay.textContent = "";
        document.title = "Cascade";
        return;
    }
    createActiveTimer(timers, index, setTitle);

    const prefix = timer.title + " [" + setTitle + "]: ";
    let [hours, minutes, seconds] = timer.time.split(":").map(Number);
    let initialDuration = hours * 3600 + minutes * 60 + seconds;
    if (!partialStart) duration = initialDuration;

    let totalSetTime = 0;
    completedDuration = 0;
    const set = sets.find((set) => set.title === setTitle);
    set.timers.forEach((timer, i) => {
        let [hours, minutes, seconds] = timer.time.split(":").map(Number);
        const timerTimeInSec = hours * 3600 + minutes * 60 + seconds;
        if (i < index) {
            completedDuration += timerTimeInSec;
        }
        totalSetTime += timerTimeInSec;
    });

    const countdown = () => {
        minutes = parseInt(duration / 60, 10);
        seconds = parseInt(duration % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        countdownDisplay.textContent = prefix + minutes + ":" + seconds;
        document.title = minutes + ":" + seconds;

        const progressBar = document.getElementById(
            `timer-${timers[index].title.replace(" ", "-")}`
        );
        const activeBar = document.getElementById(
            `timer-${timers[index].title.replace(" ", "-")}-active`
        );
        if (initialDuration > 0) {
            const d = initialDuration - duration;
            if (d < 0) initialDuration += d * -1;

            const progress =
                ((initialDuration - duration) * 100) / initialDuration;
            if (progressBar) progressBar.value = progress;
            activeBar.value = progress;

            if (completedDuration < 0) totalSetTime += completedDuration * -1;

            const setProgress = (completedDuration * 100) / totalSetTime;
            if (setProgressBar) setProgressBar.value = setProgress;
        }
        completedDuration += 1;

        if (--duration < 0) {
            clearInterval(intervalId);

            if (progressBar) progressBar.value = 0;
            activeBar.value = 0;

            if (timer.alert) {
                sendNotification(timer.title);
                audio.play();

                setTimeout(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }, 2000);
            }

            const nextTimerIndex = timer.loop ? index : index + 1;
            startCounting(timers, nextTimerIndex, false, setTitle);
        }
    };
    countdown();
    intervalId = setInterval(countdown, 1000);
};

const importDataFromFile = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function ({ target }) {
        const { result } = target;
        localStorage.setItem("sets", result);

        sets = JSON.parse(result);
        initializeSets(sets);
        initializeTimers(sets[0].timers, sets[0].title);
        currentSet.textContent = sets[0].title;
    };

    reader.readAsText(file);
};

const exportDataToFile = () => {
    const storedSetsString = localStorage.getItem("sets");
    if (!storedSetsString) return;

    const blob = new Blob([storedSetsString], { type: "application/json" });
    const downloadLink = document.createElement("a");

    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "my-sets.json";

    downloadLink.click();

    window.setTimeout(() => URL.revokeObjectURL(downloadLink.href), 10 * 1000);
};

const createProgressBar = (max, id) => {
    const progress = document.createElement("progress");
    progress.className = "progress";
    progress.value = 0;
    progress.max = max;
    progress.id = id;
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
        if (secondsValue < 0) secondsValue = 0;

        insertFormatted(inputBox, secondsValue);
    };

    const validateInput = (event) => {
        sectioned = event.target.value.split(":");
        if (sectioned.length !== 3) {
            event.target.value = "000:00:00";
            return;
        }
        if (isNaN(sectioned[0])) sectioned[0] = "000";

        if (isNaN(sectioned[1]) || sectioned[1] < 0) sectioned[1] = "00";

        if (sectioned[1] > 59 || sectioned[1].length > 2) sectioned[1] = "59";

        if (isNaN(sectioned[2]) || sectioned[2] < 0) sectioned[2] = "00";

        if (sectioned[2] > 59 || sectioned[2].length > 2) sectioned[2] = "59";

        event.target.value = sectioned.join(":");
    };

    picker.value = time ? time : "000:00:00";
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

const createNavigationButton = (timers, index, setTitle) => {
    const btn = document.createElement("button");
    btn.textContent = truncateString(timers[index]?.title || "None");
    btn.title = timers[index]?.title || "None";
    btn.disabled = !timers[index]?.title;
    btn.onclick = () => {
        createActiveTimer(timers, index, setTitle);
        startCounting(timers, index, false, setTitle);
        document.getElementById("pause-btn").textContent = "||";
    };
    return btn;
};

const createScheduleButton = (setData, inputField) => {
    const scheduleBtn = document.createElement("button");
    scheduleBtn.textContent = setData.scheduled ? "Scheduled" : "Not scheduled";
    scheduleBtn.addEventListener("click", () => {
        setData.scheduled = !setData.scheduled;
        scheduleBtn.textContent = setData.scheduled
            ? "Scheduled"
            : "Not scheduled";

        if (!setData.scheduled) setData.time = null;
        else setData.time = inputField.value;
        initializeSets(sets);
        localStorage.setItem("sets", JSON.stringify(sets));
    });
    return scheduleBtn;
};

const createActiveTimer = (timers, index, setTitle) => {
    if (!timers[index]) return;
    const timer = document.getElementById("active-timer");
    timer.textContent = "";

    const timerData = timers[index];

    const header = createActiveTimerHeader(timerData);
    const body = createActiveTimerBody(timers, index, setTitle);

    timer.appendChild(header);
    timer.appendChild(body);

    return timer;
};

const createActiveTimerHeader = (timerData) => {
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

    return header;
};

const createActiveTimerBody = (timers, index, setTitle) => {
    const detailDiv = document.createElement("div");
    const controlDiv = document.createElement("div");
    controlDiv.className = "control-div";

    const progress = createProgressBar(
        100,
        `timer-${timers[index].title.replace(" ", "-")}` + "-active"
    );
    progress.title = "Progress bar";

    const alertBox = document.createElement("input");
    alertBox.setAttribute("type", "checkbox");
    const alertBoxId =
        timers[index].title.replace(" ", "-") + "-active-alertbox";
    alertBox.id = alertBoxId;

    alertBox.checked = timers[index].alert;
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

        timers[index].alert = alertBox.checked;
        localStorage.setItem("sets", JSON.stringify(sets));
        document.getElementById(
            timers[index].title.replace(" ", "-") + "-alertbox"
        ).checked = alertBox.checked;
    };

    const loopBox = document.createElement("input");
    loopBox.setAttribute("type", "checkbox");
    loopBox.id = timers[index].title.replace(" ", "-") + "-active-loopbox";

    loopBox.checked = timers[index].loop;
    loopBox.title = loopBox.checked
        ? "The countdown will restart endlessly until stopped"
        : "Countdown will end after a single run";
    loopBox.onclick = async () => {
        timers[index].loop = loopBox.checked;
        loopBox.title = loopBox.checked
            ? "The countdown will restart endlessly until stopped"
            : "Countdown will end after a single run";
    };

    const pauseBtn = document.createElement("button");
    pauseBtn.id = "pause-btn";
    pauseBtn.textContent = ">";
    pauseBtn.title = "Click to start timer";
    pauseBtn.onclick = () => {
        if (pauseBtn.textContent == "||") clearInterval(intervalId);
        else {
            const inSession = isCountdownFormat(countdownDisplay.textContent);
            startCounting(timers, index, (partialStart = inSession), setTitle);
        }

        const thisBtn = document.getElementById("pause-btn");
        thisBtn.textContent = pauseBtn.textContent == "||" ? ">" : "||";
        thisBtn.title =
            thisBtn.textContent == "||" ? "Click to pause" : "Click to resume";
    };

    const stopBtn = document.createElement("button");
    stopBtn.textContent = "▣";
    stopBtn.title = "Stop this timer";
    stopBtn.onclick = () => {
        clearInterval(intervalId);
        countdownDisplay.textContent = "";
        document.title = "Cascade";
        pauseBtn.textContent = ">";
    };

    const zeroSec = "000:00:00";
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
        duration -= timeValue;
        completedDuration += timeValue;
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
        duration += timeValue;
        completedDuration -= timeValue;
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

    const prevBtn = createNavigationButton(timers, index - 1, setTitle);
    const nextBtn = createNavigationButton(timers, index + 1, setTitle);

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

const createTimer = (timers, index, setTitle) => {
    const timer = document.createElement("li");
    timer.classList.add("timer");
    timer.draggable = true;

    const header = createTimerHeader(timers, index);
    const body = createTimerBody(timers, index, setTitle);

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
    titleDiv.textContent = truncateString(timerData.title);
    titleDiv.title = timerData.title;
    titleDiv.onclick = () => {
        titleDiv.contentEditable = true;
        titleDiv.textContent = timerData.title;
        titleDiv.focus();
    };

    titleDiv.onkeydown = (event) => {
        if (event.key !== "Enter") return;

        const newTitle = titleDiv.textContent.trim();
        titleDiv.contentEditable = false;

        const titleExists = hasTitle(timers, newTitle);
        if (titleExists) {
            countdownDisplay.textContent = "Name already exists!";
            setTimeout(() => (countdownDisplay.textContent = ""), 3000);
            return (titleDiv.textContent = truncateString(timerData.title));
        }

        const setIndex = sets.findIndex(
            (set) => set.title === currentSet.innerText
        );
        sets[setIndex].timers[index].title = newTitle;
        localStorage.setItem("sets", JSON.stringify(sets));
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

const createTimerBody = (timers, index, setTitle) => {
    const body = document.createElement("div");
    body.classList.add("body");

    const progress = createProgressBar(
        100,
        `timer-${timers[index].title.replace(" ", "-")}`
    );
    progress.title = "Progress bar";

    const alertBox = document.createElement("input");
    alertBox.setAttribute("type", "checkbox");
    const alertBoxId = timers[index].title.replace(" ", "-") + "-alertbox";
    alertBox.id = alertBoxId;

    alertBox.checked = timers[index].alert;
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

        timers[index].alert = alertBox.checked;
        localStorage.setItem("sets", JSON.stringify(sets));

        document.getElementById(
            timers[index].title.replace(" ", "-") + "-active-alertbox"
        ).checked = alertBox.checked;
    };

    const copyDiv = document.createElement("div");
    copyDiv.className = "dropdown";

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy >";
    const copyLocations = document.createElement("div");
    copyLocations.className = "dropdown-content";
    sets.forEach((set) => {
        const location = document.createElement("div");
        location.textContent = set.title;
        location.onclick = () => {
            let i = 1,
                timerTitle = timers[index].title;
            while (true) {
                const titleExists = hasTitle(set.timers, timerTitle);
                if (!titleExists) break;
                timerTitle += ` (${i})`;
                i++;
            }
            const copyingTimer = Object.assign({}, timers[index], {
                title: timerTitle,
            });
            set.timers = [...set.timers, copyingTimer];
            localStorage.setItem("sets", JSON.stringify(sets));

            initializeTimers(set.timers, set.title);
            currentSet.textContent = set.title;

            countdownDisplay.textContent = `${timers[index].title} has been copied to ${set.title}`;
            setTimeout(() => {
                countdownDisplay.textContent = "";
            }, 3000);
        };
        copyLocations.appendChild(location);
    });

    copyDiv.onclick = () => {
        copyLocations.style.display = "block";
    };

    const inputField = createDurationPicker(timers[index].time);
    inputField.title = "Enter duration of countdown";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.title = "Click to update countdown duration";
    saveBtn.onclick = () => {
        timers[index].time = inputField.value;
        initializeTimers(timers);
        localStorage.setItem("sets", JSON.stringify(sets));
    };

    const startBtn = document.createElement("button");
    startBtn.textContent = "Start";
    startBtn.title = "Start the countdown";
    startBtn.onclick = () => {
        startCounting(timers, index, false, setTitle);
        document.getElementById("pause-btn").textContent = "||";
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.title = "Delete this timer";
    deleteBtn.onclick = () => {
        const targetSetIndex = sets.findIndex(
            (set) => set.title === currentSet.innerText
        );
        sets[targetSetIndex].timers.splice(index, 1);

        initializeTimers(timers);
        localStorage.setItem("sets", JSON.stringify(sets));
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

        Array.from(document.getElementsByClassName("body")).forEach((bd) => {
            if (body !== bd) bd.style.maxHeight = null;
        });

        const { timers } = sets[index];
        if (body.style.maxHeight != "") {
            currentSet.innerText = sets[index].title;
            initializeTimers(timers, sets[index].title);
        }
    });

    set.appendChild(header);
    set.appendChild(body);

    return set;
};

const createSetHeader = (sets, index) => {
    const setData = sets[index];
    const header = document.createElement("div");
    header.classList.add("header");
    header.id = "id-" + sets[index].title.replace(" ", "-") + "-header";

    const titleDiv = document.createElement("div");
    titleDiv.textContent = truncateString(setData.title);
    titleDiv.title = setData.title;
    titleDiv.onclick = () => {
        titleDiv.contentEditable = true;
        titleDiv.textContent = setData.title;
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

        sets[index].title = newTitle;
        localStorage.setItem("sets", JSON.stringify(sets));
        titleDiv.textContent = truncateString(newTitle);
        titleDiv.title = newTitle;
    };

    const timeDiv = document.createElement("div");
    timeDiv.textContent = setData.scheduled ? setData.time : "Not scheduled";
    timeDiv.title = "Scheduled time";

    header.appendChild(titleDiv);
    header.appendChild(timeDiv);

    return header;
};

const createSetBody = (sets, index) => {
    const setData = sets[index];
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

            sets[index].time = enteredTime;
            sets[index].scheduled = true;
            initializeSets(sets);
            localStorage.setItem("sets", JSON.stringify(sets));
        }
    });

    const scheduleBtn = createScheduleButton(setData, inputField);
    scheduleBtn.title = setData.scheduled ? "Remove schedule" : "Add schedule";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.title = "Delete this set";
    deleteButton.onclick = () => {
        sets.splice(index, 1);

        initializeSets(sets);
        localStorage.setItem("sets", JSON.stringify(sets));

        if (currentSet.textContent == setData.title) {
            if (sets[0]) initializeTimers(sets[0].timers, sets[0].title);
            else initializeSets([], "");
            currentSet.textContent = sets[0] ? sets[0].title : "";
        }
    };

    body.appendChild(progress);
    body.appendChild(inputField);
    body.appendChild(scheduleBtn);
    body.appendChild(deleteButton);

    return body;
};

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
    function allLiHaveSameClass(ulId, className) {
        const ulElement = document.getElementById(ulId);
        if (!ulElement) return false;

        const liElements = ulElement.querySelectorAll("li." + className);
        return liElements.length === ulElement.querySelectorAll("li").length;
    }

    const setListHaveOnlySets = allLiHaveSameClass("sets", "set");
    const timerListHaveOnlyTimers = allLiHaveSameClass("timers", "timer");

    if (!setListHaveOnlySets || !timerListHaveOnlyTimers)
        return (event.target.style.display = "block");

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

const requestNotificationPermission = async () => {
    if (!Notification.permission) return;

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
        console.log("Notification permission granted!");
    } else {
        console.log("Notification permission denied.");
    }
};

const sendNotification = (title) => {
    if (Notification.permission !== "granted")
        alert("Notification permission not granted.");

    const notification = new Notification(title, {
        body: "Time's up!",
        icon: "https://shashotonur.github.io/cascade/icons/favicon.ico",
        requireInteraction: true,
        vibrate: [200, 100, 200],
    });

    notification.onclick = () => {
        window.open(window.location.href);
    };
};

const findAndStartTimer = (sets, currentTime) => {
    for (const set of sets) {
        if (set.time) {
            const startTime = parseTimeString(set.time + ":00");
            const endTime = calculateEndTime(startTime, set.timers);

            if (currentTime >= startTime && currentTime <= endTime) {
                const elapsedTime = currentTime - startTime;
                const { timers } = set;

                let accumulatedTime = 0,
                    index = 0;

                for (const timer of timers) {
                    const timerDuration = parseTimeString(timer.time);
                    accumulatedTime += timerDuration;

                    if (elapsedTime < accumulatedTime) {
                        initializeTimers(timers, set.title);
                        duration = accumulatedTime - elapsedTime;

                        currentSet.textContent = set.title;

                        startCounting(timers, index, true, set.title);
                        return timer;
                    }
                    index++;
                }
            }
        }
    }
    countdownDisplay.textContent = "No timer scheduled for now";
    document.title = "Cascade";

    setTimeout(() => (countdownDisplay.textContent = ""), 3000);
};

const parseTimeString = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
};

const calculateEndTime = (startTime, timers) => {
    const totalTimerDuration = timers.reduce((acc, timer) => {
        return acc + parseTimeString(timer.time);
    }, 0);

    return startTime + totalTimerDuration;
};

const setsList = document.getElementById("sets-list");
const timersList = document.getElementById("timers-list");

const currentSet = document.getElementById("current-set");
const countdownDisplay = document.getElementById("countdown");

const audio = document.getElementById("myAudio");

const setsString = localStorage.getItem("sets");
let sets = setsString ? JSON.parse(setsString) : [];

let intervalId,
    duration = 0,
    completedDuration = 0,
    draggedItem = null,
    orderOfArrays = [];

const importBtn = document.getElementById("import-btn");
const importBtnProxy = document.getElementById("import-btn-proxy");
importBtnProxy.onclick = () => {
    const proceed = confirm(
        "Any of your existing data will be overwritten. Do you wish to proceed?"
    );
    if (proceed) importBtn.click();
};

const syncBtn = document.getElementById("sync-btn");
syncBtn.onclick = () => {
    clearInterval(intervalId);

    const now = new Date();
    const currentTime =
        now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    findAndStartTimer(sets, currentTime);
};

const importFileInput = document.getElementById("import-btn");
importFileInput.addEventListener("change", importDataFromFile);

const exportButton = document.getElementById("export-btn");
exportButton.addEventListener("click", exportDataToFile);

const addSetButton = document.getElementById("add-set-btn");
addSetButton.addEventListener("click", addNewSet);

const addTimerButton = document.getElementById("add-timer-btn");
addTimerButton.addEventListener("click", addNewTimer);

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

const modal = document.getElementById("modal");
const closeButton = document.getElementById("close-button");

const appTitle = document.querySelector("h1");
appTitle.addEventListener("click", () => {
    if(appTitle.style.animation == "") {
        appTitle.style.animation = "none";
        localStorage.setItem("details-viewed", "true");
    }
    modal.classList.remove("hidden");
});
closeButton.addEventListener("click", () => modal.classList.add("hidden"));

const licenseHeader = document.getElementById("license-header");
const licenseText = document.getElementById("license-text");

licenseHeader.addEventListener("click", () => {
    licenseText.style.display =
        licenseText.style.display == "none" ? "block" : "none";
    licenseHeader.title =
        licenseText.style.display == "none"
            ? "Click to view the license"
            : "Click to hide the license";
});

const gotoSetsBtn = document.getElementById("goto-sets-btn");
const gotoTimersBtns = document.getElementsByClassName("goto-timers-btn");
const gotoActiveTimerBtn = document.getElementById("goto-active-timer-btn");
const activeTimerSection = document.getElementById("active-timer-section");

gotoSetsBtn.onclick = () => {
    timersList.style.display = "none";
    setsList.style.display = "block";
};

Array.from(gotoTimersBtns).forEach((btn) => {
    btn.onclick = () => {
        setsList.style.display = "none";
        timersList.style.display = "block";
        activeTimerSection.style.display = "none";
    };
});

gotoActiveTimerBtn.onclick = () => {
    timersList.style.display = "none";
    activeTimerSection.style.display = "block";
};

(() => {
    if(localStorage.getItem("details-viewed") === "true")
        document.querySelector("h1").style.animation = "none";

    if (sets.length <= 0) return;
    initializeSets(sets);

    const { timers } = sets[0];
    currentSet.innerText = sets[0].title;

    initializeTimers(timers, sets[0].title);
    createActiveTimer(timers, 0, sets[0].title);

    const now = new Date();
    const currentTime =
        now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    findAndStartTimer(sets, currentTime);
})();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/cascade/serviceworker.js")
        .then(function (registration) {
            console.log(
                "Service worker registration successful:",
                registration
            );
        })
        .catch(function (error) {
            console.log("Service worker registration failed:", error);
        });
}
