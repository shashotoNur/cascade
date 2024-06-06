const state = {
    sets: [],
    intervalId: null,
    duration: 0,
    completedDuration: 0,
    showingMsg: false,
};

export const getSets = () => state.sets;
export const getIntervalId = () => state.intervalId;
export const getDuration = () => state.duration;
export const getCompletedDuration = () => state.completedDuration;
export const isShowingMsg = () => state.showingMsg;

export const setSets = (sets) => {
    state.sets = sets;
    localStorage.setItem("sets", JSON.stringify(sets));
};
export const setIntervalId = (id) => (state.intervalId = id);
export const setDuration = (newDuration) => (state.duration = newDuration);
export const setCompletedDuration = (newCompletedDuration) =>
    (state.completedDuration = newCompletedDuration);
export const setShowMsg = (showingMsg) => (state.showingMsg = showingMsg);
