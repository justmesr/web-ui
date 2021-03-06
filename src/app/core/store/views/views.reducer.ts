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

import {ViewsAction, ViewsActionType} from './views.action';
import {initialViewsState, viewsAdapter, ViewsState} from './views.state';

export function viewsReducer(state: ViewsState = initialViewsState, action: ViewsAction.All): ViewsState {
  switch (action.type) {
    case ViewsActionType.GET_SUCCESS:
      return viewsAdapter.addMany(action.payload.views, state);
    case ViewsActionType.CREATE_SUCCESS:
      return viewsAdapter.addOne(action.payload.view, state);
    case ViewsActionType.UPDATE_SUCCESS:
      return viewsAdapter.updateOne({id: action.payload.view.code, changes: action.payload.view}, state);
    case ViewsActionType.CHANGE_CONFIG:
      const config = Object.assign({}, state.config, action.payload.config);
      return {...state, config: config};
    default:
      return state;
  }
}
