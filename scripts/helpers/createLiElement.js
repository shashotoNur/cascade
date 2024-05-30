import { hasTitle } from "../logic/utils.js";
import { initializeSets, initializeTimers } from "./initialize.js";
import { getSets, setSets } from "../logic/state.js";

export const addNewSet = () => {
    const sets = getSets();

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
    setSets(sets);

    const newSetHeader = document.getElementById(
        "id-" + newSet.title.replace(" ", "-") + "-header"
    );
    newSetHeader.click();
};

export const addNewTimer = () => {
    const sets = getSets();
    const currentSet = document.getElementById("current-set");

    const newTimer = {
        title: "New Timer",
        time: "000:00:00",
        alert: false,
    };

    const sIdx = sets.findIndex((set) => set.title === currentSet.innerText);

    if (sIdx == -1) return console.log("No set matches");

    const { timers } = sets[sIdx];

    let i = 1;
    while (true) {
        const titleExists = hasTitle(timers, newTimer.title);
        if (!titleExists) break;
        newTimer.title = `New Timer (${i})`;
        i++;
    }

    sets[sIdx].timers.push(newTimer);
    setSets(sets);
    initializeTimers({ sIdx });
};
