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

import {HttpClient, HttpEvent} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import 'rxjs/add/observable/of';
import {Observable} from 'rxjs/Observable';
import {LocalStorage} from '../../shared/utils/local-storage';
import {LinkType, Query} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';

@Injectable()
export class LinkTypeService {

  private workspace: Workspace;

  constructor(private httpClient: HttpClient,
              private store: Store<AppState>) {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public createLinkType(linkType: LinkType): Observable<LinkType> {
    const linkTypes = LocalStorage.get(this.webStorageKey()) || {};

    linkType.id = String(Math.floor(Math.random() * 1000000000000000) + 1);
    linkTypes[linkType.id] = linkType;

    LocalStorage.set(this.webStorageKey(), linkTypes);

    return Observable.of(linkType);
  }

  public updateLinkType(id: string, linkType: LinkType): Observable<LinkType> {
    const linkTypes = LocalStorage.get(this.webStorageKey()) || {};

    linkTypes[id] = linkType;

    LocalStorage.set(this.webStorageKey(), linkTypes);

    return Observable.of(linkType);
  }

  public deleteLinkType(id: string): Observable<string> {
    const linkTypes = LocalStorage.get(this.webStorageKey()) || {};

    delete linkTypes[id];

    LocalStorage.set(this.webStorageKey(), linkTypes);

    return Observable.of(id);
  }

  public getLinkTypes(query: Query): Observable<LinkType[]> {
    const linkTypesMap: { [id: string]: LinkType } = LocalStorage.get(this.webStorageKey()) || {};
    let linkTypes = Object.values(linkTypesMap);

    if (query && query.linkTypeIds && query.linkTypeIds.length) {
      linkTypes = linkTypes.filter(linkType => query.linkTypeIds.includes(linkType.id));
    }

    if (query && query.collectionCodes && query.collectionCodes.length) {
      linkTypes = linkTypes.filter(linkType => linkType.collectionCodes.some(code => query.collectionCodes.includes(code)));
    }

    linkTypes.forEach(linkType => {
      if (!linkType.attributes) {
        linkType.attributes = [];
      }
    });

    return Observable.of(linkTypes);
  }

  private webStorageKey(): string {
    return `linkTypes-${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  private restApiPrefix(collectionCode: string): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/link-types`;
  }

}
