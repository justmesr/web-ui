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

import {Component, ComponentFactoryResolver, ComponentRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import {skipWhile} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {getOtherLinkedDocumentId, LinkInstanceModel} from '../../../../core/store/link-instances/link-instance.model';
import {selectLinkInstancesByType} from '../../../../core/store/link-instances/link-instances.state';
import {LinkTypeHelper} from '../../../../core/store/link-types/link-type.helper';
import {LinkTypeModel} from '../../../../core/store/link-types/link-type.model';
import {LinkTypesAction} from '../../../../core/store/link-types/link-types.action';
import {selectLinkTypeById} from '../../../../core/store/link-types/link-types.state';
import {QueryModel} from '../../../../core/store/navigation/query.model';
import {isValidEmbeddedPart, SmartDocTemplatePartModel} from '../../../../core/store/smartdoc-templates/smartdoc-template.model';
import {TemplateConfigModel} from '../../../../core/store/views/view.model';
import {PerspectiveDirective} from '../../../../shared/perspective.directive';
import {Perspective} from '../../perspective';
import {PerspectiveComponent} from '../../perspective.component';
import {TablePerspectiveComponent} from '../../table/table-perspective.component';
import {SmartDocPerspectiveComponent} from '../smartdoc-perspective.component';

const perspectiveComponents: { [perspective: string]: Type<any> } = {
  [Perspective.Table]: TablePerspectiveComponent,
  [Perspective.SmartDoc]: SmartDocPerspectiveComponent
};

@Component({
  selector: 'smartdoc-embedded',
  templateUrl: './smartdoc-embedded.component.html',
  styleUrls: ['./smartdoc-embedded.component.scss']
})
export class SmartDocEmbeddedComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  public selected: boolean;

  @Input()
  public document: DocumentModel;

  @Input()
  public templatePart: SmartDocTemplatePartModel;

  @Output()
  public templatePartChange = new EventEmitter<SmartDocTemplatePartModel>();

  @Output()
  public copyPart = new EventEmitter();

  @Output()
  public updatePart = new EventEmitter<SmartDocTemplatePartModel>();

  @Output()
  public removePart = new EventEmitter();

  @ViewChild(PerspectiveDirective)
  public perspectiveDirective: PerspectiveDirective;

  private perspectiveComponent: PerspectiveComponent;

  private linkSubscription: Subscription;

  constructor(private componentFactoryResolver: ComponentFactoryResolver,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.store.dispatch(new LinkTypesAction.Get({query: {linkTypeIds: [this.templatePart.linkTypeId]}, loadInstances: true}));

    this.linkSubscription = Observable.combineLatest(
      this.store.select(selectLinkTypeById(this.templatePart.linkTypeId)),
      this.store.select(selectLinkInstancesByType(this.templatePart.linkTypeId))
    ).pipe(
      skipWhile(([linkType]) => !linkType)
    ).subscribe(([linkType, linkInstances]) => this.loadPerspective(linkType, linkInstances));
  }

  public ngOnChanges(changes: SimpleChanges) {
    // TODO reload on relevant changes
  }

  public ngOnDestroy() {
    if (this.linkSubscription) {
      this.linkSubscription.unsubscribe();
    }
  }

  // private isInputInitialized() {
  //   return this.document && this.linkType && this.templatePart;
  // }

  private loadPerspective(linkType: LinkTypeModel, linkInstances: LinkInstanceModel[]) {
    if (!isValidEmbeddedPart(this.templatePart)) {
      console.error('Invalid embedded part', this.templatePart);
      return;
    }

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(perspectiveComponents[this.templatePart.perspective]);

    const viewContainerRef = this.perspectiveDirective.viewContainerRef;
    viewContainerRef.clear();

    const componentRef: ComponentRef<PerspectiveComponent> = viewContainerRef.createComponent(componentFactory);
    this.perspectiveComponent = componentRef.instance;

    this.perspectiveComponent.embedded = true;
    this.perspectiveComponent.linkedDocument = this.document;

    const collectionCode = LinkTypeHelper.getOtherCollectionCode(linkType, this.document.collectionCode);
    const query: QueryModel = {
      documentIds: this.getLinkedDocumentIds(linkInstances),
      collectionCodes: [collectionCode],
      linkTypeIds: [linkType.id]
    };
    this.perspectiveComponent.query = query;

    const templateConfig: TemplateConfigModel = {
      templateId: this.templatePart.templateId
    };
    this.perspectiveComponent.config = {template: templateConfig};
  }

  private createDocumentIdsFilters(documentIds: string[]): string[] {
    return documentIds.map(id => [this.document.collectionCode, 'id', '=' + id].join(':'));
  }

  private getLinkedDocumentIds(linkInstances: LinkInstanceModel[]): string[] {
    return linkInstances.filter(linkInstance => linkInstance.documentIds.includes(this.document.id))
      .map(linkInstance => getOtherLinkedDocumentId(linkInstance, this.document.id));
  }

  public isTablePerspective() {
    return this.templatePart.perspective === Perspective.Table;
  }

  public isTemplatePerspective() {
    return this.templatePart.perspective === Perspective.SmartDoc;
  }

  public onSwitchPerspective(perspective: Perspective) {
    const part: SmartDocTemplatePartModel = {...this.templatePart, perspective};
    this.updatePart.emit(part);
  }

  public allowedPerspectives(): Perspective[] {
    return [Perspective.Table, Perspective.SmartDoc];
  }

  public onCopyPart() {
    this.copyPart.emit();
  }

  public onRemovePart() {
    this.removePart.emit();
  }

}
