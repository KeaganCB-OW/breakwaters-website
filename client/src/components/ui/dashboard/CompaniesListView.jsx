import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import { useCompaniesQuery } from '../../../hooks/useDashboardQueries';

const PAGE_SIZES = [10, 20, 50];

function getSearchParamList(searchParams, key) {
  const values = searchParams.getAll(key);
  if (values.length > 0) {
    return values;
  }
  const single = searchParams.get(key);
  return single ? [single] : [];
}

function normalizeList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [String(value)];
}

function getField(row, ...keys) {
  for (const key of keys) {
    if (key in (row || {})) {
      return row[key];
    }
  }
  return undefined;
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

export function CompaniesListView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = Number.parseInt(searchParams.get('pageSize') || '10', 10);

  const industryFilter = getSearchParamList(searchParams, 'industry');
  const workforceFilter = getSearchParamList(searchParams, 'workforce_size');
  const locationFilter = getSearchParamList(searchParams, 'location');
  const rolesFilter = getSearchParamList(searchParams, 'available_roles');

  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = PAGE_SIZES.includes(pageSizeParam) ? pageSizeParam : PAGE_SIZES[0];

  const filters = useMemo(
    () => ({
      industry: industryFilter,
      workforce_size: workforceFilter,
      location: locationFilter,
      available_roles: rolesFilter,
    }),
    [industryFilter, locationFilter, rolesFilter, workforceFilter],
  );

  const query = useCompaniesQuery({ search: debouncedSearch, filters, page, pageSize });
  const [showFilters, setShowFilters] = useState(
    industryFilter.length > 0 || workforceFilter.length > 0 || locationFilter.length > 0 || rolesFilter.length > 0,
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
      ['industry', 'workforce_size', 'location', 'available_roles', 'page'].forEach((key) => next.delete(key));
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

  const industryOptions = useMemo(() => {
    const values = new Set();
    query.allRows.forEach((row) => {
      const value = getField(row, 'industry');
      if (value) {
        values.add(String(value));
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [query.allRows]);

  const workforceOptions = useMemo(() => {
    const values = new Set();
    query.allRows.forEach((row) => {
      const value = getField(row, 'workforce_size', 'workforceSize');
      if (value || value === 0) {
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

  const roleOptions = useMemo(() => {
    const values = new Set();
    query.allRows.forEach((row) => {
      normalizeList(getField(row, 'available_roles', 'availableRoles')).forEach((role) => {
        if (role) {
          values.add(role);
        }
      });
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
        <h2 className="dashboard__section-title">Companies</h2>
      </div>
      <div className="dashboard__divider" />

      <div className="dashboard__list-controls">
        <div className="dashboard__list-search">
          <label htmlFor="company-search" className="dashboard__list-label">
            Search companies by name
          </label>
          <input
            id="company-search"
            type="search"
            className="dashboard__list-input"
            placeholder="Search companies by name..."
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
            <h3 className="dashboard__filters-title">Industry</h3>
            <div className="dashboard__filters-options">
              {industryOptions.map((option) => {
                const inputId = `company-industry-${option}`;
                return (
                  <label key={option} className="dashboard__filters-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={industryFilter.includes(option)}
                      onChange={() => handleFilterToggle('industry', option)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="dashboard__filters-group">
            <h3 className="dashboard__filters-title">Workforce Size</h3>
            <div className="dashboard__filters-options">
              {workforceOptions.map((option) => {
                const inputId = `company-workforce-${option}`;
                return (
                  <label key={option} className="dashboard__filters-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={workforceFilter.includes(option)}
                      onChange={() => handleFilterToggle('workforce_size', option)}
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
                const inputId = `company-location-${option}`;
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
            <h3 className="dashboard__filters-title">Available Roles</h3>
            <div className="dashboard__filters-options">
              {roleOptions.map((option) => {
                const inputId = `company-role-${option}`;
                return (
                  <label key={option} className="dashboard__filters-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={rolesFilter.includes(option)}
                      onChange={() => handleFilterToggle('available_roles', option)}
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
          <caption className="dashboard__sr-only">Companies table</caption>
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col">Industry</th>
              <th scope="col">Phone</th>
              <th scope="col">Email</th>
              <th scope="col">Workforce Size</th>
              <th scope="col">Location</th>
              <th scope="col">Available Roles</th>
              <th scope="col">Specifications</th>
              <th scope="col">LinkedIn</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading && (
              <tr>
                <td colSpan={9} className="dashboard__table-status">
                  Loading companies...
                </td>
              </tr>
            )}
            {query.error && !query.isLoading && (
              <tr>
                <td colSpan={9} className="dashboard__table-status dashboard__table-status--error">
                  {query.error}
                </td>
              </tr>
            )}
            {!query.isLoading && !query.error && query.rows.length === 0 && (
              <tr>
                <td colSpan={9} className="dashboard__table-status">
                  No companies match your criteria.
                  <button type="button" className="dashboard__list-reset" onClick={handleClearFilters}>
                    Reset filters
                  </button>
                </td>
              </tr>
            )}
            {!query.isLoading &&
              !query.error &&
              query.rows.map((company) => {
                const companyName = getField(company, 'company_name', 'companyName', 'name') || '—';
                const industry = getField(company, 'industry') || '—';
                const phone = getField(company, 'phone_number', 'phoneNumber', 'phone') || '—';
                const email = getField(company, 'email') || '—';
                const workforce = getField(company, 'workforce_size', 'workforceSize');
                const location = getField(company, 'location', 'city') || '—';
                const availableRoles = normalizeList(getField(company, 'available_roles', 'availableRoles'));
                const specifications = getField(company, 'specifications') || '—';
                const linkedin = getField(company, 'linkedin_url', 'linkedinUrl');

                return (
                  <tr key={getField(company, 'id', '_id', 'companyId', 'userId', 'company_name')}>
                    <td>{companyName}</td>
                    <td>{industry}</td>
                    <td>{phone}</td>
                    <td className="dashboard__table-cell--truncate" title={email}>
                      {email}
                    </td>
                    <td>{workforce || workforce === 0 ? workforce : '—'}</td>
                    <td>{location}</td>
                    <td className="dashboard__table-cell--truncate" title={availableRoles.join(', ')}>
                      {availableRoles.length > 0 ? availableRoles.join(', ') : '—'}
                    </td>
                    <td className="dashboard__table-cell--truncate" title={formatText(specifications)}>
                      {formatText(specifications)}
                    </td>
                    <td>
                      {linkedin ? (
                        <a href={linkedin} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      ) : (
                        '—'
                      )}
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
          <label className="dashboard__pagination-size" htmlFor="company-page-size">
            Page size
            <select
              id="company-page-size"
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

export default CompaniesListView;

