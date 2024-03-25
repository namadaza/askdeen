export const compact = (array) => {
    return array.filter(Boolean);
};
export const uniqueById = (array) => array.filter((v, i, a) => a.findIndex((v2) => v2?.id === v?.id) === i);
