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

import {ROUTER_CANCEL, ROUTER_NAVIGATION, RouterCancelAction, RouterNavigationAction} from '@ngrx/router-store';
import {QueryConverter} from './query.converter';
import {RouteFinder} from '../../../shared/utils/route-finder';
import {NavigationState} from './navigation.state';

function onRouterNavigation(state: NavigationState, action: RouterNavigationAction): NavigationState {
  const route = action.payload.routerState.root;
  // TODO harvest params, queryParams, and data from all route nodes in the tree
  const params = RouteFinder.getFirstChildRouteWithParams(route).paramMap;
  const queryParams = route.queryParamMap;

  return {
    query: QueryConverter.fromString(queryParams.get('query')),
    workspace: {
      organizationCode: params.get('organizationCode'),
      projectCode: params.get('projectCode'),
      collectionCode: params.get('collectionCode'),
      viewCode: params.get('vc')
    },
    perspective: extractPerspectiveIdFromUrl(action.payload.routerState.url),
    searchBoxHidden: RouteFinder.getDeepestChildRoute(route).data['searchBoxHidden']
  };
}

function extractPerspectiveIdFromUrl(url: string): string {
  const urlSegments = url.split('/');
  const viewIndex = urlSegments.findIndex(segment => segment.startsWith('view'));
  return viewIndex && urlSegments.length > viewIndex + 1 ? urlSegments[viewIndex + 1].split('?')[0] : null;
}

function onRouterCancel(state: NavigationState, action: RouterCancelAction<NavigationState>) {
  return (action as RouterCancelAction<NavigationState>).payload.storeState;
}

export function navigationReducer(state: NavigationState, action: RouterNavigationAction | RouterCancelAction<NavigationState>): NavigationState {
  switch (action.type) {
    case ROUTER_NAVIGATION:
      return onRouterNavigation(state, action);
    case ROUTER_CANCEL:
      return onRouterCancel(state, action);
    default:
      return state;
  }
}
