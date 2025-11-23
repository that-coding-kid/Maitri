export type Language = 'en' | 'hi';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'dashboard.title': 'Maitri Dashboard',
    'dashboard.worker': 'Community Health Worker',
    'menu.profile': 'Profile',
    'menu.settings': 'Settings',
    'menu.logout': 'Log out',
    
    // Stats
    'stats.callsToday': 'Calls Today',
    'stats.activeAlerts': 'Active Alerts',
    'stats.avgResponseTime': 'Avg Response Time',
    'stats.fromYesterday': 'from yesterday',
    
    // Charts
    'chart.trends': 'Trends',
    'chart.categoryBreakdown': 'Category Breakdown',
    'chart.recentCalls': 'Recent Calls',
    'chart.systemStatus': 'System Status',
    
    // Table headers
    'table.time': 'Time',
    'table.category': 'Category',
    'table.severity': 'Severity',
    'table.status': 'Status',
    'table.noRecords': 'No recent calls',
    
    // Alert
    'alert.pending': 'Pending Alerts',
    'alert.activeAlerts': 'active alerts',
    'alert.resolved': 'Resolved',
    'alert.pending_status': 'Pending',
    'alert.emergency': 'Emergency Alert',
    'alert.immediateAttention': 'Immediate attention required',
    'alert.phoneNumber': 'Phone Number',
    'alert.severityLevel': 'Severity Level',
    'alert.villageRecording': 'Village Recording',
    'alert.villageName': 'Village Name',
    'alert.time': 'Time',
    'alert.category': 'Risk Category',
    'alert.reasoning': 'AI Reasoning',
    'alert.viewTranscript': 'View Full Transcript',
    'alert.markResponded': 'Mark as Responded',
    'alert.resolved_msg': 'Alert Resolved',
    'alert.responded_desc': 'The emergency alert has been marked as responded.',
    'alert.error': 'Error',
    'alert.error_resolve': 'Failed to resolve alert. Please try again.',
    
    // IVR
    'ivr.systemStatus': 'IVR System Status',
    'ivr.active': 'Active',
    'ivr.calls': 'Calls Processed',
    'ivr.avgDuration': 'Avg Duration',
    
    // Login
    'login.title': 'Maitri Dashboard',
    'login.subtitle': 'ASHA Worker Portal - Sign in to access health alerts',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.signin': 'Sign In',
    'login.tagline': 'Serving rural communities through technology',
  },
  hi: {
    // Header
    'dashboard.title': 'मैत्री डैशबोर्ड',
    'dashboard.worker': 'सामुदायिक स्वास्थ्य कार्यकर्ता',
    'menu.profile': 'प्रोफ़ाइल',
    'menu.settings': 'सेटिंग्स',
    'menu.logout': 'लॉग आउट',
    
    // Stats
    'stats.callsToday': 'आज की कॉल',
    'stats.activeAlerts': 'सक्रिय अलर्ट',
    'stats.avgResponseTime': 'औसत प्रतिक्रिया समय',
    'stats.fromYesterday': 'कल से',
    
    // Charts
    'chart.trends': 'ट्रेंड',
    'chart.categoryBreakdown': 'श्रेणी विश्लेषण',
    'chart.recentCalls': 'हाल की कॉल',
    'chart.systemStatus': 'सिस्टम स्थिति',
    
    // Table headers
    'table.time': 'समय',
    'table.category': 'श्रेणी',
    'table.severity': 'गंभीरता',
    'table.status': 'स्थिति',
    'table.noRecords': 'कोई हाल की कॉल नहीं',
    
    // Alert
    'alert.pending': 'लंबित अलर्ट',
    'alert.activeAlerts': 'सक्रिय अलर्ट',
    'alert.resolved': 'समाधान किया गया',
    'alert.pending_status': 'लंबित',
    'alert.emergency': 'आपातकालीन अलर्ट',
    'alert.immediateAttention': 'तत्काल ध्यान आवश्यक है',
    'alert.phoneNumber': 'फोन नंबर',
    'alert.severityLevel': 'गंभीरता स्तर',
    'alert.villageRecording': 'गांव का रिकॉर्डिंग',
    'alert.villageName': 'गांव का नाम',
    'alert.time': 'समय',
    'alert.category': 'जोखिम श्रेणी',
    'alert.reasoning': 'एआई विश्लेषण',
    'alert.viewTranscript': 'पूरा ट्रांसक्रिप्ट देखें',
    'alert.markResponded': 'प्रतिक्रिया दी गई के रूप में चिह्नित करें',
    'alert.resolved_msg': 'अलर्ट समाधान किया गया',
    'alert.responded_desc': 'आपातकालीन अलर्ट को प्रतिक्रिया दी गई के रूप में चिह्नित किया गया है।',
    'alert.error': 'त्रुटि',
    'alert.error_resolve': 'अलर्ट को समाधान करने में विफल। कृपया पुनः प्रयास करें।',
    
    // IVR
    'ivr.systemStatus': 'आईवीआर सिस्टम स्थिति',
    'ivr.active': 'सक्रिय',
    'ivr.calls': 'प्रसंस्कृत कॉल',
    'ivr.avgDuration': 'औसत अवधि',
    
    // Login
    'login.title': 'मैत्री डैशबोर्ड',
    'login.subtitle': 'आशा कार्यकर्ता पोर्टल - स्वास्थ्य अलर्ट प्राप्त करने के लिए साइन इन करें',
    'login.username': 'उपयोगकर्ता नाम',
    'login.password': 'पासवर्ड',
    'login.signin': 'साइन इन करें',
    'login.tagline': 'तकनीकी के माध्यम से ग्रामीण समुदायों की सेवा',
  }
};

export function translate(key: string, language: Language): string {
  return translations[language][key] || key;
}
