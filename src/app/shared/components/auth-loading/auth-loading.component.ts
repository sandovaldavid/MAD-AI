import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-auth-loading',
    template: `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">Verificando autenticación...</p>
        </div>
    `,
    styles: [
        `
            .loading-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background-color: #f8fafc;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #e2e8f0;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .loading-text {
                margin-top: 16px;
                color: #64748b;
                font-size: 14px;
            }

            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLoadingComponent {}
