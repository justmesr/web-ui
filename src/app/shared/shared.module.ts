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

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {PermissionsComponent} from './permissions/permissions.component';
import {PermissionsTableComponent} from './permissions/table/permissions-table.component';
import {SearchBoxComponent} from './search-box/search-box.component';
import {PostItCollectionsComponent} from './post-it-collections/post-it-collections.component';
import {PickerModule} from './picker/picker.module';
import {RouterModule} from '@angular/router';
import {HighlightPipe} from './highlight.pipe';
import {DragAndDropModule} from './drag-and-drop/drag-and-drop.module';
import {SizeSliderComponent} from './slider/size-slider.component';
import {CommentsComponent} from './comments/comments.component';
import {LinksComponent} from './links/links.component';
import {PerspectiveDirective} from './perspective.directive';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PickerModule,
    DragAndDropModule
  ],
  declarations: [
    HighlightPipe,
    PermissionsComponent,
    PermissionsTableComponent,
    PostItCollectionsComponent,
    SearchBoxComponent,
    SizeSliderComponent,
    CommentsComponent,
    LinksComponent,
    PerspectiveDirective
  ],
  exports: [
    CommonModule,
    DragAndDropModule,
    FormsModule,
    HighlightPipe,
    PermissionsComponent,
    PostItCollectionsComponent,
    SearchBoxComponent,
    SizeSliderComponent,
    CommentsComponent,
    LinksComponent,
    PerspectiveDirective
  ]
})
export class SharedModule {

}
