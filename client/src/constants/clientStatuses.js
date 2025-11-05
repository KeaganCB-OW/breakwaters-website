export function normaliseClientStatus(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const CLIENT_STATUS_VARIANTS = {
  pending: { label: 'Pending', className: 'client-details__secondary-btn--pending' },
  'in progress': { label: 'In Progress', className: 'client-details__secondary-btn--in-progress' },
  suggested: { label: 'Suggested', className: 'client-details__secondary-btn--suggested' },
  'interview pending': {
    label: 'Interview Pending',
    className: 'client-details__secondary-btn--interview-pending',
  },
  interviewed: { label: 'Interviewed', className: 'client-details__secondary-btn--interviewed' },
  assigned: { label: 'Assigned', className: 'client-details__secondary-btn--assigned' },
  rejected: { label: 'Rejected', className: 'client-details__secondary-btn--rejected' },
};

export const CLIENT_STATUS_ORDER = Object.keys(CLIENT_STATUS_VARIANTS);

export const CLIENT_STATUS_OPTIONS = CLIENT_STATUS_ORDER.map((statusKey) => {
  const variant = CLIENT_STATUS_VARIANTS[statusKey] ?? {};
  const normalizedValue = normaliseClientStatus(statusKey);

  return {
    value: statusKey,
    normalizedValue,
    label: variant.label ?? statusKey,
    queryValue: statusKey.replace(/\s+/g, '-'),
  };
});

export const CLIENT_STATUS_QUERY_LOOKUP = CLIENT_STATUS_OPTIONS.reduce((lookup, option) => {
  lookup[option.queryValue] = option;
  return lookup;
}, {});

const CLIENT_STATUS_LABEL_LOOKUP = CLIENT_STATUS_OPTIONS.reduce((lookup, option) => {
  lookup[option.normalizedValue] = option.label;
  return lookup;
}, {});

export function getClientStatusLabel(value) {
  const normalized = normaliseClientStatus(value);

  if (!normalized) {
    return CLIENT_STATUS_VARIANTS.pending.label;
  }

  if (CLIENT_STATUS_LABEL_LOOKUP[normalized]) {
    return CLIENT_STATUS_LABEL_LOOKUP[normalized];
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return CLIENT_STATUS_VARIANTS.pending.label;
}

export function findClientStatusOptionByQueryValue(queryValue) {
  if (!queryValue) {
    return undefined;
  }

  return (
    CLIENT_STATUS_QUERY_LOOKUP[queryValue] ??
    CLIENT_STATUS_OPTIONS.find((option) => option.normalizedValue === normaliseClientStatus(queryValue))
  );
}
