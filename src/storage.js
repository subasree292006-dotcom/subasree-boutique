export const getData = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return defaultValue;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading data:", error);
    return defaultValue;
  }
};

export const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving data:", error);
  }
};