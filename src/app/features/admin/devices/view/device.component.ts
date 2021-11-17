import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BsModalRef, BsModalService, ModalDirective } from 'ngx-bootstrap';
import { Observable } from 'rxjs';

import { Device, DeviceAction, RestService, Vehicle } from '@app/core/services';
import { LongActionLinkComponent } from '@app/features/shared/long-action-link.component';

@Component({
  selector: 'app-admin-device-view',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.css']
})
export class AdminDeviceComponent implements OnInit {

  deviceId: string;
  device: Device;

  vehicles: Vehicle[];
  vehiclesLoaded: boolean = false;

  deviceActions: DeviceAction[] = Object.values(DeviceAction);
  deviceAction = DeviceAction;

  /**
   * Deactivate Device modal reference to operate with within component.
   * @type {BsModalRef}
   * 
   * TODO: As soon as this functionality will be finalized, probably need to encapsulate this logic,
   * which is almost similar fully too the one in ./src/app/features/devices/view/device-view.component.ts
   */
  _deactivateModal: BsModalRef;
  deactivateData = {
    deviceIdConfirmation: null
  };
  actionConfirmed: boolean = false;
  deactivate(template: TemplateRef<any>) {
    this.deactivateData = {
      deviceIdConfirmation: ""
    };
    this._deactivateModal = this.modalService.show(template, { class: "modal-450" });
  }

  confirmationListener(newValue) {
    this.actionConfirmed = newValue === this.device.iccid;
  }

  doDeactivate(): void {
    if (this.deactivateData.deviceIdConfirmation != this.device.iccid) { // equal to `this.actionConfirmed` technically
      return;
    }
    this.restService.deactivateAdminDevice(this.deviceId)
      .subscribe(
        success => {
          this.restService.getAdminDevice(this.deviceId)
            .subscribe(result => {
              this._deactivateModal.hide();
              this.device = result;
            });
        }
      );
  }
  closeDeactivateModal(): void {
    this._deactivateModal.hide();
  }

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private modalService: BsModalService) {
    this.device = new Device();
  }

  ngOnInit() {
    this.deviceId = this.route.snapshot.paramMap.get("id");
    this.defineActionsMap();

    this.restService.getAdminDevice(this.deviceId)
      .subscribe(result => {
        this.device = result;

        let companyId = this.device.company && this.device.company.id;
        this.restService.get1000AdminVehiclesForCompany(companyId)
          .subscribe(result => {
            this.vehicles = result;
            this.vehiclesLoaded = true;
          });
      });
  }

  /**
   * Remove forceToVehicle logic.
   */
  removeForceToVehicle(vehicle: Vehicle, actionComponent: LongActionLinkComponent) {
    this.restService.forceDeviceToVehicleAdmin(this.deviceId, null)
      .subscribe(
        good => {
          this.device = good;
          actionComponent.actionFinished();
        },
        error => {
          actionComponent.actionFailed();
        }
      );
  }

  /**
   * Edit Force To Vehicle modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _editForceModal: BsModalRef;
  editForceData = {
    vehicleId: null
  };

  editForce(template: TemplateRef<any>) {
    this.editForceData = {
      vehicleId: (this.vehicles && this.vehicles.length >= 1 && this.vehicles[0].id) || ""
    };
    this._editForceModal = this.modalService.show(template, { class: "modal-400" });
  }

  /**
   * Workaround for the SmartAdmin select2 wrappers.
   */
  vehicleChanged(value) {
    this.editForceData.vehicleId = value;
  }

  doEditForce(): void {
    this.restService.forceDeviceToVehicleAdmin(this.deviceId, this.editForceData.vehicleId)
      .subscribe(
        data => {
          this._editForceModal.hide();
          this.device = data;
        }
      );
  }
  closeEditForceModal(): void {
    this._editForceModal.hide();
  }

  /**
   * Confirm Action modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("confirmActionModal") _confirmActionModal: ModalDirective;
  selectedAction: DeviceAction;

  initConfirmActionModal(action: DeviceAction) {
    this.selectedAction = action;
    this._confirmActionModal.show();
  }
  closeConfirmActionModal() {
    this._confirmActionModal.hide();
  }

  actionsMap: Map<DeviceAction, Observable<boolean>>;
  defineActionsMap() {
    this.actionsMap = new Map();
    // this.actionsMap.set(DeviceAction.WIPE_DEVICE, this.restService.wipeDevice(this.deviceId));
    this.actionsMap.set(DeviceAction.ENABLE_LOST_MODE, this.restService.enableLostMode(this.deviceId));
    this.actionsMap.set(DeviceAction.DISABLE_LOST_MODE, this.restService.disableLostMode(this.deviceId));
    this.actionsMap.set(DeviceAction.POWER_OFF, this.restService.powerOff(this.deviceId));
    this.actionsMap.set(DeviceAction.RESTART, this.restService.restart(this.deviceId));
  }

  confirmAction() {
    let theAction: Observable<boolean> = this.actionsMap.get(this.selectedAction);
    theAction.subscribe(
      success => this.closeConfirmActionModal(),
      error => this.closeConfirmActionModal()
    );
  }

}
