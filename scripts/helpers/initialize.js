import { createSet } from "../components/createSet.js";
import { createTimer } from "../components/createTimer.js";
import { getSets } from "../logic/state.js";

export const initializeSets = () => {
    const sets = getSets();
    const setsList = document.getElementById("sets-list");

    setsList.querySelector("ul").innerHTML = "";
    sets.forEach((_, sIdx) =>
        setsList.querySelector("ul").appendChild(createSet({ sIdx }))
    );
};

export const initializeTimers = ({ sIdx }) => {
    const timersList = document.getElementById("timers-list");
    const timerUL = timersList.querySelector("ul");

    const set = getSets()[sIdx];
    const { timers } = set;

    timerUL.innerHTML = "";
    timers.forEach((_, tIdx) =>
        timerUL.appendChild(createTimer({ sIdx, tIdx }))
    );

    const gotoTimersBtns = document.getElementsByClassName("goto-timers-btn");
    Array.from(gotoTimersBtns).forEach(
        (btn) => (btn.title = `Display timers in ${set.title}`)
    );
};
