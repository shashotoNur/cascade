export const hasTitle = (array, title) => {
    for (const object of array) if (object.title === title) return true;
    return false;
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

export const moveCursorToEnd = (contentEle) => {
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStart(contentEle, contentEle.childNodes.length);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
};
