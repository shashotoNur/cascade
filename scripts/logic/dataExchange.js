import { createActiveTimer } from "../components/activeTimer.js";
import { initializeSets, initializeTimers } from "../helpers/initialize.js";
import { setSets, getIntervalId } from "./state.js";
import { truncateString } from "./utils.js";

export const importDataFromFile = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function ({ target }) {
        const { result } = target;
        const sets = JSON.parse(result);

        setSets(sets);
        initializeSets();
        initializeTimers({ sIdx: 0 });
        createActiveTimer({ sIdx: 0, tIdx: 0 });
        clearInterval(getIntervalId());

        const currentSet = document.getElementById("current-set");
        currentSet.textContent = truncateString(sets[0].title);
    };

    reader.readAsText(file);
};

export const exportDataToFile = () => {
    const storedSetsString = localStorage.getItem("sets");
    if (!storedSetsString) return;

    const blob = new Blob([storedSetsString], { type: "application/json" });
    const downloadLink = document.createElement("a");

    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "my-sets.json";

    downloadLink.click();

    window.setTimeout(() => URL.revokeObjectURL(downloadLink.href), 10 * 1000);
};
