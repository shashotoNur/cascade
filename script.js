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
import {
    registerServiceworker,
    truncateString,
} from "./scripts/logic/utils.js";

const getElement = (id) => document.getElementById(id);
const getElements = (className) => document.getElementsByClassName(className);

const setsList = getElement("sets-list");
const timersList = getElement("timers-list");
const currentSet = getElement("current-set");
const importBtn = getElement("import-btn");
const importBtnProxy = getElement("import-btn-proxy");
const syncBtn = getElement("sync-btn");
const importFileInput = getElement("import-btn");
const exportButton = getElement("export-btn");
const addSetButton = getElement("add-set-btn");
const addTimerButton = getElement("add-timer-btn");
const draggableSets = getElement("sets");
const draggableTimers = getElement("timers");
const modal = getElement("modal");
const closeButton = getElement("close-button");
const appTitle = document.querySelector("h1");
const licenseHeader = getElement("license-header");
const licenseText = getElement("license-text");
const gotoSetsBtn = getElement("goto-sets-btn");
const gotoActiveTimerBtn = getElement("goto-active-timer-btn");
const activeTimerSection = getElement("active-timer-section");
const gotoTimersBtns = Array.from(getElements("goto-timers-btn"));

const loadSetsFromLocalStorage = () => {
    const setsString = localStorage.getItem("sets");
    return setsString ? JSON.parse(setsString) : [];
};

const initializeApp = () => {
    const sets = loadSetsFromLocalStorage();
    setSets(sets);

    setupEventListeners();
    if (localStorage.getItem("details-viewed") === "true")
        appTitle.style.animation = "none";

    if (sets.length <= 0) return;

    initializeSets();
    currentSet.innerText = truncateString(sets[0].title);
    initializeTimers({ sIdx: 0 });
    createActiveTimer({ sIdx: 0, tIdx: 0 });

    const currentTime = getCurrentTimeInSeconds();
    findAndStartTimer(currentTime);
};

const setupEventListeners = () => {
    importBtnProxy.onclick = handleImportBtnProxyClick;
    syncBtn.onclick = handleSyncBtnClick;
    importFileInput.addEventListener("change", importDataFromFile);
    exportButton.addEventListener("click", exportDataToFile);
    addSetButton.addEventListener("click", addNewSet);
    addTimerButton.addEventListener("click", addNewTimer);

    draggableSets.addEventListener("dragstart", handleDragStart);
    draggableSets.addEventListener("dragend", handleDragEnd);
    draggableSets.addEventListener("dragover", (e) =>
        handleDragOver(e, draggableSets)
    );

    draggableTimers.addEventListener("dragstart", handleDragStart);
    draggableTimers.addEventListener("dragend", handleDragEnd);
    draggableTimers.addEventListener("dragover", (e) =>
        handleDragOver(e, draggableTimers)
    );

    appTitle.addEventListener("click", handleAppTitleClick);
    closeButton.addEventListener("click", () => modal.classList.add("hidden"));
    licenseHeader.addEventListener("click", handleLicenseHeaderClick);
    gotoSetsBtn.onclick = handleGotoSetsClick;
    gotoActiveTimerBtn.onclick = handleGotoActiveTimerClick;

    gotoTimersBtns.forEach((btn) => {
        btn.onclick = handleGotoTimersClick;
    });
};

const handleImportBtnProxyClick = () => {
    const sets = localStorage.getItem("sets");
    const dataExists = sets && sets !== "[]";

    let proceed = true;
    if (dataExists)
        proceed = confirm(
            "Your existing data will be overwritten. Do you wish to proceed?"
        );
    if (proceed) importBtn.click();
};

const handleSyncBtnClick = () => {
    const currentTime = getCurrentTimeInSeconds();
    findAndStartTimer(currentTime);
};

const handleAppTitleClick = () => {
    if (appTitle.style.animation == "") {
        appTitle.style.animation = "none";
        localStorage.setItem("details-viewed", "true");
    }
    modal.classList.remove("hidden");
};

const handleLicenseHeaderClick = () => {
    const isHidden = licenseText.style.display == "none";
    licenseText.style.display = isHidden ? "block" : "none";
    licenseHeader.title = isHidden
        ? "Click to hide the license"
        : "Click to view the license";
};

const handleGotoSetsClick = () => {
    timersList.style.display = "none";
    setsList.style.display = "block";
};

const handleGotoTimersClick = () => {
    setsList.style.display = "none";
    timersList.style.display = "block";
    activeTimerSection.style.display = "none";
};

const handleGotoActiveTimerClick = () => {
    timersList.style.display = "none";
    activeTimerSection.style.display = "block";
};

const getCurrentTimeInSeconds = () => {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
};

initializeApp();
registerServiceworker();
