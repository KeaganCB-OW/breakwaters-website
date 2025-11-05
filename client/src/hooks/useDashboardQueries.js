import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { DashboardDataContext } from '../components/ui/dashboard/DashboardContext';
import { fetchClients } from '../services/clientService';
import { fetchCompanies } from '../services/companyService';
import { fetchAssignments } from '../services/assignmentService';
import { normaliseClientStatus } from '../constants/clientStatuses';

function toArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

function normalizeText(value) {
  if (value == null) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join(' ').toLowerCase();
  }

  if (typeof value === 'number') {
    return String(value).toLowerCase();
  }

  if (typeof value === 'string') {
    return value.toLowerCase();
  }

  return '';
}

function getField(record, ...keys) {
  for (const key of keys) {
    if (key in (record || {})) {
      return record[key];
    }
  }

  return undefined;
}

function matchesMultiValueField(value, selectedValues) {
  if (selectedValues.length === 0) {
    return true;
  }

  if (value == null) {
    return false;
  }

  const normalizedSelected = selectedValues.map((item) => item.toLowerCase());

  if (Array.isArray(value)) {
    const candidateValues = value.map((item) => normalizeText(item));
    return normalizedSelected.every((selected) =>
      candidateValues.some((candidateValue) => candidateValue.includes(selected)),
    );
  }

  const valueAsText = normalizeText(value);
  return normalizedSelected.every((selected) => valueAsText.includes(selected));
}

function applyFilters(data, filters, filterConfig) {
  if (!filters || Object.keys(filters).length === 0) {
    return data;
  }

  return data.filter((record) => {
    return Object.entries(filters).every(([filterKey, selected]) => {
      const selectedValues = toArray(selected).filter(Boolean);
      if (selectedValues.length === 0) {
        return true;
      }

      const config = filterConfig[filterKey];
      if (!config) {
        return true;
      }

      const value = typeof config === 'function' ? config(record) : getField(record, config);
      return matchesMultiValueField(value, selectedValues);
    });
  });
}

function paginate(data, page, pageSize) {
  if (pageSize <= 0) {
    return data;
  }

  const start = (page - 1) * pageSize;
  return data.slice(start, start + pageSize);
}

function useCollectionSource(contextSlice, fetcher, token, options = {}) {
  const [localData, setLocalData] = useState([]);
  const [localLoading, setLocalLoading] = useState(Boolean(fetcher));
  const [localError, setLocalError] = useState(null);

  const hasContextData = Boolean(contextSlice?.data);
  const shouldUseLocal = !hasContextData && !options.initialData;

  const reload = useCallback(async () => {
    if (!shouldUseLocal || !fetcher || !token) {
      return contextSlice?.reload ? contextSlice.reload() : options.reload?.();
    }

    setLocalLoading(true);
    try {
      const result = await fetcher(token);
      const normalized = Array.isArray(result) ? result : [];
      setLocalData(normalized);
      setLocalError(null);
      return normalized;
    } catch (error) {
      setLocalData([]);
      setLocalError(error.message || 'Failed to load data');
      return [];
    } finally {
      setLocalLoading(false);
    }
  }, [contextSlice, fetcher, options, shouldUseLocal, token]);

  useEffect(() => {
    if (shouldUseLocal && fetcher && token) {
      reload();
    }
  }, [fetcher, reload, shouldUseLocal, token]);

  const data = options.initialData ?? contextSlice?.data ?? localData;
  const isLoading = options.isLoading ?? contextSlice?.isLoading ?? localLoading;
  const error = options.error ?? contextSlice?.error ?? localError;
  const refresh = contextSlice?.reload ?? options.reload ?? reload;

  return { data: Array.isArray(data) ? data : [], isLoading: Boolean(isLoading), error, refresh };
}

export function useCandidatesQuery({ search = '', filters = {}, page = 1, pageSize = 10 }, options = {}) {
  const { token } = useContext(AuthContext);
  const dashboardContext = useContext(DashboardDataContext);
  const source = useCollectionSource(dashboardContext?.candidates, fetchClients, token, options);

  const filtered = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const filterConfig = {
      location: (record) => getField(record, 'location', 'city'),
      preferred_role: (record) => getField(record, 'preferred_role', 'preferredRole'),
      preferredRole: (record) => getField(record, 'preferred_role', 'preferredRole'),
      education: (record) => getField(record, 'education'),
      skills: (record) => {
        const skillsValue = getField(record, 'skills');
        if (Array.isArray(skillsValue)) {
          return skillsValue;
        }
        if (typeof skillsValue === 'string') {
          return skillsValue.split(',').map((item) => item.trim());
        }
        return skillsValue;
      },
      status: (record) => normaliseClientStatus(getField(record, 'status')),
    };

    const dataWithSearch = source.data.filter((record) => {
      if (!searchValue) {
        return true;
      }

      const name = normalizeText(getField(record, 'fullName', 'full_name', 'name'));
      const email = normalizeText(getField(record, 'email'));
      const skills = normalizeText(getField(record, 'skills'));

      return name.includes(searchValue) || email.includes(searchValue) || skills.includes(searchValue);
    });

    return applyFilters(dataWithSearch, filters, filterConfig);
  }, [filters, search, source.data]);

  const total = filtered.length;
  const rows = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);

  return {
    rows,
    total,
    allRows: source.data,
    filteredRows: filtered,
    isLoading: source.isLoading,
    error: source.error,
    refresh: source.refresh,
  };
}

export function useCompaniesQuery(
  { search = '', filters = {}, page = 1, pageSize = 10 },
  options = {},
) {
  const { token } = useContext(AuthContext);
  const dashboardContext = useContext(DashboardDataContext);
  const source = useCollectionSource(dashboardContext?.companies, fetchCompanies, token, options);

  const filtered = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const filterConfig = {
      industry: (record) => getField(record, 'industry'),
      workforce_size: (record) => getField(record, 'workforce_size', 'workforceSize'),
      workforceSize: (record) => getField(record, 'workforce_size', 'workforceSize'),
      location: (record) => getField(record, 'location', 'city'),
      available_roles: (record) => {
        const roles = getField(record, 'available_roles', 'availableRoles');
        if (Array.isArray(roles)) {
          return roles;
        }
        if (typeof roles === 'string') {
          return roles.split(',').map((item) => item.trim());
        }
        return roles;
      },
    };

    const dataWithSearch = source.data.filter((record) => {
      if (!searchValue) {
        return true;
      }

      const name = normalizeText(getField(record, 'company_name', 'companyName', 'name'));
      const industry = normalizeText(getField(record, 'industry'));

      return name.includes(searchValue) || industry.includes(searchValue);
    });

    return applyFilters(dataWithSearch, filters, filterConfig);
  }, [filters, search, source.data]);

  const total = filtered.length;
  const rows = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);

  return {
    rows,
    total,
    allRows: source.data,
    filteredRows: filtered,
    isLoading: source.isLoading,
    error: source.error,
    refresh: source.refresh,
  };
}

export function useAssignmentsQuery(
  { search = '', filters = {}, page = 1, pageSize = 10 },
  options = {},
) {
  const { token } = useContext(AuthContext);
  const dashboardContext = useContext(DashboardDataContext);
  const source = useCollectionSource(dashboardContext?.assignments, fetchAssignments, token, options);

  const companyData = dashboardContext?.companies?.data;
  const candidateData = dashboardContext?.candidates?.data;

  const companyLookup = useMemo(() => {
    const lookup = new Map();
    if (Array.isArray(companyData)) {
      companyData.forEach((company) => {
        const identifiers = [company?.id, company?._id, company?.companyId, company?.userId];
        const name = getField(company, 'company_name', 'companyName', 'name');
        identifiers.filter(Boolean).forEach((identifier) => lookup.set(identifier, name));
      });
    }
    return lookup;
  }, [companyData]);

  const candidateLookup = useMemo(() => {
    const lookup = new Map();
    if (Array.isArray(candidateData)) {
      candidateData.forEach((candidate) => {
        const identifiers = [
          candidate?.id,
          candidate?._id,
          candidate?.clientId,
          candidate?.userId,
          candidate?.user_id,
        ];
        const name = getField(candidate, 'fullName', 'full_name', 'name');
        identifiers.filter(Boolean).forEach((identifier) => lookup.set(identifier, name));
      });
    }
    return lookup;
  }, [candidateData]);

  const normalizedAssignments = useMemo(() => {
    return source.data.map((assignment) => {
      const companyId = getField(assignment, 'companyId', 'company_id');
      const candidateId = getField(assignment, 'candidateId', 'candidate_id', 'userId', 'user_id', 'clientId');

      const companyName =
        getField(assignment, 'companyName', 'company_name') ??
        (companyId ? companyLookup.get(companyId) : undefined);

      const candidateName =
        getField(assignment, 'clientName', 'candidateName', 'userName') ??
        (candidateId ? candidateLookup.get(candidateId) : undefined);

      return {
        ...assignment,
        companyName: companyName ?? '—',
        candidateName: candidateName ?? '—',
      };
    });
  }, [candidateLookup, companyLookup, source.data]);

  const filtered = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const filterConfig = {
      status: (record) => getField(record, 'status'),
      role: (record) => getField(record, 'role', 'title', 'position'),
      location: (record) => getField(record, 'location', 'city'),
      company: (record) => record.companyName,
    };

    const dataWithSearch = normalizedAssignments.filter((record) => {
      if (!searchValue) {
        return true;
      }

      const roleText = normalizeText(getField(record, 'role', 'title', 'position'));
      const companyText = normalizeText(record.companyName);
      const candidateText = normalizeText(record.candidateName);

      return (
        roleText.includes(searchValue) ||
        companyText.includes(searchValue) ||
        candidateText.includes(searchValue)
      );
    });

    return applyFilters(dataWithSearch, filters, filterConfig);
  }, [filters, normalizedAssignments, search]);

  const total = filtered.length;
  const rows = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);

  return {
    rows,
    total,
    allRows: source.data,
    filteredRows: filtered,
    isLoading: source.isLoading,
    error: source.error,
    refresh: source.refresh,
  };
}

