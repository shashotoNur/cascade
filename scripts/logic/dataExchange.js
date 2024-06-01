import { initializeSets, initializeTimers } from "../helpers/initialize.js";
import { setSets } from "./state.js";

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

        const currentSet = document.getElementById("current-set");
        currentSet.textContent = sets[0].title;
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
