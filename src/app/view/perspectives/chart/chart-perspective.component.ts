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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppState} from '../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {selectDocumentsByQuery} from '../../../core/store/documents/documents.state';
import {Subscription} from 'rxjs/Subscription';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectNavigation} from '../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Workspace} from '../../../core/store/navigation/workspace.model';
import {CollectionAttributePair, createCollectionAttributePairs} from './model/collection-attribute-pair';
import {animate, style, transition, trigger} from '@angular/animations';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'chart-perspective',
  templateUrl: './chart-perspective.component.html',
  styleUrls: ['./chart-perspective.component.scss'],
  animations: [
    trigger('slide', [
      transition(':enter', [
        style({width: 0}),
        animate(200, style({width: '*'}))
      ]),
      transition(':leave', [
        animate(200, style({width: 0}))
      ])
    ])
  ]
})
export class ChartPerspectiveComponent implements OnInit, OnDestroy {

  private _documents: DocumentModel[];

  get documents() {
    return this._documents;
  }

  set documents(value) {
    this._documents = value;
    this.documentAttributes = this.usableAttributes();
  }

  public documentAttributes: CollectionAttributePair[];

  private subscriptions: Subscription;

  public attributeX: string;

  public attributeY: string;

  public chartHovered: boolean;

  public pickerHovered: boolean;

  private query: QueryModel;

  constructor(private store: Store<AppState>,
              private i18n: I18n) {
  }

  private usableAttributes(): CollectionAttributePair[] {
    if (this.documents) {
      return createCollectionAttributePairs(this.documents);
    } else {
      return [];
    }
  }

  public ngOnInit() {
    this.subscribeOnData();
  }

  private subscribeOnData() {
    const navigationSubscription = this.navigationSubscription();
    const dataSubscription = this.dataSubscription();

    this.subscriptions = navigationSubscription;
    this.subscriptions.add(dataSubscription);
  }

  private navigationSubscription() {
    return this.store.select(selectNavigation).subscribe(navigation => {
      if (this.validWorkspace(navigation.workspace)) {
        this.getData(navigation.query);
        this.query = navigation.query;
      }
    });
  }

  private validWorkspace(workspace: Workspace): boolean {
    return Boolean(workspace && workspace.organizationCode && workspace.projectCode);
  }

  private getData(query: QueryModel) {
    this.store.dispatch(new DocumentsAction.Get({query}));
  }

  private dataSubscription() {
    return this.store.select(selectDocumentsByQuery).subscribe(documents => this.documents = documents);
  }

  public axisTitle(): string {
    return this.i18n({id: 'chart.axis.name', value: 'Axis'});
  }

  public isDisplayable(): boolean {
    return this.query && this.query.collectionIds && this.query.collectionIds.length === 1;
  }

  public ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

}
