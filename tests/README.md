# 🧪 Virion Labs Testing Suite

This directory contains all testing resources and documentation for the Virion Labs platform.

## 📁 Directory Structure

```
tests/
├── README.md                    # This file - testing overview
├── manual/                      # Manual testing guides and checklists
│   ├── MANUAL_TESTING_GUIDE.md  # Complete step-by-step testing guide
│   ├── feature-checklists/      # Individual feature testing checklists
│   └── test-scenarios/          # Specific test scenarios and edge cases
├── automated/                   # Automated test scripts (future)
│   ├── playwright/              # Playwright automation scripts
│   └── api/                     # API testing scripts
├── credentials/                 # Test user credentials and access info
│   ├── TEST_CREDENTIALS.md      # Login credentials for test accounts
│   └── database-access.md       # Database connection details
├── reports/                     # Test execution reports
│   ├── YYYY-MM-DD/             # Date-based test reports
│   └── latest-results.md        # Latest test execution summary
└── screenshots/                 # Test evidence and UI screenshots
    ├── manual-testing/          # Screenshots from manual testing
    └── bug-reports/             # Screenshots for bug documentation
```

## 🎯 Testing Types

### Manual Testing
- **Full platform testing** with real user workflows
- **Cross-browser compatibility** testing
- **User experience validation**
- **Database verification** for all operations

### Automated Testing (Future)
- **API endpoint testing**
- **UI automation with Playwright**
- **Database integrity tests**
- **Performance testing**

## 🚀 Getting Started

1. **Read the manual testing guide**: `manual/MANUAL_TESTING_GUIDE.md`
2. **Get test credentials**: `credentials/TEST_CREDENTIALS.md`
3. **Follow the step-by-step process** documented in the guide
4. **Document results** in the `reports/` directory
5. **Capture screenshots** for evidence in `screenshots/`

## 📊 Test Coverage Areas

- ✅ **Authentication System** (Login/Logout/Registration)
- ✅ **Influencer Dashboard** (Links, Analytics, Settings)
- ✅ **Admin Dashboard** (Clients, Campaigns, Analytics)
- ✅ **Cross-user Functionality** (Multi-role testing)
- ✅ **Database Integration** (Data persistence & accuracy)
- ✅ **Referral Link System** (Creation, Tracking, Analytics)

## 🔄 Regular Testing Schedule

- **Weekly**: Quick smoke tests of core functionality
- **Monthly**: Full comprehensive testing of all features
- **Pre-release**: Complete testing including edge cases
- **Post-deployment**: Verification testing in production

## 📝 Reporting Issues

When bugs are found:
1. Document in `reports/bug-reports/`
2. Include screenshots in `screenshots/bug-reports/`
3. Follow the bug report template
4. Include database queries that verify the issue
5. Tag with severity level (Critical/High/Medium/Low) 