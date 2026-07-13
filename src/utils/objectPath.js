export function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function setByPath(obj, path, value) {
  const keys = path.split('.');
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  let curr = copy;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      curr[key] = value;
      return;
    }

    const nextValue = curr[key];
    curr[key] = Array.isArray(nextValue) ? [...nextValue] : { ...(nextValue || {}) };
    curr = curr[key];
  });

  return copy;
}

export function isEmptyValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}
