import { getSets, setSets } from "../logic/state.js";

let draggedItem = null;
let orderOfArrays = [];

export const handleDragStart = (event) => {
    draggedItem = event.target;
    setTimeout(() => {
        event.target.style.display = "none";
    }, 0);
};

export const handleDragOver = (event, list) => {
    event.preventDefault();
    const afterElement = getDragAfterElement(list, event.clientY);

    if (afterElement == null) list.appendChild(draggedItem);
    else list.insertBefore(draggedItem, afterElement);
};

export const handleDragEnd = (event) => {
    const sets = getSets();
    const currentSet = document.getElementById("current-set");

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
                        setSets(orderedSets);
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
                        setSets(sets);
                        orderOfArrays = [];
                    }
                }
            }
        }
        event.target.style.display = "";
        draggedItem = null;
    }, 0);
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
