import { useState, useCallback, useRef, useEffect } from 'react';

const useTableFilters = (onFilterChange) => {
  const [filters, setFilters] = useState({});
  const debounceTimers = useRef({});

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  const handleFilter = useCallback(
    (values) => {
      const newFilters = { ...values }; // Keep original values for display
      const apiFilters = {};

      Object.keys(values).forEach((key) => {
        const value = values[key];
        // Include the value if it's not undefined, null, or empty string
        // Special handling for boolean values (false should be included)
        if (
          value !== undefined &&
          value !== null &&
          (value !== '' || typeof value === 'boolean')
        ) {
          if (
            (key === 'dateRange' ||
              key === 'timeRange' ||
              key === 'created_at_range') &&
            value?.length === 2
          ) {
            // Convert date ranges to API format
            let startKey, endKey;
            if (key === 'dateRange') {
              startKey = 'start_time';
              endKey = 'end_time';
            } else if (key === 'timeRange') {
              startKey = 'start_date';
              endKey = 'end_date';
            } else if (key === 'created_at_range') {
              startKey = 'created_at_start';
              endKey = 'created_at_end';
            }
            apiFilters[startKey] = value[0].startOf('day').toISOString();
            apiFilters[endKey] = value[1].endOf('day').toISOString();
          } else {
            apiFilters[key] = value;
          }
        }
      });

      setFilters(newFilters); // Keep display values
      if (onFilterChange) {
        onFilterChange(apiFilters); // Send API values
      }
    },
    [onFilterChange],
  );

  const clearAllFilters = useCallback(() => {
    setFilters({});
    if (onFilterChange) {
      onFilterChange({});
    }
  }, [onFilterChange]);

  const createAutoFilterHandler = useCallback(
    (filterKey, debounceMs = 0) => {
      return (value) => {
        setFilters((prev) => ({ ...prev, [filterKey]: value }));

        // Clear previous timer for this filter key
        if (debounceTimers.current[filterKey]) {
          clearTimeout(debounceTimers.current[filterKey]);
        }

        if (debounceMs > 0) {
          // Set new timer
          debounceTimers.current[filterKey] = setTimeout(() => {
            setFilters((currentFilters) => {
              const currentValues = {};
              Object.keys(currentFilters).forEach((key) => {
                const filterValue = currentFilters[key];
                if (
                  key === 'dateRange' ||
                  key === 'timeRange' ||
                  key === 'created_at_range'
                ) {
                  if (
                    filterValue &&
                    Array.isArray(filterValue) &&
                    filterValue.length === 2
                  ) {
                    currentValues[key] = filterValue;
                  }
                } else if (
                  filterValue !== undefined &&
                  filterValue !== null &&
                  (filterValue !== '' || typeof filterValue === 'boolean')
                ) {
                  currentValues[key] = filterValue;
                }
              });
              handleFilter(currentValues);
              return currentFilters; // Return unchanged to avoid re-render
            });
          }, debounceMs);
        } else {
          // No debounce, execute immediately
          setFilters((currentFilters) => {
            const currentValues = {};
            Object.keys(currentFilters).forEach((key) => {
              const filterValue = currentFilters[key];
              if (
                key === 'dateRange' ||
                key === 'timeRange' ||
                key === 'created_at_range'
              ) {
                if (
                  filterValue &&
                  Array.isArray(filterValue) &&
                  filterValue.length === 2
                ) {
                  currentValues[key] = filterValue;
                }
              } else if (
                filterValue !== undefined &&
                filterValue !== null &&
                (filterValue !== '' || typeof filterValue === 'boolean')
              ) {
                currentValues[key] = filterValue;
              }
            });
            handleFilter(currentValues);
            return currentFilters; // Return unchanged to avoid re-render
          });
        }
      };
    },
    [handleFilter],
  );

  const createFilterClearHandler = useCallback(
    (filterKey) => {
      return () => {
        setFilters((prev) => {
          const newFilters = {
            ...prev,
            [filterKey]: filterKey.includes('Range')
              ? null
              : typeof prev[filterKey] === 'string'
                ? ''
                : undefined,
          };
          handleFilter(newFilters);
          return newFilters;
        });
      };
    },
    [handleFilter],
  );

  return {
    filters,
    setFilters,
    handleFilter,
    clearAllFilters,
    createAutoFilterHandler,
    createFilterClearHandler,
  };
};

export default useTableFilters;
