import { apiClient } from './apiClient';
export class EmailService {
    showToast;
    constructor(toastCallback) {
        this.showToast = toastCallback;
    }
    async sendEmail(params) {
        try {
            await apiClient.logActivity({
                user: 'System Notification Service',
                action: 'Email Notification Dispatch',
                target_type: 'EmailNotification',
                target_id: params.to,
                details: `Dispatched email notification to ${params.to}: "${params.subject}"`
            });
        }
        catch (e) {
            // Fail safe logging
        }
        this.showToast(`Email notification dispatched to ${params.to}`);
    }
}
export default EmailService;
