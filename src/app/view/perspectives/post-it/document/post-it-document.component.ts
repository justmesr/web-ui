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

import {AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {isString} from 'util';
import {Permission} from '../../../../core/dto';
import {AppState} from '../../../../core/store/app.state';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {KeyCode} from '../../../../shared/key-code';
import {Role} from '../../../../shared/permissions/role';
import {PostItLayout} from '../../../../shared/utils/layout/post-it-layout';
import {AttributePair} from '../document-data/attribute-pair';
import {PostItDocumentModel} from '../document-data/post-it-document-model';
import {NavigationHelper} from '../util/navigation-helper';
import {SelectionHelper} from '../util/selection-helper';
import {AttributeModel} from '../../../../core/store/collections/collection.model';
import DeleteConfirm = DocumentsAction.DeleteConfirm;
import Update = DocumentsAction.Update;

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss']
})
export class PostItDocumentComponent implements OnInit, AfterViewInit, OnDestroy {

  private _postItModel: PostItDocumentModel;

  @HostListener('focusout')
  public onFocusOut(): void {
    if (this.shouldSuggestDeletion()) {
      this.confirmDeletion();
    } else if (this.changed) {
      this.changed = false;
      this.changes.emit();
    }
  }

  @Input()
  public get postItModel() {
    return this._postItModel;
  }

  public set postItModel(value) {
    this._postItModel = value;
    this.refreshDataAttributePairs();
  }

  @Input()
  public perspectiveId: string;

  @Input()
  public layoutManager: PostItLayout;

  @Input()
  public navigationHelper: NavigationHelper;

  @Input()
  public selectionHelper: SelectionHelper;

  @Output()
  public removed = new EventEmitter();

  @Output()
  public changes = new EventEmitter();

  @ViewChild('content')
  public content: ElementRef;

  private changed: boolean;

  public attributePairs: AttributePair[] = [];

  public newAttributePair: AttributePair = new AttributePair();

  constructor(private store: Store<AppState>,
              private element: ElementRef) {
  }

  private refreshDataAttributePairs(): void {
    if (!this.postItModel.document.data) {
      this.postItModel.document.data = {};
    }

    this.attributePairs = Object.entries(this.postItModel.document.data)
      .sort(([attribute1, value1], [attribute2, value2]) => attribute1.localeCompare(attribute2))
      .map(([attribute, value]) => this.createAttributePairFromData(attribute, value));
  }

  private createAttributePairFromData(attribute: string, value: any) {
    return {
      attribute: attribute,
      previousAttributeName: attribute,
      value: isString(value) ? value : JSON.stringify(value, null, 2)
    };
  }

  public ngOnInit(): void {
    this.disableScrollOnNavigation();
  }

  private disableScrollOnNavigation(): void {
    const scrollKeys = [KeyCode.UpArrow, KeyCode.DownArrow];

    this.content.nativeElement.addEventListener('keydown', (key: KeyboardEvent) => {
      if (scrollKeys.includes(key.keyCode)) {
        key.preventDefault();
      }
    }, false);
  }

  public ngAfterViewInit(): void {
    this.layoutManager.add(this.element.nativeElement);
  }

  public clickOnAttributePair(column: number, row: number): void {
    const enableEditMode = this.selectionHelper.wasPreviouslySelected(column, row, this.postItModel.document.id);

    this.selectionHelper.setEditMode(enableEditMode);
    this.selectionHelper.select(column, row, this.postItModel);
  }

  public selectNext(): void {
    this.selectionHelper.selectNext(this.postItModel);
  }

  public toggleDocumentFavorite() {
    this.store.dispatch(new Update({document: this.postItModel.document, toggleFavourite: true}));
  }

  public createAttributePair(): void {
    this.newAttributePair.value = '';
    this.attributePairs.push(this.newAttributePair);

    this.newAttributePair = {} as AttributePair;

    document.activeElement['value'] = '';
    setTimeout(() => {
      this.selectionHelper.select(1, Number.MAX_SAFE_INTEGER, this.postItModel);
    });

    this.stageChanges();
  }

  private removeAttribute() {
    const selectedRow = this.selectionHelper.selection.row;
    this.attributePairs.splice(selectedRow, 1);

    this.selectHigherRow();
    this.stageChanges();
  }

  private selectHigherRow() {
    setTimeout(() => {
      this.selectionHelper.select(
        this.selectionHelper.selection.column,
        this.selectionHelper.selection.row - 1,
        this.postItModel
      );
    });
  }

  public updateAttribute(attributePair: AttributePair): void {
    attributePair.attribute = attributePair.attribute.trim();
    attributePair.previousAttributeName = attributePair.attribute;

    if (!attributePair.attribute) {
      this.removeAttribute();
    }

    this.stageChanges();
  }

  public removeValue() {
    const selectedRow = this.selectionHelper.selection.row;
    const selectedPair = this.attributePairs[selectedRow];

    selectedPair.value = '';
    this.updateValue(selectedPair);
  }

  public updateValue(attributePair: AttributePair): void {
    attributePair.value = attributePair.value.trim();
    this.stageChanges();
  }

  public confirmDeletion(): void {
    if (this.postItModel.initialized) {
      this.store.dispatch(new DeleteConfirm({
        collectionId: this.postItModel.document.collectionId,
        documentId: this.postItModel.document.id
      }));

    } else {
      this.removed.emit();
    }
  }

  public unusedAttributes(): AttributeModel[] {
    return this.postItModel.document.collection.attributes.filter(attribute => {
      return this.postItModel.document.data[attribute.id] === undefined;
    });
  }

  public isDefaultAttribute(attributeFullName: string): boolean {
    return attributeFullName === this.postItModel.document.collection.defaultAttributeId;
  }

  public hasWriteRole(): boolean {
    return this.hasRole(Role.Write);
  }

  private hasRole(role: string): boolean {
    const collection = this.postItModel.document.collection;
    const permissions = collection && collection.permissions || {users: [], groups: []};
    return permissions.users.some((permission: Permission) => permission.roles.includes(role));
  }

  private shouldSuggestDeletion(): boolean {
    return this.hasNoAttributes() && this.isInitialized();
  }

  private hasNoAttributes(): boolean {
    return this.attributePairs.length === 0;
  }

  private isInitialized(): boolean {
    return Boolean(this.postItModel && this._postItModel.document.id);
  }

  private stageChanges() {
    this.changed = true;
    this.saveAttributePairsAsData();
  }

  public saveAttributePairsAsData() {
    this.postItModel.document.data = this.attributePairs.reduce((result, pair) => {
      result[pair.attribute] = pair.value;
      return result;
    }, {});
  }

  public suggestionListId(): string {
    return `${ this.perspectiveId }${ this.postItModel.document.id || 'uninitialized' }`;
  }

  public ngOnDestroy(): void {
    this.layoutManager.remove(this.element.nativeElement);
  }

}
