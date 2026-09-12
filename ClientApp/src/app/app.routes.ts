import { Routes } from '@angular/router';

import { SpendingPageComponent } from './components/spending-page/spending-page';
import { SavingsPageComponent } from './components/savings-page/savings-page';

export const routes: Routes = [
    {
        path: 'spendings',
        component: SpendingPageComponent,
    },
    {
        path: 'savings',
        component: SavingsPageComponent,
    },
    {
        path: '',
        redirectTo: 'spendings',
        pathMatch: 'full',
    },
];
