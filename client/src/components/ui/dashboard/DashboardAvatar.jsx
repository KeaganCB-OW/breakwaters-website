const sizeMap = {
  sm: 48,
  md: 64,
  lg: 80
};

export function DashboardAvatar({ size = 'md', className = '' }) {
  const dimension = sizeMap[size] || sizeMap.md;
  const avatarClass = ['dashboard-avatar', className].filter(Boolean).join(' ');

  return (
    <div
      className={avatarClass}
      style={{ width: dimension, height: dimension, filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))' }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 70 71"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="dashboard-avatar__svg"
      >
        <g filter="url(#filter0_i)">
          <mask id="mask0" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="70" height="71">
            <ellipse cx="35.3566" cy="35.5" rx="34.465" ry="35.5" fill="#D9D9D9" />
          </mask>
          <g mask="url(#mask0)">
            <path d="M83.2281 35C83.2281 62.6142 61.495 85 34.6858 85C7.87667 85 -13.8564 62.6142 -13.8564 35C-13.8564 7.38576 7.87667 -15 34.6858 -15C61.495 -15 83.2281 7.38576 83.2281 35Z" fill="#A9B7EB" />
            <path d="M59.1427 64.5C59.1427 78.031 48.4935 89 35.357 89C22.2205 89 11.5713 78.031 11.5713 64.5C11.5713 50.969 22.2205 40 35.357 40C48.4935 40 59.1427 50.969 59.1427 64.5Z" fill="#F3F3F3" />
            <path d="M45.5518 24.5C45.5518 30.299 40.9879 35 35.3579 35C29.728 35 25.1641 30.299 25.1641 24.5C25.1641 18.701 29.728 14 35.3579 14C40.9879 14 45.5518 18.701 45.5518 24.5Z" fill="#F3F3F3" />
          </g>
        </g>
        <defs>
          <filter id="filter0_i" x="0.891602" y="0" width="68.9297" height="75" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

export default DashboardAvatar;
