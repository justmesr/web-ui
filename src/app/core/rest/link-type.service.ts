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

import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {LumeerError} from '../error/lumeer.error';
import {LinkType} from '../dto/link-type';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {Observable} from 'rxjs/Observable';
import {LocalStorage} from '../../shared/utils/local-storage';
import 'rxjs/add/observable/of';
import {Workspace} from '../store/navigation/workspace.model';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';

const LINK_TYPES = 'linkTypes';

// TODO implement on backend
@Injectable()
export class LinkTypeService {

  private workspace: Workspace;

  constructor(private httpClient: HttpClient,
              private store: Store<AppState>) {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public createLinkType(linkType: LinkType): Observable<string> {
    const linkTypes = LocalStorage.get(LINK_TYPES) || {};

    linkType.id = String(Math.floor(Math.random() * 1000000000000000) + 1);
    linkTypes[linkType.id] = linkType;

    LocalStorage.set(LINK_TYPES, linkTypes);

    return Observable.of(linkType.id);
  }

  public updateLinkType(id: string, linkType: LinkType): Observable<LinkType> {
    const linkTypes = LocalStorage.get(LINK_TYPES) || {};

    linkTypes[id] = linkType;

    LocalStorage.set(LINK_TYPES, linkTypes);

    return Observable.of(linkType);
  }

  public deleteLinkType(id: string): Observable<any> {
    const linkTypes = LocalStorage.get(LINK_TYPES) || {};

    delete linkTypes[id];

    LocalStorage.set(LINK_TYPES, linkTypes);

    return Observable.of({});
  }

  public getLinkTypesByIds(...ids: string[]): Observable<LinkType[]> {
    const linkTypes: { [id: string]: LinkType } = LocalStorage.get(LINK_TYPES) || {};

    const results = Object.values(linkTypes).filter(linkType => ids.includes(linkType.id));
    return Observable.of(results);
  }

  public getLinkTypesByCollections(...collectionCodes: string[]): Observable<LinkType[]> {
    const linkTypes: { [id: string]: LinkType } = LocalStorage.get(LINK_TYPES) || {};

    const results = Object.values(linkTypes).filter(linkType => collectionCodes.includes(linkType.collectionCodes[0]) ||
      collectionCodes.includes(linkType.collectionCodes[1]));
    return Observable.of(results);
  }

  public getLinkTypes(): LinkType[] {
    const linkTypes: { [id: string]: LinkType } = LocalStorage.get(LINK_TYPES) || {};
    return Object.values(linkTypes);
  }

  private static handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

  private apiPrefix(collectionCode: string): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/c/${collectionCode}/linktypes`;
  }

}
