import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ModalDirective, BsModalRef, BsModalService } from 'ngx-bootstrap';
import { Observable } from 'rxjs';

import { RestService, Device, ReportingProfile, Vehicle, DeviceAction } from '@app/core/services'
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { LongActionLinkComponent } from '@app/features/shared/long-action-link.component';

@Component({
  selector: 'app-device-view',
  templateUrl: './device-view.component.html',
  styleUrls: ['./device-view.component.css']
})
export class DeviceViewComponent implements OnInit {

  deviceId: string;
  device: Device = new Device();

  /**
   * Reassign Device modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _reassignModal: BsModalRef;
  reassignData = {
    reportingProfileId: null,
    asOf: new Date()
  };
  reportingProfiles: ReportingProfile[];
  vehicles: Vehicle[];
  vehiclesLoaded: boolean = false;
  deviceActions: DeviceAction[] = Object.values(DeviceAction);
  deviceAction = DeviceAction;

  reassign(template: TemplateRef<any>) {
    this.reassignData = {
      reportingProfileId: (this.reportingProfiles && this.reportingProfiles.length >= 1 && this.reportingProfiles[0].id) || "",
      asOf: new Date()
    };
    this._reassignModal = this.modalService.show(template, { class: "" });
  }

  doReassign(): void {
    let data = {
      reportingProfileId: this.reassignData.reportingProfileId,
      asOf: this.dateService.transform4Backend(this.reassignData.asOf)
    }
    this.restService.assignDeviceToReportingProfile(this.deviceId, data)
      .subscribe(
        data => {
          this._reassignModal.hide();
          this.device = data;
        }
      );
  }
  closeReassignModal(): void {
    this._reassignModal.hide();
  }

  /**
   * Deactivate Device modal reference to operate with within component.
   * @type {BsModalRef}
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
    this.restService.deactivateDevice(this.deviceId)
      .subscribe(
        success => {
          this.restService.getDevice(this.deviceId)
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

  /**
   * Constructor to instantiate an instance of ReportingViewComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private modalService: BsModalService,
    private dateService: DateService) { }

  ngOnInit() {
    this.deviceId = this.route.snapshot.paramMap.get("id");
    this.defineActionsMap();

    this.restService.getDevice(this.deviceId)
      .subscribe(result => {
        this.device = result;
      });
    this.restService.get1000ReportingProfileLights()
      .subscribe(result => {
        this.reportingProfiles = result;
      });
    this.restService.get1000VehiclesLight()
      .subscribe(result => {
        this.vehicles = result;
        this.vehiclesLoaded = true;
      });
  }

  /**
   * Remove forceToVehicle logic.
   */
  removeForceToVehicle(vehicle: Vehicle, actionComponent: LongActionLinkComponent) {
    this.restService.forceDeviceToVehicle(this.deviceId, null)
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
    this.restService.forceDeviceToVehicle(this.deviceId, this.editForceData.vehicleId)
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
