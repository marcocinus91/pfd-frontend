import { Routes } from "@angular/router";
import { LayoutComponent } from "../../shared/components/layout/layout.component";

export const PROFILE_ROUTES: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./profile/profile.component').then(m => m.ProfileComponent),
            }
        ]
    }
]