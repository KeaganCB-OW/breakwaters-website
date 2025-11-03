import { useEffect, useMemo, useRef, useState, useId } from 'react';
import PropTypes from 'prop-types';
import ROLES from '../../../constants/roles';
import '../../../styling/RolesDropdown.css';

const noop = () => {};

function buildSummary({ multiple, selected }) {
  if (multiple) {
    const values = Array.isArray(selected) ? selected : [];
    if (values.length === 0) {
      return '';
    }

    if (values.length <= 2) {
      return values.join(', ');
    }

    const [first, second, ...rest] = values;
    return `${first}, ${second} +${rest.length} more`;
  }

  return typeof selected === 'string' ? selected : '';
}

function RolesDropdown({
  id,
  label,
  description,
  placeholder,
  multiple,
  selected,
  onChange,
  error,
  className,
  invalidClassName,
}) {
  const listId = useId();
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const options = useMemo(() => ROLES, []);

  const normalizedSelected = useMemo(() => {
    if (multiple) {
      return Array.isArray(selected) ? selected : [];
    }
    return typeof selected === 'string' ? selected : '';
  }, [multiple, selected]);

  const summary = buildSummary({ multiple, selected: normalizedSelected });

  const helperId = description ? `${id || listId}-description` : undefined;
  const errorId = error ? `${id || listId}-error` : undefined;

  const closeDropdown = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const focusList = () => {
    if (listRef.current) {
      listRef.current.focus();
    }
  };

  const openDropdown = (focus = false) => {
    if (isOpen) {
      if (focus) {
        focusList();
      }
      return;
    }

    let nextIndex = 0;

    if (multiple && normalizedSelected.length > 0) {
      nextIndex = Math.max(
        0,
        options.findIndex((option) => option === normalizedSelected[0])
      );
    } else if (!multiple && normalizedSelected) {
      const selectedIndex = options.findIndex(
        (option) => option === normalizedSelected
      );
      nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
    }

    setIsOpen(true);
    setHighlightedIndex(nextIndex);

    if (focus) {
      requestAnimationFrame(() => {
        focusList();
      });
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        closeDropdown();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeDropdown();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [isOpen]);

  const handleToggleOption = (value) => {
    if (multiple) {
      const current = Array.isArray(normalizedSelected)
        ? normalizedSelected
        : [];
      const exists = current.includes(value);
      const nextValues = exists
        ? current.filter((item) => item !== value)
        : [...current, value];
      onChange(nextValues);
      return;
    }

    onChange(value);
    closeDropdown();
    buttonRef.current?.focus();
  };

  const handleButtonClick = () => {
    if (isOpen) {
      closeDropdown();
      return;
    }
    openDropdown(true);
  };

  const handleButtonKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openDropdown(true);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDropdown(true);
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeDropdown();
    }
  };

  const handleListKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((previous) =>
        previous + 1 >= options.length ? 0 : previous + 1
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((previous) =>
        previous - 1 < 0 ? options.length - 1 : previous - 1
      );
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setHighlightedIndex(options.length - 1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown();
      buttonRef.current?.focus();
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleToggleOption(options[highlightedIndex]);
      }
    }
  };

  const handleListBlur = (event) => {
    if (
      containerRef.current &&
      event.relatedTarget &&
      containerRef.current.contains(event.relatedTarget)
    ) {
      return;
    }

    closeDropdown();
  };

  const isInvalid = Boolean(error);
  const rootClassName = [
    'roles-dropdown',
    className,
    isInvalid ? 'roles-dropdown--invalid' : '',
    isInvalid && invalidClassName ? invalidClassName : '',
    isOpen ? 'roles-dropdown--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName} ref={containerRef}>
      {label ? (
        <label className="roles-dropdown__label" htmlFor={id}>
          {label}
        </label>
      ) : null}

      <button
        type="button"
        id={id}
        ref={buttonRef}
        className="roles-dropdown__button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`roles-dropdown-${listId}`}
        aria-describedby={[helperId, errorId].filter(Boolean).join(' ') || undefined}
        onClick={handleButtonClick}
        onKeyDown={handleButtonKeyDown}
      >
        <span className={summary ? 'roles-dropdown__value' : 'roles-dropdown__placeholder'}>
          {summary || placeholder}
        </span>
        <span className="roles-dropdown__chevron" aria-hidden="true" />
      </button>

      {description ? (
        <p id={helperId} className="roles-dropdown__description">
          {description}
        </p>
      ) : null}

      {isOpen ? (
        <ul
          id={`roles-dropdown-${listId}`}
          role="listbox"
          tabIndex={-1}
          ref={listRef}
          className="roles-dropdown__list"
          aria-multiselectable={multiple || undefined}
          onKeyDown={handleListKeyDown}
          onBlur={handleListBlur}
        >
          {options.map((option, index) => {
            const isSelected = multiple
              ? normalizedSelected.includes(option)
              : normalizedSelected === option;

            const optionClassName = [
              'roles-dropdown__option',
              isSelected ? 'roles-dropdown__option--selected' : '',
              highlightedIndex === index
                ? 'roles-dropdown__option--highlighted'
                : '',
            ]
              .filter(Boolean)
              .join(' ');

            const handleOptionClick = (event) => {
              event.preventDefault();
              handleToggleOption(option);
            };

            return (
              <li
                key={option}
                role="option"
                aria-selected={isSelected}
                className={optionClassName}
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleOptionClick}
              >
                {multiple ? (
                  <input
                    type="checkbox"
                    className="roles-dropdown__checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleOption(option)}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="roles-dropdown__option-label">{option}</span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {error ? (
        <p id={errorId} className="roles-dropdown__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

RolesDropdown.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  placeholder: PropTypes.string,
  multiple: PropTypes.bool,
  selected: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  onChange: PropTypes.func,
  error: PropTypes.string,
  className: PropTypes.string,
  invalidClassName: PropTypes.string,
};

RolesDropdown.defaultProps = {
  description: '',
  placeholder: 'Select roles',
  multiple: false,
  selected: '',
  onChange: noop,
  error: '',
  className: '',
  invalidClassName: '',
};

export default RolesDropdown;
