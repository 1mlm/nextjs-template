export const toggleListItem = <T>(list: T[], item: T) =>
  list.includes(item)
    ? list.filter((value) => value !== item)
    : [...list, item];
