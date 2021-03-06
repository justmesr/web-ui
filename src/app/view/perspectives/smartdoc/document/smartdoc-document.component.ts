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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {AppState} from '../../../../core/store/app.state';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {SmartDocTemplateModel, SmartDocTemplatePartModel} from '../../../../core/store/smartdoc-templates/smartdoc-template.model';
import {SmartDocTemplatesAction} from '../../../../core/store/smartdoc-templates/smartdoc-templates.action';
import {selectSelectedSmartDocTemplatePart} from '../../../../core/store/smartdoc-templates/smartdoc-templates.state';

@Component({
  selector: 'smartdoc-document',
  templateUrl: './smartdoc-document.component.html',
  styleUrls: ['./smartdoc-document.component.scss']
})
export class TemplateDocumentComponent {

  @Input()
  public selected: boolean;

  @Input()
  public collections: CollectionModel[];

  @Input()
  public document: DocumentModel;

  @Input()
  public template: SmartDocTemplateModel;

  @Output()
  public templateChange = new EventEmitter<SmartDocTemplateModel>();

  public selectedPartIndex: number;
  private selectedPartSubscription: Subscription;

  public constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.selectedPartSubscription = this.store.select(selectSelectedSmartDocTemplatePart).subscribe((selected) => {
      this.selectedPartIndex = selected && selected.templateId === this.template.id && selected.documentId === this.document.id ? selected.partIndex : null;
    });
  }

  public onUpdatePart(partIndex: number, part: SmartDocTemplatePartModel) {
    this.store.dispatch(new SmartDocTemplatesAction.UpdatePart({templateId: this.template.id, partIndex: partIndex, part: part}));
  }

  public onRemovePart(partIndex: number) {
    this.store.dispatch(new SmartDocTemplatesAction.RemovePart({templateId: this.template.id, partIndex: partIndex}));
  }

  public getCurrentCollection(): CollectionModel {
    return this.collections.find(collection => collection.code === this.document.collectionCode);
  }

  public onClickInsidePart(event: MouseEvent, partIndex: number) {
    if (event['templateSelected']) {
      return;
    }
    event['templateSelected'] = true;

    if (this.selectedPartIndex !== partIndex) {
      this.store.dispatch(new SmartDocTemplatesAction.Select({templateId: this.template.id, documentId: this.document.id, partIndex}));
    }
  }

  public onClickOutsidePart(partIndex: number) {
    if (this.selectedPartIndex === partIndex) {
      this.store.dispatch(new SmartDocTemplatesAction.Deselect());
    }
  }

  public onCopyPart(partIndex: number) {
    const part = this.template.parts[partIndex];
    this.store.dispatch(new SmartDocTemplatesAction.AddPart({templateId: this.template.id, partIndex: partIndex + 1, part}));
  }

}
