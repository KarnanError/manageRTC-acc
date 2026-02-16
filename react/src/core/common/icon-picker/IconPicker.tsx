import React, { useState } from 'react';

// List of commonly used Tabler Icons
const TABLER_ICONS = [
  // Navigation & Layout
  'ti ti-layout-dashboard',
  'ti ti-home',
  'ti ti-smart-home',
  'ti ti-building',
  'ti ti-building-arch',
  'ti ti-building-factory-2',
  'ti ti-building-skyscraper',
  'ti ti-apps',
  'ti ti-grid-4',
  'ti ti-menu-2',
  'ti ti-menu',
  'ti ti-list',
  'ti ti-layout-grid',
  'ti ti-layout-list',
  'ti ti-layout-sidebar',
  'ti ti-layout-navbar',
  'ti ti-layout-bottombar',

  // Files & Folders
  'ti ti-file',
  'ti ti-file-text',
  'ti ti-file-description',
  'ti ti-file-code',
  'ti ti-file-settings',
  'ti ti-folder',
  'ti ti-folders',
  'ti ti-folder-open',
  'ti ti-folder-plus',
  'ti ti-file-zip',
  'ti ti-file-pdf',
  'ti ti-file-excel',
  'ti ti-file-word',

  // Users & People
  'ti ti-user',
  'ti ti-users',
  'ti ti-users-group',
  'ti ti-user-plus',
  'ti ti-user-minus',
  'ti ti-user-circle',
  'ti ti-user-check',
  'ti ti-user-x',
  'ti ti-user-shield',
  'ti ti-user-cog',
  'ti ti-user-edit',
  'ti ti-id-badge',
  'ti ti-address-book',
  'ti ti-tie',

  // Security & Locks
  'ti ti-lock',
  'ti ti-unlock',
  'ti ti-shield',
  'ti ti-shield-check',
  'ti ti-shield-x',
  'ti ti-shield-lock',
  'ti ti-key',
  'ti ti-password',
  'ti ti-fingerprint',
  'ti ti-2fa',

  // Actions
  'ti ti-check',
  'ti ti-x',
  'ti ti-plus',
  'ti ti-minus',
  'ti ti-edit',
  'ti ti-trash',
  'ti ti-refresh',
  'ti ti-refresh-dot',
  'ti ti-reload',
  'ti ti-rotate',
  'ti ti-rotate-clockwise',
  'ti ti-dots',
  'ti ti-dots-vertical',
  'ti ti-more',
  'ti ti-copy',
  'ti ti-clipboard',
  'ti ti-clipboard-check',
  'ti ti-clipboard-copy',

  // Search & Filter
  'ti ti-search',
  'ti ti-filter',
  'ti ti-sort-ascending',
  'ti ti-sort-descending',
  'ti ti-zoom-in',
  'ti ti-zoom-out',
  'ti ti-zoom-reset',

  // Communication
  'ti ti-mail',
  'ti ti-mail-forward',
  'ti ti-mail-opened',
  'ti ti-inbox',
  'ti ti-send',
  'ti ti-message',
  'ti ti-message-2',
  'ti ti-messages',
  'ti ti-bell',
  'ti ti-bell-ringing',
  'ti ti-bell-off',
  'ti ti-notification',
  'ti ti-brand-telegram',
  'ti ti-brand-whatsapp',
  'ti ti-brand-messenger',

  // Calendar & Time
  'ti ti-calendar',
  'ti ti-calendar-event',
  'ti ti-calendar-due',
  'ti ti-calendar-time',
  'ti ti-calendar-stats',
  'ti ti-clock',
  'ti ti-alarm',
  'ti ti-timer',
  'ti ti-hourglass',
  'ti ti-hourglass-high',
  'ti ti-history',

  // Business & Finance
  'ti ti-currency-dollar',
  'ti ti-currency-euro',
  'ti ti-currency-pound',
  'ti ti-currency-yen',
  'ti ti-currency-rupee',
  'ti ti-coin',
  'ti ti-coins',
  'ti ti-credit-card',
  'ti ti-wallet',
  'ti ti-cash',
  'ti ti-receipt',
  'ti ti-receipt-2',
  'ti ti-invoice',
  'ti ti-chart-bar',
  'ti ti-chart-line',
  'ti ti-chart-pie',
  'ti ti-chart-dots',
  'ti ti-growth',
  'ti ti-trending-up',
  'ti ti-trending-down',
  'ti ti-pig-money',

  // Shopping & E-commerce
  'ti ti-shopping-cart',
  'ti ti-shopping-bag',
  'ti ti-basket',
  'ti ti-package',
  'ti ti-packages',
  'ti ti-box',
  'ti ti-box-seam',
  'ti ti-discount',
  'ti ti-tag',
  'ti ti-tags',
  'ti ti-gift',
  'ti ti-gift-card',

  // HR & Employee
  'ti ti-briefcase',
  'ti ti-briefcase-2',
  'ti ti-tie',
  'ti ti-user-plus',
  'ti ti-users',
  'ti ti-users-group',
  'ti ti-badge',
  'ti ti-award',
  'ti-trophy',
  'ti ti-medal',
  'ti ti-target',
  'ti ti-flag',
  'ti ti-flag-2',
  'ti ti-flag-3',
  'ti ti-star',
  'ti ti-star-filled',
  'ti ti-heart',
  'ti ti-heart-filled',

  // Projects & Tasks
  'ti ti-clipboard-list',
  'ti ti-clipboard-check',
  'ti ti-checkbox',
  'ti ti-list-check',
  'ti ti-task',
  'ti ti-progress',
  'ti ti-kanban',
  'ti ti-columns-3',
  'ti ti-columns-2',
  'ti ti-sticky-note',
  'ti ti-note',
  'ti ti-notes',
  'ti ti-notebook',

  // CRM & Contacts
  'ti ti-address-book',
  'ti ti-address-book-2',
  'ti ti-contacts',
  'ti ti-users',
  'ti ti-building',
  'ti ti-handshake',
  'ti ti-handshake-off',
  'ti ti-briefcase',
  'ti ti-phone',
  'ti ti-phone-call',
  'ti ti-phone-incoming',
  'ti ti-phone-outgoing',
  'ti ti-video',
  'ti ti-video-off',

  // Settings & Configuration
  'ti ti-settings',
  'ti ti-settings-2',
  'ti ti-adjustments',
  'ti ti-tune',
  'ti ti-tool',
  'ti ti-tools',
  'ti ti-wrench',
  'ti ti-hammer',
  'ti ti-screwdriver',
  'ti ti-cog',
  'ti ti-cogs',
  'ti ti-sliders',
  'ti ti-slider',
  'ti ti-toggle-left',
  'ti ti-toggle-right',

  // View & Display
  'ti ti-eye',
  'ti ti-eye-off',
  'ti ti-eye-check',
  'ti ti-device-desktop',
  'ti ti-device-laptop',
  'ti ti-device-tablet',
  'ti ti-device-mobile',
  'ti ti-devices',
  'ti ti-monitor',
  'ti ti-browser',
  'ti ti-window-maximize',
  'ti ti-window-minimize',

  // Data & Storage
  'ti ti-database',
  'ti ti-database-import',
  'ti ti-database-export',
  'ti ti-server',
  'ti ti-server-2',
  'ti ti-cloud',
  'ti ti-cloud-upload',
  'ti ti-cloud-download',
  'ti ti-upload',
  'ti ti-download',
  'ti ti-import',
  'ti ti-export',
  'ti ti-link',
  'ti ti-link-2',
  'ti ti-unlink',

  // Help & Support
  'ti ti-help',
  'ti ti-help-hexagon',
  'ti ti-help-circle',
  'ti ti-lifebuoy',
  'ti ti-support',
  'ti ti-info-circle',
  'ti ti-info-hexagon',
  'ti ti-info-square',
  'ti ti-alert-triangle',
  'ti ti-alert-circle',
  'ti ti-alert-octagon',
  'ti ti-warning',

  // Social & Media
  'ti ti-brand-facebook',
  'ti ti-brand-twitter',
  'ti ti-brand-linkedin',
  'ti ti-brand-youtube',
  'ti ti-brand-instagram',
  'ti ti-brand-github',
  'ti ti-brand-gitlab',
  'ti ti-brand-bitbucket',
  'ti ti-brand-slack',
  'ti ti-brand-discord',
  'ti ti-brand-twitch',
  'ti ti-share',
  'ti ti-share-2',
  'ti ti-qr-code',
  'ti ti-barcode',

  // Travel & Places
  'ti ti-map',
  'ti ti-map-pin',
  'ti ti-map-pin-2',
  'ti ti-map-2',
  'ti ti-compass',
  'ti ti-location',
  'ti ti-globe',
  'ti ti-world',
  'ti ti-building',
  'ti ti-building-arch',
  'ti ti-building-bank',
  'ti ti-building-store',
  'ti ti-truck',
  'ti ti-truck-delivery',
  'ti ti-car',
  'ti ti-plane',
  'ti ti-train',

  // Health & Medical
  'ti ti-heart-pulse',
  'ti ti-activity',
  'ti ti-pulse',
  'ti ti-medical-cross',
  'ti ti-first-aid-kit',
  'ti ti-pills',
  'ti ti-stethoscope',
  'ti ti-microscope',

  // Education & Learning
  'ti ti-book',
  'ti ti-book-2',
  'ti ti-books',
  'ti ti-bookmark',
  'ti ti-bookmark-off',
  'ti ti-graduation-cap',
  'ti ti-academic-cap',
  'ti ti-school',
  'ti ti-presentation',
  'ti ti-presentation-analytics',
  'ti ti-chalkboard',

  // Miscellaneous
  'ti ti-sun',
  'ti ti-moon',
  'ti ti-cloud',
  'ti ti-cloud-rain',
  'ti ti-cloud-sun',
  'ti ti-bolt',
  'ti ti-zap',
  'ti ti-fire',
  'ti ti-flame',
  'ti ti-droplet',
  'ti ti-droplet-filled',
  'ti ti-leaf',
  'ti ti-plant',
  'ti ti-tree',
  'ti ti-landscape',

  // Documents & Reporting
  'ti ti-report',
  'ti ti-report-analytics',
  'ti ti-file-analytics',
  'ti ti-chart-dots',
  'ti ti-chart-bar',
  'ti ti-file-text',
  'ti ti-file-description',
  'ti ti-file-invoice',
  'ti ti-file-receipt',

  // Development
  'ti ti-code',
  'ti ti-brand-javascript',
  'ti ti-brand-typescript',
  'ti ti-brand-react',
  'ti ti-brand-vue',
  'ti ti-brand-angular',
  'ti ti-brand-nodejs',
  'ti ti-brand-python',
  'ti ti-brand-java',
  'ti ti-brand-php',
  'ti ti-terminal',
  'ti ti-console',
];

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
  currentIcon?: string;
}

const IconPicker: React.FC<IconPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentIcon = 'ti ti-file'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredIcons = searchTerm
    ? TABLER_ICONS.filter(icon =>
        icon.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : TABLER_ICONS;

  const handleIconSelect = (icon: string) => {
    onSelect(icon);
    onClose();
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ti ti-icons me-2"></i> Select an Icon
            </h5>
            <button
              type="button"
              className="btn-close custom-btn-close"
              onClick={onClose}
            >
              <i className="ti ti-x" />
            </button>
          </div>

          <div className="modal-body">
            {/* Search */}
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search icons (e.g., home, user, settings)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            {/* Current Selection */}
            {currentIcon && (
              <div className="alert alert-info d-flex align-items-center" role="alert">
                <i className={`${currentIcon} fs-4 me-2`}></i>
                <div>
                  <strong>Current Selection:</strong> {currentIcon}
                </div>
              </div>
            )}

            {/* Icons Grid */}
            <div className="border rounded p-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {filteredIcons.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-search-off text-muted" style={{ fontSize: '48px' }}></i>
                  <p className="text-muted mt-2">No icons found matching "{searchTerm}"</p>
                </div>
              ) : (
                <div className="row g-2">
                  {filteredIcons.map((icon) => (
                    <div key={icon} className="col-4 col-sm-3 col-md-2 col-lg-1">
                      <button
                        type="button"
                        className={`btn w-100 d-flex align-items-center justify-content-center ${
                          currentIcon === icon
                            ? 'btn-primary'
                            : hoveredIcon === icon
                            ? 'btn-light-primary'
                            : 'btn-light'
                        }`}
                        style={{ height: '60px' }}
                        onClick={() => handleIconSelect(icon)}
                        onMouseEnter={() => setHoveredIcon(icon)}
                        onMouseLeave={() => setHoveredIcon(null)}
                        title={icon}
                      >
                        <i className={`${icon}`} style={{ fontSize: '28px' }}></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-2 text-muted small">
              Showing {filteredIcons.length} of {TABLER_ICONS.length} icons
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconPicker;
