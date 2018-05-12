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

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import {Store} from '@ngrx/store';
import {filter, withLatestFrom} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../core/store/app.state';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectDocumentsByCustomQuery} from '../../../core/store/documents/documents.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {PostItLayout} from '../../../shared/utils/layout/post-it-layout';
import {PostItDocumentModel} from './document-data/post-it-document-model';
import {InfiniteScroll} from './util/infinite-scroll';
import {NavigationHelper} from './util/navigation-helper';
import {SelectionHelper} from './util/selection-helper';
import {KeyCode} from '../../../shared/key-code';
import {selectCollectionsByQuery} from '../../../core/store/collections/collections.state';
import {selectCurrentUserForWorkspace} from '../../../core/store/users/users.state';
import {userRolesInResource} from '../../../shared/utils/resource.utils';
import {Role} from '../../../core/model/role';
import {ConfigHelper} from "./util/config-helper";
import Create = DocumentsAction.Create;
import UpdateData = DocumentsAction.UpdateData;
import {AfterViewInit} from "@angular/core/src/metadata/lifecycle_hooks";
import { PostItConfigModel } from '../../../core/store/views/view.model';

@Component({
  selector: 'post-it-perspective',
  templateUrl: './post-it-perspective.component.html',
  styleUrls: ['./post-it-perspective.component.scss']
})
export class PostItPerspectiveComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostListener('document:keydown', ['$event'])
  public onKeyboardClick(event: KeyboardEvent) {
    if (this.isNavigationKey(event.keyCode)) {
      this.handleNavigationKeydown();
    }
  }

  private handleNavigationKeydown() {
    if (this.selectionHelper) {
      this.selectionHelper.initializeIfNeeded();
    }
  }

  private isNavigationKey(keyCode: number): boolean {
    return [KeyCode.UpArrow, KeyCode.DownArrow, KeyCode.LeftArrow, KeyCode.RightArrow, KeyCode.Enter, KeyCode.Tab].includes(keyCode);
  }

  private _useOwnScrollbar = false;

  @Input()
  public get useOwnScrollbar(): boolean {
    return this._useOwnScrollbar;
  }

  public set useOwnScrollbar(value: boolean) {
    this._useOwnScrollbar = value;

    if (this.infiniteScroll) {
      this.infiniteScroll.setUseParentScrollbar(value);
    }
  }

  @ViewChild('layout')
  public layoutElement: ElementRef;

  @ViewChild('layoutGrid')
  public layoutGridElement: ElementRef;

  public infiniteScroll: InfiniteScroll;

  public perspectiveId = String(Math.floor(Math.random() * 1000000000000000) + 1);

  public postIts: PostItDocumentModel[] = [];

  public navigationHelper: NavigationHelper;

  public selectionHelper: SelectionHelper;

  public collectionRoles: { [collectionId: string]: string[] };

  public layoutManager: PostItLayout;

  private configHelper: ConfigHelper;

  private documentsSubscription: Subscription;

  private allLoaded: boolean;

  private collectionsSubscription: Subscription;

  private page: number;

  constructor(private store: Store<AppState>,
              private element: ElementRef,
              private zone: NgZone,
              private changeDetector: ChangeDetectorRef) {
  }

  public ngOnInit(): void {
    this.createConfigHelper();
    this.createInfiniteScroll();
    this.createSelectionHelper();
    this.createNavigationHelper();
    this.createCollectionsSubscription();
  }

  private createInfiniteScroll() {
    this.infiniteScroll = new InfiniteScroll(
      () => this.loadMoreOnInfiniteScroll(),
      this.element.nativeElement,
      this.useOwnScrollbar
    );
    this.infiniteScroll.initialize();
  }

  private createSelectionHelper() {
    this.selectionHelper = new SelectionHelper(
      this.postIts,
      () => this.documentsPerRow(),
      this.perspectiveId
    );
  }

  private createNavigationHelper() {
    this.navigationHelper = new NavigationHelper(this.store, () => this.documentsPerRow());
    this.navigationHelper.onChange(() => this.resetToInitialState());
    this.navigationHelper.onValidNavigation(() => this.getPostIts());
    this.navigationHelper.initialize();
  }

  private createCollectionsSubscription() {
    this.collectionsSubscription = this.store.select(selectCollectionsByQuery).pipe(
      withLatestFrom(this.store.select(selectCurrentUserForWorkspace))
    ).subscribe(([collections, user]) => {
      this.collectionRoles = collections.reduce((roles, collection) => {
        roles[collection.id] = userRolesInResource(user, collection);
        return roles;
      }, {})
    });
  }

  private createConfigHelper() {
    this.configHelper = new ConfigHelper(this.store, (config) => this.updateUsingConfig(config));
    this.configHelper.initialize();
  }

  public ngAfterViewInit() {
    this.createLayout();
    this.changeDetector.detectChanges()
  }

  private createLayout() {
    this.layoutManager = new PostItLayout(this.layoutGridElement.nativeElement, true, this.zone);
  }

  private resetToInitialState() {
    this.allLoaded = false;
    this.page = 0;
    this.unsubscribeIfPossible(this.documentsSubscription);
    this.postIts.splice(0);
  }

  public fetchQueryDocuments(queryModel: QueryModel): void {
    this.store.dispatch(new DocumentsAction.Get({query: queryModel}));
  }

  public hasSingleCollection(): boolean {
    return this.getCollectionIds().length === 1;
  }

  public hasCreateRights(): boolean {
    const keys = this.getCollectionIds();
    return keys.length === 1 && this.collectionRoles[keys[0]].includes(Role.Write);
  }

  private getCollectionIds(): string[] {
    return this.collectionRoles && Object.keys(this.collectionRoles) || []
  }

  public updateUsingConfig(config: PostItConfigModel) {
    // this.get...
    // this.order...
  }

  public updateViewOrder() {
    this.configHelper.changeDocumentOrder(this.postIts);
  }

  private loadMoreOnInfiniteScroll(): void {
    if (!this.allLoaded && this.navigationHelper && this.navigationHelper.validNavigation()) {
      this.getPostIts();
    }
  }

  private getPostIts(): void {
    this.infiniteScroll.startLoading();

    this.fetchQueryDocuments(this.navigationHelper.queryForFetched(this.page));
    this.subscribeOnDocuments(this.navigationHelper.queryForSubscription(this.page));
    this.configHelper.increaseDocumentCount(this.navigationHelper.queryForFetched(this.page).pageSize);
    
    this.page++;
  }

  public createPostIt(document: DocumentModel): void {
    const newPostIt = this.documentModelToPostItModel(document);
    this.postIts.unshift(newPostIt);
  }

  public postItChanged(changedPostIt: PostItDocumentModel): void {
    if (changedPostIt.inInitialState()) {
      return;
    }

    if (!changedPostIt.initialized) {
      this.initializePostIt(changedPostIt);
      return;
    }

    this.updateDocument(changedPostIt);
  }

  private subscribeOnDocuments(queryModel: QueryModel) {
    this.unsubscribeIfPossible(this.documentsSubscription);
    this.documentsSubscription = this.store.select(selectDocumentsByCustomQuery(queryModel)).pipe(
      filter(() => this.canFetchDocuments())
    ).subscribe(documents => {
      this.checkAllLoaded(documents);
      this.infiniteScroll.finishLoading();
      
      const newPostIts = documents.map(document => this.documentModelToPostItModel(document));      
      this.updatePostIts(newPostIts);
    });
  }

  private checkAllLoaded(documents: DocumentModel[]): void {
    this.allLoaded = documents.length < this.documentsPerRow() * 3;
  }

  private updatePostIts(newPostIts: PostItDocumentModel[]) {
    this.postIts.forEach((postIt, idx) => {
      const mapped = newPostIts.find(newPostIt => newPostIt.hash() === postIt.hash());

      if (postIt.document.id && mapped === undefined) {
        this.deletePostIt(postIt);
      } 
      
      else if (mapped) {
        this.postIts[idx] = mapped;
      }
    });

    newPostIts
      .filter(newPostIt => this.postIts.find(postIt => postIt.hash() === newPostIt.hash()) === undefined)
      .forEach(newPostIt => this.postIts.push(newPostIt));
  }

  private canFetchDocuments() {
    return this.navigationHelper.validNavigation();
  }

  private updateDocument(postIt: PostItDocumentModel) {
    this.store.dispatch(new UpdateData(
      {
        collectionId: postIt.document.collectionId,
        documentId: postIt.document.id,
        document: postIt.document
      }
    ));
  }

  private initializePostIt(postItToInitialize: PostItDocumentModel): void {
    if (!postItToInitialize.updating) {
      postItToInitialize.updating = true;
      this.store.dispatch(new Create({document: postItToInitialize.document}));
    }
  }

  public deletePostIt(postIt: PostItDocumentModel): void {
    this.postIts.splice(postIt.index, 1);
  }

  private documentModelToPostItModel(documentModel: DocumentModel): PostItDocumentModel {
    const postIt = new PostItDocumentModel();
    postIt.document = documentModel;
    postIt.initialized = Boolean(documentModel.id);
    return postIt;
  }

  private documentsPerRow(): number {
    const postItWidth = 225;
    const layoutWidth = this.layoutElement.nativeElement.clientWidth;

    return Math.max(1, Math.floor(layoutWidth / postItWidth));
  }

  public getCollectionRoles(postIt: PostItDocumentModel): string[] {
    return this.collectionRoles && this.collectionRoles[postIt.document.collectionId] || [];
  }

  public trackByDocument(index: number, postIt: PostItDocumentModel): number {
    return postIt ? postIt.hash() : Number.MIN_SAFE_INTEGER;
  }

  public ngOnDestroy(): void {
    this.unsubscribeIfPossible(this.navigationHelper);
    this.unsubscribeIfPossible(this.configHelper);
    this.unsubscribeIfPossible(this.infiniteScroll);
    this.unsubscribeIfPossible(this.collectionsSubscription);
    this.unsubscribeIfPossible(this.documentsSubscription);
  }

  private unsubscribeIfPossible(helper: NavigationHelper | ConfigHelper | InfiniteScroll | Subscription) {
    if (helper) {
      helper.unsubscribe();
    }
  }

}
