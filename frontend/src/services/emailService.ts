import React from 'react';

interface EmailParams {
    to: string;
    subject: string;
    body: string;
}

export class EmailService {
    private showToast: (message: string) => void;

    constructor(toastCallback: (message: string) => void) {
        this.showToast = toastCallback;
    }

    public sendEmail(params: EmailParams): void {
        console.log("--- SIMULATING EMAIL ---");
        console.log(`To: ${params.to}`);
        console.log(`Subject: ${params.subject}`);
        console.log(`Body: ${params.body}`);
        console.log("----------------------");
        
        // Trigger the UI toast notification
        this.showToast(`Email sent to ${params.to}`);
    }
}
