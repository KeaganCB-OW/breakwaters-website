import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import { useAssignmentsQuery } from '../../../hooks/useDashboardQueries';

const PAGE_SIZES = [10, 20, 50];

function getSearchParamList(searchParams, key) {
  const values = searchParams.getAll(key);
  if (values.length > 0) {
    return values;
  }
  const single = searchParams.get(key);
  return single ? [single] : [];
}

function getField(row, ...keys) {
  for (const key of keys) {
    if (key in (row || {})) {
      return row[key];
    }
  }
  return undefined;
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString();
}

export function AssignmentsListView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = Number.parseInt(searchParams.get('pageSize') || '10', 10);

  const statusFilter = getSearchParamList(searchParams, 'status');
  const roleFilter = getSearchParamList(searchParams, 'role');
  const locationFilter = getSearchParamList(searchParams, 'location');
  const companyFilter = getSearchParamList(searchParams, 'company');

  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = PAGE_SIZES.includes(pageSizeParam) ? pageSizeParam : PAGE_SIZES[0];

  const filters = useMemo(
    () => ({
      status: statusFilter,
      role: roleFilter,
      location: locationFilter,
      company: companyFilter,
    }),
    [companyFilter, locationFilter, roleFilter, statusFilter],
  );

  const query = useAssignmentsQuery({ search: debouncedSearch, filters, page, pageSize });
  const [showFilters, setShowFilters] = useState(
    statusFilter.length > 0 || roleFilter.length > 0 || locationFilter.length > 0 || companyFilter.length > 0,
  );

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
    setSearchInput(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (debouncedSearch !== searchParam) {
      updateSearchParam('search', debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(query.total / pageSize));

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
      ['status', 'role', 'location', 'company', 'page'].forEach((key) => next.delete(key));
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

  const statusOptions = useMemo(() => {
    const values = new Set();
    query.allRows.forEach((row) => {
      const value = getField(row, 'status');
      if (value) {
        values.add(String(value));
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [query.allRows]);

  const roleOptions = useMemo(() => {
    const values = new Set();
    query.allRows.forEach((row) => {
      const value = getField(row, 'role', 'title', 'position');
      if (value) {
        values.add(String(value));
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [query.allRows]);

  const locationOptions = useMemo(() => {
    const values = new Set();
    query.allRows.forEach((row) => {
      const value = getField(row, 'location', 'city');
      if (value) {
        values.add(String(value));
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [query.allRows]);

  const companyOptions = useMemo(() => {
    const values = new Set();
    query.allRows.forEach((row) => {
      const value = row.companyName;
      if (value) {
        values.add(String(value));
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [query.allRows]);

  const startItem = query.total === 0 || query.rows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = query.total === 0 || query.rows.length === 0
    ? 0
    : Math.min((page - 1) * pageSize + query.rows.length, query.total);

  return (
    <div className="dashboard__section dashboard__list-section">
      <div className="dashboard__section-heading">
        <h2 className="dashboard__section-title">Assignments</h2>
      </div>
      <div className="dashboard__divider" />

      <div className="dashboard__list-controls">
        <div className="dashboard__list-search">
          <label htmlFor="assignment-search" className="dashboard__list-label">
            Search assignments
          </label>
          <input
            id="assignment-search"
            type="search"
            className="dashboard__list-input"
            placeholder="Search assignments..."
            value={searchInput}
            onChange={handleSearchChange}
          />
          {searchParam && (
            <button type="button" className="dashboard__list-clear" onClick={handleResetSearch}>
              Clear
            </button>
          )}
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
            <h3 className="dashboard__filters-title">Status</h3>
            <div className="dashboard__filters-options">
              {statusOptions.map((option) => {
                const inputId = `assignment-status-${option}`;
                return (
                  <label key={option} className="dashboard__filters-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={statusFilter.includes(option)}
                      onChange={() => handleFilterToggle('status', option)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="dashboard__filters-group">
            <h3 className="dashboard__filters-title">Role</h3>
            <div className="dashboard__filters-options">
              {roleOptions.map((option) => {
                const inputId = `assignment-role-${option}`;
                return (
                  <label key={option} className="dashboard__filters-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={roleFilter.includes(option)}
                      onChange={() => handleFilterToggle('role', option)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="dashboard__filters-group">
            <h3 className="dashboard__filters-title">Location</h3>
            <div className="dashboard__filters-options">
              {locationOptions.map((option) => {
                const inputId = `assignment-location-${option}`;
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
            <h3 className="dashboard__filters-title">Company</h3>
            <div className="dashboard__filters-options">
              {companyOptions.map((option) => {
                const inputId = `assignment-company-${option}`;
                return (
                  <label key={option} className="dashboard__filters-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={companyFilter.includes(option)}
                      onChange={() => handleFilterToggle('company', option)}
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
          <caption className="dashboard__sr-only">Assignments table</caption>
          <thead>
            <tr>
              <th scope="col">Assignment</th>
              <th scope="col">Company</th>
              <th scope="col">Candidate</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Location</th>
              <th scope="col">Assigned</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading && (
              <tr>
                <td colSpan={8} className="dashboard__table-status">
                  Loading assignments...
                </td>
              </tr>
            )}
            {query.error && !query.isLoading && (
              <tr>
                <td colSpan={8} className="dashboard__table-status dashboard__table-status--error">
                  {query.error}
                </td>
              </tr>
            )}
            {!query.isLoading && !query.error && query.rows.length === 0 && (
              <tr>
                <td colSpan={8} className="dashboard__table-status">
                  No assignments match your criteria.
                  <button type="button" className="dashboard__list-reset" onClick={handleClearFilters}>
                    Reset filters
                  </button>
                </td>
              </tr>
            )}
            {!query.isLoading &&
              !query.error &&
              query.rows.map((assignment, index) => {
                const assignmentId = getField(assignment, 'id', '_id', 'assignmentId');
                const fallbackId = assignmentId ?? `${assignment.companyName}-${assignment.candidateName}-${index}`;
                const role = getField(assignment, 'role', 'title', 'position') || '—';
                const status = getField(assignment, 'status') || '—';
                const location = getField(assignment, 'location', 'city') || '—';
                const assignedAt = getField(assignment, 'assignedAt', 'createdAt');
                const updatedAt = getField(assignment, 'updatedAt', 'modifiedAt');

                return (
                  <tr key={fallbackId}>
                    <td>{assignmentId ?? '—'}</td>
                    <td>{assignment.companyName || '—'}</td>
                    <td>{assignment.candidateName || '—'}</td>
                    <td className="dashboard__table-cell--truncate" title={role}>
                      {role}
                    </td>
                    <td>{status}</td>
                    <td>{location}</td>
                    <td>{formatDate(assignedAt)}</td>
                    <td>{formatDate(updatedAt)}</td>
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
          <label className="dashboard__pagination-size" htmlFor="assignment-page-size">
            Page size
            <select
              id="assignment-page-size"
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

export default AssignmentsListView;

