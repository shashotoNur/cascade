import { getSets, setSets } from "../logic/state.js";
import { truncateString } from "../logic/utils.js";

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
    const currentSetTitle = document.getElementById("current-set").innerText;

    if (!isValidList("sets", "set") || !isValidList("timers", "timer")) {
        event.target.style.display = "block";
        return;
    }

    setTimeout(() => {
        if (event.target.classList.contains("set")) {
            updateOrder("sets", sets, "set", (orderedSets) => {
                setSets(orderedSets);
            });
        } else {
            const targetSetIndex = sets.findIndex(
                (set) => truncateString(set.title) === currentSetTitle
            );
            updateOrder(
                "timers",
                sets[targetSetIndex].timers,
                "timer",
                (orderedTimers) => {
                    sets[targetSetIndex].timers = orderedTimers;
                    setSets(sets);
                }
            );
        }
        event.target.style.display = "";
        draggedItem = null;
    }, 0);
};

const isValidList = (ulId, className) => {
    const ulElement = document.getElementById(ulId);
    if (!ulElement) return false;

    const liElements = ulElement.querySelectorAll("li." + className);
    return liElements.length === ulElement.querySelectorAll("li").length;
};

const updateOrder = (ulId, list, className, callback) => {
    const ulElement = document.getElementById(ulId);
    const listItems = ulElement.querySelectorAll("li");

    orderOfArrays = Array.from(listItems).map((listItem) => {
        const headerDiv = listItem.querySelector(".header div:first-child");
        return headerDiv ? headerDiv.textContent.trim() : "";
    });

    if (orderOfArrays.length === listItems.length) {
        const orderedList = orderOfArrays.reduce((acc, title) => {
            const item = list.find((el) => el.title === title);
            if (item) acc.push(item);
            return acc;
        }, []);
        callback(orderedList);
        orderOfArrays = [];
    }
};

const getDragAfterElement = (container, y) => {
    const draggableElements = [
        ...container.querySelectorAll("li:not(.dragging)"),
    ];

    return draggableElements.reduce(
        (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        },
        { offset: Number.NEGATIVE_INFINITY }
    ).element;
};
