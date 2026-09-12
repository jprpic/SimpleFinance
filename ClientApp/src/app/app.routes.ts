import { Routes } from '@angular/router';

import { AnalyticsComponent } from './components/analytics/analytics';
import { SpendingPageComponent } from './components/spending-page/spending-page';

export const routes: Routes = [
    {
        path: 'spendings',
        component: SpendingPageComponent,
    },
    {
        path: 'analytics',
        component: AnalyticsComponent,
    },
    {
        path: '',
        redirectTo: 'spendings',
        pathMatch: 'full',
    },
];
