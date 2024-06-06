import { setShowMsg } from "./state.js";

export const hasTitle = (array, title) => {
    for (const object of array) if (object.title === title) return true;
    return false;
};

export const showMessage = (msg, timeout) => {
    const countdownDisplay = document.getElementById("countdown");
    countdownDisplay.textContent = msg == " " ? "" : msg;

    if (timeout == -1) return;
    setShowMsg(true);

    setTimeout(() => {
        countdownDisplay.textContent = "";
        setShowMsg(false);
    }, timeout);
};

export const truncateString = (str, maxLength = 32) => {
    return str.length > maxLength ? str.slice(0, maxLength - 3) + "..." : str;
};

export const parseTimeString = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
};

export const calculateEndTime = (startTime, timers) => {
    const totalTimerDuration = timers.reduce((acc, timer) => {
        return acc + parseTimeString(timer.time);
    }, 0);

    return startTime + totalTimerDuration;
};

export const requestNotificationPermission = async () => {
    if (!Notification.permission) return;

    const permission = await Notification.requestPermission();
    console.log("Notification permission " + permission);
};

export const sendNotification = (title) => {
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

export const registerServiceworker = () => {
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
};

export const moveCursorToEnd = (targetElement) => {
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStart(targetElement, targetElement.childNodes.length);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
};

export const convertTimeFormat = (timeString) => {
    // Check for valid input format (HH:MM:SS)
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
    if (!timeRegex.test(timeString)) {
        console.error("Invalid time format. Please use HH:MM:SS format.");
        return null;
    }

    const [hours, minutes, seconds] = timeString.split(":");
    const parsedHours = parseInt(hours, 10);
    const parsedMinutes = parseInt(minutes, 10);
    // const parsedSeconds = parseInt(seconds, 10);

    let meridian = "AM";
    let newHours = parsedHours;
    if (parsedHours >= 12) {
        meridian = "PM";
        newHours = parsedHours % 12;
        if (newHours === 0) newHours = 12; // Handle midnight as 12:00 AM
    } else if (parsedHours === 0) newHours = 12; // Handle noon as 12:00 PM

    return `${newHours.toString().padStart(2, "0")}:${parsedMinutes
        .toString()
        .padStart(2, "0")} ${meridian}`;
};

export const getReadableEndTime = (startTimeString, timers) => {
    const getTotalDurationInSeconds = (timers) => {
        const timeStringToSeconds = (timeString) => {
            const [hours, minutes, seconds] = timeString.split(":").map(Number);
            return hours * 3600 + minutes * 60 + seconds;
        };
        return timers.reduce(
            (total, timer) => total + timeStringToSeconds(timer.time),
            0
        );
    };
    const totalDurationSeconds = getTotalDurationInSeconds(timers);

    const [startHours, startMinutes] = startTimeString.split(":").map(Number);
    const now = new Date();
    const startTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        startHours,
        startMinutes
    );

    const endTime = new Date(startTime.getTime() + totalDurationSeconds * 1000);
    return endTime.toTimeString().split(" ")[0]; // Format HH:MM:SS
};

export const isOverlappingWithExistingSet = (setData, sets) => {
    const startOfSet = parseTimeString(setData.time + ":00");
    const endOfSet = calculateEndTime(startOfSet, setData.timers);

    let overlapping = false;
    let setTitle = "";

    sets.forEach((set) => {
        if (!set.time || set.title === setData.title) return;

        const startTime = parseTimeString(set.time + ":00");
        const endTime = calculateEndTime(startTime, set.timers);

        if (
            (startOfSet >= startTime && startOfSet < endTime) ||
            (endOfSet > startTime && endOfSet <= endTime)
        ) {
            setTitle = set.title;
            overlapping = true;
        }
    });

    return { overlapping, setTitle };
};

export const formatDuration = (seconds) => {
    if (seconds === 0) return "00:00:00";

    const hours = Math.floor(seconds / 3600)
        .toString()
        .padStart(2, "0");
    const minutes = Math.floor((seconds % 3600) / 60)
        .toString()
        .padStart(2, "0");
    const remainingSeconds = seconds % 60;
    const secondsString = remainingSeconds.toString().padStart(2, "0");

    return `${hours}:${minutes}:${secondsString}`;
};

export const addPaddingToTime = (timeString) => {
    const regex = /(\d+):(\d+):(\d+)/;
    const match = regex.exec(timeString);

    if (!match) return timeString;

    const hours = match[1].padStart(2, "0");
    const minutes = match[2].padStart(2, "0");
    const seconds = match[3].padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
};
