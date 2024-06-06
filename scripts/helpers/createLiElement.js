import { hasTitle, truncateString } from "../logic/utils.js";
import { initializeSets, initializeTimers } from "./initialize.js";
import { getSets, setSets } from "../logic/state.js";

export const addNewSet = () => {
    const sets = getSets();

    const newSet = createUniqueSet(sets, "New Set");
    sets.push(newSet);

    updateAndInitializeSets(sets);
    clickNewSetHeader(newSet.title);
};

export const addNewTimer = () => {
    const sets = getSets();
    const currentSetTitle = document.getElementById("current-set").innerText;

    const sIdx = sets.findIndex((set) => truncateString(set.title) === currentSetTitle);
    if (sIdx === -1) return console.log("No set matches");

    const newTimer = createUniqueTimer(sets[sIdx].timers, "New Timer");

    sets[sIdx].timers.push(newTimer);
    updateAndInitializeTimers(sets, sIdx);
};

const createUniqueSet = (sets, baseTitle) => {
    let title = baseTitle;
    let i = 1;

    while (hasTitle(sets, title)) {
        title = `${baseTitle} (${i})`;
        i++;
    }

    return {
        title,
        scheduled: false,
        time: "",
        timers: [],
    };
};

const updateAndInitializeSets = (sets) => {
    setSets(sets);
    initializeSets(sets);
};

const clickNewSetHeader = (title) => {
    const newSetHeader = document.getElementById(
        `id-${title.replace(" ", "-")}-header`
    );
    newSetHeader.click();
};

const createUniqueTimer = (timers, baseTitle) => {
    let title = baseTitle;
    let i = 1;

    while (hasTitle(timers, title)) {
        title = `${baseTitle} (${i})`;
        i++;
    }

    return {
        title,
        time: "00:00:00",
        alert: false,
    };
};

const updateAndInitializeTimers = (sets, sIdx) => {
    setSets(sets);
    initializeTimers({ sIdx });
};
