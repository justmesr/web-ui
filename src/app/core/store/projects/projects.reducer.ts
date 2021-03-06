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

import {groupsAdapter} from '../groups/groups.state';
import {ProjectsAction, ProjectsActionType} from './projects.action';
import {initialProjectsState, projectsAdapter, ProjectsState} from './projects.state';

export function projectsReducer(state: ProjectsState = initialProjectsState, action: ProjectsAction.All): ProjectsState {
  switch (action.type) {
    case ProjectsActionType.GET_SUCCESS:
      const organizationCode = action.payload.projects.length ? action.payload.projects[0].organizationCode : null;
      return projectsAdapter.addAll(action.payload.projects, {...state, organizationCode: organizationCode, selectedProjectCode: null});
    case ProjectsActionType.CREATE_SUCCESS:
      return groupsAdapter.addOne(action.payload.project, state);
    case ProjectsActionType.UPDATE_SUCCESS:
      return projectsAdapter.updateOne({id: action.payload.project.code, changes: action.payload.project}, state);
    case ProjectsActionType.DELETE_SUCCESS:
      return groupsAdapter.removeOne(action.payload.projectCode, state);
    case ProjectsActionType.SELECT:
      return {...state, selectedProjectCode: action.payload.projectCode};
    default:
      return state;
  }
}
