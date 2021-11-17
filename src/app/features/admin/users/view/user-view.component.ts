import { Component, NgZone, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Actions } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { BsModalRef, BsModalService, ModalDirective } from 'ngx-bootstrap';
import { BehaviorSubject, merge, Observable, Subject } from 'rxjs';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';

import { ExitEditMode } from '@app/core/store/shortcuts';
import { DomicileLocation, GlobalFunctionsService, RestService, User } from '@app/core/services';
import { ProfileState } from '@app/core/store/profile';
import { getConfigTimezonesKeys } from '@app/core/store/config';
import { CapitalizeAllPipe, ReplaceUnderscorePipe, RolePrefixRemoverPipe } from '@app/shared/pipes/utils.pipe';

export class Photo {
  id: number;
}
@Component({
  selector: 'app-admin-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.css']
})
export class UserViewComponent implements OnInit {

  private userId: string;
  user: User;
  userLoaded = false;
  grantedLocationsIds: string[];
  allLocations: DomicileLocation[] = [];

  displayRoles(roles) {
    return (roles || [])
      .map(role => {
        let noPrefix = this.rolePrefixRemover.transform(role);
        let noDash = this.replaceUnderscore.transform(noPrefix);
        return this.capitalizeAll.transform(noDash);
      })
      .join(", ");
  }

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private actions$: Actions,
    private store: Store<ProfileState>,
    private modalService: BsModalService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private rolePrefixRemover: RolePrefixRemoverPipe,
    private capitalizeAll: CapitalizeAllPipe,
    private replaceUnderscore: ReplaceUnderscorePipe) {
    this.userId = this.route.snapshot.params.id;

    window.truckspy = window.truckspy || {};
    window.truckspy.removeGrantedLocation = this.removeGrantedLocation.bind(this);
  }

  ngOnInit() {
    this.user = new User();

    this.store.pipe(select(getConfigTimezonesKeys), take(1)).subscribe(val => this.timezones = val);
    this.restService.getConfigRolesForAdmin()
      .subscribe(data => {
        this.roles = data;
        this.rolesLoaded = true;
      });

    this.getUserForAdmin();
  }

  ngOnDestroy() {
    window.truckspy.removeGrantedLocation = null;
  }

  private getUserForAdmin() {
    this.restService.getUserForAdmin(this.userId).subscribe(data => {
      this.user = data;
      this.userLoaded = true;
      this.grantedLocationsIds = this.user.grantedLocationsIds;
      this.defineOptions();
      this.reloadTableData();
    });
  }

  private removeGrantedLocation(locationEncoded: string, element: any) {
    this.ngZone.run(() => {
      const locationId = this.gfService.decodeParam(locationEncoded).id;
      this.removeGrantedLocationPrivate(locationId, element);
    });
  }
  private removeGrantedLocationPrivate(locationId: string, element: any) {
    var waitElement = document.createElement('span');
    waitElement.innerHTML = 'wait...';
    element.parentNode.replaceChild(waitElement, element);

    this.restService.deleteGrantLocation(this.userId, locationId)
      .subscribe(
        good => {
          this.getUserForAdmin();
        },
        error => {
          waitElement.parentNode.replaceChild(element, waitElement);
        });
  }

  /**
   * Edit functionality
   */
  edit: boolean = false;
  timezones: string[];
  roles: string[];
  rolesLoaded: boolean;
  userData = {};

  beginEdit() {
    this.userData = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      phone: this.user.phone,
      roles: this.user.roles,
      timezone: this.user.timezone
    };
    this.edit = true;
  }
  cancelEdit() {
    this.edit = false;
  }

  /** Shortcuts logic */
  onExitEditMode = this.actions$.subscribe(action => {
    if (action instanceof ExitEditMode) {
      this.cancelEdit();
    }
  });

  save() {
    this.restService.updateUserForAdmin(this.userId, this.userData)
      .subscribe(
        data => {
          this.user = data;
          this.edit = false;
        }
      );
  }

  /**
   * grantedLocationsIds table
   */
  @ViewChild("grantedLocationsTable") grantedLocationsTable: any;
  private tableLength = 10;
  private valueColumns = [
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return `<a href="/#/admin/location/list/${full.id}/view">${full.name}</a>`;
      },
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!this.user.enabled) {
          return "";
        }
        const locationEncoded = this.gfService.encodeParam(full);
        return `<a onclick="truckspy.removeGrantedLocation('${locationEncoded}', this)">remove</a>`;
      }.bind(this),
    }
  ];

  optionsGrantedLocations: any;
  defineOptions() {
    this.optionsGrantedLocations = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      columns: this.valueColumns,
      ajax: (data, callback, settings) => {
        this.restService.getAdmin1000Locations().subscribe(locations => {
          const result = this.restService.doClientSidePagination(
            { page: data.start + 1 },
            this.grantedLocationsIds.map(id => {
              const foundLocation = locations.find(location => location.id === id);
              return {
                id,
                name: foundLocation ? foundLocation.name : null
              }
            }),
            this.tableLength
          );
          callback({
            aaData: result.results,
            recordsTotal: result.resultCount,
            recordsFiltered: result.resultCount,
          });
        });
      }
    }
  };

  reloadTableData() {
    if (this.grantedLocationsTable) {
      this.grantedLocationsTable.ajaxReload();
    }
  }

  /**
   * Change Password modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _changePasswordModal: BsModalRef;
  changePasswordData = {
    newPassword: "",
    confirmNewPassword: ""
  };
  changePassword(template: TemplateRef<any>) {
    this.changePasswordData = {
      newPassword: "",
      confirmNewPassword: ""
    };
    this._changePasswordModal = this.modalService.show(template, { class: "modal-sm" });
  }
  doChangePassword(): void {
    this.restService.resetUserPasswordForAdmin(this.userId, this.changePasswordData.newPassword)
      .subscribe(
        success => {
          this._changePasswordModal.hide();
        }
      );
  }
  closeChangePasswordModal(): void {
    this._changePasswordModal.hide();
  }

  /**
   * Disable User modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("disableUserModal") _disableUserModal: ModalDirective;

  showDisableUserModal() {
    this._disableUserModal.show();
  }
  closeDisableUserModal() {
    this._disableUserModal.hide();
  }
  disableUser() {
    this.restService.deleteUserForAdmin(this.userId)
      .subscribe(
        success => {
          this._disableUserModal.hide();
          this.getUserForAdmin();
        }
      );
  }

  /**
   * Add Granted Location modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("addGrantedLocationModal") _addGrantedLocationModal: ModalDirective;
  selectedLocation: DomicileLocation = null;
  addGrantedLocationError$: BehaviorSubject<string> = new BehaviorSubject('');

  searching: boolean;
  @ViewChild('searchInput') _searchInput: NgbTypeahead;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  showAddGrantedLocationModal(template: TemplateRef<any>) {
    this._addGrantedLocationModal.show();
  }
  closeAddGrantedLocationModal() {
    this._addGrantedLocationModal.hide();
  }
  addGrantedLocation() {
    if (this.selectedLocation) {
      this.restService.addGrantLocation(this.userId, this.selectedLocation.id)
        .subscribe(
          success => {
            this._addGrantedLocationModal.hide();
            this.selectedLocation = null;
            this._searchInput.writeValue("");

            this.getUserForAdmin();
          }
        );
    } else {
      this.addGrantedLocationError$.next('Please select the location');
    }
  }

  clickSelected(event) {
    event.preventDefault();
    this.selectedLocation = event.item;
    this._searchInput.writeValue(this.selectedLocation.name);
  }

  searchPlaces = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(300), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this._searchInput.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      tap(() => this.searching = true),
      switchMap(term => {
        if (this.selectedLocation && term !== this.selectedLocation.name) {
          this.selectedLocation = null;
        }
        this.addGrantedLocationError$.next('');
        return this.restService.searchLocationsForAdmin(term).pipe()
      }),
      tap(() => this.searching = false)
    );
  }

}