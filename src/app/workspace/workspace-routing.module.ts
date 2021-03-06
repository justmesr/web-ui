/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WorkspaceChooserComponent} from './workspace-chooser/workspace-chooser.component';
import {OrganizationFormComponent} from './organization/form/organization-form.component';
import {ProjectFormComponent} from './project/form/project-form.component';
import {OrganizationSettingsComponent} from './organization/organization-settings.component';
import {ProjectSettingsComponent} from './project/project-settings.component';
import {ProjectPermissionsComponent} from './project/permissions/project-permissions.component';
import {OrganizationPermissionsComponent} from './organization/permissions/organization-permissions.component';

const workspaceRoutes: Routes = [
  {
    path: 'organization/:organizationCode/project/add',
    component: ProjectFormComponent,
    data: {
      creation: true
    }
  },
  {
    path: 'organization/:organizationCode/project/:projectCode',
    component: ProjectSettingsComponent,
    children: [
      {
        path: 'permissions',
        component: ProjectPermissionsComponent
      },
      {
        path: '',
        redirectTo: 'permissions',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'organization/add',
    component: OrganizationFormComponent
  },
  {
    path: 'organization/:organizationCode',
    component: OrganizationSettingsComponent,
    children: [
      {
        path: 'permissions',
        component: OrganizationPermissionsComponent
      },
      {
        path: '',
        redirectTo: 'permissions',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'workspace',
    component: WorkspaceChooserComponent,
    data: {
      searchBoxHidden: true
    }
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(workspaceRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class WorkspaceRoutingModule {

}
