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

import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../core/store/app.state';
import {PostItConfigModel} from '../../../../core/store/views/view.model';
import {selectViewPostItConfig} from '../../../../core/store/views/views.state';

export class ConfigHelper {

  private postItConfig: PostItConfigModel;

  private subscription: Subscription;

  constructor(private store: Store<AppState>) {
  }

  public initialize(): void {
    this.subscription = this.store.select(selectViewPostItConfig).subscribe((postItConfig: PostItConfigModel) => {
      this.postItConfig = postItConfig;
    });
  }

  public unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}