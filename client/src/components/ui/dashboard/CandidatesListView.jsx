import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import { useCandidatesQuery } from '../../../hooks/useDashboardQueries';
import {
  CLIENT_STATUS_OPTIONS,
  findClientStatusOptionByQueryValue,
  getClientStatusLabel,
} from '../../../constants/clientStatuses';

const PAGE_SIZES = [10, 20, 50];

const STATUS_SELECT_OPTIONS = [
  { queryValue: '', label: 'All statuses', value: '' },
  ...CLIENT_STATUS_OPTIONS.map((option) => ({
    queryValue: option.queryValue,
    label: option.label,
    value: option.value,
  })),
];

function getSearchParamList(searchParams, key) {
  const values = searchParams.getAll(key);
  if (values.length > 0) {
    return values;
  }
  const single = searchParams.get(key);
  return single ? [single] : [];
}

function formatText(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value == null) {
    return '—';
  }

  return String(value);
}

function normalizeSkills(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [String(value)];
}

function createUniqueOptions(rows, field, transformer = (v) => v) {
  const values = new Set();
  rows.forEach((row) => {
    const rawValue = row?.[field] ?? row?.[field.replace(/([A-Z])/g, '_$1').toLowerCase()];
    if (!rawValue) {
      return;
    }

    const transformed = transformer(rawValue);
    toArray(transformed).forEach((item) => {
      if (item) {
        values.add(item);
      }
    });
  });

  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getField(row, ...keys) {
  for (const key of keys) {
    if (key in (row || {})) {
      return row[key];
    }
  }
  return undefined;
}

export function CandidatesListView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchParam = searchParams.get('search') || '';
  const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = Number.parseInt(searchParams.get('pageSize') || '10', 10);

  const locationFilter = getSearchParamList(searchParams, 'location');
  const preferredRoleFilter = getSearchParamList(searchParams, 'preferred_role');
  const educationFilter = getSearchParamList(searchParams, 'education');
  const skillsFilter = getSearchParamList(searchParams, 'skills');
  const statusParam = searchParams.get('status') || '';
  const selectedStatusOption = findClientStatusOptionByQueryValue(statusParam);
  const statusFilterValue = selectedStatusOption?.value ?? '';

  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = PAGE_SIZES.includes(pageSizeParam) ? pageSizeParam : PAGE_SIZES[0];

  const filters = useMemo(
    () => ({
      location: locationFilter,
      preferred_role: preferredRoleFilter,
      education: educationFilter,
      skills: skillsFilter,
      status: statusFilterValue,
    }),
    [educationFilter, locationFilter, preferredRoleFilter, skillsFilter, statusFilterValue],
  );

  const query = useCandidatesQuery({ search: debouncedSearch, filters, page, pageSize });
  const [showFilters, setShowFilters] = useState(
    locationFilter.length > 0 || preferredRoleFilter.length > 0 || educationFilter.length > 0 || skillsFilter.length > 0,
  );

  const uniqueLocations = useMemo(
    () => createUniqueOptions(query.allRows, 'location'),
    [query.allRows],
  );
  const uniqueRoles = useMemo(
    () => createUniqueOptions(query.allRows, 'preferredRole'),
    [query.allRows],
  );
  const uniqueEducations = useMemo(
    () => createUniqueOptions(query.allRows, 'education'),
    [query.allRows],
  );
  const uniqueSkills = useMemo(
    () => {
      const values = new Set();
      query.allRows.forEach((row) => {
        normalizeSkills(getField(row, 'skills')).forEach((skill) => {
          if (skill) {
            values.add(skill);
          }
        });
      });
      return Array.from(values).sort((a, b) => a.localeCompare(b));
    },
    [query.allRows],
  );

  const totalPages = Math.max(1, Math.ceil(query.total / pageSize));
  const updateSearchParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value && (Array.isArray(value) ? value.length > 0 : value !== '')) {
        if (Array.isArray(value)) {
          next.delete(key);
          value.forEach((item) => next.append(key, item));
        } else {
          next.set(key, value);
        }
      } else {
        next.delete(key);
      }
      next.set('page', '1');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const updateSearchParamsState = useCallback(
    (mutator) => {
      const next = new URLSearchParams(searchParams);
      mutator(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (statusParam && !selectedStatusOption) {
      updateSearchParam('status', '');
    }
  }, [selectedStatusOption, statusParam, updateSearchParam]);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (debouncedSearch !== searchParam) {
      updateSearchParam('search', debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    if (page > totalPages) {
      updateSearchParamsState((next) => {
        next.set('page', String(totalPages));
      });
    }
  }, [page, totalPages, updateSearchParamsState]);

  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
  };

  const handleFilterToggle = (field, option) => {
    const currentValues = new Set(filters[field] ?? []);
    if (currentValues.has(option)) {
      currentValues.delete(option);
    } else {
      currentValues.add(option);
    }
    updateSearchParam(field, Array.from(currentValues));
  };

  const handleClearFilters = () => {
    updateSearchParamsState((next) => {
      ['location', 'preferred_role', 'education', 'skills', 'status', 'page'].forEach((key) => next.delete(key));
      next.delete('pageSize');
    });
    setShowFilters(false);
  };

  const handlePageChange = (nextPage) => {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    updateSearchParamsState((next) => {
      next.set('page', String(clamped));
    });
  };

  const handlePageSizeChange = (event) => {
    const value = Number.parseInt(event.target.value, 10);
    updateSearchParamsState((next) => {
      next.set('pageSize', String(value));
      next.set('page', '1');
    });
  };

  const handleResetSearch = () => {
    updateSearchParamsState((next) => {
      next.delete('search');
      next.set('page', '1');
    });
    setSearchInput('');
  };

  const handleStatusFilterChange = (event) => {
    updateSearchParam('status', event.target.value);
  };

  const handleRowNavigate = useCallback(
    (candidateId) => {
      if (!candidateId) {
        return;
      }

      navigate(`/ro/clients/${candidateId}`);
    },
    [navigate],
  );

  const handleRowKeyDown = useCallback(
    (event, candidateId) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleRowNavigate(candidateId);
      }
    },
    [handleRowNavigate],
  );

  const startItem = query.total === 0 || query.rows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = query.total === 0 || query.rows.length === 0
    ? 0
    : Math.min((page - 1) * pageSize + query.rows.length, query.total);

  return (
    <div className="dashboard__section dashboard__list-section">
      <div className="dashboard__section-heading">
        <h2 className="dashboard__section-title">Candidates</h2>
      </div>
      <div className="dashboard__divider" />

      <div className="dashboard__list-controls">
        <div className="dashboard__list-search">
          <label htmlFor="candidate-search" className="dashboard__list-label">
            Search candidates by name
          </label>
          <input
            id="candidate-search"
            type="search"
            className="dashboard__list-input"
            placeholder="Search candidates by name..."
            value={searchInput}
            onChange={handleSearchChange}
          />
          {searchParam && (
            <button type="button" className="dashboard__list-clear" onClick={handleResetSearch}>
              Clear
            </button>
          )}
        </div>
        <div className="dashboard__list-search">
          <label htmlFor="candidate-status-filter" className="dashboard__list-label">
            Filter by status
          </label>
          <select
            id="candidate-status-filter"
            className="dashboard__list-input"
            value={selectedStatusOption?.queryValue ?? ''}
            onChange={handleStatusFilterChange}
          >
            {STATUS_SELECT_OPTIONS.map((option) => (
              <option key={option.queryValue} value={option.queryValue}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="dashboard__list-filters-toggle"
          onClick={() => setShowFilters((prev) => !prev)}
          aria-expanded={showFilters}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showFilters && (
        <div className="dashboard__filters-panel">
          <div className="dashboard__filters-group">
            <h3 className="dashboard__filters-title">Location</h3>
            <div className="dashboard__filters-options">
              {uniqueLocations.map((option) => {
                const inputId = `candidate-location-${option}`;
                return (
                  <label key={option} className="dashboard__filters-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={locationFilter.includes(option)}
                      onChange={() => handleFilterToggle('location', option)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="dashboard__filters-group">
            <h3 className="dashboard__filters-title">Preferred Role</h3>
            <div className="dashboard__filters-options">
              {uniqueRoles.map((option) => {
                const inputId = `candidate-role-${option}`;
                return (
                  <label key={option} className="dashboard__filters-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={preferredRoleFilter.includes(option)}
                      onChange={() => handleFilterToggle('preferred_role', option)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="dashboard__filters-group">
            <h3 className="dashboard__filters-title">Education</h3>
            <div className="dashboard__filters-options">
              {uniqueEducations.map((option) => {
                const inputId = `candidate-education-${option}`;
                return (
                  <label key={option} className="dashboard__filters-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={educationFilter.includes(option)}
                      onChange={() => handleFilterToggle('education', option)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="dashboard__filters-group">
            <h3 className="dashboard__filters-title">Skills</h3>
            <div className="dashboard__filters-options">
              {uniqueSkills.map((option) => {
                const inputId = `candidate-skill-${option}`;
                return (
                  <label key={option} className="dashboard__filters-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={skillsFilter.includes(option)}
                      onChange={() => handleFilterToggle('skills', option)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <button type="button" className="dashboard__filters-reset" onClick={handleClearFilters}>
            Reset filters
          </button>
        </div>
      )}

      <div className="dashboard__table-container">
        <table className="dashboard__table">
          <caption className="dashboard__sr-only">Candidates table</caption>
          <thead>
            <tr>
              <th scope="col">Full Name</th>
              <th scope="col">Email</th>
              <th scope="col">Phone</th>
              <th scope="col">Location</th>
              <th scope="col">Skills</th>
              <th scope="col">Preferred Role</th>
              <th scope="col">Status</th>
              <th scope="col">Education</th>
              <th scope="col">LinkedIn</th>
              <th scope="col">Experience</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading && (
              <tr>
                <td colSpan={10} className="dashboard__table-status">
                  Loading candidates...
                </td>
              </tr>
            )}
            {query.error && !query.isLoading && (
              <tr>
                <td colSpan={10} className="dashboard__table-status dashboard__table-status--error">
                  {query.error}
                </td>
              </tr>
            )}
            {!query.isLoading && !query.error && query.rows.length === 0 && (
              <tr>
                <td colSpan={10} className="dashboard__table-status">
                  No candidates match your criteria.
                  <button type="button" className="dashboard__list-reset" onClick={handleClearFilters}>
                    Reset filters
                  </button>
                </td>
              </tr>
            )}
            {!query.isLoading &&
              !query.error &&
              query.rows.map((candidate) => {
                const fullName = getField(candidate, 'fullName', 'full_name', 'name') || '—';
                const email = getField(candidate, 'email') || '—';
                const phone = getField(candidate, 'phone_number', 'phoneNumber', 'phone') || '—';
                const location = getField(candidate, 'location', 'city') || '—';
                const preferredRole = getField(candidate, 'preferred_role', 'preferredRole') || '—';
                const education = getField(candidate, 'education') || '—';
                const linkedin = getField(candidate, 'linkedin_url', 'linkedinUrl');
                const experience = getField(candidate, 'experience') || '—';
                const statusValue = getField(candidate, 'status');
                const statusLabel = getClientStatusLabel(statusValue);
                const skillsValue = normalizeSkills(getField(candidate, 'skills'));
                const candidateId = getField(candidate, 'id', '_id', 'clientId');
                const rowKey = candidateId ?? getField(candidate, 'email', 'fullName') ?? email ?? fullName;
                const resolvedStatusLabel = statusLabel;

                return (
                  <tr
                    key={rowKey}
                    onClick={() => handleRowNavigate(candidateId)}
                    onKeyDown={(event) => handleRowKeyDown(event, candidateId)}
                    role={candidateId ? 'link' : undefined}
                    tabIndex={candidateId ? 0 : -1}
                    aria-label={
                      candidateId
                        ? `View client details for ${fullName}`
                        : undefined
                    }
                  >
                    <td>{fullName}</td>
                    <td className="dashboard__table-cell--truncate" title={email}>
                      {email}
                    </td>
                    <td>{phone}</td>
                    <td>{location}</td>
                    <td className="dashboard__table-cell--truncate" title={skillsValue.join(', ')}>
                      {skillsValue.length > 0 ? skillsValue.join(', ') : '—'}
                    </td>
                    <td>{preferredRole}</td>
                    <td>{resolvedStatusLabel}</td>
                    <td>{education}</td>
                    <td>
                      {linkedin ? (
                        <a href={linkedin} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="dashboard__table-cell--truncate" title={formatText(experience)}>
                      {formatText(experience)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="dashboard__pagination">
        <div className="dashboard__pagination-info">
          Showing {startItem === 0 ? 0 : `${startItem}-${endItem}`} of {query.total}
        </div>
        <div className="dashboard__pagination-controls">
          <button
            type="button"
            className="dashboard__pagination-button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span className="dashboard__pagination-page">Page {page}</span>
          <button
            type="button"
            className="dashboard__pagination-button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </button>
          <label className="dashboard__pagination-size" htmlFor="candidate-page-size">
            Page size
            <select
              id="candidate-page-size"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="dashboard__pagination-select"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

export default CandidatesListView;

