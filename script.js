import {
    importDataFromFile,
    exportDataToFile,
} from "./scripts/logic/dataExchange.js";

import {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
} from "./scripts/helpers/dragReorder.js";

import { addNewSet, addNewTimer } from "./scripts/helpers/createLiElement.js";
import {
    initializeSets,
    initializeTimers,
} from "./scripts/helpers/initialize.js";
import { createActiveTimer } from "./scripts/components/activeTimer.js";
import { findAndStartTimer } from "./scripts/logic/timerCountdown.js";
import { setSets } from "./scripts/logic/state.js";
import { registerServiceworker } from "./scripts/logic/utils.js";

const setsList = document.getElementById("sets-list");
const timersList = document.getElementById("timers-list");
const currentSet = document.getElementById("current-set");

const setsString = localStorage.getItem("sets");
const sets = setsString ? JSON.parse(setsString) : [];

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
    const now = new Date();
    const currentTime =
        now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    findAndStartTimer(currentTime);
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
    if (appTitle.style.animation == "") {
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
    if (localStorage.getItem("details-viewed") === "true")
        document.querySelector("h1").style.animation = "none";

    if (sets.length <= 0) return;
    setSets(sets);
    initializeSets();

    currentSet.innerText = sets[0].title;

    initializeTimers({ sIdx: 0 });
    createActiveTimer({ sIdx: 0, tIdx: 0 });

    const now = new Date();
    const currentTime =
        now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    findAndStartTimer(currentTime);
    registerServiceworker();
})();
