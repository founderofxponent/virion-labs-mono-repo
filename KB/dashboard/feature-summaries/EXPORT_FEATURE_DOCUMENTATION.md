# Analytics Export Feature Documentation

## Overview

The analytics export feature allows users to export their analytics data in multiple formats for external analysis, reporting, and archival purposes.

## Features

### Export Formats
- **CSV**: Comma-separated values format for spreadsheet applications (Excel, Google Sheets)
- **JSON**: Machine-readable format for developers and API integrations
- **PDF**: Formatted report ready for presentation and sharing

### Export Options
- **Quick CSV Export**: One-click export of all analytics data in CSV format
- **Custom Export**: Choose specific sections and format through the export dialog

### Available Sections
- **Overview Metrics**: Total clients, campaigns, responses, and completion rates
- **Performance Over Time**: Daily/weekly performance trends
- **Client Distribution**: Client status and industry breakdown
- **Campaign Performance**: Individual campaign metrics and completion rates
- **Recent Activity**: Latest actions and events on the platform

## Usage

### Quick Export
1. Navigate to the Analytics page
2. Click the "Quick CSV" button in the top-right corner
3. The file will automatically download with all available data

### Custom Export
1. Navigate to the Analytics page
2. Click the "Export Options" button in the top-right corner
3. Choose your preferred format:
   - **CSV**: Best for spreadsheet analysis
   - **JSON**: Best for programmatic access
   - **PDF**: Best for presentations and reports
4. Select which sections to include in the export
5. Click "Export" to download the file

## File Naming Convention

Exported files follow this naming pattern:
```
analytics-report-{date-range}-{timestamp}.{extension}
```

Examples:
- `analytics-report-last-30-days-2024-01-15.csv`
- `analytics-report-year-to-date-2024-01-15.json`
- `analytics-report-all-time-2024-01-15.html` (PDF exports as HTML for browser printing)

## Technical Implementation

### Components
- `ExportDialog`: Main export interface component
- `AnalyticsService.exportAnalytics()`: Core export functionality
- Toast notifications for user feedback

### Export Process
1. User selects export options
2. Data is formatted according to the chosen format
3. File is generated client-side using Blob API
4. Browser download is triggered automatically
5. Success/error notifications are shown

### Data Structure
The export includes all available analytics data:
- Core metrics (totals, rates, percentages)
- Time-series performance data
- Client and campaign breakdowns
- Recent activity logs

## Browser Compatibility

The export feature works in all modern browsers that support:
- Blob API
- URL.createObjectURL()
- HTML5 download attribute

## Security Considerations

- All exports are generated client-side
- No data is sent to external servers
- Export access is role-based (admin/client permissions)
- Data is filtered based on user permissions

## Troubleshooting

### Common Issues

**Export button not visible**
- Ensure you have the required permissions
- Check that analytics data has loaded successfully

**Download not starting**
- Check browser popup/download blockers
- Ensure JavaScript is enabled
- Try a different browser

**Empty or incomplete data**
- Verify the selected date range has data
- Check that the selected sections contain data
- Try exporting with different section combinations

**PDF export not working**
- PDF export uses browser print functionality
- Ensure popups are allowed for the site
- As fallback, an HTML file will be downloaded

## Future Enhancements

Potential improvements for future versions:
- Scheduled exports
- Email delivery of reports
- Custom date range selection
- Chart/visualization exports
- Excel format support
- Automated report generation 